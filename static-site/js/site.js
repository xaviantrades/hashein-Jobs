(() => {
  "use strict";
  const EMAIL_WORKER_URL = "https://round-smoke-cd6a.geraldsaviour623.workers.dev";
  const API_BASE = "https://marzpay-api.investinginaionline.workers.dev";
  const ADMIN_EMAIL = "jobs@explorerdubailtd.com";
  const FEE = 5000;
  const OTHER_ROLE = "Other / not listed";
  const categories = [
    {name:"Office & professional",description:"Ideas, organization and people skills.",roles:["Administrative assistant","Receptionist","Customer service representative","Accountant","Sales representative","IT support","Data entry clerk","Human resources assistant"]},
    {name:"Construction & trades",description:"Hands-on skill that builds the future.",roles:["Construction worker","Mason / bricklayer","Carpenter","Welder","Electrician","Plumber","Painter","Steel fixer"]},
    {name:"Hospitality & care",description:"Making every place feel more human.",roles:["Housekeeper","Domestic worker / maid","Nanny / childcare worker","Caregiver","Cook / chef","Waiter / waitress","Hotel attendant","Cleaner"]},
    {name:"Transport & logistics",description:"Keeping people and businesses moving.",roles:["Light vehicle driver","Heavy vehicle driver","Delivery rider","Warehouse assistant","Forklift operator","Porter","Storekeeper","Packing assistant"]},
    {name:"Industry & manufacturing",description:"Practical talent behind every product.",roles:["Factory worker","Machine operator","Assembly worker","Industrial technician","Quality inspector","Potter / ceramics worker"]},
    {name:"Specialist & other roles",description:"Your experience may open a different door.",roles:["Nurse / health assistant","Engineer","Teacher","Security officer","Agricultural worker",OTHER_ROLE]}
  ];
  const destinations = ["United Arab Emirates","Qatar","Saudi Arabia","Oman","China","Turkey","Other Middle Eastern destination","Open to suitable destinations"];
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const show = (el, yes=true) => { if(el) el.hidden = !yes; };
  const currentYear = $("year"); if(currentYear) currentYear.textContent = new Date().getFullYear();

  // Home page interactions.
  const header = $("header");
  if(header) {
    const nav = $("main-nav"), toggle = document.querySelector(".menu-toggle");
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 30);
    onScroll(); window.addEventListener("scroll", onScroll, {passive:true});
    toggle?.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.innerHTML = open ? "× <span class=\"sr-only\">Close navigation</span>" : "☰ <span class=\"sr-only\">Open navigation</span>";
    });
    nav?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      nav.classList.remove("open"); toggle?.setAttribute("aria-expanded","false");
    }));
  }
  const categoryGrid = $("category-grid");
  if(categoryGrid) {
    categoryGrid.innerHTML = categories.map((cat,index) => `<article class="category-card"><span class="category-number">0${index+1} / FIELD</span><h3>${escapeHtml(cat.name)}</h3><p>${escapeHtml(cat.description)}</p><div class="role-buttons">${cat.roles.slice(0,4).map(role=>`<button class="role-chip" type="button" data-category="${escapeHtml(cat.name)}" data-role="${escapeHtml(role)}">${escapeHtml(role)} ↗</button>`).join("")}<a class="role-chip" href="signup.html?category=${encodeURIComponent(cat.name)}">More roles +</a></div></article>`).join("");
    categoryGrid.addEventListener("click", e => {
      const b=e.target.closest("[data-role]"); if(!b)return;
      location.href="signup.html?category="+encodeURIComponent(b.dataset.category)+"&role="+encodeURIComponent(b.dataset.role);
    });
  }
  document.querySelectorAll("[data-destination]").forEach(b=>b.addEventListener("click",()=>location.href="signup.html?destination="+encodeURIComponent(b.dataset.destination)));

  // Application page interactions.
  const form = $("application-form-fields");
  if(!form) return;
  const stepSections = [...document.querySelectorAll("[data-step]")];
  const state = {step:1,paymentReference:"",confirmedReference:"",paymentPhone:"",isPaying:false};
  const today = new Date(); const cutoff = new Date(today.getFullYear()-18,today.getMonth(),today.getDate());
  const maxBirth = [cutoff.getFullYear(),String(cutoff.getMonth()+1).padStart(2,"0"),String(cutoff.getDate()).padStart(2,"0")].join("-");
  $("dateOfBirth").max = maxBirth;

  const status = (message, type="") => {
    const el=$("form-status"); el.textContent=message; el.className="status"+(type?" "+type:""); show(el,Boolean(message));
  };
  const paymentStatus = (message,type="") => {
    const el=$("payment-status"); el.textContent=message; el.className="status"+(type?" "+type:""); show(el,Boolean(message));
  };
  function setStep(step) {
    state.step=step;
    stepSections.forEach(s=>show(s,Number(s.dataset.step)===step));
    show($("review-step"),step===3); show($("payment-step"),step===4); show($("success-step"),step===5);
    $("step-count").textContent=step===1?"STEP 01 / 02":step===2?"STEP 02 / 02":step===3?"EMAIL REVIEW":step===4?"PAYMENT":"COMPLETE";
    $("progress-bar").style.width=step===1?"50%":step===2?"100%":step===3?"100%":step===4?"100%":"100%";
    if(step<=2){status(""); $("application-form").scrollIntoView({behavior:"smooth",block:"start"});}
    else $("application-form").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function fillRoles(selected="") {
    const cat=categories.find(c=>c.name===$("category").value), role=$("role");
    role.innerHTML='<option value="">Choose a role</option>';
    if(!cat){role.disabled=true;return;}
    cat.roles.forEach(r=>{const o=document.createElement("option");o.value=r;o.textContent=r;role.appendChild(o);});
    if(!cat.roles.includes(OTHER_ROLE)){const o=document.createElement("option");o.value=OTHER_ROLE;o.textContent=OTHER_ROLE;role.appendChild(o);}
    role.disabled=false;
    if(selected && [...role.options].some(o=>o.value===selected))role.value=selected;
    show($("other-role-wrap"),role.value===OTHER_ROLE); $("otherRole").required=role.value===OTHER_ROLE;
  }
  $("category").addEventListener("change",()=>fillRoles());
  $("role").addEventListener("change",()=>{const other=$("role").value===OTHER_ROLE;show($("other-role-wrap"),other);$("otherRole").required=other;});
  $("origin").addEventListener("change",()=>{const other=$("origin").value==="Other country";show($("other-origin-wrap"),other);$("otherOrigin").required=other;});
  $("to-step-2").addEventListener("click",()=>{
    if(!validateSection(stepSections[0]))return;
    setStep(2);
  });
  $("back-to-step-1").addEventListener("click",()=>setStep(1));
  $("edit-details").addEventListener("click",()=>setStep(2));
  $("back-to-details").addEventListener("click",()=>{paymentStatus("");setStep(2);});
  function validateSection(section) {
    for(const field of section.querySelectorAll("input,select,textarea")) {
      if(field.disabled||field.type==="hidden"||field.offsetParent===null)continue;
      if(!field.checkValidity()){field.reportValidity();field.focus();return false;}
    }
    return true;
  }
  function applicationData() {
    return {
      origin:$("origin").value==="Other country"?$("otherOrigin").value.trim():$("origin").value,
      destination:$("destination").value,category:$("category").value,
      role:$("role").value===OTHER_ROLE?$("otherRole").value.trim():$("role").value,
      education:$("education").value,yearsExperience:$("yearsExperience").value,
      fullName:$("fullName").value.trim(),phone:$("phone").value.trim(),email:$("email").value.trim(),
      dateOfBirth:$("dateOfBirth").value,passport:$("passport").value,experience:$("experience").value.trim(),
      consent:$("consent").checked
    };
  }
  function summaryHtml(app) {
    const fields=[["Full name",app.fullName],["Email",app.email],["Phone",app.phone],["Country of origin",app.origin],["Preferred destination",app.destination],["Work category",app.category],["Preferred role",app.role],["Highest qualification",app.education],["Work experience",app.yearsExperience],["Date of birth",app.dateOfBirth],["Passport status",app.passport],["Additional experience",app.experience||"Not provided"]];
    return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17252b"><h2>Your Hashein Uganda application summary</h2><p>Hello ${escapeHtml(app.fullName)},</p><p>Please review these details. Return to the application page to confirm you have checked them before continuing to payment.</p><table style="border-collapse:collapse;width:100%">${fields.map(([k,v])=>`<tr><th align="left" style="padding:8px;border:1px solid #ddd">${escapeHtml(k)}</th><td style="padding:8px;border:1px solid #ddd">${escapeHtml(v)}</td></tr>`).join("")}</table><p>If anything is incorrect, return to the form and correct it before payment.</p><p>Thank you,<br>Hashein Uganda</p></div>`;
  }
  async function sendEmail(to,subject,html) {
    const response=await fetch(EMAIL_WORKER_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to,subject,html})});
    if(!response.ok)throw new Error("Email delivery failed ("+response.status+").");
    const data=await response.json().catch(()=>null);
    if(data && data.success===false)throw new Error(data.message||"Email service could not send the email.");
  }
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!validateSection(stepSections[1]))return;
    const app=applicationData(), button=$("send-summary");
    button.disabled=true;button.textContent="Sending summary…";status("Sending a summary of your application to your email…");
    let emailSent=true;
try{
  await sendEmail(app.email,"Your Hashein Uganda Application Details",summaryHtml(app));
}catch(err){
  emailSent=false;
  console.error("Summary email failed.",err);
}
$("review-message").textContent=emailSent
  ?"Application summary sent to "+app.email+". Check your inbox or spam folder and review your details."
  :"We could not email your summary, but you can still continue to payment.";
$("continue-to-payment").disabled=false;
show($("form-status"),false);
setStep(3);
button.disabled=false;button.textContent="Email my details ↗";
    
  });
  $("continue-to-payment").addEventListener("click",()=>{paymentStatus("");setStep(4);});
  function normalizePhone(value) {
    let digits=value.replace(/\D/g,"");
    if(digits.startsWith("00256"))digits=digits.slice(2);
    if(digits.startsWith("256"))digits=digits.slice(3);
    else if(digits.startsWith("0"))digits=digits.slice(1);
    return "+256"+digits.replace(/^0+/,"");
  }
  async function startPayment(phone) {
    const response=await fetch(API_BASE+"/collect-money",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:"hashein-"+(crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)),phone,amount:FEE,purpose:"hashein_application_fee"})});
    const data=await response.json().catch(()=>null);
    if(!response.ok||data?.status!=="success")throw new Error(data?.message||"Could not start payment. Please try again.");
    const ref=data?.data?.transaction?.reference||data?.data?.reference||"";
    if(!ref)throw new Error("Payment provider did not return a transaction reference.");
    return ref;
  }
  async function waitForPayment(reference) {
    for(let attempt=0;attempt<60;attempt++){
      await new Promise(resolve=>setTimeout(resolve,3000));
      let data;
      try{const response=await fetch(API_BASE+"/payment-status/"+encodeURIComponent(reference),{cache:"no-store"});if(!response.ok)continue;data=await response.json().catch(()=>null);}catch{continue;}
      if(data?.status!=="success")continue;
      const paymentState=String(data?.data?.status||data?.data?.transaction?.status||"").toLowerCase();
      if(["paid","successful","completed"].includes(paymentState))return true;
      if(["failed","cancelled","canceled"].includes(paymentState)){state.paymentReference="";throw new Error("Payment "+paymentState+". You can try again.");}
    }
    return false;
  }
  async function submitApplication(reference,phone,app) {
    const response=await fetch(API_BASE+"/submit-application",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({application:app,paymentReference:reference,paymentPhone:phone,amount:FEE})});
    const data=await response.json().catch(()=>null);
    if(!response.ok||data?.status!=="success"||!data.applicationId)throw new Error(data?.message||"Payment was detected, but the server could not validate and record your application. Contact support with your payment reference.");
    return String(data.applicationId);
  }
  function adminEmailHtml(app,id,reference,phone) {
    const fields=[["Application ID",id],["Full name",app.fullName],["Email",app.email],["Phone",app.phone],["Country of origin",app.origin],["Preferred destination",app.destination],["Work category",app.category],["Preferred role",app.role],["Education",app.education],["Work experience",app.yearsExperience],["Date of birth",app.dateOfBirth],["Passport status",app.passport],["Additional experience",app.experience||"Not provided"],["Payment amount","UGX 5,000"],["Payment reference",reference],["Mobile-money number",phone]];
    return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17252b"><h2>Hashein Uganda application</h2><table style="border-collapse:collapse;width:100%">${fields.map(([k,v])=>`<tr><th align="left" style="padding:8px;border:1px solid #ddd">${escapeHtml(k)}</th><td style="padding:8px;border:1px solid #ddd">${escapeHtml(v)}</td></tr>`).join("")}</table></div>`;
  }
  $("pay-submit").addEventListener("click",async()=>{
    if(state.isPaying)return;
    const phone=normalizePhone($("paymentPhone").value);
    if(!/^\+2567\d{8}$/.test(phone)){paymentStatus("Enter a valid MTN or Airtel Uganda mobile-money number, for example 0771234567.","error");return;}
    state.isPaying=true;$("pay-submit").disabled=true;
    let paidReference=state.confirmedReference, paymentWasConfirmed=Boolean(state.confirmedReference);
    const app=applicationData();
    try{
      if(!paidReference&&state.paymentReference){
        paymentStatus("Checking the status of your UGX 5,000 payment…");
        const paid=await waitForPayment(state.paymentReference);
        if(!paid)throw new Error("We have not received confirmation for payment reference "+state.paymentReference+" yet. Check your mobile-money messages before starting a new payment.");
        paidReference=state.paymentReference;state.confirmedReference=paidReference;paymentWasConfirmed=true;
      }else if(!paidReference){
        paymentStatus("Starting your UGX 5,000 application fee payment…");
        const reference=await startPayment(phone);state.paymentReference=reference;paidReference=reference;
        $("payment-reference").textContent="Payment reference: "+reference;show($("payment-reference"));
        paymentStatus("Payment prompt sent. Approve UGX 5,000 on your phone. Keep this page open.");
        const paid=await waitForPayment(reference);
        if(!paid)throw new Error("We have not received confirmation for payment reference "+reference+" yet. Check your mobile-money messages before starting a new payment.");
        state.confirmedReference=reference;paymentWasConfirmed=true;
      }
      paymentStatus("Payment confirmed. Securely submitting your application…");
      const id=await submitApplication(paidReference,phone,app);
      show($("payment-step"),false);show($("success-step"),true);state.step=5;
      $("success-id").textContent=id;$("success-message").textContent="Your form was submitted to Hashein Uganda successfully. Application ID: "+id+".";
      $("application-form").scrollIntoView({behavior:"smooth",block:"start"});
      const confirmHtml=`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17252b"><h2>Application submitted successfully</h2><p>Hello ${escapeHtml(app.fullName)},</p><p>Your form was submitted to Hashein Uganda successfully. We have confirmed your UGX 5,000 application fee and recorded your application.</p><p><strong>Application ID:</strong> ${escapeHtml(id)}</p><p><strong>Payment reference:</strong> ${escapeHtml(paidReference)}</p><p>Thank you,<br>Hashein Uganda</p></div>`;
      const results=await Promise.allSettled([sendEmail(app.email,"Your form was submitted to Hashein Uganda successfully",confirmHtml),sendEmail(ADMIN_EMAIL,"New Hashein Uganda application: "+(app.fullName||id),adminEmailHtml(app,id,paidReference,phone))]);
      if(results.some(r=>r.status==="rejected"))console.warn("One or more confirmation emails could not be delivered.",results);
    }catch(err){
      paymentStatus((paymentWasConfirmed?"Payment was already received. Retrying will not charge you again. ":"")+((err&&err.message)||"Something went wrong. Please try again."),"error");
    }finally{state.isPaying=false;$("pay-submit").disabled=false;$("pay-submit").textContent=state.confirmedReference?"Retry submission":state.paymentReference?"Check payment again":"Pay UGX 5,000 & submit";}
  });
  $("back-to-details").addEventListener("click",()=>{if(state.isPaying)return;setStep(2);});
  $("pay-submit").textContent="Pay UGX 5,000 & submit ↗";
  $("pay-submit").insertAdjacentHTML("afterend",'<button class="text-button" type="button" id="start-new-payment">Start a new payment</button>');
  $("start-new-payment").addEventListener("click",()=>show($("new-payment-warning")));
  $("cancel-new-payment").addEventListener("click",()=>show($("new-payment-warning"),false));
  $("confirm-new-payment").addEventListener("click",()=>{
    if(state.isPaying)return;
    state.paymentReference="";state.confirmedReference="";show($("new-payment-warning"),false);show($("payment-reference"),false);paymentStatus("");$("pay-submit").textContent="Pay UGX 5,000 & submit ↗";
  });

  // Accept only known query values when pre-filling from homepage role/destination links.
  const params=new URLSearchParams(location.search);
  const cat=categories.find(c=>c.name===params.get("category"));
  if(cat){$("category").value=cat.name;fillRoles(params.get("role")||"");}
  const destination=params.get("destination");
  if(destination&&destinations.includes(destination))$("destination").value=destination;
})();