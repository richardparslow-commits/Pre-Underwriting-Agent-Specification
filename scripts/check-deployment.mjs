// Read-only hosted smoke check: direct React routes must serve the application,
// and the fallback must still let the browser download its actual JS asset.
import assert from "node:assert/strict";

const origin = process.argv[2];
assert(origin, "Usage: node scripts/check-deployment.mjs https://deployment.example");
const base = new URL(origin);
assert(base.protocol === "https:" || base.hostname === "localhost", "Use HTTPS for hosted checks");
assert(!base.username && !base.password && !base.search && !base.hash, "Supply a plain deployment URL");

for (const path of ["/", "/portal", "/portal/LPP-2026-SAMPLE", "/start", "/privacy"]) {
  const response = await fetch(new URL(path, base), { redirect: "manual", signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, `${path}: expected direct-route HTTP 200`);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/, `${path}: expected HTML`);
  const html = await response.text();
  assert.match(html, /id="root"/, `${path}: expected application root, not a hosting login/error page`);
  const asset = html.match(/<script\b[^>]*\bsrc="([^"]+)"/);
  assert(asset, `${path}: missing application script`);
  const assetUrl = new URL(asset[1], response.url);
  assert.equal(assetUrl.origin, base.origin, "Application asset must stay on this deployment");
  const script = await fetch(assetUrl, { redirect: "manual", signal: AbortSignal.timeout(15000) });
  assert.equal(script.status, 200, "Application script must load");
  assert.match(script.headers.get("content-type") ?? "", /javascript/, "SPA fallback must not replace JS with HTML");
  console.log(`PASS ${path}: application HTML and JavaScript load directly`);
}
