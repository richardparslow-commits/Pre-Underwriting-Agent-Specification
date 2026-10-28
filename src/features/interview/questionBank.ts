import type { DetailPrompt, Question, QuestionOption } from "./types";
import { sourceRefFor } from "./questionSourceRefs";

/**
 * Shared prompts for questions split from one source item. The source asks for
 * the same detail under several windows, so the detail itself is defined once.
 */
const NICOTINE_PRODUCT_OPTIONS: QuestionOption[] = [
  { value: "cigarettes", label: "Cigarettes" },
  { value: "vaping", label: "Vaping or e-cigarettes" },
  { value: "chewing", label: "Chewing tobacco or snuff" },
  { value: "cigars", label: "Cigars" },
  { value: "pipe", label: "Pipe" },
  { value: "nicotine_replacement", label: "Patch, gum, lozenge or inhaler" },
  { value: "hookah", label: "Hookah, clove or bidis" },
  { value: "pouches", label: "Nicotine pouches" },
  { value: "other", label: "Another form" },
];

const NICOTINE_USE_DETAIL: DetailPrompt[] = [
  {
    id: "products",
    label: "Which forms?",
    kind: "multi_choice",
    options: NICOTINE_PRODUCT_OPTIONS,
  },
  { id: "amount", label: "How much and how often?", kind: "short_text", placeholder: "e.g. half a pack a day" },
];

const CONVICTION_DETAIL: DetailPrompt[] = [
  { id: "offence", label: "What was the offence?", kind: "short_text" },
  {
    id: "when",
    label: "Approximate date of arrest or conviction",
    kind: "short_text",
    placeholder: "MM/YYYY",
  },
  {
    id: "outcome",
    label: "How was it resolved?",
    kind: "single_choice",
    options: [
      { value: "convicted", label: "Convicted at trial" },
      { value: "guilty", label: "Pleaded guilty" },
      { value: "no_contest", label: "Pleaded no contest" },
      { value: "pending", label: "Charge still pending" },
    ],
  },
  {
    id: "custody",
    label: "Was any jail time, probation or parole involved?",
    kind: "single_choice",
    options: [
      { value: "none", label: "No" },
      { value: "probation", label: "Probation" },
      { value: "parole", label: "Parole" },
      { value: "custody", label: "Time in custody" },
      { value: "both", label: "Custody and supervision" },
    ],
  },
  { id: "release", label: "Approximate release or completion date (optional)", kind: "short_text" },
];

const SUPERVISION_DETAIL: DetailPrompt[] = [
  {
    id: "kind",
    label: "Which one applies?",
    kind: "single_choice",
    options: [
      { value: "incarceration", label: "Incarceration" },
      { value: "probation", label: "Probation" },
      { value: "parole", label: "Parole" },
      { value: "other", label: "Other court-ordered supervision" },
    ],
  },
  {
    id: "when",
    label: "Approximate start, release or completion date",
    kind: "short_text",
    placeholder: "MM/YYYY",
  },
  {
    id: "ongoing",
    label: "Is it still in effect?",
    kind: "single_choice",
    options: [
      { value: "no", label: "No, it has ended" },
      { value: "yes", label: "Yes" },
      { value: "unknown", label: "I'm not sure" },
    ],
  },
];

const ALCOHOL_DETAIL: DetailPrompt[] = [
  { id: "what", label: "What was recommended or treated?", kind: "short_text" },
  { id: "when", label: "Approximate year", kind: "short_text", placeholder: "YYYY" },
  {
    id: "status",
    label: "Current status",
    kind: "single_choice",
    options: [
      { value: "stopped", label: "I no longer drink" },
      { value: "reduced", label: "I drink less now" },
      { value: "ongoing", label: "I am in treatment now" },
      { value: "declined", label: "Prefer not to say" },
    ],
  },
];

const SUBSTANCE_DETAIL: DetailPrompt[] = [
  { id: "what", label: "Which substance or treatment?", kind: "short_text" },
  { id: "when", label: "Approximate year", kind: "short_text", placeholder: "YYYY" },
  {
    id: "now",
    label: "Is this still happening?",
    kind: "single_choice",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
      { value: "declined", label: "Prefer not to say" },
    ],
  },
];

const CONDITION_DETAIL: DetailPrompt[] = [
  { id: "condition", label: "Which condition?", kind: "short_text" },
  { id: "when", label: "Approximate year of diagnosis", kind: "short_text", placeholder: "YYYY" },
  { id: "treatment", label: "Treatment or medication now", kind: "short_text" },
];

/**
 * Versioned question bank for the pre-underwriting interview.
 *
 * Provenance is not hand-written here. `sourceRef` is derived from
 * reconciliation.ts, which traces each row to the source index. The verbatim
 * source wording is build/audit-only and is attached server-side, so held
 * wording is not shipped in the customer bundle.
 *
 * Every row is reconciled but not yet signed off: `sourceVerified` stays false
 * until a named reviewer accepts the record and the decisions its `action`
 * field asks for. See docs/question-bank-reconciliation.md.
 */
export const QUESTION_BANK: Question[] = [
  // Identity
  {
    id: "ID-01",
    section: "identity",
    sourceRef: sourceRefFor("ID-01"),
    customerText: "What is your date of birth?",
    helpText: "Used to route your review to the right age band. It is not used to look you up anywhere.",
    kind: "date",
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "ID-02",
    section: "identity",
    sourceRef: sourceRefFor("ID-02"),
    customerText: "Where were you born?",
    helpText: "City and country is enough. This is not a citizenship question.",
    kind: "short_text",
    placeholder: "City, country",
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "ID-03",
    section: "identity",
    sourceRef: sourceRefFor("ID-03"),
    customerText: "Which state do you currently live in?",
    helpText: "Residence decides which state rules and licensed agents apply to your review.",
    kind: "short_text",
    placeholder: "State",
    reviewStatus: "approved",
    // Routing field the specification asks for separately; the PDF never asks it.
    status: "supplemental",
    sourceVerified: false,
  },
  {
    id: "ID-04",
    section: "identity",
    sourceRef: sourceRefFor("ID-04"),
    customerText: "Held for review: a source question requiring jurisdiction and carrier approval.",
    sensitive: true,
    kind: "short_text",
    reviewStatus: "human_review_required",
    status: "core",
    sourceVerified: false,
  },

  // Medical history — one row per source question. The source keeps separate
  // questions for the 2, 3, 5, 7 and 10-year windows, and several of them name
  // overlapping conditions on purpose; each is asked in its own window rather
  // than folded into one "ever" answer.
  {
    id: "MED-01",
    section: "medical",
    sourceRef: sourceRefFor("MED-01"),
    customerText:
      "In the past 12 months, have you had surgical treatment for morbid obesity, been declined for life insurance coverage, or had diagnostic testing (excluding HIV/AIDS tests), surgery or a hospital stay recommended by a medical professional that has not been completed or for which the results have not been received?",
    timeframe: "Past 12 months",
    kind: "yesno",
    detailPrompts: [
      { id: "what", label: "Which of these applies?", kind: "short_text" },
      { id: "when", label: "Approximate month and year", kind: "short_text", placeholder: "MM/YYYY" },
      {
        id: "pending",
        label: "Is anything still pending or awaiting results?",
        kind: "single_choice",
        options: [
          { value: "no", label: "No, everything is complete" },
          { value: "yes", label: "Yes, something is still pending" },
          { value: "unknown", label: "I'm not sure" },
        ],
      },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-02",
    section: "medical",
    sourceRef: sourceRefFor("MED-02"),
    customerText:
      "In the past 12 months, have you consulted a medical professional, had surgery or been hospitalized, or had diagnostic tests (excluding HIV/AIDS) such as an EKG, X-ray, MRI or CAT scan?",
    timeframe: "Past 12 months",
    kind: "yesno",
    detailPrompts: [
      { id: "what", label: "What did you have done?", kind: "short_text" },
      { id: "when", label: "Approximate month and year", kind: "short_text", placeholder: "MM/YYYY" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-03",
    section: "medical",
    sourceRef: sourceRefFor("MED-03"),
    customerText:
      "In the past 2 years, have you been medically diagnosed with or treated for angina (chest pain), a stroke or TIA, cardiomyopathy, systemic lupus (SLE), cirrhosis, hepatitis C or chronic hepatitis, chronic pancreatitis, chronic obstructive pulmonary disease (COPD), emphysema or chronic bronchitis, or have you required oxygen equipment to help you breathe?",
    timeframe: "Past 2 years",
    kind: "yesno",
    detailPrompts: CONDITION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-04",
    section: "medical",
    sourceRef: sourceRefFor("MED-04"),
    customerText:
      "In the past 2 years, have you had a heart attack or aneurysm, or had — or been medically advised to have — any type of heart, brain or circulatory surgery, including a pacemaker or defibrillator, or any procedure to improve circulation?",
    timeframe: "Past 2 years",
    kind: "yesno",
    detailPrompts: CONDITION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-06",
    section: "medical",
    sourceRef: sourceRefFor("MED-06"),
    customerText:
      "In the past 3 years, have you been treated for, diagnosed with, or prescribed medication for chronic bronchitis, emphysema, COPD, an irregular heartbeat, seizures, a blood clot or an aneurysm?",
    timeframe: "Past 3 years",
    helpText:
      "The source asks this separately from its 2-year question, so both windows are kept.",
    kind: "yesno",
    detailPrompts: CONDITION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-08",
    section: "medical",
    sourceRef: sourceRefFor("MED-08"),
    customerText:
      "In the past 5 years, have you been treated for, diagnosed with, or prescribed medication for internal cancer, melanoma, Hodgkin's disease or lymphoma?",
    timeframe: "Past 5 years",
    kind: "yesno",
    detailPrompts: CONDITION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-12",
    section: "medical",
    sourceRef: sourceRefFor("MED-12"),
    customerText:
      "In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for high blood pressure, a heart attack, angina, an arrhythmia, a stroke, an aneurysm, or any heart or circulatory disease or disorder?",
    timeframe: "Past 7 years",
    kind: "yesno",
    detailPrompts: CONDITION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-13",
    section: "medical",
    sourceRef: sourceRefFor("MED-13"),
    customerText:
      "In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for diabetes, cirrhosis, hepatitis, pancreatitis, Crohn's disease, ulcerative colitis, or any digestive or liver disease or disorder?",
    timeframe: "Past 7 years",
    kind: "yesno",
    detailPrompts: CONDITION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-14",
    section: "medical",
    sourceRef: sourceRefFor("MED-14"),
    customerText:
      "In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for asthma, emphysema, COPD, sleep apnea, or any respiratory disease or disorder?",
    timeframe: "Past 7 years",
    kind: "yesno",
    detailPrompts: CONDITION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-20",
    section: "medical",
    sourceRef: sourceRefFor("MED-20"),
    customerText:
      "Have you ever been diagnosed with sleep apnoea within the last 6 months, or with sleep apnoea that is not being treated?",
    timeframe: "Last 6 months, or untreated",
    helpText:
      "The source asks this separately from its 7-year respiratory question, because recent or untreated sleep apnoea matters on its own.",
    kind: "yesno",
    detailPrompts: [
      { id: "diagnosed", label: "When were you diagnosed?", kind: "short_text", placeholder: "MM/YYYY" },
      {
        id: "treatment",
        label: "Are you being treated for it?",
        kind: "single_choice",
        options: [
          { value: "cpap", label: "Yes, with CPAP or another device" },
          { value: "lifestyle", label: "Yes, with lifestyle changes only" },
          { value: "no", label: "No, not currently treated" },
        ],
      },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-15",
    section: "medical",
    sourceRef: sourceRefFor("MED-15"),
    customerText:
      "In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for cancer in any form, anemia, seizures, bipolar disorder, schizophrenia, Alzheimer's, dementia, or a mental or nervous disorder?",
    timeframe: "Past 7 years",
    helpText:
      "This is the source's 7-year question. Its 5-year cancer question is asked separately above.",
    kind: "yesno",
    detailPrompts: CONDITION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-16",
    section: "medical",
    sourceRef: sourceRefFor("MED-16"),
    customerText:
      "In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for any disease or disorder of the kidneys, urinary bladder, prostate or reproductive organs, or a sexually transmitted disease?",
    timeframe: "Past 7 years",
    kind: "yesno",
    sensitive: true,
    detailPrompts: CONDITION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-17",
    section: "medical",
    sourceRef: sourceRefFor("MED-17"),
    customerText:
      "In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for a connective tissue disease, systemic lupus (SLE), arthritis, or any disorder of the back, joints, muscles or nervous system?",
    timeframe: "Past 7 years",
    kind: "yesno",
    detailPrompts: CONDITION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-18",
    section: "medical",
    sourceRef: sourceRefFor("MED-18"),
    customerText:
      "In the past 10 years, have you taken medication to treat high blood pressure or an elevated cholesterol level?",
    timeframe: "Past 10 years",
    kind: "yesno",
    detailPrompts: [
      { id: "condition", label: "What was the medication for?", kind: "short_text" },
      { id: "when", label: "Approximate year you started it", kind: "short_text", placeholder: "YYYY" },
      { id: "treatment", label: "What are you taking now?", kind: "short_text" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-19",
    section: "medical",
    sourceRef: sourceRefFor("MED-19"),
    customerText:
      "In the past 10 years, have you been medically diagnosed with, tested for, or received treatment for diabetes, cancer, or cardiac disease (heart attack, myocardial infarction, angina, cardiac insufficiency, cerebral thrombosis or coronary artery disease)?",
    timeframe: "Past 10 years",
    kind: "yesno",
    detailPrompts: CONDITION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },

  {
    id: "MED-21",
    section: "medical",
    sourceRef: sourceRefFor("MED-21"),
    customerText:
      "Have you been treated, diagnosed or prescribed medication for diabetes before age 21, do you currently take insulin, or has diabetes been diagnosed together with retinopathy, nephropathy, neuropathy, insulin shock or diabetic coma?",
    timeframe: "Ever / current",
    helpText: "Any one of the three counts.",
    kind: "yesno",
    detailPrompts: [
      {
        id: "which",
        label: "Which applies?",
        kind: "multi_choice",
        options: [
          { value: "early", label: "Diabetes before age 21" },
          { value: "insulin", label: "Insulin now" },
          { value: "complication", label: "One of the listed complications" },
        ],
      },
      { id: "when", label: "Approximate year of diagnosis", kind: "short_text", placeholder: "YYYY" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-22",
    section: "medical",
    sourceRef: sourceRefFor("MED-22"),
    customerText:
      "In the past 12 months, have you used a walker, wheelchair, electric scooter, supplemental oxygen, or catheter?",
    timeframe: "Past 12 months",
    kind: "yesno",
    detailPrompts: [
      {
        id: "which",
        label: "Which have you used?",
        kind: "multi_choice",
        options: [
          { value: "walker", label: "Walker" },
          { value: "wheelchair", label: "Wheelchair" },
          { value: "scooter", label: "Electric scooter" },
          { value: "oxygen", label: "Supplemental oxygen" },
          { value: "catheter", label: "Catheter" },
        ],
      },
      { id: "why", label: "What is it for?", kind: "short_text" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-23",
    section: "medical",
    sourceRef: sourceRefFor("MED-23"),
    customerText: "Have you ever received an organ transplant?",
    timeframe: "Ever",
    kind: "yesno",
    detailPrompts: [
      { id: "organ", label: "Which organ?", kind: "short_text" },
      { id: "when", label: "Approximate year", kind: "short_text", placeholder: "YYYY" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-24",
    section: "medical",
    sourceRef: sourceRefFor("MED-24"),
    customerText:
      "Are you currently confined to a hospital, or to a medical or rehabilitation facility?",
    timeframe: "Currently",
    helpText: "This is about the time of this application, as the source asks.",
    kind: "yesno",
    detailPrompts: [
      { id: "why", label: "What are you being treated for?", kind: "short_text" },
      { id: "since", label: "Since when?", kind: "short_text", placeholder: "MM/YYYY" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-25",
    section: "medical",
    sourceRef: sourceRefFor("MED-25"),
    customerText:
      "Has a parent, brother or sister ever had kidney disease, needed a major organ transplant, or been diagnosed with heart disease, cerebrovascular disease, or internal cancer before age 60?",
    timeframe: "Ever, before age 60",
    kind: "yesno",
    detailPrompts: [
      {
        id: "who",
        label: "Which relative?",
        kind: "multi_choice",
        options: [
          { value: "mother", label: "Mother" },
          { value: "father", label: "Father" },
          { value: "brother", label: "Brother" },
          { value: "sister", label: "Sister" },
        ],
      },
      { id: "condition", label: "What was the condition?", kind: "short_text" },
      { id: "age", label: "Approximate age at diagnosis", kind: "short_text", placeholder: "Age" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-26",
    section: "medical",
    sourceRef: sourceRefFor("MED-26"),
    customerText:
      "Have more than one member of your family — father, mother, brother or sister — died before age 60 from breast, colon, intestinal or prostate cancer, or from cardiovascular disease?",
    timeframe: "Ever, before age 60",
    kind: "yesno",
    detailPrompts: [
      { id: "howMany", label: "How many family members?", kind: "short_text" },
      { id: "condition", label: "What did they die from?", kind: "short_text" },
      { id: "ages", label: "Approximate ages at death", kind: "short_text" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-09",
    section: "medical",
    sourceRef: sourceRefFor("MED-09"),
    customerText: "Which prescription medications do you take regularly today?",
    helpText:
      "Include anything prescribed for you, even if you take it only occasionally. Write none if you take nothing regularly.",
    kind: "long_text",
    placeholder: "Medication name, dose and how often — or none",
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-10",
    section: "medical",
    sourceRef: sourceRefFor("MED-10"),
    customerText:
      "In the past 5 years, have you been unable to work, or needed help with daily activities because of your health?",
    timeframe: "Past 5 years",
    helpText: "This is about you, not a family member.",
    kind: "yesno",
    detailPrompts: [
      { id: "what", label: "What was the reason?", kind: "short_text" },
      {
        id: "ongoing",
        label: "Is this still the case?",
        kind: "single_choice",
        options: [
          { value: "no", label: "No, I have recovered" },
          { value: "yes", label: "Yes, it is still the case" },
          { value: "unknown", label: "It varies" },
        ],
      },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MED-11",
    section: "medical",
    sourceRef: sourceRefFor("MED-11"),
    customerText: "Held for review: a sensitive medical question requiring legal and clinical approval.",
    sensitive: true,
    kind: "yesno",
    reviewStatus: "human_review_required",
    status: "core",
    sourceVerified: false,
  },

  // Mental health
  {
    id: "MH-01",
    section: "mental",
    sourceRef: sourceRefFor("MH-01"),
    customerText:
      "Have you ever been diagnosed with or treated for a mental health condition, such as anxiety or depression?",
    timeframe: "Ever",
    helpText: "You can skip this question. Skipping it is recorded as declined, not as No.",
    kind: "yesno",
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MH-02",
    section: "mental",
    sourceRef: sourceRefFor("MH-02"),
    customerText: "A little about the condition and the care you received.",
    timeframe: "Ever",
    kind: "short_text",
    compound: true,
    fields: [
      {
        id: "condition",
        label: "Main condition",
        kind: "single_choice",
        options: [
          { value: "anxiety", label: "Anxiety or panic" },
          { value: "depression", label: "Depression" },
          { value: "both", label: "Anxiety and depression" },
          { value: "other", label: "Something else" },
        ],
      },
      { id: "diagnosisYear", label: "Approximate year you were first treated", kind: "short_text", placeholder: "YYYY" },
      {
        id: "treatmentType",
        label: "What kind of care?",
        kind: "multi_choice",
        options: [
          { value: "therapy", label: "Talking therapy or counselling" },
          { value: "medication", label: "Medication" },
          { value: "inpatient", label: "Hospital or intensive care" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "currentStatus",
        label: "Current status",
        kind: "single_choice",
        options: [
          { value: "resolved", label: "Resolved, no treatment now" },
          { value: "ongoing", label: "Ongoing treatment" },
          { value: "unknown", label: "It varies" },
        ],
      },
    ],
    askWhen: { questionId: "MH-01", includes: ["yes"] },
    reviewStatus: "approved",
    status: "supplemental",
    sourceVerified: false,
  },
  {
    id: "MH-03",
    section: "mental",
    sourceRef: sourceRefFor("MH-03"),
    customerText:
      "In the past 5 years, has a mental health condition caused you to miss work or stop working?",
    timeframe: "Past 5 years",
    kind: "yesno",
    detailPrompts: [
      {
        id: "duration",
        label: "Roughly how long were you away from work?",
        kind: "single_choice",
        options: [
          { value: "days", label: "A few days" },
          { value: "weeks", label: "A few weeks" },
          { value: "months", label: "Several months" },
          { value: "over_year", label: "More than a year" },
        ],
      },
      {
        id: "now",
        label: "Are you working now?",
        kind: "single_choice",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "other", label: "Not currently, for another reason" },
        ],
      },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MH-04",
    section: "mental",
    sourceRef: sourceRefFor("MH-04"),
    customerText:
      "Have you ever had thoughts of ending your life, or made a suicide attempt?",
    timeframe: "Ever",
    helpText:
      "This is asked because it can matter to a life-insurance review. You can choose Prefer not to answer and Richard will follow up with you directly.",
    kind: "yesno",
    sensitive: true,
    detailPrompts: [
      { id: "when", label: "Approximate year (optional)", kind: "short_text", placeholder: "YYYY" },
      {
        id: "support",
        label: "Did you receive support or treatment afterwards?",
        kind: "single_choice",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "declined", label: "Prefer not to say" },
        ],
      },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MH-05",
    section: "mental",
    sourceRef: sourceRefFor("MH-05"),
    customerText: "Are you having thoughts of harming yourself right now?",
    helpText:
      "If you are, please stop here and call or text 988, or call 911 if your life is in immediate danger. This site does not monitor emergencies.",
    timeframe: "Right now",
    kind: "yesno",
    sensitive: true,
    // Asked of every customer, whatever the answer to MH-04. Gating it on a Yes
    // hid the question — and the crisis panel — from anyone who declined or was
    // unsure about their history, which is the group most likely to need it.
    crisisFollowUp: true,
    reviewStatus: "approved",
    status: "supplemental",
    sourceVerified: false,
  },
  {
    id: "MH-06",
    section: "mental",
    sourceRef: sourceRefFor("MH-06"),
    customerText: "Held for review: a sensitive mental-health detail requiring clinical approval.",
    sensitive: true,
    kind: "long_text",
    reviewStatus: "human_review_required",
    status: "core",
    sourceVerified: false,
  },

  {
    id: "MH-07",
    section: "mental",
    sourceRef: sourceRefFor("MH-07"),
    customerText:
      "In the past 5 years, have you seen a psychiatrist, or had treatment as a hospital outpatient, for a mental health condition?",
    timeframe: "Past 5 years",
    helpText: "This is separate from the ever-diagnosed question, because the source asks its own 5-year window.",
    kind: "yesno",
    detailPrompts: [
      { id: "when", label: "Approximate year", kind: "short_text", placeholder: "YYYY" },
      { id: "what", label: "What was the treatment for?", kind: "short_text" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  // Nicotine — one row per window. SRC-040 asks three windows in one question
  // and SRC-042 carries the conditional last-use date; each is asked separately
  // so no answer has to stand for a window it was not given for.
  {
    id: "NIC-01",
    section: "nicotine",
    sourceRef: sourceRefFor("NIC-01"),
    customerText:
      "In the past 12 months, have you used tobacco or any nicotine product in any form?",
    timeframe: "Past 12 months",
    helpText:
      "Occasional cigar or pipe use is excluded. Everything else counts: cigarettes, e-cigarettes or vaping, chewing tobacco, snuff, cigars, pipes, nicotine patches, gum, lozenges, inhalers, hookah, clove or bidis cigarettes, and nicotine pouches.",
    kind: "yesno",
    detailPrompts: NICOTINE_USE_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "NIC-02",
    section: "nicotine",
    sourceRef: sourceRefFor("NIC-02"),
    customerText:
      "In the past 36 months, have you used tobacco or nicotine products in any form?",
    timeframe: "Past 36 months",
    helpText:
      "Occasional cigar or pipe use is excluded. This is a longer window than the previous question and is asked separately on purpose.",
    kind: "yesno",
    detailPrompts: NICOTINE_USE_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "NIC-03",
    section: "nicotine",
    sourceRef: sourceRefFor("NIC-03"),
    customerText:
      "In the past 5 years, have you used nicotine, tobacco, vaping or e-cigarettes in any form?",
    timeframe: "Past 5 years",
    helpText:
      "Occasional cigar or pipe use is excluded. This is the longest of the three nicotine windows.",
    kind: "yesno",
    detailPrompts: NICOTINE_USE_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "NIC-04",
    section: "nicotine",
    sourceRef: sourceRefFor("NIC-04"),
    customerText: "When did you last use any tobacco or nicotine product?",
    timeframe: "Most recent use",
    helpText:
      "Approximate is fine. This is asked because the 12-month answer above was No or not sure.",
    kind: "short_text",
    placeholder: "MM/YYYY",
    askWhen: { questionId: "NIC-01", includes: ["no", "unknown"] },
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },

  // Alcohol — one row per source window. SRC-044 also covers drugs, but the
  // source places it in the alcohol block and asks about alcohol treatment.
  {
    id: "ALC-01",
    section: "alcohol",
    sourceRef: sourceRefFor("ALC-01"),
    customerText: "In the past 12 months, have you drunk alcohol?",
    timeframe: "Past 12 months",
    kind: "yesno",
    detailPrompts: [
      {
        id: "frequency",
        label: "How often?",
        kind: "single_choice",
        options: [
          { value: "rarely", label: "A few times a year" },
          { value: "monthly", label: "Monthly" },
          { value: "weekly", label: "Weekly" },
          { value: "daily", label: "Daily or most days" },
        ],
      },
    ],
    reviewStatus: "approved",
    // Current drinking is an LPP addition: the PDF asks about abuse, treatment,
    // advice to stop and infractions, never whether the customer drinks.
    status: "supplemental",
    sourceVerified: false,
  },
  {
    id: "ALC-02",
    section: "alcohol",
    sourceRef: sourceRefFor("ALC-02"),
    customerText:
      "In the past 7 years, have you abused alcohol, had or been recommended to have treatment or counseling for alcohol use, or been advised to discontinue the use of alcohol?",
    timeframe: "Past 7 years",
    helpText: "The source asks about abuse, treatment and advice to stop in one question.",
    kind: "yesno",
    detailPrompts: ALCOHOL_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "ALC-04",
    section: "alcohol",
    sourceRef: sourceRefFor("ALC-04"),
    customerText:
      "In the past 5 years, have you abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or to have treatment or counseling for alcohol?",
    timeframe: "Past 5 years",
    kind: "yesno",
    detailPrompts: ALCOHOL_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "ALC-05",
    section: "alcohol",
    sourceRef: sourceRefFor("ALC-05"),
    customerText: "In the past 10 years, have you been treated for alcohol abuse?",
    timeframe: "Past 10 years",
    kind: "yesno",
    detailPrompts: ALCOHOL_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "ALC-06",
    section: "alcohol",
    sourceRef: sourceRefFor("ALC-06"),
    customerText:
      "Do you have any history of alcohol abuse or misuse, treatment or counseling, or of being advised to discontinue the use of alcohol?",
    timeframe: "Ever",
    kind: "yesno",
    detailPrompts: ALCOHOL_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "ALC-03",
    section: "alcohol",
    sourceRef: sourceRefFor("ALC-03"),
    customerText:
      "Have you ever had any alcohol- or drug-related infractions, including a history of excessive alcohol use, or an admitted DWI or DUI within the last three years?",
    timeframe: "Ever; DWI or DUI within 3 years",
    helpText:
      "The source includes admitted DWI or DUI within three years in this question, so it is asked here even though the driving section asks about convictions.",
    kind: "yesno",
    detailPrompts: [
      { id: "what", label: "What happened?", kind: "short_text" },
      { id: "when", label: "Approximate year", kind: "short_text", placeholder: "YYYY" },
      {
        id: "outcome",
        label: "How was it resolved?",
        kind: "single_choice",
        options: [
          { value: "dismissed", label: "Dismissed or no charge" },
          { value: "diversion", label: "Diversion or education programme" },
          { value: "convicted", label: "Conviction or fine" },
          { value: "pending", label: "Still pending" },
        ],
      },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },

  // Aviation — SRC-048 and SRC-049 are separate source questions with different
  // windows, so each is asked in its own row. Both are asked of student pilots
  // as well as certificated pilots and crew, and SRC-049 covers flights only
  // contemplated, not made.
  {
    id: "AVI-01",
    section: "aviation",
    sourceRef: sourceRefFor("AVI-01"),
    customerText:
      "In the past 12 months, have you made any flights as a pilot, student pilot, or crew member of any aircraft?",
    timeframe: "Past 12 months",
    helpText: "This includes private, recreational and military flying. Passengers do not count.",
    kind: "yesno",
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "AVI-02",
    section: "aviation",
    sourceRef: sourceRefFor("AVI-02"),
    customerText:
      "In the past 24 months, have you made, or contemplated making, any flights as a pilot, student pilot, or crew member of any aircraft?",
    timeframe: "Past 24 months",
    helpText:
      "Contemplated means you considered a flight even if it did not happen. Passengers do not count.",
    kind: "yesno",
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "AVI-03",
    section: "aviation",
    sourceRef: sourceRefFor("AVI-03"),
    customerText: "A few details about your flying.",
    timeframe: "Past 24 months",
    kind: "short_text",
    compound: true,
    fields: [
      {
        id: "role",
        label: "Your role",
        kind: "single_choice",
        options: [
          { value: "private", label: "Private pilot" },
          { value: "commercial", label: "Commercial pilot" },
          { value: "crew", label: "Crew member" },
          { value: "student", label: "Student pilot" },
          { value: "other", label: "Other" },
        ],
      },
      { id: "certificate", label: "Certificate or rating", kind: "short_text" },
      { id: "hours", label: "Total flying hours (approximate)", kind: "short_text" },
      { id: "aircraft", label: "Aircraft types", kind: "short_text" },
      {
        id: "incident",
        label:
          "Any aircraft accident, grounding, fine or reprimand for an air-regulation violation? (optional)",
        kind: "short_text",
      },
    ],
    askWhen: { questionId: "AVI-02", includes: ["yes"] },
    reviewStatus: "approved",
    status: "supplemental",
    sourceVerified: false,
  },
  {
    id: "AVI-04",
    section: "aviation",
    sourceRef: sourceRefFor("AVI-04"),
    customerText: "Do you plan to fly as a pilot or crew member in the next 12 months?",
    timeframe: "Next 12 months",
    kind: "yesno",
    detailPrompts: [
      { id: "schedule", label: "How often do you expect to fly?", kind: "short_text" },
      {
        id: "type",
        label: "What kind of flying?",
        kind: "single_choice",
        options: [
          { value: "recreational", label: "Recreational" },
          { value: "business", label: "Business or corporate" },
          { value: "airline", label: "Airline" },
          { value: "other", label: "Other" },
        ],
      },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },

  // Other avocations
  {
    id: "AVO-01",
    section: "avocations",
    sourceRef: sourceRefFor("AVO-01"),
    customerText: "In the past 5 years, which of these activities have you taken part in?",
    timeframe: "Past 5 years",
    helpText: "Select everything that applies. Each activity is followed up separately.",
    kind: "multi_choice",
    options: [
      { value: "climbing", label: "Climbing or mountaineering" },
      { value: "racing", label: "Motor racing or motorsport" },
      { value: "scuba", label: "Scuba diving" },
      { value: "skydiving", label: "Skydiving or paragliding" },
      { value: "other", label: "Another hazardous activity" },
      { value: "none", label: "None of these" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "AVO-02",
    section: "avocations",
    sourceRef: sourceRefFor("AVO-02"),
    customerText: "A little about your climbing.",
    timeframe: "Past 5 years",
    kind: "short_text",
    compound: true,
    fields: [
      {
        id: "level",
        label: "What kind of climbing?",
        kind: "single_choice",
        options: [
          { value: "indoor", label: "Indoor or bouldering only" },
          { value: "outdoor", label: "Outdoor rock" },
          { value: "alpine", label: "Alpine or high altitude" },
        ],
      },
      { id: "frequency", label: "How often?", kind: "short_text" },
      { id: "location", label: "Where do you usually climb?", kind: "short_text" },
    ],
    askWhen: { questionId: "AVO-01", includes: ["climbing"] },
    reviewStatus: "approved",
    status: "supplemental",
    sourceVerified: false,
  },
  {
    id: "AVO-03",
    section: "avocations",
    sourceRef: sourceRefFor("AVO-03"),
    customerText: "A little about your racing.",
    timeframe: "Past 5 years",
    kind: "short_text",
    compound: true,
    fields: [
      {
        id: "level",
        label: "What level do you race at?",
        kind: "single_choice",
        options: [
          { value: "amateur", label: "Amateur or club events" },
          { value: "semi_pro", label: "Semi-professional" },
          { value: "professional", label: "Professional" },
        ],
      },
      { id: "type", label: "What do you race?", kind: "short_text" },
      { id: "frequency", label: "How many events a year?", kind: "short_text" },
    ],
    askWhen: { questionId: "AVO-01", includes: ["racing"] },
    reviewStatus: "approved",
    status: "supplemental",
    sourceVerified: false,
  },
  {
    id: "AVO-04",
    section: "avocations",
    sourceRef: sourceRefFor("AVO-04"),
    customerText: "A little about your scuba diving.",
    timeframe: "Past 5 years",
    kind: "short_text",
    compound: true,
    fields: [
      {
        id: "level",
        label: "What kind of diving?",
        kind: "single_choice",
        options: [
          { value: "recreational", label: "Recreational" },
          { value: "technical", label: "Technical or deep" },
          { value: "instruction", label: "Instruction or commercial" },
        ],
      },
      { id: "certification", label: "Certification level", kind: "short_text" },
      { id: "depth", label: "Deepest dive (approximate)", kind: "short_text" },
      { id: "frequency", label: "Dives per year", kind: "short_text" },
    ],
    askWhen: { questionId: "AVO-01", includes: ["scuba"] },
    reviewStatus: "approved",
    status: "supplemental",
    sourceVerified: false,
  },
  {
    id: "AVO-05",
    section: "avocations",
    sourceRef: sourceRefFor("AVO-05"),
    customerText: "A little about your skydiving or paragliding.",
    timeframe: "Past 5 years",
    kind: "short_text",
    compound: true,
    fields: [
      {
        id: "discipline",
        label: "What do you do?",
        kind: "single_choice",
        options: [
          { value: "tandem", label: "Tandem only" },
          { value: "solo", label: "Solo jumps" },
          { value: "paragliding", label: "Paragliding or hang gliding" },
        ],
      },
      { id: "frequency", label: "Jumps or flights per year", kind: "short_text" },
      { id: "instructor", label: "Any instructor or commercial rating?", kind: "short_text" },
    ],
    askWhen: { questionId: "AVO-01", includes: ["skydiving"] },
    reviewStatus: "approved",
    status: "supplemental",
    sourceVerified: false,
  },

  {
    id: "AVO-06",
    section: "avocations",
    sourceRef: sourceRefFor("AVO-06"),
    customerText: "Do you ever climb alone or without a rope?",
    timeframe: "Past 5 years",
    helpText:
      "Asked separately because solo or unroped climbing carries a different risk from roped climbing.",
    kind: "yesno",
    detailPrompts: [
      { id: "howOften", label: "How often?", kind: "short_text" },
      { id: "where", label: "Where?", kind: "short_text" },
      { id: "difficulty", label: "Degree of difficulty", kind: "short_text" },
    ],
    askWhen: { questionId: "AVO-01", includes: ["climbing"] },
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "AVO-07",
    section: "avocations",
    sourceRef: sourceRefFor("AVO-07"),
    customerText: "Do you dive for salvage or exploration?",
    timeframe: "Past 5 years",
    kind: "yesno",
    detailPrompts: [
      { id: "what", label: "What kind of work or exploration?", kind: "short_text" },
      { id: "when", label: "Approximate year of the most recent dive", kind: "short_text", placeholder: "YYYY" },
    ],
    askWhen: { questionId: "AVO-01", includes: ["scuba"] },
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  // Driving — one row per source question. The source asks about licence
  // suspension over 24 months (SRC-072, with a DUI conviction) and over 5 years
  // (SRC-073); those are separate questions, not one "ever" answer. Driving asks
  // about convictions, not charges, so a pending charge is recorded in criminal
  // history and is not counted here.
  {
    id: "DRV-06",
    section: "driving",
    sourceRef: sourceRefFor("DRV-06"),
    customerText: "Do you currently have a valid driver's licence?",
    timeframe: "Current",
    helpText: "The source asks this before the suspension and conviction questions.",
    kind: "yesno",
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "DRV-01",
    section: "driving",
    sourceRef: sourceRefFor("DRV-01"),
    customerText:
      "In the past 24 months, have you had your driver's licence suspended or revoked, or been convicted of driving under the influence of alcohol or drugs?",
    timeframe: "Past 24 months",
    helpText: "Either limb counts. A DUI or DWI charge with no conviction does not.",
    kind: "yesno",
    detailPrompts: [
      {
        id: "which",
        label: "What happened?",
        kind: "single_choice",
        options: [
          { value: "suspended", label: "Licence suspended or revoked" },
          { value: "dui", label: "Convicted of DUI or DWI" },
          { value: "both", label: "Both" },
        ],
      },
      { id: "when", label: "Approximate year", kind: "short_text", placeholder: "YYYY" },
      {
        id: "reinstated",
        label: "Is the licence reinstated?",
        kind: "single_choice",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No, still suspended" },
          { value: "na", label: "Not applicable, the licence was not suspended" },
        ],
      },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "DRV-02",
    section: "driving",
    sourceRef: sourceRefFor("DRV-02"),
    customerText:
      "In the past 5 years, have you had your driver's licence suspended or revoked, or is it currently suspended or revoked?",
    timeframe: "Past 5 years",
    helpText: "A licence that is suspended today counts even if the suspension started more than 5 years ago.",
    kind: "yesno",
    detailPrompts: [
      { id: "reason", label: "Why was it suspended or revoked?", kind: "short_text" },
      { id: "when", label: "Approximate year", kind: "short_text", placeholder: "YYYY" },
      {
        id: "reinstated",
        label: "Is it reinstated?",
        kind: "single_choice",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No, still suspended" },
          { value: "other", label: "No longer drive" },
        ],
      },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "DRV-03",
    section: "driving",
    sourceRef: sourceRefFor("DRV-03"),
    customerText:
      "In the past 5 years, have you been convicted of careless or reckless driving?",
    timeframe: "Past 5 years",
    helpText: "The source asks about a conviction or plea, not an arrest or a charge.",
    kind: "yesno",
    detailPrompts: [
      { id: "what", label: "What were you convicted of?", kind: "short_text" },
      { id: "when", label: "Approximate year", kind: "short_text", placeholder: "YYYY" },
      { id: "penalty", label: "What was the penalty?", kind: "short_text" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "DRV-07",
    section: "driving",
    sourceRef: sourceRefFor("DRV-07"),
    customerText:
      "In the past 5 years, have you pleaded guilty to, or been convicted of, any moving violations?",
    timeframe: "Past 5 years",
    helpText: "The source asks about a plea or conviction for any moving violation, not only the serious ones.",
    kind: "yesno",
    detailPrompts: [
      { id: "what", label: "What were the violations?", kind: "short_text" },
      { id: "when", label: "Approximate year of the most recent", kind: "short_text", placeholder: "YYYY" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "DRV-04",
    section: "driving",
    sourceRef: sourceRefFor("DRV-04"),
    customerText:
      "In the past 5 years, have you had more than two moving motor vehicle violations, or any alcohol- or drug-related infractions?",
    timeframe: "Past 5 years",
    helpText:
      "The alcohol section asks about alcohol- or drug-related infractions separately; this question keeps the source's combined wording.",
    kind: "yesno",
    detailPrompts: [
      { id: "count", label: "How many moving violations?", kind: "short_text" },
      {
        id: "substance",
        label: "Was any infraction alcohol- or drug-related?",
        kind: "single_choice",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "unknown", label: "Not sure" },
        ],
      },
      { id: "when", label: "Approximate year of the most recent", kind: "short_text", placeholder: "YYYY" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "DRV-05",
    section: "driving",
    sourceRef: sourceRefFor("DRV-05"),
    customerText: "Have you ever had any motor vehicle accidents?",
    timeframe: "Ever",
    helpText:
      "Include accidents whatever the cause. The source asks for details including fault, so fault is recorded here.",
    kind: "yesno",
    detailPrompts: [
      { id: "when", label: "Approximate date", kind: "short_text", placeholder: "MM/YYYY" },
      {
        id: "fault",
        label: "Who was at fault?",
        kind: "single_choice",
        options: [
          { value: "self", label: "I was at fault" },
          { value: "other", label: "The other driver was at fault" },
          { value: "shared", label: "Shared or unclear" },
          { value: "unknown", label: "Not determined" },
        ],
      },
      {
        id: "injury",
        label: "Was anyone injured?",
        kind: "single_choice",
        options: [
          { value: "no", label: "No" },
          { value: "minor", label: "Minor injuries" },
          { value: "serious", label: "Serious injuries" },
        ],
      },
      { id: "citation", label: "Was any citation issued?", kind: "short_text" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },

  // Criminal history — the source keeps a separate question for every window and
  // every legal event. Collapsing them loses which window an answer belongs to.
  {
    id: "CRM-01",
    section: "criminal",
    sourceRef: sourceRefFor("CRM-01"),
    customerText:
      "Have you ever pleaded guilty to, or been convicted of, a felony or misdemeanour, or do you have such a charge currently pending?",
    timeframe: "Ever",
    helpText:
      "A charge is recorded as a charge, not as a conviction. Pleading no contest counts as a plea.",
    kind: "yesno",
    detailPrompts: CONVICTION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "CRM-02",
    section: "criminal",
    sourceRef: sourceRefFor("CRM-02"),
    customerText:
      "In the past 7 years, have you been convicted of, pleaded guilty to, or entered a plea of no contest to any felony?",
    timeframe: "Past 7 years",
    kind: "yesno",
    detailPrompts: CONVICTION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "CRM-03",
    section: "criminal",
    sourceRef: sourceRefFor("CRM-03"),
    customerText:
      "In the past 10 years, have you been convicted of, or pleaded guilty to, a felony, or are you currently awaiting trial for one?",
    timeframe: "Past 10 years",
    helpText: "This window also includes a felony charge you are awaiting trial for.",
    kind: "yesno",
    detailPrompts: CONVICTION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "CRM-04",
    section: "criminal",
    sourceRef: sourceRefFor("CRM-04"),
    customerText:
      "In the past 5 years, have you pleaded guilty to or been convicted of a felony or misdemeanour, including DUI or DWI, or do you have such a charge currently pending?",
    timeframe: "Past 5 years",
    helpText: "This is the only criminal-history question that includes DUI or DWI in its wording.",
    kind: "yesno",
    detailPrompts: CONVICTION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "CRM-05",
    section: "criminal",
    sourceRef: sourceRefFor("CRM-05"),
    customerText:
      "In the past 6 months, have you served, or been released from, incarceration, probation, parole, or other court-ordered supervision for a misdemeanour or felony conviction?",
    timeframe: "Past 6 months",
    helpText: "This is about time served or supervision, not about the conviction itself.",
    kind: "yesno",
    detailPrompts: SUPERVISION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "CRM-06",
    section: "criminal",
    sourceRef: sourceRefFor("CRM-06"),
    customerText:
      "In the past 10 years, have you served, or been released from, incarceration, probation, parole, or other court-ordered supervision for a misdemeanour or felony conviction?",
    timeframe: "Past 10 years",
    kind: "yesno",
    detailPrompts: SUPERVISION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "CRM-07",
    section: "criminal",
    sourceRef: sourceRefFor("CRM-07"),
    customerText:
      "Are you currently under an order for probation, parole, or other court-ordered supervision for a misdemeanour or felony conviction?",
    timeframe: "Currently",
    kind: "yesno",
    detailPrompts: SUPERVISION_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },

  // Bankruptcy
  {
    id: "FIN-01",
    section: "financial",
    sourceRef: sourceRefFor("FIN-01"),
    customerText: "Have you ever filed for bankruptcy, personally or for a business you owned?",
    timeframe: "Ever",
    kind: "yesno",
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "FIN-02",
    section: "financial",
    sourceRef: sourceRefFor("FIN-02"),
    customerText: "A few details about the bankruptcy.",
    timeframe: "Ever",
    kind: "short_text",
    compound: true,
    fields: [
      {
        id: "filingType",
        label: "Was the filing personal or business?",
        kind: "single_choice",
        options: [
          { value: "personal", label: "Personal" },
          { value: "business", label: "Business" },
          { value: "both", label: "Both" },
        ],
      },
      { id: "year", label: "Approximate year filed", kind: "short_text", placeholder: "YYYY" },
      {
        id: "chapter",
        label: "Chapter, if you know it",
        kind: "single_choice",
        options: [
          { value: "7", label: "Chapter 7" },
          { value: "11", label: "Chapter 11" },
          { value: "13", label: "Chapter 13" },
          { value: "unknown", label: "I do not know" },
        ],
      },
      {
        id: "dischargeStatus",
        label: "Current status",
        kind: "single_choice",
        options: [
          { value: "discharged", label: "Discharged" },
          { value: "dismissed", label: "Dismissed" },
          { value: "pending", label: "Still pending" },
          { value: "unknown", label: "I'm not sure" },
        ],
      },
    ],
    askWhen: { questionId: "FIN-01", includes: ["yes", "unknown"] },
    reviewStatus: "approved",
    status: "supplemental",
    sourceVerified: false,
  },

  {
    id: "FIN-03",
    section: "financial",
    sourceRef: sourceRefFor("FIN-03"),
    customerText: "What was the date of discharge, or the anticipated date?",
    timeframe: "Ever",
    helpText: "If the bankruptcy is still open, give the expected date instead.",
    kind: "short_text",
    placeholder: "MM/YYYY, or 'not yet discharged'",
    askWhen: { questionId: "FIN-01", includes: ["yes", "unknown"] },
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  // Drug use — one row per source question. The source names the substances it
  // means, so the questions use that list rather than a "controlled substance"
  // test that would change who answers yes.
  {
    id: "DRG-01",
    section: "drugs",
    sourceRef: sourceRefFor("DRG-01"),
    customerText:
      "In the past 2 years, have you used illegal drugs, abused alcohol or drugs, had or been recommended by a medical professional to have treatment or counseling for alcohol or drug use, or been advised to discontinue the use of alcohol or drugs?",
    timeframe: "Past 2 years",
    kind: "yesno",
    detailPrompts: SUBSTANCE_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "DRG-02",
    section: "drugs",
    sourceRef: sourceRefFor("DRG-02"),
    customerText:
      "In the past 5 years, have you used illegal drugs or abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or drugs, or to have treatment or counseling for alcohol or drugs?",
    timeframe: "Past 5 years",
    kind: "yesno",
    detailPrompts: SUBSTANCE_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "DRG-03",
    section: "drugs",
    sourceRef: sourceRefFor("DRG-03"),
    customerText: "In the last 24 months, have you smoked marijuana for recreational purposes?",
    timeframe: "Last 24 months",
    helpText:
      "Recreational use only, which is what the source asks. Prescribed medication is covered by the medication question.",
    kind: "yesno",
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "DRG-04",
    section: "drugs",
    sourceRef: sourceRefFor("DRG-04"),
    customerText:
      "Have you ever used heroin, morphine, other narcotics, marijuana, cocaine, barbiturates, amphetamines, hallucinogenic drugs, or other habit-forming drugs, except as prescribed by a physician?",
    timeframe: "Ever",
    helpText: "Use exactly as prescribed by a physician is excluded, as the source says.",
    kind: "yesno",
    detailPrompts: SUBSTANCE_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "DRG-05",
    section: "drugs",
    sourceRef: sourceRefFor("DRG-05"),
    customerText:
      "In the past 7 years, have you been advised by a medical professional to have treatment for, or to reduce or discontinue, the intake of prescription drugs?",
    timeframe: "Past 7 years",
    kind: "yesno",
    detailPrompts: SUBSTANCE_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "DRG-06",
    section: "drugs",
    sourceRef: sourceRefFor("DRG-06"),
    customerText:
      "In the past 10 years, have you been treated for drug abuse, or used any drugs not prescribed to you?",
    timeframe: "Past 10 years",
    kind: "yesno",
    detailPrompts: SUBSTANCE_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "DRG-07",
    section: "drugs",
    sourceRef: sourceRefFor("DRG-07"),
    customerText: "Do you have any history of, or current treatment for, drug abuse?",
    timeframe: "Ever / current",
    kind: "yesno",
    detailPrompts: SUBSTANCE_DETAIL,
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },

  // Residency and travel
  {
    id: "RES-01",
    section: "residency",
    sourceRef: sourceRefFor("RES-01"),
    customerText: "Which best describes your citizenship or residency status in the United States?",
    kind: "single_choice",
    options: [
      { value: "citizen", label: "U.S. citizen" },
      { value: "permanent", label: "Lawful permanent resident" },
      { value: "other", label: "Another status" },
      { value: "declined", label: "Prefer not to answer" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "RES-02",
    section: "residency",
    sourceRef: sourceRefFor("RES-02"),
    customerText: "In the past 5 years, have you lived outside the United States for a month or more?",
    timeframe: "Past 5 years",
    kind: "yesno",
    detailPrompts: [
      { id: "where", label: "Which country or countries?", kind: "short_text" },
      { id: "when", label: "Approximate dates", kind: "short_text", placeholder: "MM/YYYY to MM/YYYY" },
      {
        id: "duration",
        label: "Longest single stay",
        kind: "single_choice",
        options: [
          { value: "month", label: "About a month" },
          { value: "months", label: "Several months" },
          { value: "year", label: "A year or more" },
        ],
      },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "RES-03",
    section: "residency",
    sourceRef: sourceRefFor("RES-03"),
    customerText: "Do you plan to travel outside the United States in the next 12 months?",
    timeframe: "Next 12 months",
    kind: "yesno",
    detailPrompts: [
      { id: "where", label: "Which countries?", kind: "short_text" },
      { id: "when", label: "Roughly when?", kind: "short_text" },
      {
        id: "duration",
        label: "How long will you be away in total?",
        kind: "single_choice",
        options: [
          { value: "weeks", label: "A few weeks" },
          { value: "month", label: "About a month" },
          { value: "longer", label: "Longer than a month" },
        ],
      },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "RES-04",
    section: "residency",
    sourceRef: sourceRefFor("RES-04"),
    customerText: "Held for review: a source question requiring legal approval.",
    sensitive: true,
    kind: "short_text",
    reviewStatus: "human_review_required",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "RES-05",
    section: "residency",
    sourceRef: sourceRefFor("RES-05"),
    customerText: "Held for review: an identity-document question not collected in this intake.",
    sensitive: true,
    kind: "short_text",
    reviewStatus: "human_review_required",
    status: "core",
    sourceVerified: false,
  },

  {
    id: "RES-06",
    section: "residency",
    sourceRef: sourceRefFor("RES-06"),
    customerText: "Do you plan to move back to your native country?",
    timeframe: "Future",
    kind: "yesno",
    detailPrompts: [
      { id: "when", label: "When do you expect to move?", kind: "short_text" },
      { id: "where", label: "Where to?", kind: "short_text" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  // Occupation and finances
  {
    id: "OCC-01",
    section: "occupation",
    sourceRef: sourceRefFor("OCC-01"),
    customerText: "Tell us about your work.",
    helpText:
      "Specific duties help more than a job title. Approximate income and hours are fine.",
    kind: "short_text",
    compound: true,
    fields: [
      { id: "jobTitle", label: "Job title", kind: "short_text" },
      { id: "duties", label: "Main duties", kind: "long_text", hint: "A sentence or two is enough." },
      { id: "employerType", label: "Employer or self-employed", kind: "short_text" },
      { id: "income", label: "Approximate annual income", kind: "short_text" },
      { id: "hours", label: "Typical hours per week", kind: "number" },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "OCC-02",
    section: "occupation",
    sourceRef: sourceRefFor("OCC-02"),
    customerText:
      "Does your work involve firearms, explosives, working at height, or another hazardous duty?",
    timeframe: "Right now",
    kind: "yesno",
    detailPrompts: [
      { id: "what", label: "What is involved?", kind: "short_text" },
      {
        id: "frequency",
        label: "How often?",
        kind: "single_choice",
        options: [
          { value: "rarely", label: "Rarely" },
          { value: "sometimes", label: "Sometimes" },
          { value: "daily", label: "Most working days" },
        ],
      },
    ],
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },

  // Military service
  {
    id: "MIL-01",
    section: "military",
    sourceRef: sourceRefFor("MIL-01"),
    customerText: "Have you ever served in the armed forces?",
    timeframe: "Ever",
    helpText: "No classified or operational detail is requested at any point in this interview.",
    kind: "yesno",
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },
  {
    id: "MIL-02",
    section: "military",
    sourceRef: sourceRefFor("MIL-02"),
    customerText: "Did your service include flying or aircraft duties?",
    timeframe: "Ever",
    kind: "yesno",
    fields: [
      {
        id: "role",
        label: "What was your role?",
        kind: "single_choice",
        options: [
          { value: "pilot", label: "Pilot" },
          { value: "crew", label: "Air crew" },
          { value: "maintenance", label: "Aircraft maintenance" },
        ],
      },
      { id: "aircraft", label: "Aircraft type (general description)", kind: "short_text" },
      { id: "hours", label: "Approximate flying hours", kind: "short_text" },
    ],
    askWhen: { questionId: "MIL-01", includes: ["yes"] },
    reviewStatus: "approved",
    status: "supplemental",
    sourceVerified: false,
  },
  {
    id: "MIL-03",
    section: "military",
    sourceRef: sourceRefFor("MIL-03"),
    customerText: "In the past 12 months, have you been on active duty or deployed?",
    timeframe: "Past 12 months",
    kind: "yesno",
    detailPrompts: [
      {
        id: "status",
        label: "Current status",
        kind: "single_choice",
        options: [
          { value: "active", label: "Currently on active duty" },
          { value: "deployed", label: "Currently deployed" },
          { value: "returned", label: "Returned within the last 12 months" },
        ],
      },
      {
        id: "hazard",
        label: "Were you in a combat or hazardous area?",
        kind: "single_choice",
        options: [
          { value: "no", label: "No" },
          { value: "yes", label: "Yes" },
          { value: "declined", label: "Prefer not to say" },
        ],
      },
    ],
    askWhen: { questionId: "MIL-01", includes: ["yes"] },
    reviewStatus: "approved",
    // Traced to SRC-110; the 12-month reframe is a flagged deviation, not an
    // LPP addition, so the row stays core until the reviewer decides.
    status: "core",
    sourceVerified: false,
  },  {
    id: "MIL-04",
    section: "military",
    sourceRef: sourceRefFor("MIL-04"),
    customerText: "What kind of missions do you fly?",
    timeframe: "Current",
    helpText: "Broad categories only. No classified or operational detail is requested.",
    kind: "multi_choice",
    options: [
      { value: "combat_tactical", label: "Combat tactical or reconnaissance" },
      { value: "combat_transport", label: "Combat transport, support or supply" },
      { value: "noncombat_recon", label: "Non-combat reconnaissance" },
      { value: "noncombat_transport", label: "Non-combat transport" },
      { value: "proficiency", label: "Proficiency flying only" },
    ],
    askWhen: { questionId: "MIL-02", includes: ["yes"] },
    reviewStatus: "approved",
    status: "core",
    sourceVerified: false,
  },

];

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTION_BANK.map((question) => [question.id, question]),
);
