const jwt = require('jsonwebtoken');

const jwtSecret = 'yourjwtsecrethere';

const user = {
  id: 2,
  name: 'pizza diner',
  email: 'd@jwt.com',
  roles: [
    {
      role: 'admin',
    },
  ],
};

const token = jwt.sign(user, jwtSecret);
console.log(token);
