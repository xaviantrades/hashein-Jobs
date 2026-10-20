/*
 * Shared site content for the framework-free build.
 * Loaded before js/site.js, js/main.js and js/signup.js; exposes window.HASHEIN.
 */
(function () {
  "use strict";

  // Replace this placeholder with the Hashein Uganda business email before deployment.
  var ADMIN_EMAIL = "geraldsaviour623@gmail.com";

  window.HASHEIN = {
    ADMIN_EMAIL: ADMIN_EMAIL,
    // Used to hide broken mailto: links while the placeholder is still configured.
    hasAdminEmail: ADMIN_EMAIL.indexOf("YOUR_EMAIL_HERE") === -1,
    EMAIL_WORKER_URL: "https://round-smoke-cd6a.geraldsaviour623.workers.dev",
    CONTACT_PHONE: "+256780611480",
    OTHER_ROLE: "Other / not listed",

    navigation: [
      { label: "Our story", href: "#about" },
      { label: "Opportunities", href: "#opportunities" },
      { label: "How it works", href: "#process" },
      { label: "FAQs", href: "#faqs" },
      { label: "Contact", href: "#contact" }
    ],

    categories: [
      {
        id: "office",
        name: "Office & professional",
        description: "Ideas, organization and people skills.",
        roles: [
          "Administrative assistant", "Receptionist", "Customer service representative",
          "Accountant", "Sales representative", "IT support", "Data entry clerk",
          "Human resources assistant"
        ]
      },
      {
        id: "trades",
        name: "Construction & trades",
        description: "Hands-on skill that builds the future.",
        roles: [
          "Construction worker", "Mason / bricklayer", "Carpenter", "Welder",
          "Electrician", "Plumber", "Painter", "Steel fixer"
        ]
      },
      {
        id: "hospitality",
        name: "Hospitality & care",
        description: "Making every place feel more human.",
        roles: [
          "Housekeeper", "Domestic worker / maid", "Nanny / childcare worker", "Caregiver",
          "Cook / chef", "Waiter / waitress", "Hotel attendant", "Cleaner"
        ]
      },
      {
        id: "transport",
        name: "Transport & logistics",
        description: "Keeping people and businesses moving.",
        roles: [
          "Light vehicle driver", "Heavy vehicle driver", "Delivery rider", "Warehouse assistant",
          "Forklift operator", "Porter", "Storekeeper", "Packing assistant"
        ]
      },
      {
        id: "industry",
        name: "Industry & manufacturing",
        description: "Practical talent behind every product.",
        roles: [
          "Factory worker", "Machine operator", "Assembly worker", "Industrial technician",
          "Quality inspector", "Potter / ceramics worker"
        ]
      },
      {
        id: "specialist",
        name: "Specialist & other roles",
        description: "Your experience may open a different door.",
        roles: [
          "Nurse / health assistant", "Engineer", "Teacher", "Security officer",
          "Agricultural worker", "Other / not listed"
        ]
      }
    ],

    destinations: [
      { name: "United Arab Emirates", detail: "Dubai and other emirates", value: "United Arab Emirates" },
      { name: "Qatar", detail: "", value: "Qatar" },
      { name: "Saudi Arabia", detail: "", value: "Saudi Arabia" },
      { name: "Oman", detail: "", value: "Oman" },
      { name: "China", detail: "", value: "China" },
      { name: "Turkey", detail: "", value: "Turkey" },
      { name: "Other Middle Eastern destinations", detail: "", value: "Other Middle Eastern destination" }
    ],

    eastAfricanCountries: [
      "Uganda", "Kenya", "Tanzania", "Rwanda", "Burundi", "South Sudan",
      "Ethiopia", "Somalia", "Djibouti", "Eritrea"
    ],

    otherAfricanCountries: [
      "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Cabo Verde",
      "Cameroon", "Central African Republic", "Chad", "Comoros", "Congo",
      "Cote d'Ivoire", "Democratic Republic of the Congo", "Egypt",
      "Equatorial Guinea", "Eswatini", "Gabon", "Gambia", "Ghana", "Guinea",
      "Guinea-Bissau", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi",
      "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia",
      "Niger", "Nigeria", "Sao Tome and Principe", "Senegal", "Seychelles",
      "Sierra Leone", "South Africa", "Sudan", "Togo", "Tunisia", "Zambia", "Zimbabwe"
    ],

    educationOptions: [
      "S.4 / O-Level certificate", "S.6 / A-Level certificate", "Vocational or trade certificate",
      "Professional certificate", "Diploma", "Bachelor's degree", "Master's degree or higher",
      "Practical experience / other"
    ],

    experienceOptions: [
      "Just starting out", "Less than 1 year", "1-2 years", "3-5 years", "6 years or more"
    ]
  };
})();
