# Hashein Uganda application fee update

## Frontend flow
The site is plain HTML, CSS and JavaScript — there is no build step. Pages are `index.html`, `signup.html` and the standalone `marzpay.html`; shared content lives in `js/data.js`.

- The application form now moves from details to a fixed UGX 5,000 mobile-money payment.
- It starts payment with the existing MarzPay `/collect-money` endpoint and polls `/payment-status/:reference`.
- Only after the browser sees a paid status does it POST the form to `/submit-application`.
- A success screen is shown only when the server returns an `applicationId`.

## Required server-side step
The browser code is not, by itself, server validation. Merge `server/submit-application-route.js` into the existing Cloudflare Worker that serves `marzpay-api.investinginaionline.workers.dev`, routing `POST /submit-application` to `handleSubmitApplication(request, env)`. Bind a KV namespace as `APPLICATIONS_KV`.

Important: this handler assumes the existing `/payment-status/:reference` response includes a provider-confirmed status and amount (`data.status` / `data.transaction.status` and `data.amount` / `data.transaction.amount`). Verify those fields against your actual MarzPay response before deployment. It fails closed if the provider amount is missing. If the response uses a different shape, adapt the field mapping based on the real response; do not trust an amount sent by the browser.

For production, use Cloudflare D1 with a UNIQUE constraint on `payment_reference` (or a Durable Object) instead of KV for one-time reference claiming, because KV does not provide atomic compare-and-set. Add an `OPTIONS` branch in the existing Worker's top-level router for browser CORS preflight, and restrict `Access-Control-Allow-Origin` to your real deployed Hashein website origin; the sample uses `*` for easy testing and should not be left that way in production.

## Payment endpoint contract
The frontend expects:
- `POST /collect-money` → `{ status: "success", data: { transaction: { reference } } }` or `{ status: "success", data: { reference } }`
- `GET /payment-status/:reference` → `{ status: "success", data: { status: "paid", amount: 5000 } }` (amount may be `data.transaction.amount`)
- `POST /submit-application` → `{ status: "success", applicationId: "HAS-..." }`

The uploaded MarzPay page originally accepted a user-editable amount. The updated `marzpay.html` uses a fixed UGX 5,000 display and sends 5000 from JavaScript, but **the Worker must also enforce the amount server-side** in `/collect-money`; never rely on a hidden field or JavaScript constant for price security.


## Email notifications
- After the server confirms the UGX 5,000 payment and records the application, the applicant receives a confirmation email with the application ID and payment reference.
- The same application details are sent to the configured Hashein Uganda inbox.
- Both emails are sent from `js/signup.js` only after `/submit-application` returns an `applicationId`.
- In `js/data.js`, replace `YOUR_EMAIL_HERE@example.com` with the real Hashein Uganda email address. While the placeholder is present, team notifications are skipped and the site's email links stay hidden. This same address is used by the contact section.
- The frontend sends `{ to, subject, html }` to `https://round-smoke-cd6a.geraldsaviour623.workers.dev`. Ensure that Worker accepts this POST format, allows requests from the deployed site with CORS, and has its email provider credentials stored as Worker secrets—not in browser JavaScript.
- The email request is made from the browser, so the email Worker should validate recipients, rate-limit requests, and restrict CORS. For stronger abuse protection, move pre-payment notification delivery behind a server endpoint.
