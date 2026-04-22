/**
 * Helper to authenticate and get a JWT token.
 */
async function login(request, email, password) {
  const response = await request.post('/api/auth/login', {
    data: {
      email,
      password,
    },
  });

  if (!response.ok()) {
    throw new Error(`Login failed for ${email}: ${response.status()} ${await response.text()}`);
  }

  const body = await response.json();
  return body.token;
}

module.exports = { login };
