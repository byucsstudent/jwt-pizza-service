const { DB, Role } = require('./database');
const testUtil = require('../testUtil');

test('add user diner', async () => {
  const addRes = await DB.addUser({ name: 'test', email: testUtil.randomName() + '@test.com', password: 'a', roles: [{ role: Role.Diner }] });
  expect(addRes).toMatchObject({ name: 'test', id: expect.any(Number) });
});

test('add user franchisee', async () => {
  const franchiseName = testUtil.randomName();
  await DB.createFranchise({ name: franchiseName, admins: [] });
  const addRes = await DB.addUser({
    name: 'test',
    email: testUtil.randomName() + '@test.com',
    password: 'a',
    roles: [{ role: Role.Franchisee, object: franchiseName }],
  });
  expect(addRes).toMatchObject({ name: 'test', id: expect.any(Number) });
});

test('get user franchises unknown user', async () => {
  const getUserFranchisesRes = await DB.getUserFranchises(-1);
  expect(getUserFranchisesRes.length).toBe(0);
});

test('get ID not found', async () => {
  const connection = await DB.getConnection();
  try {
    await expect(DB.getID(connection, 'name', -1, 'franchise')).rejects.toThrow();
  } finally {
    connection.end();
  }
});

test('get token signature Bad', async () => {
  expect(DB.getTokenSignature('1234')).toBe('');
});
