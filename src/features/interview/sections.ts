import type { Section } from "./types";

/**
 * Interview sections. Order here is the order the customer sees; the question
 * bank references these ids only.
 */
export const SECTIONS: Section[] = [
  {
    id: "identity",
    title: "About you",
    shortTitle: "About you",
    blurb:
      "A few details to route your review. We do not ask for identifying document numbers in this interview.",
    order: 1,
  },
  {
    id: "medical",
    title: "Medical history",
    shortTitle: "Medical",
    blurb:
      "Conditions, treatment, testing and medications — with the original timeframes kept intact.",
    order: 2,
  },
  {
    id: "mental",
    title: "Mental health",
    shortTitle: "Mental health",
    blurb:
      "Asked respectfully and only as far as the review needs. You can skip anything you prefer not to answer.",
    order: 3,
  },
  {
    id: "nicotine",
    title: "Nicotine use",
    shortTitle: "Nicotine",
    blurb:
      "Cigarettes, cigars, pipes, vaping and other products, with dates and frequency rather than a single tobacco label.",
    order: 4,
  },
  {
    id: "alcohol",
    title: "Alcohol",
    shortTitle: "Alcohol",
    blurb: "Current use, any treatment or advice to stop, and alcohol-related legal events.",
    order: 5,
  },
  {
    id: "aviation",
    title: "Aviation",
    shortTitle: "Aviation",
    blurb: "Flying as pilot or crew — current, recent and planned.",
    order: 6,
  },
  {
    id: "avocations",
    title: "Other avocations",
    shortTitle: "Avocations",
    blurb: "Climbing, racing, diving and other hazardous pursuits, asked one activity at a time.",
    order: 7,
  },
  {
    id: "driving",
    title: "Driving record",
    shortTitle: "Driving",
    blurb: "Licence status, violations and accidents across the source timeframes.",
    order: 8,
  },
  {
    id: "criminal",
    title: "Criminal history",
    shortTitle: "Criminal",
    blurb:
      "Charges and convictions are recorded separately — an arrest is not a conviction.",
    order: 9,
  },
  {
    id: "financial",
    title: "Bankruptcy",
    shortTitle: "Bankruptcy",
    blurb: "Business or personal filings, discharge and any pending matter.",
    order: 10,
  },
  {
    id: "drugs",
    title: "Drug use",
    shortTitle: "Drug use",
    blurb: "Prescribed and non-prescribed use, treatment and cannabis questions kept separate.",
    order: 11,
  },
  {
    id: "residency",
    title: "Residency and travel",
    shortTitle: "Residency",
    blurb:
      "Citizenship and residence, plus past and planned international travel. We do not ask for visa or green-card numbers.",
    order: 12,
  },
  {
    id: "occupation",
    title: "Occupation and finances",
    shortTitle: "Occupation",
    blurb: "Duties, hours and income — specific duties, not assumptions from a job title.",
    order: 13,
  },
  {
    id: "military",
    title: "Military service",
    shortTitle: "Military",
    blurb:
      "Service status and aviation duties only. No classified or operational details are requested.",
    order: 14,
  },
];

export const SECTION_BY_ID = new Map(SECTIONS.map((section) => [section.id, section]));
