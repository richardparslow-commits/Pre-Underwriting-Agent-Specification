# Qwencloud questionnaire appendix — all source items and bank rows

Generated at the audited commit from `sourceInventory.ts`, `reconciliation.ts` and `questionBank.ts`. This is not an approval record: `sourceVerified` remains `false` on every bank row.

## Coverage totals

| Measure | Count |
|---|---:|
| Source items inventoried | 113 |
| Source items with at least one mapped bank row or gap target | 104 |
| Traced source items | 85 |
| Partly collected source items | 19 |
| Out-of-scope source items | 9 |
| Not traced | 0 |
| Bank rows | 92 |
| Bank rows with sourceVerified true | 0 |
| Approved bank rows | 87 |
| Held bank rows | 5 |

Coverage labels are structural, not semantic approval: `traced` means every source item has a mapped row, not that the row preserves the source meaning. `partly_collected` and `out_of_scope` come from the committed gap records.

## Source-item matrix (113)

| Source ID | Page | Area | Source timeframe | Mapped bank row(s) | Coverage | Review status | sourceVerified | Verdict(s) | Flags | Gap disposition |
|---|---:|---|---|---|---|---|---|---|---|---|
| SRC-001 | 1 | medical | None stated | ID-01, ID-02 | traced | approved, approved | 0 of 2 | wording_changed, wording_changed | wording: SRC-001 is one compound question (date of birth, age, state of birth). The bank collects date of birth only and does not confirm the split with the customer.; omission: Age and state of birth are not collected anywhere in the bank.; wording: Source asks for state of birth; the bank asks for city and country. That widens the question beyond the source and duplicates one component of SRC-001. | — |
| SRC-002 | 1 | medical | None stated | ID-04 | traced | human_review_required | 0 of 1 | held_for_review | wording: The source asks 'What is your Gender/Sex?'. No answer set or approved wording exists yet, so the row asks nothing. | — |
| SRC-003 | 1 | medical | Past 12 months | MED-01 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-004 | 1 | medical | Past 12 months | MED-02 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-005 | 1 | medical | Past 2 years | MED-03 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-006 | 1 | medical | Past 2 years | MED-04 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-007 | 1 | medical | Past 3 years | MED-06 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-008 | 1 | medical | Past 5 years | MED-08 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-009 | 1 | medical | Ever | MED-11 | traced | human_review_required | 0 of 1 | held_for_review | — | — |
| SRC-010 | 1 | medical | Past 5 years | — | out_of_scope | — | 0 | — | — | out_of_scope |
| SRC-011 | 1 | medical | Past 7 years | MED-12 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-012 | 1 | medical | Past 7 years | MED-13 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-013 | 1 | medical | Past 7 years | MED-14 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-014 | 2 | medical | Last 6 months (within an 'ever' diagnosis) | MED-20 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-015 | 2 | medical | Past 7 years | MED-15, MH-01 | traced | approved, approved | 0 of 2 | matches_source, wording_changed | wording: SRC-031's condition list (bipolar, schizophrenia, PTSD, eating disorder, OCD, autism and others) is replaced by 'such as anxiety or depression'.; timeframe: SRC-015's 7-year mental or nervous disorder window is not represented.; branching: Bipolar and schizophrenia carry separate underwriting treatment but share one answer here. | — |
| SRC-016 | 2 | medical | Past 7 years | MED-16 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-017 | 2 | medical | Past 7 years | MED-17 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-018 | 2 | medical | Past 10 years | MED-18 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-019 | 2 | medical | Past 10 years | MED-19 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-020 | 2 | medical | None stated | MED-21 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-021 | 2 | medical | Currently | MED-10 | traced | approved | 0 of 1 | timeframe_changed | timeframe: SRC-021 and SRC-022 are current-state questions; the bank asks about the past 5 years. SRC-037's 5-year window belongs to the mental-health section, not this medical row.; wording: SRC-021's disability benefits/pension limb and 30-hour full-time test, and SRC-022's hospital, nursing facility, hospice and home-health limbs, are merged into one sentence.; branching: Disability benefits and current confinement have different follow-ups but share one answer. | — |
| SRC-022 | 2 | medical | Currently | MED-10 | traced | approved | 0 of 1 | timeframe_changed | timeframe: SRC-021 and SRC-022 are current-state questions; the bank asks about the past 5 years. SRC-037's 5-year window belongs to the mental-health section, not this medical row.; wording: SRC-021's disability benefits/pension limb and 30-hour full-time test, and SRC-022's hospital, nursing facility, hospice and home-health limbs, are merged into one sentence.; branching: Disability benefits and current confinement have different follow-ups but share one answer. | — |
| SRC-023 | 2 | medical | Past 12 months | MED-22 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-024 | 2 | medical | Ever | MED-23 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-025 | 2 | medical | Currently | MED-24 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-026 | 2 | medical | Ever before age 60 | MED-25 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-027 | 2 | medical | Ever before age 60 | MED-26 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-028 | 2 | medical | None stated | MED-01 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-029 | 3 | medical | Current | MED-09 | traced | approved | 0 of 1 | wording_changed | wording: Source asks for 'all your current medications, including herb and vitamin supplements'; the bank asks only for prescription medications taken regularly, so supplements are excluded. | — |
| SRC-030 | 3 | mental | None stated | MH-01 | traced | approved | 0 of 1 | wording_changed | wording: SRC-031's condition list (bipolar, schizophrenia, PTSD, eating disorder, OCD, autism and others) is replaced by 'such as anxiety or depression'.; timeframe: SRC-015's 7-year mental or nervous disorder window is not represented.; branching: Bipolar and schizophrenia carry separate underwriting treatment but share one answer here. | — |
| SRC-031 | 3 | mental | None stated | MH-01 | traced | approved | 0 of 1 | wording_changed | wording: SRC-031's condition list (bipolar, schizophrenia, PTSD, eating disorder, OCD, autism and others) is replaced by 'such as anxiety or depression'.; timeframe: SRC-015's 7-year mental or nervous disorder window is not represented.; branching: Bipolar and schizophrenia carry separate underwriting treatment but share one answer here. | — |
| SRC-032 | 3 | mental | Last 6 months | — | out_of_scope | — | 0 | — | — | out_of_scope |
| SRC-033 | 3 | mental | Current | — | out_of_scope | — | 0 | — | — | out_of_scope |
| SRC-034 | 3 | mental | None stated | MH-02 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-035 | 3 | mental | Past 5 years | MH-07 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-036 | 3 | mental | Past 5 years | MH-02 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-037 | 3 | mental | Past 5 years | MED-10, MH-03 | traced | approved, approved | 0 of 2 | timeframe_changed, wording_changed | timeframe: SRC-021 and SRC-022 are current-state questions; the bank asks about the past 5 years. SRC-037's 5-year window belongs to the mental-health section, not this medical row.; wording: SRC-021's disability benefits/pension limb and 30-hour full-time test, and SRC-022's hospital, nursing facility, hospice and home-health limbs, are merged into one sentence.; branching: Disability benefits and current confinement have different follow-ups but share one answer.; wording: Source asks whether you were 'unable to work'; the bank asks whether the condition caused you to 'miss work or stop working', which widens the question. | — |
| SRC-038 | 3 | mental | None stated | MH-04 | traced | approved | 0 of 1 | wording_changed | branching: Two source questions (thoughts, and attempts with their detail request) are merged into one Yes/No, so a customer who has attempted cannot say so separately.; omission: SRC-039's required detail (date and follow-up treatment) is optional in this row. | — |
| SRC-039 | 3 | mental | None stated | MH-04, MH-06 | traced | approved, human_review_required | 0 of 2 | wording_changed, held_for_review | branching: Two source questions (thoughts, and attempts with their detail request) are merged into one Yes/No, so a customer who has attempted cannot say so separately.; omission: SRC-039's required detail (date and follow-up treatment) is optional in this row. | — |
| SRC-040 | 3 | nicotine | Past 12 months, 3 years, or 5 years (three windows in one question) | NIC-01, NIC-02, NIC-03 | traced | approved, approved, approved | 0 of 3 | split_source_compound, split_source_compound, split_source_compound | — | — |
| SRC-041 | 3 | nicotine | Past 36 months | NIC-02 | traced | approved | 0 of 1 | split_source_compound | — | — |
| SRC-042 | 3 | nicotine | Past 12 months | NIC-01, NIC-04 | traced | approved, approved | 0 of 2 | split_source_compound, wording_changed | branching: SRC-042 asks for the date last used only when the 12-month answer is No. This row also asks after an unsure answer, so an uncertain customer is not left without a last-use date. | — |
| SRC-043 | 3 | alcohol | Past 7 years | ALC-02 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-044 | 4 | alcohol | Past 5 years | ALC-04 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-045 | 4 | alcohol | Past 10 years | ALC-05 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-046 | 4 | alcohol | None stated | ALC-06 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-047 | 4 | alcohol | Ever / DWI or DUI within the last three years | ALC-03 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-048 | 4 | aviation | Past 12 months | AVI-01 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-049 | 4 | aviation | Past 24 months | AVI-02 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-050 | 4 | aviation | Next 2 years | AVI-04 | traced | approved | 0 of 1 | timeframe_changed | timeframe: Source asks about flying within the next two years; the bank asks about the next 12 months.; wording: Source asks whether the type of flying will differ from past flying; the bank does not. | — |
| SRC-051 | 4 | aviation | Current | AVI-02 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-052 | 4 | aviation | Ever | AVI-03 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-053 | 4 | aviation | None stated | AVI-02 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-054 | 4 | aviation | None stated | AVI-02 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-055 | 4 | avocations | Past 2 years / next 2 years intended | AVO-01 | traced | approved | 0 of 1 | timeframe_changed | timeframe: Source asks about the past 2 years and the next 2 years intended; the bank asks about the past 5 years.; wording: The bank omits parachuting, hang gliding, rodeo events and professional sport, and adds 'another hazardous activity'.; branching: There is no 'intend to take part in the next 2 years' dimension, so planned participation never opens a branch. | — |
| SRC-056 | 4 | avocations | None stated | AVO-02 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-057 | 4 | avocations | None stated | AVO-02 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-058 | 4 | avocations | None stated | AVO-02 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-059 | 4 | avocations | None stated | — | out_of_scope | — | 0 | — | — | out_of_scope |
| SRC-060 | 4 | avocations | None stated | AVO-06 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-061 | 4 | avocations | Ever / next 2 years intended | AVO-03 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-062 | 5 | avocations | None stated | — | out_of_scope | — | 0 | — | — | out_of_scope |
| SRC-063 | 5 | avocations | None stated | AVO-03 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-064 | 5 | avocations | None stated | — | out_of_scope | — | 0 | — | — | out_of_scope |
| SRC-065 | 5 | avocations | None stated | AVO-04 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-066 | 5 | avocations | Past 12 months / next 12 months | AVO-04 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-067 | 5 | avocations | None stated | — | out_of_scope | — | 0 | — | — | out_of_scope |
| SRC-068 | 5 | avocations | None stated | — | out_of_scope | — | 0 | — | — | out_of_scope |
| SRC-069 | 5 | avocations | None stated | AVO-07 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-070 | 5 | avocations | None stated | — | out_of_scope | — | 0 | — | — | out_of_scope |
| SRC-071 | 5 | driving | Current | DRV-06 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-072 | 5 | driving | Past 24 months | DRV-01 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-073 | 5 | driving | Past 5 years | DRV-02 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-074 | 5 | driving | Past 5 years | DRV-07 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-075 | 5 | driving | Past 5 years | DRV-03 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-076 | 5 | driving | Past 5 years | DRV-04 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-077 | 5 | driving | Ever | DRV-05 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-078 | 5 | criminal | Past 6 months | CRM-05 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-079 | 5 | criminal | Past 7 years | CRM-02 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-080 | 5 | criminal | Past 10 years | CRM-03 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-081 | 5 | criminal | Past 10 years | CRM-06 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-082 | 6 | criminal | Currently | CRM-07 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-083 | 6 | criminal | Past 5 years | CRM-04 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-084 | 6 | criminal | Ever | CRM-01 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-085 | 6 | bankruptcy | Ever | FIN-01 | traced | approved | 0 of 1 | wording_changed | wording: Source asks 'Have you or your spouse filed bankruptcy before?'; the bank asks about the customer or a business they owned, and omits the spouse.; branching: The source's immediate 'If so, what type?' follow-up is split into a separate supplemental row. | — |
| SRC-086 | 6 | bankruptcy | None stated | FIN-02 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-087 | 6 | bankruptcy | None stated | FIN-02 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-088 | 6 | bankruptcy | None stated | FIN-03 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-089 | 6 | bankruptcy | Current | FIN-02 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-090 | 6 | drugs | Past 2 years | DRG-01 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-091 | 6 | drugs | Past 5 years | DRG-02 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-092 | 6 | drugs | Ever | DRG-04 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-093 | 6 | drugs | Past 7 years | DRG-05 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-094 | 6 | drugs | Last 24 months | DRG-03 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-095 | 6 | drugs | Past 10 years | DRG-06 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-096 | 6 | drugs | None stated | DRG-07 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-097 | 6 | residency | Current | RES-01, RES-05 | traced | approved, human_review_required | 0 of 2 | wording_changed, held_for_review | wording: Source asks citizen or permanent resident and then requests a visa or green-card number. The bank adds 'another status' and 'prefer not to answer', and the number is held separately as RES-05.; branching: The source's visa or green-card follow-up has no approved branch; it is held, not asked. | — |
| SRC-098 | 6 | residency | Current | RES-04 | traced | human_review_required | 0 of 1 | held_for_review | — | — |
| SRC-099 | 7 | residency | Next 2 years | RES-03 | traced | approved | 0 of 1 | timeframe_changed | timeframe: Source windows are the next 2 years / next 24 months; the bank asks about the next 12 months.; wording: The named-country list, the 30-day trip threshold and the 180-day residence threshold are all absent, as is the source's 'where?' follow-up. | — |
| SRC-100 | 7 | residency | Next 24 months | RES-03 | traced | approved | 0 of 1 | timeframe_changed | timeframe: Source windows are the next 2 years / next 24 months; the bank asks about the next 12 months.; wording: The named-country list, the 30-day trip threshold and the 180-day residence threshold are all absent, as is the source's 'where?' follow-up. | — |
| SRC-101 | 7 | residency | Past 5 years | RES-02 | traced | approved | 0 of 1 | timeframe_changed | timeframe: Source asks whether the insured lived consistently in the USA for 5 years, and separately asks for travel details in the last 2 years. The bank asks about living outside the USA for a month or more in the last 5 years, which is neither question.; wording: The 'consistently in the USA' test and the travel-detail request (dates, regions, reason, frequency, duration) are not asked. | — |
| SRC-102 | 7 | residency | None stated | RES-06 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-103 | 7 | residency | Past 2 years | RES-02 | traced | approved | 0 of 1 | timeframe_changed | timeframe: Source asks whether the insured lived consistently in the USA for 5 years, and separately asks for travel details in the last 2 years. The bank asks about living outside the USA for a month or more in the last 5 years, which is neither question.; wording: The 'consistently in the USA' test and the travel-detail request (dates, regions, reason, frequency, duration) are not asked. | — |
| SRC-104 | 7 | occupation | Current | OCC-01 | traced | approved | 0 of 1 | wording_changed | wording: SRC-106 asks whether you work full time (minimum 30 hours) and have done so for the past six months. The bank asks for typical hours per week and drops the 30-hour and six-month test.; branching: Three source questions (occupation, salary, full-time history) are merged into one compound without confirming each component. | — |
| SRC-105 | 7 | occupation | Current | OCC-01 | traced | approved | 0 of 1 | wording_changed | wording: SRC-106 asks whether you work full time (minimum 30 hours) and have done so for the past six months. The bank asks for typical hours per week and drops the 30-hour and six-month test.; branching: Three source questions (occupation, salary, full-time history) are merged into one compound without confirming each component. | — |
| SRC-106 | 7 | occupation | Past 6 months | OCC-01 | traced | approved | 0 of 1 | wording_changed | wording: SRC-106 asks whether you work full time (minimum 30 hours) and have done so for the past six months. The bank asks for typical hours per week and drops the 30-hour and six-month test.; branching: Three source questions (occupation, salary, full-time history) are merged into one compound without confirming each component. | — |
| SRC-107 | 7 | occupation | Current | OCC-02 | traced | approved | 0 of 1 | wording_changed | wording: SRC-107 asks whether you carry a weapon; SRC-108 asks whether you belong to a listed high-risk occupation. The bank asks a single generic hazard question and adds working at height.; omission: The source's occupation examples (explosives handlers, iron workers, underground miners, professional athletes, casino workers, firefighters) are not shown.; timeframe: The bank adds a 'right now' window; the source questions carry no stated window. | — |
| SRC-108 | 7 | occupation | Current | OCC-02 | traced | approved | 0 of 1 | wording_changed | wording: SRC-107 asks whether you carry a weapon; SRC-108 asks whether you belong to a listed high-risk occupation. The bank asks a single generic hazard question and adds working at height.; omission: The source's occupation examples (explosives handlers, iron workers, underground miners, professional athletes, casino workers, firefighters) are not shown.; timeframe: The bank adds a 'right now' window; the source questions carry no stated window. | — |
| SRC-109 | 7 | military | Current | MIL-01 | traced | approved | 0 of 1 | timeframe_changed | timeframe: Source asks whether you are on active duty now. The bank asks whether you have ever served, which is a different population and a different window.; branching: Every military follow-up depends on this answer, so the incorrect frame changes which branches open. | — |
| SRC-110 | 7 | military | Current / planned | MIL-03 | traced | approved | 0 of 1 | timeframe_changed | timeframe: Source asks about current deployment or orders to deploy, with no 12-month lookback. The bank asks about the past 12 months.; wording: The named countries and the 'orders to deploy' limb are not asked.; branching: The row branches on MIL-01's 'ever served' answer rather than on current active duty. | — |
| SRC-111 | 7 | military | None stated | MIL-02 | partly_collected | approved | 0 of 1 | — | — | merge_into |
| SRC-112 | 7 | military | None stated | MIL-04 | traced | approved | 0 of 1 | matches_source | — | — |
| SRC-113 | 7 | military | None stated | MIL-02 | partly_collected | approved | 0 of 1 | — | — | merge_into |

### Source text and gap reasons (113)

#### SRC-001 — medical, page 1

- **Source timeframe:** None stated
- **Source text:** What is your Date of Birth, Age, and State of Birth?
- **Mapped bank row(s):** ID-01, ID-02
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-002 — medical, page 1

- **Source timeframe:** None stated
- **Source text:** What is your Gender/Sex?
- **Mapped bank row(s):** ID-04
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-003 — medical, page 1

- **Source timeframe:** Past 12 months
- **Source text:** Within the past 12 months, have you had surgical treatment for morbid obesity, or been declined for life insurance coverage, or had any diagnostic testing (excluding AIDS/HIV tests), surgery, or hospitalization recommended by a medical professional which has not been completed or for which the results have not been received?
- **Mapped bank row(s):** MED-01
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-004 — medical, page 1

- **Source timeframe:** Past 12 months
- **Source text:** Within the past 12 months, have you consulted a medical professional, had surgery, or been hospitalized, or had diagnostic tests (excluding HIV/AIDS) such as EKG, X-ray, MRI, or CAT scan?
- **Mapped bank row(s):** MED-02
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-005 — medical, page 1

- **Source timeframe:** Past 2 years
- **Source text:** Within the past 2 years, have you been medically diagnosed or treated for angina (chest pain), stroke or TIA, cardiomyopathy, systemic lupus (SLE), cirrhosis, Hepatitis C, chronic hepatitis, chronic pancreatitis, chronic obstructive pulmonary disease (COPD), emphysema, chronic bronchitis, or required oxygen equipment to assist in breathing?
- **Mapped bank row(s):** MED-03
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-006 — medical, page 1

- **Source timeframe:** Past 2 years
- **Source text:** Within the past 2 years, have you had a heart attack or aneurysm, or had or been medically advised to have any type of heart, brain or circulatory surgery (including, but not limited to a pacemaker insertion, defibrillator placement), or any procedure to improve circulation?
- **Mapped bank row(s):** MED-04
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-007 — medical, page 1

- **Source timeframe:** Past 3 years
- **Source text:** Within the past 3 years, have you been treated, diagnosed, or been prescribed medication by a medical professional for chronic bronchitis, emphysema, chronic obstructive pulmonary disease (COPD), irregular heart beat, seizures, blood clot, or aneurysm?
- **Mapped bank row(s):** MED-06
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-008 — medical, page 1

- **Source timeframe:** Past 5 years
- **Source text:** Within the past 5 years, have you been treated, diagnosed, or been prescribed medication by a medical professional for internal cancer, melanoma, Hodgkin's disease, or lymphoma?
- **Mapped bank row(s):** MED-08
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-009 — medical, page 1

- **Source timeframe:** Ever
- **Source text:** Have you ever been diagnosed, treated, tested positive for, or received medical advice for Human Immunodeficiency Virus (HIV) or Acquired Immune Deficiency Syndrome (AIDS)?
- **Mapped bank row(s):** MED-11
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-010 — medical, page 1

- **Source timeframe:** Past 5 years
- **Source text:** Within the past 5 years, have you had any check-ups, laboratory studies (excluding tests related to HIV), or other medical consultations?
- **Mapped bank row(s):** —
- **Coverage:** out_of_scope
- **Gap disposition / reason:** out_of_scope — A blanket five-year check-up, laboratory-study and consultation question would be answered Yes by almost every applicant and does not discriminate risk. MED-01 and MED-02 already ask about consultations and testing within the past 12 months, so the longer window adds burden without changing the review. Recorded out of scope deliberately.

#### SRC-011 — medical, page 1

- **Source timeframe:** Past 7 years
- **Source text:** Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for high blood pressure, heart attack, angina, arrhythmia, stroke, aneurysm, or any heart or circulatory disease or disorder?
- **Mapped bank row(s):** MED-12
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-012 — medical, page 1

- **Source timeframe:** Past 7 years
- **Source text:** Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for diabetes, cirrhosis, hepatitis, pancreatitis, Crohn's disease, ulcerative colitis, or any digestive or liver disease or disorder?
- **Mapped bank row(s):** MED-13
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-013 — medical, page 1

- **Source timeframe:** Past 7 years
- **Source text:** Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for asthma, emphysema, chronic obstructive pulmonary disease (COPD), sleep apnea, or any respiratory disease or disorder?
- **Mapped bank row(s):** MED-14
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-014 — medical, page 2

- **Source timeframe:** Last 6 months (within an 'ever' diagnosis)
- **Source text:** Have you ever been diagnosed with Sleep Apnea within the last 6 months, or for which you are not being treated?
- **Mapped bank row(s):** MED-20
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-015 — medical, page 2

- **Source timeframe:** Past 7 years
- **Source text:** Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for cancer in any form, anemia, any seizures, bipolar disorder, schizophrenia, Alzheimer's, dementia, or mental or nervous disorder?
- **Mapped bank row(s):** MED-15, MH-01
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-016 — medical, page 2

- **Source timeframe:** Past 7 years
- **Source text:** Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for any disease or disorder of the kidneys, urinary bladder, prostate, reproductive organs, or sexually transmitted disease?
- **Mapped bank row(s):** MED-16
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-017 — medical, page 2

- **Source timeframe:** Past 7 years
- **Source text:** Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for connective tissue disease, systemic lupus (SLE), arthritis, or any disorder of the back, joints, muscles, or nervous system?
- **Mapped bank row(s):** MED-17
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-018 — medical, page 2

- **Source timeframe:** Past 10 years
- **Source text:** In the past 10 years, have you taken medication to treat high blood pressure or an elevated cholesterol level?
- **Mapped bank row(s):** MED-18
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-019 — medical, page 2

- **Source timeframe:** Past 10 years
- **Source text:** In the past 10 years, have you been medically diagnosed, tested, or received treatment for diabetes, cancer, or cardiac disease (heart attack, myocardial infarct, angina, cardiac insufficiency, cerebral thrombosis, or coronary artery disease)?
- **Mapped bank row(s):** MED-19
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-020 — medical, page 2

- **Source timeframe:** None stated
- **Source text:** Have you been treated, diagnosed, or been prescribed medication by a medical professional for diabetes prior to age 21, or do you currently take insulin shots, or been diagnosed with diabetes combined with a medical history of any of the following: retinopathy, nephropathy, neuropathy, insulin shock, or diabetic coma?
- **Mapped bank row(s):** MED-21
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-021 — medical, page 2

- **Source timeframe:** Currently
- **Source text:** Are you currently unemployed due to medical reasons, or been prohibited from actively working full time (30 hours or more per week) at your regular occupation due to any illness, injury, or health-related problem, or are you currently receiving benefits, compensation, or pension for disability?
- **Mapped bank row(s):** MED-10
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-022 — medical, page 2

- **Source timeframe:** Currently
- **Source text:** Are you currently hospitalized, confined to a nursing facility, receiving Hospice Care or home health care, or do you require assistance (from anyone) with activities of daily living such as bathing, dressing, eating or toileting?
- **Mapped bank row(s):** MED-10
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-023 — medical, page 2

- **Source timeframe:** Past 12 months
- **Source text:** Within the past 12 months, have you used a walker, wheelchair, electric scooter, supplemental oxygen, or catheter?
- **Mapped bank row(s):** MED-22
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-024 — medical, page 2

- **Source timeframe:** Ever
- **Source text:** Have you been the recipient of an organ transplant?
- **Mapped bank row(s):** MED-23
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-025 — medical, page 2

- **Source timeframe:** Currently
- **Source text:** Are you at the time of this application confined to any hospital or other medical or rehabilitation facility?
- **Mapped bank row(s):** MED-24
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-026 — medical, page 2

- **Source timeframe:** Ever before age 60
- **Source text:** Has the natural parent, brother, or sister of the proposed insured ever had kidney disease, required a major organ transplant, or been diagnosed with heart disease, cerebrovascular disease, or internal cancer prior to age 60?
- **Mapped bank row(s):** MED-25
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-027 — medical, page 2

- **Source timeframe:** Ever before age 60
- **Source text:** Has more than one member of your family (father, mother, brother, or sister) died before age 60 from breast, colon, intestinal, or prostate cancer, or from cardiovascular disease (heart attack, myocardial infarct, angina, cardiac insufficiency, cerebral thrombosis, or coronary artery disease)?
- **Mapped bank row(s):** MED-26
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-028 — medical, page 2

- **Source timeframe:** None stated
- **Source text:** What specific treatment was given or medication prescribed for your conditions?
- **Mapped bank row(s):** MED-01
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — The treatment or medication given for a disclosed condition is only partly collected through MED-01's free-text prompt and is not tied to each condition row.

#### SRC-029 — medical, page 3

- **Source timeframe:** Current
- **Source text:** What are all your current medications, including herb and vitamin supplements?
- **Mapped bank row(s):** MED-09
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-030 — mental, page 3

- **Source timeframe:** None stated
- **Source text:** Do you have any history of or current treatment for psychological, mood, or anxiety disorders?
- **Mapped bank row(s):** MH-01
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-031 — mental, page 3

- **Source timeframe:** None stated
- **Source text:** What mental health, nervous, or psychiatric conditions apply to you (e.g., situational anxiety, adjustment disorder, panic disorder, depression, major depression, schizophrenia, bipolar I or II, ADHD/ADD, eating disorder, mental retardation, PTSD, Tourette's syndrome, suicide attempt/ideation, OCD, autism)?
- **Mapped bank row(s):** MH-01
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-032 — mental, page 3

- **Source timeframe:** Last 6 months
- **Source text:** Have you been diagnosed with Mild or Situational Depression or Anxiety within the last 6 months, or been hospitalized for it?
- **Mapped bank row(s):** —
- **Coverage:** out_of_scope
- **Gap disposition / reason:** out_of_scope — Mild or situational depression or anxiety within six months is already captured by MH-01 (ever diagnosed or treated) and by MH-02 (inpatient care as a treatment type). A second, more sensitive six-month question would add burden without changing routing. Recorded out of scope deliberately.

#### SRC-033 — mental, page 3

- **Source timeframe:** Current
- **Source text:** What are the details of your current prescription medications for this condition (names, dosage, frequency)?
- **Mapped bank row(s):** —
- **Coverage:** out_of_scope
- **Gap disposition / reason:** out_of_scope — Current prescription names, dosage and frequency are already collected by the general medication question MED-09. Asking again only for mental-health medication would duplicate it and single out a sensitive condition. Recorded out of scope deliberately.

#### SRC-034 — mental, page 3

- **Source timeframe:** None stated
- **Source text:** When was the condition diagnosed, and when were you last seen for it?
- **Mapped bank row(s):** MH-02
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — Diagnosis year is collected, but the date last seen is not.

#### SRC-035 — mental, page 3

- **Source timeframe:** Past 5 years
- **Source text:** Within the past 5 years, have you seen a psychiatrist or had treatment as a hospital outpatient?
- **Mapped bank row(s):** MH-07
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-036 — mental, page 3

- **Source timeframe:** Past 5 years
- **Source text:** Within the past 5 years, have you been an in-patient at a hospital or clinic?
- **Mapped bank row(s):** MH-02
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — In-patient care is offered as a treatment-type option, but the source's 5-year window is not recorded.

#### SRC-037 — mental, page 3

- **Source timeframe:** Past 5 years
- **Source text:** Within the past 5 years, have you been unable to work due to your condition?
- **Mapped bank row(s):** MED-10, MH-03
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-038 — mental, page 3

- **Source timeframe:** None stated
- **Source text:** Have you had any suicidal thoughts?
- **Mapped bank row(s):** MH-04
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-039 — mental, page 3

- **Source timeframe:** None stated
- **Source text:** Have you attempted suicide? (If yes, provide details, including date and follow-up treatment).
- **Mapped bank row(s):** MH-04, MH-06
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-040 — nicotine, page 3

- **Source timeframe:** Past 12 months, 3 years, or 5 years (three windows in one question)
- **Source text:** Has the proposed insured used nicotine, tobacco, vape, or e-cigarettes within the past 12 months, 3 years, or 5 years? (excluding occasional cigar or pipe use)? (Note: Tobacco in any form includes cigarettes, electronic cigarettes/e-cigs, chewing tobacco, cigars, pipes, snuff, nicotine patch, nicotine gum/aerosol/inhaler, Hookah pipe, clove, bidis cigarettes, or oral nicotine pouches.)
- **Mapped bank row(s):** NIC-01, NIC-02, NIC-03
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-041 — nicotine, page 3

- **Source timeframe:** Past 36 months
- **Source text:** During the past 36 months, have you used tobacco or nicotine products in any form (excluding occasional cigar or pipe use)?
- **Mapped bank row(s):** NIC-02
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-042 — nicotine, page 3

- **Source timeframe:** Past 12 months
- **Source text:** Have you used tobacco or any nicotine products in any form within the past twelve (12) months? (If Yes, type and amount, if No, date last used.)
- **Mapped bank row(s):** NIC-01, NIC-04
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-043 — alcohol, page 3

- **Source timeframe:** Past 7 years
- **Source text:** Within the past 7 years, have you abused alcohol or had, or been recommended to have, treatment or counseling for alcohol use, or been advised to discontinue use of alcohol?
- **Mapped bank row(s):** ALC-02
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-044 — alcohol, page 4

- **Source timeframe:** Past 5 years
- **Source text:** Within the past 5 years, have you abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or to have treatment or counseling for alcohol?
- **Mapped bank row(s):** ALC-04
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-045 — alcohol, page 4

- **Source timeframe:** Past 10 years
- **Source text:** In the past 10 years, have you been treated for alcohol abuse?
- **Mapped bank row(s):** ALC-05
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-046 — alcohol, page 4

- **Source timeframe:** None stated
- **Source text:** Do you have any history of alcohol abuse, misuse, treatment, or counseling, or having been advised to discontinue the use of alcohol?
- **Mapped bank row(s):** ALC-06
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-047 — alcohol, page 4

- **Source timeframe:** Ever / DWI or DUI within the last three years
- **Source text:** Have you ever had any alcohol/drug related infractions? (Including a history of excessive use of alcohol, or admitted DWI or DUI within the last three years).
- **Mapped bank row(s):** ALC-03
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-048 — aviation, page 4

- **Source timeframe:** Past 12 months
- **Source text:** Within the past 12 months, have you made any flights as a pilot, student pilot, or crew member of any aircraft?
- **Mapped bank row(s):** AVI-01
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-049 — aviation, page 4

- **Source timeframe:** Past 24 months
- **Source text:** Within the past 24 months, have you made or contemplated making any flights as a pilot, student pilot, or crew member of any aircraft?
- **Mapped bank row(s):** AVI-02
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-050 — aviation, page 4

- **Source timeframe:** Next 2 years
- **Source text:** Do you expect to fly in the future within the next two years? (If Yes, indicate whether the type of flying will differ from past flying and provide details).
- **Mapped bank row(s):** AVI-04
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-051 — aviation, page 4

- **Source timeframe:** Current
- **Source text:** What type of certificate or license do you have now (Student, Private, Commercial, ATP, Other)?
- **Mapped bank row(s):** AVI-02
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — Certificate or rating is collected as a free-text field, without the source's Student/Private/Commercial/ATP options.

#### SRC-052 — aviation, page 4

- **Source timeframe:** Ever
- **Source text:** Have you ever had an aircraft accident, been grounded, fined or reprimanded for violation of air regulations?
- **Mapped bank row(s):** AVI-03
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — An optional field in the aviation detail step asks about accidents, groundings, fines and reprimands, but it is asked only after a Yes to the 24-month flight question and the categories are not distinguished.

#### SRC-053 — aviation, page 4

- **Source timeframe:** None stated
- **Source text:** Provide the total of all hours flown as: (a) pilot (b) crew member, and a complete schedule of flying time (Commercial, Company-owned, Student Instruction, Pleasure, Military Combat/Non-Combat, etc.).
- **Mapped bank row(s):** AVI-02
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — Total flying hours are collected, but not separately as pilot and crew, and the complete schedule of flying time is not captured.

#### SRC-054 — aviation, page 4

- **Source timeframe:** None stated
- **Source text:** Provide details of any other flying not specifically classified above (i.e. crop dusting, mapping, surveying, testing) and type of aircraft flown (i.e. glider, helicopter, lighter-than-air).
- **Mapped bank row(s):** AVI-02
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — Aircraft types are collected, but other flying (crop dusting, mapping, surveying, testing) is not.

#### SRC-055 — avocations, page 4

- **Source timeframe:** Past 2 years / next 2 years intended
- **Source text:** Within the past 2 years (or next 2 years intend to participate), have you participated in parachuting, hang gliding, rock or mountain climbing, rodeo events, sky diving, skin or scuba diving, organized racing of any kind, or any professional sport?
- **Mapped bank row(s):** AVO-01
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-056 — avocations, page 4

- **Source timeframe:** None stated
- **Source text:** For how many years have you been climbing regularly, and how often do you climb?
- **Mapped bank row(s):** AVO-02
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — Climbing frequency is collected, but the number of years climbing regularly is not.

#### SRC-057 — avocations, page 4

- **Source timeframe:** None stated
- **Source text:** Do you climb in any of the following areas: North America (Mt McKinley or elsewhere), Europe (Alps), Africa, Himalayas/Karakoram, or other areas?
- **Mapped bank row(s):** AVO-02
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — A free-text location field exists, but the source's named regions (Alaska, Alps, Africa, Himalayas) are not offered.

#### SRC-058 — avocations, page 4

- **Source timeframe:** None stated
- **Source text:** What is the nature of your climbing: Type of terrain (rock, snow/ice, artificial), degree of difficulty (easy, moderate, difficult, severe, technical grade), maximum height climbed to, and season(s) of the year?
- **Mapped bank row(s):** AVO-02
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — Climbing type is collected, but terrain, difficulty grade, maximum height and season are not.

#### SRC-059 — avocations, page 4

- **Source timeframe:** None stated
- **Source text:** What proportion of your climbing is on routes protected by climbing bolts?
- **Mapped bank row(s):** —
- **Coverage:** out_of_scope
- **Gap disposition / reason:** out_of_scope — The proportion of climbing on bolted routes is supporting detail. AVO-02 already records climbing type, frequency and location, and AVO-06 asks about solo or unroped climbing, which is the risk the bolt proportion would otherwise stand in for. Recorded out of scope deliberately.

#### SRC-060 — avocations, page 4

- **Source timeframe:** None stated
- **Source text:** Do you ever climb alone or without a rope? (If Yes, state how often, the location, and degree of difficulty).
- **Mapped bank row(s):** AVO-06
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-061 — avocations, page 4

- **Source timeframe:** Ever / next 2 years intended
- **Source text:** Have you engaged in, or do you within the next 2 years intend on engaging in, any of following forms of racing: Automobile or Hydroplane?
- **Mapped bank row(s):** AVO-03
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — Racing is collected as an activity and a free-text type, but automobile versus hydroplane and intended participation in the next 2 years are not distinguished.

#### SRC-062 — avocations, page 5

- **Source timeframe:** None stated
- **Source text:** Over what type of track do you race? (e.g., oval, simulated road).
- **Mapped bank row(s):** —
- **Coverage:** out_of_scope
- **Gap disposition / reason:** out_of_scope — Track configuration is supporting detail behind the racing question. AVO-03 already records what the customer races, the level and the number of events a year. Recorded out of scope deliberately.

#### SRC-063 — avocations, page 5

- **Source timeframe:** None stated
- **Source text:** Do you race professionally or for cash prizes?
- **Mapped bank row(s):** AVO-03
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — A professional amateurs-to-professional level field exists, but racing for cash prizes is not asked.

#### SRC-064 — avocations, page 5

- **Source timeframe:** None stated
- **Source text:** Provide the date of your last race.
- **Mapped bank row(s):** —
- **Coverage:** out_of_scope
- **Gap disposition / reason:** out_of_scope — The date of the last race is recency detail. AVO-03 records events per year, which is the frequency the review uses. Recorded out of scope deliberately.

#### SRC-065 — avocations, page 5

- **Source timeframe:** None stated
- **Source text:** Are you a certified skin/scuba diver? (If Yes, provide hours of instruction and date of certification. If No, why?)
- **Mapped bank row(s):** AVO-04
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — A certification level is collected, but hours of instruction, date of certification and the reason for not being certified are not.

#### SRC-066 — avocations, page 5

- **Source timeframe:** Past 12 months / next 12 months
- **Source text:** What is the maximum depth obtained on your dives? (Specify Pleasure or Commercial, number of dives, and average time underwater for less than 40ft, 40-60ft, 60-100ft, and 100+ ft in the last 12 months and contemplated next 12 months).
- **Mapped bank row(s):** AVO-04
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — Maximum depth is collected as one free-text field. Dive count, average time underwater in the 40/60/100+ ft bands, and the last and next 12 months are not.

#### SRC-067 — avocations, page 5

- **Source timeframe:** None stated
- **Source text:** What types of equipment do you use? (Scuba, number of tanks, type of air supply, wet suit, others).
- **Mapped bank row(s):** —
- **Coverage:** out_of_scope
- **Gap disposition / reason:** out_of_scope — Diving equipment is supporting detail. AVO-04 records diving type, certification level, maximum depth and dives per year. Recorded out of scope deliberately.

#### SRC-068 — avocations, page 5

- **Source timeframe:** None stated
- **Source text:** What are the locations of your diving activities? (Lakes and Rivers, Ocean Beaches, Deep Sea, Bays and Inlets, or Others).
- **Mapped bank row(s):** —
- **Coverage:** out_of_scope
- **Gap disposition / reason:** out_of_scope — Dive locations and water types are supporting detail behind the depth and diving-type answers already collected in AVO-04. Recorded out of scope deliberately.

#### SRC-069 — avocations, page 5

- **Source timeframe:** None stated
- **Source text:** Do you dive for salvage or exploration?
- **Mapped bank row(s):** AVO-07
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-070 — avocations, page 5

- **Source timeframe:** None stated
- **Source text:** Are you a member of an organized club for your climbing or diving activities?
- **Mapped bank row(s):** —
- **Coverage:** out_of_scope
- **Gap disposition / reason:** out_of_scope — Membership of an organised climbing or diving club has no underwriting weight on its own; the activity, level and frequency are already collected. Recorded out of scope deliberately.

#### SRC-071 — driving, page 5

- **Source timeframe:** Current
- **Source text:** Do you currently have a valid driver's license?
- **Mapped bank row(s):** DRV-06
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-072 — driving, page 5

- **Source timeframe:** Past 24 months
- **Source text:** Within the past 24 months, have you had your driver's license suspended or revoked, or been convicted of driving under the influence of alcohol or drugs?
- **Mapped bank row(s):** DRV-01
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-073 — driving, page 5

- **Source timeframe:** Past 5 years
- **Source text:** Within the past 5 years, have you had a driver's license suspended or revoked, or is your driver's license currently suspended or revoked?
- **Mapped bank row(s):** DRV-02
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-074 — driving, page 5

- **Source timeframe:** Past 5 years
- **Source text:** Within the past 5 years, have you pled guilty to or been convicted of any moving violations?
- **Mapped bank row(s):** DRV-07
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-075 — driving, page 5

- **Source timeframe:** Past 5 years
- **Source text:** Within the past 5 years, have you been convicted of careless or reckless driving?
- **Mapped bank row(s):** DRV-03
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-076 — driving, page 5

- **Source timeframe:** Past 5 years
- **Source text:** In the past 5 years, have you had more than two moving motor vehicle violations or any alcohol/drug related infractions?
- **Mapped bank row(s):** DRV-04
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-077 — driving, page 5

- **Source timeframe:** Ever
- **Source text:** Have you ever had any motor vehicle accidents? (If yes, provide details, including fault).
- **Mapped bank row(s):** DRV-05
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-078 — criminal, page 5

- **Source timeframe:** Past 6 months
- **Source text:** Within the past 6 months, have you served or been released from incarceration, probation, parole, or other court-ordered supervision for a misdemeanor or felony conviction?
- **Mapped bank row(s):** CRM-05
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-079 — criminal, page 5

- **Source timeframe:** Past 7 years
- **Source text:** Within the past 7 years, have you been convicted of, pleaded guilty to, or entered a plea of no contest to any felony?
- **Mapped bank row(s):** CRM-02
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-080 — criminal, page 5

- **Source timeframe:** Past 10 years
- **Source text:** In the past 10 years, have you been convicted of, pled guilty to, or are you currently awaiting trial for a felony?
- **Mapped bank row(s):** CRM-03
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-081 — criminal, page 5

- **Source timeframe:** Past 10 years
- **Source text:** In the past 10 years, have you served or been released from incarceration, probation, parole, or other court-ordered supervision for a misdemeanor or felony conviction?
- **Mapped bank row(s):** CRM-06
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-082 — criminal, page 6

- **Source timeframe:** Currently
- **Source text:** Are you currently under an order for probation, parole, or other court-ordered supervision for a misdemeanor or felony conviction?
- **Mapped bank row(s):** CRM-07
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-083 — criminal, page 6

- **Source timeframe:** Past 5 years
- **Source text:** Within the past 5 years, have you pled guilty to or been convicted of a felony or misdemeanor (including DUI or DWI) or do you have such a charge currently pending against you?
- **Mapped bank row(s):** CRM-04
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-084 — criminal, page 6

- **Source timeframe:** Ever
- **Source text:** Have you ever pled guilty to, or been convicted of, a felony or misdemeanor or have such a charge currently pending? (If Yes, please provide date of arrest, conviction, and any jail time, probation or parole).
- **Mapped bank row(s):** CRM-01
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-085 — bankruptcy, page 6

- **Source timeframe:** Ever
- **Source text:** Have you or your spouse filed bankruptcy before? If so, what type?
- **Mapped bank row(s):** FIN-01
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-086 — bankruptcy, page 6

- **Source timeframe:** None stated
- **Source text:** If Chapter 7, was this personal or business?
- **Mapped bank row(s):** FIN-02
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — Personal or business filing is collected, but the source's 'if Chapter 7' condition is not.

#### SRC-087 — bankruptcy, page 6

- **Source timeframe:** None stated
- **Source text:** Has this bankruptcy been discharged?
- **Mapped bank row(s):** FIN-02
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — Discharge status is collected as one option among several, without a dedicated yes/no.

#### SRC-088 — bankruptcy, page 6

- **Source timeframe:** None stated
- **Source text:** What was the date or anticipated date of discharge?
- **Mapped bank row(s):** FIN-03
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-089 — bankruptcy, page 6

- **Source timeframe:** Current
- **Source text:** Is this bankruptcy still in process?
- **Mapped bank row(s):** FIN-02
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — A still-pending option exists, but the source asks whether the bankruptcy is still in process as its own question.

#### SRC-090 — drugs, page 6

- **Source timeframe:** Past 2 years
- **Source text:** Within the past 2 years, have you used illegal drugs, abused alcohol or drugs, had or been recommended by a medical professional to have treatment or counseling for alcohol or drug use, or been advised to discontinue the use of alcohol or drugs?
- **Mapped bank row(s):** DRG-01
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-091 — drugs, page 6

- **Source timeframe:** Past 5 years
- **Source text:** Within the past 5 years, have you used illegal drugs or abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or drugs, or to have treatment or counseling for alcohol or drugs?
- **Mapped bank row(s):** DRG-02
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-092 — drugs, page 6

- **Source timeframe:** Ever
- **Source text:** Have you ever used heroin, morphine, other narcotics, marijuana, cocaine, barbiturates, amphetamines, hallucinogenic drugs, or other habit-forming drugs except as prescribed by a physician?
- **Mapped bank row(s):** DRG-04
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-093 — drugs, page 6

- **Source timeframe:** Past 7 years
- **Source text:** Within the past 7 years, have you been advised by a medical professional to have treatment for, or reduce/discontinue the intake of prescription drugs?
- **Mapped bank row(s):** DRG-05
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-094 — drugs, page 6

- **Source timeframe:** Last 24 months
- **Source text:** During the last 24 months, have you smoked marijuana for recreational purposes?
- **Mapped bank row(s):** DRG-03
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-095 — drugs, page 6

- **Source timeframe:** Past 10 years
- **Source text:** In the past 10 years, have you been treated for drug abuse or used any drugs not prescribed to you?
- **Mapped bank row(s):** DRG-06
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-096 — drugs, page 6

- **Source timeframe:** None stated
- **Source text:** Do you have any history of or current treatment for drug abuse?
- **Mapped bank row(s):** DRG-07
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-097 — residency, page 6

- **Source timeframe:** Current
- **Source text:** Is the Proposed Insured a U.S. Citizen or Permanent Resident? (If Permanent Resident, provide Visa or Green Card ID Number).
- **Mapped bank row(s):** RES-01, RES-05
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-098 — residency, page 6

- **Source timeframe:** Current
- **Source text:** If not a U.S. citizen, what is their immigration status or visa type?
- **Mapped bank row(s):** RES-04
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-099 — residency, page 7

- **Source timeframe:** Next 2 years
- **Source text:** Within the next 2 years, do you intend to work, travel, or reside in Saudi Arabia, Iraq, Afghanistan, Syria, Somalia, Sudan, or Yemen for more than 30 days, or reside outside the United States at any location more than 180 days?
- **Mapped bank row(s):** RES-03
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-100 — residency, page 7

- **Source timeframe:** Next 24 months
- **Source text:** Within the next 24 months, do you intend to work, travel, or reside outside of the U.S. for more than 30 days? (If yes, where?)
- **Mapped bank row(s):** RES-03
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-101 — residency, page 7

- **Source timeframe:** Past 5 years
- **Source text:** Has the Proposed Insured lived consistently in the USA for the past 5 years?
- **Mapped bank row(s):** RES-02
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-102 — residency, page 7

- **Source timeframe:** None stated
- **Source text:** Does the Proposed Insured plan to move back to their native country?
- **Mapped bank row(s):** RES-06
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-103 — residency, page 7

- **Source timeframe:** Past 2 years
- **Source text:** What are the details of your previous and future foreign travel/residence, including pleasure and short business trips within the last 2 years? (Provide dates of visits, countries, regions, reason for visits, frequency, and duration of visits).
- **Mapped bank row(s):** RES-02
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-104 — occupation, page 7

- **Source timeframe:** Current
- **Source text:** What is your current occupation?
- **Mapped bank row(s):** OCC-01
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-105 — occupation, page 7

- **Source timeframe:** Current
- **Source text:** What is your annual salary?
- **Mapped bank row(s):** OCC-01
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-106 — occupation, page 7

- **Source timeframe:** Past 6 months
- **Source text:** Are you currently working full-time (minimum 30 hours a week), and have you done so for the past six months?
- **Mapped bank row(s):** OCC-01
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-107 — occupation, page 7

- **Source timeframe:** Current
- **Source text:** Do you carry a weapon in your occupation?
- **Mapped bank row(s):** OCC-02
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-108 — occupation, page 7

- **Source timeframe:** Current
- **Source text:** Are you a member of any high-risk occupations (e.g., blasters & explosives handlers, structural workers/iron workers, underground miners, professional athletes, casino workers, firefighters, etc.)?
- **Mapped bank row(s):** OCC-02
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-109 — military, page 7

- **Source timeframe:** Current
- **Source text:** Are you a member of the United States Military on active duty?
- **Mapped bank row(s):** MIL-01
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-110 — military, page 7

- **Source timeframe:** Current / planned
- **Source text:** If Yes, are you currently deployed or do you have orders to be deployed in Saudi Arabia, Iraq, Afghanistan, Syria, Somalia, Sudan, or Yemen?
- **Mapped bank row(s):** MIL-03
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-111 — military, page 7

- **Source timeframe:** None stated
- **Source text:** Provide your complete schedule of flying time if you participate in military aviation.
- **Mapped bank row(s):** MIL-02
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — Approximate flying hours are collected, but not the complete schedule of military flying time.

#### SRC-112 — military, page 7

- **Source timeframe:** None stated
- **Source text:** Do you fly Combat Tactical/Recon, Combat Transport/Support/Supply, Non-Combat Recon, Non-Combat Transport, or for Proficiency only?
- **Mapped bank row(s):** MIL-04
- **Coverage:** traced
- **Gap disposition / reason:** — — —

#### SRC-113 — military, page 7

- **Source timeframe:** None stated
- **Source text:** Are you assigned duties aboard the aircraft?
- **Mapped bank row(s):** MIL-02
- **Coverage:** partly_collected
- **Gap disposition / reason:** merge_into — Role is collected as pilot, air crew or maintenance, which only partly answers 'assigned duties aboard the aircraft'.

## Bank-row matrix (92)

| ID | Section | Status | Review | sourceVerified | Timeframe | Verdict | Flags | Customer wording |
|---|---|---|---|---|---|---|---|---|
| ID-01 | identity | core | approved | false | — | wording_changed | wording: SRC-001 is one compound question (date of birth, age, state of birth). The bank collects date of birth only and does not confirm the split with the customer.; omission: Age and state of birth are not collected anywhere in the bank. | What is your date of birth? |
| ID-02 | identity | core | approved | false | — | wording_changed | wording: Source asks for state of birth; the bank asks for city and country. That widens the question beyond the source and duplicates one component of SRC-001. | Where were you born? |
| ID-03 | identity | supplemental | approved | false | — | not_in_source | attribution: Labelled a source question, but the PDF never asks for current state of residence. The specification asks for it separately for routing. Status corrected to supplemental. | Which state do you currently live in? |
| ID-04 | identity | core | human_review_required | false | — | held_for_review | wording: The source asks 'What is your Gender/Sex?'. No answer set or approved wording exists yet, so the row asks nothing. | Held for review: the source questionnaire asks for sex or gender. |
| MED-01 | medical | core | approved | false | Past 12 months | matches_source | — | In the past 12 months, have you had surgical treatment for morbid obesity, been declined for life insurance coverage, or had diagnostic testing (excluding HIV/AIDS tests), surgery or a hospital stay recommended by a medical professional that has not been completed or for which the results have not been received? |
| MED-02 | medical | core | approved | false | Past 12 months | matches_source | — | In the past 12 months, have you consulted a medical professional, had surgery or been hospitalized, or had diagnostic tests (excluding HIV/AIDS) such as an EKG, X-ray, MRI or CAT scan? |
| MED-03 | medical | core | approved | false | Past 2 years | matches_source | — | In the past 2 years, have you been medically diagnosed with or treated for angina (chest pain), a stroke or TIA, cardiomyopathy, systemic lupus (SLE), cirrhosis, hepatitis C or chronic hepatitis, chronic pancreatitis, chronic obstructive pulmonary disease (COPD), emphysema or chronic bronchitis, or have you required oxygen equipment to help you breathe? |
| MED-04 | medical | core | approved | false | Past 2 years | matches_source | — | In the past 2 years, have you had a heart attack or aneurysm, or had — or been medically advised to have — any type of heart, brain or circulatory surgery, including a pacemaker or defibrillator, or any procedure to improve circulation? |
| MED-06 | medical | core | approved | false | Past 3 years | matches_source | — | In the past 3 years, have you been treated for, diagnosed with, or prescribed medication for chronic bronchitis, emphysema, COPD, an irregular heartbeat, seizures, a blood clot or an aneurysm? |
| MED-08 | medical | core | approved | false | Past 5 years | matches_source | — | In the past 5 years, have you been treated for, diagnosed with, or prescribed medication for internal cancer, melanoma, Hodgkin's disease or lymphoma? |
| MED-12 | medical | core | approved | false | Past 7 years | matches_source | — | In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for high blood pressure, a heart attack, angina, an arrhythmia, a stroke, an aneurysm, or any heart or circulatory disease or disorder? |
| MED-13 | medical | core | approved | false | Past 7 years | matches_source | — | In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for diabetes, cirrhosis, hepatitis, pancreatitis, Crohn's disease, ulcerative colitis, or any digestive or liver disease or disorder? |
| MED-14 | medical | core | approved | false | Past 7 years | matches_source | — | In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for asthma, emphysema, COPD, sleep apnea, or any respiratory disease or disorder? |
| MED-20 | medical | core | approved | false | Last 6 months, or untreated | matches_source | — | Have you ever been diagnosed with sleep apnoea within the last 6 months, or with sleep apnoea that is not being treated? |
| MED-15 | medical | core | approved | false | Past 7 years | matches_source | — | In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for cancer in any form, anemia, seizures, bipolar disorder, schizophrenia, Alzheimer's, dementia, or a mental or nervous disorder? |
| MED-16 | medical | core | approved | false | Past 7 years | matches_source | — | In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for any disease or disorder of the kidneys, urinary bladder, prostate or reproductive organs, or a sexually transmitted disease? |
| MED-17 | medical | core | approved | false | Past 7 years | matches_source | — | In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for a connective tissue disease, systemic lupus (SLE), arthritis, or any disorder of the back, joints, muscles or nervous system? |
| MED-18 | medical | core | approved | false | Past 10 years | matches_source | — | In the past 10 years, have you taken medication to treat high blood pressure or an elevated cholesterol level? |
| MED-19 | medical | core | approved | false | Past 10 years | matches_source | — | In the past 10 years, have you been medically diagnosed with, tested for, or received treatment for diabetes, cancer, or cardiac disease (heart attack, myocardial infarction, angina, cardiac insufficiency, cerebral thrombosis or coronary artery disease)? |
| MED-21 | medical | core | approved | false | Ever / current | matches_source | — | Have you been treated, diagnosed or prescribed medication for diabetes before age 21, do you currently take insulin, or has diabetes been diagnosed together with retinopathy, nephropathy, neuropathy, insulin shock or diabetic coma? |
| MED-22 | medical | core | approved | false | Past 12 months | matches_source | — | In the past 12 months, have you used a walker, wheelchair, electric scooter, supplemental oxygen, or catheter? |
| MED-23 | medical | core | approved | false | Ever | matches_source | — | Have you ever received an organ transplant? |
| MED-24 | medical | core | approved | false | Currently | matches_source | — | Are you currently confined to a hospital, or to a medical or rehabilitation facility? |
| MED-25 | medical | core | approved | false | Ever, before age 60 | matches_source | — | Has a parent, brother or sister ever had kidney disease, needed a major organ transplant, or been diagnosed with heart disease, cerebrovascular disease, or internal cancer before age 60? |
| MED-26 | medical | core | approved | false | Ever, before age 60 | matches_source | — | Have more than one member of your family — father, mother, brother or sister — died before age 60 from breast, colon, intestinal or prostate cancer, or from cardiovascular disease? |
| MED-09 | medical | core | approved | false | — | wording_changed | wording: Source asks for 'all your current medications, including herb and vitamin supplements'; the bank asks only for prescription medications taken regularly, so supplements are excluded. | Which prescription medications do you take regularly today? |
| MED-10 | medical | core | approved | false | Past 5 years | timeframe_changed | timeframe: SRC-021 and SRC-022 are current-state questions; the bank asks about the past 5 years. SRC-037's 5-year window belongs to the mental-health section, not this medical row.; wording: SRC-021's disability benefits/pension limb and 30-hour full-time test, and SRC-022's hospital, nursing facility, hospice and home-health limbs, are merged into one sentence.; branching: Disability benefits and current confinement have different follow-ups but share one answer. | In the past 5 years, have you been unable to work, or needed help with daily activities because of your health? |
| MED-11 | medical | core | human_review_required | false | — | held_for_review | — | Held for review: the source questionnaire asks about HIV or AIDS. |
| MH-01 | mental | core | approved | false | Ever | wording_changed | wording: SRC-031's condition list (bipolar, schizophrenia, PTSD, eating disorder, OCD, autism and others) is replaced by 'such as anxiety or depression'.; timeframe: SRC-015's 7-year mental or nervous disorder window is not represented.; branching: Bipolar and schizophrenia carry separate underwriting treatment but share one answer here. | Have you ever been diagnosed with or treated for a mental health condition, such as anxiety or depression? |
| MH-02 | mental | supplemental | approved | false | Ever | added_by_lpp | attribution: Diagnosis timing and treatment type are LPP additions, but the source asks related questions (SRC-033 medication details, SRC-034 diagnosis and last seen, SRC-035 outpatient care, SRC-036 in-patient care) that this row does not reproduce. | A little about the condition and the care you received. |
| MH-03 | mental | core | approved | false | Past 5 years | wording_changed | wording: Source asks whether you were 'unable to work'; the bank asks whether the condition caused you to 'miss work or stop working', which widens the question. | In the past 5 years, has a mental health condition caused you to miss work or stop working? |
| MH-04 | mental | core | approved | false | Ever | wording_changed | branching: Two source questions (thoughts, and attempts with their detail request) are merged into one Yes/No, so a customer who has attempted cannot say so separately.; omission: SRC-039's required detail (date and follow-up treatment) is optional in this row. | Have you ever had thoughts of ending your life, or made a suicide attempt? |
| MH-05 | mental | supplemental | approved | false | Right now | added_by_lpp | — | Are you having thoughts of harming yourself right now? |
| MH-06 | mental | core | human_review_required | false | — | held_for_review | — | Held for review: the source questionnaire asks for detail about any attempt. |
| MH-07 | mental | core | approved | false | Past 5 years | matches_source | — | In the past 5 years, have you seen a psychiatrist, or had treatment as a hospital outpatient, for a mental health condition? |
| NIC-01 | nicotine | core | approved | false | Past 12 months | split_source_compound | — | In the past 12 months, have you used tobacco or any nicotine product in any form? |
| NIC-02 | nicotine | core | approved | false | Past 36 months | split_source_compound | — | In the past 36 months, have you used tobacco or nicotine products in any form? |
| NIC-03 | nicotine | core | approved | false | Past 5 years | split_source_compound | — | In the past 5 years, have you used nicotine, tobacco, vaping or e-cigarettes in any form? |
| NIC-04 | nicotine | core | approved | false | Most recent use | wording_changed | branching: SRC-042 asks for the date last used only when the 12-month answer is No. This row also asks after an unsure answer, so an uncertain customer is not left without a last-use date. | When did you last use any tobacco or nicotine product? |
| ALC-01 | alcohol | supplemental | approved | false | Past 12 months | not_in_source | attribution: The source never asks whether you drink. It asks about abuse, treatment, advice to stop and infractions. This question is an LPP addition and was labelled a source question. Status corrected to supplemental. | In the past 12 months, have you drunk alcohol? |
| ALC-02 | alcohol | core | approved | false | Past 7 years | matches_source | — | In the past 7 years, have you abused alcohol, had or been recommended to have treatment or counseling for alcohol use, or been advised to discontinue the use of alcohol? |
| ALC-04 | alcohol | core | approved | false | Past 5 years | matches_source | — | In the past 5 years, have you abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or to have treatment or counseling for alcohol? |
| ALC-05 | alcohol | core | approved | false | Past 10 years | matches_source | — | In the past 10 years, have you been treated for alcohol abuse? |
| ALC-06 | alcohol | core | approved | false | Ever | matches_source | — | Do you have any history of alcohol abuse or misuse, treatment or counseling, or of being advised to discontinue the use of alcohol? |
| ALC-03 | alcohol | core | approved | false | Ever; DWI or DUI within 3 years | matches_source | — | Have you ever had any alcohol- or drug-related infractions, including a history of excessive alcohol use, or an admitted DWI or DUI within the last three years? |
| AVI-01 | aviation | core | approved | false | Past 12 months | matches_source | — | In the past 12 months, have you made any flights as a pilot, student pilot, or crew member of any aircraft? |
| AVI-02 | aviation | core | approved | false | Past 24 months | matches_source | — | In the past 24 months, have you made, or contemplated making, any flights as a pilot, student pilot, or crew member of any aircraft? |
| AVI-03 | aviation | supplemental | approved | false | Past 24 months | added_by_lpp | attribution: Certificate (SRC-051), hours as pilot and crew (SRC-053) and aircraft types (SRC-054) are source questions presented as LPP additions.; omission: The complete schedule of flying time and the type of other flying are not collected.; branching: Aviation accidents, groundings, fines and reprimands (SRC-052) are an optional field in this detail step, asked only after a Yes to the 24-month question, rather than their own 'ever' question. | A few details about your flying. |
| AVI-04 | aviation | core | approved | false | Next 12 months | timeframe_changed | timeframe: Source asks about flying within the next two years; the bank asks about the next 12 months.; wording: Source asks whether the type of flying will differ from past flying; the bank does not. | Do you plan to fly as a pilot or crew member in the next 12 months? |
| AVO-01 | avocations | core | approved | false | Past 5 years | timeframe_changed | timeframe: Source asks about the past 2 years and the next 2 years intended; the bank asks about the past 5 years.; wording: The bank omits parachuting, hang gliding, rodeo events and professional sport, and adds 'another hazardous activity'.; branching: There is no 'intend to take part in the next 2 years' dimension, so planned participation never opens a branch. | In the past 5 years, which of these activities have you taken part in? |
| AVO-02 | avocations | supplemental | approved | false | Past 5 years | added_by_lpp | attribution: Climbing years, frequency, areas and terrain (SRC-056 to SRC-058) are source questions presented as LPP additions.; omission: Bolted-route proportion (SRC-059) and climbing alone or without a rope (SRC-060) are not asked. | A little about your climbing. |
| AVO-03 | avocations | supplemental | approved | false | Past 5 years | added_by_lpp | attribution: Automobile or hydroplane racing (SRC-061), professional or cash prizes (SRC-063) and last race date (SRC-064) are source questions presented as LPP additions.; omission: Track type (SRC-062) and the last-race date are not collected. | A little about your racing. |
| AVO-04 | avocations | supplemental | approved | false | Past 5 years | added_by_lpp | attribution: Certification, depth and dive volume (SRC-065, SRC-066) are source questions presented as LPP additions.; omission: Hours of instruction and certification date, depth bands and their 12-month windows, equipment (SRC-067), locations (SRC-068) and salvage or exploration diving (SRC-069) are not asked. | A little about your scuba diving. |
| AVO-05 | avocations | supplemental | approved | false | Past 5 years | added_by_lpp | attribution: Skydiving and hang gliding come from SRC-055, which this row is not traced to.; timeframe: The row uses a 5-year window; SRC-055 uses 2 years. | A little about your skydiving or paragliding. |
| AVO-06 | avocations | core | approved | false | Past 5 years | matches_source | — | Do you ever climb alone or without a rope? |
| AVO-07 | avocations | core | approved | false | Past 5 years | matches_source | — | Do you dive for salvage or exploration? |
| DRV-06 | driving | core | approved | false | Current | matches_source | — | Do you currently have a valid driver's licence? |
| DRV-01 | driving | core | approved | false | Past 24 months | matches_source | — | In the past 24 months, have you had your driver's licence suspended or revoked, or been convicted of driving under the influence of alcohol or drugs? |
| DRV-02 | driving | core | approved | false | Past 5 years | matches_source | — | In the past 5 years, have you had your driver's licence suspended or revoked, or is it currently suspended or revoked? |
| DRV-03 | driving | core | approved | false | Past 5 years | matches_source | — | In the past 5 years, have you been convicted of careless or reckless driving? |
| DRV-07 | driving | core | approved | false | Past 5 years | matches_source | — | In the past 5 years, have you pleaded guilty to, or been convicted of, any moving violations? |
| DRV-04 | driving | core | approved | false | Past 5 years | matches_source | — | In the past 5 years, have you had more than two moving motor vehicle violations, or any alcohol- or drug-related infractions? |
| DRV-05 | driving | core | approved | false | Ever | matches_source | — | Have you ever had any motor vehicle accidents? |
| CRM-01 | criminal | core | approved | false | Ever | matches_source | — | Have you ever pleaded guilty to, or been convicted of, a felony or misdemeanour, or do you have such a charge currently pending? |
| CRM-02 | criminal | core | approved | false | Past 7 years | matches_source | — | In the past 7 years, have you been convicted of, pleaded guilty to, or entered a plea of no contest to any felony? |
| CRM-03 | criminal | core | approved | false | Past 10 years | matches_source | — | In the past 10 years, have you been convicted of, or pleaded guilty to, a felony, or are you currently awaiting trial for one? |
| CRM-04 | criminal | core | approved | false | Past 5 years | matches_source | — | In the past 5 years, have you pleaded guilty to or been convicted of a felony or misdemeanour, including DUI or DWI, or do you have such a charge currently pending? |
| CRM-05 | criminal | core | approved | false | Past 6 months | matches_source | — | In the past 6 months, have you served, or been released from, incarceration, probation, parole, or other court-ordered supervision for a misdemeanour or felony conviction? |
| CRM-06 | criminal | core | approved | false | Past 10 years | matches_source | — | In the past 10 years, have you served, or been released from, incarceration, probation, parole, or other court-ordered supervision for a misdemeanour or felony conviction? |
| CRM-07 | criminal | core | approved | false | Currently | matches_source | — | Are you currently under an order for probation, parole, or other court-ordered supervision for a misdemeanour or felony conviction? |
| FIN-01 | financial | core | approved | false | Ever | wording_changed | wording: Source asks 'Have you or your spouse filed bankruptcy before?'; the bank asks about the customer or a business they owned, and omits the spouse.; branching: The source's immediate 'If so, what type?' follow-up is split into a separate supplemental row. | Have you ever filed for bankruptcy, personally or for a business you owned? |
| FIN-02 | financial | supplemental | approved | false | Ever | added_by_lpp | attribution: Chapter, personal or business, discharge and pending status (SRC-086, SRC-087, SRC-089) are source questions presented as LPP additions.; omission: The date or anticipated date of discharge (SRC-088) is not collected.; branching: The row opens on 'unknown' as well as 'yes'; the source branches only on yes. | A few details about the bankruptcy. |
| FIN-03 | financial | core | approved | false | Ever | matches_source | — | What was the date of discharge, or the anticipated date? |
| DRG-01 | drugs | core | approved | false | Past 2 years | matches_source | — | In the past 2 years, have you used illegal drugs, abused alcohol or drugs, had or been recommended by a medical professional to have treatment or counseling for alcohol or drug use, or been advised to discontinue the use of alcohol or drugs? |
| DRG-02 | drugs | core | approved | false | Past 5 years | matches_source | — | In the past 5 years, have you used illegal drugs or abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or drugs, or to have treatment or counseling for alcohol or drugs? |
| DRG-03 | drugs | core | approved | false | Last 24 months | matches_source | — | In the last 24 months, have you smoked marijuana for recreational purposes? |
| DRG-04 | drugs | core | approved | false | Ever | matches_source | — | Have you ever used heroin, morphine, other narcotics, marijuana, cocaine, barbiturates, amphetamines, hallucinogenic drugs, or other habit-forming drugs, except as prescribed by a physician? |
| DRG-05 | drugs | core | approved | false | Past 7 years | matches_source | — | In the past 7 years, have you been advised by a medical professional to have treatment for, or to reduce or discontinue, the intake of prescription drugs? |
| DRG-06 | drugs | core | approved | false | Past 10 years | matches_source | — | In the past 10 years, have you been treated for drug abuse, or used any drugs not prescribed to you? |
| DRG-07 | drugs | core | approved | false | Ever / current | matches_source | — | Do you have any history of, or current treatment for, drug abuse? |
| RES-01 | residency | core | approved | false | — | wording_changed | wording: Source asks citizen or permanent resident and then requests a visa or green-card number. The bank adds 'another status' and 'prefer not to answer', and the number is held separately as RES-05.; branching: The source's visa or green-card follow-up has no approved branch; it is held, not asked. | Which best describes your citizenship or residency status in the United States? |
| RES-02 | residency | core | approved | false | Past 5 years | timeframe_changed | timeframe: Source asks whether the insured lived consistently in the USA for 5 years, and separately asks for travel details in the last 2 years. The bank asks about living outside the USA for a month or more in the last 5 years, which is neither question.; wording: The 'consistently in the USA' test and the travel-detail request (dates, regions, reason, frequency, duration) are not asked. | In the past 5 years, have you lived outside the United States for a month or more? |
| RES-03 | residency | core | approved | false | Next 12 months | timeframe_changed | timeframe: Source windows are the next 2 years / next 24 months; the bank asks about the next 12 months.; wording: The named-country list, the 30-day trip threshold and the 180-day residence threshold are all absent, as is the source's 'where?' follow-up. | Do you plan to travel outside the United States in the next 12 months? |
| RES-04 | residency | core | human_review_required | false | — | held_for_review | — | Held for review: the source questionnaire asks for an immigration category. |
| RES-05 | residency | core | human_review_required | false | — | held_for_review | — | Held for review: the source questionnaire asks for a visa or green-card number. |
| RES-06 | residency | core | approved | false | Future | matches_source | — | Do you plan to move back to your native country? |
| OCC-01 | occupation | core | approved | false | — | wording_changed | wording: SRC-106 asks whether you work full time (minimum 30 hours) and have done so for the past six months. The bank asks for typical hours per week and drops the 30-hour and six-month test.; branching: Three source questions (occupation, salary, full-time history) are merged into one compound without confirming each component. | Tell us about your work. |
| OCC-02 | occupation | core | approved | false | Right now | wording_changed | wording: SRC-107 asks whether you carry a weapon; SRC-108 asks whether you belong to a listed high-risk occupation. The bank asks a single generic hazard question and adds working at height.; omission: The source's occupation examples (explosives handlers, iron workers, underground miners, professional athletes, casino workers, firefighters) are not shown.; timeframe: The bank adds a 'right now' window; the source questions carry no stated window. | Does your work involve firearms, explosives, working at height, or another hazardous duty? |
| MIL-01 | military | core | approved | false | Ever | timeframe_changed | timeframe: Source asks whether you are on active duty now. The bank asks whether you have ever served, which is a different population and a different window.; branching: Every military follow-up depends on this answer, so the incorrect frame changes which branches open. | Have you ever served in the armed forces? |
| MIL-02 | military | supplemental | approved | false | Ever | added_by_lpp | attribution: Flying time and duties aboard an aircraft (SRC-111, SRC-113) are source questions presented as LPP additions.; omission: Mission type (SRC-112: Combat Tactical/Recon, Combat Transport, Non-Combat Recon, Non-Combat Transport, Proficiency) is not asked. | Did your service include flying or aircraft duties? |
| MIL-03 | military | core | approved | false | Past 12 months | timeframe_changed | timeframe: Source asks about current deployment or orders to deploy, with no 12-month lookback. The bank asks about the past 12 months.; wording: The named countries and the 'orders to deploy' limb are not asked.; branching: The row branches on MIL-01's 'ever served' answer rather than on current active duty. | In the past 12 months, have you been on active duty or deployed? |
| MIL-04 | military | core | approved | false | Current | matches_source | — | What kind of missions do you fly? |

## Full bank-row decisions (92)

### ID-01 — wording_changed

- **Section:** identity
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** —
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.1 — SRC-001
- **Source text:** SRC-001 (None stated): What is your Date of Birth, Age, and State of Birth?
- **Customer text:** What is your date of birth?
- **Flags:** wording: SRC-001 is one compound question (date of birth, age, state of birth). The bank collects date of birth only and does not confirm the split with the customer.; omission: Age and state of birth are not collected anywhere in the bank.
- **Required decision:** Decide whether to collect age and state of birth, or record why they are unnecessary. If the compound is split, add the confirmation step the specification requires.

### ID-02 — wording_changed

- **Section:** identity
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** —
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.1 — SRC-001
- **Source text:** SRC-001 (None stated): What is your Date of Birth, Age, and State of Birth?
- **Customer text:** Where were you born?
- **Flags:** wording: Source asks for state of birth; the bank asks for city and country. That widens the question beyond the source and duplicates one component of SRC-001.
- **Required decision:** Narrow the question to state of birth, or document the widening as an approved revision with a reason.

### ID-03 — not_in_source

- **Section:** identity
- **Status:** supplemental
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** —
- **Source ref:** Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (current state of residence, added for routing)
- **Source text:** Not in the source questionnaire. Added by Life Policy Pilot.
- **Customer text:** Which state do you currently live in?
- **Flags:** attribution: Labelled a source question, but the PDF never asks for current state of residence. The specification asks for it separately for routing. Status corrected to supplemental.
- **Required decision:** Confirm the routing field stays supplemental and keeps its own label; it must not be counted as source coverage.

### ID-04 — held_for_review

- **Section:** identity
- **Status:** core
- **Review status:** human_review_required; **sourceVerified:** false
- **Timeframe:** —
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.1 — SRC-002
- **Source text:** SRC-002 (None stated): What is your Gender/Sex?
- **Customer text:** Held for review: the source questionnaire asks for sex or gender.
- **Flags:** wording: The source asks 'What is your Gender/Sex?'. No answer set or approved wording exists yet, so the row asks nothing.
- **Required decision:** Approve, reword or drop the sex/gender question, including the permitted answer set for each carrier and state.

### MED-01 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 12 months
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.1 — SRC-003
- **Source text:** SRC-003 (Past 12 months): Within the past 12 months, have you had surgical treatment for morbid obesity, or been declined for life insurance coverage, or had any diagnostic testing (excluding AIDS/HIV tests), surgery, or hospitalization recommended by a medical professional which has not been completed or for which the results have not been received?
- **Customer text:** In the past 12 months, have you had surgical treatment for morbid obesity, been declined for life insurance coverage, or had diagnostic testing (excluding HIV/AIDS tests), surgery or a hospital stay recommended by a medical professional that has not been completed or for which the results have not been received?
- **Flags:** —
- **Required decision:** Confirm SRC-003's three limbs (morbid-obesity surgery, declined for coverage, incomplete or pending testing) are asked together and that the split from SRC-004 keeps the 12-month window.

### MED-02 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 12 months
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.1 — SRC-004
- **Source text:** SRC-004 (Past 12 months): Within the past 12 months, have you consulted a medical professional, had surgery, or been hospitalized, or had diagnostic tests (excluding HIV/AIDS) such as EKG, X-ray, MRI, or CAT scan?
- **Customer text:** In the past 12 months, have you consulted a medical professional, had surgery or been hospitalized, or had diagnostic tests (excluding HIV/AIDS) such as an EKG, X-ray, MRI or CAT scan?
- **Flags:** —
- **Required decision:** Confirm the 12-month consultation, surgery, hospitalization and testing question, including the HIV/AIDS exclusion, is asked on its own.

### MED-03 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 2 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.1 — SRC-005
- **Source text:** SRC-005 (Past 2 years): Within the past 2 years, have you been medically diagnosed or treated for angina (chest pain), stroke or TIA, cardiomyopathy, systemic lupus (SLE), cirrhosis, Hepatitis C, chronic hepatitis, chronic pancreatitis, chronic obstructive pulmonary disease (COPD), emphysema, chronic bronchitis, or required oxygen equipment to assist in breathing?
- **Customer text:** In the past 2 years, have you been medically diagnosed with or treated for angina (chest pain), a stroke or TIA, cardiomyopathy, systemic lupus (SLE), cirrhosis, hepatitis C or chronic hepatitis, chronic pancreatitis, chronic obstructive pulmonary disease (COPD), emphysema or chronic bronchitis, or have you required oxygen equipment to help you breathe?
- **Flags:** —
- **Required decision:** Confirm the 2-year condition list and the oxygen-equipment limb match SRC-005.

### MED-04 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 2 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.1 — SRC-006
- **Source text:** SRC-006 (Past 2 years): Within the past 2 years, have you had a heart attack or aneurysm, or had or been medically advised to have any type of heart, brain or circulatory surgery (including, but not limited to a pacemaker insertion, defibrillator placement), or any procedure to improve circulation?
- **Customer text:** In the past 2 years, have you had a heart attack or aneurysm, or had — or been medically advised to have — any type of heart, brain or circulatory surgery, including a pacemaker or defibrillator, or any procedure to improve circulation?
- **Flags:** —
- **Required decision:** Confirm the 2-year cardiac-event and advised-surgery question matches SRC-006, including pacemaker and defibrillator.

### MED-06 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 3 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.1 — SRC-007
- **Source text:** SRC-007 (Past 3 years): Within the past 3 years, have you been treated, diagnosed, or been prescribed medication by a medical professional for chronic bronchitis, emphysema, chronic obstructive pulmonary disease (COPD), irregular heart beat, seizures, blood clot, or aneurysm?
- **Customer text:** In the past 3 years, have you been treated for, diagnosed with, or prescribed medication for chronic bronchitis, emphysema, COPD, an irregular heartbeat, seizures, a blood clot or an aneurysm?
- **Flags:** —
- **Required decision:** Confirm the 3-year question stays separate from the 2-year question even though both mention bronchitis and COPD.

### MED-08 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.1 — SRC-008
- **Source text:** SRC-008 (Past 5 years): Within the past 5 years, have you been treated, diagnosed, or been prescribed medication by a medical professional for internal cancer, melanoma, Hodgkin's disease, or lymphoma?
- **Customer text:** In the past 5 years, have you been treated for, diagnosed with, or prescribed medication for internal cancer, melanoma, Hodgkin's disease or lymphoma?
- **Flags:** —
- **Required decision:** Confirm the 5-year internal-cancer, melanoma, Hodgkin's and lymphoma window. The skin-cancer exclusion added in the first pass is gone.

### MED-12 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 7 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.1 — SRC-011
- **Source text:** SRC-011 (Past 7 years): Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for high blood pressure, heart attack, angina, arrhythmia, stroke, aneurysm, or any heart or circulatory disease or disorder?
- **Customer text:** In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for high blood pressure, a heart attack, angina, an arrhythmia, a stroke, an aneurysm, or any heart or circulatory disease or disorder?
- **Flags:** —
- **Required decision:** Confirm the 7-year heart and circulatory question, including high blood pressure, matches SRC-011.

### MED-13 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 7 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.1 — SRC-012
- **Source text:** SRC-012 (Past 7 years): Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for diabetes, cirrhosis, hepatitis, pancreatitis, Crohn's disease, ulcerative colitis, or any digestive or liver disease or disorder?
- **Customer text:** In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for diabetes, cirrhosis, hepatitis, pancreatitis, Crohn's disease, ulcerative colitis, or any digestive or liver disease or disorder?
- **Flags:** —
- **Required decision:** Confirm the 7-year diabetes, digestive and liver question. It is separate from the 10-year diabetes question and from the supplemental detail row removed in this pass.

### MED-14 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 7 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.1 — SRC-013
- **Source text:** SRC-013 (Past 7 years): Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for asthma, emphysema, chronic obstructive pulmonary disease (COPD), sleep apnea, or any respiratory disease or disorder?
- **Customer text:** In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for asthma, emphysema, COPD, sleep apnea, or any respiratory disease or disorder?
- **Flags:** —
- **Required decision:** Confirm the 7-year respiratory question, including sleep apnea, matches SRC-013. The 6-month untreated-sleep-apnea nuance remains a separate gap.

### MED-20 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Last 6 months, or untreated
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.2 — SRC-014
- **Source text:** SRC-014 (Last 6 months (within an 'ever' diagnosis)): Have you ever been diagnosed with Sleep Apnea within the last 6 months, or for which you are not being treated?
- **Customer text:** Have you ever been diagnosed with sleep apnoea within the last 6 months, or with sleep apnoea that is not being treated?
- **Flags:** —
- **Required decision:** Confirm the separate recent or untreated sleep apnoea question matches SRC-014 rather than being folded into the 7-year respiratory row.

### MED-15 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 7 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.2 — SRC-015
- **Source text:** SRC-015 (Past 7 years): Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for cancer in any form, anemia, any seizures, bipolar disorder, schizophrenia, Alzheimer's, dementia, or mental or nervous disorder?
- **Customer text:** In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for cancer in any form, anemia, seizures, bipolar disorder, schizophrenia, Alzheimer's, dementia, or a mental or nervous disorder?
- **Flags:** —
- **Required decision:** Confirm the 7-year cancer, anemia, seizure and mental/nervous question. Confirm the 5-year cancer question above is not treated as a substitute.

### MED-16 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 7 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.2 — SRC-016
- **Source text:** SRC-016 (Past 7 years): Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for any disease or disorder of the kidneys, urinary bladder, prostate, reproductive organs, or sexually transmitted disease?
- **Customer text:** In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for any disease or disorder of the kidneys, urinary bladder, prostate or reproductive organs, or a sexually transmitted disease?
- **Flags:** —
- **Required decision:** Confirm the 7-year kidney, bladder, prostate, reproductive and STI question is appropriate to ask, and whether it needs a sensitive-handling note.

### MED-17 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 7 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.2 — SRC-017
- **Source text:** SRC-017 (Past 7 years): Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for connective tissue disease, systemic lupus (SLE), arthritis, or any disorder of the back, joints, muscles, or nervous system?
- **Customer text:** In the past 7 years, have you been diagnosed with, treated for, or prescribed medication for a connective tissue disease, systemic lupus (SLE), arthritis, or any disorder of the back, joints, muscles or nervous system?
- **Flags:** —
- **Required decision:** Confirm the 7-year connective tissue, lupus, arthritis and musculoskeletal question matches SRC-017.

### MED-18 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 10 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.2 — SRC-018
- **Source text:** SRC-018 (Past 10 years): In the past 10 years, have you taken medication to treat high blood pressure or an elevated cholesterol level?
- **Customer text:** In the past 10 years, have you taken medication to treat high blood pressure or an elevated cholesterol level?
- **Flags:** —
- **Required decision:** Confirm the 10-year blood-pressure and cholesterol medication question is separate from the 7-year diagnosis question.

### MED-19 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 10 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.2 — SRC-019
- **Source text:** SRC-019 (Past 10 years): In the past 10 years, have you been medically diagnosed, tested, or received treatment for diabetes, cancer, or cardiac disease (heart attack, myocardial infarct, angina, cardiac insufficiency, cerebral thrombosis, or coronary artery disease)?
- **Customer text:** In the past 10 years, have you been medically diagnosed with, tested for, or received treatment for diabetes, cancer, or cardiac disease (heart attack, myocardial infarction, angina, cardiac insufficiency, cerebral thrombosis or coronary artery disease)?
- **Flags:** —
- **Required decision:** Confirm the 10-year diabetes, cancer and cardiac question. It deliberately repeats conditions asked in shorter windows because the source does.

### MED-21 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever / current
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.2 — SRC-020
- **Source text:** SRC-020 (None stated): Have you been treated, diagnosed, or been prescribed medication by a medical professional for diabetes prior to age 21, or do you currently take insulin shots, or been diagnosed with diabetes combined with a medical history of any of the following: retinopathy, nephropathy, neuropathy, insulin shock, or diabetic coma?
- **Customer text:** Have you been treated, diagnosed or prescribed medication for diabetes before age 21, do you currently take insulin, or has diabetes been diagnosed together with retinopathy, nephropathy, neuropathy, insulin shock or diabetic coma?
- **Flags:** —
- **Required decision:** Confirm the three-limb diabetes question matches SRC-020: diagnosis before 21, insulin now, or a listed complication.

### MED-22 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 12 months
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.2 — SRC-023
- **Source text:** SRC-023 (Past 12 months): Within the past 12 months, have you used a walker, wheelchair, electric scooter, supplemental oxygen, or catheter?
- **Customer text:** In the past 12 months, have you used a walker, wheelchair, electric scooter, supplemental oxygen, or catheter?
- **Flags:** —
- **Required decision:** Confirm the 12-month mobility-aid question matches SRC-023.

### MED-23 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.2 — SRC-024
- **Source text:** SRC-024 (Ever): Have you been the recipient of an organ transplant?
- **Customer text:** Have you ever received an organ transplant?
- **Flags:** —
- **Required decision:** Confirm the organ-transplant question matches SRC-024.

### MED-24 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Currently
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.2 — SRC-025
- **Source text:** SRC-025 (Currently): Are you at the time of this application confined to any hospital or other medical or rehabilitation facility?
- **Customer text:** Are you currently confined to a hospital, or to a medical or rehabilitation facility?
- **Flags:** —
- **Required decision:** Confirm the current-confinement question matches SRC-025 and is asked at application time, as the source says.

### MED-25 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever, before age 60
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.2 — SRC-026
- **Source text:** SRC-026 (Ever before age 60): Has the natural parent, brother, or sister of the proposed insured ever had kidney disease, required a major organ transplant, or been diagnosed with heart disease, cerebrovascular disease, or internal cancer prior to age 60?
- **Customer text:** Has a parent, brother or sister ever had kidney disease, needed a major organ transplant, or been diagnosed with heart disease, cerebrovascular disease, or internal cancer before age 60?
- **Flags:** —
- **Required decision:** Confirm the family-history question matches SRC-026, including the before-age-60 window and the parent-or-sibling limit.

### MED-26 — matches_source

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever, before age 60
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.2 — SRC-027
- **Source text:** SRC-027 (Ever before age 60): Has more than one member of your family (father, mother, brother, or sister) died before age 60 from breast, colon, intestinal, or prostate cancer, or from cardiovascular disease (heart attack, myocardial infarct, angina, cardiac insufficiency, cerebral thrombosis, or coronary artery disease)?
- **Customer text:** Have more than one member of your family — father, mother, brother or sister — died before age 60 from breast, colon, intestinal or prostate cancer, or from cardiovascular disease?
- **Flags:** —
- **Required decision:** Confirm the second family-history question matches SRC-027: more than one relative dying before 60 from the listed cancers or cardiovascular disease.

### MED-09 — wording_changed

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** —
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.3 — SRC-029
- **Source text:** SRC-029 (Current): What are all your current medications, including herb and vitamin supplements?
- **Customer text:** Which prescription medications do you take regularly today?
- **Flags:** wording: Source asks for 'all your current medications, including herb and vitamin supplements'; the bank asks only for prescription medications taken regularly, so supplements are excluded.
- **Required decision:** Add herb and vitamin supplements, or record an approved reason for excluding them.

### MED-10 — timeframe_changed

- **Section:** medical
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, pp.2–3 — SRC-021, SRC-022, SRC-037
- **Source text:** SRC-021 (Currently): Are you currently unemployed due to medical reasons, or been prohibited from actively working full time (30 hours or more per week) at your regular occupation due to any illness, injury, or health-related problem, or are you currently receiving benefits, compensation, or pension for disability? • SRC-022 (Currently): Are you currently hospitalized, confined to a nursing facility, receiving Hospice Care or home health care, or do you require assistance (from anyone) with activities of daily living such as bathing, dressing, eating or toileting? • SRC-037 (Past 5 years): Within the past 5 years, have you been unable to work due to your condition?
- **Customer text:** In the past 5 years, have you been unable to work, or needed help with daily activities because of your health?
- **Flags:** timeframe: SRC-021 and SRC-022 are current-state questions; the bank asks about the past 5 years. SRC-037's 5-year window belongs to the mental-health section, not this medical row.; wording: SRC-021's disability benefits/pension limb and 30-hour full-time test, and SRC-022's hospital, nursing facility, hospice and home-health limbs, are merged into one sentence.; branching: Disability benefits and current confinement have different follow-ups but share one answer.
- **Required decision:** Separate current disability/confinement from the 5-year work-impact question, and restore the 30-hour and benefits wording.

### MED-11 — held_for_review

- **Section:** medical
- **Status:** core
- **Review status:** human_review_required; **sourceVerified:** false
- **Timeframe:** —
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.1 — SRC-009
- **Source text:** SRC-009 (Ever): Have you ever been diagnosed, treated, tested positive for, or received medical advice for Human Immunodeficiency Virus (HIV) or Acquired Immune Deficiency Syndrome (AIDS)?
- **Customer text:** Held for review: the source questionnaire asks about HIV or AIDS.
- **Flags:** —
- **Required decision:** Obtain documented legal, clinical and underwriting approval for asking about HIV/AIDS, including state restrictions and confidentiality handling.

### MH-01 — wording_changed

- **Section:** mental
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever
- **Source ref:** Detialed-Life-insurance-Questions.pdf, pp.2–3 — SRC-030, SRC-031, SRC-015
- **Source text:** SRC-030 (None stated): Do you have any history of or current treatment for psychological, mood, or anxiety disorders? • SRC-031 (None stated): What mental health, nervous, or psychiatric conditions apply to you (e.g., situational anxiety, adjustment disorder, panic disorder, depression, major depression, schizophrenia, bipolar I or II, ADHD/ADD, eating disorder, mental retardation, PTSD, Tourette's syndrome, suicide attempt/ideation, OCD, autism)? • SRC-015 (Past 7 years): Within the past 7 years, has any Proposed Insured been diagnosed with, treated for, or prescribed medication for cancer in any form, anemia, any seizures, bipolar disorder, schizophrenia, Alzheimer's, dementia, or mental or nervous disorder?
- **Customer text:** Have you ever been diagnosed with or treated for a mental health condition, such as anxiety or depression?
- **Flags:** wording: SRC-031's condition list (bipolar, schizophrenia, PTSD, eating disorder, OCD, autism and others) is replaced by 'such as anxiety or depression'.; timeframe: SRC-015's 7-year mental or nervous disorder window is not represented.; branching: Bipolar and schizophrenia carry separate underwriting treatment but share one answer here.
- **Required decision:** Approve a condition list for the follow-up, and decide whether the 7-year mental/nervous window is asked separately.

### MH-02 — added_by_lpp

- **Section:** mental
- **Status:** supplemental
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever
- **Source ref:** Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (mental health treatment detail)
- **Source text:** Not in the source questionnaire. Added by Life Policy Pilot.
- **Customer text:** A little about the condition and the care you received.
- **Flags:** attribution: Diagnosis timing and treatment type are LPP additions, but the source asks related questions (SRC-033 medication details, SRC-034 diagnosis and last seen, SRC-035 outpatient care, SRC-036 in-patient care) that this row does not reproduce.
- **Required decision:** Keep as supplemental, then decide which of SRC-033 to SRC-036 are added as source rows rather than folded into this detail.

### MH-03 — wording_changed

- **Section:** mental
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.3 — SRC-037
- **Source text:** SRC-037 (Past 5 years): Within the past 5 years, have you been unable to work due to your condition?
- **Customer text:** In the past 5 years, has a mental health condition caused you to miss work or stop working?
- **Flags:** wording: Source asks whether you were 'unable to work'; the bank asks whether the condition caused you to 'miss work or stop working', which widens the question.
- **Required decision:** Align the wording with 'unable to work', or approve the widening explicitly.

### MH-04 — wording_changed

- **Section:** mental
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.3 — SRC-038, SRC-039
- **Source text:** SRC-038 (None stated): Have you had any suicidal thoughts? • SRC-039 (None stated): Have you attempted suicide? (If yes, provide details, including date and follow-up treatment).
- **Customer text:** Have you ever had thoughts of ending your life, or made a suicide attempt?
- **Flags:** branching: Two source questions (thoughts, and attempts with their detail request) are merged into one Yes/No, so a customer who has attempted cannot say so separately.; omission: SRC-039's required detail (date and follow-up treatment) is optional in this row.
- **Required decision:** Split thoughts from attempts, or confirm the merged wording with the customer as required for a compound question. Keep the crisis panel attached to either answer.

### MH-05 — added_by_lpp

- **Section:** mental
- **Status:** supplemental
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Right now
- **Source ref:** Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (current crisis safety check)
- **Source text:** Not in the source questionnaire. Added by Life Policy Pilot.
- **Customer text:** Are you having thoughts of harming yourself right now?
- **Flags:** —
- **Required decision:** Confirm the crisis question is asked of every customer, whatever the answer to MH-04. It is no longer gated on a Yes, and `npm run check:bank` now fails if it is gated again.

### MH-06 — held_for_review

- **Section:** mental
- **Status:** core
- **Review status:** human_review_required; **sourceVerified:** false
- **Timeframe:** —
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.3 — SRC-039
- **Source text:** SRC-039 (None stated): Have you attempted suicide? (If yes, provide details, including date and follow-up treatment).
- **Customer text:** Held for review: the source questionnaire asks for detail about any attempt.
- **Flags:** —
- **Required decision:** Obtain clinical and legal approval for detail-level suicide questions, including crisis-support handling, before any collection.

### MH-07 — matches_source

- **Section:** mental
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.3 — SRC-035
- **Source text:** SRC-035 (Past 5 years): Within the past 5 years, have you seen a psychiatrist or had treatment as a hospital outpatient?
- **Customer text:** In the past 5 years, have you seen a psychiatrist, or had treatment as a hospital outpatient, for a mental health condition?
- **Flags:** —
- **Required decision:** Confirm the 5-year psychiatrist or hospital-outpatient question matches SRC-035 and is kept separate from the ever-diagnosed question.

### NIC-01 — split_source_compound

- **Section:** nicotine
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 12 months
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.3 — SRC-040, SRC-042
- **Source text:** SRC-040 (Past 12 months, 3 years, or 5 years (three windows in one question)): Has the proposed insured used nicotine, tobacco, vape, or e-cigarettes within the past 12 months, 3 years, or 5 years? (excluding occasional cigar or pipe use)? (Note: Tobacco in any form includes cigarettes, electronic cigarettes/e-cigs, chewing tobacco, cigars, pipes, snuff, nicotine patch, nicotine gum/aerosol/inhaler, Hookah pipe, clove, bidis cigarettes, or oral nicotine pouches.) • SRC-042 (Past 12 months): Have you used tobacco or any nicotine products in any form within the past twelve (12) months? (If Yes, type and amount, if No, date last used.)
- **Customer text:** In the past 12 months, have you used tobacco or any nicotine product in any form?
- **Flags:** —
- **Required decision:** SRC-040 carries the 12-month, 3-year and 5-year windows in one question. This row asks the 12-month limb, with type and amount on Yes and the source's occasional cigar/pipe exclusion. Confirm the split.

### NIC-02 — split_source_compound

- **Section:** nicotine
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 36 months
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.3 — SRC-040, SRC-041
- **Source text:** SRC-040 (Past 12 months, 3 years, or 5 years (three windows in one question)): Has the proposed insured used nicotine, tobacco, vape, or e-cigarettes within the past 12 months, 3 years, or 5 years? (excluding occasional cigar or pipe use)? (Note: Tobacco in any form includes cigarettes, electronic cigarettes/e-cigs, chewing tobacco, cigars, pipes, snuff, nicotine patch, nicotine gum/aerosol/inhaler, Hookah pipe, clove, bidis cigarettes, or oral nicotine pouches.) • SRC-041 (Past 36 months): During the past 36 months, have you used tobacco or nicotine products in any form (excluding occasional cigar or pipe use)?
- **Customer text:** In the past 36 months, have you used tobacco or nicotine products in any form?
- **Flags:** —
- **Required decision:** This row asks the 36-month limb of SRC-040 and SRC-041 as its own question, rather than folding it into the 12-month answer. Confirm the separate window.

### NIC-03 — split_source_compound

- **Section:** nicotine
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.3 — SRC-040
- **Source text:** SRC-040 (Past 12 months, 3 years, or 5 years (three windows in one question)): Has the proposed insured used nicotine, tobacco, vape, or e-cigarettes within the past 12 months, 3 years, or 5 years? (excluding occasional cigar or pipe use)? (Note: Tobacco in any form includes cigarettes, electronic cigarettes/e-cigs, chewing tobacco, cigars, pipes, snuff, nicotine patch, nicotine gum/aerosol/inhaler, Hookah pipe, clove, bidis cigarettes, or oral nicotine pouches.)
- **Customer text:** In the past 5 years, have you used nicotine, tobacco, vaping or e-cigarettes in any form?
- **Flags:** —
- **Required decision:** This row asks the 5-year limb of SRC-040, including its product definition. Confirm the window and that the longer window is asked separately from the shorter two.

### NIC-04 — wording_changed

- **Section:** nicotine
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Most recent use
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.3 — SRC-042
- **Source text:** SRC-042 (Past 12 months): Have you used tobacco or any nicotine products in any form within the past twelve (12) months? (If Yes, type and amount, if No, date last used.)
- **Customer text:** When did you last use any tobacco or nicotine product?
- **Flags:** branching: SRC-042 asks for the date last used only when the 12-month answer is No. This row also asks after an unsure answer, so an uncertain customer is not left without a last-use date.
- **Required decision:** Approve the extra unsure branch, or restrict the follow-up to a No exactly as the source does.

### ALC-01 — not_in_source

- **Section:** alcohol
- **Status:** supplemental
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 12 months
- **Source ref:** Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (current alcohol use)
- **Source text:** Not in the source questionnaire. Added by Life Policy Pilot.
- **Customer text:** In the past 12 months, have you drunk alcohol?
- **Flags:** attribution: The source never asks whether you drink. It asks about abuse, treatment, advice to stop and infractions. This question is an LPP addition and was labelled a source question. Status corrected to supplemental.
- **Required decision:** Confirm the addition is wanted and keep it labelled supplemental, or remove it. It must not be counted as source coverage.

### ALC-02 — matches_source

- **Section:** alcohol
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 7 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.3 — SRC-043
- **Source text:** SRC-043 (Past 7 years): Within the past 7 years, have you abused alcohol or had, or been recommended to have, treatment or counseling for alcohol use, or been advised to discontinue use of alcohol?
- **Customer text:** In the past 7 years, have you abused alcohol, had or been recommended to have treatment or counseling for alcohol use, or been advised to discontinue the use of alcohol?
- **Flags:** —
- **Required decision:** Confirm the 7-year abuse, treatment and advice-to-stop question matches SRC-043.

### ALC-04 — matches_source

- **Section:** alcohol
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.4 — SRC-044
- **Source text:** SRC-044 (Past 5 years): Within the past 5 years, have you abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or to have treatment or counseling for alcohol?
- **Customer text:** In the past 5 years, have you abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or to have treatment or counseling for alcohol?
- **Flags:** —
- **Required decision:** Confirm the 5-year question, including its drug limb and licensed-counselor wording, matches SRC-044.

### ALC-05 — matches_source

- **Section:** alcohol
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 10 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.4 — SRC-045
- **Source text:** SRC-045 (Past 10 years): In the past 10 years, have you been treated for alcohol abuse?
- **Customer text:** In the past 10 years, have you been treated for alcohol abuse?
- **Flags:** —
- **Required decision:** Confirm the 10-year treatment question is asked on its own.

### ALC-06 — matches_source

- **Section:** alcohol
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.4 — SRC-046
- **Source text:** SRC-046 (None stated): Do you have any history of alcohol abuse, misuse, treatment, or counseling, or having been advised to discontinue the use of alcohol?
- **Customer text:** Do you have any history of alcohol abuse or misuse, treatment or counseling, or of being advised to discontinue the use of alcohol?
- **Flags:** —
- **Required decision:** Confirm the no-window history question is kept separate from the 7, 5 and 10-year questions.

### ALC-03 — matches_source

- **Section:** alcohol
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever; DWI or DUI within 3 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.4 — SRC-047
- **Source text:** SRC-047 (Ever / DWI or DUI within the last three years): Have you ever had any alcohol/drug related infractions? (Including a history of excessive use of alcohol, or admitted DWI or DUI within the last three years).
- **Customer text:** Have you ever had any alcohol- or drug-related infractions, including a history of excessive alcohol use, or an admitted DWI or DUI within the last three years?
- **Flags:** —
- **Required decision:** Confirm the restored alcohol/drug infraction wording, including excessive use and an admitted DWI or DUI within three years. The earlier narrowing to a licence action is gone.

### AVI-01 — matches_source

- **Section:** aviation
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 12 months
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.4 — SRC-048
- **Source text:** SRC-048 (Past 12 months): Within the past 12 months, have you made any flights as a pilot, student pilot, or crew member of any aircraft?
- **Customer text:** In the past 12 months, have you made any flights as a pilot, student pilot, or crew member of any aircraft?
- **Flags:** —
- **Required decision:** Confirm the 12-month question matches SRC-048, including student pilots and crew. The earlier merged 'ever' row is gone.

### AVI-02 — matches_source

- **Section:** aviation
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 24 months
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.4 — SRC-049
- **Source text:** SRC-049 (Past 24 months): Within the past 24 months, have you made or contemplated making any flights as a pilot, student pilot, or crew member of any aircraft?
- **Customer text:** In the past 24 months, have you made, or contemplated making, any flights as a pilot, student pilot, or crew member of any aircraft?
- **Flags:** —
- **Required decision:** Confirm the 24-month question matches SRC-049, including 'contemplated' flights and student pilots, and that it is asked separately from the 12-month question.

### AVI-03 — added_by_lpp

- **Section:** aviation
- **Status:** supplemental
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 24 months
- **Source ref:** Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (aviation detail)
- **Source text:** Not in the source questionnaire. Added by Life Policy Pilot.
- **Customer text:** A few details about your flying.
- **Flags:** attribution: Certificate (SRC-051), hours as pilot and crew (SRC-053) and aircraft types (SRC-054) are source questions presented as LPP additions.; omission: The complete schedule of flying time and the type of other flying are not collected.; branching: Aviation accidents, groundings, fines and reprimands (SRC-052) are an optional field in this detail step, asked only after a Yes to the 24-month question, rather than their own 'ever' question.
- **Required decision:** Reattribute the fields to the source questions they answer, add the missing schedule, and decide whether SRC-052 is asked as its own question.

### AVI-04 — timeframe_changed

- **Section:** aviation
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Next 12 months
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.4 — SRC-050
- **Source text:** SRC-050 (Next 2 years): Do you expect to fly in the future within the next two years? (If Yes, indicate whether the type of flying will differ from past flying and provide details).
- **Customer text:** Do you plan to fly as a pilot or crew member in the next 12 months?
- **Flags:** timeframe: Source asks about flying within the next two years; the bank asks about the next 12 months.; wording: Source asks whether the type of flying will differ from past flying; the bank does not.
- **Required decision:** Set the window to two years to match the source, or record the approved reason for 12 months.

### AVO-01 — timeframe_changed

- **Section:** avocations
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.4 — SRC-055
- **Source text:** SRC-055 (Past 2 years / next 2 years intended): Within the past 2 years (or next 2 years intend to participate), have you participated in parachuting, hang gliding, rock or mountain climbing, rodeo events, sky diving, skin or scuba diving, organized racing of any kind, or any professional sport?
- **Customer text:** In the past 5 years, which of these activities have you taken part in?
- **Flags:** timeframe: Source asks about the past 2 years and the next 2 years intended; the bank asks about the past 5 years.; wording: The bank omits parachuting, hang gliding, rodeo events and professional sport, and adds 'another hazardous activity'.; branching: There is no 'intend to take part in the next 2 years' dimension, so planned participation never opens a branch.
- **Required decision:** Restore the 2-year windows and the full activity list, including the intended-participation half. Each activity needs its own branch.

### AVO-02 — added_by_lpp

- **Section:** avocations
- **Status:** supplemental
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (climbing detail)
- **Source text:** Not in the source questionnaire. Added by Life Policy Pilot.
- **Customer text:** A little about your climbing.
- **Flags:** attribution: Climbing years, frequency, areas and terrain (SRC-056 to SRC-058) are source questions presented as LPP additions.; omission: Bolted-route proportion (SRC-059) and climbing alone or without a rope (SRC-060) are not asked.
- **Required decision:** Add SRC-059 and SRC-060 as source questions, and reattribute the fields that already answer SRC-056 to SRC-058.

### AVO-03 — added_by_lpp

- **Section:** avocations
- **Status:** supplemental
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (racing detail)
- **Source text:** Not in the source questionnaire. Added by Life Policy Pilot.
- **Customer text:** A little about your racing.
- **Flags:** attribution: Automobile or hydroplane racing (SRC-061), professional or cash prizes (SRC-063) and last race date (SRC-064) are source questions presented as LPP additions.; omission: Track type (SRC-062) and the last-race date are not collected.
- **Required decision:** Add track type and last race date, and reattribute the source-derived fields.

### AVO-04 — added_by_lpp

- **Section:** avocations
- **Status:** supplemental
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (diving detail)
- **Source text:** Not in the source questionnaire. Added by Life Policy Pilot.
- **Customer text:** A little about your scuba diving.
- **Flags:** attribution: Certification, depth and dive volume (SRC-065, SRC-066) are source questions presented as LPP additions.; omission: Hours of instruction and certification date, depth bands and their 12-month windows, equipment (SRC-067), locations (SRC-068) and salvage or exploration diving (SRC-069) are not asked.
- **Required decision:** Decide which source diving questions are collected, then add them as source rows rather than supplemental fields.

### AVO-05 — added_by_lpp

- **Section:** avocations
- **Status:** supplemental
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (skydiving detail)
- **Source text:** Not in the source questionnaire. Added by Life Policy Pilot.
- **Customer text:** A little about your skydiving or paragliding.
- **Flags:** attribution: Skydiving and hang gliding come from SRC-055, which this row is not traced to.; timeframe: The row uses a 5-year window; SRC-055 uses 2 years.
- **Required decision:** Trace the row to SRC-055 and align the window, or label it as an LPP addition with no source window.

### AVO-06 — matches_source

- **Section:** avocations
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.4 — SRC-060
- **Source text:** SRC-060 (None stated): Do you ever climb alone or without a rope? (If Yes, state how often, the location, and degree of difficulty).
- **Customer text:** Do you ever climb alone or without a rope?
- **Flags:** —
- **Required decision:** Confirm the solo or unroped climbing question matches SRC-060, including the frequency, location and difficulty follow-up, and is asked only of climbers.

### AVO-07 — matches_source

- **Section:** avocations
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.5 — SRC-069
- **Source text:** SRC-069 (None stated): Do you dive for salvage or exploration?
- **Customer text:** Do you dive for salvage or exploration?
- **Flags:** —
- **Required decision:** Confirm the salvage or exploration diving question matches SRC-069 and is asked only where scuba diving was selected.

### DRV-06 — matches_source

- **Section:** driving
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Current
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.5 — SRC-071
- **Source text:** SRC-071 (Current): Do you currently have a valid driver's license?
- **Customer text:** Do you currently have a valid driver's licence?
- **Flags:** —
- **Required decision:** Confirm the valid-licence-today question matches SRC-071 and is asked before the suspension and conviction questions.

### DRV-01 — matches_source

- **Section:** driving
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 24 months
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.5 — SRC-072
- **Source text:** SRC-072 (Past 24 months): Within the past 24 months, have you had your driver's license suspended or revoked, or been convicted of driving under the influence of alcohol or drugs?
- **Customer text:** In the past 24 months, have you had your driver's licence suspended or revoked, or been convicted of driving under the influence of alcohol or drugs?
- **Flags:** —
- **Required decision:** Confirm the 24-month question keeps both limbs — suspension or revocation, and a DUI or DWI conviction — and that a charge alone does not count as a Yes.

### DRV-02 — matches_source

- **Section:** driving
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.5 — SRC-073
- **Source text:** SRC-073 (Past 5 years): Within the past 5 years, have you had a driver's license suspended or revoked, or is your driver's license currently suspended or revoked?
- **Customer text:** In the past 5 years, have you had your driver's licence suspended or revoked, or is it currently suspended or revoked?
- **Flags:** —
- **Required decision:** Confirm the 5-year question matches SRC-073, including a licence that is suspended today even if the suspension began earlier. The earlier merged 'ever' row is gone.

### DRV-03 — matches_source

- **Section:** driving
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.5 — SRC-075
- **Source text:** SRC-075 (Past 5 years): Within the past 5 years, have you been convicted of careless or reckless driving?
- **Customer text:** In the past 5 years, have you been convicted of careless or reckless driving?
- **Flags:** —
- **Required decision:** Confirm the 5-year careless or reckless question asks about a conviction. The earlier 'ever charged' wording and its charge outcome prompt are gone.

### DRV-07 — matches_source

- **Section:** driving
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.5 — SRC-074
- **Source text:** SRC-074 (Past 5 years): Within the past 5 years, have you pled guilty to or been convicted of any moving violations?
- **Customer text:** In the past 5 years, have you pleaded guilty to, or been convicted of, any moving violations?
- **Flags:** —
- **Required decision:** Confirm the 5-year plea-or-conviction question matches SRC-074 and stays separate from the more-than-two threshold in DRV-04.

### DRV-04 — matches_source

- **Section:** driving
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.5 — SRC-076
- **Source text:** SRC-076 (Past 5 years): In the past 5 years, have you had more than two moving motor vehicle violations or any alcohol/drug related infractions?
- **Customer text:** In the past 5 years, have you had more than two moving motor vehicle violations, or any alcohol- or drug-related infractions?
- **Flags:** —
- **Required decision:** Confirm the 5-year threshold question asks both limbs — more than two moving violations and any alcohol- or drug-related infraction — and that the overlap with the alcohol section is intentional.

### DRV-05 — matches_source

- **Section:** driving
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.5 — SRC-077
- **Source text:** SRC-077 (Ever): Have you ever had any motor vehicle accidents? (If yes, provide details, including fault).
- **Customer text:** Have you ever had any motor vehicle accidents?
- **Flags:** —
- **Required decision:** Confirm the ever window is restored and that the detail step records fault, as the source asks.

### CRM-01 — matches_source

- **Section:** criminal
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.6 — SRC-084
- **Source text:** SRC-084 (Ever): Have you ever pled guilty to, or been convicted of, a felony or misdemeanor or have such a charge currently pending? (If Yes, please provide date of arrest, conviction, and any jail time, probation or parole).
- **Customer text:** Have you ever pleaded guilty to, or been convicted of, a felony or misdemeanour, or do you have such a charge currently pending?
- **Flags:** —
- **Required decision:** Confirm the ever window and that the detail prompts cover SRC-084's request for date of arrest, conviction, jail time, probation and parole.

### CRM-02 — matches_source

- **Section:** criminal
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 7 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.5 — SRC-079
- **Source text:** SRC-079 (Past 7 years): Within the past 7 years, have you been convicted of, pleaded guilty to, or entered a plea of no contest to any felony?
- **Customer text:** In the past 7 years, have you been convicted of, pleaded guilty to, or entered a plea of no contest to any felony?
- **Flags:** —
- **Required decision:** Confirm the 7-year felony window, including 'no contest' pleas, matches the source and stays separate from the 10-year window.

### CRM-03 — matches_source

- **Section:** criminal
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 10 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.5 — SRC-080
- **Source text:** SRC-080 (Past 10 years): In the past 10 years, have you been convicted of, pled guilty to, or are you currently awaiting trial for a felony?
- **Customer text:** In the past 10 years, have you been convicted of, or pleaded guilty to, a felony, or are you currently awaiting trial for one?
- **Flags:** —
- **Required decision:** Confirm the 10-year felony window and the awaiting-trial limb. It is a distinct question from CRM-02, not a replacement for it.

### CRM-04 — matches_source

- **Section:** criminal
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.6 — SRC-083
- **Source text:** SRC-083 (Past 5 years): Within the past 5 years, have you pled guilty to or been convicted of a felony or misdemeanor (including DUI or DWI) or do you have such a charge currently pending against you?
- **Customer text:** In the past 5 years, have you pleaded guilty to or been convicted of a felony or misdemeanour, including DUI or DWI, or do you have such a charge currently pending?
- **Flags:** —
- **Required decision:** Confirm the 5-year misdemeanour and felony window, including DUI/DWI and a pending charge, matches SRC-083.

### CRM-05 — matches_source

- **Section:** criminal
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 6 months
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.5 — SRC-078
- **Source text:** SRC-078 (Past 6 months): Within the past 6 months, have you served or been released from incarceration, probation, parole, or other court-ordered supervision for a misdemeanor or felony conviction?
- **Customer text:** In the past 6 months, have you served, or been released from, incarceration, probation, parole, or other court-ordered supervision for a misdemeanour or felony conviction?
- **Flags:** —
- **Required decision:** Confirm the 6-month release-from-supervision question is asked separately from the conviction questions.

### CRM-06 — matches_source

- **Section:** criminal
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 10 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.5 — SRC-081
- **Source text:** SRC-081 (Past 10 years): In the past 10 years, have you served or been released from incarceration, probation, parole, or other court-ordered supervision for a misdemeanor or felony conviction?
- **Customer text:** In the past 10 years, have you served, or been released from, incarceration, probation, parole, or other court-ordered supervision for a misdemeanour or felony conviction?
- **Flags:** —
- **Required decision:** Confirm the 10-year release-from-supervision window. It overlaps CRM-05 on purpose; the source asks both.

### CRM-07 — matches_source

- **Section:** criminal
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Currently
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.6 — SRC-082
- **Source text:** SRC-082 (Currently): Are you currently under an order for probation, parole, or other court-ordered supervision for a misdemeanor or felony conviction?
- **Customer text:** Are you currently under an order for probation, parole, or other court-ordered supervision for a misdemeanour or felony conviction?
- **Flags:** —
- **Required decision:** Confirm the current-supervision question has no lookback and is asked on its own.

### FIN-01 — wording_changed

- **Section:** financial
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.6 — SRC-085
- **Source text:** SRC-085 (Ever): Have you or your spouse filed bankruptcy before? If so, what type?
- **Customer text:** Have you ever filed for bankruptcy, personally or for a business you owned?
- **Flags:** wording: Source asks 'Have you or your spouse filed bankruptcy before?'; the bank asks about the customer or a business they owned, and omits the spouse.; branching: The source's immediate 'If so, what type?' follow-up is split into a separate supplemental row.
- **Required decision:** Decide whether the spouse limb is asked. If it is deliberately excluded to avoid collecting a third party's data, record that as an approved revision.

### FIN-02 — added_by_lpp

- **Section:** financial
- **Status:** supplemental
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever
- **Source ref:** Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (bankruptcy detail)
- **Source text:** Not in the source questionnaire. Added by Life Policy Pilot.
- **Customer text:** A few details about the bankruptcy.
- **Flags:** attribution: Chapter, personal or business, discharge and pending status (SRC-086, SRC-087, SRC-089) are source questions presented as LPP additions.; omission: The date or anticipated date of discharge (SRC-088) is not collected.; branching: The row opens on 'unknown' as well as 'yes'; the source branches only on yes.
- **Required decision:** Reattribute the source-derived fields, add the discharge date, and confirm the unknown branch is intended.

### FIN-03 — matches_source

- **Section:** financial
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.6 — SRC-088
- **Source text:** SRC-088 (None stated): What was the date or anticipated date of discharge?
- **Customer text:** What was the date of discharge, or the anticipated date?
- **Flags:** —
- **Required decision:** Confirm the discharge-date question matches SRC-088 and accepts an anticipated date while the filing is still open.

### DRG-01 — matches_source

- **Section:** drugs
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 2 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.6 — SRC-090
- **Source text:** SRC-090 (Past 2 years): Within the past 2 years, have you used illegal drugs, abused alcohol or drugs, had or been recommended by a medical professional to have treatment or counseling for alcohol or drug use, or been advised to discontinue the use of alcohol or drugs?
- **Customer text:** In the past 2 years, have you used illegal drugs, abused alcohol or drugs, had or been recommended by a medical professional to have treatment or counseling for alcohol or drug use, or been advised to discontinue the use of alcohol or drugs?
- **Flags:** —
- **Required decision:** Confirm the 2-year question matches SRC-090, including the advice-to-discontinue limb.

### DRG-02 — matches_source

- **Section:** drugs
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.6 — SRC-091
- **Source text:** SRC-091 (Past 5 years): Within the past 5 years, have you used illegal drugs or abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or drugs, or to have treatment or counseling for alcohol or drugs?
- **Customer text:** In the past 5 years, have you used illegal drugs or abused alcohol or drugs, or had or been recommended by a medical professional or a licensed counselor to discontinue the use of alcohol or drugs, or to have treatment or counseling for alcohol or drugs?
- **Flags:** —
- **Required decision:** Confirm the 5-year question matches SRC-091, including the licensed-counselor limb.

### DRG-03 — matches_source

- **Section:** drugs
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Last 24 months
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.6 — SRC-094
- **Source text:** SRC-094 (Last 24 months): During the last 24 months, have you smoked marijuana for recreational purposes?
- **Customer text:** In the last 24 months, have you smoked marijuana for recreational purposes?
- **Flags:** —
- **Required decision:** Confirm the 24-month recreational-marijuana question. The earlier 12-month window and supply prompt are gone.

### DRG-04 — matches_source

- **Section:** drugs
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.6 — SRC-092
- **Source text:** SRC-092 (Ever): Have you ever used heroin, morphine, other narcotics, marijuana, cocaine, barbiturates, amphetamines, hallucinogenic drugs, or other habit-forming drugs except as prescribed by a physician?
- **Customer text:** Have you ever used heroin, morphine, other narcotics, marijuana, cocaine, barbiturates, amphetamines, hallucinogenic drugs, or other habit-forming drugs, except as prescribed by a physician?
- **Flags:** —
- **Required decision:** Confirm the ever question uses the source's named drug list and its physician-prescribed exception. The 'controlled substance' reframing is gone.

### DRG-05 — matches_source

- **Section:** drugs
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 7 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.6 — SRC-093
- **Source text:** SRC-093 (Past 7 years): Within the past 7 years, have you been advised by a medical professional to have treatment for, or reduce/discontinue the intake of prescription drugs?
- **Customer text:** In the past 7 years, have you been advised by a medical professional to have treatment for, or to reduce or discontinue, the intake of prescription drugs?
- **Flags:** —
- **Required decision:** Confirm the 7-year advice about prescription drugs is now asked. It was previously a coverage gap.

### DRG-06 — matches_source

- **Section:** drugs
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 10 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.6 — SRC-095
- **Source text:** SRC-095 (Past 10 years): In the past 10 years, have you been treated for drug abuse or used any drugs not prescribed to you?
- **Customer text:** In the past 10 years, have you been treated for drug abuse, or used any drugs not prescribed to you?
- **Flags:** —
- **Required decision:** Confirm the 10-year treatment and non-prescribed-use question matches SRC-095.

### DRG-07 — matches_source

- **Section:** drugs
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever / current
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.6 — SRC-096
- **Source text:** SRC-096 (None stated): Do you have any history of or current treatment for drug abuse?
- **Customer text:** Do you have any history of, or current treatment for, drug abuse?
- **Flags:** —
- **Required decision:** Confirm the no-window history and current-treatment question is asked on its own.

### RES-01 — wording_changed

- **Section:** residency
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** —
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.6 — SRC-097
- **Source text:** SRC-097 (Current): Is the Proposed Insured a U.S. Citizen or Permanent Resident? (If Permanent Resident, provide Visa or Green Card ID Number).
- **Customer text:** Which best describes your citizenship or residency status in the United States?
- **Flags:** wording: Source asks citizen or permanent resident and then requests a visa or green-card number. The bank adds 'another status' and 'prefer not to answer', and the number is held separately as RES-05.; branching: The source's visa or green-card follow-up has no approved branch; it is held, not asked.
- **Required decision:** Approve the added answer options, and record that the identity-number follow-up is out of scope for this intake.

### RES-02 — timeframe_changed

- **Section:** residency
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 5 years
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.7 — SRC-101, SRC-103
- **Source text:** SRC-101 (Past 5 years): Has the Proposed Insured lived consistently in the USA for the past 5 years? • SRC-103 (Past 2 years): What are the details of your previous and future foreign travel/residence, including pleasure and short business trips within the last 2 years? (Provide dates of visits, countries, regions, reason for visits, frequency, and duration of visits).
- **Customer text:** In the past 5 years, have you lived outside the United States for a month or more?
- **Flags:** timeframe: Source asks whether the insured lived consistently in the USA for 5 years, and separately asks for travel details in the last 2 years. The bank asks about living outside the USA for a month or more in the last 5 years, which is neither question.; wording: The 'consistently in the USA' test and the travel-detail request (dates, regions, reason, frequency, duration) are not asked.
- **Required decision:** Rewrite the row to the source's questions, or record it as an LPP addition with its own rationale.

### RES-03 — timeframe_changed

- **Section:** residency
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Next 12 months
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.7 — SRC-099, SRC-100
- **Source text:** SRC-099 (Next 2 years): Within the next 2 years, do you intend to work, travel, or reside in Saudi Arabia, Iraq, Afghanistan, Syria, Somalia, Sudan, or Yemen for more than 30 days, or reside outside the United States at any location more than 180 days? • SRC-100 (Next 24 months): Within the next 24 months, do you intend to work, travel, or reside outside of the U.S. for more than 30 days? (If yes, where?)
- **Customer text:** Do you plan to travel outside the United States in the next 12 months?
- **Flags:** timeframe: Source windows are the next 2 years / next 24 months; the bank asks about the next 12 months.; wording: The named-country list, the 30-day trip threshold and the 180-day residence threshold are all absent, as is the source's 'where?' follow-up.
- **Required decision:** Restore the 2-year window and the 30/180-day thresholds. The country list also needs review before it is shown to customers.

### RES-04 — held_for_review

- **Section:** residency
- **Status:** core
- **Review status:** human_review_required; **sourceVerified:** false
- **Timeframe:** —
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.6 — SRC-098
- **Source text:** SRC-098 (Current): If not a U.S. citizen, what is their immigration status or visa type?
- **Customer text:** Held for review: the source questionnaire asks for an immigration category.
- **Flags:** —
- **Required decision:** Obtain legal review of whether immigration status is necessary, and approve the answer set and wording if it is.

### RES-05 — held_for_review

- **Section:** residency
- **Status:** core
- **Review status:** human_review_required; **sourceVerified:** false
- **Timeframe:** —
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.6 — SRC-097
- **Source text:** SRC-097 (Current): Is the Proposed Insured a U.S. Citizen or Permanent Resident? (If Permanent Resident, provide Visa or Green Card ID Number).
- **Customer text:** Held for review: the source questionnaire asks for a visa or green-card number.
- **Flags:** —
- **Required decision:** Keep out of the automated intake. If ever required, collect it in an approved downstream workflow with documented necessity.

### RES-06 — matches_source

- **Section:** residency
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Future
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.7 — SRC-102
- **Source text:** SRC-102 (None stated): Does the Proposed Insured plan to move back to their native country?
- **Customer text:** Do you plan to move back to your native country?
- **Flags:** —
- **Required decision:** Confirm the return-migration question matches SRC-102.

### OCC-01 — wording_changed

- **Section:** occupation
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** —
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.7 — SRC-104, SRC-105, SRC-106
- **Source text:** SRC-104 (Current): What is your current occupation? • SRC-105 (Current): What is your annual salary? • SRC-106 (Past 6 months): Are you currently working full-time (minimum 30 hours a week), and have you done so for the past six months?
- **Customer text:** Tell us about your work.
- **Flags:** wording: SRC-106 asks whether you work full time (minimum 30 hours) and have done so for the past six months. The bank asks for typical hours per week and drops the 30-hour and six-month test.; branching: Three source questions (occupation, salary, full-time history) are merged into one compound without confirming each component.
- **Required decision:** Restore the 30-hour and six-month questions as their own components.

### OCC-02 — wording_changed

- **Section:** occupation
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Right now
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.7 — SRC-107, SRC-108
- **Source text:** SRC-107 (Current): Do you carry a weapon in your occupation? • SRC-108 (Current): Are you a member of any high-risk occupations (e.g., blasters & explosives handlers, structural workers/iron workers, underground miners, professional athletes, casino workers, firefighters, etc.)?
- **Customer text:** Does your work involve firearms, explosives, working at height, or another hazardous duty?
- **Flags:** wording: SRC-107 asks whether you carry a weapon; SRC-108 asks whether you belong to a listed high-risk occupation. The bank asks a single generic hazard question and adds working at height.; omission: The source's occupation examples (explosives handlers, iron workers, underground miners, professional athletes, casino workers, firefighters) are not shown.; timeframe: The bank adds a 'right now' window; the source questions carry no stated window.
- **Required decision:** Ask the two source questions separately and show the listed occupations, or record the approved revision.

### MIL-01 — timeframe_changed

- **Section:** military
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.7 — SRC-109
- **Source text:** SRC-109 (Current): Are you a member of the United States Military on active duty?
- **Customer text:** Have you ever served in the armed forces?
- **Flags:** timeframe: Source asks whether you are on active duty now. The bank asks whether you have ever served, which is a different population and a different window.; branching: Every military follow-up depends on this answer, so the incorrect frame changes which branches open.
- **Required decision:** Decide whether the row is current active duty (as sourced) or ever served (an LPP addition). If both, they must be separate rows with their own branches.

### MIL-02 — added_by_lpp

- **Section:** military
- **Status:** supplemental
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Ever
- **Source ref:** Not in Detialed-Life-insurance-Questions.pdf — Life Policy Pilot addition (military aviation duty)
- **Source text:** Not in the source questionnaire. Added by Life Policy Pilot.
- **Customer text:** Did your service include flying or aircraft duties?
- **Flags:** attribution: Flying time and duties aboard an aircraft (SRC-111, SRC-113) are source questions presented as LPP additions.; omission: Mission type (SRC-112: Combat Tactical/Recon, Combat Transport, Non-Combat Recon, Non-Combat Transport, Proficiency) is not asked.
- **Required decision:** Add the mission-type question and reattribute the source-derived fields.

### MIL-03 — timeframe_changed

- **Section:** military
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Past 12 months
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.7 — SRC-110
- **Source text:** SRC-110 (Current / planned): If Yes, are you currently deployed or do you have orders to be deployed in Saudi Arabia, Iraq, Afghanistan, Syria, Somalia, Sudan, or Yemen?
- **Customer text:** In the past 12 months, have you been on active duty or deployed?
- **Flags:** timeframe: Source asks about current deployment or orders to deploy, with no 12-month lookback. The bank asks about the past 12 months.; wording: The named countries and the 'orders to deploy' limb are not asked.; branching: The row branches on MIL-01's 'ever served' answer rather than on current active duty.
- **Required decision:** Align the row with SRC-110, including current deployment, orders, and the country list, or record the approved revision.

### MIL-04 — matches_source

- **Section:** military
- **Status:** core
- **Review status:** approved; **sourceVerified:** false
- **Timeframe:** Current
- **Source ref:** Detialed-Life-insurance-Questions.pdf, p.7 — SRC-112
- **Source text:** SRC-112 (None stated): Do you fly Combat Tactical/Recon, Combat Transport/Support/Supply, Non-Combat Recon, Non-Combat Transport, or for Proficiency only?
- **Customer text:** What kind of missions do you fly?
- **Flags:** —
- **Required decision:** Confirm the mission-type question matches SRC-112 and is asked only where service included flying or aircraft duties.

