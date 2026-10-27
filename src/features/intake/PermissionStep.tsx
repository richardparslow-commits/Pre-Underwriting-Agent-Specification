import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Checkbox } from "@/components/ui/surface";
import { SITE, FEATURES } from "@/config/site";
import {
  INTAKE_PERMISSION_TEXT,
  CONSENT_VERSION,
  PRIVACY_PRACTICES_VERSION,
} from "@/features/consent/consentTexts";
import { QUESTIONNAIRE_VERSION } from "@/features/interview/types";

interface PermissionStepProps {
  phone?: string;
  granted: boolean;
  onGrant: (value: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}

const ROWS = [
  {
    title: "Who you are talking to",
    body: FEATURES.aiExplainerEnabled
      ? `An AI assistant operated by ${SITE.brand}, working for ${SITE.owner}. A person — not the assistant — reviews your answers.`
      : `A guided interview tool operated by ${SITE.brand}, working for ${SITE.owner}. ${SITE.owner} reviews your answers personally. A plain-language assistant is not active in this version.`,
  },
  {
    title: "What this is",
    body: "Preliminary information collection for a life-insurance review. It is not a carrier application, a medical diagnosis, an offer of coverage, or an approval. No decision about you is made by the assistant.",
  },
  {
    title: "Where your answers go",
    body: `Your completed answers are stored in an access-controlled case record and shown to ${SITE.owner} through an authenticated portal. Health answers are kept out of marketing tools, advertising pixels, session replay and routine logs.`,
  },
  {
    title: "What you control",
    body: "Ask one question at a time, skip anything, mark an answer uncertain, or decline. If something is sensitive and withheld, we offer a conversation with a person rather than coercion. You can ask for a correction or deletion.",
  },
];

export function PermissionStep({ phone, granted, onGrant, onBack, onContinue }: PermissionStepProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="eyebrow">Step 2 of 4 · Permission</p>
        <h1 className="text-3xl leading-tight sm:text-4xl">Before the health questions</h1>
        <p className="prose-note max-w-2xl">
          Please read this once. It explains what the assistant is, what it is not, and how your
          answers are handled.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {ROWS.map((row) => (
          <section key={row.title} className="panel p-5">
            <h2 className="text-base font-medium">{row.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{row.body}</p>
          </section>
        ))}
      </div>

      <div className="panel space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-ok" aria-hidden />
          <p className="text-sm font-medium">If you need help right now</p>
          <Badge tone="outline">Not monitored</Badge>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This site does not monitor emergencies and cannot dispatch help. If you are thinking about
          suicide or self-harm, call or text 988 (Suicide &amp; Crisis Lifeline). If your life is in
          immediate danger, call 911.
        </p>
      </div>

      <div className="panel space-y-4 p-5">
        <label className="flex gap-3 text-sm leading-relaxed">
          <Checkbox
            checked={granted}
            onChange={(event) => onGrant(event.target.checked)}
            aria-describedby="intake-permission-text"
          />
          <span id="intake-permission-text">{INTAKE_PERMISSION_TEXT}</span>
        </label>

        <div className="hairline flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-[0.7rem] text-muted-foreground">
          <span>Consent text version {CONSENT_VERSION}</span>
          <span>Privacy practices version {PRIVACY_PRACTICES_VERSION}</span>
          <span>Questionnaire {QUESTIONNAIRE_VERSION}</span>
          {phone ? <span>Contact number on file: {phone}</span> : null}
        </div>
        {SITE.legalReviewPending ? (
          <p className="text-[0.7rem] uppercase tracking-[0.12em] text-warn">
            Draft wording — pending counsel review
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="quiet" onClick={onBack}>
          <ArrowLeft aria-hidden />
          Back to your details
        </Button>
        <Button type="button" size="lg" onClick={onContinue} disabled={!granted}>
          Begin the interview
          <ArrowRight aria-hidden />
        </Button>
      </div>
      {!granted ? (
        <p className="text-xs text-muted-foreground">
          The interview cannot start until you have given this permission. Nothing has been saved.
        </p>
      ) : null}
    </div>
  );
}
