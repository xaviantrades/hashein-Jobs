# Hashein Uganda application fee update

## Frontend flow
- Applicants complete the two application-form sections. The second section's button is labelled **Continue**.
- When they continue, the app emails a summary to the email address they entered. The email subject is **Your Hashein Uganda Application Details**; it does not use the heading “Verify your form submission.”
- A manual review screen asks applicants to check their inbox and confirm on the website that they reviewed the summary. This is a manual acknowledgement, not proof of ownership of the email address.
- After acknowledgement, applicants can proceed to the fixed UGX 5,000 mobile-money payment.
- The app polls MarzPay `/payment-status/:reference`, then POSTs the application to `/submit-application` after a paid status is observed.
- After the server returns a successful application ID, the app attempts to email the full submitted application and payment reference to the administrator, and a success message with application ID and payment reference to the applicant.

## Email configuration and limitations
- The administrator email is configured in `src/content.ts` as `geraldsaviour623@gmail.com`.
- The frontend sends `{ to, subject, html }` to `https://round-smoke-cd6a.geraldsaviour623.workers.dev`. Ensure that Worker accepts this POST format, allows requests from the deployed site with CORS, and stores email-provider credentials as Worker secrets—not in browser JavaScript.
- Email delivery is initiated by the browser. The UI checks the HTTP response from the email Worker, but that does not independently prove final inbox delivery. For stronger reliability, move all email sending behind a server endpoint and add delivery logging, recipient validation, rate limiting, and restricted CORS.
- The pre-payment summary contains a summary of application details, not payment information. The administrator notification and applicant success email are attempted only after the application server returns success.

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
