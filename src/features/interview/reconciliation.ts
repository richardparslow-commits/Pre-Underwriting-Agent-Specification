/**
 * Reconciliation of the 92-row question bank against the controlled source
 * questionnaire (source/Detialed-Life-insurance-Questions.pdf).
 *
 * Every bank row has exactly one record here. A record names the source items
 * the row draws on, states a verdict, lists each mismatch as a flag, and names
 * the decision a reviewer has to make before the row can be signed off.
 *
 * Verdicts are deliberately blunt:
 *   matches_source    wording, timeframe and branching all follow the source
 *   split_source_compound  one source question (or one question carrying
 *                     several windows) is asked as separate rows, each
 *                     faithful to its own window or component
 *   wording_changed   wording, exclusions or omissions differ; windows agree
 *   timeframe_changed a single source window was replaced by a different one
 *   timeframe_merged  two or more source windows were collapsed into one
 *   added_by_lpp      not in the source; collected as a supplemental question
 *   not_in_source     presented as a source question but absent from the PDF
 *   held_for_review   intentionally not asked; waiting on approval
 *
 * A flag is a finding, not a fix. Nothing here rewrites customer-facing text:
 * that is the reviewer's decision and is recorded by flipping
 * `sourceVerified` on the bank row after sign-off.
 */

import type { SourceQuestion } from "./sourceInventory";
import { SOURCE_BY_ID, SOURCE_DOCUMENT } from "./sourceInventory";

export type ReconciliationVerdict =
  | "matches_source"
  | "split_source_compound"
  | "wording_changed"
  | "timeframe_changed"
  | "timeframe_merged"
  | "added_by_lpp"
  | "not_in_source"
  | "held_for_review";

export type FlagKind = "wording" | "timeframe" | "branching" | "attribution" | "omission";

export interface ReconciliationFlag {
  kind: FlagKind;
  detail: string;
}

export interface QuestionReconciliation {
  questionId: string;
  sourceIds: string[];
  verdict: ReconciliationVerdict;
  /** Short label used in the reviewer-facing source reference for LPP additions. */
  supplementalLabel?: string;
  flags: ReconciliationFlag[];
  /** The decision required before this row can be signed off. */
  action: string;
}

/**
 * Source questions that no bank row fully represents. Recorded so the coverage
 * audit can never claim a complete bank by silence.
 */
export type GapDisposition = "merge_into" | "add_question" | "hold" | "out_of_scope";

export interface SourceGap {
  sourceId: string;
  disposition: GapDisposition;
  /** Bank row that collects some or all of this item, when one exists. */
  target?: string;
  reason: string;
}

export const QUESTION_RECONCILIATION: QuestionReconciliation[] = [
  // ------------------------------------------------------------- identity
  {
    questionId: "ID-01",
    sourceIds: ["SRC-001"],
    verdict: "wording_changed",
    flags: [
      {
        kind: "wording",
        detail:
          "SRC-001 is one compound question (date of birth, age, state of birth). The bank collects date of birth only and does not confirm the split with the customer.",
      },
      {
        kind: "omission",
        detail: "Age and state of birth are not collected anywhere in the bank.",
      },
    ],
    action:
      "Decide whether to collect age and state of birth, or record why they are unnecessary. If the compound is split, add the confirmation step the specification requires.",
  },
  {
    questionId: "ID-02",
    sourceIds: ["SRC-001"],
    verdict: "wording_changed",
    flags: [
      {
        kind: "wording",
        detail:
          "Source asks for state of birth; the bank asks for city and country. That widens the question beyond the source and duplicates one component of SRC-001.",
      },
    ],
    action:
      "Narrow the question to state of birth, or document the widening as an approved revision with a reason.",
  },
  {
    questionId: "ID-03",
    sourceIds: [],
    verdict: "not_in_source",
    supplementalLabel: "current state of residence, added for routing",
    flags: [
      {
        kind: "attribution",
        detail:
          "Labelled a source question, but the PDF never asks for current state of residence. The specification asks for it separately for routing. Status corrected to supplemental.",
      },
    ],
    action:
      "Confirm the routing field stays supplemental and keeps its own label; it must not be counted as source coverage.",
  },
  {
    questionId: "ID-04",
    sourceIds: ["SRC-002"],
    verdict: "held_for_review",
    flags: [
      {
        kind: "wording",
        detail:
          "The source asks 'What is your Gender/Sex?'. No answer set or approved wording exists yet, so the row asks nothing.",
      },
    ],
    action:
      "Approve, reword or drop the sex/gender question, including the permitted answer set for each carrier and state.",
  },

  // ------------------------------------------------------------- medical
  {
    questionId: "MED-01",
    sourceIds: ["SRC-003"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm SRC-003's three limbs (morbid-obesity surgery, declined for coverage, incomplete or pending testing) are asked together and that the split from SRC-004 keeps the 12-month window.",
  },
  {
    questionId: "MED-02",
    sourceIds: ["SRC-004"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 12-month consultation, surgery, hospitalization and testing question, including the HIV/AIDS exclusion, is asked on its own.",
  },
  {
    questionId: "MED-03",
    sourceIds: ["SRC-005"],
    verdict: "matches_source",
    flags: [],
    action: "Confirm the 2-year condition list and the oxygen-equipment limb match SRC-005.",
  },
  {
    questionId: "MED-04",
    sourceIds: ["SRC-006"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 2-year cardiac-event and advised-surgery question matches SRC-006, including pacemaker and defibrillator.",
  },
  {
    questionId: "MED-06",
    sourceIds: ["SRC-007"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 3-year question stays separate from the 2-year question even though both mention bronchitis and COPD.",
  },
  {
    questionId: "MED-08",
    sourceIds: ["SRC-008"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 5-year internal-cancer, melanoma, Hodgkin's and lymphoma window. The skin-cancer exclusion added in the first pass is gone.",
  },
  {
    questionId: "MED-12",
    sourceIds: ["SRC-011"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 7-year heart and circulatory question, including high blood pressure, matches SRC-011.",
  },
  {
    questionId: "MED-13",
    sourceIds: ["SRC-012"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 7-year diabetes, digestive and liver question. It is separate from the 10-year diabetes question and from the supplemental detail row removed in this pass.",
  },
  {
    questionId: "MED-14",
    sourceIds: ["SRC-013"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 7-year respiratory question, including sleep apnea, matches SRC-013. The 6-month untreated-sleep-apnea nuance remains a separate gap.",
  },
  {
    questionId: "MED-15",
    sourceIds: ["SRC-015"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 7-year cancer, anemia, seizure and mental/nervous question. Confirm the 5-year cancer question above is not treated as a substitute.",
  },
  {
    questionId: "MED-16",
    sourceIds: ["SRC-016"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 7-year kidney, bladder, prostate, reproductive and STI question is appropriate to ask, and whether it needs a sensitive-handling note.",
  },
  {
    questionId: "MED-17",
    sourceIds: ["SRC-017"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 7-year connective tissue, lupus, arthritis and musculoskeletal question matches SRC-017.",
  },
  {
    questionId: "MED-18",
    sourceIds: ["SRC-018"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 10-year blood-pressure and cholesterol medication question is separate from the 7-year diagnosis question.",
  },
  {
    questionId: "MED-19",
    sourceIds: ["SRC-019"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 10-year diabetes, cancer and cardiac question. It deliberately repeats conditions asked in shorter windows because the source does.",
  },
  {
    questionId: "MED-09",
    sourceIds: ["SRC-029"],
    verdict: "wording_changed",
    flags: [
      {
        kind: "wording",
        detail:
          "Source asks for 'all your current medications, including herb and vitamin supplements'; the bank asks only for prescription medications taken regularly, so supplements are excluded.",
      },
    ],
    action: "Add herb and vitamin supplements, or record an approved reason for excluding them.",
  },
  {
    questionId: "MED-10",
    sourceIds: ["SRC-021", "SRC-022", "SRC-037"],
    verdict: "timeframe_changed",
    flags: [
      {
        kind: "timeframe",
        detail:
          "SRC-021 and SRC-022 are current-state questions; the bank asks about the past 5 years. SRC-037's 5-year window belongs to the mental-health section, not this medical row.",
      },
      {
        kind: "wording",
        detail:
          "SRC-021's disability benefits/pension limb and 30-hour full-time test, and SRC-022's hospital, nursing facility, hospice and home-health limbs, are merged into one sentence.",
      },
      {
        kind: "branching",
        detail: "Disability benefits and current confinement have different follow-ups but share one answer.",
      },
    ],
    action:
      "Separate current disability/confinement from the 5-year work-impact question, and restore the 30-hour and benefits wording.",
  },
  {
    questionId: "MED-11",
    sourceIds: ["SRC-009"],
    verdict: "held_for_review",
    flags: [],
    action:
      "Obtain documented legal, clinical and underwriting approval for asking about HIV/AIDS, including state restrictions and confidentiality handling.",
  },

  {
    questionId: "MED-20",
    sourceIds: ["SRC-014"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the separate recent or untreated sleep apnoea question matches SRC-014 rather than being folded into the 7-year respiratory row.",
  },
  {
    questionId: "MED-21",
    sourceIds: ["SRC-020"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the three-limb diabetes question matches SRC-020: diagnosis before 21, insulin now, or a listed complication.",
  },
  {
    questionId: "MED-22",
    sourceIds: ["SRC-023"],
    verdict: "matches_source",
    flags: [],
    action: "Confirm the 12-month mobility-aid question matches SRC-023.",
  },
  {
    questionId: "MED-23",
    sourceIds: ["SRC-024"],
    verdict: "matches_source",
    flags: [],
    action: "Confirm the organ-transplant question matches SRC-024.",
  },
  {
    questionId: "MED-24",
    sourceIds: ["SRC-025"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the current-confinement question matches SRC-025 and is asked at application time, as the source says.",
  },
  {
    questionId: "MED-25",
    sourceIds: ["SRC-026"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the family-history question matches SRC-026, including the before-age-60 window and the parent-or-sibling limit.",
  },
  {
    questionId: "MED-26",
    sourceIds: ["SRC-027"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the second family-history question matches SRC-027: more than one relative dying before 60 from the listed cancers or cardiovascular disease.",
  },
  // ------------------------------------------------------------- mental
  {
    questionId: "MH-01",
    sourceIds: ["SRC-030", "SRC-031", "SRC-015"],
    verdict: "wording_changed",
    flags: [
      {
        kind: "wording",
        detail:
          "SRC-031's condition list (bipolar, schizophrenia, PTSD, eating disorder, OCD, autism and others) is replaced by 'such as anxiety or depression'.",
      },
      {
        kind: "timeframe",
        detail: "SRC-015's 7-year mental or nervous disorder window is not represented.",
      },
      {
        kind: "branching",
        detail: "Bipolar and schizophrenia carry separate underwriting treatment but share one answer here.",
      },
    ],
    action:
      "Approve a condition list for the follow-up, and decide whether the 7-year mental/nervous window is asked separately.",
  },
  {
    questionId: "MH-02",
    sourceIds: [],
    verdict: "added_by_lpp",
    supplementalLabel: "mental health treatment detail",
    flags: [
      {
        kind: "attribution",
        detail:
          "Diagnosis timing and treatment type are LPP additions, but the source asks related questions (SRC-033 medication details, SRC-034 diagnosis and last seen, SRC-035 outpatient care, SRC-036 in-patient care) that this row does not reproduce.",
      },
    ],
    action:
      "Keep as supplemental, then decide which of SRC-033 to SRC-036 are added as source rows rather than folded into this detail.",
  },
  {
    questionId: "MH-03",
    sourceIds: ["SRC-037"],
    verdict: "wording_changed",
    flags: [
      {
        kind: "wording",
        detail:
          "Source asks whether you were 'unable to work'; the bank asks whether the condition caused you to 'miss work or stop working', which widens the question.",
      },
    ],
    action: "Align the wording with 'unable to work', or approve the widening explicitly.",
  },
  {
    questionId: "MH-04",
    sourceIds: ["SRC-038", "SRC-039"],
    verdict: "wording_changed",
    flags: [
      {
        kind: "branching",
        detail:
          "Two source questions (thoughts, and attempts with their detail request) are merged into one Yes/No, so a customer who has attempted cannot say so separately.",
      },
      {
        kind: "omission",
        detail: "SRC-039's required detail (date and follow-up treatment) is optional in this row.",
      },
    ],
    action:
      "Split thoughts from attempts, or confirm the merged wording with the customer as required for a compound question. Keep the crisis panel attached to either answer.",
  },
  {
    questionId: "MH-05",
    sourceIds: [],
    verdict: "added_by_lpp",
    supplementalLabel: "current crisis safety check",
    flags: [],
    action:
      "Confirm the crisis question is asked of every customer, whatever the answer to MH-04. It is no longer gated on a Yes, and `npm run check:bank` now fails if it is gated again.",
  },
  {
    questionId: "MH-06",
    sourceIds: ["SRC-039"],
    verdict: "held_for_review",
    flags: [],
    action:
      "Obtain clinical and legal approval for detail-level suicide questions, including crisis-support handling, before any collection.",
  },

  {
    questionId: "MH-07",
    sourceIds: ["SRC-035"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 5-year psychiatrist or hospital-outpatient question matches SRC-035 and is kept separate from the ever-diagnosed question.",
  },
  // ------------------------------------------------------------- nicotine
  {
    questionId: "NIC-01",
    sourceIds: ["SRC-040", "SRC-042"],
    verdict: "split_source_compound",
    flags: [],
    action:
      "SRC-040 carries the 12-month, 3-year and 5-year windows in one question. This row asks the 12-month limb, with type and amount on Yes and the source's occasional cigar/pipe exclusion. Confirm the split.",
  },
  {
    questionId: "NIC-02",
    sourceIds: ["SRC-040", "SRC-041"],
    verdict: "split_source_compound",
    flags: [],
    action:
      "This row asks the 36-month limb of SRC-040 and SRC-041 as its own question, rather than folding it into the 12-month answer. Confirm the separate window.",
  },
  {
    questionId: "NIC-03",
    sourceIds: ["SRC-040"],
    verdict: "split_source_compound",
    flags: [],
    action:
      "This row asks the 5-year limb of SRC-040, including its product definition. Confirm the window and that the longer window is asked separately from the shorter two.",
  },
  {
    questionId: "NIC-04",
    sourceIds: ["SRC-042"],
    verdict: "wording_changed",
    flags: [
      {
        kind: "branching",
        detail:
          "SRC-042 asks for the date last used only when the 12-month answer is No. This row also asks after an unsure answer, so an uncertain customer is not left without a last-use date.",
      },
    ],
    action:
      "Approve the extra unsure branch, or restrict the follow-up to a No exactly as the source does.",
  },

  // ------------------------------------------------------------- alcohol
  {
    questionId: "ALC-01",
    sourceIds: [],
    verdict: "not_in_source",
    supplementalLabel: "current alcohol use",
    flags: [
      {
        kind: "attribution",
        detail:
          "The source never asks whether you drink. It asks about abuse, treatment, advice to stop and infractions. This question is an LPP addition and was labelled a source question. Status corrected to supplemental.",
      },
    ],
    action:
      "Confirm the addition is wanted and keep it labelled supplemental, or remove it. It must not be counted as source coverage.",
  },
  {
    questionId: "ALC-02",
    sourceIds: ["SRC-043"],
    verdict: "matches_source",
    flags: [],
    action: "Confirm the 7-year abuse, treatment and advice-to-stop question matches SRC-043.",
  },
  {
    questionId: "ALC-03",
    sourceIds: ["SRC-047"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the restored alcohol/drug infraction wording, including excessive use and an admitted DWI or DUI within three years. The earlier narrowing to a licence action is gone.",
  },
  {
    questionId: "ALC-04",
    sourceIds: ["SRC-044"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 5-year question, including its drug limb and licensed-counselor wording, matches SRC-044.",
  },
  {
    questionId: "ALC-05",
    sourceIds: ["SRC-045"],
    verdict: "matches_source",
    flags: [],
    action: "Confirm the 10-year treatment question is asked on its own.",
  },
  {
    questionId: "ALC-06",
    sourceIds: ["SRC-046"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the no-window history question is kept separate from the 7, 5 and 10-year questions.",
  },

  // ------------------------------------------------------------- aviation
  {
    questionId: "AVI-01",
    sourceIds: ["SRC-048"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 12-month question matches SRC-048, including student pilots and crew. The earlier merged 'ever' row is gone.",
  },
  {
    questionId: "AVI-02",
    sourceIds: ["SRC-049"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 24-month question matches SRC-049, including 'contemplated' flights and student pilots, and that it is asked separately from the 12-month question.",
  },
  {
    questionId: "AVI-03",
    sourceIds: [],
    verdict: "added_by_lpp",
    supplementalLabel: "aviation detail",
    flags: [
      {
        kind: "attribution",
        detail:
          "Certificate (SRC-051), hours as pilot and crew (SRC-053) and aircraft types (SRC-054) are source questions presented as LPP additions.",
      },
      {
        kind: "omission",
        detail: "The complete schedule of flying time and the type of other flying are not collected.",
      },
      {
        kind: "branching",
        detail:
          "Aviation accidents, groundings, fines and reprimands (SRC-052) are an optional field in this detail step, asked only after a Yes to the 24-month question, rather than their own 'ever' question.",
      },
    ],
    action:
      "Reattribute the fields to the source questions they answer, add the missing schedule, and decide whether SRC-052 is asked as its own question.",
  },
  {
    questionId: "AVI-04",
    sourceIds: ["SRC-050"],
    verdict: "timeframe_changed",
    flags: [
      {
        kind: "timeframe",
        detail: "Source asks about flying within the next two years; the bank asks about the next 12 months.",
      },
      {
        kind: "wording",
        detail: "Source asks whether the type of flying will differ from past flying; the bank does not.",
      },
    ],
    action: "Set the window to two years to match the source, or record the approved reason for 12 months.",
  },

  // ------------------------------------------------------------- avocations
  {
    questionId: "AVO-01",
    sourceIds: ["SRC-055"],
    verdict: "timeframe_changed",
    flags: [
      {
        kind: "timeframe",
        detail: "Source asks about the past 2 years and the next 2 years intended; the bank asks about the past 5 years.",
      },
      {
        kind: "wording",
        detail:
          "The bank omits parachuting, hang gliding, rodeo events and professional sport, and adds 'another hazardous activity'.",
      },
      {
        kind: "branching",
        detail: "There is no 'intend to take part in the next 2 years' dimension, so planned participation never opens a branch.",
      },
    ],
    action:
      "Restore the 2-year windows and the full activity list, including the intended-participation half. Each activity needs its own branch.",
  },
  {
    questionId: "AVO-02",
    sourceIds: [],
    verdict: "added_by_lpp",
    supplementalLabel: "climbing detail",
    flags: [
      {
        kind: "attribution",
        detail:
          "Climbing years, frequency, areas and terrain (SRC-056 to SRC-058) are source questions presented as LPP additions.",
      },
      {
        kind: "omission",
        detail: "Bolted-route proportion (SRC-059) and climbing alone or without a rope (SRC-060) are not asked.",
      },
    ],
    action:
      "Add SRC-059 and SRC-060 as source questions, and reattribute the fields that already answer SRC-056 to SRC-058.",
  },
  {
    questionId: "AVO-03",
    sourceIds: [],
    verdict: "added_by_lpp",
    supplementalLabel: "racing detail",
    flags: [
      {
        kind: "attribution",
        detail:
          "Automobile or hydroplane racing (SRC-061), professional or cash prizes (SRC-063) and last race date (SRC-064) are source questions presented as LPP additions.",
      },
      {
        kind: "omission",
        detail: "Track type (SRC-062) and the last-race date are not collected.",
      },
    ],
    action: "Add track type and last race date, and reattribute the source-derived fields.",
  },
  {
    questionId: "AVO-04",
    sourceIds: [],
    verdict: "added_by_lpp",
    supplementalLabel: "diving detail",
    flags: [
      {
        kind: "attribution",
        detail:
          "Certification, depth and dive volume (SRC-065, SRC-066) are source questions presented as LPP additions.",
      },
      {
        kind: "omission",
        detail:
          "Hours of instruction and certification date, depth bands and their 12-month windows, equipment (SRC-067), locations (SRC-068) and salvage or exploration diving (SRC-069) are not asked.",
      },
    ],
    action:
      "Decide which source diving questions are collected, then add them as source rows rather than supplemental fields.",
  },
  {
    questionId: "AVO-05",
    sourceIds: [],
    verdict: "added_by_lpp",
    supplementalLabel: "skydiving detail",
    flags: [
      {
        kind: "attribution",
        detail: "Skydiving and hang gliding come from SRC-055, which this row is not traced to.",
      },
      {
        kind: "timeframe",
        detail: "The row uses a 5-year window; SRC-055 uses 2 years.",
      },
    ],
    action: "Trace the row to SRC-055 and align the window, or label it as an LPP addition with no source window.",
  },

  {
    questionId: "AVO-06",
    sourceIds: ["SRC-060"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the solo or unroped climbing question matches SRC-060, including the frequency, location and difficulty follow-up, and is asked only of climbers.",
  },
  {
    questionId: "AVO-07",
    sourceIds: ["SRC-069"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the salvage or exploration diving question matches SRC-069 and is asked only where scuba diving was selected.",
  },
  // ------------------------------------------------------------- driving
  {
    questionId: "DRV-01",
    sourceIds: ["SRC-072"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 24-month question keeps both limbs — suspension or revocation, and a DUI or DWI conviction — and that a charge alone does not count as a Yes.",
  },
  {
    questionId: "DRV-02",
    sourceIds: ["SRC-073"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 5-year question matches SRC-073, including a licence that is suspended today even if the suspension began earlier. The earlier merged 'ever' row is gone.",
  },
  {
    questionId: "DRV-03",
    sourceIds: ["SRC-075"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 5-year careless or reckless question asks about a conviction. The earlier 'ever charged' wording and its charge outcome prompt are gone.",
  },
  {
    questionId: "DRV-04",
    sourceIds: ["SRC-076"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 5-year threshold question asks both limbs — more than two moving violations and any alcohol- or drug-related infraction — and that the overlap with the alcohol section is intentional.",
  },
  {
    questionId: "DRV-05",
    sourceIds: ["SRC-077"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the ever window is restored and that the detail step records fault, as the source asks.",
  },

  {
    questionId: "DRV-06",
    sourceIds: ["SRC-071"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the valid-licence-today question matches SRC-071 and is asked before the suspension and conviction questions.",
  },
  {
    questionId: "DRV-07",
    sourceIds: ["SRC-074"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 5-year plea-or-conviction question matches SRC-074 and stays separate from the more-than-two threshold in DRV-04.",
  },
  // ------------------------------------------------------------- criminal
  {
    questionId: "CRM-01",
    sourceIds: ["SRC-084"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the ever window and that the detail prompts cover SRC-084's request for date of arrest, conviction, jail time, probation and parole.",
  },
  {
    questionId: "CRM-02",
    sourceIds: ["SRC-079"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 7-year felony window, including 'no contest' pleas, matches the source and stays separate from the 10-year window.",
  },
  {
    questionId: "CRM-03",
    sourceIds: ["SRC-080"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 10-year felony window and the awaiting-trial limb. It is a distinct question from CRM-02, not a replacement for it.",
  },
  {
    questionId: "CRM-04",
    sourceIds: ["SRC-083"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 5-year misdemeanour and felony window, including DUI/DWI and a pending charge, matches SRC-083.",
  },
  {
    questionId: "CRM-05",
    sourceIds: ["SRC-078"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 6-month release-from-supervision question is asked separately from the conviction questions.",
  },
  {
    questionId: "CRM-06",
    sourceIds: ["SRC-081"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 10-year release-from-supervision window. It overlaps CRM-05 on purpose; the source asks both.",
  },
  {
    questionId: "CRM-07",
    sourceIds: ["SRC-082"],
    verdict: "matches_source",
    flags: [],
    action: "Confirm the current-supervision question has no lookback and is asked on its own.",
  },

  // ------------------------------------------------------------- bankruptcy
  {
    questionId: "FIN-01",
    sourceIds: ["SRC-085"],
    verdict: "wording_changed",
    flags: [
      {
        kind: "wording",
        detail:
          "Source asks 'Have you or your spouse filed bankruptcy before?'; the bank asks about the customer or a business they owned, and omits the spouse.",
      },
      {
        kind: "branching",
        detail: "The source's immediate 'If so, what type?' follow-up is split into a separate supplemental row.",
      },
    ],
    action:
      "Decide whether the spouse limb is asked. If it is deliberately excluded to avoid collecting a third party's data, record that as an approved revision.",
  },
  {
    questionId: "FIN-02",
    sourceIds: [],
    verdict: "added_by_lpp",
    supplementalLabel: "bankruptcy detail",
    flags: [
      {
        kind: "attribution",
        detail:
          "Chapter, personal or business, discharge and pending status (SRC-086, SRC-087, SRC-089) are source questions presented as LPP additions.",
      },
      {
        kind: "omission",
        detail: "The date or anticipated date of discharge (SRC-088) is not collected.",
      },
      {
        kind: "branching",
        detail: "The row opens on 'unknown' as well as 'yes'; the source branches only on yes.",
      },
    ],
    action: "Reattribute the source-derived fields, add the discharge date, and confirm the unknown branch is intended.",
  },

  {
    questionId: "FIN-03",
    sourceIds: ["SRC-088"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the discharge-date question matches SRC-088 and accepts an anticipated date while the filing is still open.",
  },
  // ------------------------------------------------------------- drugs
  {
    questionId: "DRG-01",
    sourceIds: ["SRC-090"],
    verdict: "matches_source",
    flags: [],
    action: "Confirm the 2-year question matches SRC-090, including the advice-to-discontinue limb.",
  },
  {
    questionId: "DRG-02",
    sourceIds: ["SRC-091"],
    verdict: "matches_source",
    flags: [],
    action: "Confirm the 5-year question matches SRC-091, including the licensed-counselor limb.",
  },
  {
    questionId: "DRG-03",
    sourceIds: ["SRC-094"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 24-month recreational-marijuana question. The earlier 12-month window and supply prompt are gone.",
  },
  {
    questionId: "DRG-04",
    sourceIds: ["SRC-092"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the ever question uses the source's named drug list and its physician-prescribed exception. The 'controlled substance' reframing is gone.",
  },
  {
    questionId: "DRG-05",
    sourceIds: ["SRC-093"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the 7-year advice about prescription drugs is now asked. It was previously a coverage gap.",
  },
  {
    questionId: "DRG-06",
    sourceIds: ["SRC-095"],
    verdict: "matches_source",
    flags: [],
    action: "Confirm the 10-year treatment and non-prescribed-use question matches SRC-095.",
  },
  {
    questionId: "DRG-07",
    sourceIds: ["SRC-096"],
    verdict: "matches_source",
    flags: [],
    action: "Confirm the no-window history and current-treatment question is asked on its own.",
  },

  // ------------------------------------------------------------- residency
  {
    questionId: "RES-01",
    sourceIds: ["SRC-097"],
    verdict: "wording_changed",
    flags: [
      {
        kind: "wording",
        detail:
          "Source asks citizen or permanent resident and then requests a visa or green-card number. The bank adds 'another status' and 'prefer not to answer', and the number is held separately as RES-05.",
      },
      {
        kind: "branching",
        detail: "The source's visa or green-card follow-up has no approved branch; it is held, not asked.",
      },
    ],
    action:
      "Approve the added answer options, and record that the identity-number follow-up is out of scope for this intake.",
  },
  {
    questionId: "RES-02",
    sourceIds: ["SRC-101", "SRC-103"],
    verdict: "timeframe_changed",
    flags: [
      {
        kind: "timeframe",
        detail:
          "Source asks whether the insured lived consistently in the USA for 5 years, and separately asks for travel details in the last 2 years. The bank asks about living outside the USA for a month or more in the last 5 years, which is neither question.",
      },
      {
        kind: "wording",
        detail: "The 'consistently in the USA' test and the travel-detail request (dates, regions, reason, frequency, duration) are not asked.",
      },
    ],
    action: "Rewrite the row to the source's questions, or record it as an LPP addition with its own rationale.",
  },
  {
    questionId: "RES-03",
    sourceIds: ["SRC-099", "SRC-100"],
    verdict: "timeframe_changed",
    flags: [
      {
        kind: "timeframe",
        detail: "Source windows are the next 2 years / next 24 months; the bank asks about the next 12 months.",
      },
      {
        kind: "wording",
        detail:
          "The named-country list, the 30-day trip threshold and the 180-day residence threshold are all absent, as is the source's 'where?' follow-up.",
      },
    ],
    action:
      "Restore the 2-year window and the 30/180-day thresholds. The country list also needs review before it is shown to customers.",
  },
  {
    questionId: "RES-04",
    sourceIds: ["SRC-098"],
    verdict: "held_for_review",
    flags: [],
    action:
      "Obtain legal review of whether immigration status is necessary, and approve the answer set and wording if it is.",
  },
  {
    questionId: "RES-05",
    sourceIds: ["SRC-097"],
    verdict: "held_for_review",
    flags: [],
    action:
      "Keep out of the automated intake. If ever required, collect it in an approved downstream workflow with documented necessity.",
  },

  {
    questionId: "RES-06",
    sourceIds: ["SRC-102"],
    verdict: "matches_source",
    flags: [],
    action: "Confirm the return-migration question matches SRC-102.",
  },
  // ------------------------------------------------------------- occupation
  {
    questionId: "OCC-01",
    sourceIds: ["SRC-104", "SRC-105", "SRC-106"],
    verdict: "wording_changed",
    flags: [
      {
        kind: "wording",
        detail:
          "SRC-106 asks whether you work full time (minimum 30 hours) and have done so for the past six months. The bank asks for typical hours per week and drops the 30-hour and six-month test.",
      },
      {
        kind: "branching",
        detail: "Three source questions (occupation, salary, full-time history) are merged into one compound without confirming each component.",
      },
    ],
    action: "Restore the 30-hour and six-month questions as their own components.",
  },
  {
    questionId: "OCC-02",
    sourceIds: ["SRC-107", "SRC-108"],
    verdict: "wording_changed",
    flags: [
      {
        kind: "wording",
        detail:
          "SRC-107 asks whether you carry a weapon; SRC-108 asks whether you belong to a listed high-risk occupation. The bank asks a single generic hazard question and adds working at height.",
      },
      {
        kind: "omission",
        detail:
          "The source's occupation examples (explosives handlers, iron workers, underground miners, professional athletes, casino workers, firefighters) are not shown.",
      },
      {
        kind: "timeframe",
        detail: "The bank adds a 'right now' window; the source questions carry no stated window.",
      },
    ],
    action: "Ask the two source questions separately and show the listed occupations, or record the approved revision.",
  },

  // ------------------------------------------------------------- military
  {
    questionId: "MIL-01",
    sourceIds: ["SRC-109"],
    verdict: "timeframe_changed",
    flags: [
      {
        kind: "timeframe",
        detail:
          "Source asks whether you are on active duty now. The bank asks whether you have ever served, which is a different population and a different window.",
      },
      {
        kind: "branching",
        detail: "Every military follow-up depends on this answer, so the incorrect frame changes which branches open.",
      },
    ],
    action:
      "Decide whether the row is current active duty (as sourced) or ever served (an LPP addition). If both, they must be separate rows with their own branches.",
  },
  {
    questionId: "MIL-02",
    sourceIds: [],
    verdict: "added_by_lpp",
    supplementalLabel: "military aviation duty",
    flags: [
      {
        kind: "attribution",
        detail:
          "Flying time and duties aboard an aircraft (SRC-111, SRC-113) are source questions presented as LPP additions.",
      },
      {
        kind: "omission",
        detail: "Mission type (SRC-112: Combat Tactical/Recon, Combat Transport, Non-Combat Recon, Non-Combat Transport, Proficiency) is not asked.",
      },
    ],
    action: "Add the mission-type question and reattribute the source-derived fields.",
  },
  {
    questionId: "MIL-03",
    sourceIds: ["SRC-110"],
    verdict: "timeframe_changed",
    flags: [
      {
        kind: "timeframe",
        detail:
          "Source asks about current deployment or orders to deploy, with no 12-month lookback. The bank asks about the past 12 months.",
      },
      {
        kind: "wording",
        detail: "The named countries and the 'orders to deploy' limb are not asked.",
      },
      {
        kind: "branching",
        detail: "The row branches on MIL-01's 'ever served' answer rather than on current active duty.",
      },
    ],
    action:
      "Align the row with SRC-110, including current deployment, orders, and the country list, or record the approved revision.",
  },
  {
    questionId: "MIL-04",
    sourceIds: ["SRC-112"],
    verdict: "matches_source",
    flags: [],
    action:
      "Confirm the mission-type question matches SRC-112 and is asked only where service included flying or aircraft duties.",
  },

];

export const SOURCE_GAPS: SourceGap[] = [
  {
    sourceId: "SRC-010",
    disposition: "out_of_scope",
    reason:
      "A blanket five-year check-up, laboratory-study and consultation question would be answered Yes by almost every applicant and does not discriminate risk. MED-01 and MED-02 already ask about consultations and testing within the past 12 months, so the longer window adds burden without changing the review. Recorded out of scope deliberately.",
  },
  {
    sourceId: "SRC-028",
    disposition: "merge_into",
    target: "MED-01",
    reason:
      "The treatment or medication given for a disclosed condition is only partly collected through MED-01's free-text prompt and is not tied to each condition row.",
  },
  {
    sourceId: "SRC-032",
    disposition: "out_of_scope",
    reason:
      "Mild or situational depression or anxiety within six months is already captured by MH-01 (ever diagnosed or treated) and by MH-02 (inpatient care as a treatment type). A second, more sensitive six-month question would add burden without changing routing. Recorded out of scope deliberately.",
  },
  {
    sourceId: "SRC-033",
    disposition: "out_of_scope",
    reason:
      "Current prescription names, dosage and frequency are already collected by the general medication question MED-09. Asking again only for mental-health medication would duplicate it and single out a sensitive condition. Recorded out of scope deliberately.",
  },
  {
    sourceId: "SRC-034",
    disposition: "merge_into",
    target: "MH-02",
    reason: "Diagnosis year is collected, but the date last seen is not.",
  },
  {
    sourceId: "SRC-036",
    disposition: "merge_into",
    target: "MH-02",
    reason: "In-patient care is offered as a treatment-type option, but the source's 5-year window is not recorded.",
  },
  {
    sourceId: "SRC-051",
    disposition: "merge_into",
    target: "AVI-02",
    reason: "Certificate or rating is collected as a free-text field, without the source's Student/Private/Commercial/ATP options.",
  },
  {
    sourceId: "SRC-052",
    disposition: "merge_into",
    target: "AVI-03",
    reason:
      "An optional field in the aviation detail step asks about accidents, groundings, fines and reprimands, but it is asked only after a Yes to the 24-month flight question and the categories are not distinguished.",
  },
  {
    sourceId: "SRC-053",
    disposition: "merge_into",
    target: "AVI-02",
    reason:
      "Total flying hours are collected, but not separately as pilot and crew, and the complete schedule of flying time is not captured.",
  },
  {
    sourceId: "SRC-054",
    disposition: "merge_into",
    target: "AVI-02",
    reason: "Aircraft types are collected, but other flying (crop dusting, mapping, surveying, testing) is not.",
  },
  {
    sourceId: "SRC-056",
    disposition: "merge_into",
    target: "AVO-02",
    reason: "Climbing frequency is collected, but the number of years climbing regularly is not.",
  },
  {
    sourceId: "SRC-057",
    disposition: "merge_into",
    target: "AVO-02",
    reason: "A free-text location field exists, but the source's named regions (Alaska, Alps, Africa, Himalayas) are not offered.",
  },
  {
    sourceId: "SRC-058",
    disposition: "merge_into",
    target: "AVO-02",
    reason:
      "Climbing type is collected, but terrain, difficulty grade, maximum height and season are not.",
  },
  {
    sourceId: "SRC-059",
    disposition: "out_of_scope",
    reason:
      "The proportion of climbing on bolted routes is supporting detail. AVO-02 already records climbing type, frequency and location, and AVO-06 asks about solo or unroped climbing, which is the risk the bolt proportion would otherwise stand in for. Recorded out of scope deliberately.",
  },
  {
    sourceId: "SRC-061",
    disposition: "merge_into",
    target: "AVO-03",
    reason:
      "Racing is collected as an activity and a free-text type, but automobile versus hydroplane and intended participation in the next 2 years are not distinguished.",
  },
  {
    sourceId: "SRC-062",
    disposition: "out_of_scope",
    reason:
      "Track configuration is supporting detail behind the racing question. AVO-03 already records what the customer races, the level and the number of events a year. Recorded out of scope deliberately.",
  },
  {
    sourceId: "SRC-063",
    disposition: "merge_into",
    target: "AVO-03",
    reason: "A professional amateurs-to-professional level field exists, but racing for cash prizes is not asked.",
  },
  {
    sourceId: "SRC-064",
    disposition: "out_of_scope",
    reason:
      "The date of the last race is recency detail. AVO-03 records events per year, which is the frequency the review uses. Recorded out of scope deliberately.",
  },
  {
    sourceId: "SRC-065",
    disposition: "merge_into",
    target: "AVO-04",
    reason:
      "A certification level is collected, but hours of instruction, date of certification and the reason for not being certified are not.",
  },
  {
    sourceId: "SRC-066",
    disposition: "merge_into",
    target: "AVO-04",
    reason:
      "Maximum depth is collected as one free-text field. Dive count, average time underwater in the 40/60/100+ ft bands, and the last and next 12 months are not.",
  },
  {
    sourceId: "SRC-067",
    disposition: "out_of_scope",
    reason:
      "Diving equipment is supporting detail. AVO-04 records diving type, certification level, maximum depth and dives per year. Recorded out of scope deliberately.",
  },
  {
    sourceId: "SRC-068",
    disposition: "out_of_scope",
    reason:
      "Dive locations and water types are supporting detail behind the depth and diving-type answers already collected in AVO-04. Recorded out of scope deliberately.",
  },
  {
    sourceId: "SRC-070",
    disposition: "out_of_scope",
    reason:
      "Membership of an organised climbing or diving club has no underwriting weight on its own; the activity, level and frequency are already collected. Recorded out of scope deliberately.",
  },
  {
    sourceId: "SRC-086",
    disposition: "merge_into",
    target: "FIN-02",
    reason: "Personal or business filing is collected, but the source's 'if Chapter 7' condition is not.",
  },
  {
    sourceId: "SRC-087",
    disposition: "merge_into",
    target: "FIN-02",
    reason: "Discharge status is collected as one option among several, without a dedicated yes/no.",
  },
  {
    sourceId: "SRC-089",
    disposition: "merge_into",
    target: "FIN-02",
    reason: "A still-pending option exists, but the source asks whether the bankruptcy is still in process as its own question.",
  },
  {
    sourceId: "SRC-111",
    disposition: "merge_into",
    target: "MIL-02",
    reason: "Approximate flying hours are collected, but not the complete schedule of military flying time.",
  },
  {
    sourceId: "SRC-113",
    disposition: "merge_into",
    target: "MIL-02",
    reason: "Role is collected as pilot, air crew or maintenance, which only partly answers 'assigned duties aboard the aircraft'.",
  },
];

// ----------------------------------------------------------------- helpers

export const RECONCILIATION_BY_ID: Record<string, QuestionReconciliation> = Object.fromEntries(
  QUESTION_RECONCILIATION.map((record) => [record.questionId, record]),
);

export const GAP_BY_SOURCE_ID: Record<string, SourceGap> = Object.fromEntries(
  SOURCE_GAPS.map((gap) => [gap.sourceId, gap]),
);

/** Source ids each bank question is traced to. */
export function sourceIdsFor(questionId: string): string[] {
  return RECONCILIATION_BY_ID[questionId]?.sourceIds ?? [];
}

export function sourceQuestionsFor(questionId: string): SourceQuestion[] {
  return sourceIdsFor(questionId)
    .map((id) => SOURCE_BY_ID[id])
    .filter((question): question is SourceQuestion => Boolean(question));
}

function pageLabel(pages: number[]): string {
  if (pages.length === 0) return "";
  const unique = [...new Set(pages)].sort((a, b) => a - b);
  if (unique.length === 1) return `p.${unique[0]}`;
  return `pp.${unique[0]}–${unique[unique.length - 1]}`;
}

/**
 * Locator shown to the reviewer and stored in the submitted case, e.g.
 * "Detialed-Life-insurance-Questions.pdf, p.1 — SRC-003, SRC-004".
 */
export function sourceRefFor(questionId: string): string {
  const record = RECONCILIATION_BY_ID[questionId];
  if (!record) return `${SOURCE_DOCUMENT.fileName} — no reconciliation record`;

  const questions = sourceQuestionsFor(questionId);
  if (questions.length === 0) {
    return `Not in ${SOURCE_DOCUMENT.fileName} — Life Policy Pilot addition${
      record.supplementalLabel ? ` (${record.supplementalLabel})` : ""
    }`;
  }

  const pages = pageLabel(questions.map((question) => question.page));
  return `${SOURCE_DOCUMENT.fileName}, ${pages} — ${questions.map((question) => question.id).join(", ")}`;
}

/**
 * The source wording behind a bank question, with each source id and its own
 * window, so a merged row shows every question it merged rather than one.
 */
export function sourceTextFor(questionId: string): string {
  const questions = sourceQuestionsFor(questionId);
  if (questions.length === 0) {
    return "Not in the source questionnaire. Added by Life Policy Pilot.";
  }
  return questions
    .map((question) => `${question.id} (${question.timeframe}): ${question.text}`)
    .join(" • ");
}

const SOURCE_INVENTORY_IDS = Object.keys(SOURCE_BY_ID);

/** Source ids that no bank row acknowledges. Must always be empty. */
export function unacknowledgedSourceIds(): string[] {
  const referenced = new Set(QUESTION_RECONCILIATION.flatMap((record) => record.sourceIds));
  return SOURCE_INVENTORY_IDS.filter((id) => !referenced.has(id) && !GAP_BY_SOURCE_ID[id]);
}

export interface ReconciliationSummary {
  rows: number;
  byVerdict: Record<ReconciliationVerdict, number>;
  byFlag: Record<FlagKind, number>;
  rowsWithFlags: number;
  sourceItems: number;
  sourceItemsTraced: number;
  gaps: Record<GapDisposition, number>;
}

export function reconciliationSummary(): ReconciliationSummary {
  const byVerdict: Record<ReconciliationVerdict, number> = {
    matches_source: 0,
    split_source_compound: 0,
    wording_changed: 0,
    timeframe_changed: 0,
    timeframe_merged: 0,
    added_by_lpp: 0,
    not_in_source: 0,
    held_for_review: 0,
  };
  const byFlag: Record<FlagKind, number> = {
    wording: 0,
    timeframe: 0,
    branching: 0,
    attribution: 0,
    omission: 0,
  };

  for (const record of QUESTION_RECONCILIATION) {
    byVerdict[record.verdict] += 1;
    for (const flag of record.flags) byFlag[flag.kind] += 1;
  }

  const gaps: Record<GapDisposition, number> = {
    merge_into: 0,
    add_question: 0,
    hold: 0,
    out_of_scope: 0,
  };
  for (const gap of SOURCE_GAPS) gaps[gap.disposition] += 1;

  const traced = new Set(QUESTION_RECONCILIATION.flatMap((record) => record.sourceIds));

  return {
    rows: QUESTION_RECONCILIATION.length,
    byVerdict,
    byFlag,
    rowsWithFlags: QUESTION_RECONCILIATION.filter((record) => record.flags.length > 0).length,
    sourceItems: SOURCE_INVENTORY_IDS.length,
    sourceItemsTraced: traced.size,
    gaps,
  };
}

export { SOURCE_INVENTORY_IDS };
