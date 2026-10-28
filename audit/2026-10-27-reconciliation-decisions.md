# Reconciliation decisions requiring sign-off

37 of 92 rows carry a flag or a non-matching verdict.

## ID-01 — wording_changed — identity

- Source ids: SRC-001
- Bank timeframe: 
- Bank wording: What is your date of birth?
- Review status: approved; sourceVerified: false
- Source SRC-001 (None stated): What is your Date of Birth, Age, and State of Birth?
- Flags: 
  - wording: SRC-001 is one compound question (date of birth, age, state of birth). The bank collects date of birth only and does not confirm the split with the customer.
  - omission: Age and state of birth are not collected anywhere in the bank.
- Required decision: Decide whether to collect age and state of birth, or record why they are unnecessary. If the compound is split, add the confirmation step the specification requires.

## ID-02 — wording_changed — identity

- Source ids: SRC-001
- Bank timeframe: 
- Bank wording: Where were you born?
- Review status: approved; sourceVerified: false
- Source SRC-001 (None stated): What is your Date of Birth, Age, and State of Birth?
- Flags: 
  - wording: Source asks for state of birth; the bank asks for city and country. That widens the question beyond the source and duplicates one component of SRC-001.
- Required decision: Narrow the question to state of birth, or document the widening as an approved revision with a reason.

## ID-03 — not_in_source — identity

- Source ids: (none)
- Bank timeframe: 
- Bank wording: Which state do you currently live in?
- Review status: approved; sourceVerified: false
- Flags: 
  - attribution: Labelled a source question, but the PDF never asks for current state of residence. The specification asks for it separately for routing. Status corrected to supplemental.
- Required decision: Confirm the routing field stays supplemental and keeps its own label; it must not be counted as source coverage.

## ID-04 — held_for_review — identity

- Source ids: SRC-002
- Bank timeframe: 
- Bank wording: Held for review: the source questionnaire asks for sex or gender.
- Review status: human_review_required; sourceVerified: false
- Source SRC-002 (None stated): What is your Gender/Sex?
- Flags: 
  - wording: The source asks 'What is your Gender/Sex?'. No answer set or approved wording exists yet, so the row asks nothing.
- Required decision: Approve, reword or drop the sex/gender question, including the permitted answer set for each carrier and state.

## MED-09 — wording_changed — medical

- Source ids: SRC-029
- Bank timeframe: 
- Bank wording: Which prescription medications do you take regularly today?
- Review status: approved; sourceVerified: false
- Source SRC-029 (Current): What are all your current medications, including herb and vitamin supplements?
- Flags: 
  - wording: Source asks for 'all your current medications, including herb and vitamin supplements'; the bank asks only for prescription medications taken regularly, so supplements are excluded.
- Required decision: Add herb and vitamin supplements, or record an approved reason for excluding them.

## MED-10 — timeframe_changed — medical

- Source ids: SRC-021, SRC-022, SRC-037
- Bank timeframe: Past 5 years
- Bank wording: In the past 5 years, have you been unable to work, or needed help with daily activities because of your health?
- Review status: approved; sourceVerified: false
- Source SRC-021 (Currently): Are you currently unemployed due to medical reasons, or been prohibited from actively working full time (30 hours or more per week) at your regular occupation due to any illness, injury, or health-related problem, or are you currently receiving benefits, compensation, or pension for disability?
- Source SRC-022 (Currently): Are you currently hospitalized, confined to a nursing facility, receiving Hospice Care or home health care, or do you require assistance (from anyone) with activities of daily living such as bathing, dressing, eating or toileting?
- Source SRC-037 (Past 5 years): Within the past 5 years, have you been unable to work due to your condition?
- Flags: 
  - timeframe: SRC-021 and SRC-022 are current-state questions; the bank asks about the past 5 years. SRC-037's 5-year window belongs to the mental-health section, not this medical row.
  - wording: SRC-021's disability benefits/pension limb and 30-hour full-time test, and SRC-022's hospital, nursing facility, hospice and home-health limbs, are merged into one sentence.
  - branching: Disability benefits and current confinement have different follow-ups but share one answer.
- Required decision: Separate current disability/confinement from the 5-year work-impact question, and restore the 30-hour and benefits wording.

## MED-11 — held_for_review — medical

- Source ids: SRC-009
- Bank timeframe: 
- Bank wording: Held for review: the source questionnaire asks about HIV or AIDS.
- Review status: human_review_required; sourceVerified: false
- Source SRC-009 (Ever): Have you ever been diagnosed, treated, tested positive for, or received medical advice for Human Immunodeficiency Virus (HIV) or Acquired Immune Deficiency Syndrome (AIDS)?
- Flags: none
- Required decision: Obtain documented legal, clinical and underwriting approval for asking about HIV/AIDS, including state restrictions and confidentiality handling.

## MH-01 — wording_changed — mental

- Source ids: SRC-030, SRC-031, SRC-015
- Bank timeframe: Ever
- Bank wording: Have you ever been diagnosed with or treated for a mental health condition, such as anxiety or depression?
- Review status: approved; sourceVerified: false
- Source SRC-030 (None stated): Do you have any history of or current treatment for psychological, mood, or anxiety disorders?
- Source SRC-031 (None stated): What mental health, nervous, or psychiatric conditions apply to you (e.g., situational anxiety, adjustment disorder, panic disorder, depression, major depression, schizophrenia, bipolar I or II, ADHD/ADD, eating disorder, mental retardation, PTSD, Tourette's syndrome, suicide attempt/ideation, OCD, autism)?
- Source SRC-015 (Past 7 years): Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for cancer in any form, anemia, any seizures, bipolar disorder, schizophrenia, Alzheimer's, dementia, or mental or nervous disorder?
- Flags: 
  - wording: SRC-031's condition list (bipolar, schizophrenia, PTSD, eating disorder, OCD, autism and others) is replaced by 'such as anxiety or depression'.
  - timeframe: SRC-015's 7-year mental or nervous disorder window is not represented.
  - branching: Bipolar and schizophrenia carry separate underwriting treatment but share one answer here.
- Required decision: Approve a condition list for the follow-up, and decide whether the 7-year mental/nervous window is asked separately.

## MH-02 — added_by_lpp — mental

- Source ids: (none)
- Bank timeframe: Ever
- Bank wording: A little about the condition and the care you received.
- Review status: approved; sourceVerified: false
- Flags: 
  - attribution: Diagnosis timing and treatment type are LPP additions, but the source asks related questions (SRC-033 medication details, SRC-034 diagnosis and last seen, SRC-035 outpatient care, SRC-036 in-patient care) that this row does not reproduce.
- Required decision: Keep as supplemental, then decide which of SRC-033 to SRC-036 are added as source rows rather than folded into this detail.

## MH-03 — wording_changed — mental

- Source ids: SRC-037
- Bank timeframe: Past 5 years
- Bank wording: In the past 5 years, has a mental health condition caused you to miss work or stop working?
- Review status: approved; sourceVerified: false
- Source SRC-037 (Past 5 years): Within the past 5 years, have you been unable to work due to your condition?
- Flags: 
  - wording: Source asks whether you were 'unable to work'; the bank asks whether the condition caused you to 'miss work or stop working', which widens the question.
- Required decision: Align the wording with 'unable to work', or approve the widening explicitly.

## MH-04 — wording_changed — mental

- Source ids: SRC-038, SRC-039
- Bank timeframe: Ever
- Bank wording: Have you ever had thoughts of ending your life, or made a suicide attempt?
- Review status: approved; sourceVerified: false
- Source SRC-038 (None stated): Have you had any suicidal thoughts?
- Source SRC-039 (None stated): Have you attempted suicide? (If yes, provide details, including date and follow-up treatment).
- Flags: 
  - branching: Two source questions (thoughts, and attempts with their detail request) are merged into one Yes/No, so a customer who has attempted cannot say so separately.
  - omission: SRC-039's required detail (date and follow-up treatment) is optional in this row.
- Required decision: Split thoughts from attempts, or confirm the merged wording with the customer as required for a compound question. Keep the crisis panel attached to either answer.

## MH-05 — added_by_lpp — mental

- Source ids: (none)
- Bank timeframe: Right now
- Bank wording: Are you having thoughts of harming yourself right now?
- Review status: approved; sourceVerified: false
- Flags: none
- Required decision: Confirm the crisis question is asked of every customer, whatever the answer to MH-04. It is no longer gated on a Yes, and `npm run check:bank` now fails if it is gated again.

## MH-06 — held_for_review — mental

- Source ids: SRC-039
- Bank timeframe: 
- Bank wording: Held for review: the source questionnaire asks for detail about any attempt.
- Review status: human_review_required; sourceVerified: false
- Source SRC-039 (None stated): Have you attempted suicide? (If yes, provide details, including date and follow-up treatment).
- Flags: none
- Required decision: Obtain clinical and legal approval for detail-level suicide questions, including crisis-support handling, before any collection.

## NIC-01 — split_source_compound — nicotine

- Source ids: SRC-040, SRC-042
- Bank timeframe: Past 12 months
- Bank wording: In the past 12 months, have you used tobacco or any nicotine product in any form?
- Review status: approved; sourceVerified: false
- Source SRC-040 (Past 12 months, 3 years, or 5 years (three windows in one question)): Has the proposed insured used nicotine, tobacco, vape, or e-cigarettes within the past 12 months, 3 years, or 5 years? (excluding occasional cigar or pipe use)? (Note: Tobacco in any form includes cigarettes, electronic cigarettes/e-cigs, chewing tobacco, cigars, pipes, snuff, nicotine patch, nicotine gum/aerosol/inhaler, Hookah pipe, clove, bidis cigarettes, or oral nicotine pouches.)
- Source SRC-042 (Past 12 months): Have you used tobacco or any nicotine products in any form within the past twelve (12) months? (If Yes, type and amount, if No, date last used.)
- Flags: none
- Required decision: SRC-040 carries the 12-month, 3-year and 5-year windows in one question. This row asks the 12-month limb, with type and amount on Yes and the source's occasional cigar/pipe exclusion. Confirm the split.

## NIC-02 — split_source_compound — nicotine

- Source ids: SRC-040, SRC-041
- Bank timeframe: Past 36 months
- Bank wording: In the past 36 months, have you used tobacco or nicotine products in any form?
- Review status: approved; sourceVerified: false
- Source SRC-040 (Past 12 months, 3 years, or 5 years (three windows in one question)): Has the proposed insured used nicotine, tobacco, vape, or e-cigarettes within the past 12 months, 3 years, or 5 years? (excluding occasional cigar or pipe use)? (Note: Tobacco in any form includes cigarettes, electronic cigarettes/e-cigs, chewing tobacco, cigars, pipes, snuff, nicotine patch, nicotine gum/aerosol/inhaler, Hookah pipe, clove, bidis cigarettes, or oral nicotine pouches.)
- Source SRC-041 (Past 36 months): During the past 36 months, have you used tobacco or nicotine products in any form (excluding occasional cigar or pipe use)?
- Flags: none
- Required decision: This row asks the 36-month limb of SRC-040 and SRC-041 as its own question, rather than folding it into the 12-month answer. Confirm the separate window.

## NIC-03 — split_source_compound — nicotine

- Source ids: SRC-040
- Bank timeframe: Past 5 years
- Bank wording: In the past 5 years, have you used nicotine, tobacco, vaping or e-cigarettes in any form?
- Review status: approved; sourceVerified: false
- Source SRC-040 (Past 12 months, 3 years, or 5 years (three windows in one question)): Has the proposed insured used nicotine, tobacco, vape, or e-cigarettes within the past 12 months, 3 years, or 5 years? (excluding occasional cigar or pipe use)? (Note: Tobacco in any form includes cigarettes, electronic cigarettes/e-cigs, chewing tobacco, cigars, pipes, snuff, nicotine patch, nicotine gum/aerosol/inhaler, Hookah pipe, clove, bidis cigarettes, or oral nicotine pouches.)
- Flags: none
- Required decision: This row asks the 5-year limb of SRC-040, including its product definition. Confirm the window and that the longer window is asked separately from the shorter two.

## NIC-04 — wording_changed — nicotine

- Source ids: SRC-042
- Bank timeframe: Most recent use
- Bank wording: When did you last use any tobacco or nicotine product?
- Review status: approved; sourceVerified: false
- Source SRC-042 (Past 12 months): Have you used tobacco or any nicotine products in any form within the past twelve (12) months? (If Yes, type and amount, if No, date last used.)
- Flags: 
  - branching: SRC-042 asks for the date last used only when the 12-month answer is No. This row also asks after an unsure answer, so an uncertain customer is not left without a last-use date.
- Required decision: Approve the extra unsure branch, or restrict the follow-up to a No exactly as the source does.

## ALC-01 — not_in_source — alcohol

- Source ids: (none)
- Bank timeframe: Past 12 months
- Bank wording: In the past 12 months, have you drunk alcohol?
- Review status: approved; sourceVerified: false
- Flags: 
  - attribution: The source never asks whether you drink. It asks about abuse, treatment, advice to stop and infractions. This question is an LPP addition and was labelled a source question. Status corrected to supplemental.
- Required decision: Confirm the addition is wanted and keep it labelled supplemental, or remove it. It must not be counted as source coverage.

## AVI-03 — added_by_lpp — aviation

- Source ids: (none)
- Bank timeframe: Past 24 months
- Bank wording: A few details about your flying.
- Review status: approved; sourceVerified: false
- Flags: 
  - attribution: Certificate (SRC-051), hours as pilot and crew (SRC-053) and aircraft types (SRC-054) are source questions presented as LPP additions.
  - omission: The complete schedule of flying time and the type of other flying are not collected.
  - branching: Aviation accidents, groundings, fines and reprimands (SRC-052) are an optional field in this detail step, asked only after a Yes to the 24-month question, rather than their own 'ever' question.
- Required decision: Reattribute the fields to the source questions they answer, add the missing schedule, and decide whether SRC-052 is asked as its own question.

## AVI-04 — timeframe_changed — aviation

- Source ids: SRC-050
- Bank timeframe: Next 12 months
- Bank wording: Do you plan to fly as a pilot or crew member in the next 12 months?
- Review status: approved; sourceVerified: false
- Source SRC-050 (Next 2 years): Do you expect to fly in the future within the next two years? (If Yes, indicate whether the type of flying will differ from past flying and provide details).
- Flags: 
  - timeframe: Source asks about flying within the next two years; the bank asks about the next 12 months.
  - wording: Source asks whether the type of flying will differ from past flying; the bank does not.
- Required decision: Set the window to two years to match the source, or record the approved reason for 12 months.

## AVO-01 — timeframe_changed — avocations

- Source ids: SRC-055
- Bank timeframe: Past 5 years
- Bank wording: In the past 5 years, which of these activities have you taken part in?
- Review status: approved; sourceVerified: false
- Source SRC-055 (Past 2 years / next 2 years intended): Within the past 2 years (or next 2 years intend to participate), have you participated in parachuting, hang gliding, rock or mountain climbing, rodeo events, sky diving, skin or scuba diving, organized racing of any kind, or any professional sport?
- Flags: 
  - timeframe: Source asks about the past 2 years and the next 2 years intended; the bank asks about the past 5 years.
  - wording: The bank omits parachuting, hang gliding, rodeo events and professional sport, and adds 'another hazardous activity'.
  - branching: There is no 'intend to take part in the next 2 years' dimension, so planned participation never opens a branch.
- Required decision: Restore the 2-year windows and the full activity list, including the intended-participation half. Each activity needs its own branch.

## AVO-02 — added_by_lpp — avocations

- Source ids: (none)
- Bank timeframe: Past 5 years
- Bank wording: A little about your climbing.
- Review status: approved; sourceVerified: false
- Flags: 
  - attribution: Climbing years, frequency, areas and terrain (SRC-056 to SRC-058) are source questions presented as LPP additions.
  - omission: Bolted-route proportion (SRC-059) and climbing alone or without a rope (SRC-060) are not asked.
- Required decision: Add SRC-059 and SRC-060 as source questions, and reattribute the fields that already answer SRC-056 to SRC-058.

## AVO-03 — added_by_lpp — avocations

- Source ids: (none)
- Bank timeframe: Past 5 years
- Bank wording: A little about your racing.
- Review status: approved; sourceVerified: false
- Flags: 
  - attribution: Automobile or hydroplane racing (SRC-061), professional or cash prizes (SRC-063) and last race date (SRC-064) are source questions presented as LPP additions.
  - omission: Track type (SRC-062) and the last-race date are not collected.
- Required decision: Add track type and last race date, and reattribute the source-derived fields.

## AVO-04 — added_by_lpp — avocations

- Source ids: (none)
- Bank timeframe: Past 5 years
- Bank wording: A little about your scuba diving.
- Review status: approved; sourceVerified: false
- Flags: 
  - attribution: Certification, depth and dive volume (SRC-065, SRC-066) are source questions presented as LPP additions.
  - omission: Hours of instruction and certification date, depth bands and their 12-month windows, equipment (SRC-067), locations (SRC-068) and salvage or exploration diving (SRC-069) are not asked.
- Required decision: Decide which source diving questions are collected, then add them as source rows rather than supplemental fields.

## AVO-05 — added_by_lpp — avocations

- Source ids: (none)
- Bank timeframe: Past 5 years
- Bank wording: A little about your skydiving or paragliding.
- Review status: approved; sourceVerified: false
- Flags: 
  - attribution: Skydiving and hang gliding come from SRC-055, which this row is not traced to.
  - timeframe: The row uses a 5-year window; SRC-055 uses 2 years.
- Required decision: Trace the row to SRC-055 and align the window, or label it as an LPP addition with no source window.

## FIN-01 — wording_changed — financial

- Source ids: SRC-085
- Bank timeframe: Ever
- Bank wording: Have you ever filed for bankruptcy, personally or for a business you owned?
- Review status: approved; sourceVerified: false
- Source SRC-085 (Ever): Have you or your spouse filed bankruptcy before? If so, what type?
- Flags: 
  - wording: Source asks 'Have you or your spouse filed bankruptcy before?'; the bank asks about the customer or a business they owned, and omits the spouse.
  - branching: The source's immediate 'If so, what type?' follow-up is split into a separate supplemental row.
- Required decision: Decide whether the spouse limb is asked. If it is deliberately excluded to avoid collecting a third party's data, record that as an approved revision.

## FIN-02 — added_by_lpp — financial

- Source ids: (none)
- Bank timeframe: Ever
- Bank wording: A few details about the bankruptcy.
- Review status: approved; sourceVerified: false
- Flags: 
  - attribution: Chapter, personal or business, discharge and pending status (SRC-086, SRC-087, SRC-089) are source questions presented as LPP additions.
  - omission: The date or anticipated date of discharge (SRC-088) is not collected.
  - branching: The row opens on 'unknown' as well as 'yes'; the source branches only on yes.
- Required decision: Reattribute the source-derived fields, add the discharge date, and confirm the unknown branch is intended.

## RES-01 — wording_changed — residency

- Source ids: SRC-097
- Bank timeframe: 
- Bank wording: Which best describes your citizenship or residency status in the United States?
- Review status: approved; sourceVerified: false
- Source SRC-097 (Current): Is the Proposed Insured a U.S. Citizen or Permanent Resident? (If Permanent Resident, provide Visa or Green Card ID Number).
- Flags: 
  - wording: Source asks citizen or permanent resident and then requests a visa or green-card number. The bank adds 'another status' and 'prefer not to answer', and the number is held separately as RES-05.
  - branching: The source's visa or green-card follow-up has no approved branch; it is held, not asked.
- Required decision: Approve the added answer options, and record that the identity-number follow-up is out of scope for this intake.

## RES-02 — timeframe_changed — residency

- Source ids: SRC-101, SRC-103
- Bank timeframe: Past 5 years
- Bank wording: In the past 5 years, have you lived outside the United States for a month or more?
- Review status: approved; sourceVerified: false
- Source SRC-101 (Past 5 years): Has the Proposed Insured lived consistently in the USA for the past 5 years?
- Source SRC-103 (Past 2 years): What are the details of your previous and future foreign travel/residence, including pleasure and short business trips within the last 2 years? (Provide dates of visits, countries, regions, reason for visits, frequency, and duration of visits).
- Flags: 
  - timeframe: Source asks whether the insured lived consistently in the USA for 5 years, and separately asks for travel details in the last 2 years. The bank asks about living outside the USA for a month or more in the last 5 years, which is neither question.
  - wording: The 'consistently in the USA' test and the travel-detail request (dates, regions, reason, frequency, duration) are not asked.
- Required decision: Rewrite the row to the source's questions, or record it as an LPP addition with its own rationale.

## RES-03 — timeframe_changed — residency

- Source ids: SRC-099, SRC-100
- Bank timeframe: Next 12 months
- Bank wording: Do you plan to travel outside the United States in the next 12 months?
- Review status: approved; sourceVerified: false
- Source SRC-099 (Next 2 years): Within the next 2 years, do you intend to work, travel, or reside in Saudi Arabia, Iraq, Afghanistan, Syria, Somalia, Sudan, or Yemen for more than 30 days, or reside outside the United States at any location more than 180 days?
- Source SRC-100 (Next 24 months): Within the next 24 months, do you intend to work, travel, or reside outside of the U.S. for more than 30 days? (If yes, where?)
- Flags: 
  - timeframe: Source windows are the next 2 years / next 24 months; the bank asks about the next 12 months.
  - wording: The named-country list, the 30-day trip threshold and the 180-day residence threshold are all absent, as is the source's 'where?' follow-up.
- Required decision: Restore the 2-year window and the 30/180-day thresholds. The country list also needs review before it is shown to customers.

## RES-04 — held_for_review — residency

- Source ids: SRC-098
- Bank timeframe: 
- Bank wording: Held for review: the source questionnaire asks for an immigration category.
- Review status: human_review_required; sourceVerified: false
- Source SRC-098 (Current): If not a U.S. citizen, what is their immigration status or visa type?
- Flags: none
- Required decision: Obtain legal review of whether immigration status is necessary, and approve the answer set and wording if it is.

## RES-05 — held_for_review — residency

- Source ids: SRC-097
- Bank timeframe: 
- Bank wording: Held for review: the source questionnaire asks for a visa or green-card number.
- Review status: human_review_required; sourceVerified: false
- Source SRC-097 (Current): Is the Proposed Insured a U.S. Citizen or Permanent Resident? (If Permanent Resident, provide Visa or Green Card ID Number).
- Flags: none
- Required decision: Keep out of the automated intake. If ever required, collect it in an approved downstream workflow with documented necessity.

## OCC-01 — wording_changed — occupation

- Source ids: SRC-104, SRC-105, SRC-106
- Bank timeframe: 
- Bank wording: Tell us about your work.
- Review status: approved; sourceVerified: false
- Source SRC-104 (Current): What is your current occupation?
- Source SRC-105 (Current): What is your annual salary?
- Source SRC-106 (Past 6 months): Are you currently working full-time (minimum 30 hours a week), and have you done so for the past six months?
- Flags: 
  - wording: SRC-106 asks whether you work full time (minimum 30 hours) and have done so for the past six months. The bank asks for typical hours per week and drops the 30-hour and six-month test.
  - branching: Three source questions (occupation, salary, full-time history) are merged into one compound without confirming each component.
- Required decision: Restore the 30-hour and six-month questions as their own components.

## OCC-02 — wording_changed — occupation

- Source ids: SRC-107, SRC-108
- Bank timeframe: Right now
- Bank wording: Does your work involve firearms, explosives, working at height, or another hazardous duty?
- Review status: approved; sourceVerified: false
- Source SRC-107 (Current): Do you carry a weapon in your occupation?
- Source SRC-108 (Current): Are you a member of any high-risk occupations (e.g., blasters & explosives handlers, structural workers/iron workers, underground miners, professional athletes, casino workers, firefighters, etc.)?
- Flags: 
  - wording: SRC-107 asks whether you carry a weapon; SRC-108 asks whether you belong to a listed high-risk occupation. The bank asks a single generic hazard question and adds working at height.
  - omission: The source's occupation examples (explosives handlers, iron workers, underground miners, professional athletes, casino workers, firefighters) are not shown.
  - timeframe: The bank adds a 'right now' window; the source questions carry no stated window.
- Required decision: Ask the two source questions separately and show the listed occupations, or record the approved revision.

## MIL-01 — timeframe_changed — military

- Source ids: SRC-109
- Bank timeframe: Ever
- Bank wording: Have you ever served in the armed forces?
- Review status: approved; sourceVerified: false
- Source SRC-109 (Current): Are you a member of the United States Military on active duty?
- Flags: 
  - timeframe: Source asks whether you are on active duty now. The bank asks whether you have ever served, which is a different population and a different window.
  - branching: Every military follow-up depends on this answer, so the incorrect frame changes which branches open.
- Required decision: Decide whether the row is current active duty (as sourced) or ever served (an LPP addition). If both, they must be separate rows with their own branches.

## MIL-02 — added_by_lpp — military

- Source ids: (none)
- Bank timeframe: Ever
- Bank wording: Did your service include flying or aircraft duties?
- Review status: approved; sourceVerified: false
- Flags: 
  - attribution: Flying time and duties aboard an aircraft (SRC-111, SRC-113) are source questions presented as LPP additions.
  - omission: Mission type (SRC-112: Combat Tactical/Recon, Combat Transport, Non-Combat Recon, Non-Combat Transport, Proficiency) is not asked.
- Required decision: Add the mission-type question and reattribute the source-derived fields.

## MIL-03 — timeframe_changed — military

- Source ids: SRC-110
- Bank timeframe: Past 12 months
- Bank wording: In the past 12 months, have you been on active duty or deployed?
- Review status: approved; sourceVerified: false
- Source SRC-110 (Current / planned): If Yes, are you currently deployed or do you have orders to be deployed in Saudi Arabia, Iraq, Afghanistan, Syria, Somalia, Sudan, or Yemen?
- Flags: 
  - timeframe: Source asks about current deployment or orders to deploy, with no 12-month lookback. The bank asks about the past 12 months.
  - wording: The named countries and the 'orders to deploy' limb are not asked.
  - branching: The row branches on MIL-01's 'ever served' answer rather than on current active duty.
- Required decision: Align the row with SRC-110, including current deployment, orders, and the country list, or record the approved revision.
