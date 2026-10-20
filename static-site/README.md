# Hashein Uganda — plain static site

This folder is the deployed website. It uses only HTML, CSS and browser JavaScript; there are no React components or frontend build step.

Files:
- `index.html` — home page
- `signup.html` — application, email-review and payment steps
- `css/style.css` — responsive styling
- `js/site.js` — page interactions, application form, email and payment requests

The GitHub Pages workflow copies the existing approved image/font assets into `assets/` before publishing. To run locally after cloning the repository, copy:
- `hashein-email-integration/public/images/hashein-hero.jpg`
- `hashein-email-integration/public/images/hashein-skills.jpg`
- `hashein-email-integration/public/favicon.svg`
- `hashein-email-integration/src/assets/dm-sans-latin.woff2`
- `hashein-email-integration/src/assets/manrope-latin.woff2`
into `static-site/assets/`.

The email and MarzPay API endpoints are external services and must be deployed, configured for the published site origin, and tested separately. GitHub Pages does not run server-side code.
