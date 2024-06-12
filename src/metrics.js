const config = require('./config.js');
const os = require('os');

class Metrics {
  constructor() {
    this.requestLatency = 0;
    this.requests = {};
    this.purchase = { count: 0, revenue: 0, error: 0, latency: 0 };
    this.authEvents = { success: 0, failure: 0 };
    this.activeUsers = new Map();

    const timer = setInterval(() => {
      const httpMetrics = () => {
        this.sendMetricToGrafana('pizza_http_latency', 'val', this.requestLatency);
        const totalRequests = Object.values(this.requests).reduce((acc, curr) => acc + curr, 0);
        this.sendMetricToGrafana('pizza_http_request_all', 'val', totalRequests);
        Object.keys(this.requests).forEach((httpMethod) => {
          this.sendMetricToGrafana(`pizza_http_request_${httpMethod}`, 'val', this.requests[httpMethod]);
        });

        this.requests = {};
        this.requestLatency = 0;
      };

      const systemMetrics = () => {
        this.sendMetricToGrafana('pizza_system_cpu', 'percent', this.getCpuUsagePercentage());
        this.sendMetricToGrafana('pizza_system_memory', 'used', this.getMemoryUsagePercentage());
      };

      const userMetrics = () => {
        this.activeUsers.forEach((value, key) => {
          const expiresThreshold = Date.now() - 5 * 60 * 1000;
          if (value.last < expiresThreshold) {
            this.activeUsers.delete(key);
          }
        });
        this.sendMetricToGrafana('pizza_user_count', 'total', this.activeUsers.size);
      };

      const purchaseMetrics = () => {
        this.sendMetricToGrafana('pizza_purchase_count', 'total', this.purchase.count);
        this.sendMetricToGrafana('pizza_purchase_revenue', 'total', this.purchase.revenue);
        this.sendMetricToGrafana('pizza_purchase_latency', 'total', this.purchase.latency);
        this.sendMetricToGrafana('pizza_purchase_error', 'total', this.purchase.error);
      };

      const authMetrics = () => {
        this.sendMetricToGrafana('pizza_auth_success', 'total', this.authEvents.success);
        this.sendMetricToGrafana('pizza_auth_failure', 'total', this.authEvents.failure);
      };

      httpMetrics();
      systemMetrics();
      userMetrics();
      purchaseMetrics();
      authMetrics();
    }, 10000);

    timer.unref();
  }

  requestTracker = (req, res, next) => {
    const httpMethod = req.method.toLowerCase();
    this.requests[httpMethod] = (this.requests[httpMethod] || 0) + 1;

    const dateNow = Date.now();
    if (req.user) {
      if (this.activeUsers.has(req.user.id)) {
        this.activeUsers.get(req.user.id).last = dateNow;
      }
    }

    let send = res.send;
    res.send = (resBody) => {
      this.requestLatency += Date.now() - dateNow;
      res.send = send;
      return res.send(resBody);
    };

    next();
  };

  loginEvent = (userId, success) => {
    this.authEvents[success ? 'success' : 'failure'] += 1;
    if (success) {
      this.activeUsers.set(userId, { login: Date.now(), last: Date.now() });
    }
  };

  orderEvent = (orderEvent) => {
    this.purchase.count += orderEvent.count;
    this.purchase.revenue += orderEvent.revenue;
    const latency = orderEvent.end - orderEvent.start;
    this.purchase.latency += latency;
    this.purchase.error += orderEvent.error ? 1 : 0;
  };

  readAuthToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      return authHeader.split(' ')[1];
    }
    return null;
  }

  sendMetricToGrafana(metricPrefix, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.metrics.source} ${metricName}=${metricValue}`;
    console.log(metric);

    fetch(`${config.metrics.url}`, {
      method: 'post',
      body: metric,
      headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}` },
    }).catch((error) => {
      console.error('Error pushing metrics:', error);
    });
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return cpuUsage.toFixed(2) * 100;
  }

  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
  }
}

module.exports = new Metrics();
