const request = require('supertest');
const app = require('./server');

test('getMenu', (done) => {
  request(app)
    .get('/api/order/menu')
    .expect(200)
    .expect({ name: 'provo' })
    .end((err) => (err ? done(err) : done()));
});
