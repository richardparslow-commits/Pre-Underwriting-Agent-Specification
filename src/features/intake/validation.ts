import type { LeadDetails } from "@/features/interview/types";

export type LeadErrors = Partial<Record<keyof LeadDetails, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Age in whole years on a given date, computed in UTC. */
export function ageOn(dateOfBirth: string, onDate = new Date()): number {
  const birth = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(birth.getTime())) return Number.NaN;
  let age = onDate.getUTCFullYear() - birth.getUTCFullYear();
  const month = onDate.getUTCMonth() - birth.getUTCMonth();
  if (month < 0 || (month === 0 && onDate.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

/**
 * Client-side validation only. The `submit-case` function repeats and hardens
 * every one of these checks: the browser is never the authority.
 */
export function validateLead(lead: Partial<LeadDetails>): LeadErrors {
  const errors: LeadErrors = {};

  if (!lead.firstName?.trim()) errors.firstName = "Enter your first name.";
  if (!lead.lastName?.trim()) errors.lastName = "Enter your last name.";
  if (!lead.state?.trim()) errors.state = "Choose your state of residence.";

  const dateOfBirth = lead.dateOfBirth?.trim() ?? "";
  if (!dateOfBirth) {
    errors.dateOfBirth = "Enter your date of birth.";
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    errors.dateOfBirth = "Enter a complete date of birth.";
  } else {
    const age = ageOn(dateOfBirth);
    if (!Number.isFinite(age) || age > 120) {
      errors.dateOfBirth = "Enter a valid date of birth.";
    } else if (age < 18) {
      errors.dateOfBirth = "This interview is only available to adults aged 18 or over.";
    }
  }

  if (!lead.email?.trim()) {
    errors.email = "Enter an email address for your review.";
  } else if (!EMAIL.test(lead.email.trim())) {
    errors.email = "That email address does not look complete.";
  }

  if (!lead.preferredContact) {
    errors.preferredContact = "Choose how you would like to be contacted.";
  }

  if (lead.adultAttested !== true) {
    errors.adultAttested = "Confirm that you are 18 or older and answering for yourself.";
  }

  const needsPhone = lead.preferredContact === "phone" || lead.preferredContact === "text";
  if (needsPhone) {
    const digits = phoneDigits(lead.phone ?? "");
    if (digits.length < 10) {
      errors.phone = "A phone number is needed for the contact method you chose.";
    }
  }

  return errors;
}

export function formatUsPhone(value: string): string {
  const digits = phoneDigits(value).slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
