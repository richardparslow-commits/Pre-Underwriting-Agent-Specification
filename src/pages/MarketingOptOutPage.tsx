import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/form";
import { Alert, Badge } from "@/components/ui/surface";
import { MARKETING_ENABLED, SITE } from "@/config/site";
import { normaliseUsPhone } from "@/features/intake/validation";
import {
  requestMarketingRevocation,
  type MarketingRevocationResult,
} from "@/lib/marketing";

const REFERENCE_PATTERN = /^LPP-\d{4}-[0-9A-Z]{6,12}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface FormErrors {
  reference?: string;
  contact?: string;
  phone?: string;
  email?: string;
  reason?: string;
}

export default function MarketingOptOutPage() {
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MarketingRevocationResult | null>(null);

  function validate(): FormErrors {
    const next: FormErrors = {};
    const normalisedReference = reference.trim().toUpperCase();

    if (!normalisedReference) {
      next.reference = "Enter your case reference.";
    } else if (!REFERENCE_PATTERN.test(normalisedReference)) {
      next.reference = "Enter the reference exactly as it appears on your case.";
    }

    const suppliedPhone = phone.trim();
    const suppliedEmail = email.trim();

    if (!suppliedPhone && !suppliedEmail) {
      next.contact = "Enter the email address or telephone number on your case.";
    }
    if (suppliedPhone && !normaliseUsPhone(suppliedPhone)) {
      next.phone = "Enter a valid 10-digit telephone number.";
    }
    if (suppliedEmail && !EMAIL_PATTERN.test(suppliedEmail)) {
      next.email = "Enter a valid email address.";
    }
    if (reason.trim().length > 500) {
      next.reason = "Keep the reason under 500 characters.";
    }

    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const normalisedPhone = phone.trim() ? normaliseUsPhone(phone) : null;
      const response = await requestMarketingRevocation({
        reference: reference.trim().toUpperCase(),
        phone: normalisedPhone ?? undefined,
        email: email.trim() || undefined,
        reason: reason.trim() || undefined,
      });
      setResult(response);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The request could not be recorded. Please email us using the address on this page.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setReference("");
    setPhone("");
    setEmail("");
    setReason("");
    setErrors({});
    setError(null);
    setResult(null);
  }

  if (result) {
    return (
      <div className="container max-w-2xl py-14">
        <div className="space-y-3">
          <p className="eyebrow">Marketing opt-out</p>
          <h1 className="text-3xl leading-tight sm:text-4xl">Your request was received</h1>
        </div>

        <Alert
          tone={result.preview ? "warn" : "ok"}
          title={result.preview ? "Preview mode — no request was sent" : "Suppression request recorded"}
          className="mt-8"
        >
          {result.preview ? (
            <>
              This build has no backend, so nothing was sent. To record a real request, email{" "}
              <a href={`mailto:${SITE.reviewerEmail}`} className="link-quiet">
                {SITE.reviewerEmail}
              </a>{" "}
              from the address on your case and quote your reference.
            </>
          ) : (
            <>
              If the case reference and contact details match a case, the matching phone or email is
              suppressed for future marketing immediately. We do not confirm whether a match was
              found, because that would disclose case details.
            </>
          )}
        </Alert>

        <section className="panel mt-6 space-y-3 p-6">
          <h2 className="text-lg">What this does and does not do</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            It stops future marketing calls or texts to the contact details you supplied. It does not
            cancel your requested review, delete your case, or change any interview answer.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            If you need written confirmation, or the details on your case have changed, email{" "}
            <a href={`mailto:${SITE.reviewerEmail}`} className="link-quiet">
              {SITE.reviewerEmail}
            </a>{" "}
            and quote your case reference.
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Button type="button" variant="outline" onClick={reset}>
            Submit another request
          </Button>
          <Link to="/privacy" className="link-quiet self-center">
            Privacy practices
          </Link>
          <Link to="/" className="link-quiet self-center">
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-14">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="eyebrow">Marketing opt-out</p>
          <Badge tone={MARKETING_ENABLED ? "warn" : "outline"}>
            {MARKETING_ENABLED ? "Marketing is optional" : "No marketing currently sent"}
          </Badge>
        </div>
        <h1 className="text-3xl leading-tight sm:text-4xl">Stop marketing calls and texts</h1>
        <p className="prose-note max-w-2xl">
          Use this page to withdraw marketing permission. It does not cancel your review, delete your
          case, or change your interview answers.
        </p>
      </header>

      {!MARKETING_ENABLED ? (
        <Alert tone="neutral" className="mt-8">
          No marketing calls or texts are being sent in this version. You can still record a stop
          request here; it will apply if marketing is enabled later.
        </Alert>
      ) : null}

      <section className="panel mt-8 space-y-5 p-6">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-hidden />
          <p className="text-sm leading-relaxed text-muted-foreground">
            We match the case reference and the contact detail you provide against the case on file.
            If they match, the suppression is recorded immediately and applies to future marketing.
            Do not include health information in the reason box.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <Label htmlFor="reference">Case reference</Label>
            <Input
              id="reference"
              name="reference"
              value={reference}
              onChange={(event) => setReference(event.target.value.toUpperCase())}
              placeholder="LPP-2026-7K3M9Q"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={Boolean(errors.reference)}
              className="mt-1.5"
            />
            <FieldError>{errors.reference}</FieldError>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">Email on your case</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                aria-invalid={Boolean(errors.email || errors.contact)}
                className="mt-1.5"
              />
              <FieldError>{errors.email}</FieldError>
            </div>
            <div>
              <Label htmlFor="phone">Telephone on your case</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                aria-invalid={Boolean(errors.phone || errors.contact)}
                className="mt-1.5"
              />
              <FieldError>{errors.phone}</FieldError>
            </div>
          </div>
          <FieldError>{errors.contact}</FieldError>

          <div>
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              name="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              aria-invalid={Boolean(errors.reason)}
              className="mt-1.5"
            />
            <FieldError>{errors.reason}</FieldError>
            <p className="mt-1 text-xs text-muted-foreground">{reason.length}/500 characters</p>
          </div>

          {error ? (
            <Alert tone="danger" title="The request was not recorded">
              {error} You can also email{" "}
              <a href={`mailto:${SITE.reviewerEmail}`} className="link-quiet">
                {SITE.reviewerEmail}
              </a>
              .
            </Alert>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-muted-foreground">
              A phone suppression covers both marketing calls and texts to that number.
            </p>
            <Button type="submit" size="lg" disabled={submitting}>
              <Mail aria-hidden />
              {submitting ? "Recording request…" : "Record my stop request"}
            </Button>
          </div>
        </form>
      </section>

      <section className="mt-10 space-y-2">
        <h2 className="text-lg">If you no longer have your reference</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Email{" "}
          <a href={`mailto:${SITE.reviewerEmail}`} className="link-quiet">
            {SITE.reviewerEmail}
          </a>{" "}
          from the address on your case. Do not send health information. We act on a revocation
          promptly and no later than 10 business days after we receive it.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link to="/privacy" className="link-quiet">
          Privacy practices
        </Link>
        <Link to="/messaging-terms" className="link-quiet">
          Messaging terms
        </Link>
        <Link to="/" className="link-quiet">
          Home
        </Link>
      </div>
    </div>
  );
}
