# Hashein Uganda website

Plain HTML, CSS and JavaScript — no framework, no bundler, no build step.

## Structure

```
.
├── index.html          Homepage
├── signup.html         Application form + UGX 5,000 payment
├── marzpay.html        Standalone mobile-money test page
├── css/
│   ├── styles.css      All site styling
│   └── marzpay.css     Styling for the standalone payment page
├── js/
│   ├── data.js         Shared content (roles, destinations, countries, email settings)
│   ├── site.js         Header, mobile menu, smooth anchors, scroll reveals
│   ├── main.js         Homepage: opportunity browser, destinations, FAQ accordion
│   └── signup.js       Sign-up form, payment flow and confirmation emails
├── assets/
│   ├── favicon.svg
│   ├── fonts/          Manrope + DM Sans (SIL Open Font License)
│   └── images/         Hero and skills photography
└── server/
    └── submit-application-route.js   Cloudflare Worker route (see SETUP-AND-WORKER.md)
```

## Running locally

Any static file server works. For example:

```bash
cd hashein-email-integration
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. The pages also open directly from the file
system, but a server is closer to production and avoids browser restrictions on
`file://` requests.

## Deploying

Upload the folder as-is to any static host (GitHub Pages, Cloudflare Pages,
Netlify, S3, cPanel, …). `index.html` is the entry point; `signup.html` is
linked from every sign-up button.

Before going live, follow `SETUP-AND-WORKER.md`:

1. Replace `YOUR_EMAIL_HERE@example.com` in `js/data.js` with the real business email.
2. Deploy `server/submit-application-route.js` to the MarzPay Worker with an
   `APPLICATIONS_KV` binding.
3. Confirm the email Worker accepts requests from the deployed origin.
