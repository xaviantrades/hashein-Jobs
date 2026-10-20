import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Phone } from "lucide-react";
import { Brand, Reveal, SectionLabel } from "./components";
import ApplicationForm from "./ApplicationForm";
import { OTHER_ROLE, categories, destinations, type Application } from "./content";

const home = "index.html";

// Reads ?category=...&role=...&destination=... so role/destination buttons on the
// homepage can pre-fill this form. Anything that doesn't match our lists is ignored.
function readPrefill(): Partial<Application> {
  const params = new URLSearchParams(window.location.search);
  const prefill: Partial<Application> = {};

  const category = categories.find((c) => c.name === params.get("category"));
  if (category) {
    prefill.category = category.name;
    const role = params.get("role");
    if (role && (role === OTHER_ROLE || category.roles.includes(role))) prefill.role = role;
  }

  const destination = params.get("destination");
  if (destination && destinations.some((d) => d.value === destination)) prefill.destination = destination;

  return prefill;
}

export default function SignupPage() {
  const [scrolled, setScrolled] = useState(false);
  const prefill = useMemo(readPrefill, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>

      <header className={`site-header site-header--solid${scrolled ? " site-header--scrolled" : ""}`}>
        <div className="page-container header-inner">
          <Brand href={home} />
          <a className="header-cta signup-back" href={home}>
            <ArrowLeft size={17} strokeWidth={1.9} aria-hidden="true" /> Back to home
          </a>
        </div>
      </header>

      <main id="main" className="signup-page">
        <section className="application-section signup-section" aria-labelledby="application-title">
          <div className="page-container application-grid">
            <Reveal className="application-intro">
              <SectionLabel light>SIGN UP</SectionLabel>
              <h1 className="section-heading section-heading--light" id="application-title">
                Let's make a move<span className="heading-dot">.</span>
              </h1>
              <p>
                Tell us about the work you're looking for. We'll prepare your enquiry so you can send it directly to the
                Hashein Uganda team by email after you submit your application.
              </p>
              <div className="application-side-contact">
                <span>Prefer a conversation?</span>
                <a href="tel:+256780611480">Call +256 780 611 480 <ArrowUpRight size={17} aria-hidden="true" /></a>
              </div>
            </Reveal>

            <ApplicationForm initial={prefill} />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-container footer-bottom">
          <span>&copy; {new Date().getFullYear()} Hashein Uganda. All rights reserved.</span>
          <span>UAE-based recruitment. Kampala-connected.</span>
          <a href="tel:+256780611480"><Phone size={14} aria-hidden="true" /> +256 780 611 480</a>
        </div>
      </footer>
    </>
  );
}
