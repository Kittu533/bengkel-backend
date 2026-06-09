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

async function request(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.json();
  return { response, body };
}

test("guest can list active service catalogs with filters and pagination", async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await request(
      baseUrl,
      "/api/public/service-catalogs?search=oli&vehicleType=MOTOR&page=1&limit=12"
    );

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(Array.isArray(body.data), true);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].name, "Ganti Oli Motor");
    assert.equal(body.data[0].isActive, true);
    assert.equal(body.meta.page, 1);
    assert.equal(body.meta.limit, 12);
  });
});

test("guest can read active service detail and inactive service is hidden", async () => {
  await withServer(async (baseUrl) => {
    const active = await request(baseUrl, "/api/public/service-catalogs/svc-motor-oil");
    assert.equal(active.response.status, 200);
    assert.equal(active.body.data.name, "Ganti Oli Motor");

    const inactive = await request(
      baseUrl,
      "/api/public/service-catalogs/svc-inactive"
    );
    assert.equal(inactive.response.status, 404);
    assert.equal(inactive.body.success, false);
  });
});

test("guest can list active spareparts and cost price is never exposed", async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await request(
      baseUrl,
      "/api/public/spareparts?search=aki&brand=GS&page=1&limit=12"
    );

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].name, "Aki GS Motor");
    assert.equal(body.data[0].isActive, true);
    assert.equal(body.data[0].costPrice, undefined);
    assert.equal(body.data[0].sellPrice, 320000);
  });
});

test("guest can read active sparepart detail and inactive sparepart is hidden", async () => {
  await withServer(async (baseUrl) => {
    const active = await request(baseUrl, "/api/public/spareparts/sp-aki-gs");
    assert.equal(active.response.status, 200);
    assert.equal(active.body.data.name, "Aki GS Motor");
    assert.equal(active.body.data.costPrice, undefined);

    const inactive = await request(baseUrl, "/api/public/spareparts/sp-inactive");
    assert.equal(inactive.response.status, 404);
    assert.equal(inactive.body.success, false);
  });
});
