# Source questionnaire matrix — A6 full audit

**Source document:** `source/Detialed-Life-insurance-Questions.pdf` (7 pages)  
**SHA-256:** `afe91d876f2c9e932302267ad10d0c46b774b4161efea8d0d2ffe71e3c82cca2`  
**Questionnaire version:** `2026.10-draft.9`  
**Source questions:** 113  
**Bank rows:** 92  
**Traced source questions:** 85  
**Recorded gaps:** 28  
**Signed-off bank rows:** 0 of 92  
**Generated:** 2026-10-28T08:44:24.538Z

> Generated from `sourceInventory.ts`, `questionBank.ts` and `reconciliation.ts`. A mapped row is **not** an approved row: every bank row still has `sourceVerified: false`, and every gap decision is a written engineering decision, not a named reviewer's approval.

## Totals

- Source questions: **113**
- Traced directly: **85**
- Gaps: **28** (19 merge_into, 9 out_of_scope, 0 add_question, 0 hold)
- Bank rows: **92**
- Signed off: **0**
- Held bank rows: **5**
- Rows with reconciliation flags: **29**

## Every source question

## SRC-001 — page 1 — medical

**Source window:** None stated  
**Source wording:** What is your Date of Birth, Age, and State of Birth?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `ID-01`

- **Customer wording:** What is your date of birth?
- **Customer window:** none stated
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** date
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** wording: SRC-001 is one compound question (date of birth, age, state of birth). The bank collects date of birth only and does not confirm the split with the customer. omission: Age and state of birth are not collected anywhere in the bank.
- **Decision still required:** Decide whether to collect age and state of birth, or record why they are unnecessary. If the compound is split, add the confirmation step the specification requires.

### Mapped row `ID-02`

- **Customer wording:** Where were you born?
- **Customer window:** none stated
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** short_text
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** wording: Source asks for state of birth; the bank asks for city and country. That widens the question beyond the source and duplicates one component of SRC-001.
- **Decision still required:** Narrow the question to state of birth, or document the widening as an approved revision with a reason.

## SRC-002 — page 1 — medical

**Source window:** None stated  
**Source wording:** What is your Gender/Sex?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `ID-04`

- **Customer wording:** Held for review: a source question requiring jurisdiction and carrier approval.
- **Customer window:** none stated
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** short_text
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: human_review_required; source verified: **NO**
- **Reconciliation verdict:** held_for_review
- **Reconciliation flags:** wording: The source asks 'What is your Gender/Sex?'. No answer set or approved wording exists yet, so the row asks nothing.
- **Decision still required:** Approve, reword or drop the sex/gender question, including the permitted answer set for each carrier and state.

## SRC-003 — page 1 — medical

**Source window:** Past 12 months  
**Source wording:** Within the past 12 months, have you had surgical treatment for morbid obesity, or been declined for life insurance coverage, or had any diagnostic testing (excluding AIDS/HIV tests), surgery, or hospitalization recommended by a medical professional which has not been completed or for which the results have not been received?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-01`

- **Customer wording:** In the past 12 months, have you had surgical treatment for morbid obesity, been declined for life insurance coverage, or had diagnostic testing (excluding HIV/AIDS tests), surgery or a hospital stay recommended by a medical professional that has not been completed or for which the results have not been received?
- **Customer window:** Past 12 months
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: Which of these applies?; when: Approximate month and year; pending: Is anything still pending or awaiting results?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm SRC-003's three limbs (morbid-obesity surgery, declined for coverage, incomplete or pending testing) are asked together and that the split from SRC-004 keeps the 12-month window.

## SRC-004 — page 1 — medical

**Source window:** Past 12 months  
**Source wording:** Within the past 12 months, have you consulted a medical professional, had surgery, or been hospitalized, or had diagnostic tests (excluding HIV/AIDS) such as EKG, X-ray, MRI, or CAT scan?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-02`

- **Customer wording:** In the past 12 months, have you consulted a medical professional, had surgery or been hospitalized, or had diagnostic tests (excluding HIV/AIDS) such as an EKG, X-ray, MRI or CAT scan?
- **Customer window:** Past 12 months
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: What did you have done?; when: Approximate month and year
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 12-month consultation, surgery, hospitalization and testing question, including the HIV/AIDS exclusion, is asked on its own.

## SRC-005 — page 1 — medical

**Source window:** Past 2 years  
**Source wording:** Within the past 2 years, have you been medically diagnosed or treated for angina (chest pain), stroke or TIA, cardiomyopathy, systemic lupus (SLE), cirrhosis, Hepatitis C, chronic hepatitis, chronic pancreatitis, chronic obstructive pulmonary disease (COPD), emphysema, chronic bronchitis, or required oxygen equipment to assist in breathing?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-03`

- **Customer wording:** In the past 2 years, have you been medically diagnosed with or treated for angina (chest pain), a stroke or TIA, cardiomyopathy, systemic lupus (SLE), cirrhosis, hepatitis C or chronic hepatitis, chronic pancreatitis, chronic obstructive pulmonary disease (COPD), emphysema or chronic bronchitis, or have you required oxygen equipment to help you breathe?
- **Customer window:** Past 2 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: condition: Which condition?; when: Approximate year of diagnosis; treatment: Treatment or medication now
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 2-year condition list and the oxygen-equipment limb match SRC-005.

## SRC-006 — page 1 — medical

**Source window:** Past 2 years  
**Source wording:** Within the past 2 years, have you had a heart attack or aneurysm, or had or been medically advised to have any type of heart, brain or circulatory surgery (including, but not limited to a pacemaker insertion, defibrillator placement), or any procedure to improve circulation?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-04`

- **Customer wording:** In the past 2 years, have you had a heart attack or aneurysm, or had — or been medically advised to have — any type of heart, brain or circulatory surgery, including a pacemaker or defibrillator, or any procedure to improve circulation?
- **Customer window:** Past 2 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: condition: Which condition?; when: Approximate year of diagnosis; treatment: Treatment or medication now
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 2-year cardiac-event and advised-surgery question matches SRC-006, including pacemaker and defibrillator.

## SRC-007 — page 1 — medical

**Source window:** Past 3 years  
**Source wording:** Within the past 3 years, have you been treated, diagnosed, or been prescribed medication by a medical professional for chronic bronchitis, emphysema, chronic obstructive pulmonary disease (COPD), irregular heart beat, seizures, blood clot, or aneurysm?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-06`

- **Customer wording:** In the past 3 years, have you been treated for, diagnosed with, or prescribed medication for chronic bronchitis, emphysema, COPD, an irregular heartbeat, seizures, a blood clot or an aneurysm?
- **Customer window:** Past 3 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: condition: Which condition?; when: Approximate year of diagnosis; treatment: Treatment or medication now
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 3-year question stays separate from the 2-year question even though both mention bronchitis and COPD.

## SRC-008 — page 1 — medical

**Source window:** Past 5 years  
**Source wording:** Within the past 5 years, have you been treated, diagnosed, or been prescribed medication by a medical professional for internal cancer, melanoma, Hodgkin's disease, or lymphoma?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-08`

- **Customer wording:** In the past 5 years, have you been treated for, diagnosed with, or prescribed medication for internal cancer, melanoma, Hodgkin's disease or lymphoma?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: condition: Which condition?; when: Approximate year of diagnosis; treatment: Treatment or medication now
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 5-year internal-cancer, melanoma, Hodgkin's and lymphoma window. The skin-cancer exclusion added in the first pass is gone.

## SRC-009 — page 1 — medical

**Source window:** Ever  
**Source wording:** Have you ever been diagnosed, treated, tested positive for, or received medical advice for Human Immunodeficiency Virus (HIV) or Acquired Immune Deficiency Syndrome (AIDS)?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-11`

- **Customer wording:** Held for review: a sensitive medical question requiring legal and clinical approval.
- **Customer window:** none stated
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: human_review_required; source verified: **NO**
- **Reconciliation verdict:** held_for_review
- **Reconciliation flags:** none
- **Decision still required:** Obtain documented legal, clinical and underwriting approval for asking about HIV/AIDS, including state restrictions and confidentiality handling.

## SRC-010 — page 1 — medical

**Source window:** Past 5 years  
**Source wording:** Within the past 5 years, have you had any check-ups, laboratory studies (excluding tests related to HIV), or other medical consultations?  
**Mapping status:** **gap:out_of_scope**  
**Unresolved difference:** A blanket five-year check-up, laboratory-study and consultation question would be answered Yes by almost every applicant and does not discriminate risk. MED-01 and MED-02 already ask about consultations and testing within the past 12 months, so the longer window adds burden without changing the review. Recorded out of scope deliberately.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-011 — page 1 — medical

**Source window:** Past 7 years  
**Source wording:** Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for high blood pressure, heart attack, angina, arrhythmia, stroke, aneurysm, or any heart or circulatory disease or disorder?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-12`

- **Customer wording:** In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for high blood pressure, a heart attack, angina, an arrhythmia, a stroke, an aneurysm, or any heart or circulatory disease or disorder?
- **Customer window:** Past 7 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: condition: Which condition?; when: Approximate year of diagnosis; treatment: Treatment or medication now
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 7-year heart and circulatory question, including high blood pressure, matches SRC-011.

## SRC-012 — page 1 — medical

**Source window:** Past 7 years  
**Source wording:** Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for diabetes, cirrhosis, hepatitis, pancreatitis, Crohn's disease, ulcerative colitis, or any digestive or liver disease or disorder?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-13`

- **Customer wording:** In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for diabetes, cirrhosis, hepatitis, pancreatitis, Crohn's disease, ulcerative colitis, or any digestive or liver disease or disorder?
- **Customer window:** Past 7 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: condition: Which condition?; when: Approximate year of diagnosis; treatment: Treatment or medication now
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 7-year diabetes, digestive and liver question. It is separate from the 10-year diabetes question and from the supplemental detail row removed in this pass.

## SRC-013 — page 1 — medical

**Source window:** Past 7 years  
**Source wording:** Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for asthma, emphysema, chronic obstructive pulmonary disease (COPD), sleep apnea, or any respiratory disease or disorder?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-14`

- **Customer wording:** In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for asthma, emphysema, COPD, sleep apnea, or any respiratory disease or disorder?
- **Customer window:** Past 7 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: condition: Which condition?; when: Approximate year of diagnosis; treatment: Treatment or medication now
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 7-year respiratory question, including sleep apnea, matches SRC-013. The 6-month untreated-sleep-apnea nuance remains a separate gap.

## SRC-014 — page 2 — medical

**Source window:** Last 6 months (within an 'ever' diagnosis)  
**Source wording:** Have you ever been diagnosed with Sleep Apnea within the last 6 months, or for which you are not being treated?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-20`

- **Customer wording:** Have you ever been diagnosed with sleep apnoea within the last 6 months, or with sleep apnoea that is not being treated?
- **Customer window:** Last 6 months, or untreated
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: diagnosed: When were you diagnosed?; treatment: Are you being treated for it?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the separate recent or untreated sleep apnoea question matches SRC-014 rather than being folded into the 7-year respiratory row.

## SRC-015 — page 2 — medical

**Source window:** Past 7 years  
**Source wording:** Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for cancer in any form, anemia, any seizures, bipolar disorder, schizophrenia, Alzheimer's, dementia, or mental or nervous disorder?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-15`

- **Customer wording:** In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for cancer in any form, anemia, seizures, bipolar disorder, schizophrenia, Alzheimer's, dementia, or a mental or nervous disorder?
- **Customer window:** Past 7 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: condition: Which condition?; when: Approximate year of diagnosis; treatment: Treatment or medication now
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 7-year cancer, anemia, seizure and mental/nervous question. Confirm the 5-year cancer question above is not treated as a substitute.

### Mapped row `MH-01`

- **Customer wording:** Have you ever been diagnosed with or treated for a mental health condition, such as anxiety or depression?
- **Customer window:** Ever
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** wording: SRC-031's condition list (bipolar, schizophrenia, PTSD, eating disorder, OCD, autism and others) is replaced by 'such as anxiety or depression'. timeframe: SRC-015's 7-year mental or nervous disorder window is not represented. branching: Bipolar and schizophrenia carry separate underwriting treatment but share one answer here.
- **Decision still required:** Approve a condition list for the follow-up, and decide whether the 7-year mental/nervous window is asked separately.

## SRC-016 — page 2 — medical

**Source window:** Past 7 years  
**Source wording:** Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for any disease or disorder of the kidneys, urinary bladder, prostate, reproductive organs, or sexually transmitted disease?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-16`

- **Customer wording:** In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for any disease or disorder of the kidneys, urinary bladder, prostate or reproductive organs, or a sexually transmitted disease?
- **Customer window:** Past 7 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: condition: Which condition?; when: Approximate year of diagnosis; treatment: Treatment or medication now
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 7-year kidney, bladder, prostate, reproductive and STI question is appropriate to ask, and whether it needs a sensitive-handling note.

## SRC-017 — page 2 — medical

**Source window:** Past 7 years  
**Source wording:** Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for connective tissue disease, systemic lupus (SLE), arthritis, or any disorder of the back, joints, muscles, or nervous system?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-17`

- **Customer wording:** In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for a connective tissue disease, systemic lupus (SLE), arthritis, or any disorder of the back, joints, muscles or nervous system?
- **Customer window:** Past 7 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: condition: Which condition?; when: Approximate year of diagnosis; treatment: Treatment or medication now
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 7-year connective tissue, lupus, arthritis and musculoskeletal question matches SRC-017.

## SRC-018 — page 2 — medical

**Source window:** Past 10 years  
**Source wording:** In the past 10 years, have you taken medication to treat high blood pressure or an elevated cholesterol level?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-18`

- **Customer wording:** In the past 10 years, have you taken medication to treat high blood pressure or an elevated cholesterol level?
- **Customer window:** Past 10 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: condition: What was the medication for?; when: Approximate year you started it; treatment: What are you taking now?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 10-year blood-pressure and cholesterol medication question is separate from the 7-year diagnosis question.

## SRC-019 — page 2 — medical

**Source window:** Past 10 years  
**Source wording:** In the past 10 years, have you been medically diagnosed, tested, or received treatment for diabetes, cancer, or cardiac disease (heart attack, myocardial infarct, angina, cardiac insufficiency, cerebral thrombosis, or coronary artery disease)?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-19`

- **Customer wording:** In the past 10 years, have you been medically diagnosed with, tested for, or received treatment for diabetes, cancer, or cardiac disease (heart attack, myocardial infarction, angina, cardiac insufficiency, cerebral thrombosis or coronary artery disease)?
- **Customer window:** Past 10 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: condition: Which condition?; when: Approximate year of diagnosis; treatment: Treatment or medication now
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 10-year diabetes, cancer and cardiac question. It deliberately repeats conditions asked in shorter windows because the source does.

## SRC-020 — page 2 — medical

**Source window:** None stated  
**Source wording:** Have you been treated, diagnosed, or been prescribed medication by a medical professional for diabetes prior to age 21, or do you currently take insulin shots, or been diagnosed with diabetes combined with a medical history of any of the following: retinopathy, nephropathy, neuropathy, insulin shock, or diabetic coma?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-21`

- **Customer wording:** Have you been treated, diagnosed or prescribed medication for diabetes before age 21, do you currently take insulin, or has diabetes been diagnosed together with retinopathy, nephropathy, neuropathy, insulin shock or diabetic coma?
- **Customer window:** Ever / current
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: which: Which applies?; when: Approximate year of diagnosis
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the three-limb diabetes question matches SRC-020: diagnosis before 21, insulin now, or a listed complication.

## SRC-021 — page 2 — medical

**Source window:** Currently  
**Source wording:** Are you currently unemployed due to medical reasons, or been prohibited from actively working full time (30 hours or more per week) at your regular occupation due to any illness, injury, or health-related problem, or are you currently receiving benefits, compensation, or pension for disability?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-10`

- **Customer wording:** In the past 5 years, have you been unable to work, or needed help with daily activities because of your health?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: What was the reason?; ongoing: Is this still the case?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** timeframe_changed
- **Reconciliation flags:** timeframe: SRC-021 and SRC-022 are current-state questions; the bank asks about the past 5 years. SRC-037's 5-year window belongs to the mental-health section, not this medical row. wording: SRC-021's disability benefits/pension limb and 30-hour full-time test, and SRC-022's hospital, nursing facility, hospice and home-health limbs, are merged into one sentence. branching: Disability benefits and current confinement have different follow-ups but share one answer.
- **Decision still required:** Separate current disability/confinement from the 5-year work-impact question, and restore the 30-hour and benefits wording.

## SRC-022 — page 2 — medical

**Source window:** Currently  
**Source wording:** Are you currently hospitalized, confined to a nursing facility, receiving Hospice Care or home health care, or do you require assistance (from anyone) with activities of daily living such as bathing, dressing, eating or toileting?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-10`

- **Customer wording:** In the past 5 years, have you been unable to work, or needed help with daily activities because of your health?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: What was the reason?; ongoing: Is this still the case?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** timeframe_changed
- **Reconciliation flags:** timeframe: SRC-021 and SRC-022 are current-state questions; the bank asks about the past 5 years. SRC-037's 5-year window belongs to the mental-health section, not this medical row. wording: SRC-021's disability benefits/pension limb and 30-hour full-time test, and SRC-022's hospital, nursing facility, hospice and home-health limbs, are merged into one sentence. branching: Disability benefits and current confinement have different follow-ups but share one answer.
- **Decision still required:** Separate current disability/confinement from the 5-year work-impact question, and restore the 30-hour and benefits wording.

## SRC-023 — page 2 — medical

**Source window:** Past 12 months  
**Source wording:** Within the past 12 months, have you used a walker, wheelchair, electric scooter, supplemental oxygen, or catheter?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-22`

- **Customer wording:** In the past 12 months, have you used a walker, wheelchair, electric scooter, supplemental oxygen, or catheter?
- **Customer window:** Past 12 months
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: which: Which have you used?; why: What is it for?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 12-month mobility-aid question matches SRC-023.

## SRC-024 — page 2 — medical

**Source window:** Ever  
**Source wording:** Have you been the recipient of an organ transplant?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-23`

- **Customer wording:** Have you ever received an organ transplant?
- **Customer window:** Ever
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: organ: Which organ?; when: Approximate year
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the organ-transplant question matches SRC-024.

## SRC-025 — page 2 — medical

**Source window:** Currently  
**Source wording:** Are you at the time of this application confined to any hospital or other medical or rehabilitation facility?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-24`

- **Customer wording:** Are you currently confined to a hospital, or to a medical or rehabilitation facility?
- **Customer window:** Currently
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: why: What are you being treated for?; since: Since when?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the current-confinement question matches SRC-025 and is asked at application time, as the source says.

## SRC-026 — page 2 — medical

**Source window:** Ever before age 60  
**Source wording:** Has the natural parent, brother, or sister of the proposed insured ever had kidney disease, required a major organ transplant, or been diagnosed with heart disease, cerebrovascular disease, or internal cancer prior to age 60?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-25`

- **Customer wording:** Has a parent, brother or sister ever had kidney disease, needed a major organ transplant, or been diagnosed with heart disease, cerebrovascular disease, or internal cancer before age 60?
- **Customer window:** Ever, before age 60
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: who: Which relative?; condition: What was the condition?; age: Approximate age at diagnosis
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the family-history question matches SRC-026, including the before-age-60 window and the parent-or-sibling limit.

## SRC-027 — page 2 — medical

**Source window:** Ever before age 60  
**Source wording:** Has more than one member of your family (father, mother, brother, or sister) died before age 60 from breast, colon, intestinal, or prostate cancer, or from cardiovascular disease (heart attack, myocardial infarct, angina, cardiac insufficiency, cerebral thrombosis, or coronary artery disease)?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-26`

- **Customer wording:** Have more than one member of your family — father, mother, brother or sister — died before age 60 from breast, colon, intestinal or prostate cancer, or from cardiovascular disease?
- **Customer window:** Ever, before age 60
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: howMany: How many family members?; condition: What did they die from?; ages: Approximate ages at death
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the second family-history question matches SRC-027: more than one relative dying before 60 from the listed cancers or cardiovascular disease.

## SRC-028 — page 2 — medical

**Source window:** None stated  
**Source wording:** What specific treatment was given or medication prescribed for your conditions?  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** The treatment or medication given for a disclosed condition is only partly collected through MED-01's free-text prompt and is not tied to each condition row.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-029 — page 3 — medical

**Source window:** Current  
**Source wording:** What are all your current medications, including herb and vitamin supplements?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-09`

- **Customer wording:** Which prescription medications do you take regularly today?
- **Customer window:** none stated
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** long_text
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** wording: Source asks for 'all your current medications, including herb and vitamin supplements'; the bank asks only for prescription medications taken regularly, so supplements are excluded.
- **Decision still required:** Add herb and vitamin supplements, or record an approved reason for excluding them.

## SRC-030 — page 3 — mental

**Source window:** None stated  
**Source wording:** Do you have any history of or current treatment for psychological, mood, or anxiety disorders?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MH-01`

- **Customer wording:** Have you ever been diagnosed with or treated for a mental health condition, such as anxiety or depression?
- **Customer window:** Ever
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** wording: SRC-031's condition list (bipolar, schizophrenia, PTSD, eating disorder, OCD, autism and others) is replaced by 'such as anxiety or depression'. timeframe: SRC-015's 7-year mental or nervous disorder window is not represented. branching: Bipolar and schizophrenia carry separate underwriting treatment but share one answer here.
- **Decision still required:** Approve a condition list for the follow-up, and decide whether the 7-year mental/nervous window is asked separately.

## SRC-031 — page 3 — mental

**Source window:** None stated  
**Source wording:** What mental health, nervous, or psychiatric conditions apply to you (e.g., situational anxiety, adjustment disorder, panic disorder, depression, major depression, schizophrenia, bipolar I or II, ADHD/ADD, eating disorder, mental retardation, PTSD, Tourette's syndrome, suicide attempt/ideation, OCD, autism)?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MH-01`

- **Customer wording:** Have you ever been diagnosed with or treated for a mental health condition, such as anxiety or depression?
- **Customer window:** Ever
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** wording: SRC-031's condition list (bipolar, schizophrenia, PTSD, eating disorder, OCD, autism and others) is replaced by 'such as anxiety or depression'. timeframe: SRC-015's 7-year mental or nervous disorder window is not represented. branching: Bipolar and schizophrenia carry separate underwriting treatment but share one answer here.
- **Decision still required:** Approve a condition list for the follow-up, and decide whether the 7-year mental/nervous window is asked separately.

## SRC-032 — page 3 — mental

**Source window:** Last 6 months  
**Source wording:** Have you been diagnosed with Mild or Situational Depression or Anxiety within the last 6 months, or been hospitalized for it?  
**Mapping status:** **gap:out_of_scope**  
**Unresolved difference:** Mild or situational depression or anxiety within six months is already captured by MH-01 (ever diagnosed or treated) and by MH-02 (inpatient care as a treatment type). A second, more sensitive six-month question would add burden without changing routing. Recorded out of scope deliberately.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-033 — page 3 — mental

**Source window:** Current  
**Source wording:** What are the details of your current prescription medications for this condition (names, dosage, frequency)?  
**Mapping status:** **gap:out_of_scope**  
**Unresolved difference:** Current prescription names, dosage and frequency are already collected by the general medication question MED-09. Asking again only for mental-health medication would duplicate it and single out a sensitive condition. Recorded out of scope deliberately.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-034 — page 3 — mental

**Source window:** None stated  
**Source wording:** When was the condition diagnosed, and when were you last seen for it?  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** Diagnosis year is collected, but the date last seen is not.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-035 — page 3 — mental

**Source window:** Past 5 years  
**Source wording:** Within the past 5 years, have you seen a psychiatrist or had treatment as a hospital outpatient?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MH-07`

- **Customer wording:** In the past 5 years, have you seen a psychiatrist, or had treatment as a hospital outpatient, for a mental health condition?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: when: Approximate year; what: What was the treatment for?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 5-year psychiatrist or hospital-outpatient question matches SRC-035 and is kept separate from the ever-diagnosed question.

## SRC-036 — page 3 — mental

**Source window:** Past 5 years  
**Source wording:** Within the past 5 years, have you been an in-patient at a hospital or clinic?  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** In-patient care is offered as a treatment-type option, but the source's 5-year window is not recorded.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-037 — page 3 — mental

**Source window:** Past 5 years  
**Source wording:** Within the past 5 years, have you been unable to work due to your condition?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MED-10`

- **Customer wording:** In the past 5 years, have you been unable to work, or needed help with daily activities because of your health?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: What was the reason?; ongoing: Is this still the case?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** timeframe_changed
- **Reconciliation flags:** timeframe: SRC-021 and SRC-022 are current-state questions; the bank asks about the past 5 years. SRC-037's 5-year window belongs to the mental-health section, not this medical row. wording: SRC-021's disability benefits/pension limb and 30-hour full-time test, and SRC-022's hospital, nursing facility, hospice and home-health limbs, are merged into one sentence. branching: Disability benefits and current confinement have different follow-ups but share one answer.
- **Decision still required:** Separate current disability/confinement from the 5-year work-impact question, and restore the 30-hour and benefits wording.

### Mapped row `MH-03`

- **Customer wording:** In the past 5 years, has a mental health condition caused you to miss work or stop working?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: duration: Roughly how long were you away from work?; now: Are you working now?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** wording: Source asks whether you were 'unable to work'; the bank asks whether the condition caused you to 'miss work or stop working', which widens the question.
- **Decision still required:** Align the wording with 'unable to work', or approve the widening explicitly.

## SRC-038 — page 3 — mental

**Source window:** None stated  
**Source wording:** Have you had any suicidal thoughts?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MH-04`

- **Customer wording:** Have you ever had thoughts of ending your life, or made a suicide attempt?
- **Customer window:** Ever
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: when: Approximate year (optional); support: Did you receive support or treatment afterwards?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** branching: Two source questions (thoughts, and attempts with their detail request) are merged into one Yes/No, so a customer who has attempted cannot say so separately. omission: SRC-039's required detail (date and follow-up treatment) is optional in this row.
- **Decision still required:** Split thoughts from attempts, or confirm the merged wording with the customer as required for a compound question. Keep the crisis panel attached to either answer.

## SRC-039 — page 3 — mental

**Source window:** None stated  
**Source wording:** Have you attempted suicide? (If yes, provide details, including date and follow-up treatment).  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MH-04`

- **Customer wording:** Have you ever had thoughts of ending your life, or made a suicide attempt?
- **Customer window:** Ever
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: when: Approximate year (optional); support: Did you receive support or treatment afterwards?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** branching: Two source questions (thoughts, and attempts with their detail request) are merged into one Yes/No, so a customer who has attempted cannot say so separately. omission: SRC-039's required detail (date and follow-up treatment) is optional in this row.
- **Decision still required:** Split thoughts from attempts, or confirm the merged wording with the customer as required for a compound question. Keep the crisis panel attached to either answer.

### Mapped row `MH-06`

- **Customer wording:** Held for review: a sensitive mental-health detail requiring clinical approval.
- **Customer window:** none stated
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** long_text
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: human_review_required; source verified: **NO**
- **Reconciliation verdict:** held_for_review
- **Reconciliation flags:** none
- **Decision still required:** Obtain clinical and legal approval for detail-level suicide questions, including crisis-support handling, before any collection.

## SRC-040 — page 3 — nicotine

**Source window:** Past 12 months, 3 years, or 5 years (three windows in one question)  
**Source wording:** Has the proposed insured used nicotine, tobacco, vape, or e-cigarettes within the past 12 months, 3 years, or 5 years? (excluding occasional cigar or pipe use)? (Note: Tobacco in any form includes cigarettes, electronic cigarettes/e-cigs, chewing tobacco, cigars, pipes, snuff, nicotine patch, nicotine gum/aerosol/inhaler, Hookah pipe, clove, bidis cigarettes, or oral nicotine pouches.)  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `NIC-01`

- **Customer wording:** In the past 12 months, have you used tobacco or any nicotine product in any form?
- **Customer window:** Past 12 months
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: products: Which forms?; amount: How much and how often?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** split_source_compound
- **Reconciliation flags:** none
- **Decision still required:** SRC-040 carries the 12-month, 3-year and 5-year windows in one question. This row asks the 12-month limb, with type and amount on Yes and the source's occasional cigar/pipe exclusion. Confirm the split.

### Mapped row `NIC-02`

- **Customer wording:** In the past 36 months, have you used tobacco or nicotine products in any form?
- **Customer window:** Past 36 months
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: products: Which forms?; amount: How much and how often?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** split_source_compound
- **Reconciliation flags:** none
- **Decision still required:** This row asks the 36-month limb of SRC-040 and SRC-041 as its own question, rather than folding it into the 12-month answer. Confirm the separate window.

### Mapped row `NIC-03`

- **Customer wording:** In the past 5 years, have you used nicotine, tobacco, vaping or e-cigarettes in any form?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: products: Which forms?; amount: How much and how often?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** split_source_compound
- **Reconciliation flags:** none
- **Decision still required:** This row asks the 5-year limb of SRC-040, including its product definition. Confirm the window and that the longer window is asked separately from the shorter two.

## SRC-041 — page 3 — nicotine

**Source window:** Past 36 months  
**Source wording:** During the past 36 months, have you used tobacco or nicotine products in any form (excluding occasional cigar or pipe use)?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `NIC-02`

- **Customer wording:** In the past 36 months, have you used tobacco or nicotine products in any form?
- **Customer window:** Past 36 months
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: products: Which forms?; amount: How much and how often?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** split_source_compound
- **Reconciliation flags:** none
- **Decision still required:** This row asks the 36-month limb of SRC-040 and SRC-041 as its own question, rather than folding it into the 12-month answer. Confirm the separate window.

## SRC-042 — page 3 — nicotine

**Source window:** Past 12 months  
**Source wording:** Have you used tobacco or any nicotine products in any form within the past twelve (12) months? (If Yes, type and amount, if No, date last used.)  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `NIC-01`

- **Customer wording:** In the past 12 months, have you used tobacco or any nicotine product in any form?
- **Customer window:** Past 12 months
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: products: Which forms?; amount: How much and how often?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** split_source_compound
- **Reconciliation flags:** none
- **Decision still required:** SRC-040 carries the 12-month, 3-year and 5-year windows in one question. This row asks the 12-month limb, with type and amount on Yes and the source's occasional cigar/pipe exclusion. Confirm the split.

### Mapped row `NIC-04`

- **Customer wording:** When did you last use any tobacco or nicotine product?
- **Customer window:** Most recent use
- **Exclusions shown:** none
- **Conditional rule:** NIC-01 includes no | unknown
- **Question type:** short_text
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** branching: SRC-042 asks for the date last used only when the 12-month answer is No. This row also asks after an unsure answer, so an uncertain customer is not left without a last-use date.
- **Decision still required:** Approve the extra unsure branch, or restrict the follow-up to a No exactly as the source does.

## SRC-043 — page 3 — alcohol

**Source window:** Past 7 years  
**Source wording:** Within the past 7 years, have you abused alcohol or had, or been recommended to have, treatment or counseling for alcohol use, or been advised to discontinue use of alcohol?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `ALC-02`

- **Customer wording:** In the past 7 years, have you abused alcohol, had or been recommended to have treatment or counseling for alcohol use, or been advised to discontinue the use of alcohol?
- **Customer window:** Past 7 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: What was recommended or treated?; when: Approximate year; status: Current status
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 7-year abuse, treatment and advice-to-stop question matches SRC-043.

## SRC-044 — page 4 — alcohol

**Source window:** Past 5 years  
**Source wording:** Within the past 5 years, have you abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or to have treatment or counseling for alcohol?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `ALC-04`

- **Customer wording:** In the past 5 years, have you abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or to have treatment or counseling for alcohol?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: What was recommended or treated?; when: Approximate year; status: Current status
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 5-year question, including its drug limb and licensed-counselor wording, matches SRC-044.

## SRC-045 — page 4 — alcohol

**Source window:** Past 10 years  
**Source wording:** In the past 10 years, have you been treated for alcohol abuse?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `ALC-05`

- **Customer wording:** In the past 10 years, have you been treated for alcohol abuse?
- **Customer window:** Past 10 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: What was recommended or treated?; when: Approximate year; status: Current status
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 10-year treatment question is asked on its own.

## SRC-046 — page 4 — alcohol

**Source window:** None stated  
**Source wording:** Do you have any history of alcohol abuse, misuse, treatment, or counseling, or having been advised to discontinue the use of alcohol?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `ALC-06`

- **Customer wording:** Do you have any history of alcohol abuse or misuse, treatment or counseling, or of being advised to discontinue the use of alcohol?
- **Customer window:** Ever
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: What was recommended or treated?; when: Approximate year; status: Current status
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the no-window history question is kept separate from the 7, 5 and 10-year questions.

## SRC-047 — page 4 — alcohol

**Source window:** Ever / DWI or DUI within the last three years  
**Source wording:** Have you ever had any alcohol/drug related infractions? (Including a history of excessive use of alcohol, or admitted DWI or DUI within the last three years).  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `ALC-03`

- **Customer wording:** Have you ever had any alcohol- or drug-related infractions, including a history of excessive alcohol use, or an admitted DWI or DUI within the last three years?
- **Customer window:** Ever; DWI or DUI within 3 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: What happened?; when: Approximate year; outcome: How was it resolved?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the restored alcohol/drug infraction wording, including excessive use and an admitted DWI or DUI within three years. The earlier narrowing to a licence action is gone.

## SRC-048 — page 4 — aviation

**Source window:** Past 12 months  
**Source wording:** Within the past 12 months, have you made any flights as a pilot, student pilot, or crew member of any aircraft?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `AVI-01`

- **Customer wording:** In the past 12 months, have you made any flights as a pilot, student pilot, or crew member of any aircraft?
- **Customer window:** Past 12 months
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 12-month question matches SRC-048, including student pilots and crew. The earlier merged 'ever' row is gone.

## SRC-049 — page 4 — aviation

**Source window:** Past 24 months  
**Source wording:** Within the past 24 months, have you made or contemplated making any flights as a pilot, student pilot, or crew member of any aircraft?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `AVI-02`

- **Customer wording:** In the past 24 months, have you made, or contemplated making, any flights as a pilot, student pilot, or crew member of any aircraft?
- **Customer window:** Past 24 months
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 24-month question matches SRC-049, including 'contemplated' flights and student pilots, and that it is asked separately from the 12-month question.

## SRC-050 — page 4 — aviation

**Source window:** Next 2 years  
**Source wording:** Do you expect to fly in the future within the next two years? (If Yes, indicate whether the type of flying will differ from past flying and provide details).  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `AVI-04`

- **Customer wording:** Do you plan to fly as a pilot or crew member in the next 12 months?
- **Customer window:** Next 12 months
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: schedule: How often do you expect to fly?; type: What kind of flying?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** timeframe_changed
- **Reconciliation flags:** timeframe: Source asks about flying within the next two years; the bank asks about the next 12 months. wording: Source asks whether the type of flying will differ from past flying; the bank does not.
- **Decision still required:** Set the window to two years to match the source, or record the approved reason for 12 months.

## SRC-051 — page 4 — aviation

**Source window:** Current  
**Source wording:** What type of certificate or license do you have now (Student, Private, Commercial, ATP, Other)?  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** Certificate or rating is collected as a free-text field, without the source's Student/Private/Commercial/ATP options.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-052 — page 4 — aviation

**Source window:** Ever  
**Source wording:** Have you ever had an aircraft accident, been grounded, fined or reprimanded for violation of air regulations?  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** An optional field in the aviation detail step asks about accidents, groundings, fines and reprimands, but it is asked only after a Yes to the 24-month flight question and the categories are not distinguished.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-053 — page 4 — aviation

**Source window:** None stated  
**Source wording:** Provide the total of all hours flown as: (a) pilot (b) crew member, and a complete schedule of flying time (Commercial, Company-owned, Student Instruction, Pleasure, Military Combat/Non-Combat, etc.).  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** Total flying hours are collected, but not separately as pilot and crew, and the complete schedule of flying time is not captured.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-054 — page 4 — aviation

**Source window:** None stated  
**Source wording:** Provide details of any other flying not specifically classified above (i.e. crop dusting, mapping, surveying, testing) and type of aircraft flown (i.e. glider, helicopter, lighter-than-air).  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** Aircraft types are collected, but other flying (crop dusting, mapping, surveying, testing) is not.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-055 — page 4 — avocations

**Source window:** Past 2 years / next 2 years intended  
**Source wording:** Within the past 2 years (or next 2 years intend to participate), have you participated in parachuting, hang gliding, rock or mountain climbing, rodeo events, sky diving, skin or scuba diving, organized racing of any kind, or any professional sport?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `AVO-01`

- **Customer wording:** In the past 5 years, which of these activities have you taken part in?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** multi_choice
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** timeframe_changed
- **Reconciliation flags:** timeframe: Source asks about the past 2 years and the next 2 years intended; the bank asks about the past 5 years. wording: The bank omits parachuting, hang gliding, rodeo events and professional sport, and adds 'another hazardous activity'. branching: There is no 'intend to take part in the next 2 years' dimension, so planned participation never opens a branch.
- **Decision still required:** Restore the 2-year windows and the full activity list, including the intended-participation half. Each activity needs its own branch.

## SRC-056 — page 4 — avocations

**Source window:** None stated  
**Source wording:** For how many years have you been climbing regularly, and how often do you climb?  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** Climbing frequency is collected, but the number of years climbing regularly is not.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-057 — page 4 — avocations

**Source window:** None stated  
**Source wording:** Do you climb in any of the following areas: North America (Mt McKinley or elsewhere), Europe (Alps), Africa, Himalayas/Karakoram, or other areas?  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** A free-text location field exists, but the source's named regions (Alaska, Alps, Africa, Himalayas) are not offered.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-058 — page 4 — avocations

**Source window:** None stated  
**Source wording:** What is the nature of your climbing: Type of terrain (rock, snow/ice, artificial), degree of difficulty (easy, moderate, difficult, severe, technical grade), maximum height climbed to, and season(s) of the year?  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** Climbing type is collected, but terrain, difficulty grade, maximum height and season are not.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-059 — page 4 — avocations

**Source window:** None stated  
**Source wording:** What proportion of your climbing is on routes protected by climbing bolts?  
**Mapping status:** **gap:out_of_scope**  
**Unresolved difference:** The proportion of climbing on bolted routes is supporting detail. AVO-02 already records climbing type, frequency and location, and AVO-06 asks about solo or unroped climbing, which is the risk the bolt proportion would otherwise stand in for. Recorded out of scope deliberately.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-060 — page 4 — avocations

**Source window:** None stated  
**Source wording:** Do you ever climb alone or without a rope? (If Yes, state how often, the location, and degree of difficulty).  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `AVO-06`

- **Customer wording:** Do you ever climb alone or without a rope?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** AVO-01 includes climbing
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: howOften: How often?; where: Where?; difficulty: Degree of difficulty
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the solo or unroped climbing question matches SRC-060, including the frequency, location and difficulty follow-up, and is asked only of climbers.

## SRC-061 — page 4 — avocations

**Source window:** Ever / next 2 years intended  
**Source wording:** Have you engaged in, or do you within the next 2 years intend on engaging in, any of following forms of racing: Automobile or Hydroplane?  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** Racing is collected as an activity and a free-text type, but automobile versus hydroplane and intended participation in the next 2 years are not distinguished.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-062 — page 5 — avocations

**Source window:** None stated  
**Source wording:** Over what type of track do you race? (e.g., oval, simulated road).  
**Mapping status:** **gap:out_of_scope**  
**Unresolved difference:** Track configuration is supporting detail behind the racing question. AVO-03 already records what the customer races, the level and the number of events a year. Recorded out of scope deliberately.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-063 — page 5 — avocations

**Source window:** None stated  
**Source wording:** Do you race professionally or for cash prizes?  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** A professional amateurs-to-professional level field exists, but racing for cash prizes is not asked.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-064 — page 5 — avocations

**Source window:** None stated  
**Source wording:** Provide the date of your last race.  
**Mapping status:** **gap:out_of_scope**  
**Unresolved difference:** The date of the last race is recency detail. AVO-03 records events per year, which is the frequency the review uses. Recorded out of scope deliberately.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-065 — page 5 — avocations

**Source window:** None stated  
**Source wording:** Are you a certified skin/scuba diver? (If Yes, provide hours of instruction and date of certification. If No, why?)  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** A certification level is collected, but hours of instruction, date of certification and the reason for not being certified are not.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-066 — page 5 — avocations

**Source window:** Past 12 months / next 12 months  
**Source wording:** What is the maximum depth obtained on your dives? (Specify Pleasure or Commercial, number of dives, and average time underwater for less than 40ft, 40-60ft, 60-100ft, and 100+ ft in the last 12 months and contemplated next 12 months).  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** Maximum depth is collected as one free-text field. Dive count, average time underwater in the 40/60/100+ ft bands, and the last and next 12 months are not.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-067 — page 5 — avocations

**Source window:** None stated  
**Source wording:** What types of equipment do you use? (Scuba, number of tanks, type of air supply, wet suit, others).  
**Mapping status:** **gap:out_of_scope**  
**Unresolved difference:** Diving equipment is supporting detail. AVO-04 records diving type, certification level, maximum depth and dives per year. Recorded out of scope deliberately.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-068 — page 5 — avocations

**Source window:** None stated  
**Source wording:** What are the locations of your diving activities? (Lakes and Rivers, Ocean Beaches, Deep Sea, Bays and Inlets, or Others).  
**Mapping status:** **gap:out_of_scope**  
**Unresolved difference:** Dive locations and water types are supporting detail behind the depth and diving-type answers already collected in AVO-04. Recorded out of scope deliberately.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-069 — page 5 — avocations

**Source window:** None stated  
**Source wording:** Do you dive for salvage or exploration?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `AVO-07`

- **Customer wording:** Do you dive for salvage or exploration?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** AVO-01 includes scuba
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: What kind of work or exploration?; when: Approximate year of the most recent dive
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the salvage or exploration diving question matches SRC-069 and is asked only where scuba diving was selected.

## SRC-070 — page 5 — avocations

**Source window:** None stated  
**Source wording:** Are you a member of an organized club for your climbing or diving activities?  
**Mapping status:** **gap:out_of_scope**  
**Unresolved difference:** Membership of an organised climbing or diving club has no underwriting weight on its own; the activity, level and frequency are already collected. Recorded out of scope deliberately.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-071 — page 5 — driving

**Source window:** Current  
**Source wording:** Do you currently have a valid driver's license?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `DRV-06`

- **Customer wording:** Do you currently have a valid driver's licence?
- **Customer window:** Current
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the valid-licence-today question matches SRC-071 and is asked before the suspension and conviction questions.

## SRC-072 — page 5 — driving

**Source window:** Past 24 months  
**Source wording:** Within the past 24 months, have you had your driver's license suspended or revoked, or been convicted of driving under the influence of alcohol or drugs?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `DRV-01`

- **Customer wording:** In the past 24 months, have you had your driver's licence suspended or revoked, or been convicted of driving under the influence of alcohol or drugs?
- **Customer window:** Past 24 months
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: which: What happened?; when: Approximate year; reinstated: Is the licence reinstated?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 24-month question keeps both limbs — suspension or revocation, and a DUI or DWI conviction — and that a charge alone does not count as a Yes.

## SRC-073 — page 5 — driving

**Source window:** Past 5 years  
**Source wording:** Within the past 5 years, have you had a driver's license suspended or revoked, or is your driver's license currently suspended or revoked?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `DRV-02`

- **Customer wording:** In the past 5 years, have you had your driver's licence suspended or revoked, or is it currently suspended or revoked?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: reason: Why was it suspended or revoked?; when: Approximate year; reinstated: Is it reinstated?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 5-year question matches SRC-073, including a licence that is suspended today even if the suspension began earlier. The earlier merged 'ever' row is gone.

## SRC-074 — page 5 — driving

**Source window:** Past 5 years  
**Source wording:** Within the past 5 years, have you pled guilty to or been convicted of any moving violations?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `DRV-07`

- **Customer wording:** In the past 5 years, have you pleaded guilty to, or been convicted of, any moving violations?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: What were the violations?; when: Approximate year of the most recent
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 5-year plea-or-conviction question matches SRC-074 and stays separate from the more-than-two threshold in DRV-04.

## SRC-075 — page 5 — driving

**Source window:** Past 5 years  
**Source wording:** Within the past 5 years, have you been convicted of careless or reckless driving?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `DRV-03`

- **Customer wording:** In the past 5 years, have you been convicted of careless or reckless driving?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: What were you convicted of?; when: Approximate year; penalty: What was the penalty?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 5-year careless or reckless question asks about a conviction. The earlier 'ever charged' wording and its charge outcome prompt are gone.

## SRC-076 — page 5 — driving

**Source window:** Past 5 years  
**Source wording:** In the past 5 years, have you had more than two moving motor vehicle violations or any alcohol/drug related infractions?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `DRV-04`

- **Customer wording:** In the past 5 years, have you had more than two moving motor vehicle violations, or any alcohol- or drug-related infractions?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: count: How many moving violations?; substance: Was any infraction alcohol- or drug-related?; when: Approximate year of the most recent
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 5-year threshold question asks both limbs — more than two moving violations and any alcohol- or drug-related infraction — and that the overlap with the alcohol section is intentional.

## SRC-077 — page 5 — driving

**Source window:** Ever  
**Source wording:** Have you ever had any motor vehicle accidents? (If yes, provide details, including fault).  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `DRV-05`

- **Customer wording:** Have you ever had any motor vehicle accidents?
- **Customer window:** Ever
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: when: Approximate date; fault: Who was at fault?; injury: Was anyone injured?; citation: Was any citation issued?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the ever window is restored and that the detail step records fault, as the source asks.

## SRC-078 — page 5 — criminal

**Source window:** Past 6 months  
**Source wording:** Within the past 6 months, have you served or been released from incarceration, probation, parole, or other court-ordered supervision for a misdemeanor or felony conviction?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `CRM-05`

- **Customer wording:** In the past 6 months, have you served, or been released from, incarceration, probation, parole, or other court-ordered supervision for a misdemeanour or felony conviction?
- **Customer window:** Past 6 months
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: kind: Which one applies?; when: Approximate start, release or completion date; ongoing: Is it still in effect?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 6-month release-from-supervision question is asked separately from the conviction questions.

## SRC-079 — page 5 — criminal

**Source window:** Past 7 years  
**Source wording:** Within the past 7 years, have you been convicted of, pleaded guilty to, or entered a plea of no contest to any felony?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `CRM-02`

- **Customer wording:** In the past 7 years, have you been convicted of, pleaded guilty to, or entered a plea of no contest to any felony?
- **Customer window:** Past 7 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: offence: What was the offence?; when: Approximate date of arrest or conviction; outcome: How was it resolved?; custody: Was any jail time, probation or parole involved?; release: Approximate release or completion date (optional)
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 7-year felony window, including 'no contest' pleas, matches the source and stays separate from the 10-year window.

## SRC-080 — page 5 — criminal

**Source window:** Past 10 years  
**Source wording:** In the past 10 years, have you been convicted of, pled guilty to, or are you currently awaiting trial for a felony?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `CRM-03`

- **Customer wording:** In the past 10 years, have you been convicted of, or pleaded guilty to, a felony, or are you currently awaiting trial for one?
- **Customer window:** Past 10 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: offence: What was the offence?; when: Approximate date of arrest or conviction; outcome: How was it resolved?; custody: Was any jail time, probation or parole involved?; release: Approximate release or completion date (optional)
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 10-year felony window and the awaiting-trial limb. It is a distinct question from CRM-02, not a replacement for it.

## SRC-081 — page 5 — criminal

**Source window:** Past 10 years  
**Source wording:** In the past 10 years, have you served or been released from incarceration, probation, parole, or other court-ordered supervision for a misdemeanor or felony conviction?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `CRM-06`

- **Customer wording:** In the past 10 years, have you served, or been released from, incarceration, probation, parole, or other court-ordered supervision for a misdemeanour or felony conviction?
- **Customer window:** Past 10 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: kind: Which one applies?; when: Approximate start, release or completion date; ongoing: Is it still in effect?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 10-year release-from-supervision window. It overlaps CRM-05 on purpose; the source asks both.

## SRC-082 — page 6 — criminal

**Source window:** Currently  
**Source wording:** Are you currently under an order for probation, parole, or other court-ordered supervision for a misdemeanor or felony conviction?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `CRM-07`

- **Customer wording:** Are you currently under an order for probation, parole, or other court-ordered supervision for a misdemeanour or felony conviction?
- **Customer window:** Currently
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: kind: Which one applies?; when: Approximate start, release or completion date; ongoing: Is it still in effect?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the current-supervision question has no lookback and is asked on its own.

## SRC-083 — page 6 — criminal

**Source window:** Past 5 years  
**Source wording:** Within the past 5 years, have you pled guilty to or been convicted of a felony or misdemeanor (including DUI or DWI) or do you have such a charge currently pending against you?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `CRM-04`

- **Customer wording:** In the past 5 years, have you pleaded guilty to or been convicted of a felony or misdemeanour, including DUI or DWI, or do you have such a charge currently pending?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: offence: What was the offence?; when: Approximate date of arrest or conviction; outcome: How was it resolved?; custody: Was any jail time, probation or parole involved?; release: Approximate release or completion date (optional)
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 5-year misdemeanour and felony window, including DUI/DWI and a pending charge, matches SRC-083.

## SRC-084 — page 6 — criminal

**Source window:** Ever  
**Source wording:** Have you ever pled guilty to, or been convicted of, a felony or misdemeanor or have such a charge currently pending? (If Yes, please provide date of arrest, conviction, and any jail time, probation or parole).  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `CRM-01`

- **Customer wording:** Have you ever pleaded guilty to, or been convicted of, a felony or misdemeanour, or do you have such a charge currently pending?
- **Customer window:** Ever
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: offence: What was the offence?; when: Approximate date of arrest or conviction; outcome: How was it resolved?; custody: Was any jail time, probation or parole involved?; release: Approximate release or completion date (optional)
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the ever window and that the detail prompts cover SRC-084's request for date of arrest, conviction, jail time, probation and parole.

## SRC-085 — page 6 — bankruptcy

**Source window:** Ever  
**Source wording:** Have you or your spouse filed bankruptcy before? If so, what type?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `FIN-01`

- **Customer wording:** Have you ever filed for bankruptcy, personally or for a business you owned?
- **Customer window:** Ever
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** wording: Source asks 'Have you or your spouse filed bankruptcy before?'; the bank asks about the customer or a business they owned, and omits the spouse. branching: The source's immediate 'If so, what type?' follow-up is split into a separate supplemental row.
- **Decision still required:** Decide whether the spouse limb is asked. If it is deliberately excluded to avoid collecting a third party's data, record that as an approved revision.

## SRC-086 — page 6 — bankruptcy

**Source window:** None stated  
**Source wording:** If Chapter 7, was this personal or business?  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** Personal or business filing is collected, but the source's 'if Chapter 7' condition is not.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-087 — page 6 — bankruptcy

**Source window:** None stated  
**Source wording:** Has this bankruptcy been discharged?  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** Discharge status is collected as one option among several, without a dedicated yes/no.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-088 — page 6 — bankruptcy

**Source window:** None stated  
**Source wording:** What was the date or anticipated date of discharge?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `FIN-03`

- **Customer wording:** What was the date of discharge, or the anticipated date?
- **Customer window:** Ever
- **Exclusions shown:** none
- **Conditional rule:** FIN-01 includes yes | unknown
- **Question type:** short_text
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the discharge-date question matches SRC-088 and accepts an anticipated date while the filing is still open.

## SRC-089 — page 6 — bankruptcy

**Source window:** Current  
**Source wording:** Is this bankruptcy still in process?  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** A still-pending option exists, but the source asks whether the bankruptcy is still in process as its own question.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-090 — page 6 — drugs

**Source window:** Past 2 years  
**Source wording:** Within the past 2 years, have you used illegal drugs, abused alcohol or drugs, had or been recommended by a medical professional to have treatment or counseling for alcohol or drug use, or been advised to discontinue the use of alcohol or drugs?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `DRG-01`

- **Customer wording:** In the past 2 years, have you used illegal drugs, abused alcohol or drugs, had or been recommended by a medical professional to have treatment or counseling for alcohol or drug use, or been advised to discontinue the use of alcohol or drugs?
- **Customer window:** Past 2 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: Which substance or treatment?; when: Approximate year; now: Is this still happening?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 2-year question matches SRC-090, including the advice-to-discontinue limb.

## SRC-091 — page 6 — drugs

**Source window:** Past 5 years  
**Source wording:** Within the past 5 years, have you used illegal drugs or abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or drugs, or to have treatment or counseling for alcohol or drugs?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `DRG-02`

- **Customer wording:** In the past 5 years, have you used illegal drugs or abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or drugs, or to have treatment or counseling for alcohol or drugs?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: Which substance or treatment?; when: Approximate year; now: Is this still happening?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 5-year question matches SRC-091, including the licensed-counselor limb.

## SRC-092 — page 6 — drugs

**Source window:** Ever  
**Source wording:** Have you ever used heroin, morphine, other narcotics, marijuana, cocaine, barbiturates, amphetamines, hallucinogenic drugs, or other habit-forming drugs except as prescribed by a physician?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `DRG-04`

- **Customer wording:** Have you ever used heroin, morphine, other narcotics, marijuana, cocaine, barbiturates, amphetamines, hallucinogenic drugs, or other habit-forming drugs, except as prescribed by a physician?
- **Customer window:** Ever
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: Which substance or treatment?; when: Approximate year; now: Is this still happening?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the ever question uses the source's named drug list and its physician-prescribed exception. The 'controlled substance' reframing is gone.

## SRC-093 — page 6 — drugs

**Source window:** Past 7 years  
**Source wording:** Within the past 7 years, have you been advised by a medical professional to have treatment for, or reduce/discontinue the intake of prescription drugs?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `DRG-05`

- **Customer wording:** In the past 7 years, have you been advised by a medical professional to have treatment for, or to reduce or discontinue, the intake of prescription drugs?
- **Customer window:** Past 7 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: Which substance or treatment?; when: Approximate year; now: Is this still happening?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 7-year advice about prescription drugs is now asked. It was previously a coverage gap.

## SRC-094 — page 6 — drugs

**Source window:** Last 24 months  
**Source wording:** During the last 24 months, have you smoked marijuana for recreational purposes?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `DRG-03`

- **Customer wording:** In the last 24 months, have you smoked marijuana for recreational purposes?
- **Customer window:** Last 24 months
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 24-month recreational-marijuana question. The earlier 12-month window and supply prompt are gone.

## SRC-095 — page 6 — drugs

**Source window:** Past 10 years  
**Source wording:** In the past 10 years, have you been treated for drug abuse or used any drugs not prescribed to you?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `DRG-06`

- **Customer wording:** In the past 10 years, have you been treated for drug abuse, or used any drugs not prescribed to you?
- **Customer window:** Past 10 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: Which substance or treatment?; when: Approximate year; now: Is this still happening?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the 10-year treatment and non-prescribed-use question matches SRC-095.

## SRC-096 — page 6 — drugs

**Source window:** None stated  
**Source wording:** Do you have any history of or current treatment for drug abuse?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `DRG-07`

- **Customer wording:** Do you have any history of, or current treatment for, drug abuse?
- **Customer window:** Ever / current
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: Which substance or treatment?; when: Approximate year; now: Is this still happening?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the no-window history and current-treatment question is asked on its own.

## SRC-097 — page 6 — residency

**Source window:** Current  
**Source wording:** Is the Proposed Insured a U.S. Citizen or Permanent Resident? (If Permanent Resident, provide Visa or Green Card ID Number).  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `RES-01`

- **Customer wording:** Which best describes your citizenship or residency status in the United States?
- **Customer window:** none stated
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** single_choice
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** wording: Source asks citizen or permanent resident and then requests a visa or green-card number. The bank adds 'another status' and 'prefer not to answer', and the number is held separately as RES-05. branching: The source's visa or green-card follow-up has no approved branch; it is held, not asked.
- **Decision still required:** Approve the added answer options, and record that the identity-number follow-up is out of scope for this intake.

### Mapped row `RES-05`

- **Customer wording:** Held for review: an identity-document question not collected in this intake.
- **Customer window:** none stated
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** short_text
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: human_review_required; source verified: **NO**
- **Reconciliation verdict:** held_for_review
- **Reconciliation flags:** none
- **Decision still required:** Keep out of the automated intake. If ever required, collect it in an approved downstream workflow with documented necessity.

## SRC-098 — page 6 — residency

**Source window:** Current  
**Source wording:** If not a U.S. citizen, what is their immigration status or visa type?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `RES-04`

- **Customer wording:** Held for review: a source question requiring legal approval.
- **Customer window:** none stated
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** short_text
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: human_review_required; source verified: **NO**
- **Reconciliation verdict:** held_for_review
- **Reconciliation flags:** none
- **Decision still required:** Obtain legal review of whether immigration status is necessary, and approve the answer set and wording if it is.

## SRC-099 — page 7 — residency

**Source window:** Next 2 years  
**Source wording:** Within the next 2 years, do you intend to work, travel, or reside in Saudi Arabia, Iraq, Afghanistan, Syria, Somalia, Sudan, or Yemen for more than 30 days, or reside outside the United States at any location more than 180 days?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `RES-03`

- **Customer wording:** Do you plan to travel outside the United States in the next 12 months?
- **Customer window:** Next 12 months
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: where: Which countries?; when: Roughly when?; duration: How long will you be away in total?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** timeframe_changed
- **Reconciliation flags:** timeframe: Source windows are the next 2 years / next 24 months; the bank asks about the next 12 months. wording: The named-country list, the 30-day trip threshold and the 180-day residence threshold are all absent, as is the source's 'where?' follow-up.
- **Decision still required:** Restore the 2-year window and the 30/180-day thresholds. The country list also needs review before it is shown to customers.

## SRC-100 — page 7 — residency

**Source window:** Next 24 months  
**Source wording:** Within the next 24 months, do you intend to work, travel, or reside outside of the U.S. for more than 30 days? (If yes, where?)  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `RES-03`

- **Customer wording:** Do you plan to travel outside the United States in the next 12 months?
- **Customer window:** Next 12 months
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: where: Which countries?; when: Roughly when?; duration: How long will you be away in total?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** timeframe_changed
- **Reconciliation flags:** timeframe: Source windows are the next 2 years / next 24 months; the bank asks about the next 12 months. wording: The named-country list, the 30-day trip threshold and the 180-day residence threshold are all absent, as is the source's 'where?' follow-up.
- **Decision still required:** Restore the 2-year window and the 30/180-day thresholds. The country list also needs review before it is shown to customers.

## SRC-101 — page 7 — residency

**Source window:** Past 5 years  
**Source wording:** Has the Proposed Insured lived consistently in the USA for the past 5 years?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `RES-02`

- **Customer wording:** In the past 5 years, have you lived outside the United States for a month or more?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: where: Which country or countries?; when: Approximate dates; duration: Longest single stay
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** timeframe_changed
- **Reconciliation flags:** timeframe: Source asks whether the insured lived consistently in the USA for 5 years, and separately asks for travel details in the last 2 years. The bank asks about living outside the USA for a month or more in the last 5 years, which is neither question. wording: The 'consistently in the USA' test and the travel-detail request (dates, regions, reason, frequency, duration) are not asked.
- **Decision still required:** Rewrite the row to the source's questions, or record it as an LPP addition with its own rationale.

## SRC-102 — page 7 — residency

**Source window:** None stated  
**Source wording:** Does the Proposed Insured plan to move back to their native country?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `RES-06`

- **Customer wording:** Do you plan to move back to your native country?
- **Customer window:** Future
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: when: When do you expect to move?; where: Where to?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the return-migration question matches SRC-102.

## SRC-103 — page 7 — residency

**Source window:** Past 2 years  
**Source wording:** What are the details of your previous and future foreign travel/residence, including pleasure and short business trips within the last 2 years? (Provide dates of visits, countries, regions, reason for visits, frequency, and duration of visits).  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `RES-02`

- **Customer wording:** In the past 5 years, have you lived outside the United States for a month or more?
- **Customer window:** Past 5 years
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: where: Which country or countries?; when: Approximate dates; duration: Longest single stay
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** timeframe_changed
- **Reconciliation flags:** timeframe: Source asks whether the insured lived consistently in the USA for 5 years, and separately asks for travel details in the last 2 years. The bank asks about living outside the USA for a month or more in the last 5 years, which is neither question. wording: The 'consistently in the USA' test and the travel-detail request (dates, regions, reason, frequency, duration) are not asked.
- **Decision still required:** Rewrite the row to the source's questions, or record it as an LPP addition with its own rationale.

## SRC-104 — page 7 — occupation

**Source window:** Current  
**Source wording:** What is your current occupation?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `OCC-01`

- **Customer wording:** Tell us about your work.
- **Customer window:** none stated
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** short_text (compound)
- **Collected components:** fields: jobTitle: Job title; duties: Main duties; employerType: Employer or self-employed; income: Approximate annual income; hours: Typical hours per week; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** wording: SRC-106 asks whether you work full time (minimum 30 hours) and have done so for the past six months. The bank asks for typical hours per week and drops the 30-hour and six-month test. branching: Three source questions (occupation, salary, full-time history) are merged into one compound without confirming each component.
- **Decision still required:** Restore the 30-hour and six-month questions as their own components.

## SRC-105 — page 7 — occupation

**Source window:** Current  
**Source wording:** What is your annual salary?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `OCC-01`

- **Customer wording:** Tell us about your work.
- **Customer window:** none stated
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** short_text (compound)
- **Collected components:** fields: jobTitle: Job title; duties: Main duties; employerType: Employer or self-employed; income: Approximate annual income; hours: Typical hours per week; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** wording: SRC-106 asks whether you work full time (minimum 30 hours) and have done so for the past six months. The bank asks for typical hours per week and drops the 30-hour and six-month test. branching: Three source questions (occupation, salary, full-time history) are merged into one compound without confirming each component.
- **Decision still required:** Restore the 30-hour and six-month questions as their own components.

## SRC-106 — page 7 — occupation

**Source window:** Past 6 months  
**Source wording:** Are you currently working full-time (minimum 30 hours a week), and have you done so for the past six months?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `OCC-01`

- **Customer wording:** Tell us about your work.
- **Customer window:** none stated
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** short_text (compound)
- **Collected components:** fields: jobTitle: Job title; duties: Main duties; employerType: Employer or self-employed; income: Approximate annual income; hours: Typical hours per week; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** wording: SRC-106 asks whether you work full time (minimum 30 hours) and have done so for the past six months. The bank asks for typical hours per week and drops the 30-hour and six-month test. branching: Three source questions (occupation, salary, full-time history) are merged into one compound without confirming each component.
- **Decision still required:** Restore the 30-hour and six-month questions as their own components.

## SRC-107 — page 7 — occupation

**Source window:** Current  
**Source wording:** Do you carry a weapon in your occupation?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `OCC-02`

- **Customer wording:** Does your work involve firearms, explosives, working at height, or another hazardous duty?
- **Customer window:** Right now
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: What is involved?; frequency: How often?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** wording: SRC-107 asks whether you carry a weapon; SRC-108 asks whether you belong to a listed high-risk occupation. The bank asks a single generic hazard question and adds working at height. omission: The source's occupation examples (explosives handlers, iron workers, underground miners, professional athletes, casino workers, firefighters) are not shown. timeframe: The bank adds a 'right now' window; the source questions carry no stated window.
- **Decision still required:** Ask the two source questions separately and show the listed occupations, or record the approved revision.

## SRC-108 — page 7 — occupation

**Source window:** Current  
**Source wording:** Are you a member of any high-risk occupations (e.g., blasters & explosives handlers, structural workers/iron workers, underground miners, professional athletes, casino workers, firefighters, etc.)?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `OCC-02`

- **Customer wording:** Does your work involve firearms, explosives, working at height, or another hazardous duty?
- **Customer window:** Right now
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: what: What is involved?; frequency: How often?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** wording_changed
- **Reconciliation flags:** wording: SRC-107 asks whether you carry a weapon; SRC-108 asks whether you belong to a listed high-risk occupation. The bank asks a single generic hazard question and adds working at height. omission: The source's occupation examples (explosives handlers, iron workers, underground miners, professional athletes, casino workers, firefighters) are not shown. timeframe: The bank adds a 'right now' window; the source questions carry no stated window.
- **Decision still required:** Ask the two source questions separately and show the listed occupations, or record the approved revision.

## SRC-109 — page 7 — military

**Source window:** Current  
**Source wording:** Are you a member of the United States Military on active duty?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MIL-01`

- **Customer wording:** Have you ever served in the armed forces?
- **Customer window:** Ever
- **Exclusions shown:** none
- **Conditional rule:** none
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** timeframe_changed
- **Reconciliation flags:** timeframe: Source asks whether you are on active duty now. The bank asks whether you have ever served, which is a different population and a different window. branching: Every military follow-up depends on this answer, so the incorrect frame changes which branches open.
- **Decision still required:** Decide whether the row is current active duty (as sourced) or ever served (an LPP addition). If both, they must be separate rows with their own branches.

## SRC-110 — page 7 — military

**Source window:** Current / planned  
**Source wording:** If Yes, are you currently deployed or do you have orders to be deployed in Saudi Arabia, Iraq, Afghanistan, Syria, Somalia, Sudan, or Yemen?  
**Mapping status:** **mapped with flags**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MIL-03`

- **Customer wording:** In the past 12 months, have you been on active duty or deployed?
- **Customer window:** Past 12 months
- **Exclusions shown:** none
- **Conditional rule:** MIL-01 includes yes
- **Question type:** yesno
- **Collected components:** fields: none; detail prompts: status: Current status; hazard: Were you in a combat or hazardous area?
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** timeframe_changed
- **Reconciliation flags:** timeframe: Source asks about current deployment or orders to deploy, with no 12-month lookback. The bank asks about the past 12 months. wording: The named countries and the 'orders to deploy' limb are not asked. branching: The row branches on MIL-01's 'ever served' answer rather than on current active duty.
- **Decision still required:** Align the row with SRC-110, including current deployment, orders, and the country list, or record the approved revision.

## SRC-111 — page 7 — military

**Source window:** None stated  
**Source wording:** Provide your complete schedule of flying time if you participate in military aviation.  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** Approximate flying hours are collected, but not the complete schedule of military flying time.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.

## SRC-112 — page 7 — military

**Source window:** None stated  
**Source wording:** Do you fly Combat Tactical/Recon, Combat Transport/Support/Supply, Non-Combat Recon, Non-Combat Transport, or for Proficiency only?  
**Mapping status:** **mapped**  
**Unresolved difference:** see the per-row reconciliation flags below  

### Mapped row `MIL-04`

- **Customer wording:** What kind of missions do you fly?
- **Customer window:** Current
- **Exclusions shown:** none
- **Conditional rule:** MIL-02 includes yes
- **Question type:** multi_choice
- **Collected components:** fields: none; detail prompts: none
- **Classification:** core; review status: approved; source verified: **NO**
- **Reconciliation verdict:** matches_source
- **Reconciliation flags:** none
- **Decision still required:** Confirm the mission-type question matches SRC-112 and is asked only where service included flying or aircraft duties.

## SRC-113 — page 7 — military

**Source window:** None stated  
**Source wording:** Are you assigned duties aboard the aircraft?  
**Mapping status:** **gap:merge_into**  
**Unresolved difference:** Role is collected as pilot, air crew or maintenance, which only partly answers 'assigned duties aboard the aircraft'.  

No bank row implements this source question. It exists only as a recorded gap, not as customer-facing collection.
