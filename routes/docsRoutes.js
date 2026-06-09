const express = require("express");
const { openApiSpec } = require("../docs/openapi");

const router = express.Router();

router.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>BengkelPro API Docs</title>
    <style>
      body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
      main { max-width: 1080px; margin: 0 auto; padding: 32px 20px; }
      header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 24px; }
      h1 { margin: 0; font-size: 28px; }
      p { color: #475569; line-height: 1.6; }
      a { color: #1d4ed8; font-weight: 700; text-decoration: none; }
      section { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-top: 16px; }
      h2 { margin: 0 0 12px; font-size: 18px; }
      code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
      .endpoint { display: grid; grid-template-columns: 88px 1fr; gap: 12px; padding: 10px 0; border-top: 1px solid #e2e8f0; }
      .endpoint:first-of-type { border-top: 0; }
      .method { font-weight: 800; color: #166534; }
      .path { color: #334155; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <h1>BengkelPro API Docs</h1>
          <p>OpenAPI JSON tersedia di <a href="/api/docs/openapi.json">/api/docs/openapi.json</a>.</p>
        </div>
        <a href="/api/health">Health Check</a>
      </header>
      ${renderDocs()}
    </main>
  </body>
</html>`);
});

router.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

function renderDocs() {
  return Object.entries(openApiSpec.paths)
    .map(([path, methods]) => {
      const rows = Object.entries(methods)
        .map(
          ([method, operation]) => `
            <div class="endpoint">
              <div class="method">${method.toUpperCase()}</div>
              <div>
                <div class="path"><code>/api${path}</code></div>
                <p>${operation.summary || ""}</p>
              </div>
            </div>`
        )
        .join("");

      return `<section>${rows}</section>`;
    })
    .join("");
}

module.exports = router;
