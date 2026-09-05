import assert from "node:assert/strict";
import { clientId, isSameOrigin } from "../lib/security.ts";

assert.equal(clientId(new Request("https://ripper.test", { headers: { "x-forwarded-for": "203.0.113.10", "cf-connecting-ip": "198.51.100.9" } })), "203.0.113.10");
assert.equal(clientId(new Request("https://ripper.test", { headers: { "cf-connecting-ip": "198.51.100.9" } })), "unknown");
assert.equal(isSameOrigin(new Request("https://ripper.test/api", { headers: { origin: "https://ripper.test", host: "ripper.test" } })), true);
assert.equal(isSameOrigin(new Request("https://ripper.test/api", { headers: { origin: "https://evil.test", host: "ripper.test" } })), false);
console.log("Security identity and same-origin checks passed");
