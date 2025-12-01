const appConfig = require('./config');
const versionInfo = require('./version');

const config = appConfig.metrics;
const version =
  versionInfo.version ||
  new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 13);

// Metrics stored in memory
const requests = {};
const generalMetrics = {};

// Middleware to track requests
function requestTracker(req, res, next) {
  const endpoint = `[${req.method}] ${req.path}`;
  requests[endpoint] = (requests[endpoint] || 0) + 1;

  let status = res.status;
  res.status = (resStatusCode) => {
    if (resStatusCode >= 400) {
      addMetric('errors', 1, { path: req.originalUrl, method: req.method, statusCode: resStatusCode.toString() });
    }
    res.status = status;
    return res.status(resStatusCode);
  };

  next();
}

function addMetric(name, value, attributes = {}) {
  const index = `${name}-${JSON.stringify(attributes)})`;
  if (!generalMetrics[index]) {
    generalMetrics[index] = { name, value: 0, attributes };
  }
  generalMetrics[index].value += value;
}

// This will periodically send metrics to Grafana
const timer = setInterval(() => {
  const metrics = [];
  Object.keys(requests).forEach((endpoint) => {
    metrics.push(createMetric('requests', requests[endpoint], '1', 'sum', 'asInt', { endpoint }));
  });

  Object.keys(generalMetrics).forEach((index) => {
    const metricData = generalMetrics[index];
    metrics.push(createMetric(metricData.name, metricData.value, '1', 'sum', 'asInt', metricData.attributes));
  });

  if (metrics.length > 0) {
    sendMetricToGrafana(metrics);
  }
}, 10000);

timer.unref();

function createMetric(metricName, metricValue, metricUnit, metricType, valueType, attributes) {
  attributes = { ...attributes, source: config.source, version };

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

  const bodyString = JSON.stringify(body);
  fetch(`${config.url}`, {
    method: 'POST',
    body: bodyString,
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP status: ${response.status}`);
      }
    })
    .catch((error) => {
      console.error('Error pushing metrics:', error);
    });
}

module.exports = { requestTracker, addMetric };
