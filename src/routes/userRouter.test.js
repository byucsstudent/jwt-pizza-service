const request = require('supertest');
const app = require('../service');
const testUtil = require('../testUtil');

let dinerUser;
let dinerToken;

beforeAll(async () => {
  [dinerUser, dinerToken] = await testUtil.registerUser(request(app));
});

afterAll(async () => {
  await deleteUser(dinerUser.id, dinerToken);
});

test('get me', async () => {
  const updateRes = await request(app)
    .get('/api/user/me')
    .set('Authorization', 'Bearer ' + dinerToken);
  expect(updateRes.status).toBe(200);
  expect(updateRes.body.email).toMatch(dinerUser.email);
});

test('update user', async () => {
  const user = { ...dinerUser, email: 'change' + dinerUser.email };
  const updateRes = await request(app)
    .put('/api/user/' + user.id)
    .send(user)
    .set('Authorization', 'Bearer ' + dinerToken);
  expect(updateRes.status).toBe(200);
  expect(updateRes.body.user.email).toMatch(user.email);
});

test('update user without auth', async () => {
  const user = { ...dinerUser, email: 'change' + dinerUser.email };
  const updateRes = await request(app)
    .put('/api/user/' + user.id)
    .send(user);
  expect(updateRes.status).toBe(401);
});

test('update user wrong user', async () => {
  const [user, userToken] = await testUtil.registerUser(request(app));
  const updateRes = await request(app)
    .put('/api/user/' + dinerUser.id)
    .send(user)
    .set('Authorization', 'Bearer ' + userToken);
  expect(updateRes.status).toBe(403);

  await deleteUser(user.id, userToken);
});

test('list users unauthorized', async () => {
  const listUsersRes = await request(app).get('/api/user');
  expect(listUsersRes.status).toBe(401);
});

test('list users', async () => {
  const [user, userToken] = await testUtil.registerUser(request(app));
  const listUsersRes = await request(app)
    .get('/api/user')
    .set('Authorization', 'Bearer ' + userToken);
  expect(listUsersRes.status).toBe(200);
  expect(listUsersRes.body.users.length).toBeGreaterThan(0);

  await deleteUser(user.id, userToken);
});

test('list users filter match all', async () => {
  const [user, userToken] = await testUtil.registerUser(request(app));
  delete user.password;
  const listUsersRes = await request(app)
    .get(`/api/user?email=${user.email}&name=${user.name}&role=${user.roles[0].role}`)
    .set('Authorization', 'Bearer ' + userToken);
  expect(listUsersRes.status).toBe(200);
  expect(listUsersRes.body.users.length).toBe(1);
  expect(listUsersRes.body.users[0]).toMatchObject(user);

  await deleteUser(user.id, userToken);
});

test('list users filter match none', async () => {
  const [user, userToken] = await testUtil.registerUser(request(app));
  delete user.password;
  const listUsersRes = await request(app)
    .get(`/api/user?name=nobody}`)
    .set('Authorization', 'Bearer ' + userToken);
  expect(listUsersRes.status).toBe(200);
  expect(listUsersRes.body.users.length).toBe(0);

  await deleteUser(user.id, userToken);
});

test('list users filter match email wildcard', async () => {
  const [user, userToken] = await testUtil.registerUser(request(app));
  delete user.password;
  const truncatedEmail = user.email.split('@')[0] + '*';
  const listUsersRes = await request(app)
    .get(`/api/user?email=${truncatedEmail}`)
    .set('Authorization', 'Bearer ' + userToken);
  expect(listUsersRes.status).toBe(200);
  expect(listUsersRes.body.users.length).toBe(1);
  expect(listUsersRes.body.users[0]).toMatchObject(user);

  await deleteUser(user.id, userToken);
});

test('delete user', async () => {
  const [user, userToken] = await testUtil.registerUser(request(app));
  const deleteRes = await deleteUser(user.id, userToken);
  expect(deleteRes.status).toBe(200);
});

async function deleteUser(userId, userToken) {
  return request(app)
    .delete('/api/user/' + userId)
    .set('Authorization', 'Bearer ' + userToken);
}
