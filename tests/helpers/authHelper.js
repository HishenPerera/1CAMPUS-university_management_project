const { expect } = require('@playwright/test');

async function login(request, email, password) {
  const response = await request.post('/api/auth/login', {
    data: { email, password },
  });

  expect(response.ok(), `Login failed for ${email}`).toBeTruthy();

  const body = await response.json();
  expect(body.token).toBeTruthy();
  expect(body.user).toBeTruthy();

  return body;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = {
  login,
  authHeaders,
};
