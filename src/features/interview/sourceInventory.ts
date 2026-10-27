/**
 * Verbatim inventory of the controlled source questionnaire.
 *
 * Source document: source/Detialed-Life-insurance-Questions.pdf (7 pages,
 * SHA-256 afe91d876f2c9e932302267ad10d0c46b774b4161efea8d0d2ffe71e3c82cca2).
 * The plain-text extraction used to build this file is checked in beside it as
 * source/Detialed-Life-insurance-Questions.txt so a reviewer can diff the two.
 *
 * Rules for this file:
 *   * `text` is the source wording. Only line breaks, PDF hyphenation and
 *     typographic quotes are normalised. Do not paraphrase, tidy or shorten.
 *   * One entry per bullet in the PDF. Entry ids are stable and never reused,
 *     so a reconciliation record can point at them permanently.
 *   * `timeframe` records the window the source itself states. "None stated"
 *     means the source question carries no lookback.
 */

export type SourceArea =
  | "medical"
  | "mental"
  | "nicotine"
  | "alcohol"
  | "aviation"
  | "avocations"
  | "driving"
  | "criminal"
  | "bankruptcy"
  | "drugs"
  | "residency"
  | "occupation"
  | "military";

export const SOURCE_DOCUMENT = {
  fileName: "Detialed-Life-insurance-Questions.pdf",
  path: "source/Detialed-Life-insurance-Questions.pdf",
  textPath: "source/Detialed-Life-insurance-Questions.txt",
  pages: 7,
  sha256: "afe91d876f2c9e932302267ad10d0c46b774b4161efea8d0d2ffe71e3c82cca2",
} as const;

export const SOURCE_HEADINGS: Record<SourceArea, string> = {
  medical: "Health/Medical Questions",
  mental: "Mental Health Questions",
  nicotine: "Nicotine/Smoking Use Questions",
  alcohol: "Alcohol Use Questions",
  aviation: "Risky Behavior / Avocation Questions — aviation",
  avocations: "Risky Behavior / Avocation Questions — other avocations",
  driving: "Driving Record Questions",
  criminal: "Arrest/Criminal Record Questions",
  bankruptcy: "Bankruptcy Questions",
  drugs: "Illegal Drug Use Questions",
  residency: "Residency and Foreign Travel Questions",
  occupation: "Occupation & Financial Questions",
  military: "Military Service",
};

export interface SourceQuestion {
  /** Stable source id, e.g. "SRC-003". */
  id: string;
  /** PDF page number (1-based). */
  page: number;
  area: SourceArea;
  /** Window stated by the source question itself. */
  timeframe: string;
  /** Verbatim source wording. */
  text: string;
}

export const SOURCE_INVENTORY: SourceQuestion[] = [
  // ---------------------------------------------------------------- page 1
  {
    id: "SRC-001",
    page: 1,
    area: "medical",
    timeframe: "None stated",
    text: "What is your Date of Birth, Age, and State of Birth?",
  },
  {
    id: "SRC-002",
    page: 1,
    area: "medical",
    timeframe: "None stated",
    text: "What is your Gender/Sex?",
  },
  {
    id: "SRC-003",
    page: 1,
    area: "medical",
    timeframe: "Past 12 months",
    text: "Within the past 12 months, have you had surgical treatment for morbid obesity, or been declined for life insurance coverage, or had any diagnostic testing (excluding AIDS/HIV tests), surgery, or hospitalization recommended by a medical professional which has not been completed or for which the results have not been received?",
  },
  {
    id: "SRC-004",
    page: 1,
    area: "medical",
    timeframe: "Past 12 months",
    text: "Within the past 12 months, have you consulted a medical professional, had surgery, or been hospitalized, or had diagnostic tests (excluding HIV/AIDS) such as EKG, X-ray, MRI, or CAT scan?",
  },
  {
    id: "SRC-005",
    page: 1,
    area: "medical",
    timeframe: "Past 2 years",
    text: "Within the past 2 years, have you been medically diagnosed or treated for angina (chest pain), stroke or TIA, cardiomyopathy, systemic lupus (SLE), cirrhosis, Hepatitis C, chronic hepatitis, chronic pancreatitis, chronic obstructive pulmonary disease (COPD), emphysema, chronic bronchitis, or required oxygen equipment to assist in breathing?",
  },
  {
    id: "SRC-006",
    page: 1,
    area: "medical",
    timeframe: "Past 2 years",
    text: "Within the past 2 years, have you had a heart attack or aneurysm, or had or been medically advised to have any type of heart, brain or circulatory surgery (including, but not limited to a pacemaker insertion, defibrillator placement), or any procedure to improve circulation?",
  },
  {
    id: "SRC-007",
    page: 1,
    area: "medical",
    timeframe: "Past 3 years",
    text: "Within the past 3 years, have you been treated, diagnosed, or been prescribed medication by a medical professional for chronic bronchitis, emphysema, chronic obstructive pulmonary disease (COPD), irregular heart beat, seizures, blood clot, or aneurysm?",
  },
  {
    id: "SRC-008",
    page: 1,
    area: "medical",
    timeframe: "Past 5 years",
    text: "Within the past 5 years, have you been treated, diagnosed, or been prescribed medication by a medical professional for internal cancer, melanoma, Hodgkin's disease, or lymphoma?",
  },
  {
    id: "SRC-009",
    page: 1,
    area: "medical",
    timeframe: "Ever",
    text: "Have you ever been diagnosed, treated, tested positive for, or received medical advice for Human Immunodeficiency Virus (HIV) or Acquired Immune Deficiency Syndrome (AIDS)?",
  },
  {
    id: "SRC-010",
    page: 1,
    area: "medical",
    timeframe: "Past 5 years",
    text: "Within the past 5 years, have you had any check-ups, laboratory studies (excluding tests related to HIV), or other medical consultations?",
  },
  {
    id: "SRC-011",
    page: 1,
    area: "medical",
    timeframe: "Past 7 years",
    text: "Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for high blood pressure, heart attack, angina, arrhythmia, stroke, aneurysm, or any heart or circulatory disease or disorder?",
  },
  {
    id: "SRC-012",
    page: 1,
    area: "medical",
    timeframe: "Past 7 years",
    text: "Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for diabetes, cirrhosis, hepatitis, pancreatitis, Crohn's disease, ulcerative colitis, or any digestive or liver disease or disorder?",
  },
  {
    id: "SRC-013",
    page: 1,
    area: "medical",
    timeframe: "Past 7 years",
    text: "Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for asthma, emphysema, chronic obstructive pulmonary disease (COPD), sleep apnea, or any respiratory disease or disorder?",
  },

  // ---------------------------------------------------------------- page 2
  {
    id: "SRC-014",
    page: 2,
    area: "medical",
    timeframe: "Last 6 months (within an 'ever' diagnosis)",
    text: "Have you ever been diagnosed with Sleep Apnea within the last 6 months, or for which you are not being treated?",
  },
  {
    id: "SRC-015",
    page: 2,
    area: "medical",
    timeframe: "Past 7 years",
    text: "Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for cancer in any form, anemia, any seizures, bipolar disorder, schizophrenia, Alzheimer's, dementia, or mental or nervous disorder?",
  },
  {
    id: "SRC-016",
    page: 2,
    area: "medical",
    timeframe: "Past 7 years",
    text: "Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for any disease or disorder of the kidneys, urinary bladder, prostate, reproductive organs, or sexually transmitted disease?",
  },
  {
    id: "SRC-017",
    page: 2,
    area: "medical",
    timeframe: "Past 7 years",
    text: "Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for connective tissue disease, systemic lupus (SLE), arthritis, or any disorder of the back, joints, muscles, or nervous system?",
  },
  {
    id: "SRC-018",
    page: 2,
    area: "medical",
    timeframe: "Past 10 years",
    text: "In the past 10 years, have you taken medication to treat high blood pressure or an elevated cholesterol level?",
  },
  {
    id: "SRC-019",
    page: 2,
    area: "medical",
    timeframe: "Past 10 years",
    text: "In the past 10 years, have you been medically diagnosed, tested, or received treatment for diabetes, cancer, or cardiac disease (heart attack, myocardial infarct, angina, cardiac insufficiency, cerebral thrombosis, or coronary artery disease)?",
  },
  {
    id: "SRC-020",
    page: 2,
    area: "medical",
    timeframe: "None stated",
    text: "Have you been treated, diagnosed, or been prescribed medication by a medical professional for diabetes prior to age 21, or do you currently take insulin shots, or been diagnosed with diabetes combined with a medical history of any of the following: retinopathy, nephropathy, neuropathy, insulin shock, or diabetic coma?",
  },
  {
    id: "SRC-021",
    page: 2,
    area: "medical",
    timeframe: "Currently",
    text: "Are you currently unemployed due to medical reasons, or been prohibited from actively working full time (30 hours or more per week) at your regular occupation due to any illness, injury, or health-related problem, or are you currently receiving benefits, compensation, or pension for disability?",
  },
  {
    id: "SRC-022",
    page: 2,
    area: "medical",
    timeframe: "Currently",
    text: "Are you currently hospitalized, confined to a nursing facility, receiving Hospice Care or home health care, or do you require assistance (from anyone) with activities of daily living such as bathing, dressing, eating or toileting?",
  },
  {
    id: "SRC-023",
    page: 2,
    area: "medical",
    timeframe: "Past 12 months",
    text: "Within the past 12 months, have you used a walker, wheelchair, electric scooter, supplemental oxygen, or catheter?",
  },
  {
    id: "SRC-024",
    page: 2,
    area: "medical",
    timeframe: "Ever",
    text: "Have you been the recipient of an organ transplant?",
  },
  {
    id: "SRC-025",
    page: 2,
    area: "medical",
    timeframe: "Currently",
    text: "Are you at the time of this application confined to any hospital or other medical or rehabilitation facility?",
  },
  {
    id: "SRC-026",
    page: 2,
    area: "medical",
    timeframe: "Ever before age 60",
    text: "Has the natural parent, brother, or sister of the proposed insured ever had kidney disease, required a major organ transplant, or been diagnosed with heart disease, cerebrovascular disease, or internal cancer prior to age 60?",
  },
  {
    id: "SRC-027",
    page: 2,
    area: "medical",
    timeframe: "Ever before age 60",
    text: "Has more than one member of your family (father, mother, brother, or sister) died before age 60 from breast, colon, intestinal, or prostate cancer, or from cardiovascular disease (heart attack, myocardial infarct, angina, cardiac insufficiency, cerebral thrombosis, or coronary artery disease)?",
  },
  {
    id: "SRC-028",
    page: 2,
    area: "medical",
    timeframe: "None stated",
    text: "What specific treatment was given or medication prescribed for your conditions?",
  },

  // ---------------------------------------------------------------- page 3
  {
    id: "SRC-029",
    page: 3,
    area: "medical",
    timeframe: "Current",
    text: "What are all your current medications, including herb and vitamin supplements?",
  },
  {
    id: "SRC-030",
    page: 3,
    area: "mental",
    timeframe: "None stated",
    text: "Do you have any history of or current treatment for psychological, mood, or anxiety disorders?",
  },
  {
    id: "SRC-031",
    page: 3,
    area: "mental",
    timeframe: "None stated",
    text: "What mental health, nervous, or psychiatric conditions apply to you (e.g., situational anxiety, adjustment disorder, panic disorder, depression, major depression, schizophrenia, bipolar I or II, ADHD/ADD, eating disorder, mental retardation, PTSD, Tourette's syndrome, suicide attempt/ideation, OCD, autism)?",
  },
  {
    id: "SRC-032",
    page: 3,
    area: "mental",
    timeframe: "Last 6 months",
    text: "Have you been diagnosed with Mild or Situational Depression or Anxiety within the last 6 months, or been hospitalized for it?",
  },
  {
    id: "SRC-033",
    page: 3,
    area: "mental",
    timeframe: "Current",
    text: "What are the details of your current prescription medications for this condition (names, dosage, frequency)?",
  },
  {
    id: "SRC-034",
    page: 3,
    area: "mental",
    timeframe: "None stated",
    text: "When was the condition diagnosed, and when were you last seen for it?",
  },
  {
    id: "SRC-035",
    page: 3,
    area: "mental",
    timeframe: "Past 5 years",
    text: "Within the past 5 years, have you seen a psychiatrist or had treatment as a hospital outpatient?",
  },
  {
    id: "SRC-036",
    page: 3,
    area: "mental",
    timeframe: "Past 5 years",
    text: "Within the past 5 years, have you been an in-patient at a hospital or clinic?",
  },
  {
    id: "SRC-037",
    page: 3,
    area: "mental",
    timeframe: "Past 5 years",
    text: "Within the past 5 years, have you been unable to work due to your condition?",
  },
  {
    id: "SRC-038",
    page: 3,
    area: "mental",
    timeframe: "None stated",
    text: "Have you had any suicidal thoughts?",
  },
  {
    id: "SRC-039",
    page: 3,
    area: "mental",
    timeframe: "None stated",
    text: "Have you attempted suicide? (If yes, provide details, including date and follow-up treatment).",
  },
  {
    id: "SRC-040",
    page: 3,
    area: "nicotine",
    timeframe: "Past 12 months, 3 years, or 5 years (three windows in one question)",
    text: "Has the proposed insured used nicotine, tobacco, vape, or e-cigarettes within the past 12 months, 3 years, or 5 years? (excluding occasional cigar or pipe use)? (Note: Tobacco in any form includes cigarettes, electronic cigarettes/e-cigs, chewing tobacco, cigars, pipes, snuff, nicotine patch, nicotine gum/aerosol/inhaler, Hookah pipe, clove, bidis cigarettes, or oral nicotine pouches.)",
  },
  {
    id: "SRC-041",
    page: 3,
    area: "nicotine",
    timeframe: "Past 36 months",
    text: "During the past 36 months, have you used tobacco or nicotine products in any form (excluding occasional cigar or pipe use)?",
  },
  {
    id: "SRC-042",
    page: 3,
    area: "nicotine",
    timeframe: "Past 12 months",
    text: "Have you used tobacco or any nicotine products in any form within the past twelve (12) months? (If Yes, type and amount, if No, date last used.)",
  },
  {
    id: "SRC-043",
    page: 3,
    area: "alcohol",
    timeframe: "Past 7 years",
    text: "Within the past 7 years, have you abused alcohol or had, or been recommended to have, treatment or counseling for alcohol use, or been advised to discontinue use of alcohol?",
  },

  // ---------------------------------------------------------------- page 4
  {
    id: "SRC-044",
    page: 4,
    area: "alcohol",
    timeframe: "Past 5 years",
    text: "Within the past 5 years, have you abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or to have treatment or counseling for alcohol?",
  },
  {
    id: "SRC-045",
    page: 4,
    area: "alcohol",
    timeframe: "Past 10 years",
    text: "In the past 10 years, have you been treated for alcohol abuse?",
  },
  {
    id: "SRC-046",
    page: 4,
    area: "alcohol",
    timeframe: "None stated",
    text: "Do you have any history of alcohol abuse, misuse, treatment, or counseling, or having been advised to discontinue the use of alcohol?",
  },
  {
    id: "SRC-047",
    page: 4,
    area: "alcohol",
    timeframe: "Ever / DWI or DUI within the last three years",
    text: "Have you ever had any alcohol/drug related infractions? (Including a history of excessive use of alcohol, or admitted DWI or DUI within the last three years).",
  },
  {
    id: "SRC-048",
    page: 4,
    area: "aviation",
    timeframe: "Past 12 months",
    text: "Within the past 12 months, have you made any flights as a pilot, student pilot, or crew member of any aircraft?",
  },
  {
    id: "SRC-049",
    page: 4,
    area: "aviation",
    timeframe: "Past 24 months",
    text: "Within the past 24 months, have you made or contemplated making any flights as a pilot, student pilot, or crew member of any aircraft?",
  },
  {
    id: "SRC-050",
    page: 4,
    area: "aviation",
    timeframe: "Next 2 years",
    text: "Do you expect to fly in the future within the next two years? (If Yes, indicate whether the type of flying will differ from past flying and provide details).",
  },
  {
    id: "SRC-051",
    page: 4,
    area: "aviation",
    timeframe: "Current",
    text: "What type of certificate or license do you have now (Student, Private, Commercial, ATP, Other)?",
  },
  {
    id: "SRC-052",
    page: 4,
    area: "aviation",
    timeframe: "Ever",
    text: "Have you ever had an aircraft accident, been grounded, fined or reprimanded for violation of air regulations?",
  },
  {
    id: "SRC-053",
    page: 4,
    area: "aviation",
    timeframe: "None stated",
    text: "Provide the total of all hours flown as: (a) pilot (b) crew member, and a complete schedule of flying time (Commercial, Company-owned, Student Instruction, Pleasure, Military Combat/Non-Combat, etc.).",
  },
  {
    id: "SRC-054",
    page: 4,
    area: "aviation",
    timeframe: "None stated",
    text: "Provide details of any other flying not specifically classified above (i.e. crop dusting, mapping, surveying, testing) and type of aircraft flown (i.e. glider, helicopter, lighter-than-air).",
  },
  {
    id: "SRC-055",
    page: 4,
    area: "avocations",
    timeframe: "Past 2 years / next 2 years intended",
    text: "Within the past 2 years (or next 2 years intend to participate), have you participated in parachuting, hang gliding, rock or mountain climbing, rodeo events, sky diving, skin or scuba diving, organized racing of any kind, or any professional sport?",
  },
  {
    id: "SRC-056",
    page: 4,
    area: "avocations",
    timeframe: "None stated",
    text: "For how many years have you been climbing regularly, and how often do you climb?",
  },
  {
    id: "SRC-057",
    page: 4,
    area: "avocations",
    timeframe: "None stated",
    text: "Do you climb in any of the following areas: North America (Mt McKinley or elsewhere), Europe (Alps), Africa, Himalayas/Karakoram, or other areas?",
  },
  {
    id: "SRC-058",
    page: 4,
    area: "avocations",
    timeframe: "None stated",
    text: "What is the nature of your climbing: Type of terrain (rock, snow/ice, artificial), degree of difficulty (easy, moderate, difficult, severe, technical grade), maximum height climbed to, and season(s) of the year?",
  },
  {
    id: "SRC-059",
    page: 4,
    area: "avocations",
    timeframe: "None stated",
    text: "What proportion of your climbing is on routes protected by climbing bolts?",
  },
  {
    id: "SRC-060",
    page: 4,
    area: "avocations",
    timeframe: "None stated",
    text: "Do you ever climb alone or without a rope? (If Yes, state how often, the location, and degree of difficulty).",
  },
  {
    id: "SRC-061",
    page: 4,
    area: "avocations",
    timeframe: "Ever / next 2 years intended",
    text: "Have you engaged in, or do you within the next 2 years intend on engaging in, any of following forms of racing: Automobile or Hydroplane?",
  },

  // ---------------------------------------------------------------- page 5
  {
    id: "SRC-062",
    page: 5,
    area: "avocations",
    timeframe: "None stated",
    text: "Over what type of track do you race? (e.g., oval, simulated road).",
  },
  {
    id: "SRC-063",
    page: 5,
    area: "avocations",
    timeframe: "None stated",
    text: "Do you race professionally or for cash prizes?",
  },
  {
    id: "SRC-064",
    page: 5,
    area: "avocations",
    timeframe: "None stated",
    text: "Provide the date of your last race.",
  },
  {
    id: "SRC-065",
    page: 5,
    area: "avocations",
    timeframe: "None stated",
    text: "Are you a certified skin/scuba diver? (If Yes, provide hours of instruction and date of certification. If No, why?)",
  },
  {
    id: "SRC-066",
    page: 5,
    area: "avocations",
    timeframe: "Past 12 months / next 12 months",
    text: "What is the maximum depth obtained on your dives? (Specify Pleasure or Commercial, number of dives, and average time underwater for less than 40ft, 40-60ft, 60-100ft, and 100+ ft in the last 12 months and contemplated next 12 months).",
  },
  {
    id: "SRC-067",
    page: 5,
    area: "avocations",
    timeframe: "None stated",
    text: "What types of equipment do you use? (Scuba, number of tanks, type of air supply, wet suit, others).",
  },
  {
    id: "SRC-068",
    page: 5,
    area: "avocations",
    timeframe: "None stated",
    text: "What are the locations of your diving activities? (Lakes and Rivers, Ocean Beaches, Deep Sea, Bays and Inlets, or Others).",
  },
  {
    id: "SRC-069",
    page: 5,
    area: "avocations",
    timeframe: "None stated",
    text: "Do you dive for salvage or exploration?",
  },
  {
    id: "SRC-070",
    page: 5,
    area: "avocations",
    timeframe: "None stated",
    text: "Are you a member of an organized club for your climbing or diving activities?",
  },
  {
    id: "SRC-071",
    page: 5,
    area: "driving",
    timeframe: "Current",
    text: "Do you currently have a valid driver's license?",
  },
  {
    id: "SRC-072",
    page: 5,
    area: "driving",
    timeframe: "Past 24 months",
    text: "Within the past 24 months, have you had your driver's license suspended or revoked, or been convicted of driving under the influence of alcohol or drugs?",
  },
  {
    id: "SRC-073",
    page: 5,
    area: "driving",
    timeframe: "Past 5 years",
    text: "Within the past 5 years, have you had a driver's license suspended or revoked, or is your driver's license currently suspended or revoked?",
  },
  {
    id: "SRC-074",
    page: 5,
    area: "driving",
    timeframe: "Past 5 years",
    text: "Within the past 5 years, have you pled guilty to or been convicted of any moving violations?",
  },
  {
    id: "SRC-075",
    page: 5,
    area: "driving",
    timeframe: "Past 5 years",
    text: "Within the past 5 years, have you been convicted of careless or reckless driving?",
  },
  {
    id: "SRC-076",
    page: 5,
    area: "driving",
    timeframe: "Past 5 years",
    text: "In the past 5 years, have you had more than two moving motor vehicle violations or any alcohol/drug related infractions?",
  },
  {
    id: "SRC-077",
    page: 5,
    area: "driving",
    timeframe: "Ever",
    text: "Have you ever had any motor vehicle accidents? (If yes, provide details, including fault).",
  },
  {
    id: "SRC-078",
    page: 5,
    area: "criminal",
    timeframe: "Past 6 months",
    text: "Within the past 6 months, have you served or been released from incarceration, probation, parole, or other court-ordered supervision for a misdemeanor or felony conviction?",
  },
  {
    id: "SRC-079",
    page: 5,
    area: "criminal",
    timeframe: "Past 7 years",
    text: "Within the past 7 years, have you been convicted of, pleaded guilty to, or entered a plea of no contest to any felony?",
  },
  {
    id: "SRC-080",
    page: 5,
    area: "criminal",
    timeframe: "Past 10 years",
    text: "In the past 10 years, have you been convicted of, pled guilty to, or are you currently awaiting trial for a felony?",
  },
  {
    id: "SRC-081",
    page: 5,
    area: "criminal",
    timeframe: "Past 10 years",
    text: "In the past 10 years, have you served or been released from incarceration, probation, parole, or other court-ordered supervision for a misdemeanor or felony conviction?",
  },

  // ---------------------------------------------------------------- page 6
  {
    id: "SRC-082",
    page: 6,
    area: "criminal",
    timeframe: "Currently",
    text: "Are you currently under an order for probation, parole, or other court-ordered supervision for a misdemeanor or felony conviction?",
  },
  {
    id: "SRC-083",
    page: 6,
    area: "criminal",
    timeframe: "Past 5 years",
    text: "Within the past 5 years, have you pled guilty to or been convicted of a felony or misdemeanor (including DUI or DWI) or do you have such a charge currently pending against you?",
  },
  {
    id: "SRC-084",
    page: 6,
    area: "criminal",
    timeframe: "Ever",
    text: "Have you ever pled guilty to, or been convicted of, a felony or misdemeanor or have such a charge currently pending? (If Yes, please provide date of arrest, conviction, and any jail time, probation or parole).",
  },
  {
    id: "SRC-085",
    page: 6,
    area: "bankruptcy",
    timeframe: "Ever",
    text: "Have you or your spouse filed bankruptcy before? If so, what type?",
  },
  {
    id: "SRC-086",
    page: 6,
    area: "bankruptcy",
    timeframe: "None stated",
    text: "If Chapter 7, was this personal or business?",
  },
  {
    id: "SRC-087",
    page: 6,
    area: "bankruptcy",
    timeframe: "None stated",
    text: "Has this bankruptcy been discharged?",
  },
  {
    id: "SRC-088",
    page: 6,
    area: "bankruptcy",
    timeframe: "None stated",
    text: "What was the date or anticipated date of discharge?",
  },
  {
    id: "SRC-089",
    page: 6,
    area: "bankruptcy",
    timeframe: "Current",
    text: "Is this bankruptcy still in process?",
  },
  {
    id: "SRC-090",
    page: 6,
    area: "drugs",
    timeframe: "Past 2 years",
    text: "Within the past 2 years, have you used illegal drugs, abused alcohol or drugs, had or been recommended by a medical professional to have treatment or counseling for alcohol or drug use, or been advised to discontinue the use of alcohol or drugs?",
  },
  {
    id: "SRC-091",
    page: 6,
    area: "drugs",
    timeframe: "Past 5 years",
    text: "Within the past 5 years, have you used illegal drugs or abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or drugs, or to have treatment or counseling for alcohol or drugs?",
  },
  {
    id: "SRC-092",
    page: 6,
    area: "drugs",
    timeframe: "Ever",
    text: "Have you ever used heroin, morphine, other narcotics, marijuana, cocaine, barbiturates, amphetamines, hallucinogenic drugs, or other habit-forming drugs except as prescribed by a physician?",
  },
  {
    id: "SRC-093",
    page: 6,
    area: "drugs",
    timeframe: "Past 7 years",
    text: "Within the past 7 years, have you been advised by a medical professional to have treatment for, or reduce/discontinue the intake of prescription drugs?",
  },
  {
    id: "SRC-094",
    page: 6,
    area: "drugs",
    timeframe: "Last 24 months",
    text: "During the last 24 months, have you smoked marijuana for recreational purposes?",
  },
  {
    id: "SRC-095",
    page: 6,
    area: "drugs",
    timeframe: "Past 10 years",
    text: "In the past 10 years, have you been treated for drug abuse or used any drugs not prescribed to you?",
  },
  {
    id: "SRC-096",
    page: 6,
    area: "drugs",
    timeframe: "None stated",
    text: "Do you have any history of or current treatment for drug abuse?",
  },
  {
    id: "SRC-097",
    page: 6,
    area: "residency",
    timeframe: "Current",
    text: "Is the Proposed Insured a U.S. Citizen or Permanent Resident? (If Permanent Resident, provide Visa or Green Card ID Number).",
  },
  {
    id: "SRC-098",
    page: 6,
    area: "residency",
    timeframe: "Current",
    text: "If not a U.S. citizen, what is their immigration status or visa type?",
  },

  // ---------------------------------------------------------------- page 7
  {
    id: "SRC-099",
    page: 7,
    area: "residency",
    timeframe: "Next 2 years",
    text: "Within the next 2 years, do you intend to work, travel, or reside in Saudi Arabia, Iraq, Afghanistan, Syria, Somalia, Sudan, or Yemen for more than 30 days, or reside outside the United States at any location more than 180 days?",
  },
  {
    id: "SRC-100",
    page: 7,
    area: "residency",
    timeframe: "Next 24 months",
    text: "Within the next 24 months, do you intend to work, travel, or reside outside of the U.S. for more than 30 days? (If yes, where?)",
  },
  {
    id: "SRC-101",
    page: 7,
    area: "residency",
    timeframe: "Past 5 years",
    text: "Has the Proposed Insured lived consistently in the USA for the past 5 years?",
  },
  {
    id: "SRC-102",
    page: 7,
    area: "residency",
    timeframe: "None stated",
    text: "Does the Proposed Insured plan to move back to their native country?",
  },
  {
    id: "SRC-103",
    page: 7,
    area: "residency",
    timeframe: "Past 2 years",
    text: "What are the details of your previous and future foreign travel/residence, including pleasure and short business trips within the last 2 years? (Provide dates of visits, countries, regions, reason for visits, frequency, and duration of visits).",
  },
  {
    id: "SRC-104",
    page: 7,
    area: "occupation",
    timeframe: "Current",
    text: "What is your current occupation?",
  },
  {
    id: "SRC-105",
    page: 7,
    area: "occupation",
    timeframe: "Current",
    text: "What is your annual salary?",
  },
  {
    id: "SRC-106",
    page: 7,
    area: "occupation",
    timeframe: "Past 6 months",
    text: "Are you currently working full-time (minimum 30 hours a week), and have you done so for the past six months?",
  },
  {
    id: "SRC-107",
    page: 7,
    area: "occupation",
    timeframe: "Current",
    text: "Do you carry a weapon in your occupation?",
  },
  {
    id: "SRC-108",
    page: 7,
    area: "occupation",
    timeframe: "Current",
    text: "Are you a member of any high-risk occupations (e.g., blasters & explosives handlers, structural workers/iron workers, underground miners, professional athletes, casino workers, firefighters, etc.)?",
  },
  {
    id: "SRC-109",
    page: 7,
    area: "military",
    timeframe: "Current",
    text: "Are you a member of the United States Military on active duty?",
  },
  {
    id: "SRC-110",
    page: 7,
    area: "military",
    timeframe: "Current / planned",
    text: "If Yes, are you currently deployed or do you have orders to be deployed in Saudi Arabia, Iraq, Afghanistan, Syria, Somalia, Sudan, or Yemen?",
  },
  {
    id: "SRC-111",
    page: 7,
    area: "military",
    timeframe: "None stated",
    text: "Provide your complete schedule of flying time if you participate in military aviation.",
  },
  {
    id: "SRC-112",
    page: 7,
    area: "military",
    timeframe: "None stated",
    text: "Do you fly Combat Tactical/Recon, Combat Transport/Support/Supply, Non-Combat Recon, Non-Combat Transport, or for Proficiency only?",
  },
  {
    id: "SRC-113",
    page: 7,
    area: "military",
    timeframe: "None stated",
    text: "Are you assigned duties aboard the aircraft?",
  },
];

export const SOURCE_BY_ID: Record<string, SourceQuestion> = Object.fromEntries(
  SOURCE_INVENTORY.map((question) => [question.id, question]),
);

export const SOURCE_COUNT_BY_AREA = SOURCE_INVENTORY.reduce<Record<string, number>>(
  (counts, question) => {
    counts[question.area] = (counts[question.area] ?? 0) + 1;
    return counts;
  },
  {},
);
