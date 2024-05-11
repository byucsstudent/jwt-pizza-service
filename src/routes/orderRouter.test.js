const request = require('supertest');
const app = require('../service');

test('getMenu', async () => {
  await request(app).post('/api/order/menu');
  await request(app).get('/api/order/menu').expect(200).expect('Content-Type', 'application/json; charset=utf-8').expect(/[.*]/);
});
