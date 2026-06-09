const assert = require("node:assert/strict");
const test = require("node:test");

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

const app = require("../app");

async function withServer(run) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json();
  return { response, body };
}

test("customer can register and automatically receives CUSTOMER role", async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await request(baseUrl, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Budi Customer",
        email: "budi@example.com",
        phone: "081234567890",
        password: "password123",
        confirmPassword: "password123",
      }),
    });

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, "budi@example.com");
    assert.deepEqual(body.data.user.roles, ["CUSTOMER"]);
    assert.equal(body.data.user.password, undefined);
    assert.equal(typeof body.data.accessToken, "string");
    assert.equal(typeof body.data.refreshToken, "string");
  });
});

test("register rejects duplicate phone and mismatched confirm password", async () => {
  await withServer(async (baseUrl) => {
    await request(baseUrl, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Tono Customer",
        email: "tono@example.com",
        phone: "081234567894",
        password: "password123",
        confirmPassword: "password123",
      }),
    });

    const duplicatePhone = await request(baseUrl, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Tini Customer",
        email: "tini@example.com",
        phone: "081234567894",
        password: "password123",
        confirmPassword: "password123",
      }),
    });

    assert.equal(duplicatePhone.response.status, 409);
    assert.equal(duplicatePhone.body.success, false);

    const mismatchedPassword = await request(baseUrl, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Tari Customer",
        email: "tari@example.com",
        phone: "081234567895",
        password: "password123",
        confirmPassword: "password456",
      }),
    });

    assert.equal(mismatchedPassword.response.status, 422);
    assert.equal(mismatchedPassword.body.success, false);
  });
});

test("login rejects wrong password and inactive users", async () => {
  await withServer(async (baseUrl) => {
    await request(baseUrl, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Sari Customer",
        email: "sari@example.com",
        phone: "081234567891",
        password: "password123",
        confirmPassword: "password123",
      }),
    });

    const wrongPassword = await request(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "sari@example.com",
        password: "wrongpass123",
      }),
    });

    assert.equal(wrongPassword.response.status, 401);
    assert.equal(wrongPassword.body.success, false);

    await request(baseUrl, "/__test/users/sari@example.com/inactive", {
      method: "PATCH",
    });

    const inactive = await request(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "sari@example.com",
        password: "password123",
      }),
    });

    assert.equal(inactive.response.status, 403);
    assert.equal(inactive.body.success, false);
  });
});

test("default admin can login with ADMIN role", async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await request(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@bengkelpro.local",
        password: "admin12345",
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, "admin@bengkelpro.local");
    assert.deepEqual(body.data.user.roles, ["ADMIN"]);
  });
});

test("authenticated user can read current profile and refresh tokens", async () => {
  await withServer(async (baseUrl) => {
    const registered = await request(baseUrl, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Raka Customer",
        email: "raka@example.com",
        phone: "081234567892",
        password: "password123",
        confirmPassword: "password123",
      }),
    });

    const me = await request(baseUrl, "/api/auth/me", {
      headers: {
        Authorization: `Bearer ${registered.body.data.accessToken}`,
      },
    });

    assert.equal(me.response.status, 200);
    assert.equal(me.body.data.user.email, "raka@example.com");
    assert.deepEqual(me.body.data.user.roles, ["CUSTOMER"]);

    const refreshed = await request(baseUrl, "/api/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({
        refreshToken: registered.body.data.refreshToken,
      }),
    });

    assert.equal(refreshed.response.status, 200);
    assert.equal(typeof refreshed.body.data.accessToken, "string");
    assert.equal(typeof refreshed.body.data.refreshToken, "string");
  });
});

test("logout invalidates refresh token and role middleware returns 403 for wrong role", async () => {
  await withServer(async (baseUrl) => {
    const registered = await request(baseUrl, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Dina Customer",
        email: "dina@example.com",
        phone: "081234567893",
        password: "password123",
        confirmPassword: "password123",
      }),
    });

    const adminOnly = await request(baseUrl, "/__test/admin-only", {
      headers: {
        Authorization: `Bearer ${registered.body.data.accessToken}`,
      },
    });

    assert.equal(adminOnly.response.status, 403);
    assert.equal(adminOnly.body.success, false);

    const logout = await request(baseUrl, "/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({
        refreshToken: registered.body.data.refreshToken,
      }),
    });

    assert.equal(logout.response.status, 200);
    assert.equal(logout.body.success, true);

    const refreshAfterLogout = await request(baseUrl, "/api/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({
        refreshToken: registered.body.data.refreshToken,
      }),
    });

    assert.equal(refreshAfterLogout.response.status, 401);
    assert.equal(refreshAfterLogout.body.success, false);
  });
});
