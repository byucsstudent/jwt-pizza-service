const request = require('supertest');
const app = require('../service');
const testUtil = require('./testUtil');
const e = require('express');

test('franchise get', async () => {
  const franchisesRes = await request(app).get('/api/franchise');
  expect(franchisesRes.status).toBe(200);
  expect(Array.isArray(franchisesRes.body)).toBe(true);
});

test('franchise add', async () => {
  const [franchiseeUser] = await testUtil.registerUser(request(app));
  const [franchise, franchiseRes] = await createFranchise(franchiseeUser);
  expect(franchiseRes.status).toBe(200);
  expect(franchise).toMatchObject({
    name: expect.any(String),
    admins: expect.arrayContaining([expect.objectContaining({ email: franchiseeUser.email, id: expect.any(Number) })]),
  });
});

test('franchise add store', async () => {
  const [franchiseeUser, franchiseeToken] = await testUtil.registerUser(request(app));
  const [franchise] = await createFranchise(franchiseeUser);
  const storeName = `store${testUtil.randomName()}`;
  const [store, storeRes] = await createStore(franchise, storeName, franchiseeToken);
  expect(storeRes.status).toBe(200);
  expect(store).toMatchObject({ name: storeName, id: expect.any(Number), franchiseId: franchise.id });

  expect(await getStore(franchise.id, store.id)).toBeTruthy();
});

test('franchise delete store', async () => {
  const [franchiseeUser, franchiseeToken] = await testUtil.registerUser(request(app));
  const [franchise] = await createFranchise(franchiseeUser);
  const storeName = `store${testUtil.randomName()}`;
  const [store, storeRes] = await createStore(franchise, storeName, franchiseeToken);
  expect(storeRes.status).toBe(200);
  expect(store).toMatchObject({ name: storeName, id: expect.any(Number), franchiseId: franchise.id });

  expect(await getStore(franchise.id, store.id)).toBeTruthy();

  const deleteFranchisesRes = await request(app)
    .delete(`/api/franchise/${franchise.id}/store/${store.id}`)
    .set('Authorization', 'Bearer ' + franchiseeToken);
  expect(deleteFranchisesRes.status).toBe(200);

  expect(await getStore(franchise.id, store.id)).toBeFalsy();
});

async function getStore(franchiseId, storeId) {
  const franchisesRes = await request(app).get('/api/franchise');
  const franchises = franchisesRes.body;
  const franchise = franchises.find((franchise) => franchise.id === franchiseId);
  if (franchise) {
    const store = franchise.stores.find((store) => store.id === storeId);
    if (store) {
      return store;
    }
  }
  return null;
}

async function createStore(franchise, storeName, token) {
  const storeRes = await request(app)
    .post(`/api/franchise/${franchise.id}/store`)
    .set('Authorization', 'Bearer ' + token)
    .send({ franchiseId: franchise.id, name: storeName });
  return [storeRes.body, storeRes];
}

async function createFranchise(franchiseeUser) {
  const adminToken = await testUtil.getAdminUserToken(request(app));
  const franchiseRes = await request(app)
    .post('/api/franchise')
    .set('Authorization', 'Bearer ' + adminToken)
    .send({ name: `pizza${testUtil.randomName()}`, admins: [{ email: franchiseeUser.email }] });
  return [franchiseRes.body, franchiseRes];
}
