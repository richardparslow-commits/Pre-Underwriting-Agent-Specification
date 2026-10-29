/** Pure browser/server contract. This module contains no server credentials or runtime imports. */
export const LEAD_TEXT_RULES = {
  firstName: { max: 100, label: "First name" },
  lastName: { max: 100, label: "Last name" },
  email: { max: 254, label: "Email address" },
  phone: { max: 40, label: "Telephone number" },
  preferredContactTime: { max: 120, label: "Best time to reach you" },
  timeZone: { max: 80, label: "Time zone" },
  assistance: { max: 200, label: "Assistance" },
  coverageAmount: { max: 60, label: "Coverage amount" },
  coveragePurpose: { max: 120, label: "Coverage purpose" },
  termPreference: { max: 60, label: "Term preference" },
} as const;

type LeadTextField = keyof typeof LEAD_TEXT_RULES;

export function leadTextErrors(lead: Partial<Record<LeadTextField, unknown>>) {
  const errors: Partial<Record<LeadTextField, string>> = {};
  for (const field of Object.keys(LEAD_TEXT_RULES) as LeadTextField[]) {
    const value = lead[field];
    if (value === undefined || value === null) continue;
    const rule = LEAD_TEXT_RULES[field];
    if (typeof value !== "string") {
      errors[field] = `${rule.label} must be text.`;
    } else if (value.trim().length > rule.max) {
      errors[field] = `${rule.label} must be ${rule.max} characters or fewer.`;
    }
  }
  return errors;
}
