const request = require('supertest');
const app = require('../service');
const testUtil = require('./testUtil');
const { json } = require('express');

let dinerUser;
let dinerToken;

beforeAll(async () => {
  [dinerUser, dinerToken] = await testUtil.registerUser(request(app));
});

test('menu', async () => {
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

// test('register existing', async () => {
//   const registerRes = await request(app).post('/api/auth').send(dinerUser);
//   expect(registerRes.status).toBe(500);
// });

// test('register bad params', async () => {
//   const params = [
//     { email: `${testUtil.randomName()}@test.com`, password: 'a' },
//     { name: 'pizza diner', password: 'a' },
//     { name: 'pizza diner', email: `${testUtil.randomName()}@test.com` },
//   ];

//   params.forEach(async (param) => {
//     const registerRes = await request(app).post('/api/auth').send(param);
//     expect(registerRes.status).toBe(400);
//   });
// });

// test('login', async () => {
//   const loginRes = await request(app).put('/api/auth').send(dinerUser);
//   expect(loginRes.status).toBe(200);
//   expectValidJwt(loginRes.body.token);

//   const expectedUser = { ...dinerUser, roles: [{ role: 'diner' }] };
//   delete expectedUser.password;
//   expect(loginRes.body.user).toMatchObject(expectedUser);
// });

// test('update user', async () => {
//   const user = { ...dinerUser, email: 'change' + dinerUser.email };
//   const updateRes = await request(app)
//     .put('/api/auth/' + user.id)
//     .send(user)
//     .set('Authorization', 'Bearer ' + dinerAuthToken);
//   expect(updateRes.status).toBe(200);
//   expect(updateRes.body.email).toMatch(user.email);
// });

// test('update user without auth', async () => {
//   const user = { ...dinerUser, email: 'change' + dinerUser.email };
//   const updateRes = await request(app)
//     .put('/api/auth/' + user.id)
//     .send(user);
//   expect(updateRes.status).toBe(401);
// });

// test('update user wrong user', async () => {
//   const user = { ...dinerUser, email: 'change' + dinerUser.email };
//   const updateRes = await request(app)
//     .put('/api/auth/1')
//     .send(user)
//     .set('Authorization', 'Bearer ' + dinerAuthToken);
//   expect(updateRes.status).toBe(403);
// });

// test('logout user', async () => {
//   [user, userAuthToken] = await testUtil.registerUser(request(app));
//   const logoutRes = await request(app)
//     .delete('/api/auth')
//     .set('Authorization', 'Bearer ' + userAuthToken);
//   expect(logoutRes.status).toBe(200);
// });

// function expectValidJwt(potentialJwt) {
//   expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
// }
