const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserCookie;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserCookie = registerRes.headers['set-cookie'];
});

test('get menu', async () => {
  const getMenuRes = await request(app).get('/api/order/menu');
  expect(getMenuRes.status).toBe(200);
  expect(getMenuRes.headers['content-type']).toMatch('application/json; charset=utf-8');

  expect(getMenuRes.body.length).toBe(6);
});

test('get orders', async () => {
  const getOrdersRes = await request(app).get('/api/order/').set('Cookie', testUserCookie);
  expect(getOrdersRes.status).toBe(200);
});

test('create order', async () => {
  const order = { franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }] };
  const createOrdersRes = await request(app).post('/api/order/').set('Cookie', testUserCookie).send(order);

  expect(createOrdersRes.status).toBe(200);
  expect(createOrdersRes.body.order).toMatchObject(order);
  expect(createOrdersRes.body.jwt).toBeDefined();
});
