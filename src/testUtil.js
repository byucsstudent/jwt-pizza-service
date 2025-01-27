const { Role, DB } = require('./database/database.js');

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
  jest.setTimeout(60 * 1000 * 5); // 5 minutes
}

async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + '@admin.com';

  user = await DB.addUser(user);
  return { ...user, password: 'toomanysecrets' };
}

let adminToken;
async function getAdminUserToken(service) {
  if (!adminToken) {
    const adminUser = await createAdminUser();
    const loginRes = await service.put('/api/auth').send({ email: adminUser.email, password: (await adminUser).password });
    if (loginRes.ok) {
      adminToken = loginRes.body.token;
    }
  }
  return adminToken;
}

async function loginUser(service) {
  const loginRes = await service.put('/api/auth').send(testUser);
  return loginRes.body.user;
}

async function registerUser(service) {
  const testUser = { name: 'pizza diner', email: `${randomName()}@test.com`, password: 'a' };
  const registerRes = await service.post('/api/auth').send(testUser);
  registerRes.body.user.password = testUser.password;

  return [registerRes.body.user, registerRes.body.token];
}

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

module.exports = {
  randomName,
  getAdminUserToken,
  createAdminUser,
  loginUser,
  registerUser,
};
