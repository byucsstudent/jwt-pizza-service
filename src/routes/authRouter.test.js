const request = require('supertest');
const app = require('../service');

test('register user', async () => {
  const response = await request(app).post('/api/auth').send({
    name: 't1',
    email: 't1@jwt.com',
    password: 't1',
  });

  expect(response.statusCode).toBe(200);
  expect(response.body).toMatchObject({
    user: { email: 't1@jwt.com', name: 't1', id: expect.any(Number), roles: [{ role: 'diner' }] },

    token: expect.any(String),
  });
});
