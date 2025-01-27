const request = require('supertest');
const app = require('../service');
const testUtil = require('../testUtil');

test('franchise get all', async () => {
  const franchisesRes = await request(app).get('/api/franchise');
  expect(franchisesRes.status).toBe(200);
  expect(Array.isArray(franchisesRes.body)).toBe(true);
});

test('franchise get specific user', async () => {
  const [franchiseeUser, franchiseeToken] = await testUtil.registerUser(request(app));
  await createFranchise(franchiseeUser.email);
  const franchisesRes = await getUserFranchises(franchiseeUser.id, franchiseeToken);
  expect(franchisesRes.status).toBe(200);
  expect(franchisesRes.body.length).toBe(1);

  const franchisesAsAdminRes = await getUserFranchises(franchiseeUser.id);
  expect(franchisesAsAdminRes.status).toBe(200);
  expect(franchisesAsAdminRes.body.length).toBe(1);

  const [, dinerToken] = await testUtil.registerUser(request(app));
  const franchisesAsDinerRes = await getUserFranchises(franchiseeUser.id, dinerToken);
  expect(franchisesAsDinerRes.body.length).toBe(0);
});

test('franchise add', async () => {
  const [franchiseeUser] = await testUtil.registerUser(request(app));
  const [franchise, franchiseRes] = await createFranchise(franchiseeUser.email);
  expect(franchiseRes.status).toBe(200);
  expect(franchise).toMatchObject({
    name: expect.any(String),
    admins: expect.arrayContaining([expect.objectContaining({ email: franchiseeUser.email, id: expect.any(Number) })]),
  });
});

test('franchise add no auth', async () => {
  const [franchiseeUser, franchiseeToken] = await testUtil.registerUser(request(app));
  const [, franchiseRes] = await createFranchise(franchiseeUser.email, franchiseeToken);
  expect(franchiseRes.status).toBe(403);
});

test('franchise delete', async () => {
  const [franchiseeUser] = await testUtil.registerUser(request(app));
  const [franchise] = await createFranchise(franchiseeUser.email);
  const deleteRes = await deleteFranchise(franchise.id);
  expect(deleteRes.status).toBe(200);
});

test('franchise delete no auth', async () => {
  const [franchiseeUser, franchiseeToken] = await testUtil.registerUser(request(app));
  const [franchise] = await createFranchise(franchiseeUser.email);
  const deleteRes = await deleteFranchise(franchise.id, franchiseeToken);
  expect(deleteRes.status).toBe(403);
});

test('franchise add store', async () => {
  const [franchiseeUser, franchiseeToken] = await testUtil.registerUser(request(app));
  const [franchise] = await createFranchise(franchiseeUser.email);
  const [store, storeRes] = await createStore(franchise, franchiseeToken);
  expect(storeRes.status).toBe(200);
  expect(store).toMatchObject({ name: expect.any(String), id: expect.any(Number), franchiseId: franchise.id });

  expect(await getStore(franchise.id, store.id)).toBeTruthy();
});

test('franchise add store no auth', async () => {
  const [franchiseeUser] = await testUtil.registerUser(request(app));
  const [franchise] = await createFranchise(franchiseeUser.email);
  const [, dinerToken] = await testUtil.registerUser(request(app));
  const [, storeRes] = await createStore(franchise, dinerToken);
  expect(storeRes.status).toBe(403);
});

test('franchise delete store', async () => {
  const [franchiseeUser, franchiseeToken] = await testUtil.registerUser(request(app));
  const [franchise] = await createFranchise(franchiseeUser.email);
  const [store] = await createStore(franchise, franchiseeToken);

  expect(await getStore(franchise.id, store.id)).toBeTruthy();

  const deleteStoreRes = await deleteStore(franchise.id, store.id, franchiseeToken);
  expect(deleteStoreRes.status).toBe(200);

  expect(await getStore(franchise.id, store.id)).toBeFalsy();
});

test('franchise delete store no auth', async () => {
  const [, dinerToken] = await testUtil.registerUser(request(app));
  const [franchiseeUser, franchiseeToken] = await testUtil.registerUser(request(app));
  const [franchise] = await createFranchise(franchiseeUser.email);
  const [store] = await createStore(franchise, franchiseeToken);

  const deleteStoreRes = await deleteStore(franchise.id, store.id, dinerToken);
  expect(deleteStoreRes.status).toBe(403);
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

async function createFranchise(franchiseeUserEmail, authToken) {
  authToken = authToken || (await testUtil.getAdminUserToken(request(app)));
  const franchiseRes = await request(app)
    .post('/api/franchise')
    .set('Authorization', 'Bearer ' + authToken)
    .send({ name: `pizza${testUtil.randomName()}`, admins: [{ email: franchiseeUserEmail }] });
  return [franchiseRes.body, franchiseRes];
}

async function deleteFranchise(franchiseeId, authToken) {
  authToken = authToken || (await testUtil.getAdminUserToken(request(app)));
  const franchiseRes = await request(app)
    .delete(`/api/franchise/${franchiseeId}`)
    .set('Authorization', 'Bearer ' + authToken);
  return franchiseRes;
}

async function getUserFranchises(userId, authToken) {
  authToken = authToken || (await testUtil.getAdminUserToken(request(app)));
  const franchisesRes = await request(app)
    .get(`/api/franchise/${userId}`)
    .set('Authorization', 'Bearer ' + authToken);
  return franchisesRes;
}

async function createStore(franchise, authToken) {
  const storeName = `store${testUtil.randomName()}`;
  const storeRes = await request(app)
    .post(`/api/franchise/${franchise.id}/store`)
    .set('Authorization', 'Bearer ' + authToken)
    .send({ franchiseId: franchise.id, name: storeName });
  return [storeRes.body, storeRes];
}

async function deleteStore(franchiseId, storeId, authToken) {
  const deleteStoreRes = await request(app)
    .delete(`/api/franchise/${franchiseId}/store/${storeId}`)
    .set('Authorization', 'Bearer ' + authToken);
  return deleteStoreRes;
}
