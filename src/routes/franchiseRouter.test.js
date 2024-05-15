const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');
const { get } = require('http');

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
  jest.setTimeout(60 * 1000 * 5); // 5 minutes
}

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

test('get franchise', async () => {
  const getFranchiseRes = await request(app).get('/api/franchise');
  expect(getFranchiseRes.status).toBe(200);
  expect(getFranchiseRes.headers['content-type']).toMatch('application/json; charset=utf-8');

  expect(getFranchiseRes.body.length).not.toBe(0);
});

test('create franchise', async () => {
  const franchise = await createFranchise(adminUser);
  expect(franchise).toMatchObject(franchise);
});

test('get franchises', async () => {
  const franchises = await getFranchises(adminUser, adminUserCookie);
  expect(franchises.length).toBe(1);
});

test('create store', async () => {
  const franchise = await createFranchise(adminUser);
  const store = await createStore(franchise.id, adminUserCookie);

  expect(store).toMatchObject(store);
});

test('delete store', async () => {
  const franchise = await createFranchise(adminUser);
  const store = await createStore(franchise.id, adminUserCookie);
  const { status, body: deleteStoreRes } = await request(app).delete(`/api/franchise/${franchise.id}/store/${store.id}`).set('Cookie', adminUserCookie);
  expect(status).toBe(200);

  expect(deleteStoreRes.message).toMatch('store deleted');
  expect(await getStore(franchise.id, store.id, adminUser, adminUserCookie)).toBeUndefined();
});

test('delete franchise', async () => {
  const franchise = await createFranchise(adminUser);
  const store = await createStore(franchise.id, adminUserCookie);
  const { status, body: deleteFranchiseRes } = await request(app).delete(`/api/franchise/${franchise.id}`).set('Cookie', adminUserCookie);
  expect(status).toBe(200);

  expect(deleteFranchiseRes.message).toMatch('franchise deleted');
  expect(await getFranchise(franchise.id, adminUser, adminUserCookie)).toBeUndefined();
});

async function getFranchise(franchiseId, user, userCookie) {
  const franchises = await getFranchises(user, userCookie);
  if (franchises) {
    return franchises.find((f) => f.id === franchiseId);
  }
  return undefined;
}

async function getStore(franchiseId, storeId, user, userCookie) {
  const franchise = await getFranchise(franchiseId, user, userCookie);
  if (franchise) {
    const matchingStore = franchise.stores.find((s) => s.id === storeId);
    return matchingStore;
  }
  return undefined;
}

async function createFranchise(user) {
  const franchise = { name: randomName(), admins: [{ email: user.email }] };
  const getFranchiseRes = await request(app).post(`/api/franchise`).set('Cookie', adminUserCookie).send(franchise);
  expect(getFranchiseRes.status).toBe(200);
  expect(getFranchiseRes.headers['content-type']).toMatch('application/json; charset=utf-8');

  return getFranchiseRes.body;
}

async function createStore(franchiseId, userCookie) {
  const store = { name: randomName(), franchiseId: franchiseId };
  const createStoreRes = await request(app).post(`/api/franchise/${franchiseId}/store`).set('Cookie', userCookie).send(store);
  expect(createStoreRes.status).toBe(200);
  expect(createStoreRes.headers['content-type']).toMatch('application/json; charset=utf-8');

  return createStoreRes.body;
}

async function getFranchises(user, userCookie) {
  const getFranchisesRes = await request(app).get(`/api/franchise/${user.id}`).set('Cookie', userCookie);
  expect(getFranchisesRes.status).toBe(200);
  expect(getFranchisesRes.headers['content-type']).toMatch('application/json; charset=utf-8');
  return getFranchisesRes.body;
}
