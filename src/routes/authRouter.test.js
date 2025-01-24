const request = require('supertest');
const app = require('../service');
const testUtil = require('./testUtil');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
  expectValidJwt(testUserAuthToken);
  testUser.id = registerRes.body.user.id;
});

test('register existing', async () => {
  const registerRes = await request(app).post('/api/auth').send(testUser);
  expect(registerRes.status).toBe(500);
});

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expectValidJwt(loginRes.body.token);

  const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
  delete expectedUser.password;
  expect(loginRes.body.user).toMatchObject(expectedUser);
});

test('update user', async () => {
  const user = { ...testUser, email: 'change' + testUser.email };
  const updateRes = await request(app)
    .put('/api/auth/' + user.id)
    .send(user)
    .set('Authorization', 'Bearer ' + testUserAuthToken);
  expect(updateRes.status).toBe(200);
  expect(updateRes.body.email).toMatch(user.email);
});

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}

async function login(user) {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  return loginRes.body.user;
}
