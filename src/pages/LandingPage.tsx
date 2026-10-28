import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ClipboardList,
  FileCheck2,
  LockKeyhole,
  MessagesSquare,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/surface";
import { SITE, PREVIEW_MODE } from "@/config/site";
import { QUESTION_BANK } from "@/features/interview/questionBank";

const STEPS = [
  {
    title: "Your details",
    body: "Name, state of residence, and how you want to be contacted. Marketing calls and texts are separate, optional choices.",
    icon: UserRound,
  },
  {
    title: "Permission, explained",
    body: "What the assistant is, who reads your answers, where they are stored, and what you can decline — before any health question.",
    icon: ShieldCheck,
  },
  {
    title: "The interview",
    body: "One question at a time, section by section, with the original timeframes kept intact. Skip or decline anything.",
    icon: MessagesSquare,
  },
  {
    title: "Review, then submit",
    body: "See every answer, correct what is wrong, then use the explicit submit button. Nothing is sent before that.",
    icon: FileCheck2,
  },
];

const AREAS = [
  "Medical history, treatment and medications",
  "Mental health, asked respectfully",
  "Nicotine, alcohol and drug use",
  "Aviation and hazardous pursuits",
  "Driving record and criminal history",
  "Bankruptcy and finances",
  "Residency and travel",
  "Occupation and military service",
];

const ANSWERED = QUESTION_BANK.filter(
  (question) => question.reviewStatus === "approved" && question.status === "core",
).length;
const HELD = QUESTION_BANK.filter((question) => question.reviewStatus === "human_review_required").length;

export default function LandingPage() {
  return (
    <div>
      <section className="border-b border-border">
        <div className="container grid gap-12 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:py-24">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">Guided pre-underwriting</Badge>
              {PREVIEW_MODE ? <Badge tone="outline">Preview build</Badge> : null}
            </div>

            <h1 className="mt-6 text-[2.4rem] leading-[1.08] tracking-tight sm:text-[3.1rem]">
              Prepare for life-insurance underwriting without guessing what they will ask.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              A structured, guided interview that organises your health and lifestyle history,
              then hands a complete case to {SITE.owner} for a human review. Not a quote engine, not
              a medical opinion, and not an approval.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link to="/start">
                  Start the pre-underwriting interview
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/#how">See how it works</Link>
              </Button>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-6">
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                  Core questions
                </dt>
                <dd className="mt-1 font-display text-2xl">{ANSWERED}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                  Held for review
                </dt>
                <dd className="mt-1 font-display text-2xl">{HELD}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                  Typical time
                </dt>
                <dd className="mt-1 font-display text-2xl">20 min</dd>
              </div>
            </dl>
          </div>

          <aside className="lg:pl-4">
            <div className="panel shadow-panel">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <p className="text-sm font-medium">What your review request looks like</p>
                <Badge tone="outline">Case record</Badge>
              </div>

              <div className="space-y-5 p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="eyebrow">Reference</p>
                    <p className="mt-1 font-mono text-sm">LPP-2026-7K3M9Q</p>
                  </div>
                  <div>
                    <p className="eyebrow">Status</p>
                    <p className="mt-1 text-sm">Submitted for review</p>
                  </div>
                </div>

                <div className="hairline space-y-2 pt-4">
                  {[
                    ["Question record", "Every question and its disposition"],
                    ["Source references", "Kept for audit and reconciliation"],
                    ["Human review", "Richard reads the full record"],
                  ].map(([label, body]) => (
                    <div key={label} className="flex gap-2.5">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" aria-hidden />
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        <span className="font-medium text-foreground">{label}.</span> {body}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-md border border-border bg-secondary/60 p-3">
                  <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    <LockKeyhole className="h-3 w-3" aria-hidden />
                    Never requested here
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Social Security, passport, visa or green-card numbers, payment details, or
                    identity-document scans.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="how" className="border-b border-border">
        <div className="container py-16">
          <div className="max-w-2xl">
            <p className="eyebrow">The interview</p>
            <h2 className="mt-3 text-3xl leading-tight sm:text-4xl">
              Four steps, and a person at the end of them
            </h2>
          </div>

          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="panel flex flex-col p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary">
                    <step.icon className="h-4 w-4 text-foreground" aria-hidden />
                  </span>
                  <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-lg leading-snug">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="what-we-ask" className="border-b border-border bg-secondary/30">
        <div className="container grid gap-10 py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <p className="eyebrow">Coverage</p>
            <h2 className="mt-3 text-3xl leading-tight sm:text-4xl">
              The questions a carrier would ask — asked once, and kept intact
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
              The interview follows a fixed, versioned question bank. Overlapping timeframes
              (&ldquo;ever&rdquo; versus &ldquo;past 12 months&rdquo;) stay separate, and a blank is
              recorded as unanswered rather than as &ldquo;No&rdquo;.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Yes", "No", "I'm not sure", "Prefer not to answer"].map((state) => (
                <span
                  key={state}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
                >
                  {state}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {AREAS.map((area) => (
              <div key={area} className="flex items-start gap-2.5 rounded-md border border-border bg-card px-4 py-3">
                <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <p className="text-sm leading-snug">{area}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="container grid gap-10 py-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow">What this is</p>
            <ul className="mt-4 space-y-3">
              {[
                "A guided record of your health and lifestyle history, in your own words.",
                "A request for Richard Parslow to review your situation personally.",
                "A way to know what to gather before a formal application.",
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">What this is not</p>
            <ul className="mt-4 space-y-3">
              {[
                "Not a carrier application, an offer of insurance, or an underwriting decision.",
                "Not a medical diagnosis, and not a substitute for advice from your doctor.",
                "Not a promise of a rate, a product, or an approval.",
                "Not an emergency or crisis service.",
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              The interview only collects and organises information. Every consequential step —
              including anything sent to a carrier — stays behind an authorised human review.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="panel flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div className="max-w-xl">
            <h2 className="text-2xl leading-snug sm:text-3xl">
              Start with your details. You can stop at any point.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Nothing is submitted until you review the completed record and press submit. Your
              answers are held in this tab only.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link to="/start">
              Begin
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
