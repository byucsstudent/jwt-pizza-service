const config = require('./config.js');
const os = require('os');

class Metrics {
  constructor() {
    this.requests = {};
    this.purchase = { count: 0, revenue: 0 };
    this.authEvents = { success: 0, failure: 0 };
    this.activeUsers = new Map();

    const timer = setInterval(() => {
      const httpMetrics = () => {
        const totalRequests = Object.values(this.requests).reduce((acc, curr) => acc + curr, 0);
        this.sendMetricToGrafana('request', 'total', 'all', totalRequests);
        Object.keys(this.requests).forEach((httpMethod) => {
          this.sendMetricToGrafana('request', 'total', httpMethod, this.requests[httpMethod]);
        });
      };

      const systemMetrics = () => {
        this.sendMetricToGrafana('system', 'cpu', 'used', this.getCpuUsagePercentage());
        this.sendMetricToGrafana('system', 'memory', 'used', this.getMemoryUsagePercentage());
      };

      const userMetrics = () => {
        this.activeUsers.forEach((value, key) => {
          const expiresThreshold = Date.now() - 5 * 60 * 1000;
          if (value.last < expiresThreshold) {
            this.activeUsers.delete(key);
          }
        });
        this.sendMetricToGrafana('user', 'count', 'total', this.activeUsers.size);
      };

      const purchaseMetrics = () => {
        this.sendMetricToGrafana('purchase', 'bucket', 'count', this.purchase.count);
        this.sendMetricToGrafana('purchase', 'bucket', 'revenue', this.purchase.revenue);
      };

      const authMetrics = () => {
        this.sendMetricToGrafana('auth', 'bucket', 'success', this.authEvents.success);
        this.sendMetricToGrafana('auth', 'bucket', 'failure', this.authEvents.failure);
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

    if (req.user) {
      if (this.activeUsers.has(req.user.id)) {
        this.activeUsers.get(req.user.id).last = Date.now();
      }
    }

    next();
  };

  loginEvent = (userId, success) => {
    this.authEvents[success ? 'success' : 'failure'] += 1;
    if (success) {
      this.activeUsers.set(userId, { login: Date.now(), last: Date.now() });
    }
  };

  orderEvent = (order) => {
    this.purchase.count += order.items.length;
    this.purchase.revenue += order.items.reduce((acc, curr) => acc + curr.price, 0);
  };

  readAuthToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      return authHeader.split(' ')[1];
    }
    return null;
  }

  sendMetricToGrafana(metricPrefix, metricName, category, metricValue) {
    const metric = `${metricPrefix},source=${config.metrics.source},category=${category} ${metricName}=${metricValue}`;

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
