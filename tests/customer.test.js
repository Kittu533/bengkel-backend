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

async function registerCustomer(baseUrl, suffix) {
  const registered = await request(baseUrl, "/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: `Customer ${suffix}`,
      email: `customer-${suffix}@example.com`,
      phone: `0822000000${suffix}`,
      password: "password123",
      confirmPassword: "password123",
    }),
  });

  return registered.body.data.accessToken;
}

function authHeaders(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}

test("customer can manage own vehicles and dashboard counts active vehicles", async () => {
  await withServer(async (baseUrl) => {
    const accessToken = await registerCustomer(baseUrl, "201");

    const created = await request(baseUrl, "/api/customer/vehicles", {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify({
        plateNumber: "b 1234 cde",
        brand: "Honda",
        model: "Beat",
        vehicleType: "MOTOR",
        year: 2022,
        color: "Hitam",
      }),
    });

    assert.equal(created.response.status, 201);
    assert.equal(created.body.success, true);
    assert.equal(created.body.data.plateNumber, "B 1234 CDE");
    assert.equal(created.body.data.vehicleType, "MOTOR");

    const list = await request(baseUrl, "/api/customer/vehicles", {
      headers: authHeaders(accessToken),
    });
    assert.equal(list.response.status, 200);
    assert.equal(list.body.data.length, 1);

    const updated = await request(
      baseUrl,
      `/api/customer/vehicles/${created.body.data.id}`,
      {
        method: "PATCH",
        headers: authHeaders(accessToken),
        body: JSON.stringify({ color: "Merah", notes: "Motor harian" }),
      }
    );
    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.data.color, "Merah");
    assert.equal(updated.body.data.notes, "Motor harian");

    const dashboard = await request(baseUrl, "/api/customer/dashboard", {
      headers: authHeaders(accessToken),
    });
    assert.equal(dashboard.response.status, 200);
    assert.equal(dashboard.body.data.totalVehicles, 1);
    assert.equal(dashboard.body.data.activeBookings, 0);
    assert.equal(dashboard.body.data.activeServiceOrders, 0);
    assert.equal(dashboard.body.data.serviceHistory, 0);
    assert.equal(dashboard.body.data.unpaidInvoices, 0);

    const deleted = await request(
      baseUrl,
      `/api/customer/vehicles/${created.body.data.id}`,
      {
        method: "DELETE",
        headers: authHeaders(accessToken),
      }
    );
    assert.equal(deleted.response.status, 200);

    const listAfterDelete = await request(baseUrl, "/api/customer/vehicles", {
      headers: authHeaders(accessToken),
    });
    assert.equal(listAfterDelete.body.data.length, 0);
  });
});

test("customer cannot read or update another customer's vehicle", async () => {
  await withServer(async (baseUrl) => {
    const ownerToken = await registerCustomer(baseUrl, "202");
    const otherToken = await registerCustomer(baseUrl, "203");

    const created = await request(baseUrl, "/api/customer/vehicles", {
      method: "POST",
      headers: authHeaders(ownerToken),
      body: JSON.stringify({
        plateNumber: "D 4444 AA",
        brand: "Toyota",
        model: "Avanza",
        vehicleType: "CAR",
        year: 2021,
      }),
    });

    const readOther = await request(
      baseUrl,
      `/api/customer/vehicles/${created.body.data.id}`,
      { headers: authHeaders(otherToken) }
    );
    assert.equal(readOther.response.status, 404);

    const updateOther = await request(
      baseUrl,
      `/api/customer/vehicles/${created.body.data.id}`,
      {
        method: "PATCH",
        headers: authHeaders(otherToken),
        body: JSON.stringify({ color: "Biru" }),
      }
    );
    assert.equal(updateOther.response.status, 404);
  });
});

test("customer endpoints require customer role and expose empty activity lists", async () => {
  await withServer(async (baseUrl) => {
    const noToken = await request(baseUrl, "/api/customer/dashboard");
    assert.equal(noToken.response.status, 401);

    const admin = await request(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@bengkelpro.local",
        password: "admin12345",
      }),
    });
    const adminDashboard = await request(baseUrl, "/api/customer/dashboard", {
      headers: authHeaders(admin.body.data.accessToken),
    });
    assert.equal(adminDashboard.response.status, 403);

    const customerToken = await registerCustomer(baseUrl, "204");
    for (const path of [
      "/api/customer/bookings",
      "/api/customer/service-orders/active",
      "/api/customer/service-history",
      "/api/customer/invoices",
    ]) {
      const result = await request(baseUrl, path, {
        headers: authHeaders(customerToken),
      });
      assert.equal(result.response.status, 200);
      assert.equal(Array.isArray(result.body.data), true);
    }
  });
});
