// client/tests/helpers/authHelper.js
async function login(request, email, password) {
  const response = await request.post('/api/auth/login', {
    data: { email, password }
  });
  return await response.json();
}

function authHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

module.exports = { login, authHeaders };