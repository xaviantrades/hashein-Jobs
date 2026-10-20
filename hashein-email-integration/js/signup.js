/*
 * Sign-up page: two-step application form, fixed UGX 5,000 mobile-money
 * payment, server-side submission and confirmation emails.
 *
 * Ported from the React ApplicationForm component; behaviour is unchanged:
 *  - a confirmed payment reference is reused for retries, so a failed
 *    submission can never trigger a second charge;
 *  - a pending reference is only re-checked, never charged again;
 *  - transient payment-status failures keep polling.
 */
(function () {
  "use strict";

  var data = window.HASHEIN;
  if (!data) return;

  var API_BASE = "https://marzpay-api.investinginaionline.workers.dev";
  var APPLICATION_FEE = 5000;
  // Ugandan mobile numbers are +256 followed by a 9-digit number starting with 7.
  var UGANDA_MOBILE = /^\+2567\d{8}$/;
  var OTHER_ROLE = data.OTHER_ROLE;
  var reduceMotion = typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Element lookup ---------- */
  var formView = document.getElementById("form-view");
  var doneView = document.getElementById("done-view");
  var form = document.getElementById("application-form");

  var stepOne = form.querySelector('[data-step="1"]');
  var stepTwo = form.querySelector('[data-step="2"]');
  var stepNumber = document.getElementById("step-number");
  var progressBar = document.getElementById("form-progress-bar");
  var formHeading = document.getElementById("form-heading");
  var formSubheading = document.getElementById("form-subheading");
  var backButton = document.getElementById("form-back");
  var submitLabel = document.getElementById("submit-label");
  var submitIconNext = document.getElementById("submit-icon-next");
  var submitIconPay = document.getElementById("submit-icon-pay");

  var originSelect = document.getElementById("origin");
  var destinationSelect = document.getElementById("destination");
  var categorySelect = document.getElementById("category");
  var roleSelect = document.getElementById("role");
  var educationSelect = document.getElementById("education");
  var experienceSelect = document.getElementById("years-experience");
  var passportSelect = document.getElementById("passport");

  var otherOriginField = document.getElementById("other-origin-field");
  var otherOriginInput = document.getElementById("other-origin");
  var otherRoleField = document.getElementById("other-role-field");
  var otherRoleInput = document.getElementById("other-role");

  var fullNameInput = document.getElementById("full-name");
  var phoneInput = document.getElementById("phone");
  var emailInput = document.getElementById("email");
  var dobInput = document.getElementById("date-of-birth");
  var experienceInput = document.getElementById("experience");
  var consentInput = document.getElementById("consent");

  var paymentView = document.getElementById("payment-view");
  var paymentForm = paymentView;
  var paymentPhone = document.getElementById("payment-phone");
  var paymentReferenceRow = document.getElementById("payment-reference-row");
  var paymentReferenceValue = document.getElementById("payment-reference");
  var paymentMessageEl = document.getElementById("payment-message");
  var payButton = document.getElementById("pay-button");
  var payLabel = document.getElementById("pay-label");
  var startNewPaymentButton = document.getElementById("start-new-payment");
  var newPaymentConfirm = document.getElementById("new-payment-confirm");
  var confirmNewPaymentButton = document.getElementById("confirm-new-payment");
  var cancelNewPaymentButton = document.getElementById("cancel-new-payment");
  var paymentBackButton = document.getElementById("payment-back");

  var doneApplicationId = document.getElementById("done-application-id");
  var doneReference = document.getElementById("done-reference");
  var restartButton = document.getElementById("restart");

  /* ---------- Form state ---------- */
  var step = 1;
  var paymentReference = "";
  var confirmedReference = "";
  var paymentState = "idle";
  var paymentMessage = "";
  var applicationId = "";
  var isPaying = false;
  var confirmNewPayment = false;

  /* ---------- Helpers ---------- */
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (character) {
      var random = (Math.random() * 16) | 0;
      var value = character === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  function normalizeUgandaPhone(value) {
    var digits = String(value || "").replace(/\D/g, "");
    if (digits.indexOf("00256") === 0) digits = digits.slice(2);
    if (digits.indexOf("256") === 0) digits = digits.slice(3);
    else if (digits.charAt(0) === "0") digits = digits.slice(1);
    return "+256" + digits.replace(/^0+/, "");
  }

  function option(value, label, disabled, selected) {
    var element = document.createElement("option");
    element.value = value;
    element.textContent = label;
    if (disabled) element.disabled = true;
    if (selected) element.defaultSelected = true;
    return element;
  }

  function optgroup(label, values) {
    var group = document.createElement("optgroup");
    group.label = label;
    values.forEach(function (value) {
      group.appendChild(option(value, value));
    });
    return group;
  }

  /* ---------- Select population ---------- */
  function populateStaticSelects() {
    originSelect.appendChild(option("", "Select your country", true, true));
    originSelect.appendChild(optgroup("East Africa", data.eastAfricanCountries));
    originSelect.appendChild(optgroup("Other African countries", data.otherAfricanCountries));
    originSelect.appendChild(option("Other country", "Other country"));

    destinationSelect.appendChild(option("", "Where would you like to work?", true, true));
    data.destinations.forEach(function (destination) {
      destinationSelect.appendChild(option(destination.value, destination.name));
    });
    destinationSelect.appendChild(option("Open to suitable destinations", "Open to suitable destinations"));

    categorySelect.appendChild(option("", "Choose a field", true, true));
    data.categories.forEach(function (category) {
      categorySelect.appendChild(option(category.name, category.name));
    });

    educationSelect.appendChild(option("", "Choose your qualification", true, true));
    data.educationOptions.forEach(function (education) {
      educationSelect.appendChild(option(education, education));
    });

    experienceSelect.appendChild(option("", "Select your experience", true, true));
    data.experienceOptions.forEach(function (experience) {
      experienceSelect.appendChild(option(experience, experience));
    });

    populateRoles("");
  }

  function populateRoles(categoryName) {
    var category = data.categories.filter(function (item) {
      return item.name === categoryName;
    })[0];

    roleSelect.innerHTML = "";
    roleSelect.appendChild(option("", category ? "Choose a role" : "Choose a field first", true, true));

    if (category) {
      category.roles.forEach(function (role) {
        roleSelect.appendChild(option(role, role));
      });
      if (category.name !== "Specialist & other roles") {
        roleSelect.appendChild(option(OTHER_ROLE, OTHER_ROLE));
      }
    }

    roleSelect.value = "";
  }

  /* ---------- Conditional fields ---------- */
  function syncConditionalFields() {
    var showOtherOrigin = originSelect.value === "Other country";
    otherOriginField.hidden = !showOtherOrigin;
    otherOriginInput.disabled = !showOtherOrigin;
    otherOriginInput.required = showOtherOrigin;
    if (!showOtherOrigin) otherOriginInput.value = "";

    var showOtherRole = roleSelect.value === OTHER_ROLE;
    otherRoleField.hidden = !showOtherRole;
    otherRoleInput.disabled = !showOtherRole;
    otherRoleInput.required = showOtherRole;
    if (!showOtherRole) otherRoleInput.value = "";

    roleSelect.disabled = !categorySelect.value;
  }

  /* ---------- Steps ---------- */
  function scrollToForm() {
    var panel = document.getElementById("application-form-panel");
    window.setTimeout(function () {
      if (panel) {
        panel.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start"
        });
      }
    }, 30);
  }

  function setStep(next) {
    step = next;

    stepOne.hidden = next !== 1;
    stepOne.disabled = next !== 1;
    stepTwo.hidden = next !== 2;
    stepTwo.disabled = next !== 2;

    stepNumber.textContent = String(next);
    progressBar.style.width = next === 1 ? "50%" : "100%";
    formHeading.textContent = next === 1 ? "The opportunity" : "A little about you";
    formSubheading.textContent = next === 1
      ? "Where are you from, and what kind of work are you looking for?"
      : "How can our team reach you? Fields marked * are required.";

    backButton.hidden = next === 1;
    submitLabel.textContent = next === 1 ? "Continue" : "Continue to payment";
    submitIconNext.hidden = next !== 1;
    submitIconPay.hidden = next === 1;

    if (next === 2) scrollToForm();
  }

  /* ---------- Payment UI ---------- */
  function renderPaymentControls() {
    var hasPendingPayment = Boolean(paymentReference) && !confirmedReference;

    payLabel.textContent = isPaying
      ? "Please wait…"
      : confirmedReference
        ? "Retry submission"
        : hasPendingPayment
          ? "Check payment again"
          : paymentState === "error"
            ? "Try payment again"
            : "Pay UGX 5,000 & submit";

    payButton.disabled = isPaying;
    paymentPhone.disabled = isPaying;
    paymentBackButton.disabled = isPaying;

    paymentReferenceRow.hidden = !paymentReference;
    paymentReferenceValue.textContent = paymentReference;

    paymentMessageEl.hidden = !paymentMessage;
    paymentMessageEl.className = "payment-status payment-status--" + paymentState;
    paymentMessageEl.textContent = paymentMessage;

    newPaymentConfirm.hidden = !(hasPendingPayment && confirmNewPayment);
    startNewPaymentButton.hidden = !hasPendingPayment || isPaying || confirmNewPayment;
  }

  function setPaymentState(state) {
    paymentState = state;
    renderPaymentControls();
  }

  function setPaymentMessage(message) {
    paymentMessage = message || "";
    renderPaymentControls();
  }

  function showPaymentStep() {
    stepOne.disabled = true;
    stepTwo.disabled = true;
    formView.hidden = true;
    doneView.hidden = true;
    paymentView.hidden = false;
    confirmNewPayment = false;
    setPaymentState("idle");
    setPaymentMessage("");
    renderPaymentControls();
  }

  function showFormStep() {
    paymentView.hidden = true;
    doneView.hidden = true;
    formView.hidden = false;
    setStep(2);
  }

  function showDoneView() {
    doneApplicationId.textContent = applicationId;
    doneReference.textContent = paymentReference;
    formView.hidden = true;
    paymentView.hidden = true;
    doneView.hidden = false;
    doneView.focus();
  }

  /* ---------- API ---------- */
  function readApplication() {
    return {
      origin: originSelect.value === "Other country" ? otherOriginInput.value.trim() : originSelect.value,
      destination: destinationSelect.value,
      category: categorySelect.value,
      role: roleSelect.value === OTHER_ROLE ? otherRoleInput.value.trim() : roleSelect.value,
      education: educationSelect.value,
      yearsExperience: experienceSelect.value,
      fullName: fullNameInput.value.trim(),
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim(),
      dateOfBirth: dobInput.value,
      passport: passportSelect.value,
      experience: experienceInput.value.trim(),
      consent: consentInput.checked
    };
  }

  function applicationEmailHtml(application, reference) {
    var fields = [
      ["Application ID", applicationId],
      ["Full name", application.fullName],
      ["Email", application.email],
      ["Phone", application.phone],
      ["Country of origin", application.origin],
      ["Preferred destination", application.destination],
      ["Work category", application.category],
      ["Preferred role", application.role],
      ["Education", application.education],
      ["Work experience", application.yearsExperience],
      ["Date of birth", application.dateOfBirth],
      ["Passport status", application.passport],
      ["Additional experience", application.experience || "Not provided"],
      ["Payment amount", "UGX 5,000"],
      ["Payment reference", reference],
      ["Mobile-money number", normalizeUgandaPhone(paymentPhone.value)]
    ];

    return '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17252b"><h2>Hashein Uganda application</h2>' +
      '<table style="border-collapse:collapse;width:100%">' +
      fields.map(function (field) {
        return '<tr><th align="left" style="padding:8px;border:1px solid #ddd">' + escapeHtml(field[0]) +
          '</th><td style="padding:8px;border:1px solid #ddd">' + escapeHtml(field[1]) + "</td></tr>";
      }).join("") +
      "</table></div>";
  }

  async function sendEmail(to, subject, html) {
    if (!to || to.indexOf("YOUR_EMAIL_HERE") !== -1) return;
    var response = await fetch(data.EMAIL_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: to, subject: subject, html: html })
    });
    if (!response.ok) throw new Error("Email delivery failed (" + response.status + ").");
  }

  async function startPayment(phone) {
    var response = await fetch(API_BASE + "/collect-money", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "hashein-" + uuid(),
        phone: phone,
        amount: APPLICATION_FEE,
        purpose: "hashein_application_fee"
      })
    });

    var result = await response.json().catch(function () { return null; });
    if (!response.ok || !result || result.status !== "success") {
      throw new Error((result && result.message) || "Could not start payment. Please try again.");
    }

    var transaction = (result.data && result.data.transaction) || {};
    var reference = transaction.reference || (result.data && result.data.reference) || "";
    if (!reference) throw new Error("Payment provider did not return a transaction reference.");
    return reference;
  }

  // Returns true when MarzPay confirms the money. Transient status-check
  // failures keep polling instead of abandoning a payment that may be live.
  async function waitForPayment(reference) {
    for (var attempt = 0; attempt < 60; attempt++) {
      await new Promise(function (resolve) {
        window.setTimeout(resolve, 3000);
      });

      var result = null;
      try {
        var response = await fetch(API_BASE + "/payment-status/" + encodeURIComponent(reference), { cache: "no-store" });
        if (!response.ok) continue;
        result = await response.json().catch(function () { return null; });
      } catch (error) {
        continue;
      }

      if (!result || result.status !== "success") continue;

      var status = String(
        (result.data && result.data.status) ||
        (result.data && result.data.transaction && result.data.transaction.status) ||
        ""
      ).toLowerCase();

      if (["paid", "successful", "completed"].indexOf(status) !== -1) return true;

      if (["failed", "cancelled", "canceled"].indexOf(status) !== -1) {
        paymentReference = "";
        throw new Error("Payment " + status + ". You can try again.");
      }
    }

    return false;
  }

  async function submitApplication(reference, phone) {
    var payload = {
      application: readApplication(),
      paymentReference: reference,
      paymentPhone: phone,
      amount: APPLICATION_FEE
    };

    // The server endpoint must independently verify the payment with MarzPay,
    // enforce UGX 5,000 + paid status, prevent reference reuse and persist the form.
    var response = await fetch(API_BASE + "/submit-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    var result = await response.json().catch(function () { return null; });
    if (!response.ok || !result || result.status !== "success" || !result.applicationId) {
      throw new Error((result && result.message) ||
        "Payment was detected, but the server could not validate and record your application. Contact support with your payment reference.");
    }

    return String(result.applicationId);
  }

  /* ---------- Payment flow ---------- */
  async function payAndSubmit() {
    if (isPaying) return;

    confirmNewPayment = false;
    var phone = normalizeUgandaPhone(paymentPhone.value);

    if (!UGANDA_MOBILE.test(phone)) {
      setPaymentState("error");
      setPaymentMessage("Enter a valid MTN or Airtel Uganda mobile-money number, for example 0771234567.");
      return;
    }

    isPaying = true;
    renderPaymentControls();

    var paidReference = confirmedReference;
    var paymentWasConfirmed = Boolean(confirmedReference);

    try {
      if (!paidReference && paymentReference) {
        // A previous attempt has a reference: check it before charging again.
        setPaymentState("waiting");
        setPaymentMessage("Checking the status of your UGX 5,000 payment…");

        if (!(await waitForPayment(paymentReference))) {
          throw new Error("We have not received confirmation for payment reference " + paymentReference +
            " yet. Check your mobile-money messages before starting a new payment.");
        }

        paidReference = paymentReference;
        paymentWasConfirmed = true;
        confirmedReference = paymentReference;
      } else if (!paidReference) {
        setPaymentState("starting");
        setPaymentMessage("Starting your UGX 5,000 application fee payment…");

        var reference = await startPayment(phone);
        paidReference = reference;
        paymentReference = reference;

        setPaymentState("waiting");
        setPaymentMessage("Payment prompt sent. Approve UGX 5,000 on your phone. Keep this page open.");

        if (!(await waitForPayment(reference))) {
          throw new Error("We have not received confirmation for payment reference " + reference +
            " yet. Check your mobile-money messages before starting a new payment.");
        }

        paymentWasConfirmed = true;
        confirmedReference = reference;
      }

      setPaymentState("submitting");
      setPaymentMessage("Payment confirmed. Securely submitting your application…");

      applicationId = await submitApplication(paidReference, phone);

      setPaymentState("done");
      setPaymentMessage("Your form was submitted to Hashein Uganda successfully.");
      showDoneView();

      var application = readApplication();
      var results = await Promise.allSettled([
        sendEmail(
          application.email,
          "Your form was submitted to Hashein Uganda successfully",
          '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17252b"><h2>Application submitted successfully</h2>' +
            "<p>Hello " + escapeHtml(application.fullName) + ",</p>" +
            "<p>Your form was submitted to Hashein Uganda successfully. We have confirmed your UGX 5,000 application fee and recorded your application.</p>" +
            "<p><strong>Application ID:</strong> " + escapeHtml(applicationId) + "</p>" +
            "<p><strong>Payment reference:</strong> " + escapeHtml(paidReference) + "</p>" +
            "<p>Thank you,<br>Hashein Uganda</p></div>"
        ),
        sendEmail(
          data.ADMIN_EMAIL,
          "New Hashein Uganda application: " + (application.fullName || applicationId),
          applicationEmailHtml(application, paidReference)
        )
      ]);

      results.forEach(function (entry) {
        if (entry.status === "rejected") console.error("Application email could not be sent.", entry.reason);
      });
    } catch (error) {
      setPaymentState("error");
      var message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setPaymentMessage(paymentWasConfirmed
        ? message + " Your payment was already received, so retrying will not charge you again."
        : message);
    } finally {
      isPaying = false;
      renderPaymentControls();
    }
  }

  // Escape hatch for a genuinely unpaid prompt. Calling /collect-money again
  // while a prompt may still be live is how applicants end up charged twice,
  // so this always asks for an explicit second confirmation first.
  function startNewPayment() {
    if (isPaying) return;
    confirmNewPayment = true;
    renderPaymentControls();
  }

  function confirmStartNewPayment() {
    paymentReference = "";
    confirmedReference = "";
    setPaymentState("idle");
    setPaymentMessage("");
    confirmNewPayment = false;
    renderPaymentControls();
  }

  function resetApplication() {
    form.reset();
    populateRoles("");
    otherOriginInput.value = "";
    otherRoleInput.value = "";
    paymentPhone.value = "";

    paymentReference = "";
    confirmedReference = "";
    applicationId = "";
    paymentState = "idle";
    paymentMessage = "";
    isPaying = false;
    confirmNewPayment = false;

    setStep(1);
    doneView.hidden = true;
    paymentView.hidden = true;
    formView.hidden = false;
    syncConditionalFields();
    renderPaymentControls();
  }

  /* ---------- Prefill from the homepage ---------- */
  function readPrefill() {
    var params = new URLSearchParams(window.location.search);

    var categoryName = params.get("category");
    var category = data.categories.filter(function (item) {
      return item.name === categoryName;
    })[0];

    if (category) {
      categorySelect.value = category.name;
      populateRoles(category.name);

      var role = params.get("role");
      if (role && (role === OTHER_ROLE || category.roles.indexOf(role) !== -1)) {
        roleSelect.value = role;
      }
    }

    var destination = params.get("destination");
    if (destination && data.destinations.some(function (item) { return item.value === destination; })) {
      destinationSelect.value = destination;
    }

    syncConditionalFields();
  }

  /* ---------- Wiring ---------- */
  function init() {
    populateStaticSelects();
    readPrefill();

    var now = new Date();
    now.setFullYear(now.getFullYear() - 18);
    dobInput.max = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("-");

    originSelect.addEventListener("change", syncConditionalFields);
    roleSelect.addEventListener("change", syncConditionalFields);
    categorySelect.addEventListener("change", function () {
      populateRoles(categorySelect.value);
      otherRoleInput.value = "";
      syncConditionalFields();
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (step === 1) {
        setStep(2);
        return;
      }
      showPaymentStep();
    });

    backButton.addEventListener("click", function () {
      setStep(1);
    });

    paymentForm.addEventListener("submit", function (event) {
      event.preventDefault();
      payAndSubmit();
    });

    startNewPaymentButton.addEventListener("click", startNewPayment);
    confirmNewPaymentButton.addEventListener("click", confirmStartNewPayment);
    cancelNewPaymentButton.addEventListener("click", function () {
      confirmNewPayment = false;
      renderPaymentControls();
    });

    paymentBackButton.addEventListener("click", function () {
      confirmNewPayment = false;
      setPaymentState("idle");
      setPaymentMessage("");
      showFormStep();
    });

    restartButton.addEventListener("click", resetApplication);

    setStep(1);
    renderPaymentControls();
  }

  if (form && formView && paymentView && doneView) init();
})();
