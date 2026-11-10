import test from "node:test";
import assert from "node:assert/strict";
import { handle } from "../src/index.js";
import { validateEnquiry, honeypotTripped } from "../src/validate.js";

const ORIGIN = "https://www.businessmoverstechnology.com";

function env(extra) {
  return Object.assign({
    ALLOWED_ORIGINS: ORIGIN,
    TURNSTILE_SECRET: "test-secret",
    RESEND_API_KEY: "test-key",
    MAIL_FROM: "Business Movers Technology <website@businessmoverstechnology.com>",
    MAIL_TO: "email@businessmovers.tech",
  }, extra || {});
}

function post(body, headers) {
  return new Request("https://bmt-contact.example.workers.dev/", {
    method: "POST",
    headers: Object.assign({
      Origin: ORIGIN,
      "Content-Type": "application/json",
      "CF-Connecting-IP": "203.0.113.10",
    }, headers || {}),
    body: JSON.stringify(body),
  });
}

const good = {
  name: "Alex",
  email: "alex@example.co.uk",
  phone: "020 3909 8200",
  message: "We need a new boardroom display in our London office.",
  turnstileToken: "token-ok",
};

function mockFetch(turnstileOk, resendOk) {
  const calls = [];
  const fetchImpl = async function (url, opts) {
    calls.push({ url: String(url), opts: opts });
    if (String(url).indexOf("siteverify") !== -1) {
      return new Response(JSON.stringify({ success: turnstileOk !== false, hostname: "www.businessmoverstechnology.com" }), { status: 200 });
    }
    if (String(url).indexOf("api.resend.com") !== -1) {
      return new Response(JSON.stringify({ id: "email_1" }), { status: resendOk === false ? 500 : 200 });
    }
    return new Response("no", { status: 500 });
  };
  return { fetchImpl: fetchImpl, calls: calls };
}

test("accepts a normal enquiry and emails only the office inbox", async function () {
  const mock = mockFetch(true, true);
  const res = await handle(post(good), env(), { fetch: mock.fetchImpl });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  const mail = mock.calls.find(function (c) { return c.url.indexOf("api.resend.com") !== -1; });
  const payload = JSON.parse(mail.opts.body);
  assert.equal(payload.to[0], "email@businessmovers.tech");
  assert.equal(payload.reply_to, "alex@example.co.uk");
  assert.match(payload.subject, /Alex/);
  assert.match(payload.text, /boardroom display/);
  const verify = mock.calls.find(function (c) { return c.url.indexOf("siteverify") !== -1; });
  assert.match(verify.opts.body, /secret=test-secret/);
  assert.match(verify.opts.body, /response=token-ok/);
});

test("rejects another website using the worker", async function () {
  const mock = mockFetch(true, true);
  const res = await handle(post(good, { Origin: "https://evil.example" }), env(), { fetch: mock.fetchImpl });
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
  assert.equal(res.headers.get("Access-Control-Allow-Origin"), null);
});

test("preflight allows the site and refuses others", async function () {
  const ok = await handle(new Request("https://worker/", { method: "OPTIONS", headers: { Origin: ORIGIN } }), env(), {});
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get("Access-Control-Allow-Origin"), ORIGIN);
  const no = await handle(new Request("https://worker/", { method: "OPTIONS", headers: { Origin: "https://evil.example" } }), env(), {});
  assert.equal(no.status, 403);
});

test("rejects a missing or failed Turnstile token without sending mail", async function () {
  const missing = mockFetch(true, true);
  const res = await handle(post(Object.assign({}, good, { turnstileToken: "" })), env(), { fetch: missing.fetchImpl });
  assert.equal(res.status, 403);
  assert.equal(missing.calls.length, 0);

  const failed = mockFetch(false, true);
  const res2 = await handle(post(good), env(), { fetch: failed.fetchImpl });
  assert.equal(res2.status, 403);
  assert.equal(failed.calls.some(function (c) { return c.url.indexOf("resend") !== -1; }), false);
});

test("honeypot looks successful and sends nothing", async function () {
  const mock = mockFetch(true, true);
  const res = await handle(post(Object.assign({}, good, { website: "http://spam.test" })), env(), { fetch: mock.fetchImpl });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(mock.calls.length, 0);
});

test("rejects spam, links, disposable mail and a bad phone", async function () {
  assert.equal(validateEnquiry(Object.assign({}, good, { message: "Buy seo backlinks for your website today please." })).ok, false);
  assert.equal(validateEnquiry(Object.assign({}, good, { message: "Please see http://example.com/offer for the details of the room." })).ok, false);
  assert.equal(validateEnquiry(Object.assign({}, good, { email: "a@mailinator.com" })).ok, false);
  assert.equal(validateEnquiry(Object.assign({}, good, { phone: "abc" })).ok, false);
  assert.equal(validateEnquiry(Object.assign({}, good, { name: "Alex\nBcc: me" })).ok, false);
  assert.equal(honeypotTripped({ _honey: "x" }), true);
});

test("does not send when the message is rejected", async function () {
  const mock = mockFetch(true, true);
  const res = await handle(post(Object.assign({}, good, { message: "seo backlinks guest post for you now" })), env(), { fetch: mock.fetchImpl });
  assert.equal(res.status, 400);
  assert.equal(mock.calls.some(function (c) { return c.url.indexOf("resend") !== -1; }), false);
});

test("rate limit uses a hash and blocks the sixth hour", async function () {
  const store = new Map();
  const kv = {
    async get(k) { return store.has(k) ? store.get(k) : null; },
    async put(k, v) { store.set(k, v); },
  };
  const mock = mockFetch(true, true);
  let last = 0;
  for (let i = 0; i < 5; i++) {
    last = (await handle(post(good), env({ BMT_RATE: kv }), { fetch: mock.fetchImpl })).status;
  }
  assert.equal(last, 200);
  const blocked = await handle(post(good), env({ BMT_RATE: kv }), { fetch: mock.fetchImpl });
  assert.equal(blocked.status, 429);
  const raw = Array.from(store.values())[0];
  assert.equal(raw.indexOf("203.0.113.10"), -1);
});

test("mail failure is an error and the key is not returned", async function () {
  const mock = mockFetch(true, false);
  const res = await handle(post(good), env(), { fetch: mock.fetchImpl });
  assert.equal(res.status, 502);
  const text = JSON.stringify(await res.json());
  assert.equal(text.indexOf("test-key"), -1);
  assert.equal(text.indexOf("test-secret"), -1);
});

test("refuses other methods and oversized bodies", async function () {
  const get = await handle(new Request("https://worker/", { method: "GET", headers: { Origin: ORIGIN } }), env(), {});
  assert.equal(get.status, 405);
  const huge = await handle(new Request("https://worker/", {
    method: "POST",
    headers: { Origin: ORIGIN, "Content-Type": "application/json" },
    body: "{" + "a".repeat(9000) + "}",
  }), env(), {});
  assert.equal(huge.status, 413);
});
