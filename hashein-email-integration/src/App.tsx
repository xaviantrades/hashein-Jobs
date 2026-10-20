import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Menu,
  Mail,
  Phone,
  Plus,
  UserPlus,
  X,
} from "lucide-react";
import { Brand, Reveal, SectionLabel } from "./components";
import {
  ADMIN_EMAIL,
  OTHER_ROLE,
  navigation,
  categories,
  destinations,
  steps,
  faqs,
} from "./content";

// Images live in /public/images, so they work in dev and in the build.
const heroImage = `${import.meta.env.BASE_URL}images/hashein-hero.jpg`;
const skillsImage = `${import.meta.env.BASE_URL}images/hashein-skills.jpg`;

const SIGNUP_PAGE = "signup.html";

function signupUrl(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  return query ? `${SIGNUP_PAGE}?${query}` : SIGNUP_PAGE;
}

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0].id);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const reducedMotion = useReducedMotion();

  const activeCategory = categories.find((category) => category.id === activeCategoryId) ?? categories[0];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  // Scroll to a section after the menu has closed. Done by hand because the body is
  // locked (overflow: hidden) while the menu is open, which blocks normal #anchor jumps.
  function goToSection(event: ReactMouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith("#")) return;
    event.preventDefault();
    setMenuOpen(false);
    window.setTimeout(() => {
      const target = href === "#top" ? document.body : document.querySelector(href);
      target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      if (history.replaceState) history.replaceState(null, "", href);
    }, 60);
  }

  function chooseRole(categoryName: string, role: string) {
    window.location.href = signupUrl({ category: categoryName, role });
  }

  function chooseDestination(destination: string) {
    window.location.href = signupUrl({ destination });
  }

  function handleCategoryKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex = index;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % categories.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (index - 1 + categories.length) % categories.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = categories.length - 1;
    else return;

    event.preventDefault();
    setActiveCategoryId(categories[nextIndex].id);
    document.getElementById(`category-tab-${categories[nextIndex].id}`)?.focus();
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>

      <header className={`site-header${scrolled || menuOpen ? " site-header--solid" : ""}${menuOpen ? " site-header--menu-open" : ""}`}>
        <div className="page-container header-inner">
          <Brand onClick={() => setMenuOpen(false)} />

          <nav className="desktop-nav" aria-label="Main navigation">
            {navigation.map((item) => <a key={item.href} href={item.href} onClick={(event) => goToSection(event, item.href)}>{item.label}</a>)}
          </nav>

          <a className="header-cta" href={signupUrl()}>
            Sign up <ArrowUpRight size={17} strokeWidth={1.9} aria-hidden="true" />
          </a>

          <button
            className="menu-toggle"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            {menuOpen ? <X size={27} strokeWidth={1.6} /> : <Menu size={27} strokeWidth={1.6} />}
          </button>
        </div>
      </header>

      {/* Rendered outside <header>: the header uses backdrop-filter, which would otherwise
          shrink this fixed panel to the header's height and make the menu look empty. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="mobile-navigation"
            className="mobile-nav"
            aria-label="Mobile navigation"
            initial={reducedMotion ? false : { opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -14 }}
            transition={{ duration: 0.25 }}
          >
            {navigation.map((item, index) => (
              <a key={item.href} href={item.href} onClick={(event) => goToSection(event, item.href)}>
                <span>0{index + 1}</span>{item.label}<ArrowUpRight size={19} aria-hidden="true" />
              </a>
            ))}
            <a className="mobile-nav-apply" href={signupUrl()} onClick={() => setMenuOpen(false)}>
              Sign up <ArrowRight size={20} aria-hidden="true" />
            </a>
          </motion.nav>
        )}
      </AnimatePresence>

      <main id="main">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <img className="hero-image" src={heroImage} alt="A professional traveler walking through a modern airport" fetchPriority="high" />
          <div className="hero-overlay" aria-hidden="true" />

          <div className="page-container hero-inner">
            <div className="hero-copy">
              <motion.h1
                id="hero-title"
                className="hero-title"
                initial={reducedMotion ? false : { opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                Hashein<br />Uganda<span>.</span>
              </motion.h1>

              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="hero-headline">A world of work is within reach.</p>
                <p className="hero-description">
                  Connecting people from East Africa and beyond with opportunities in the UAE, the Middle East, China and Turkey.
                </p>
                <div className="hero-actions">
                  <a className="button button--accent" href={signupUrl()}>
                    Sign up <UserPlus size={19} strokeWidth={1.8} aria-hidden="true" />
                  </a>
                  <a className="hero-text-link" href="#opportunities" onClick={(event) => goToSection(event, "#opportunities")}>
                    Explore opportunities <ArrowDown size={17} strokeWidth={1.8} aria-hidden="true" />
                  </a>
                  <a className="hero-text-link" href="#process" onClick={(event) => goToSection(event, "#process")}>
                    How it works <ArrowDown size={17} strokeWidth={1.8} aria-hidden="true" />
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="intro-section section-pad" id="about" aria-labelledby="intro-title">
          <div className="page-container intro-grid">
            <Reveal>
              <SectionLabel>THE CONNECTION</SectionLabel>
              <h2 className="section-heading intro-heading" id="intro-title">
                Good work shouldn't have borders<span className="heading-dot">.</span>
              </h2>
            </Reveal>
            <Reveal className="intro-aside" delay={0.12}>
              <p className="intro-lead">
                Your ability matters. So does having someone to help you take it further.
              </p>
              <p>
                Hashein Uganda is a UAE-based recruitment company connecting job seekers in Uganda, across East Africa and beyond with employers overseas. From finding the right field to understanding the paperwork, we're here to help you navigate what comes next.
              </p>
              <a className="text-link" href="#process" onClick={(event) => goToSection(event, "#process")}>Get to know our approach <ArrowUpRight size={18} aria-hidden="true" /></a>
            </Reveal>
          </div>
        </section>

        <section className="opportunities-section section-pad" id="opportunities" aria-labelledby="opportunities-title">
          <div className="page-container">
            <div className="section-head">
              <Reveal>
                <SectionLabel>OPPORTUNITIES</SectionLabel>
                <h2 className="section-heading" id="opportunities-title">There's a place for your skills<span className="heading-dot">.</span></h2>
              </Reveal>
              <Reveal className="section-head-description" delay={0.12}>
                <p>Explore the fields we recruit for. Select a role to begin an enquiry; specific openings depend on employer needs.</p>
              </Reveal>
            </div>

            <div className="opportunity-browser">
              <div className="category-tabs" role="tablist" aria-label="Work categories" aria-orientation="vertical">
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    id={`category-tab-${category.id}`}
                    type="button"
                    className={`category-tab${activeCategoryId === category.id ? " category-tab--active" : ""}`}
                    role="tab"
                    aria-selected={activeCategoryId === category.id}
                    aria-controls="category-panel"
                    tabIndex={activeCategoryId === category.id ? 0 : -1}
                    onClick={() => setActiveCategoryId(category.id)}
                    onKeyDown={(event) => handleCategoryKeyDown(event, index)}
                  >
                    <span className="category-number">0{index + 1}</span>
                    <span className="category-text">
                      <span className="category-title">{category.name}</span>
                      <span className="category-description">{category.description}</span>
                    </span>
                    <ArrowUpRight className="category-arrow" size={19} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                ))}
              </div>

              <div className="roles-panel" id="category-panel" role="tabpanel" aria-labelledby={`category-tab-${activeCategory.id}`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory.id}
                    initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.23 }}
                  >
                    <span className="roles-eyebrow">EXPLORE THIS FIELD</span>
                    <h3 className="roles-heading">{activeCategory.name}<span>.</span></h3>
                    <p className="roles-description">Select a role to pre-fill your application.</p>
                    <div className="roles-grid">
                      {activeCategory.roles.map((role) => (
                        <button key={role} className="role-button" type="button" onClick={() => chooseRole(activeCategory.name, role)}>
                          <span>{role}</span><ArrowUpRight size={18} strokeWidth={1.7} aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                    <p className="roles-footnote">
                      Don't see your role?{" "}
                      <button type="button" onClick={() => chooseRole("Specialist & other roles", OTHER_ROLE)}>Tell us what you do <ArrowRight size={15} aria-hidden="true" /></button>
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        <section className="destinations-section section-pad" id="destinations" aria-labelledby="destinations-title">
          <div className="destination-rings" aria-hidden="true" />
          <div className="page-container destinations-grid">
            <Reveal className="destinations-intro">
              <SectionLabel light>WHERE WE CONNECT</SectionLabel>
              <h2 className="section-heading section-heading--light" id="destinations-title">Your next chapter could begin somewhere new<span className="heading-dot">.</span></h2>
              <p>Based in the UAE and rooted in East Africa, we connect candidates with potential opportunities across these destinations.</p>
            </Reveal>
            <Reveal className="destination-list" delay={0.13}>
              {destinations.map((destination) => (
                <button key={destination.value} type="button" className="destination-item" onClick={() => chooseDestination(destination.value)} aria-label={`Enquire about opportunities in ${destination.name}`}>
                  <span className="destination-name">
                    {destination.name}
                    {destination.detail && <span className="destination-detail">{destination.detail}</span>}
                  </span>
                  <ArrowUpRight size={21} strokeWidth={1.6} aria-hidden="true" />
                </button>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="process-section section-pad" id="process" aria-labelledby="process-title">
          <div className="page-container">
            <Reveal className="process-header">
              <SectionLabel>HOW IT WORKS</SectionLabel>
              <h2 className="section-heading" id="process-title">A clearer path forward<span className="heading-dot">.</span></h2>
              <p>One step at a time, from your first enquiry to understanding what comes next.</p>
            </Reveal>
            <div className="process-list">
              {steps.map((step) => (
                <Reveal className="process-row" key={step.number}>
                  <span className="process-number">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <ArrowUpRight className="process-arrow" size={20} strokeWidth={1.5} aria-hidden="true" />
                </Reveal>
              ))}
            </div>
            <p className="process-note">All opportunities are subject to employer selection and applicable immigration requirements.</p>
          </div>
        </section>

        <section className="requirements-section" id="requirements" aria-labelledby="requirements-title">
          <div className="requirements-photo">
            <img src={skillsImage} alt="A skilled construction professional at work on a building site" loading="eager" />
          </div>
          <div className="requirements-content">
            <Reveal>
              <SectionLabel>BEFORE YOU APPLY</SectionLabel>
              <h2 className="section-heading" id="requirements-title">Start with what you have<span className="heading-dot">.</span></h2>
              <p className="requirements-intro">There's no one-size-fits-all qualification. What you need depends on the work you want to do.</p>
            </Reveal>

            <Reveal className="requirements-block" delay={0.08}>
              <h3>Qualifications</h3>
              <p>We consider a range of backgrounds: S.4 and S.6 certificates for Ugandan applicants, vocational and professional certificates, diplomas, bachelor's and master's degrees, and practical experience for suitable roles.</p>
            </Reveal>

            <Reveal className="requirements-block" delay={0.12}>
              <h3>What to have ready</h3>
              <ul className="document-list">
                <li>National ID or other valid identification</li>
                <li>Passport, if you already have one</li>
                <li>Education or training records when required for the role</li>
                <li>Your date of birth and basic personal details</li>
              </ul>
            </Reveal>

            <Reveal className="passport-help" delay={0.16}>
              <h3>No passport or visa yet?</h3>
              <p>You can still start here. Our team can advise eligible applicants on passport applications and visa processing. Final approvals are made by the relevant authorities.</p>
              <a className="text-link" href={signupUrl()}>Sign up now <ArrowUpRight size={18} aria-hidden="true" /></a>
            </Reveal>
          </div>
        </section>

        <section className="application-section section-pad" id="signup" aria-labelledby="application-title">
          <div className="page-container signup-cta">
            <Reveal className="application-intro">
              <SectionLabel light>YOUR NEXT STEP</SectionLabel>
              <h2 className="section-heading section-heading--light" id="application-title">Let's make a move<span className="heading-dot">.</span></h2>
              <p>Tell us about the work you're looking for. Complete the online form and receive email updates from the Hashein Uganda team.</p>
            </Reveal>
            <Reveal className="signup-cta-actions" delay={0.12}>
              <a className="button button--accent" href={signupUrl()}>
                Sign up <UserPlus size={19} strokeWidth={1.8} aria-hidden="true" />
              </a>
              <div className="application-side-contact">
                <span>Prefer a conversation?</span>
                <a href="tel:+256780611480">Call +256 780 611 480 <ArrowUpRight size={17} aria-hidden="true" /></a>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="faq-section section-pad" id="faqs" aria-labelledby="faq-title">
          <div className="page-container faq-grid">
            <Reveal className="faq-intro">
              <SectionLabel>GOOD TO KNOW</SectionLabel>
              <h2 className="section-heading" id="faq-title">Questions? Let's clear things up<span className="heading-dot">.</span></h2>
              <p>Here are a few things people often ask before taking the first step.</p>
            </Reveal>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div className="faq-item" key={faq.question}>
                  <button type="button" className="faq-question" aria-expanded={openFaq === index} aria-controls={`faq-answer-${index}`} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                    <span>{faq.question}</span><Plus className={openFaq === index ? "faq-plus faq-plus--open" : "faq-plus"} size={20} strokeWidth={1.7} aria-hidden="true" />
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === index && (
                      <motion.div
                        id={`faq-answer-${index}`}
                        className="faq-answer"
                        initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                      >
                        <p>{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-section section-pad" id="contact" aria-labelledby="contact-title">
          <div className="page-container contact-grid">
            <Reveal>
              <SectionLabel>LET'S CONNECT</SectionLabel>
              <h2 className="section-heading" id="contact-title">It starts with a conversation<span className="heading-dot">.</span></h2>
              <p>Looking for work, or looking for people? We'd be glad to hear from you.</p>
            </Reveal>
            <Reveal className="contact-details" delay={0.12}>
              <span className="contact-mini-label">CALL US DIRECTLY</span>
              <a className="contact-phone" href="tel:+256780611480">+256 780 611 480 <ArrowUpRight size={31} strokeWidth={1.5} aria-hidden="true" /></a>
              <div className="contact-lower">
                <div>
                  <span className="contact-mini-label">VISIT IN KAMPALA</span>
                  <address>Ham Towers, Plot 220<br />Kampala, Uganda</address>
                  <a className="contact-small-link" href="https://www.google.com/maps/search/?api=1&query=Ham+Towers+Plot+220+Kampala+Uganda" target="_blank" rel="noopener noreferrer"><MapPin size={16} aria-hidden="true" /> Get directions <ArrowUpRight size={15} aria-hidden="true" /></a>
                </div>
                <div>
                  <span className="contact-mini-label">MESSAGE US</span>
                  <p>Candidate or employer, our team is just a message away.</p>
                  <a className="contact-small-link" href={`mailto:${ADMIN_EMAIL}`}><Mail size={16} aria-hidden="true" /> Email Hashein Uganda <ArrowUpRight size={15} aria-hidden="true" /></a>
                  <a className="contact-small-link" href="tel:+256780611480"><Phone size={16} aria-hidden="true" /> +256 780 611 480</a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-container footer-main">
          <div className="footer-brand"><Brand /><p>Connecting people, possibilities and places.</p></div>
          <div className="footer-links">
            <div><span>EXPLORE</span><a href="#opportunities" onClick={(event) => goToSection(event, "#opportunities")}>Opportunities</a><a href="#destinations" onClick={(event) => goToSection(event, "#destinations")}>Destinations</a><a href="#process" onClick={(event) => goToSection(event, "#process")}>How it works</a><a href="#requirements" onClick={(event) => goToSection(event, "#requirements")}>Requirements</a></div>
            <div><span>GET IN TOUCH</span><a href={signupUrl()}>Sign up</a><a href="tel:+256780611480">Call our team</a><a href={`mailto:${ADMIN_EMAIL}`}>Email us</a><a href="#contact" onClick={(event) => goToSection(event, "#contact")}>Visit us</a><a href="#faqs" onClick={(event) => goToSection(event, "#faqs")}>FAQs</a></div>
          </div>
        </div>
        <div className="page-container footer-bottom">
          <span>&copy; {new Date().getFullYear()} Hashein Uganda. All rights reserved.</span>
          <span>UAE-based recruitment. Kampala-connected.</span>
          <a href="tel:+256780611480"><Phone size={14} aria-hidden="true" /> +256 780 611 480</a>
        </div>
      </footer>
    </>
  );
}