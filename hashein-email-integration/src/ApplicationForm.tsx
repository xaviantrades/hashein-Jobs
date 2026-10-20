import { useState, type FormEvent } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { SelectField } from "./components";
import {
  ADMIN_EMAIL,
  EMAIL_WORKER_URL,
  OTHER_ROLE,
  categories,
  destinations,
  eastAfricanCountries,
  otherAfricanCountries,
  educationOptions,
  initialApplication,
  type Application,
} from "./content";

// Build the date in local time. toISOString() uses UTC, which can reject a
// birthday that is valid today for applicants a few hours ahead of UTC.
const adultCutoff = new Date();
adultCutoff.setFullYear(adultCutoff.getFullYear() - 18);
const latestBirthDate = [
  adultCutoff.getFullYear(),
  String(adultCutoff.getMonth() + 1).padStart(2, "0"),
  String(adultCutoff.getDate()).padStart(2, "0"),
].join("-");

const API_BASE = "https://marzpay-api.investinginaionline.workers.dev";
const APPLICATION_FEE = 5000;
// Ugandan mobile numbers are +256 followed by a 9-digit number starting with 7.
const UGANDA_MOBILE = /^\+2567\d{8}$/;

type ApiResponse = {
  status?: string;
  message?: string;
  applicationId?: string;
  data?: {
    reference?: string;
    status?: string;
    transaction?: { reference?: string; status?: string };
  };
};

export default function ApplicationForm({ initial }: { initial?: Partial<Application> }) {
  const [application, setApplication] = useState<Application>({ ...initialApplication, ...initial });
  const [formStep, setFormStep] = useState(1);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  // Set only after MarzPay confirms the money was received. While it is set,
  // retrying skips /collect-money so an applicant can never be charged twice.
  const [confirmedReference, setConfirmedReference] = useState("");
  const [paymentState, setPaymentState] = useState<"idle" | "starting" | "waiting" | "submitting" | "done" | "error">("idle");
  const [summaryEmailState, setSummaryEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [summaryEmailMessage, setSummaryEmailMessage] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [confirmNewPayment, setConfirmNewPayment] = useState(false);
  const reducedMotion = useReducedMotion();

  const applicationCategory = categories.find((category) => category.name === application.category);
  const hasPendingPayment = Boolean(paymentReference) && !confirmedReference;
  const paymentAlreadyConfirmed = Boolean(confirmedReference);

  function updateApplication<K extends keyof Application>(key: K, value: Application[K]) {
    setApplication((current) => ({ ...current, [key]: value }));
  }

  function emailSafe(value: unknown) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
      const escaped: Record<string, string> = {
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
      };
      return escaped[character] || character;
    });
  }

  function applicationEmailHtml(id: string, reference: string) {
    const fields: Array<[string, string]> = [
      ["Application ID", id],
      ["Full name", application.fullName],
      ["Email", application.email],
      ["Phone", application.phone],
      ["Country of origin", application.origin === "Other country" ? application.otherOrigin : application.origin],
      ["Preferred destination", application.destination],
      ["Work category", application.category],
      ["Preferred role", application.role === OTHER_ROLE ? application.otherRole : application.role],
      ["Education", application.education],
      ["Work experience", application.yearsExperience],
      ["Date of birth", application.dateOfBirth],
      ["Passport status", application.passport],
      ["Additional experience", application.experience || "Not provided"],
      ["Payment amount", "UGX 5,000"],
      ["Payment reference", reference],
      ["Mobile-money number", normalizeUgandaPhone(paymentPhone)],
    ];
    return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17252b"><h2>Hashein Uganda application</h2><table style="border-collapse:collapse;width:100%">${fields.map(([label, value]) => `<tr><th align="left" style="padding:8px;border:1px solid #ddd">${emailSafe(label)}</th><td style="padding:8px;border:1px solid #ddd">${emailSafe(value)}</td></tr>`).join("")}</table></div>`;
  }

  async function sendEmail(to: string, subject: string, html: string) {
    if (!to || to.includes("YOUR_EMAIL_HERE")) return;
    const response = await fetch(EMAIL_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });
    if (!response.ok) throw new Error(`Email delivery failed (${response.status}).`);
  }

  function applicationSummaryEmailHtml() {
    const fields: Array<[string, string]> = [
      ["Full name", application.fullName],
      ["Email", application.email],
      ["Phone", application.phone],
      ["Country of origin", application.origin === "Other country" ? application.otherOrigin : application.origin],
      ["Preferred destination", application.destination],
      ["Work category", application.category],
      ["Preferred role", application.role === OTHER_ROLE ? application.otherRole : application.role],
      ["Highest qualification", application.education],
      ["Work experience", application.yearsExperience],
      ["Passport status", application.passport],
      ["Additional experience", application.experience || "Not provided"],
    ];
    return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17252b"><h2>Your Hashein Uganda application summary</h2><p>Hello ${emailSafe(application.fullName)},</p><p>Here is a summary of the details you entered. Please review them and then return to the application page to confirm that you have checked them before continuing to payment.</p><table style="border-collapse:collapse;width:100%">${fields.map(([label, value]) => `<tr><th align="left" style="padding:8px;border:1px solid #ddd">${emailSafe(label)}</th><td style="padding:8px;border:1px solid #ddd">${emailSafe(value)}</td></tr>`).join("")}</table><p>If anything is incorrect, return to the application form and correct it before payment.</p><p>Thank you,<br>Hashein Uganda</p></div>`;
  }

  async function handleApplicationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formStep === 1) {
      setFormStep(2);
      window.setTimeout(() => document.getElementById("application-form")?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth", block: "start",
      }), 30);
      return;
    }
    if (formStep === 2) {
      setSummaryEmailState("sending");
      setSummaryEmailMessage("Sending a summary of your application to your email…");
      try {
        await sendEmail(
          application.email.trim(),
          "Your Hashein Uganda Application Details",
          applicationSummaryEmailHtml()
        );
        setSummaryEmailState("sent");
        setSummaryEmailMessage(`Application summary sent to ${application.email.trim()}. Check your inbox or spam folder, review your details, then confirm below.`);
        setFormStep(3);
      } catch (error) {
        setSummaryEmailState("error");
        setSummaryEmailMessage(error instanceof Error ? error.message : "We could not send your application summary. Please try again.");
      }
      return;
    }
    setPaymentState("idle");
    setPaymentMessage("");
    setConfirmNewPayment(false);
    setFormStep(4);
  }

  function normalizeUgandaPhone(value: string) {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("00256")) digits = digits.slice(2);
    if (digits.startsWith("256")) digits = digits.slice(3);
    else if (digits.startsWith("0")) digits = digits.slice(1);
    return `+256${digits.replace(/^0+/, "")}`;
  }

  async function startPayment(phone: string) {
    const response = await fetch(`${API_BASE}/collect-money`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: `hashein-${crypto.randomUUID()}`,
        phone,
        amount: APPLICATION_FEE,
        purpose: "hashein_application_fee",
      }),
    });
    const data: ApiResponse | null = await response.json().catch(() => null);
    if (!response.ok || data?.status !== "success") {
      throw new Error(data?.message || "Could not start payment. Please try again.");
    }
    const reference = data?.data?.transaction?.reference || data?.data?.reference || "";
    if (!reference) throw new Error("Payment provider did not return a transaction reference.");
    return reference;
  }

  // Returns true when MarzPay confirms the money. Transient status-check
  // failures keep polling instead of abandoning a payment that may be live.
  async function waitForPayment(reference: string) {
    for (let attempt = 0; attempt < 60; attempt++) {
      await new Promise((resolve) => window.setTimeout(resolve, 3000));
      let data: ApiResponse | null = null;
      try {
        const response = await fetch(`${API_BASE}/payment-status/${encodeURIComponent(reference)}`, { cache: "no-store" });
        if (!response.ok) continue;
        data = await response.json().catch(() => null);
      } catch {
        continue;
      }
      if (data?.status !== "success") continue;
      const status = String(data?.data?.status || data?.data?.transaction?.status || "").toLowerCase();
      if (["paid", "successful", "completed"].includes(status)) return true;
      if (["failed", "cancelled", "canceled"].includes(status)) {
        setPaymentReference("");
        throw new Error(`Payment ${status}. You can try again.`);
      }
    }
    return false;
  }

  async function submitApplication(reference: string, phone: string) {
    const payload = {
      application: {
        origin: application.origin === "Other country" ? application.otherOrigin.trim() : application.origin,
        destination: application.destination,
        category: application.category,
        role: application.role === OTHER_ROLE ? application.otherRole.trim() : application.role,
        education: application.education,
        yearsExperience: application.yearsExperience,
        fullName: application.fullName.trim(),
        phone: application.phone.trim(),
        email: application.email.trim(),
        dateOfBirth: application.dateOfBirth,
        passport: application.passport,
        experience: application.experience.trim(),
        consent: application.consent,
      },
      paymentReference: reference,
      paymentPhone: phone,
      amount: APPLICATION_FEE,
    };
    // The server endpoint must independently verify the payment with MarzPay,
    // enforce UGX 5,000 + paid status, prevent reference reuse and persist the form.
    const response = await fetch(`${API_BASE}/submit-application`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data: ApiResponse | null = await response.json().catch(() => null);
    if (!response.ok || data?.status !== "success" || !data.applicationId) {
      throw new Error(data?.message || "Payment was detected, but the server could not validate and record your application. Contact support with your payment reference.");
    }
    return String(data.applicationId);
  }

  async function payAndSubmit() {
    if (isPaying) return;
    setConfirmNewPayment(false);
    const phone = normalizeUgandaPhone(paymentPhone);
    if (!UGANDA_MOBILE.test(phone)) {
      setPaymentState("error");
      setPaymentMessage("Enter a valid MTN or Airtel Uganda mobile-money number, for example 0771234567.");
      return;
    }

    setIsPaying(true);
    let paidReference = confirmedReference;
    let paymentWasConfirmed = Boolean(confirmedReference);
    try {
      if (!paidReference && paymentReference) {
        // A previous attempt has a reference: check it before charging again.
        setPaymentState("waiting");
        setPaymentMessage("Checking the status of your UGX 5,000 payment…");
        if (!(await waitForPayment(paymentReference))) {
          throw new Error(`We have not received confirmation for payment reference ${paymentReference} yet. Check your mobile-money messages before starting a new payment.`);
        }
        paidReference = paymentReference;
        paymentWasConfirmed = true;
        setConfirmedReference(paymentReference);
      } else if (!paidReference) {
        setPaymentState("starting");
        setPaymentMessage("Starting your UGX 5,000 application fee payment…");
        const reference = await startPayment(phone);
        paidReference = reference;
        setPaymentReference(reference);
        setPaymentState("waiting");
        setPaymentMessage("Payment prompt sent. Approve UGX 5,000 on your phone. Keep this page open.");
        if (!(await waitForPayment(reference))) {
          throw new Error(`We have not received confirmation for payment reference ${reference} yet. Check your mobile-money messages before starting a new payment.`);
        }
        paymentWasConfirmed = true;
        setConfirmedReference(reference);
      }

      setPaymentState("submitting");
      setPaymentMessage("Payment confirmed. Securely submitting your application…");
      const newApplicationId = await submitApplication(paidReference, phone);
      setApplicationId(newApplicationId);
      setPaymentState("done");
      setPaymentMessage("Your form was submitted to Hashein Uganda successfully.");

      const emailResults = await Promise.allSettled([
        sendEmail(
          application.email.trim(),
          "Your form was submitted to Hashein Uganda successfully",
          `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17252b"><h2>Application submitted successfully</h2><p>Hello ${emailSafe(application.fullName)},</p><p>Your form was submitted to Hashein Uganda successfully. We have confirmed your UGX 5,000 application fee and recorded your application.</p><p><strong>Application ID:</strong> ${emailSafe(newApplicationId)}</p><p><strong>Payment reference:</strong> ${emailSafe(paidReference)}</p><p>Thank you,<br>Hashein Uganda</p></div>`
        ),
        sendEmail(
          ADMIN_EMAIL,
          `New Hashein Uganda application: ${application.fullName.trim() || newApplicationId}`,
          applicationEmailHtml(newApplicationId, paidReference)
        ),
      ]);
      for (const result of emailResults) {
        if (result.status === "rejected") console.error("Application email could not be sent.", result.reason);
      }
    } catch (error) {
      setPaymentState("error");
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setPaymentMessage(paymentWasConfirmed ? `${message} Your payment was already received, so retrying will not charge you again.` : message);
    } finally {
      setIsPaying(false);
    }
  }

  // Escape hatch for a genuinely unpaid prompt. Calling /collect-money again
  // while a prompt may still be live is how applicants end up charged twice,
  // so this always asks for an explicit second confirmation first.
  function startNewPayment() {
    if (isPaying) return;
    setConfirmNewPayment(true);
  }

  function confirmStartNewPayment() {
    setPaymentReference("");
    setPaymentState("idle");
    setPaymentMessage("");
    setConfirmNewPayment(false);
  }

  function resetApplication() {
    setApplication(initialApplication);
    setPaymentPhone("");
    setPaymentReference("");
    setConfirmedReference("");
    setPaymentState("idle");
    setPaymentMessage("");
    setApplicationId("");
    setConfirmNewPayment(false);
    setFormStep(1);
  }

  return (
    <div className="application-panel" id="application-form">
              {paymentState === "done" ? (
                <div className="application-confirmation" role="status" aria-live="polite">
                  <span className="confirmation-check"><Check size={25} strokeWidth={1.8} aria-hidden="true" /></span>
                  <span className="form-eyebrow">APPLICATION SUBMITTED</span>
                  <h3>You're all set.</h3>
                  <p>Your UGX 5,000 payment was verified and your application was recorded by the server.</p>
                  <p><strong>Application ID:</strong> {applicationId}</p>
                  <p><strong>Payment reference:</strong> {paymentReference}</p>
                  <button className="restart-button" type="button" onClick={resetApplication}>Start another application <ArrowRight size={16} aria-hidden="true" /></button>
                </div>
              ) : formStep === 4 ? (
                <form
                  className="application-confirmation payment-step"
                  onSubmit={(event) => { event.preventDefault(); void payAndSubmit(); }}
                >
                  <span className="form-eyebrow">APPLICATION FEE</span>
                  <h3>Complete your application</h3>
                  <p>Your application fee is a fixed <strong>UGX 5,000</strong>. Enter the MTN or Airtel Uganda number that should receive the payment prompt.</p>
                  <label className="form-field form-field--wide">
                    <span className="field-label">Mobile Money number <span aria-hidden="true">*</span></span>
                    <input type="tel" inputMode="tel" autoComplete="tel" value={paymentPhone} onChange={(event) => setPaymentPhone(event.target.value)} placeholder="0771234567 or +256771234567" required disabled={isPaying} />
                  </label>
                  <div className="form-payment-summary"><span>Application fee</span><strong>UGX 5,000</strong></div>
                  {paymentReference && <p><strong>Payment reference:</strong> {paymentReference}</p>}
                  {paymentMessage && <p className={`payment-status payment-status--${paymentState}`} role="status" aria-live="polite">{paymentMessage}</p>}
                  <button className="button button--dark form-submit" type="submit" disabled={isPaying}>
                    {isPaying ? "Please wait…" : paymentAlreadyConfirmed ? "Retry submission" : hasPendingPayment ? "Check payment again" : paymentState === "error" ? "Try payment again" : "Pay UGX 5,000 & submit"}
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </button>
                  {hasPendingPayment && !isPaying && (
                    confirmNewPayment ? (
                      <div className="payment-confirm">
                        <p>Only continue if you have not already been charged. Starting a new payment can charge you a second time.</p>
                        <div className="payment-confirm-actions">
                          <button className="restart-button" type="button" onClick={confirmStartNewPayment}>Yes, start a new payment</button>
                          <button className="restart-button" type="button" onClick={() => setConfirmNewPayment(false)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button className="restart-button" type="button" onClick={startNewPayment}>Start a new payment <ArrowRight size={16} aria-hidden="true" /></button>
                    )
                  )}
                  <button className="restart-button" type="button" disabled={isPaying} onClick={() => { setPaymentState("idle"); setPaymentMessage(""); setConfirmNewPayment(false); setFormStep(2); }}>Back to application <ArrowRight size={16} aria-hidden="true" /></button>
                </form>
              ) : formStep === 3 ? (
                <div className="application-confirmation review-step" role="status" aria-live="polite">
                  <span className="form-eyebrow">CHECK YOUR EMAIL</span>
                  <h3>Review your application details</h3>
                  <p>{summaryEmailMessage}</p>
                  <p>Open the email sent to <strong>{application.email}</strong> and check the summary carefully. This is a manual review step; clicking below confirms that you have reviewed the details, but does not independently verify ownership of the email address.</p>
                  {summaryEmailState === "error" && <button className="button button--dark form-submit" type="button" onClick={() => { setSummaryEmailState("idle"); setSummaryEmailMessage(""); setFormStep(2); }}>Return to form and retry email <ArrowRight size={18} aria-hidden="true" /></button>}
                  <button className="button button--dark form-submit" type="button" disabled={summaryEmailState !== "sent"} onClick={() => { setPaymentState("idle"); setPaymentMessage(""); setConfirmNewPayment(false); setFormStep(4); }}>I've reviewed my email — continue to payment <ArrowUpRight size={18} aria-hidden="true" /></button>
                  <button className="restart-button" type="button" onClick={() => { setSummaryEmailState("idle"); setSummaryEmailMessage(""); setFormStep(2); }}>Back to application details <ArrowRight size={16} aria-hidden="true" /></button>
                </div>
              ) : (
                <>
                  <div className="form-topline"><span>APPLICATION ENQUIRY</span><span>STEP 0{formStep} / 02</span></div>
                  <div className="form-progress" aria-hidden="true"><span style={{ width: formStep === 1 ? "50%" : "100%" }} /></div>
                  <h3 className="form-heading">{formStep === 1 ? "The opportunity" : "A little about you"}</h3>
                  <p className="form-subheading">{formStep === 1 ? "Where are you from, and what kind of work are you looking for?" : "How can our team reach you? Fields marked * are required."}</p>

                  <form onSubmit={handleApplicationSubmit}>
                    {formStep === 1 ? (
                      <div className="form-grid">
                        <SelectField label="Country of origin" value={application.origin} onChange={(value) => { updateApplication("origin", value); if (value !== "Other country") updateApplication("otherOrigin", ""); }} placeholder="Select your country">
                          <optgroup label="East Africa">
                            {eastAfricanCountries.map((country) => <option key={country} value={country}>{country}</option>)}
                          </optgroup>
                          <optgroup label="Other African countries">
                            {otherAfricanCountries.map((country) => <option key={country} value={country}>{country}</option>)}
                          </optgroup>
                          <option value="Other country">Other country</option>
                        </SelectField>

                        <SelectField label="Preferred destination" value={application.destination} onChange={(value) => updateApplication("destination", value)} placeholder="Where would you like to work?">
                          {destinations.map((destination) => <option key={destination.value} value={destination.value}>{destination.name}</option>)}
                          <option value="Open to suitable destinations">Open to suitable destinations</option>
                        </SelectField>

                        {application.origin === "Other country" && (
                          <label className="form-field form-field--wide">
                            <span className="field-label">Please specify your country <span aria-hidden="true">*</span></span>
                            <input type="text" value={application.otherOrigin} onChange={(event) => updateApplication("otherOrigin", event.target.value)} placeholder="Your country of origin" required maxLength={80} />
                          </label>
                        )}

                        <SelectField label="Work category" value={application.category} onChange={(value) => setApplication((current) => ({ ...current, category: value, role: "", otherRole: "" }))} placeholder="Choose a field">
                          {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                        </SelectField>

                        <SelectField label="Preferred role" value={application.role} onChange={(value) => { updateApplication("role", value); if (value !== OTHER_ROLE) updateApplication("otherRole", ""); }} placeholder={application.category ? "Choose a role" : "Choose a field first"} disabled={!application.category}>
                          {applicationCategory?.roles.map((role) => <option key={role} value={role}>{role}</option>)}
                          {application.category !== "Specialist & other roles" && <option value={OTHER_ROLE}>{OTHER_ROLE}</option>}
                        </SelectField>

                        {application.role === OTHER_ROLE && (
                          <label className="form-field form-field--wide">
                            <span className="field-label">Tell us your preferred role <span aria-hidden="true">*</span></span>
                            <input type="text" value={application.otherRole} onChange={(event) => updateApplication("otherRole", event.target.value)} placeholder="e.g. Graphic designer" required maxLength={100} />
                          </label>
                        )}

                        <SelectField label="Highest qualification" value={application.education} onChange={(value) => updateApplication("education", value)} placeholder="Choose your qualification">
                          {educationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </SelectField>

                        <SelectField label="Work experience" value={application.yearsExperience} onChange={(value) => updateApplication("yearsExperience", value)} placeholder="Select your experience">
                          {["Just starting out", "Less than 1 year", "1-2 years", "3-5 years", "6 years or more"].map((option) => <option key={option} value={option}>{option}</option>)}
                        </SelectField>
                      </div>
                    ) : (
                      <div className="form-grid">
                        <label className="form-field form-field--wide">
                          <span className="field-label">Full name <span aria-hidden="true">*</span></span>
                          <input type="text" name="name" autoComplete="name" value={application.fullName} onChange={(event) => updateApplication("fullName", event.target.value)} placeholder="Your name as it appears on your ID" required minLength={2} maxLength={100} />
                        </label>

                        <label className="form-field">
                          <span className="field-label">Phone <span aria-hidden="true">*</span></span>
                          <input type="tel" name="tel" autoComplete="tel" value={application.phone} onChange={(event) => updateApplication("phone", event.target.value)} placeholder="Include country code" required minLength={7} maxLength={25} />
                        </label>

                        <label className="form-field">
                          <span className="field-label">Email <span aria-hidden="true">*</span></span>
                          <input type="email" name="email" autoComplete="email" value={application.email} onChange={(event) => updateApplication("email", event.target.value)} placeholder="you@example.com" required maxLength={120} />
                        </label>

                        <label className="form-field">
                          <span className="field-label">Date of birth <span aria-hidden="true">*</span></span>
                          <input type="date" name="bday" autoComplete="bday" value={application.dateOfBirth} onChange={(event) => updateApplication("dateOfBirth", event.target.value)} required max={latestBirthDate} />
                        </label>

                        <SelectField label="Passport status" value={application.passport} onChange={(value) => updateApplication("passport", value)} placeholder="Select one">
                          <option value="I have a valid passport">I have a valid passport</option>
                          <option value="I am applying for a passport">I am applying for a passport</option>
                          <option value="I need help getting a passport">I need help getting a passport</option>
                        </SelectField>

                        <label className="form-field form-field--wide">
                          <span className="field-label">Tell us about your experience <span className="field-optional">OPTIONAL</span></span>
                          <textarea rows={3} value={application.experience} onChange={(event) => updateApplication("experience", event.target.value)} placeholder="A little about the work you have done or what you would like to do" maxLength={500} />
                        </label>

                        <p className="form-privacy form-field--wide">Please do not enter national ID or passport numbers here. Our team will discuss any documents needed directly with you.</p>

                        <label className="form-consent form-field--wide">
                          <input type="checkbox" checked={application.consent} onChange={(event) => updateApplication("consent", event.target.checked)} required />
                          <span>I agree that my details may be sent to Hashein Uganda by email to process this application, and understand that roles and visas depend on eligibility and approval. <span aria-hidden="true">*</span></span>
                        </label>
                      </div>
                    )}

                    <div className="form-actions">
                      {formStep === 2 && <button className="form-back" type="button" onClick={() => setFormStep(1)}><ArrowRight size={16} aria-hidden="true" /> Back</button>}
                      <button className="button button--dark form-submit" type="submit">
                        {formStep === 1 ? "Continue" : "Continue"}
                        {formStep === 1 ? <ArrowRight size={19} aria-hidden="true" /> : <ArrowUpRight size={19} aria-hidden="true" />}
                      </button>
                    </div>
                  </form>
                </>
              )}
</div>
  );
}
