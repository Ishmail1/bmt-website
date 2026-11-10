import { honeypotTripped, validateEnquiry } from "./validate.js";

const DEFAULT_ORIGINS = [
  "https://www.businessmoverstechnology.com",
  "https://businessmoverstechnology.com",
];
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const MAX_PER_HOUR = 5;
const MAX_PER_DAY = 15;

export function allowedOrigins(env) {
  const raw = env && env.ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ORIGINS.slice();
  return String(raw).split(",").map(function (s) { return s.trim(); }).filter(Boolean);
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
  };
}

function json(payload, status, origin) {
  const headers = { "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" };
  if (origin) Object.assign(headers, corsHeaders(origin));
  return new Response(JSON.stringify(payload), { status: status, headers: headers });
}

async function ipBucket(ip) {
  const data = new TextEncoder().encode("bmt-contact|" + (ip || "unknown"));
  const buf = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  return hex.slice(0, 32);
}

async function tooMany(env, ip) {
  if (!env || !env.BMT_RATE) return false;
  const key = await ipBucket(ip);
  const now = Date.now();
  let hits = [];
  try {
    const raw = await env.BMT_RATE.get(key);
    if (raw) hits = JSON.parse(raw).hits || [];
  } catch (e) {
    return false;
  }
  hits = hits.filter(function (t) { return typeof t === "number" && now - t < DAY; });
  const hour = hits.filter(function (t) { return now - t < HOUR; });
  if (hour.length >= MAX_PER_HOUR || hits.length >= MAX_PER_DAY) return true;
  hits.push(now);
  try {
    await env.BMT_RATE.put(key, JSON.stringify({ hits: hits }), { expirationTtl: 86400 });
  } catch (e) {
    return false;
  }
  return false;
}

async function turnstileOk(fetchImpl, env, token, ip) {
  if (!env || !env.TURNSTILE_SECRET || !token) return false;
  const body = new URLSearchParams();
  body.set("secret", env.TURNSTILE_SECRET);
  body.set("response", String(token).slice(0, 2048));
  if (ip) body.set("remoteip", ip);
  let data;
  try {
    const res = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    data = await res.json();
  } catch (e) {
    return false;
  }
  if (!data || data.success !== true) return false;
  const host = String(data.hostname || "");
  return host === "www.businessmoverstechnology.com" || host === "businessmoverstechnology.com";
}

async function sendMail(fetchImpl, env, enquiry) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !env.MAIL_TO) return false;
  const subjectName = enquiry.name.replace(/[\r\n\t]+/g, " ").slice(0, 120);
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [env.MAIL_TO],
      reply_to: enquiry.email,
      subject: "Website enquiry from " + subjectName,
      text: "Name: " + enquiry.name + "\nEmail: " + enquiry.email + "\nPhone: " + (enquiry.phone || "Not given") + "\n\n" + enquiry.message,
    }),
  });
  return res.ok;
}

export async function handle(request, env, deps) {
  const fetchImpl = (deps && deps.fetch) || fetch;
  const origin = request.headers.get("Origin") || "";
  const allowed = allowedOrigins(env).indexOf(origin) !== -1;

  if (request.method === "OPTIONS") {
    if (!allowed) return new Response(null, { status: 403, headers: { "Cache-Control": "no-store" } });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (request.method !== "POST") return json({ ok: false, error: "method" }, 405, allowed ? origin : "");
  if (!allowed) return json({ ok: false, error: "forbidden" }, 403, "");

  const type = (request.headers.get("Content-Type") || "").toLowerCase();
  if (type.indexOf("application/json") !== 0) return json({ ok: false, error: "invalid" }, 400, origin);

  let raw = "";
  try {
    raw = await request.text();
  } catch (e) {
    return json({ ok: false, error: "invalid" }, 400, origin);
  }
  if (raw.length > 8000) return json({ ok: false, error: "invalid" }, 413, origin);

  let body;
  try {
    body = JSON.parse(raw);
  } catch (e) {
    return json({ ok: false, error: "invalid" }, 400, origin);
  }
  if (!body || typeof body !== "object") return json({ ok: false, error: "invalid" }, 400, origin);

  // Filled traps look like success and nothing is sent.
  if (honeypotTripped(body)) return json({ ok: true }, 200, origin);

  const ip = request.headers.get("CF-Connecting-IP") || "";
  const human = await turnstileOk(fetchImpl, env, body.turnstileToken, ip);
  if (!human) return json({ ok: false, error: "forbidden" }, 403, origin);

  const enquiry = validateEnquiry(body);
  if (!enquiry.ok) return json({ ok: false, error: "invalid" }, 400, origin);

  if (await tooMany(env, ip)) return json({ ok: false, error: "rate" }, 429, origin);

  try {
    const sent = await sendMail(fetchImpl, env, enquiry.value);
    if (!sent) return json({ ok: false, error: "unavailable" }, 502, origin);
  } catch (e) {
    return json({ ok: false, error: "unavailable" }, 502, origin);
  }
  return json({ ok: true }, 200, origin);
}

export default {
  fetch: function (request, env) { return handle(request, env); },
};
