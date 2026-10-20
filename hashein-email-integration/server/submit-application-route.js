/*
 * Cloudflare Worker route for POST /submit-application.
 *
 * Merge this handler into the EXISTING MarzPay Worker so the browser can call
 * https://marzpay-api.investinginaionline.workers.dev/submit-application.
 *
 * Bind an APPLICATIONS_KV namespace for storage. The payment-status route must
 * return the provider-confirmed amount in UGX as data.amount or
 * data.transaction.amount. This handler fails closed if that amount is absent.
 *
 * For production-grade one-time payment claims, use D1 with a UNIQUE constraint
 * on payment_reference (or a Durable Object transaction); KV is not atomic.
 */
const PAYMENT_STATUS_BASE = "https://marzpay-api.investinginaionline.workers.dev";

export async function handleSubmitApplication(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(env) });
  }
  if (request.method !== "POST") {
    return json({ status: "error", message: "Method not allowed." }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ status: "error", message: "Invalid JSON." }, 400);
  }

  const { application, paymentReference, amount } = body || {};
  const ref = typeof paymentReference === "string" ? paymentReference.trim() : "";
  if (!ref || ref.length > 200) return json({ status: "error", message: "Missing payment reference." }, 400);
  if (Number(amount) !== 5000) return json({ status: "error", message: "Application fee must be UGX 5,000." }, 400);

  const required = ["origin", "destination", "category", "role", "education", "yearsExperience", "fullName", "phone", "dateOfBirth", "passport"];
  if (!application || typeof application !== "object") return json({ status: "error", message: "Missing application data." }, 400);
  for (const key of required) {
    if (typeof application[key] !== "string" || !application[key].trim()) {
      return json({ status: "error", message: `Please provide ${key}.` }, 400);
    }
  }
  if (application.consent !== true) return json({ status: "error", message: "Consent is required." }, 400);
  if (application.fullName.trim().length > 100 || application.experience?.length > 500) {
    return json({ status: "error", message: "Application field is too long." }, 400);
  }

  if (!env.APPLICATIONS_KV) {
    return json({ status: "error", message: "Application storage is not configured." }, 500);
  }

  // Check the existing server-side status route, not the status claimed by the browser.
  let paymentData;
  try {
    const response = await fetch(`${PAYMENT_STATUS_BASE}/payment-status/${encodeURIComponent(ref)}`, {
      headers: { "Accept": "application/json" },
      cf: { cacheTtl: 0 },
    });
    paymentData = await response.json();
    if (!response.ok || paymentData.status !== "success") {
      return json({ status: "error", message: "Payment could not be verified." }, 402);
    }
  } catch {
    return json({ status: "error", message: "Payment verification service is unavailable." }, 503);
  }

  const data = paymentData.data || {};
  const providerStatus = String(data.status || data.transaction?.status || "").toLowerCase();
  const providerAmount = Number(data.amount ?? data.transaction?.amount ?? data.transaction?.total);
  if (!["paid", "successful", "completed"].includes(providerStatus)) {
    return json({ status: "error", message: "Payment is not confirmed as paid." }, 402);
  }
  if (!Number.isFinite(providerAmount) || providerAmount !== 5000) {
    return json({ status: "error", message: "Provider-confirmed amount is missing or is not UGX 5,000." }, 402);
  }

  // Prevent normal repeat submissions. For concurrent requests, use D1 UNIQUE(payment_reference).
  const claimKey = `payment-reference:${ref}`;
  const alreadyUsed = await env.APPLICATIONS_KV.get(claimKey);
  if (alreadyUsed) {
    return json({ status: "error", message: "This payment reference has already been used." }, 409);
  }

  const applicationId = `HAS-${crypto.randomUUID()}`;
  const record = {
    applicationId,
    application: sanitizeApplication(application),
    payment: { reference: ref, amount: 5000, currency: "UGX", status: "paid" },
    submittedAt: new Date().toISOString(),
  };

  // Write the claim first to reduce accidental duplicate use. KV is not a transactional database.
  await env.APPLICATIONS_KV.put(claimKey, applicationId);
  await env.APPLICATIONS_KV.put(`application:${applicationId}`, JSON.stringify(record));
  return json({ status: "success", applicationId }, 201);
}

function sanitizeApplication(app) {
  const keys = ["origin", "destination", "category", "role", "education", "yearsExperience", "fullName", "phone", "email", "dateOfBirth", "passport", "experience"];
  const safe = {};
  for (const key of keys) safe[key] = String(app[key] || "").trim().slice(0, key === "experience" ? 500 : 500);
  safe.consent = app.consent === true;
  return safe;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",

    },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
