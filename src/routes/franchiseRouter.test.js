const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

let adminUser = { password: 'a', roles: [{ role: Role.Admin }] };
let adminUserCookie;
const testUser = { name: 'pizza diner', password: 'a' };
let testUserCookie;

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

beforeAll(async () => {
  adminUser.name = randomName();
  adminUser.email = adminUser.name + '@admin.com';

  const addRes = await DB.addUser(adminUser);
  adminUser = { ...adminUser, id: addRes.id, password: 'a' };

  const registerRes = await request(app).put('/api/auth').send(adminUser);
  adminUserCookie = registerRes.headers['set-cookie'];
});

beforeAll(async () => {
  testUser.email = randomName() + '@diner.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserCookie = registerRes.headers['set-cookie'];
});

// { method: 'DELETE', path: '/api/franchise/:franchiseId', requiresAuth: true, description: `Delete a franchises`, example: `curl -X DELETE -b cookies.txt localhost:3000/api/franchise/1` },
// {
//   method: 'POST',
//   path: '/api/franchise/:franchiseId/store',
//   requiresAuth: true,
//   description: 'Create a new franchise store',
//   example: `curl -b cookies.txt -X POST localhost:3000/api/franchise/1/store -H 'Content-Type: application/json' -d '{"franchiseId": 1, "name":"SLC"}'`,
// },
// {
//   method: 'DELETE',
//   path: '/api/franchise/:franchiseId/store/:storeId',
//   requiresAuth: true,
//   description: `Delete a store`,
//   example: `curl -X DELETE -b cookies.txt localhost:3000/api/franchise/1/store/1`,
// },

test('get franchise', async () => {
  const getFranchiseRes = await request(app).get('/api/franchise');
  expect(getFranchiseRes.status).toBe(200);
  expect(getFranchiseRes.headers['content-type']).toMatch('application/json; charset=utf-8');

  expect(getFranchiseRes.body.length).not.toBe(0);
});

test('create franchise as admin', async () => {
  const franchise = { name: randomName(), admins: [{ email: testUser.email }] };
  const getFranchiseRes = await request(app).post(`/api/franchise`).set('Cookie', adminUserCookie).send(franchise);
  expect(getFranchiseRes.status).toBe(200);
  expect(getFranchiseRes.headers['content-type']).toMatch('application/json; charset=utf-8');

  expect(getFranchiseRes.body).toMatchObject(franchise);
});

test('get franchise as admin', async () => {
  const getFranchiseRes = await request(app).get(`/api/franchise/${adminUser.id}`).set('Cookie', adminUserCookie);
  expect(getFranchiseRes.status).toBe(200);
  expect(getFranchiseRes.headers['content-type']).toMatch('application/json; charset=utf-8');

  expect(getFranchiseRes.body.length).toBe(0);
});

test('create store as admin', async () => {
  const franchise = { name: randomName(), admins: [{ email: testUser.email }] };
  const getFranchiseRes = await request(app).post(`/api/${franchiseId}/store`).set('Cookie', adminUserCookie).send(franchise);
  expect(getFranchiseRes.status).toBe(200);
  expect(getFranchiseRes.headers['content-type']).toMatch('application/json; charset=utf-8');

  expect(getFranchiseRes.body).toMatchObject(franchise);
});
