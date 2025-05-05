const request = require('supertest');
const app = require('../service');
const testUtil = require('../testUtil');

let dinerUser;
let dinerAuthToken;

beforeAll(async () => {
  [dinerUser, dinerAuthToken] = await testUtil.registerUser(request(app));
});

test('update user', async () => {
  const user = { ...dinerUser, email: 'change' + dinerUser.email };
  const updateRes = await request(app)
    .put('/api/user/' + user.id)
    .send(user)
    .set('Authorization', 'Bearer ' + dinerAuthToken);
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
});
