// Server-side checks for the contact form. These mirror the checks in
// assets/site.js so a script that skips the browser still cannot send
// the messages the site already refuses.

const BAD_TLD = /\.(ru|su|xyz|top|click|icu|buzz|cfd|sbs|cyou|monster|rest|bid|loan|win)$/i;
const TEMP = [
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org",
  "sharklasers.com", "grr.la", "10minutemail.com", "temp-mail.org", "tempmail.com",
  "tempmail.net", "yopmail.com", "trashmail.com", "getnada.com", "dispostable.com",
  "throwawaymail.com", "maildrop.cc", "fakeinbox.com", "mailnesia.com", "emailondeck.com",
  "tempail.com", "mohmal.com", "mintemail.com", "spamgourmet.com", "moakt.com",
  "tempr.email", "discard.email", "burnermail.io", "1secmail.com", "mail.tm",
  "mailpoof.com", "tempinbox.com", "emailfake.com",
];
const SPAM = /\b(seo|search engine optimi[sz]ation|backlinks?|link ?building|guest ?posts?|domain authority|first page (of|on) google|rank(ing)? (higher|first|#?1) on google|(website|web|site) traffic|(crypto|bitcoin|btc|forex) (investment|investing|profits?|signals|recovery|wallet|mining|trading account)|earn (bitcoin|crypto|btc)|cryptocurrency investment|nfts?|online casinos?|casino bonus|viagra|cialis|porn|adult (content|dating)|dating site|payday loans?|loan offer|investment opportunit(y|ies)|binary options|lottery win(ner)?|weight loss|buy followers|(instagram|tiktok|youtube) (followers|views)|unsubscribe|telegram|web design services|app development services|virtual assistants?|lead generation services|cold email(ing)?)\b/i;
const LINK = /(https?:\/\/|\bwww\.|\[\/?(url|link|img)\b|<\s*a\s|href\s*=|\.(com|net|org|ru|info|xyz|top|biz)\/)/i;
const FOREIGN = /[\u0400-\u052F\u2DE0-\u2DFF\uA640-\uA69F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\u0E00-\u0E7F]/g;

function text(value, max) {
  const s = String(value == null ? "" : value).replace(/\0/g, "").trim();
  return s.slice(0, max);
}

export function honeypotTripped(body) {
  const traps = [body && body.website, body && body._honey, body && body.company_url];
  return traps.some(function (v) { return String(v == null ? "" : v).trim() !== ""; });
}

export function validateEnquiry(body) {
  const name = text(body && body.name, 80);
  const email = text(body && body.email, 120);
  const phone = text(body && body.phone, 30);
  const message = text(body && body.message, 3000);
  if (/[\r\n]/.test(name) || /[\r\n]/.test(email) || /[\r\n]/.test(phone)) return { ok: false };

  if (!name) return { ok: false };
  if (LINK.test(name) || /@|\.(com|net|org|co|uk|io)\b/i.test(name) || (name.match(/\d/g) || []).length > 1 || /[<>{}\[\]]/.test(name)) return { ok: false };
  if ((name.match(FOREIGN) || []).length) return { ok: false };
  if (/^\S{9,}$/.test(name) && (name.slice(1).match(/[A-Z]/g) || []).length >= 3) return { ok: false };

  const m = /^[^\s@]+@([^\s@]+\.[a-z]{2,})$/i.exec(email);
  const dom = m ? m[1].toLowerCase() : "";
  if (!email || !m) return { ok: false };
  if (BAD_TLD.test(dom)) return { ok: false };
  if (TEMP.some(function (d) { return dom === d || dom.slice(-d.length - 1) === "." + d; })) return { ok: false };

  if (phone && (!/^[0-9+()\-.\s]+$/.test(phone) || (phone.match(/\d/g) || []).length < 7 || (phone.match(/\d/g) || []).length > 15)) return { ok: false };

  const words = message.split(/\s+/).filter(Boolean).length;
  const foreign = (message.match(FOREIGN) || []).length;
  if (!message || foreign >= 3) return { ok: false };
  if (message.length < 15 || words < 3 || message.length > 3000) return { ok: false };
  if (LINK.test(message) || SPAM.test(message) || SPAM.test(name)) return { ok: false };
  if (message.toLowerCase() === name.toLowerCase()) return { ok: false };
  if (/\S{45,}/.test(message.replace(/\S+@\S+/g, ""))) return { ok: false };

  return { ok: true, value: { name: name, email: email, phone: phone, message: message } };
}
