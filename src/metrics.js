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
const errors = 0;

const track = (req, res, next) => {
  const endpoint = `[${req.method}] ${req.path}`;
  const info = requests[endpoint] || { count: 0, latency: 0, method: req.method, path: req.path };
  info.count++;
  requests[endpoint] = info;

  errors += res.statusCode >= 400 ? 1 : 0;

  const start = Date.now();
  res.on('finish', () => {
    info.latency += Date.now() - start;
  });

  next();
};

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
  Object.keys(requests).forEach((endpoint) => {
    const info = requests[endpoint];
    sendMetricToGrafana('errors', errors.count, '1', 'sum', 'asInt', {});
    sendMetricToGrafana('requests', info.count, '1', 'sum', 'asInt', { endpoint: info.path, method: info.method });
    sendMetricToGrafana('request_latency', info.latency, '1', 'sum', 'asInt', { endpoint: info.path, method: info.method });
    sendMetricToGrafana('pizza_purchase', pizzaMetrics.purchases, '1', 'sum', 'asInt', {});
    sendMetricToGrafana('pizza_failures', pizzaMetrics.failures, '1', 'sum', 'asInt', {});
    sendMetricToGrafana('pizza_revenue', pizzaMetrics.revenue, '1', 'sum', 'asDouble', {});
    sendMetricToGrafana('cpu_usage', getCpuUsagePercentage(), '%', 'gauge', 'asDouble', {});
    sendMetricToGrafana('memory_usage', getMemoryUsagePercentage(), '%', 'gauge', 'asDouble', {});
  });
}, 10000);

function sendMetricToGrafana(metricName, metricValue, metricUnit, metricType, valueType, attributes) {
  attributes = { ...attributes, source: config.source };

  const metric = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics: [
              {
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
              },
            ],
          },
        ],
      },
    ],
  };

  Object.keys(attributes).forEach((key) => {
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0][metricType].dataPoints[0].attributes.push({
      key: key,
      value: { stringValue: attributes[key] },
    });
  });

  if (metricType === 'sum') {
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0][metricType].aggregationTemporality = 'AGGREGATION_TEMPORALITY_CUMULATIVE';
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0][metricType].isMonotonic = true;
  }

  fetch(`${config.url}`, {
    method: 'POST',
    body: JSON.stringify(metric),
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
  })
    .then((response) => {
      if (!response.ok) {
        response.text().then((data) => {
          console.error('Failed to push metrics data to Grafana ' + data);
        });
      } else {
        console.log(`Pushed ${metricName}`);
      }
    })
    .catch((error) => {
      console.error('Error pushing metrics:', error);
    });
}

module.exports = { track, trackPizzaPurchase };
