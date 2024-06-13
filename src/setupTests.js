beforeAll(() => {
  jest.mock('./metrics', () => {
    return {
      metricsReporter: (req, res) => {
        res.send('mocked');
      },
      requestTracker: (req, res, next) => {
        next();
      },
      loginEvent: () => {},
      orderEvent: () => {},
    };
  });

  jest.mock('./logger', () => {
    return {
      httpLogger: (req, res, next) => {
        next();
      },
      log: () => {},
    };
  });
});
