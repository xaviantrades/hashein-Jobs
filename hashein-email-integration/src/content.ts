// Replace this placeholder with the Hashein Uganda business email before deployment.
export const ADMIN_EMAIL = "YOUR_EMAIL_HERE@example.com";
export const EMAIL_WORKER_URL = "https://round-smoke-cd6a.geraldsaviour623.workers.dev";
export const CONTACT_PHONE = "+256780611480";
export const OTHER_ROLE = "Other / not listed";

export const navigation = [
  { label: "Our story", href: "#about" },
  { label: "Opportunities", href: "#opportunities" },
  { label: "How it works", href: "#process" },
  { label: "FAQs", href: "#faqs" },
  { label: "Contact", href: "#contact" },
];

export const categories = [
  {
    id: "office",
    name: "Office & professional",
    description: "Ideas, organization and people skills.",
    roles: [
      "Administrative assistant", "Receptionist", "Customer service representative",
      "Accountant", "Sales representative", "IT support", "Data entry clerk",
      "Human resources assistant",
    ],
  },
  {
    id: "trades",
    name: "Construction & trades",
    description: "Hands-on skill that builds the future.",
    roles: [
      "Construction worker", "Mason / bricklayer", "Carpenter", "Welder",
      "Electrician", "Plumber", "Painter", "Steel fixer",
    ],
  },
  {
    id: "hospitality",
    name: "Hospitality & care",
    description: "Making every place feel more human.",
    roles: [
      "Housekeeper", "Domestic worker / maid", "Nanny / childcare worker", "Caregiver",
      "Cook / chef", "Waiter / waitress", "Hotel attendant", "Cleaner",
    ],
  },
  {
    id: "transport",
    name: "Transport & logistics",
    description: "Keeping people and businesses moving.",
    roles: [
      "Light vehicle driver", "Heavy vehicle driver", "Delivery rider", "Warehouse assistant",
      "Forklift operator", "Porter", "Storekeeper", "Packing assistant",
    ],
  },
  {
    id: "industry",
    name: "Industry & manufacturing",
    description: "Practical talent behind every product.",
    roles: [
      "Factory worker", "Machine operator", "Assembly worker", "Industrial technician",
      "Quality inspector", "Potter / ceramics worker",
    ],
  },
  {
    id: "specialist",
    name: "Specialist & other roles",
    description: "Your experience may open a different door.",
    roles: [
      "Nurse / health assistant", "Engineer", "Teacher", "Security officer",
      "Agricultural worker", OTHER_ROLE,
    ],
  },
];

export const destinations = [
  { name: "United Arab Emirates", detail: "Dubai and other emirates", value: "United Arab Emirates" },
  { name: "Qatar", detail: "", value: "Qatar" },
  { name: "Saudi Arabia", detail: "", value: "Saudi Arabia" },
  { name: "Oman", detail: "", value: "Oman" },
  { name: "China", detail: "", value: "China" },
  { name: "Turkey", detail: "", value: "Turkey" },
  { name: "Other Middle Eastern destinations", detail: "", value: "Other Middle Eastern destination" },
];

export const eastAfricanCountries = [
  "Uganda", "Kenya", "Tanzania", "Rwanda", "Burundi", "South Sudan",
  "Ethiopia", "Somalia", "Djibouti", "Eritrea",
];

export const otherAfricanCountries = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Cabo Verde",
  "Cameroon", "Central African Republic", "Chad", "Comoros", "Congo",
  "Cote d'Ivoire", "Democratic Republic of the Congo", "Egypt",
  "Equatorial Guinea", "Eswatini", "Gabon", "Gambia", "Ghana", "Guinea",
  "Guinea-Bissau", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi",
  "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia",
  "Niger", "Nigeria", "Sao Tome and Principe", "Senegal", "Seychelles",
  "Sierra Leone", "South Africa", "Sudan", "Togo", "Tunisia", "Zambia", "Zimbabwe",
];

export const educationOptions = [
  "S.4 / O-Level certificate", "S.6 / A-Level certificate", "Vocational or trade certificate",
  "Professional certificate", "Diploma", "Bachelor's degree", "Master's degree or higher",
  "Practical experience / other",
];

export const steps = [
  {
    number: "01",
    title: "Explore what fits",
    description: "Browse the fields we recruit for and choose a role and destination that interest you.",
  },
  {
    number: "02",
    title: "Tell us about you",
    description: "Select your country of origin and share your qualifications and work experience.",
  },
  {
    number: "03",
    title: "Have a conversation",
    description: "Submit your application securely online and receive email updates about its status.",
  },
  {
    number: "04",
    title: "Prepare to move forward",
    description: "If there is a suitable opportunity, we can guide you through documents, passports and visa processing.",
  },
];

export const faqs = [
  {
    question: "Can I apply if I don't have a passport yet?",
    answer: "Yes. You can make an initial enquiry with your national ID. If a suitable opportunity is available, our team can explain the passport application process and any applicable visa steps. A passport is not required to complete this first form.",
  },
  {
    question: "Do I need a university degree to apply?",
    answer: "No. Opportunities may suit people with S.4 or S.6 certificates, vocational or professional certificates, diplomas, bachelor's or master's degrees, or relevant practical experience. Each employer and role has its own requirements.",
  },
  {
    question: "Can I apply if I am not from Uganda?",
    answer: "Yes. Hashein Uganda works with candidates from across Africa, particularly East Africa, and can consider enquiries from other countries. Select your country of origin in the application form so we can understand your situation.",
  },
  {
    question: "What documents will I need?",
    answer: "Usually a national ID, your birth details, and education or training documents if the role requires them. A passport is helpful if you have one, but you can still enquire without it. Please do not send ID or passport numbers through the website form; our team will explain document requirements directly.",
  },
  {
    question: "Is a job or visa guaranteed?",
    answer: "No. Availability depends on employers and open positions. Selection, documentation and visa approvals depend on the requirements of the employer and the relevant authorities. We will discuss the applicable process with you before you proceed.",
  },
];

export type Application = {
  origin: string;
  otherOrigin: string;
  destination: string;
  category: string;
  role: string;
  otherRole: string;
  education: string;
  yearsExperience: string;
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  passport: string;
  experience: string;
  consent: boolean;
};

export const initialApplication: Application = {
  origin: "", otherOrigin: "", destination: "", category: "", role: "",
  otherRole: "", education: "", yearsExperience: "", fullName: "", phone: "",
  email: "", dateOfBirth: "", passport: "", experience: "", consent: false,
};