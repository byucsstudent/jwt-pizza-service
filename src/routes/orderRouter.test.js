const request = require('supertest');
const app = require('../service');
const testUtil = require('./testUtil');
const { json } = require('express');

let dinerUser;
let dinerToken;

beforeAll(async () => {
  [dinerUser, dinerToken] = await testUtil.registerUser(request(app));
});

test('menu get', async () => {
  const menuRes = await request(app).get('/api/order/menu');
  expect(menuRes.status).toBe(200);
  expect(Array.isArray(menuRes.body)).toBe(true);
});

test('menu item add', async () => {
  const adminToken = await testUtil.getAdminUserToken(request(app));
  const menuRes = await request(app)
    .put('/api/order/menu')
    .set('Authorization', 'Bearer ' + adminToken)
    .send({ title: testUtil.randomName(), description: 'Test pizza', image: 'pizza9.png', price: 0.0001 });
  expect(menuRes.status).toBe(200);
});

test('menu item add not admin', async () => {
  const menuRes = await request(app)
    .put('/api/order/menu')
    .set('Authorization', 'Bearer ' + dinerToken);
  expect(menuRes.status).toBe(403);
});

test('menu order get', async () => {
  [user, token] = await testUtil.registerUser(request(app));
  const orders = await getOrders(token);
  expect(orders).toEqual([]);

  const [order, res] = await createOrder(token, { franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }] });
  expect(res.status).toBe(200);
  expect(order).toMatchObject({ franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }], id: expect.any(Number) });
});

test('menu order factory fail', async () => {
  global.fetch = () => Promise.resolve({ status: 500, json: () => Promise.resolve({}) });
  const [order, res] = await createOrder(dinerToken, { franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }] });
  expect(res.status).toBe(500);
  expect(order).toBeUndefined();
});

async function getOrders(token) {
  const menuRes = await request(app)
    .get('/api/order')
    .set('Authorization', 'Bearer ' + token);
  expect(menuRes.status).toBe(200);
  return menuRes.body.orders;
}

async function createOrder(token, order) {
  const orderRes = await request(app)
    .post('/api/order')
    .set('Authorization', 'Bearer ' + token)
    .send(order);
  return [orderRes.body.order, orderRes];
}
