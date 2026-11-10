# Contact form worker

This is not live. The website still sends the contact form the way it does today until you change one switch in `assets/site.js`.

The worker checks a Cloudflare Turnstile token, rejects spam, and only then sends the email through Resend. The Turnstile secret and the Resend API key stay in Cloudflare. They are never put in the website.

You need a free Cloudflare account and a free Resend account. Nothing here changes DNS for you. Resend will ask you to add its own DNS records before it will send from your domain.

## 1. Cloudflare Turnstile

1. Sign in at https://dash.cloudflare.com/
2. Open **Turnstile**, then **Add widget**.
3. Widget name: `Business Movers Technology`.
4. Add the hostnames `businessmoverstechnology.com` and `www.businessmoverstechnology.com`.
5. Widget mode: **Managed**.
6. Copy the **Site key** and the **Secret key**. Keep the secret key for the next step. The site key is public and goes in the website later.

## 2. Resend

1. Create an account at https://resend.com/
2. Add a domain you control. `businessmoverstechnology.com` or `businessmovers.tech` both work. Resend shows DNS records. Add those at the company that hosts your DNS. This repository does not change DNS.
3. Wait until Resend says the domain is verified.
4. Create an API key that is allowed to send email. Copy it once. Resend will not show it again.

## 3. Deploy the worker

On your computer, in the `workers/contact` folder:

```bash
npx wrangler login
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put RESEND_API_KEY
```

Paste the Turnstile secret at the first prompt and the Resend API key at the second. Wrangler stores them in Cloudflare, not in this folder.

Open `wrangler.toml`. `MAIL_TO` is already `email@businessmovers.tech`. Change `MAIL_FROM` if you need to, but it must be an address on the domain you verified in Resend. Example: `Business Movers Technology <website@businessmoverstechnology.com>`.

Optional, recommended: remember repeat visitors and refuse floods.

```bash
npx wrangler kv namespace create BMT_RATE
```

Copy the id it prints into `wrangler.toml`, replacing the commented `kv_namespaces` block with:

```toml
[[kv_namespaces]]
binding = "BMT_RATE"
id = "the-id-wrangler-printed"
```

Then deploy:

```bash
npx wrangler deploy
```

Copy the `https://bmt-contact.<your-account>.workers.dev` address it prints.

## 4. Turn the website switch on

In `assets/site.js`, near the top, the block looks like this:

```javascript
var BMT_FORM = {
  transport: "formsubmit",
  workerUrl: "",
  turnstileSiteKey: ""
};
```

Change it to:

```javascript
var BMT_FORM = {
  transport: "worker",
  workerUrl: "https://bmt-contact.<your-account>.workers.dev",
  turnstileSiteKey: "the-turnstile-site-key"
};
```

Leave `transport` as `"formsubmit"` until the worker URL and the site key are both filled in. If either one is missing, the site stays on the current form, so a half-finished edit will not take the form down.

Publish that change the usual way (merge to `main` after you have reviewed it). Then open the contact page and send a test to yourself.

Most people will not see a puzzle. Turnstile only shows a check when it is unsure. A direct post to the worker, without a token from your site, is refused.

The content security policy already allows `https://*.workers.dev` and `https://challenges.cloudflare.com`. If you later move the worker onto your own hostname, add that exact `https://...` address to `connect-src` in the Content-Security-Policy tag on every page. Staying on `workers.dev` needs no policy edit.

## 5. Retire the old FormSubmit form

The current form key is inside `assets/site.js`. Anyone can read it and post straight to FormSubmit, which skips the checks in the browser. It is also in the git history. Making the repository private does not hide it, because the live site serves the file.

After the new form has delivered a real test message:

1. Write to FormSubmit and ask them to disable the old form endpoint.
2. In the privacy policy, name Cloudflare (the spam check) and Resend (email delivery) where it talks about the contact form provider.

Until FormSubmit disables the old endpoint, that old address still accepts mail even though the website no longer uses it.

## If something goes wrong

Set `transport` back to `"formsubmit"` and publish. The current form works again. Use that only as a rollback. The old key is still readable in the site.
