const config = require('./config').metrics;
const os = require('os');

function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

const requests = {};
let http400plus = 0;
let http200 = 0;

const track = (req, res, next) => {
  recordRequest(req.method, req.path, res);
  next();
};

function recordRequest(method, path, res) {
  const endpoint = `[${method}] ${path}`;
  const info = requests[endpoint] || { count: 0, latency: 0, method, path };
  info.count++;
  requests[endpoint] = info;

  const start = Date.now();
  res.on('finish', () => {
    http400plus += res.statusCode >= 400 ? 1 : 0;
    http200 += res.statusCode < 400 ? 1 : 0;

    info.latency += Date.now() - start;
  });
}

const pizzaMetrics = {
  purchases: 0,
  failures: 0,
  revenue: 0.0,
};

function trackPizzaPurchase(purchases, failures, revenue) {
  pizzaMetrics.purchases += purchases;
  pizzaMetrics.failures += failures;
  pizzaMetrics.revenue += revenue;
}

// This will periodically send metrics to Grafana
setInterval(() => {
  const metrics = [];
  Object.keys(requests).forEach((endpoint) => {
    const info = requests[endpoint];
    metrics.push(createMetric('requests', info.count, '1', 'sum', 'asInt', { endpoint: info.path, method: info.method }));
    metrics.push(createMetric('request_latency', info.latency, '1', 'sum', 'asInt', { endpoint: info.path, method: info.method }));
  });

  metrics.push(createMetric('http400plus', http400plus, '1', 'sum', 'asInt', {}));
  metrics.push(createMetric('http200', http200, '1', 'sum', 'asInt', {}));
  metrics.push(createMetric('pizza_purchase', pizzaMetrics.purchases, '1', 'sum', 'asInt', {}));
  metrics.push(createMetric('pizza_failures', pizzaMetrics.failures, '1', 'sum', 'asInt', {}));
  metrics.push(createMetric('pizza_revenue', pizzaMetrics.revenue, '1', 'sum', 'asDouble', {}));
  metrics.push(createMetric('cpu_usage', getCpuUsagePercentage(), '%', 'gauge', 'asDouble', {}));
  metrics.push(createMetric('memory_usage', getMemoryUsagePercentage(), '%', 'gauge', 'asDouble', {}));

  sendMetricToGrafana(metrics);
}, 10000);

function createMetric(metricName, metricValue, metricUnit, metricType, valueType, attributes) {
  attributes = { ...attributes, source: config.source };

  const metric = {
    name: metricName,
    unit: metricUnit,
    [metricType]: {
      dataPoints: [
        {
          [valueType]: metricValue,
          timeUnixNano: Date.now() * 1000000,
          attributes: [],
        },
      ],
    },
  };

  Object.keys(attributes).forEach((key) => {
    metric[metricType].dataPoints[0].attributes.push({
      key: key,
      value: { stringValue: attributes[key] },
    });
  });

  if (metricType === 'sum') {
    metric[metricType].aggregationTemporality = 'AGGREGATION_TEMPORALITY_CUMULATIVE';
    metric[metricType].isMonotonic = true;
  }

  return metric;
}

function sendMetricToGrafana(metrics) {
  const body = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics,
          },
        ],
      },
    ],
  };

  fetch(`${config.url}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
  })
    .then((response) => {
      if (!response.ok) {
        response.text().then((data) => {
          console.error('Failed to push metrics ' + data);
        });
      }
    })
    .catch((error) => {
      console.error('Error pushing metrics:', error);
    });
}

module.exports = { track, trackPizzaPurchase, recordRequest };
