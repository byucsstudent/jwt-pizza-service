const request = require('supertest');
const app = require('../service');
const TestHelper = require('../testHelper.js');
const franchiseRouter = require('./franchiseRouter.test.js');

let testUserCookie;
let adminUser;
let adminUserCookie;
let testFranchise;
let testStore;

beforeAll(async () => {
  [, testUserCookie] = await TestHelper.createDinerUser();
  [adminUser, adminUserCookie] = await TestHelper.createAdminUser();
  testFranchise = await franchiseRouter.createFranchise(adminUser, adminUserCookie);
  testStore = await franchiseRouter.createStore(testFranchise.id, adminUserCookie);
});

test('add menu item', async () => {
  const menuItem = { title: TestHelper.randomName(), description: 'test description', image: 'pizza1.png', price: 0.001 };
  const addMenuItemRes = await request(app).put('/api/order/menu').set('Cookie', adminUserCookie).send(menuItem);
  expect(addMenuItemRes.status).toBe(200);

  const menu = await getMenu();
  const newMenuItem = menu.find((item) => item.title === menuItem.title);
  expect(newMenuItem).toMatchObject(menuItem);
});

test('get orders', async () => {
  const getOrdersRes = await request(app).get('/api/order/').set('Cookie', testUserCookie);
  expect(getOrdersRes.status).toBe(200);
});

test('create order', async () => {
  const menu = await getMenu();
  const orderItem = menu[0];
  const order = { franchiseId: testFranchise.id, storeId: testStore.id, items: [{ menuId: orderItem.id, ...orderItem }] };
  const createOrdersRes = await request(app).post('/api/order/').set('Cookie', testUserCookie).send(order);
  expect(createOrdersRes.status).toBe(200);
  expect(createOrdersRes.body.order).toMatchObject(order);
  expect(createOrdersRes.body.jwt).toBeDefined();
});

async function getMenu() {
  const getMenuRes = await request(app).get('/api/order/menu');
  expect(getMenuRes.status).toBe(200);
  expect(getMenuRes.headers['content-type']).toMatch('application/json; charset=utf-8');

  return getMenuRes.body;
}
