const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  await request(app).post('/api/auth').send(testUser);
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
  const loginRes = await request(app).put('/api/auth').send(testUser);

  expect(loginRes.status).toBe(200);

  const cookies = loginRes.headers['set-cookie'];
  expect(cookies[0]).toMatch(/token=.+; Path=\/; HttpOnly; Secure; SameSite=Strict/);

  const user = { ...testUser, roles: [{ role: 'diner' }] };
  delete user.password;
  expect(loginRes.body).toMatchObject(user);
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

test('auth no token', async () => {
  const getOrdersRes = await request(app).get('/api/order/');
  expect(getOrdersRes.status).toBe(401);
});
