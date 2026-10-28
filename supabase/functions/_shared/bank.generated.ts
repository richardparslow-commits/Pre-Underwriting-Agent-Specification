/**
 * GENERATED FILE — do not edit by hand.
 * Source: src/features/interview/questionBank.ts
 * Regenerate: npm run generate:server-bank
 */
export const QUESTIONNAIRE_VERSION = "2026.10-draft.9" as const;

export interface CanonicalQuestion {
  id: string;
  section: string;
  sourceRef: string;
  sourceText: string;
  customerText: string;
  timeframe: string | null;
  kind: string;
  compound: boolean;
  status: "core" | "supplemental";
  reviewStatus: "approved" | "human_review_required";
  reviewNote: string | null;
  sensitive: boolean;
  crisisFollowUp: boolean;
  askWhen: { questionId: string; includes: string[] } | null;
  options: Array<{ value: string; label: string }>;
  fields: Array<{
    id: string;
    label: string;
    kind: string;
    options: Array<{ value: string; label: string }>;
  }>;
  detailPrompts: Array<{ id: string; label: string }>;
}

export const SERVER_BANK: readonly CanonicalQuestion[] = [
  {
    "id": "ID-01",
    "section": "identity",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.1 — SRC-001",
    "sourceText": "SRC-001 (None stated): What is your Date of Birth, Age, and State of Birth?",
    "customerText": "What is your date of birth?",
    "timeframe": null,
    "kind": "date",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "ID-02",
    "section": "identity",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.1 — SRC-001",
    "sourceText": "SRC-001 (None stated): What is your Date of Birth, Age, and State of Birth?",
    "customerText": "Where were you born?",
    "timeframe": null,
    "kind": "short_text",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "ID-03",
    "section": "identity",
    "sourceRef": "Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (current state of residence, added for routing)",
    "sourceText": "Not in the source questionnaire. Added by Life Policy Pilot.",
    "customerText": "Which state do you currently live in?",
    "timeframe": null,
    "kind": "short_text",
    "compound": false,
    "status": "supplemental",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "ID-04",
    "section": "identity",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.1 — SRC-002",
    "sourceText": "SRC-002 (None stated): What is your Gender/Sex?",
    "customerText": "Held for review: a source question requiring jurisdiction and carrier approval.",
    "timeframe": null,
    "kind": "short_text",
    "compound": false,
    "status": "core",
    "reviewStatus": "human_review_required",
    "reviewNote": "Collection of sex/gender needs jurisdiction and carrier review, including whether the question is permissible at all and which answer set is authorized. Not asked until that review is documented.",
    "sensitive": true,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "MED-01",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.1 — SRC-003",
    "sourceText": "SRC-003 (Past 12 months): Within the past 12 months, have you had surgical treatment for morbid obesity, or been declined for life insurance coverage, or had any diagnostic testing (excluding AIDS/HIV tests), surgery, or hospitalization recommended by a medical professional which has not been completed or for which the results have not been received?",
    "customerText": "In the past 12 months, have you had surgical treatment for morbid obesity, been declined for life insurance coverage, or had diagnostic testing (excluding HIV/AIDS tests), surgery or a hospital stay recommended by a medical professional that has not been completed or for which the results have not been received?",
    "timeframe": "Past 12 months",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "Which of these applies?"
      },
      {
        "id": "when",
        "label": "Approximate month and year"
      },
      {
        "id": "pending",
        "label": "Is anything still pending or awaiting results?"
      }
    ]
  },
  {
    "id": "MED-02",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.1 — SRC-004",
    "sourceText": "SRC-004 (Past 12 months): Within the past 12 months, have you consulted a medical professional, had surgery, or been hospitalized, or had diagnostic tests (excluding HIV/AIDS) such as EKG, X-ray, MRI, or CAT scan?",
    "customerText": "In the past 12 months, have you consulted a medical professional, had surgery or been hospitalized, or had diagnostic tests (excluding HIV/AIDS) such as an EKG, X-ray, MRI or CAT scan?",
    "timeframe": "Past 12 months",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "What did you have done?"
      },
      {
        "id": "when",
        "label": "Approximate month and year"
      }
    ]
  },
  {
    "id": "MED-03",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.1 — SRC-005",
    "sourceText": "SRC-005 (Past 2 years): Within the past 2 years, have you been medically diagnosed or treated for angina (chest pain), stroke or TIA, cardiomyopathy, systemic lupus (SLE), cirrhosis, Hepatitis C, chronic hepatitis, chronic pancreatitis, chronic obstructive pulmonary disease (COPD), emphysema, chronic bronchitis, or required oxygen equipment to assist in breathing?",
    "customerText": "In the past 2 years, have you been medically diagnosed with or treated for angina (chest pain), a stroke or TIA, cardiomyopathy, systemic lupus (SLE), cirrhosis, hepatitis C or chronic hepatitis, chronic pancreatitis, chronic obstructive pulmonary disease (COPD), emphysema or chronic bronchitis, or have you required oxygen equipment to help you breathe?",
    "timeframe": "Past 2 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "condition",
        "label": "Which condition?"
      },
      {
        "id": "when",
        "label": "Approximate year of diagnosis"
      },
      {
        "id": "treatment",
        "label": "Treatment or medication now"
      }
    ]
  },
  {
    "id": "MED-04",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.1 — SRC-006",
    "sourceText": "SRC-006 (Past 2 years): Within the past 2 years, have you had a heart attack or aneurysm, or had or been medically advised to have any type of heart, brain or circulatory surgery (including, but not limited to a pacemaker insertion, defibrillator placement), or any procedure to improve circulation?",
    "customerText": "In the past 2 years, have you had a heart attack or aneurysm, or had — or been medically advised to have — any type of heart, brain or circulatory surgery, including a pacemaker or defibrillator, or any procedure to improve circulation?",
    "timeframe": "Past 2 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "condition",
        "label": "Which condition?"
      },
      {
        "id": "when",
        "label": "Approximate year of diagnosis"
      },
      {
        "id": "treatment",
        "label": "Treatment or medication now"
      }
    ]
  },
  {
    "id": "MED-06",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.1 — SRC-007",
    "sourceText": "SRC-007 (Past 3 years): Within the past 3 years, have you been treated, diagnosed, or been prescribed medication by a medical professional for chronic bronchitis, emphysema, chronic obstructive pulmonary disease (COPD), irregular heart beat, seizures, blood clot, or aneurysm?",
    "customerText": "In the past 3 years, have you been treated for, diagnosed with, or prescribed medication for chronic bronchitis, emphysema, COPD, an irregular heartbeat, seizures, a blood clot or an aneurysm?",
    "timeframe": "Past 3 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "condition",
        "label": "Which condition?"
      },
      {
        "id": "when",
        "label": "Approximate year of diagnosis"
      },
      {
        "id": "treatment",
        "label": "Treatment or medication now"
      }
    ]
  },
  {
    "id": "MED-08",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.1 — SRC-008",
    "sourceText": "SRC-008 (Past 5 years): Within the past 5 years, have you been treated, diagnosed, or been prescribed medication by a medical professional for internal cancer, melanoma, Hodgkin's disease, or lymphoma?",
    "customerText": "In the past 5 years, have you been treated for, diagnosed with, or prescribed medication for internal cancer, melanoma, Hodgkin's disease or lymphoma?",
    "timeframe": "Past 5 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "condition",
        "label": "Which condition?"
      },
      {
        "id": "when",
        "label": "Approximate year of diagnosis"
      },
      {
        "id": "treatment",
        "label": "Treatment or medication now"
      }
    ]
  },
  {
    "id": "MED-12",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.1 — SRC-011",
    "sourceText": "SRC-011 (Past 7 years): Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for high blood pressure, heart attack, angina, arrhythmia, stroke, aneurysm, or any heart or circulatory disease or disorder?",
    "customerText": "In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for high blood pressure, a heart attack, angina, an arrhythmia, a stroke, an aneurysm, or any heart or circulatory disease or disorder?",
    "timeframe": "Past 7 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "condition",
        "label": "Which condition?"
      },
      {
        "id": "when",
        "label": "Approximate year of diagnosis"
      },
      {
        "id": "treatment",
        "label": "Treatment or medication now"
      }
    ]
  },
  {
    "id": "MED-13",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.1 — SRC-012",
    "sourceText": "SRC-012 (Past 7 years): Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for diabetes, cirrhosis, hepatitis, pancreatitis, Crohn's disease, ulcerative colitis, or any digestive or liver disease or disorder?",
    "customerText": "In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for diabetes, cirrhosis, hepatitis, pancreatitis, Crohn's disease, ulcerative colitis, or any digestive or liver disease or disorder?",
    "timeframe": "Past 7 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "condition",
        "label": "Which condition?"
      },
      {
        "id": "when",
        "label": "Approximate year of diagnosis"
      },
      {
        "id": "treatment",
        "label": "Treatment or medication now"
      }
    ]
  },
  {
    "id": "MED-14",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.1 — SRC-013",
    "sourceText": "SRC-013 (Past 7 years): Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for asthma, emphysema, chronic obstructive pulmonary disease (COPD), sleep apnea, or any respiratory disease or disorder?",
    "customerText": "In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for asthma, emphysema, COPD, sleep apnea, or any respiratory disease or disorder?",
    "timeframe": "Past 7 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "condition",
        "label": "Which condition?"
      },
      {
        "id": "when",
        "label": "Approximate year of diagnosis"
      },
      {
        "id": "treatment",
        "label": "Treatment or medication now"
      }
    ]
  },
  {
    "id": "MED-20",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.2 — SRC-014",
    "sourceText": "SRC-014 (Last 6 months (within an 'ever' diagnosis)): Have you ever been diagnosed with Sleep Apnea within the last 6 months, or for which you are not being treated?",
    "customerText": "Have you ever been diagnosed with sleep apnoea within the last 6 months, or with sleep apnoea that is not being treated?",
    "timeframe": "Last 6 months, or untreated",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "diagnosed",
        "label": "When were you diagnosed?"
      },
      {
        "id": "treatment",
        "label": "Are you being treated for it?"
      }
    ]
  },
  {
    "id": "MED-15",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.2 — SRC-015",
    "sourceText": "SRC-015 (Past 7 years): Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for cancer in any form, anemia, any seizures, bipolar disorder, schizophrenia, Alzheimer's, dementia, or mental or nervous disorder?",
    "customerText": "In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for cancer in any form, anemia, seizures, bipolar disorder, schizophrenia, Alzheimer's, dementia, or a mental or nervous disorder?",
    "timeframe": "Past 7 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "condition",
        "label": "Which condition?"
      },
      {
        "id": "when",
        "label": "Approximate year of diagnosis"
      },
      {
        "id": "treatment",
        "label": "Treatment or medication now"
      }
    ]
  },
  {
    "id": "MED-16",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.2 — SRC-016",
    "sourceText": "SRC-016 (Past 7 years): Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for any disease or disorder of the kidneys, urinary bladder, prostate, reproductive organs, or sexually transmitted disease?",
    "customerText": "In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for any disease or disorder of the kidneys, urinary bladder, prostate or reproductive organs, or a sexually transmitted disease?",
    "timeframe": "Past 7 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": true,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "condition",
        "label": "Which condition?"
      },
      {
        "id": "when",
        "label": "Approximate year of diagnosis"
      },
      {
        "id": "treatment",
        "label": "Treatment or medication now"
      }
    ]
  },
  {
    "id": "MED-17",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.2 — SRC-017",
    "sourceText": "SRC-017 (Past 7 years): Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for connective tissue disease, systemic lupus (SLE), arthritis, or any disorder of the back, joints, muscles, or nervous system?",
    "customerText": "In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for a connective tissue disease, systemic lupus (SLE), arthritis, or any disorder of the back, joints, muscles or nervous system?",
    "timeframe": "Past 7 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "condition",
        "label": "Which condition?"
      },
      {
        "id": "when",
        "label": "Approximate year of diagnosis"
      },
      {
        "id": "treatment",
        "label": "Treatment or medication now"
      }
    ]
  },
  {
    "id": "MED-18",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.2 — SRC-018",
    "sourceText": "SRC-018 (Past 10 years): In the past 10 years, have you taken medication to treat high blood pressure or an elevated cholesterol level?",
    "customerText": "In the past 10 years, have you taken medication to treat high blood pressure or an elevated cholesterol level?",
    "timeframe": "Past 10 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "condition",
        "label": "What was the medication for?"
      },
      {
        "id": "when",
        "label": "Approximate year you started it"
      },
      {
        "id": "treatment",
        "label": "What are you taking now?"
      }
    ]
  },
  {
    "id": "MED-19",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.2 — SRC-019",
    "sourceText": "SRC-019 (Past 10 years): In the past 10 years, have you been medically diagnosed, tested, or received treatment for diabetes, cancer, or cardiac disease (heart attack, myocardial infarct, angina, cardiac insufficiency, cerebral thrombosis, or coronary artery disease)?",
    "customerText": "In the past 10 years, have you been medically diagnosed with, tested for, or received treatment for diabetes, cancer, or cardiac disease (heart attack, myocardial infarction, angina, cardiac insufficiency, cerebral thrombosis or coronary artery disease)?",
    "timeframe": "Past 10 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "condition",
        "label": "Which condition?"
      },
      {
        "id": "when",
        "label": "Approximate year of diagnosis"
      },
      {
        "id": "treatment",
        "label": "Treatment or medication now"
      }
    ]
  },
  {
    "id": "MED-21",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.2 — SRC-020",
    "sourceText": "SRC-020 (None stated): Have you been treated, diagnosed, or been prescribed medication by a medical professional for diabetes prior to age 21, or do you currently take insulin shots, or been diagnosed with diabetes combined with a medical history of any of the following: retinopathy, nephropathy, neuropathy, insulin shock, or diabetic coma?",
    "customerText": "Have you been treated, diagnosed or prescribed medication for diabetes before age 21, do you currently take insulin, or has diabetes been diagnosed together with retinopathy, nephropathy, neuropathy, insulin shock or diabetic coma?",
    "timeframe": "Ever / current",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "which",
        "label": "Which applies?"
      },
      {
        "id": "when",
        "label": "Approximate year of diagnosis"
      }
    ]
  },
  {
    "id": "MED-22",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.2 — SRC-023",
    "sourceText": "SRC-023 (Past 12 months): Within the past 12 months, have you used a walker, wheelchair, electric scooter, supplemental oxygen, or catheter?",
    "customerText": "In the past 12 months, have you used a walker, wheelchair, electric scooter, supplemental oxygen, or catheter?",
    "timeframe": "Past 12 months",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "which",
        "label": "Which have you used?"
      },
      {
        "id": "why",
        "label": "What is it for?"
      }
    ]
  },
  {
    "id": "MED-23",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.2 — SRC-024",
    "sourceText": "SRC-024 (Ever): Have you been the recipient of an organ transplant?",
    "customerText": "Have you ever received an organ transplant?",
    "timeframe": "Ever",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "organ",
        "label": "Which organ?"
      },
      {
        "id": "when",
        "label": "Approximate year"
      }
    ]
  },
  {
    "id": "MED-24",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.2 — SRC-025",
    "sourceText": "SRC-025 (Currently): Are you at the time of this application confined to any hospital or other medical or rehabilitation facility?",
    "customerText": "Are you currently confined to a hospital, or to a medical or rehabilitation facility?",
    "timeframe": "Currently",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "why",
        "label": "What are you being treated for?"
      },
      {
        "id": "since",
        "label": "Since when?"
      }
    ]
  },
  {
    "id": "MED-25",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.2 — SRC-026",
    "sourceText": "SRC-026 (Ever before age 60): Has the natural parent, brother, or sister of the proposed insured ever had kidney disease, required a major organ transplant, or been diagnosed with heart disease, cerebrovascular disease, or internal cancer prior to age 60?",
    "customerText": "Has a parent, brother or sister ever had kidney disease, needed a major organ transplant, or been diagnosed with heart disease, cerebrovascular disease, or internal cancer before age 60?",
    "timeframe": "Ever, before age 60",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "who",
        "label": "Which relative?"
      },
      {
        "id": "condition",
        "label": "What was the condition?"
      },
      {
        "id": "age",
        "label": "Approximate age at diagnosis"
      }
    ]
  },
  {
    "id": "MED-26",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.2 — SRC-027",
    "sourceText": "SRC-027 (Ever before age 60): Has more than one member of your family (father, mother, brother, or sister) died before age 60 from breast, colon, intestinal, or prostate cancer, or from cardiovascular disease (heart attack, myocardial infarct, angina, cardiac insufficiency, cerebral thrombosis, or coronary artery disease)?",
    "customerText": "Have more than one member of your family — father, mother, brother or sister — died before age 60 from breast, colon, intestinal or prostate cancer, or from cardiovascular disease?",
    "timeframe": "Ever, before age 60",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "howMany",
        "label": "How many family members?"
      },
      {
        "id": "condition",
        "label": "What did they die from?"
      },
      {
        "id": "ages",
        "label": "Approximate ages at death"
      }
    ]
  },
  {
    "id": "MED-09",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.3 — SRC-029",
    "sourceText": "SRC-029 (Current): What are all your current medications, including herb and vitamin supplements?",
    "customerText": "Which prescription medications do you take regularly today?",
    "timeframe": null,
    "kind": "long_text",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "MED-10",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, pp.2–3 — SRC-021, SRC-022, SRC-037",
    "sourceText": "SRC-021 (Currently): Are you currently unemployed due to medical reasons, or been prohibited from actively working full time (30 hours or more per week) at your regular occupation due to any illness, injury, or health-related problem, or are you currently receiving benefits, compensation, or pension for disability? • SRC-022 (Currently): Are you currently hospitalized, confined to a nursing facility, receiving Hospice Care or home health care, or do you require assistance (from anyone) with activities of daily living such as bathing, dressing, eating or toileting? • SRC-037 (Past 5 years): Within the past 5 years, have you been unable to work due to your condition?",
    "customerText": "In the past 5 years, have you been unable to work, or needed help with daily activities because of your health?",
    "timeframe": "Past 5 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "What was the reason?"
      },
      {
        "id": "ongoing",
        "label": "Is this still the case?"
      }
    ]
  },
  {
    "id": "MED-11",
    "section": "medical",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.1 — SRC-009",
    "sourceText": "SRC-009 (Ever): Have you ever been diagnosed, treated, tested positive for, or received medical advice for Human Immunodeficiency Virus (HIV) or Acquired Immune Deficiency Syndrome (AIDS)?",
    "customerText": "Held for review: a sensitive medical question requiring legal and clinical approval.",
    "timeframe": null,
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "human_review_required",
    "reviewNote": "Requires documented legal, clinical and underwriting review of necessity, wording, confidentiality and state restrictions before any automated collection. Do not deploy this row unchanged.",
    "sensitive": true,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "MH-01",
    "section": "mental",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, pp.2–3 — SRC-030, SRC-031, SRC-015",
    "sourceText": "SRC-030 (None stated): Do you have any history of or current treatment for psychological, mood, or anxiety disorders? • SRC-031 (None stated): What mental health, nervous, or psychiatric conditions apply to you (e.g., situational anxiety, adjustment disorder, panic disorder, depression, major depression, schizophrenia, bipolar I or II, ADHD/ADD, eating disorder, mental retardation, PTSD, Tourette's syndrome, suicide attempt/ideation, OCD, autism)? • SRC-015 (Past 7 years): Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for cancer in any form, anemia, any seizures, bipolar disorder, schizophrenia, Alzheimer's, dementia, or mental or nervous disorder?",
    "customerText": "Have you ever been diagnosed with or treated for a mental health condition, such as anxiety or depression?",
    "timeframe": "Ever",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "MH-02",
    "section": "mental",
    "sourceRef": "Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (mental health treatment detail)",
    "sourceText": "Not in the source questionnaire. Added by Life Policy Pilot.",
    "customerText": "A little about the condition and the care you received.",
    "timeframe": "Ever",
    "kind": "short_text",
    "compound": true,
    "status": "supplemental",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": {
      "questionId": "MH-01",
      "includes": [
        "yes"
      ]
    },
    "options": [],
    "fields": [
      {
        "id": "condition",
        "label": "Main condition",
        "kind": "single_choice",
        "options": [
          {
            "value": "anxiety",
            "label": "Anxiety or panic"
          },
          {
            "value": "depression",
            "label": "Depression"
          },
          {
            "value": "both",
            "label": "Anxiety and depression"
          },
          {
            "value": "other",
            "label": "Something else"
          }
        ]
      },
      {
        "id": "diagnosisYear",
        "label": "Approximate year you were first treated",
        "kind": "short_text",
        "options": []
      },
      {
        "id": "treatmentType",
        "label": "What kind of care?",
        "kind": "multi_choice",
        "options": [
          {
            "value": "therapy",
            "label": "Talking therapy or counselling"
          },
          {
            "value": "medication",
            "label": "Medication"
          },
          {
            "value": "inpatient",
            "label": "Hospital or intensive care"
          },
          {
            "value": "other",
            "label": "Other"
          }
        ]
      },
      {
        "id": "currentStatus",
        "label": "Current status",
        "kind": "single_choice",
        "options": [
          {
            "value": "resolved",
            "label": "Resolved, no treatment now"
          },
          {
            "value": "ongoing",
            "label": "Ongoing treatment"
          },
          {
            "value": "unknown",
            "label": "It varies"
          }
        ]
      }
    ],
    "detailPrompts": []
  },
  {
    "id": "MH-03",
    "section": "mental",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.3 — SRC-037",
    "sourceText": "SRC-037 (Past 5 years): Within the past 5 years, have you been unable to work due to your condition?",
    "customerText": "In the past 5 years, has a mental health condition caused you to miss work or stop working?",
    "timeframe": "Past 5 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "duration",
        "label": "Roughly how long were you away from work?"
      },
      {
        "id": "now",
        "label": "Are you working now?"
      }
    ]
  },
  {
    "id": "MH-04",
    "section": "mental",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.3 — SRC-038, SRC-039",
    "sourceText": "SRC-038 (None stated): Have you had any suicidal thoughts? • SRC-039 (None stated): Have you attempted suicide? (If yes, provide details, including date and follow-up treatment).",
    "customerText": "Have you ever had thoughts of ending your life, or made a suicide attempt?",
    "timeframe": "Ever",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": true,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "when",
        "label": "Approximate year (optional)"
      },
      {
        "id": "support",
        "label": "Did you receive support or treatment afterwards?"
      }
    ]
  },
  {
    "id": "MH-05",
    "section": "mental",
    "sourceRef": "Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (current crisis safety check)",
    "sourceText": "Not in the source questionnaire. Added by Life Policy Pilot.",
    "customerText": "Are you having thoughts of harming yourself right now?",
    "timeframe": "Right now",
    "kind": "yesno",
    "compound": false,
    "status": "supplemental",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": true,
    "crisisFollowUp": true,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "MH-06",
    "section": "mental",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.3 — SRC-039",
    "sourceText": "SRC-039 (None stated): Have you attempted suicide? (If yes, provide details, including date and follow-up treatment).",
    "customerText": "Held for review: a sensitive mental-health detail requiring clinical approval.",
    "timeframe": null,
    "kind": "long_text",
    "compound": false,
    "status": "core",
    "reviewStatus": "human_review_required",
    "reviewNote": "Detail-level suicide questions need clinical and legal review for wording, necessity and crisis support before automated collection. The approved screening question and current-safety question cover the immediate need.",
    "sensitive": true,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "MH-07",
    "section": "mental",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.3 — SRC-035",
    "sourceText": "SRC-035 (Past 5 years): Within the past 5 years, have you seen a psychiatrist or had treatment as a hospital outpatient?",
    "customerText": "In the past 5 years, have you seen a psychiatrist, or had treatment as a hospital outpatient, for a mental health condition?",
    "timeframe": "Past 5 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "when",
        "label": "Approximate year"
      },
      {
        "id": "what",
        "label": "What was the treatment for?"
      }
    ]
  },
  {
    "id": "NIC-01",
    "section": "nicotine",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.3 — SRC-040, SRC-042",
    "sourceText": "SRC-040 (Past 12 months, 3 years, or 5 years (three windows in one question)): Has the proposed insured used nicotine, tobacco, vape, or e-cigarettes within the past 12 months, 3 years, or 5 years? (excluding occasional cigar or pipe use)? (Note: Tobacco in any form includes cigarettes, electronic cigarettes/e-cigs, chewing tobacco, cigars, pipes, snuff, nicotine patch, nicotine gum/aerosol/inhaler, Hookah pipe, clove, bidis cigarettes, or oral nicotine pouches.) • SRC-042 (Past 12 months): Have you used tobacco or any nicotine products in any form within the past twelve (12) months? (If Yes, type and amount, if No, date last used.)",
    "customerText": "In the past 12 months, have you used tobacco or any nicotine product in any form?",
    "timeframe": "Past 12 months",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "products",
        "label": "Which forms?"
      },
      {
        "id": "amount",
        "label": "How much and how often?"
      }
    ]
  },
  {
    "id": "NIC-02",
    "section": "nicotine",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.3 — SRC-040, SRC-041",
    "sourceText": "SRC-040 (Past 12 months, 3 years, or 5 years (three windows in one question)): Has the proposed insured used nicotine, tobacco, vape, or e-cigarettes within the past 12 months, 3 years, or 5 years? (excluding occasional cigar or pipe use)? (Note: Tobacco in any form includes cigarettes, electronic cigarettes/e-cigs, chewing tobacco, cigars, pipes, snuff, nicotine patch, nicotine gum/aerosol/inhaler, Hookah pipe, clove, bidis cigarettes, or oral nicotine pouches.) • SRC-041 (Past 36 months): During the past 36 months, have you used tobacco or nicotine products in any form (excluding occasional cigar or pipe use)?",
    "customerText": "In the past 36 months, have you used tobacco or nicotine products in any form?",
    "timeframe": "Past 36 months",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "products",
        "label": "Which forms?"
      },
      {
        "id": "amount",
        "label": "How much and how often?"
      }
    ]
  },
  {
    "id": "NIC-03",
    "section": "nicotine",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.3 — SRC-040",
    "sourceText": "SRC-040 (Past 12 months, 3 years, or 5 years (three windows in one question)): Has the proposed insured used nicotine, tobacco, vape, or e-cigarettes within the past 12 months, 3 years, or 5 years? (excluding occasional cigar or pipe use)? (Note: Tobacco in any form includes cigarettes, electronic cigarettes/e-cigs, chewing tobacco, cigars, pipes, snuff, nicotine patch, nicotine gum/aerosol/inhaler, Hookah pipe, clove, bidis cigarettes, or oral nicotine pouches.)",
    "customerText": "In the past 5 years, have you used nicotine, tobacco, vaping or e-cigarettes in any form?",
    "timeframe": "Past 5 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "products",
        "label": "Which forms?"
      },
      {
        "id": "amount",
        "label": "How much and how often?"
      }
    ]
  },
  {
    "id": "NIC-04",
    "section": "nicotine",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.3 — SRC-042",
    "sourceText": "SRC-042 (Past 12 months): Have you used tobacco or any nicotine products in any form within the past twelve (12) months? (If Yes, type and amount, if No, date last used.)",
    "customerText": "When did you last use any tobacco or nicotine product?",
    "timeframe": "Most recent use",
    "kind": "short_text",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": {
      "questionId": "NIC-01",
      "includes": [
        "no",
        "unknown"
      ]
    },
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "ALC-01",
    "section": "alcohol",
    "sourceRef": "Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (current alcohol use)",
    "sourceText": "Not in the source questionnaire. Added by Life Policy Pilot.",
    "customerText": "In the past 12 months, have you drunk alcohol?",
    "timeframe": "Past 12 months",
    "kind": "yesno",
    "compound": false,
    "status": "supplemental",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "frequency",
        "label": "How often?"
      }
    ]
  },
  {
    "id": "ALC-02",
    "section": "alcohol",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.3 — SRC-043",
    "sourceText": "SRC-043 (Past 7 years): Within the past 7 years, have you abused alcohol or had, or been recommended to have, treatment or counseling for alcohol use, or been advised to discontinue use of alcohol?",
    "customerText": "In the past 7 years, have you abused alcohol, had or been recommended to have treatment or counseling for alcohol use, or been advised to discontinue the use of alcohol?",
    "timeframe": "Past 7 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "What was recommended or treated?"
      },
      {
        "id": "when",
        "label": "Approximate year"
      },
      {
        "id": "status",
        "label": "Current status"
      }
    ]
  },
  {
    "id": "ALC-04",
    "section": "alcohol",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.4 — SRC-044",
    "sourceText": "SRC-044 (Past 5 years): Within the past 5 years, have you abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or to have treatment or counseling for alcohol?",
    "customerText": "In the past 5 years, have you abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or to have treatment or counseling for alcohol?",
    "timeframe": "Past 5 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "What was recommended or treated?"
      },
      {
        "id": "when",
        "label": "Approximate year"
      },
      {
        "id": "status",
        "label": "Current status"
      }
    ]
  },
  {
    "id": "ALC-05",
    "section": "alcohol",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.4 — SRC-045",
    "sourceText": "SRC-045 (Past 10 years): In the past 10 years, have you been treated for alcohol abuse?",
    "customerText": "In the past 10 years, have you been treated for alcohol abuse?",
    "timeframe": "Past 10 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "What was recommended or treated?"
      },
      {
        "id": "when",
        "label": "Approximate year"
      },
      {
        "id": "status",
        "label": "Current status"
      }
    ]
  },
  {
    "id": "ALC-06",
    "section": "alcohol",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.4 — SRC-046",
    "sourceText": "SRC-046 (None stated): Do you have any history of alcohol abuse, misuse, treatment, or counseling, or having been advised to discontinue the use of alcohol?",
    "customerText": "Do you have any history of alcohol abuse or misuse, treatment or counseling, or of being advised to discontinue the use of alcohol?",
    "timeframe": "Ever",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "What was recommended or treated?"
      },
      {
        "id": "when",
        "label": "Approximate year"
      },
      {
        "id": "status",
        "label": "Current status"
      }
    ]
  },
  {
    "id": "ALC-03",
    "section": "alcohol",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.4 — SRC-047",
    "sourceText": "SRC-047 (Ever / DWI or DUI within the last three years): Have you ever had any alcohol/drug related infractions? (Including a history of excessive use of alcohol, or admitted DWI or DUI within the last three years).",
    "customerText": "Have you ever had any alcohol- or drug-related infractions, including a history of excessive alcohol use, or an admitted DWI or DUI within the last three years?",
    "timeframe": "Ever; DWI or DUI within 3 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "What happened?"
      },
      {
        "id": "when",
        "label": "Approximate year"
      },
      {
        "id": "outcome",
        "label": "How was it resolved?"
      }
    ]
  },
  {
    "id": "AVI-01",
    "section": "aviation",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.4 — SRC-048",
    "sourceText": "SRC-048 (Past 12 months): Within the past 12 months, have you made any flights as a pilot, student pilot, or crew member of any aircraft?",
    "customerText": "In the past 12 months, have you made any flights as a pilot, student pilot, or crew member of any aircraft?",
    "timeframe": "Past 12 months",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "AVI-02",
    "section": "aviation",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.4 — SRC-049",
    "sourceText": "SRC-049 (Past 24 months): Within the past 24 months, have you made or contemplated making any flights as a pilot, student pilot, or crew member of any aircraft?",
    "customerText": "In the past 24 months, have you made, or contemplated making, any flights as a pilot, student pilot, or crew member of any aircraft?",
    "timeframe": "Past 24 months",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "AVI-03",
    "section": "aviation",
    "sourceRef": "Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (aviation detail)",
    "sourceText": "Not in the source questionnaire. Added by Life Policy Pilot.",
    "customerText": "A few details about your flying.",
    "timeframe": "Past 24 months",
    "kind": "short_text",
    "compound": true,
    "status": "supplemental",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": {
      "questionId": "AVI-02",
      "includes": [
        "yes"
      ]
    },
    "options": [],
    "fields": [
      {
        "id": "role",
        "label": "Your role",
        "kind": "single_choice",
        "options": [
          {
            "value": "private",
            "label": "Private pilot"
          },
          {
            "value": "commercial",
            "label": "Commercial pilot"
          },
          {
            "value": "crew",
            "label": "Crew member"
          },
          {
            "value": "student",
            "label": "Student pilot"
          },
          {
            "value": "other",
            "label": "Other"
          }
        ]
      },
      {
        "id": "certificate",
        "label": "Certificate or rating",
        "kind": "short_text",
        "options": []
      },
      {
        "id": "hours",
        "label": "Total flying hours (approximate)",
        "kind": "short_text",
        "options": []
      },
      {
        "id": "aircraft",
        "label": "Aircraft types",
        "kind": "short_text",
        "options": []
      },
      {
        "id": "incident",
        "label": "Any aircraft accident, grounding, fine or reprimand for an air-regulation violation? (optional)",
        "kind": "short_text",
        "options": []
      }
    ],
    "detailPrompts": []
  },
  {
    "id": "AVI-04",
    "section": "aviation",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.4 — SRC-050",
    "sourceText": "SRC-050 (Next 2 years): Do you expect to fly in the future within the next two years? (If Yes, indicate whether the type of flying will differ from past flying and provide details).",
    "customerText": "Do you plan to fly as a pilot or crew member in the next 12 months?",
    "timeframe": "Next 12 months",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "schedule",
        "label": "How often do you expect to fly?"
      },
      {
        "id": "type",
        "label": "What kind of flying?"
      }
    ]
  },
  {
    "id": "AVO-01",
    "section": "avocations",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.4 — SRC-055",
    "sourceText": "SRC-055 (Past 2 years / next 2 years intended): Within the past 2 years (or next 2 years intend to participate), have you participated in parachuting, hang gliding, rock or mountain climbing, rodeo events, sky diving, skin or scuba diving, organized racing of any kind, or any professional sport?",
    "customerText": "In the past 5 years, which of these activities have you taken part in?",
    "timeframe": "Past 5 years",
    "kind": "multi_choice",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [
      {
        "value": "climbing",
        "label": "Climbing or mountaineering"
      },
      {
        "value": "racing",
        "label": "Motor racing or motorsport"
      },
      {
        "value": "scuba",
        "label": "Scuba diving"
      },
      {
        "value": "skydiving",
        "label": "Skydiving or paragliding"
      },
      {
        "value": "other",
        "label": "Another hazardous activity"
      },
      {
        "value": "none",
        "label": "None of these"
      }
    ],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "AVO-02",
    "section": "avocations",
    "sourceRef": "Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (climbing detail)",
    "sourceText": "Not in the source questionnaire. Added by Life Policy Pilot.",
    "customerText": "A little about your climbing.",
    "timeframe": "Past 5 years",
    "kind": "short_text",
    "compound": true,
    "status": "supplemental",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": {
      "questionId": "AVO-01",
      "includes": [
        "climbing"
      ]
    },
    "options": [],
    "fields": [
      {
        "id": "level",
        "label": "What kind of climbing?",
        "kind": "single_choice",
        "options": [
          {
            "value": "indoor",
            "label": "Indoor or bouldering only"
          },
          {
            "value": "outdoor",
            "label": "Outdoor rock"
          },
          {
            "value": "alpine",
            "label": "Alpine or high altitude"
          }
        ]
      },
      {
        "id": "frequency",
        "label": "How often?",
        "kind": "short_text",
        "options": []
      },
      {
        "id": "location",
        "label": "Where do you usually climb?",
        "kind": "short_text",
        "options": []
      }
    ],
    "detailPrompts": []
  },
  {
    "id": "AVO-03",
    "section": "avocations",
    "sourceRef": "Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (racing detail)",
    "sourceText": "Not in the source questionnaire. Added by Life Policy Pilot.",
    "customerText": "A little about your racing.",
    "timeframe": "Past 5 years",
    "kind": "short_text",
    "compound": true,
    "status": "supplemental",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": {
      "questionId": "AVO-01",
      "includes": [
        "racing"
      ]
    },
    "options": [],
    "fields": [
      {
        "id": "level",
        "label": "What level do you race at?",
        "kind": "single_choice",
        "options": [
          {
            "value": "amateur",
            "label": "Amateur or club events"
          },
          {
            "value": "semi_pro",
            "label": "Semi-professional"
          },
          {
            "value": "professional",
            "label": "Professional"
          }
        ]
      },
      {
        "id": "type",
        "label": "What do you race?",
        "kind": "short_text",
        "options": []
      },
      {
        "id": "frequency",
        "label": "How many events a year?",
        "kind": "short_text",
        "options": []
      }
    ],
    "detailPrompts": []
  },
  {
    "id": "AVO-04",
    "section": "avocations",
    "sourceRef": "Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (diving detail)",
    "sourceText": "Not in the source questionnaire. Added by Life Policy Pilot.",
    "customerText": "A little about your scuba diving.",
    "timeframe": "Past 5 years",
    "kind": "short_text",
    "compound": true,
    "status": "supplemental",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": {
      "questionId": "AVO-01",
      "includes": [
        "scuba"
      ]
    },
    "options": [],
    "fields": [
      {
        "id": "level",
        "label": "What kind of diving?",
        "kind": "single_choice",
        "options": [
          {
            "value": "recreational",
            "label": "Recreational"
          },
          {
            "value": "technical",
            "label": "Technical or deep"
          },
          {
            "value": "instruction",
            "label": "Instruction or commercial"
          }
        ]
      },
      {
        "id": "certification",
        "label": "Certification level",
        "kind": "short_text",
        "options": []
      },
      {
        "id": "depth",
        "label": "Deepest dive (approximate)",
        "kind": "short_text",
        "options": []
      },
      {
        "id": "frequency",
        "label": "Dives per year",
        "kind": "short_text",
        "options": []
      }
    ],
    "detailPrompts": []
  },
  {
    "id": "AVO-05",
    "section": "avocations",
    "sourceRef": "Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (skydiving detail)",
    "sourceText": "Not in the source questionnaire. Added by Life Policy Pilot.",
    "customerText": "A little about your skydiving or paragliding.",
    "timeframe": "Past 5 years",
    "kind": "short_text",
    "compound": true,
    "status": "supplemental",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": {
      "questionId": "AVO-01",
      "includes": [
        "skydiving"
      ]
    },
    "options": [],
    "fields": [
      {
        "id": "discipline",
        "label": "What do you do?",
        "kind": "single_choice",
        "options": [
          {
            "value": "tandem",
            "label": "Tandem only"
          },
          {
            "value": "solo",
            "label": "Solo jumps"
          },
          {
            "value": "paragliding",
            "label": "Paragliding or hang gliding"
          }
        ]
      },
      {
        "id": "frequency",
        "label": "Jumps or flights per year",
        "kind": "short_text",
        "options": []
      },
      {
        "id": "instructor",
        "label": "Any instructor or commercial rating?",
        "kind": "short_text",
        "options": []
      }
    ],
    "detailPrompts": []
  },
  {
    "id": "AVO-06",
    "section": "avocations",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.4 — SRC-060",
    "sourceText": "SRC-060 (None stated): Do you ever climb alone or without a rope? (If Yes, state how often, the location, and degree of difficulty).",
    "customerText": "Do you ever climb alone or without a rope?",
    "timeframe": "Past 5 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": {
      "questionId": "AVO-01",
      "includes": [
        "climbing"
      ]
    },
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "howOften",
        "label": "How often?"
      },
      {
        "id": "where",
        "label": "Where?"
      },
      {
        "id": "difficulty",
        "label": "Degree of difficulty"
      }
    ]
  },
  {
    "id": "AVO-07",
    "section": "avocations",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.5 — SRC-069",
    "sourceText": "SRC-069 (None stated): Do you dive for salvage or exploration?",
    "customerText": "Do you dive for salvage or exploration?",
    "timeframe": "Past 5 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": {
      "questionId": "AVO-01",
      "includes": [
        "scuba"
      ]
    },
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "What kind of work or exploration?"
      },
      {
        "id": "when",
        "label": "Approximate year of the most recent dive"
      }
    ]
  },
  {
    "id": "DRV-06",
    "section": "driving",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.5 — SRC-071",
    "sourceText": "SRC-071 (Current): Do you currently have a valid driver's license?",
    "customerText": "Do you currently have a valid driver's licence?",
    "timeframe": "Current",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "DRV-01",
    "section": "driving",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.5 — SRC-072",
    "sourceText": "SRC-072 (Past 24 months): Within the past 24 months, have you had your driver's license suspended or revoked, or been convicted of driving under the influence of alcohol or drugs?",
    "customerText": "In the past 24 months, have you had your driver's licence suspended or revoked, or been convicted of driving under the influence of alcohol or drugs?",
    "timeframe": "Past 24 months",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "which",
        "label": "What happened?"
      },
      {
        "id": "when",
        "label": "Approximate year"
      },
      {
        "id": "reinstated",
        "label": "Is the licence reinstated?"
      }
    ]
  },
  {
    "id": "DRV-02",
    "section": "driving",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.5 — SRC-073",
    "sourceText": "SRC-073 (Past 5 years): Within the past 5 years, have you had a driver's license suspended or revoked, or is your driver's license currently suspended or revoked?",
    "customerText": "In the past 5 years, have you had your driver's licence suspended or revoked, or is it currently suspended or revoked?",
    "timeframe": "Past 5 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "reason",
        "label": "Why was it suspended or revoked?"
      },
      {
        "id": "when",
        "label": "Approximate year"
      },
      {
        "id": "reinstated",
        "label": "Is it reinstated?"
      }
    ]
  },
  {
    "id": "DRV-03",
    "section": "driving",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.5 — SRC-075",
    "sourceText": "SRC-075 (Past 5 years): Within the past 5 years, have you been convicted of careless or reckless driving?",
    "customerText": "In the past 5 years, have you been convicted of careless or reckless driving?",
    "timeframe": "Past 5 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "What were you convicted of?"
      },
      {
        "id": "when",
        "label": "Approximate year"
      },
      {
        "id": "penalty",
        "label": "What was the penalty?"
      }
    ]
  },
  {
    "id": "DRV-07",
    "section": "driving",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.5 — SRC-074",
    "sourceText": "SRC-074 (Past 5 years): Within the past 5 years, have you pled guilty to or been convicted of any moving violations?",
    "customerText": "In the past 5 years, have you pleaded guilty to, or been convicted of, any moving violations?",
    "timeframe": "Past 5 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "What were the violations?"
      },
      {
        "id": "when",
        "label": "Approximate year of the most recent"
      }
    ]
  },
  {
    "id": "DRV-04",
    "section": "driving",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.5 — SRC-076",
    "sourceText": "SRC-076 (Past 5 years): In the past 5 years, have you had more than two moving motor vehicle violations or any alcohol/drug related infractions?",
    "customerText": "In the past 5 years, have you had more than two moving motor vehicle violations, or any alcohol- or drug-related infractions?",
    "timeframe": "Past 5 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "count",
        "label": "How many moving violations?"
      },
      {
        "id": "substance",
        "label": "Was any infraction alcohol- or drug-related?"
      },
      {
        "id": "when",
        "label": "Approximate year of the most recent"
      }
    ]
  },
  {
    "id": "DRV-05",
    "section": "driving",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.5 — SRC-077",
    "sourceText": "SRC-077 (Ever): Have you ever had any motor vehicle accidents? (If yes, provide details, including fault).",
    "customerText": "Have you ever had any motor vehicle accidents?",
    "timeframe": "Ever",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "when",
        "label": "Approximate date"
      },
      {
        "id": "fault",
        "label": "Who was at fault?"
      },
      {
        "id": "injury",
        "label": "Was anyone injured?"
      },
      {
        "id": "citation",
        "label": "Was any citation issued?"
      }
    ]
  },
  {
    "id": "CRM-01",
    "section": "criminal",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.6 — SRC-084",
    "sourceText": "SRC-084 (Ever): Have you ever pled guilty to, or been convicted of, a felony or misdemeanor or have such a charge currently pending? (If Yes, please provide date of arrest, conviction, and any jail time, probation or parole).",
    "customerText": "Have you ever pleaded guilty to, or been convicted of, a felony or misdemeanour, or do you have such a charge currently pending?",
    "timeframe": "Ever",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "offence",
        "label": "What was the offence?"
      },
      {
        "id": "when",
        "label": "Approximate date of arrest or conviction"
      },
      {
        "id": "outcome",
        "label": "How was it resolved?"
      },
      {
        "id": "custody",
        "label": "Was any jail time, probation or parole involved?"
      },
      {
        "id": "release",
        "label": "Approximate release or completion date (optional)"
      }
    ]
  },
  {
    "id": "CRM-02",
    "section": "criminal",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.5 — SRC-079",
    "sourceText": "SRC-079 (Past 7 years): Within the past 7 years, have you been convicted of, pleaded guilty to, or entered a plea of no contest to any felony?",
    "customerText": "In the past 7 years, have you been convicted of, pleaded guilty to, or entered a plea of no contest to any felony?",
    "timeframe": "Past 7 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "offence",
        "label": "What was the offence?"
      },
      {
        "id": "when",
        "label": "Approximate date of arrest or conviction"
      },
      {
        "id": "outcome",
        "label": "How was it resolved?"
      },
      {
        "id": "custody",
        "label": "Was any jail time, probation or parole involved?"
      },
      {
        "id": "release",
        "label": "Approximate release or completion date (optional)"
      }
    ]
  },
  {
    "id": "CRM-03",
    "section": "criminal",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.5 — SRC-080",
    "sourceText": "SRC-080 (Past 10 years): In the past 10 years, have you been convicted of, pled guilty to, or are you currently awaiting trial for a felony?",
    "customerText": "In the past 10 years, have you been convicted of, or pleaded guilty to, a felony, or are you currently awaiting trial for one?",
    "timeframe": "Past 10 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "offence",
        "label": "What was the offence?"
      },
      {
        "id": "when",
        "label": "Approximate date of arrest or conviction"
      },
      {
        "id": "outcome",
        "label": "How was it resolved?"
      },
      {
        "id": "custody",
        "label": "Was any jail time, probation or parole involved?"
      },
      {
        "id": "release",
        "label": "Approximate release or completion date (optional)"
      }
    ]
  },
  {
    "id": "CRM-04",
    "section": "criminal",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.6 — SRC-083",
    "sourceText": "SRC-083 (Past 5 years): Within the past 5 years, have you pled guilty to or been convicted of a felony or misdemeanor (including DUI or DWI) or do you have such a charge currently pending against you?",
    "customerText": "In the past 5 years, have you pleaded guilty to or been convicted of a felony or misdemeanour, including DUI or DWI, or do you have such a charge currently pending?",
    "timeframe": "Past 5 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "offence",
        "label": "What was the offence?"
      },
      {
        "id": "when",
        "label": "Approximate date of arrest or conviction"
      },
      {
        "id": "outcome",
        "label": "How was it resolved?"
      },
      {
        "id": "custody",
        "label": "Was any jail time, probation or parole involved?"
      },
      {
        "id": "release",
        "label": "Approximate release or completion date (optional)"
      }
    ]
  },
  {
    "id": "CRM-05",
    "section": "criminal",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.5 — SRC-078",
    "sourceText": "SRC-078 (Past 6 months): Within the past 6 months, have you served or been released from incarceration, probation, parole, or other court-ordered supervision for a misdemeanor or felony conviction?",
    "customerText": "In the past 6 months, have you served, or been released from, incarceration, probation, parole, or other court-ordered supervision for a misdemeanour or felony conviction?",
    "timeframe": "Past 6 months",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "kind",
        "label": "Which one applies?"
      },
      {
        "id": "when",
        "label": "Approximate start, release or completion date"
      },
      {
        "id": "ongoing",
        "label": "Is it still in effect?"
      }
    ]
  },
  {
    "id": "CRM-06",
    "section": "criminal",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.5 — SRC-081",
    "sourceText": "SRC-081 (Past 10 years): In the past 10 years, have you served or been released from incarceration, probation, parole, or other court-ordered supervision for a misdemeanor or felony conviction?",
    "customerText": "In the past 10 years, have you served, or been released from, incarceration, probation, parole, or other court-ordered supervision for a misdemeanour or felony conviction?",
    "timeframe": "Past 10 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "kind",
        "label": "Which one applies?"
      },
      {
        "id": "when",
        "label": "Approximate start, release or completion date"
      },
      {
        "id": "ongoing",
        "label": "Is it still in effect?"
      }
    ]
  },
  {
    "id": "CRM-07",
    "section": "criminal",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.6 — SRC-082",
    "sourceText": "SRC-082 (Currently): Are you currently under an order for probation, parole, or other court-ordered supervision for a misdemeanor or felony conviction?",
    "customerText": "Are you currently under an order for probation, parole, or other court-ordered supervision for a misdemeanour or felony conviction?",
    "timeframe": "Currently",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "kind",
        "label": "Which one applies?"
      },
      {
        "id": "when",
        "label": "Approximate start, release or completion date"
      },
      {
        "id": "ongoing",
        "label": "Is it still in effect?"
      }
    ]
  },
  {
    "id": "FIN-01",
    "section": "financial",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.6 — SRC-085",
    "sourceText": "SRC-085 (Ever): Have you or your spouse filed bankruptcy before? If so, what type?",
    "customerText": "Have you ever filed for bankruptcy, personally or for a business you owned?",
    "timeframe": "Ever",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "FIN-02",
    "section": "financial",
    "sourceRef": "Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (bankruptcy detail)",
    "sourceText": "Not in the source questionnaire. Added by Life Policy Pilot.",
    "customerText": "A few details about the bankruptcy.",
    "timeframe": "Ever",
    "kind": "short_text",
    "compound": true,
    "status": "supplemental",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": {
      "questionId": "FIN-01",
      "includes": [
        "yes",
        "unknown"
      ]
    },
    "options": [],
    "fields": [
      {
        "id": "filingType",
        "label": "Was the filing personal or business?",
        "kind": "single_choice",
        "options": [
          {
            "value": "personal",
            "label": "Personal"
          },
          {
            "value": "business",
            "label": "Business"
          },
          {
            "value": "both",
            "label": "Both"
          }
        ]
      },
      {
        "id": "year",
        "label": "Approximate year filed",
        "kind": "short_text",
        "options": []
      },
      {
        "id": "chapter",
        "label": "Chapter, if you know it",
        "kind": "single_choice",
        "options": [
          {
            "value": "7",
            "label": "Chapter 7"
          },
          {
            "value": "11",
            "label": "Chapter 11"
          },
          {
            "value": "13",
            "label": "Chapter 13"
          },
          {
            "value": "unknown",
            "label": "I do not know"
          }
        ]
      },
      {
        "id": "dischargeStatus",
        "label": "Current status",
        "kind": "single_choice",
        "options": [
          {
            "value": "discharged",
            "label": "Discharged"
          },
          {
            "value": "dismissed",
            "label": "Dismissed"
          },
          {
            "value": "pending",
            "label": "Still pending"
          },
          {
            "value": "unknown",
            "label": "I'm not sure"
          }
        ]
      }
    ],
    "detailPrompts": []
  },
  {
    "id": "FIN-03",
    "section": "financial",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.6 — SRC-088",
    "sourceText": "SRC-088 (None stated): What was the date or anticipated date of discharge?",
    "customerText": "What was the date of discharge, or the anticipated date?",
    "timeframe": "Ever",
    "kind": "short_text",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": {
      "questionId": "FIN-01",
      "includes": [
        "yes",
        "unknown"
      ]
    },
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "DRG-01",
    "section": "drugs",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.6 — SRC-090",
    "sourceText": "SRC-090 (Past 2 years): Within the past 2 years, have you used illegal drugs, abused alcohol or drugs, had or been recommended by a medical professional to have treatment or counseling for alcohol or drug use, or been advised to discontinue the use of alcohol or drugs?",
    "customerText": "In the past 2 years, have you used illegal drugs, abused alcohol or drugs, had or been recommended by a medical professional to have treatment or counseling for alcohol or drug use, or been advised to discontinue the use of alcohol or drugs?",
    "timeframe": "Past 2 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "Which substance or treatment?"
      },
      {
        "id": "when",
        "label": "Approximate year"
      },
      {
        "id": "now",
        "label": "Is this still happening?"
      }
    ]
  },
  {
    "id": "DRG-02",
    "section": "drugs",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.6 — SRC-091",
    "sourceText": "SRC-091 (Past 5 years): Within the past 5 years, have you used illegal drugs or abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or drugs, or to have treatment or counseling for alcohol or drugs?",
    "customerText": "In the past 5 years, have you used illegal drugs or abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or drugs, or to have treatment or counseling for alcohol or drugs?",
    "timeframe": "Past 5 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "Which substance or treatment?"
      },
      {
        "id": "when",
        "label": "Approximate year"
      },
      {
        "id": "now",
        "label": "Is this still happening?"
      }
    ]
  },
  {
    "id": "DRG-03",
    "section": "drugs",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.6 — SRC-094",
    "sourceText": "SRC-094 (Last 24 months): During the last 24 months, have you smoked marijuana for recreational purposes?",
    "customerText": "In the last 24 months, have you smoked marijuana for recreational purposes?",
    "timeframe": "Last 24 months",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "DRG-04",
    "section": "drugs",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.6 — SRC-092",
    "sourceText": "SRC-092 (Ever): Have you ever used heroin, morphine, other narcotics, marijuana, cocaine, barbiturates, amphetamines, hallucinogenic drugs, or other habit-forming drugs except as prescribed by a physician?",
    "customerText": "Have you ever used heroin, morphine, other narcotics, marijuana, cocaine, barbiturates, amphetamines, hallucinogenic drugs, or other habit-forming drugs, except as prescribed by a physician?",
    "timeframe": "Ever",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "Which substance or treatment?"
      },
      {
        "id": "when",
        "label": "Approximate year"
      },
      {
        "id": "now",
        "label": "Is this still happening?"
      }
    ]
  },
  {
    "id": "DRG-05",
    "section": "drugs",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.6 — SRC-093",
    "sourceText": "SRC-093 (Past 7 years): Within the past 7 years, have you been advised by a medical professional to have treatment for, or reduce/discontinue the intake of prescription drugs?",
    "customerText": "In the past 7 years, have you been advised by a medical professional to have treatment for, or to reduce or discontinue, the intake of prescription drugs?",
    "timeframe": "Past 7 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "Which substance or treatment?"
      },
      {
        "id": "when",
        "label": "Approximate year"
      },
      {
        "id": "now",
        "label": "Is this still happening?"
      }
    ]
  },
  {
    "id": "DRG-06",
    "section": "drugs",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.6 — SRC-095",
    "sourceText": "SRC-095 (Past 10 years): In the past 10 years, have you been treated for drug abuse or used any drugs not prescribed to you?",
    "customerText": "In the past 10 years, have you been treated for drug abuse, or used any drugs not prescribed to you?",
    "timeframe": "Past 10 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "Which substance or treatment?"
      },
      {
        "id": "when",
        "label": "Approximate year"
      },
      {
        "id": "now",
        "label": "Is this still happening?"
      }
    ]
  },
  {
    "id": "DRG-07",
    "section": "drugs",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.6 — SRC-096",
    "sourceText": "SRC-096 (None stated): Do you have any history of or current treatment for drug abuse?",
    "customerText": "Do you have any history of, or current treatment for, drug abuse?",
    "timeframe": "Ever / current",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "Which substance or treatment?"
      },
      {
        "id": "when",
        "label": "Approximate year"
      },
      {
        "id": "now",
        "label": "Is this still happening?"
      }
    ]
  },
  {
    "id": "RES-01",
    "section": "residency",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.6 — SRC-097",
    "sourceText": "SRC-097 (Current): Is the Proposed Insured a U.S. Citizen or Permanent Resident? (If Permanent Resident, provide Visa or Green Card ID Number).",
    "customerText": "Which best describes your citizenship or residency status in the United States?",
    "timeframe": null,
    "kind": "single_choice",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [
      {
        "value": "citizen",
        "label": "U.S. citizen"
      },
      {
        "value": "permanent",
        "label": "Lawful permanent resident"
      },
      {
        "value": "other",
        "label": "Another status"
      },
      {
        "value": "declined",
        "label": "Prefer not to answer"
      }
    ],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "RES-02",
    "section": "residency",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.7 — SRC-101, SRC-103",
    "sourceText": "SRC-101 (Past 5 years): Has the Proposed Insured lived consistently in the USA for the past 5 years? • SRC-103 (Past 2 years): What are the details of your previous and future foreign travel/residence, including pleasure and short business trips within the last 2 years? (Provide dates of visits, countries, regions, reason for visits, frequency, and duration of visits).",
    "customerText": "In the past 5 years, have you lived outside the United States for a month or more?",
    "timeframe": "Past 5 years",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "where",
        "label": "Which country or countries?"
      },
      {
        "id": "when",
        "label": "Approximate dates"
      },
      {
        "id": "duration",
        "label": "Longest single stay"
      }
    ]
  },
  {
    "id": "RES-03",
    "section": "residency",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.7 — SRC-099, SRC-100",
    "sourceText": "SRC-099 (Next 2 years): Within the next 2 years, do you intend to work, travel, or reside in Saudi Arabia, Iraq, Afghanistan, Syria, Somalia, Sudan, or Yemen for more than 30 days, or reside outside the United States at any location more than 180 days? • SRC-100 (Next 24 months): Within the next 24 months, do you intend to work, travel, or reside outside of the U.S. for more than 30 days? (If yes, where?)",
    "customerText": "Do you plan to travel outside the United States in the next 12 months?",
    "timeframe": "Next 12 months",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "where",
        "label": "Which countries?"
      },
      {
        "id": "when",
        "label": "Roughly when?"
      },
      {
        "id": "duration",
        "label": "How long will you be away in total?"
      }
    ]
  },
  {
    "id": "RES-04",
    "section": "residency",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.6 — SRC-098",
    "sourceText": "SRC-098 (Current): If not a U.S. citizen, what is their immigration status or visa type?",
    "customerText": "Held for review: a source question requiring legal approval.",
    "timeframe": null,
    "kind": "short_text",
    "compound": false,
    "status": "core",
    "reviewStatus": "human_review_required",
    "reviewNote": "Immigration-status detail is sensitive and the source wording uses static categories that may be out of date. Requires legal review of necessity and approved answer sets before collection. No document numbers are collected here.",
    "sensitive": true,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "RES-05",
    "section": "residency",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.6 — SRC-097",
    "sourceText": "SRC-097 (Current): Is the Proposed Insured a U.S. Citizen or Permanent Resident? (If Permanent Resident, provide Visa or Green Card ID Number).",
    "customerText": "Held for review: an identity-document question not collected in this intake.",
    "timeframe": null,
    "kind": "short_text",
    "compound": false,
    "status": "core",
    "reviewStatus": "human_review_required",
    "reviewNote": "Identity-document numbers are not collected in this intake. If ever required, collection must move to an approved downstream workflow with a documented necessity and secure handling.",
    "sensitive": true,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "RES-06",
    "section": "residency",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.7 — SRC-102",
    "sourceText": "SRC-102 (None stated): Does the Proposed Insured plan to move back to their native country?",
    "customerText": "Do you plan to move back to your native country?",
    "timeframe": "Future",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "when",
        "label": "When do you expect to move?"
      },
      {
        "id": "where",
        "label": "Where to?"
      }
    ]
  },
  {
    "id": "OCC-01",
    "section": "occupation",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.7 — SRC-104, SRC-105, SRC-106",
    "sourceText": "SRC-104 (Current): What is your current occupation? • SRC-105 (Current): What is your annual salary? • SRC-106 (Past 6 months): Are you currently working full-time (minimum 30 hours a week), and have you done so for the past six months?",
    "customerText": "Tell us about your work.",
    "timeframe": null,
    "kind": "short_text",
    "compound": true,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [
      {
        "id": "jobTitle",
        "label": "Job title",
        "kind": "short_text",
        "options": []
      },
      {
        "id": "duties",
        "label": "Main duties",
        "kind": "long_text",
        "options": []
      },
      {
        "id": "employerType",
        "label": "Employer or self-employed",
        "kind": "short_text",
        "options": []
      },
      {
        "id": "income",
        "label": "Approximate annual income",
        "kind": "short_text",
        "options": []
      },
      {
        "id": "hours",
        "label": "Typical hours per week",
        "kind": "number",
        "options": []
      }
    ],
    "detailPrompts": []
  },
  {
    "id": "OCC-02",
    "section": "occupation",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.7 — SRC-107, SRC-108",
    "sourceText": "SRC-107 (Current): Do you carry a weapon in your occupation? • SRC-108 (Current): Are you a member of any high-risk occupations (e.g., blasters & explosives handlers, structural workers/iron workers, underground miners, professional athletes, casino workers, firefighters, etc.)?",
    "customerText": "Does your work involve firearms, explosives, working at height, or another hazardous duty?",
    "timeframe": "Right now",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "what",
        "label": "What is involved?"
      },
      {
        "id": "frequency",
        "label": "How often?"
      }
    ]
  },
  {
    "id": "MIL-01",
    "section": "military",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.7 — SRC-109",
    "sourceText": "SRC-109 (Current): Are you a member of the United States Military on active duty?",
    "customerText": "Have you ever served in the armed forces?",
    "timeframe": "Ever",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": null,
    "options": [],
    "fields": [],
    "detailPrompts": []
  },
  {
    "id": "MIL-02",
    "section": "military",
    "sourceRef": "Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (military aviation duty)",
    "sourceText": "Not in the source questionnaire. Added by Life Policy Pilot.",
    "customerText": "Did your service include flying or aircraft duties?",
    "timeframe": "Ever",
    "kind": "yesno",
    "compound": false,
    "status": "supplemental",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": {
      "questionId": "MIL-01",
      "includes": [
        "yes"
      ]
    },
    "options": [],
    "fields": [
      {
        "id": "role",
        "label": "What was your role?",
        "kind": "single_choice",
        "options": [
          {
            "value": "pilot",
            "label": "Pilot"
          },
          {
            "value": "crew",
            "label": "Air crew"
          },
          {
            "value": "maintenance",
            "label": "Aircraft maintenance"
          }
        ]
      },
      {
        "id": "aircraft",
        "label": "Aircraft type (general description)",
        "kind": "short_text",
        "options": []
      },
      {
        "id": "hours",
        "label": "Approximate flying hours",
        "kind": "short_text",
        "options": []
      }
    ],
    "detailPrompts": []
  },
  {
    "id": "MIL-03",
    "section": "military",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.7 — SRC-110",
    "sourceText": "SRC-110 (Current / planned): If Yes, are you currently deployed or do you have orders to be deployed in Saudi Arabia, Iraq, Afghanistan, Syria, Somalia, Sudan, or Yemen?",
    "customerText": "In the past 12 months, have you been on active duty or deployed?",
    "timeframe": "Past 12 months",
    "kind": "yesno",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": {
      "questionId": "MIL-01",
      "includes": [
        "yes"
      ]
    },
    "options": [],
    "fields": [],
    "detailPrompts": [
      {
        "id": "status",
        "label": "Current status"
      },
      {
        "id": "hazard",
        "label": "Were you in a combat or hazardous area?"
      }
    ]
  },
  {
    "id": "MIL-04",
    "section": "military",
    "sourceRef": "Detialed-Life-insurance-Questions.pdf, p.7 — SRC-112",
    "sourceText": "SRC-112 (None stated): Do you fly Combat Tactical/Recon, Combat Transport/Support/Supply, Non-Combat Recon, Non-Combat Transport, or for Proficiency only?",
    "customerText": "What kind of missions do you fly?",
    "timeframe": "Current",
    "kind": "multi_choice",
    "compound": false,
    "status": "core",
    "reviewStatus": "approved",
    "reviewNote": null,
    "sensitive": false,
    "crisisFollowUp": false,
    "askWhen": {
      "questionId": "MIL-02",
      "includes": [
        "yes"
      ]
    },
    "options": [
      {
        "value": "combat_tactical",
        "label": "Combat tactical or reconnaissance"
      },
      {
        "value": "combat_transport",
        "label": "Combat transport, support or supply"
      },
      {
        "value": "noncombat_recon",
        "label": "Non-combat reconnaissance"
      },
      {
        "value": "noncombat_transport",
        "label": "Non-combat transport"
      },
      {
        "value": "proficiency",
        "label": "Proficiency flying only"
      }
    ],
    "fields": [],
    "detailPrompts": []
  }
] as const;
