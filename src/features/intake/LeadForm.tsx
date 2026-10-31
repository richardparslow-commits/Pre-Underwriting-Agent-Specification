import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/form";
import { Alert, Badge, Checkbox } from "@/components/ui/surface";
import { MARKETING, MARKETING_ENABLED, SITE } from "@/config/site";
import {
  CONTACT_PREFERENCES,
  MARKETING_CALL_LABEL,
  MARKETING_DISCLOSURE_TEXT,
  MARKETING_TEXT_LABEL,
  PRIVACY_ACKNOWLEDGEMENT_TEXT,
} from "@/features/consent/consentTexts";
import { US_STATES } from "./usStates";
import { formatUsPhone, validateLead, type LeadErrors } from "./validation";
import type { ConsentSelection } from "@/features/consent/consentTexts";
import type { LeadDetails } from "@/features/interview/types";
import { LEAD_TEXT_RULES } from "../../../supabase/functions/_shared/lead-validation";
import { cn } from "@/lib/utils";

interface LeadFormProps {
  lead: Partial<LeadDetails>;
  consent: ConsentSelection;
  onField: (field: keyof LeadDetails, value: string) => void;
  onAdultAttested: (value: boolean) => void;
  onConsent: (key: keyof ConsentSelection, value: boolean) => void;
  onContinue: () => void;
}

const ASSISTANCE_OPTIONS = [
  "Coverage questions",
  "Health-history review",
  "Application assistance",
  "Something else",
];

export function LeadForm({
  lead,
  consent,
  onField,
  onAdultAttested,
  onConsent,
  onContinue,
}: LeadFormProps) {
  const [errors, setErrors] = useState<LeadErrors>({});
  const [consentError, setConsentError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const latestAdultBirthDate = (() => {
    const date = new Date();
    date.setUTCFullYear(date.getUTCFullYear() - 18);
    return date.toISOString().slice(0, 10);
  })();

  const needsPhone = lead.preferredContact === "phone" || lead.preferredContact === "text";
  const marketingHeading =
    MARKETING.calls && MARKETING.texts
      ? "Marketing calls and texts are optional"
      : MARKETING.calls
        ? "Marketing calls are optional"
        : "Marketing texts are optional";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateLead(lead);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      if (firstKey) {
        const element = formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`);
        element?.focus();
      }
      return;
    }

    // Acknowledging the privacy practices is a required, separate permission,
    // not an optional box. The same rule is enforced by `submit-case`.
    if (!consent.privacyAcknowledged) {
      setConsentError("Acknowledge the privacy practices before continuing.");
      formRef.current?.querySelector<HTMLElement>("#privacy-ack")?.focus();
      return;
    }

    setConsentError(null);
    onContinue();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-8">
      <header className="space-y-3">
        <p className="eyebrow">Step 1 of 4 · Contact details</p>
        <h1 className="text-3xl leading-tight sm:text-4xl">Let&rsquo;s start with the basics</h1>
        <p className="prose-note max-w-2xl">
          This is a preliminary review request with {SITE.owner} at {SITE.brand}. It is not a
          carrier application, an offer of insurance, or an approval. Health questions come after
          you have seen how your information is handled.
        </p>
      </header>

      {Object.keys(errors).length > 0 ? (
        <Alert tone="danger" title="Check your contact details">
          <ul className="list-disc pl-5">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            name="firstName"
            maxLength={LEAD_TEXT_RULES.firstName.max}
            autoComplete="given-name"
            value={lead.firstName ?? ""}
            onChange={(event) => onField("firstName", event.target.value)}
            aria-invalid={Boolean(errors.firstName)}
            className="mt-1.5"
          />
          <FieldError>{errors.firstName}</FieldError>
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            name="lastName"
            maxLength={LEAD_TEXT_RULES.lastName.max}
            autoComplete="family-name"
            value={lead.lastName ?? ""}
            onChange={(event) => onField("lastName", event.target.value)}
            aria-invalid={Boolean(errors.lastName)}
            className="mt-1.5"
          />
          <FieldError>{errors.lastName}</FieldError>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="state">State of residence</Label>
          <Select
            id="state"
            name="state"
            value={lead.state ?? ""}
            onChange={(event) => onField("state", event.target.value)}
            aria-invalid={Boolean(errors.state)}
            className="mt-1.5"
          >
            <option value="">Select your state</option>
            {US_STATES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </Select>
          <p className="field-help">
            Recorded so the reviewer knows which state&rsquo;s rules apply to your request.
          </p>
          <FieldError>{errors.state}</FieldError>
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            max={latestAdultBirthDate}
            autoComplete="bday"
            value={lead.dateOfBirth ?? ""}
            onChange={(event) => onField("dateOfBirth", event.target.value)}
            aria-invalid={Boolean(errors.dateOfBirth)}
            className="mt-1.5"
          />
          <p className="field-help">
            This interview is only for adults aged 18 or over answering for themselves.
          </p>
          <FieldError>{errors.dateOfBirth}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            maxLength={LEAD_TEXT_RULES.email.max}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={lead.email ?? ""}
            onChange={(event) => onField("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            className="mt-1.5"
          />
          <p className="field-help">
            Used to reply to you about this request. No automated confirmation email is sent.
          </p>
          <FieldError>{errors.email}</FieldError>
        </div>
      </div>

      <fieldset>
        <legend className="field-label">How would you like to be contacted?</legend>
        <p className="field-help mb-3">
          This is about your requested response, not marketing. Choosing email does not enrol you
          in calls or texts.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CONTACT_PREFERENCES.map((option) => {
            const checked = lead.preferredContact === option.value;
            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border px-3.5 py-3 text-sm transition-colors",
                  checked
                    ? "border-primary bg-primary/[0.04] font-medium"
                    : "border-border bg-card hover:border-input",
                )}
              >
                <input
                  type="radio"
                  name="preferredContact"
                  value={option.value}
                  checked={checked}
                  onChange={() => onField("preferredContact", option.value)}
                  className="h-4 w-4 accent-primary"
                />
                {option.label}
              </label>
            );
          })}
        </div>
        <FieldError>{errors.preferredContact}</FieldError>
      </fieldset>

      {needsPhone ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Telephone number</Label>
            <Input
              id="phone"
              name="phone"
              maxLength={LEAD_TEXT_RULES.phone.max}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(512) 555-0134"
              value={lead.phone ?? ""}
              onChange={(event) => onField("phone", formatUsPhone(event.target.value))}
              aria-invalid={Boolean(errors.phone)}
              className="mt-1.5"
            />
            <FieldError>{errors.phone}</FieldError>
          </div>
          <div>
            <Label htmlFor="preferredContactTime">Best time to reach you</Label>
            <Input
              id="preferredContactTime"
              name="preferredContactTime"
              maxLength={LEAD_TEXT_RULES.preferredContactTime.max}
              placeholder="Weekday mornings"
              value={lead.preferredContactTime ?? ""}
              onChange={(event) => onField("preferredContactTime", event.target.value)}
              aria-invalid={Boolean(errors.preferredContactTime)}
              aria-describedby="preferredContactTime-limit"
              className="mt-1.5"
            />
            <p id="preferredContactTime-limit" className="field-help">
              Up to {LEAD_TEXT_RULES.preferredContactTime.max} characters.
            </p>
            <FieldError>{errors.preferredContactTime}</FieldError>
            <p className="field-help">
              Include your time zone. We do not guess it from the area code.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="assistance">What would you like help with?</Label>
          <Select
            id="assistance"
            name="assistance"
            value={lead.assistance ?? ""}
            onChange={(event) => onField("assistance", event.target.value)}
            className="mt-1.5"
          >
            <option value="">Select one</option>
            {ASSISTANCE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <p className="field-help">
            Optional. You can also start the health-history questions without choosing anything
            here.
          </p>
        </div>
      </div>

      <details className="rounded-md border border-border bg-secondary/40 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">
          Optional coverage details
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Not part of the source questionnaire
          </span>
        </summary>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="coverageAmount">Coverage amount</Label>
            <Input
              id="coverageAmount"
              name="coverageAmount"
              maxLength={LEAD_TEXT_RULES.coverageAmount.max}
              placeholder="$500,000"
              value={lead.coverageAmount ?? ""}
              onChange={(event) => onField("coverageAmount", event.target.value)}
              aria-invalid={Boolean(errors.coverageAmount)}
              aria-describedby="coverageAmount-limit"
              className="mt-1.5"
            />
            <p id="coverageAmount-limit" className="field-help">
              Up to {LEAD_TEXT_RULES.coverageAmount.max} characters.
            </p>
            <FieldError>{errors.coverageAmount}</FieldError>
          </div>
          <div>
            <Label htmlFor="coveragePurpose">Purpose</Label>
            <Select
              id="coveragePurpose"
              name="coveragePurpose"
              value={lead.coveragePurpose ?? ""}
              onChange={(event) => onField("coveragePurpose", event.target.value)}
              className="mt-1.5"
            >
              <option value="">Select one</option>
              {[
                "Family protection",
                "Mortgage",
                "Income replacement",
                "Business",
                "Estate planning",
                "Other",
              ].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="termPreference">Term preference</Label>
            <Select
              id="termPreference"
              name="termPreference"
              value={lead.termPreference ?? ""}
              onChange={(event) => onField("termPreference", event.target.value)}
              className="mt-1.5"
            >
              <option value="">Select one</option>
              {["10 years", "15 years", "20 years", "25 years", "30 years", "Whole life", "Not sure"].map(
                (option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ),
              )}
            </Select>
          </div>
        </div>
        <p className="field-help mt-3">
          These are additional intake fields. They are not questions from the source
          questionnaire, and they do not affect any preliminary eligibility view.
        </p>
      </details>

      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg">Privacy and contact permissions</h2>
          <Badge tone="outline">Separate choices</Badge>
        </div>

        <div>
          <label className="flex gap-3 text-sm leading-relaxed">
            <Checkbox
              id="privacy-ack"
              checked={consent.privacyAcknowledged}
              onChange={(event) => {
                onConsent("privacyAcknowledged", event.target.checked);
                if (event.target.checked) setConsentError(null);
              }}
              aria-required="true"
              aria-invalid={Boolean(consentError)}
              aria-describedby={
                consentError ? "privacy-ack-text privacy-ack-error" : "privacy-ack-text"
              }
            />
            <span id="privacy-ack-text">
              {PRIVACY_ACKNOWLEDGEMENT_TEXT}{" "}
              <Link to="/privacy" className="link-quiet">
                Read the privacy practices
              </Link>
              .
            </span>
          </label>
          <FieldError id="privacy-ack-error">{consentError}</FieldError>
        </div>

        {MARKETING_ENABLED ? (
          <div className="hairline pt-4">
            <p className="text-sm font-medium">{marketingHeading}</p>
            <p className="field-help">
              Leaving any box unchecked does not stop your review and does not change how quickly
              you hear back. You can submit with every box off.
            </p>

            <div className="mt-3 space-y-2.5">
              {MARKETING.calls ? (
                <label className="flex gap-3 text-sm leading-relaxed">
                  <Checkbox
                    checked={consent.marketingCall}
                    onChange={(event) => onConsent("marketingCall", event.target.checked)}
                    disabled={!needsPhone}
                  />
                  <span>
                    {MARKETING_CALL_LABEL}
                    {!needsPhone ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Add a telephone number above to make this available.
                      </span>
                    ) : null}
                  </span>
                </label>
              ) : null}
              {MARKETING.texts ? (
                <label className="flex gap-3 text-sm leading-relaxed">
                  <Checkbox
                    checked={consent.marketingText}
                    onChange={(event) => onConsent("marketingText", event.target.checked)}
                    disabled={!needsPhone}
                  />
                  <span>
                    {MARKETING_TEXT_LABEL}
                    {!needsPhone ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Add a telephone number above to make this available.
                      </span>
                    ) : null}
                  </span>
                </label>
              ) : null}
            </div>

            <p
              id="marketing-disclosure"
              className="mt-4 text-xs leading-relaxed text-muted-foreground"
            >
              {MARKETING_DISCLOSURE_TEXT}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              <Link to="/privacy" className="link-quiet">
                Privacy Policy
              </Link>{" · "}
              <Link to="/messaging-terms" className="link-quiet">
                Messaging Terms
              </Link>
            </p>
            {SITE.legalReviewPending ? (
              <p className="mt-2 text-[0.7rem] uppercase tracking-[0.12em] text-warn">
                Draft wording — pending counsel review
              </p>
            ) : null}
          </div>
        ) : (
          <p className="hairline pt-4 text-sm leading-relaxed text-muted-foreground">
            We do not currently make marketing calls or send marketing texts, so no marketing
            consent is requested here. Submitting the interview never requires marketing consent.
          </p>
        )}
      </section>

      <div>
        <label className="flex gap-3 text-sm leading-relaxed">
          <Checkbox
            id="adult-attested"
            name="adultAttested"
            checked={lead.adultAttested === true}
            onChange={(event) => onAdultAttested(event.target.checked)}
            aria-required="true"
            aria-invalid={Boolean(errors.adultAttested)}
          />
          <span>
            I confirm that I am 18 or older and am answering these questions about myself. I am not
            completing this on behalf of another person.
          </span>
        </label>
        <FieldError>{errors.adultAttested}</FieldError>
      </div>

      <Alert tone="neutral">
        <div className="flex gap-3">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <p>
            We do not ask for Social Security numbers, payment details, passport, visa or green-card
            numbers, or identity-document scans in this interview. If something like that is ever
            needed, it belongs in a separate approved process, not a web chat.
          </p>
        </div>
      </Alert>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Answers stay in this tab until you submit. They are not saved to your browser.
        </p>
        <Button type="submit" size="lg">
          Continue to intake permission
          <ArrowRight aria-hidden />
        </Button>
      </div>
    </form>
  );
}
