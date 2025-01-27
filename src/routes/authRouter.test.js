const request = require('supertest');
const app = require('../service');
const testUtil = require('../testUtil');

let dinerUser;
let dinerAuthToken;

beforeAll(async () => {
  [dinerUser, dinerAuthToken] = await testUtil.registerUser(request(app));
});

test('register', async () => {
  const testUser = { name: 'pizza diner', email: `${testUtil.randomName()}@test.com`, password: 'a' };
  const registerRes = await request(app).post('/api/auth').send(testUser);
  expect(registerRes.status).toBe(200);
  expectValidJwt(registerRes.body.token);
});

test('register existing', async () => {
  const registerRes = await request(app).post('/api/auth').send(dinerUser);
  expect(registerRes.status).toBe(500);
});

test('register bad params', async () => {
  const params = [
    { email: `${testUtil.randomName()}@test.com`, password: 'a' },
    { name: 'pizza diner', password: 'a' },
    { name: 'pizza diner', email: `${testUtil.randomName()}@test.com` },
  ];

  params.forEach(async (param) => {
    const registerRes = await request(app).post('/api/auth').send(param);
    expect(registerRes.status).toBe(400);
  });
});

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(dinerUser);
  expect(loginRes.status).toBe(200);
  expectValidJwt(loginRes.body.token);

  const expectedUser = { ...dinerUser, roles: [{ role: 'diner' }] };
  delete expectedUser.password;
  expect(loginRes.body.user).toMatchObject(expectedUser);
});

test('login bad password', async () => {
  const badPasswordUser = { ...dinerUser, password: 'bad' + dinerUser.password };
  const loginRes = await request(app).put('/api/auth').send(badPasswordUser);
  expect(loginRes.status).toBe(404);
});

test('update user', async () => {
  const user = { ...dinerUser, email: 'change' + dinerUser.email };
  const updateRes = await request(app)
    .put('/api/auth/' + user.id)
    .send(user)
    .set('Authorization', 'Bearer ' + dinerAuthToken);
  expect(updateRes.status).toBe(200);
  expect(updateRes.body.email).toMatch(user.email);
});

test('update user without auth', async () => {
  const user = { ...dinerUser, email: 'change' + dinerUser.email };
  const updateRes = await request(app)
    .put('/api/auth/' + user.id)
    .send(user);
  expect(updateRes.status).toBe(401);
});

test('update user wrong user', async () => {
  const user = { ...dinerUser, email: 'change' + dinerUser.email };
  const updateRes = await request(app)
    .put('/api/auth/1')
    .send(user)
    .set('Authorization', 'Bearer ' + dinerAuthToken);
  expect(updateRes.status).toBe(403);
});

test('logout user', async () => {
  const [, userToken] = await testUtil.registerUser(request(app));
  const logoutRes = await request(app)
    .delete('/api/auth')
    .set('Authorization', 'Bearer ' + userToken);
  expect(logoutRes.status).toBe(200);
});

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}
