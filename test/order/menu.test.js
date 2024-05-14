const request = require('supertest');
const app = require('../../src/service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserCookie;

beforeAll(async () => {
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserCookie = registerRes.headers['set-cookie'];
});

test('get menu', async () => {
  const getMenuRes = await request(app).get('/api/order/menu');
  expect(getMenuRes.status).toBe(200);
  expect(getMenuRes.headers['content-type']).toMatch('application/json; charset=utf-8');

  expect(getMenuRes.body.length).toBe(6);
});

test('register', async () => {
  const registerRes = await request(app).post('/api/auth').send({ name: 'new', email: 'new@test.com', password: 'a' });
  expect(registerRes.status).toBe(200);

  expect(registerRes.body).toMatchObject({ email: 'new@test.com', name: 'new', roles: [{ role: 'diner' }] });
});

test('register bad params', async () => {
  let registerRes = await request(app).post('/api/auth').send({ email: 'a@test.com', password: 'a' });
  expect(registerRes.status).toBe(400);

  registerRes = await request(app).post('/api/auth').send({ name: 'b', password: 'a' });
  expect(registerRes.status).toBe(400);

  registerRes = await request(app).post('/api/auth').send({ name: 'c', email: 'c@test.com' });
  expect(registerRes.status).toBe(400);
});

test('login', async () => {
  const loginRes = await request(app)
    .put('/api/auth')
    .send(testUser)
    .expect('set-cookie', /token=.*/);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body).toMatchObject({ email: 'reg@test.com', name: 'pizza diner', roles: [{ role: 'diner' }] });
  const cookie = loginRes.headers['set-cookie'];

  const getOrdersRes = await request(app).get('/api/order/').set('Cookie', cookie);
  expect(getOrdersRes.status).toBe(200);
});

test('logout', async () => {
  const registerRes = await request(app).post('/api/auth').send({ name: 'new', email: 'new@test.com', password: 'a' });
  const cookie = registerRes.headers['set-cookie'];

  const logoutRes = await request(app).delete('/api/auth/').set('Cookie', cookie);
  expect(logoutRes.status).toBe(200);
  expect(logoutRes.body).toMatchObject({ message: 'logout successful' });
});

test('auth bad token', async () => {
  const badCookie = ['token=garbage; Path=/; HttpOnly; Secure; SameSite=Strict'];
  const getOrdersRes = await request(app).get('/api/order/').set('Cookie', badCookie);
  expect(getOrdersRes.status).toBe(401);
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
