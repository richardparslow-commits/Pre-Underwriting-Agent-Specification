import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCheck,
  ChevronDown,
  Loader2,
  MessageSquarePlus,
  PencilLine,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Alert, Badge } from "@/components/ui/surface";
import { SITE } from "@/config/site";
import { SECTIONS } from "@/features/interview/sections";
import type {
  CaseRecord,
  Disposition,
  NotificationState,
  ReviewLogEntry,
  SubmittedAnswer,
} from "@/features/interview/types";
import { recordCorrection, recordReview } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { StatusTimeline } from "@/features/intake/StatusTimeline";

const DISPOSITION: Record<Disposition, { label: string; tone: "ok" | "warn" | "danger" | "neutral" | "outline" }> = {
  answered: { label: "Answered", tone: "ok" },
  unknown: { label: "Uncertain", tone: "warn" },
  declined: { label: "Declined", tone: "neutral" },
  not_applicable: { label: "Not applicable", tone: "outline" },
  unresolved: { label: "Unanswered", tone: "warn" },
  held_for_review: { label: "Held for review", tone: "outline" },
  not_asked: { label: "Not asked", tone: "outline" },
};

const NOTIFICATION: Record<NotificationState, { label: string; tone: "ok" | "warn" | "danger" | "outline" }> = {
  not_sent: { label: "Not sent", tone: "outline" },
  queued: { label: "Queued", tone: "warn" },
  accepted: { label: "Provider accepted", tone: "warn" },
  delivered: { label: "Delivery confirmed", tone: "ok" },
  failed: { label: "Failed", tone: "danger" },
};

const ACTION_LABEL: Record<ReviewLogEntry["action"], string> = {
  opened: "Opened",
  marked_reviewed: "Marked reviewed",
  requested_clarification: "Clarification requested",
};

type Filter = "all" | "attention" | "held" | "not_asked";

function AnswerRow({ answer }: { answer: SubmittedAnswer }) {
  const badge = DISPOSITION[answer.disposition];
  const needsAttention =
    answer.disposition === "unresolved" ||
    answer.disposition === "declined" ||
    answer.disposition === "unknown";

  return (
    <li
      id={`answer-${answer.questionId}`}
      className={cn("scroll-mt-24 px-5 py-4", needsAttention && "bg-warn/[0.035]")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[0.7rem] text-muted-foreground">{answer.questionId}</span>
            {answer.timeframe ? (
              <span className="text-[0.7rem] text-muted-foreground">{answer.timeframe}</span>
            ) : null}
            <Badge tone={badge.tone}>{badge.label}</Badge>
            {answer.status === "supplemental" ? <Badge tone="accent">Supplemental</Badge> : null}
            {answer.sensitive ? <Badge tone="warn">Sensitive</Badge> : null}
          </div>

          <p className="mt-1.5 text-sm font-medium">{answer.customerText}</p>
          <p className="mt-1 text-sm text-muted-foreground">{answer.answerText}</p>

          {answer.fields?.length ? (
            <dl className="mt-2 space-y-1">
              {answer.fields.map((field) => (
                <div key={field.id} className="flex gap-2 text-xs">
                  <dt className="shrink-0 text-muted-foreground">{field.label}:</dt>
                  <dd>{field.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {answer.details?.length ? (
            <dl className="mt-2 space-y-1 rounded-md bg-secondary/50 px-3 py-2">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Supplemental detail
              </p>
              {answer.details.map((detail) => (
                <div key={detail.label} className="flex gap-2 text-xs">
                  <dt className="shrink-0 text-muted-foreground">{detail.label}:</dt>
                  <dd>{detail.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {answer.reviewNote ? (
            <p className="mt-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Held because: </span>
              {answer.reviewNote}
            </p>
          ) : null}

          <details className="mt-2">
            <summary className="cursor-pointer text-[0.7rem] text-muted-foreground">
              Source record
            </summary>
            <div className="mt-1.5 space-y-1 text-[0.7rem] leading-relaxed text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Source reference: </span>
                {answer.sourceRef}
              </p>
              <p>
                <span className="font-medium text-foreground">Source text: </span>
                {answer.sourceText ?? "Not included in this preview sample."}
              </p>
            </div>
          </details>
        </div>
      </div>
    </li>
  );
}

export function CaseReview({
  record,
  onRefresh,
}: {
  record: CaseRecord;
  onRefresh: () => Promise<void> | void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<false | ReviewLogEntry["action"]>(false);
  const [error, setError] = useState<string | null>(null);
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [note, setNote] = useState("");
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionText, setCorrectionText] = useState("");
  const [correctionBusy, setCorrectionBusy] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  const counts = {
    all: record.answers.length,
    attention: record.answers.filter((answer) =>
      ["unresolved", "declined", "unknown"].includes(answer.disposition),
    ).length,
    held: record.answers.filter((answer) => answer.disposition === "held_for_review").length,
    not_asked: record.answers.filter((answer) => answer.disposition === "not_asked").length,
  };

  const filtered = record.answers.filter((answer) => {
    if (filter === "all") return true;
    if (filter === "held") return answer.disposition === "held_for_review";
    if (filter === "not_asked") return answer.disposition === "not_asked";
    return ["unresolved", "declined", "unknown"].includes(answer.disposition);
  });

  const notification = NOTIFICATION[record.notification.state];
  const unanswered = record.answers.filter((answer) => answer.disposition === "unresolved").length;
  const latestPhoneRevocation = record.marketingRevocations.find(
    (entry) => entry.channel === "phone",
  );
  const consentRows = record.consents.map((consent) => ({
    consent,
    revoked:
      (consent.id === "marketing_call" || consent.id === "marketing_text") &&
      Boolean(latestPhoneRevocation),
  }));

  async function runAction(action: ReviewLogEntry["action"], actionNote?: string) {
    setBusy(action);
    setError(null);
    try {
      await recordReview(record.reference, action, actionNote);
      setClarifyOpen(false);
      setNote("");
      await onRefresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "The review action was not recorded.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveCorrection() {
    setCorrectionBusy(true);
    setCorrectionError(null);
    try {
      await recordCorrection(record.reference, correctionText);
      setCorrectionText("");
      setCorrectionOpen(false);
      await onRefresh();
    } catch (saveError) {
      setCorrectionError(
        saveError instanceof Error ? saveError.message : "The correction was not recorded.",
      );
    } finally {
      setCorrectionBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/portal" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Case queue
        </Link>
      </div>

      <header className="panel p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm">{record.reference}</span>
              <Badge tone={record.status === "reviewed" ? "ok" : record.status === "needs_clarification" ? "warn" : "accent"}>
                {record.status === "needs_clarification" ? "Clarification requested" : record.status}
              </Badge>
              <Badge tone={notification.tone}>{notification.label}</Badge>
              {record.sample ? <Badge tone="outline">Sample test case</Badge> : null}
            </div>
            <h1 className="mt-3 text-3xl leading-tight">
              {record.lead.firstName} {record.lead.lastName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {record.lead.state} · prefers {record.lead.preferredContact}
              {record.lead.phone ? ` · ${record.lead.phone}` : ""} ·{" "}
              <a href={`mailto:${record.lead.email}`} className="link-quiet">
                {record.lead.email}
              </a>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Submitted {formatDate(record.submittedAt)} · Questionnaire {record.questionnaireVersion}
              {record.lead.preferredContactTime ? ` · Best time: ${record.lead.preferredContactTime}` : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:min-w-[210px]">
            <Button
              type="button"
              onClick={() => void runAction("marked_reviewed")}
              disabled={busy !== false}
            >
              {busy === "marked_reviewed" ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <CheckCheck aria-hidden />
              )}
              Mark as reviewed
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setClarifyOpen((current) => !current)}
              disabled={busy !== false}
            >
              <MessageSquarePlus aria-hidden />
              Request clarification
            </Button>
          </div>
        </div>

        {record.crisisDisclosure ? (
          <Alert tone="danger" className="mt-5" title="Current safety disclosure">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                The customer answered yes to current thoughts of self-harm. Review this case first
                and follow the approved crisis-support script. The site did not monitor or dispatch
                help. 988 is the Suicide &amp; Crisis Lifeline; 911 is for immediate danger.
              </p>
            </div>
          </Alert>
        ) : null}

        {error ? (
          <Alert tone="danger" className="mt-5">
            {error}
          </Alert>
        ) : null}

        {clarifyOpen ? (
          <div className="mt-5 space-y-3 border-t border-border pt-4">
            <label htmlFor="clarify-note" className="field-label">
              What needs clarifying?
            </label>
            <Textarea
              id="clarify-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="For example: confirm the date of the 2024 surgery before we discuss options."
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void runAction("requested_clarification", note)}
                disabled={busy !== false || note.trim().length === 0}
              >
                {busy === "requested_clarification" ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : null}
                Record clarification request
              </Button>
              <Button type="button" variant="ghost" onClick={() => setClarifyOpen(false)}>
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This records a status change for the case. It does not send an email to the customer.
            </p>
          </div>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-6">
          <section className="panel">
            <div className="flex flex-col gap-2 border-b border-border bg-secondary/40 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-base font-medium">
                  <Sparkles className="h-4 w-4 text-accent" aria-hidden />
                  Draft summary
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Generated automatically from the recorded answers. A navigation aid, not an
                  underwriting decision or a medical opinion.
                </p>
              </div>
              <Badge tone="outline">{record.draftSummary.line}</Badge>
            </div>

            <div className="space-y-5 p-5">
              {record.draftSummary.sections.length === 0 ? (
                <p className="text-sm text-muted-foreground">No answered sections yet.</p>
              ) : null}

              {record.draftSummary.sections.map((section) => (
                <div key={section.section}>
                  <p className="eyebrow">{section.title}</p>
                  <ul className="mt-2 space-y-1.5">
                    {section.points.map((point) => (
                      <li key={`${section.section}-${point.questionIds.join("-")}-${point.text}`} className="text-sm leading-relaxed">
                        {point.text}{" "}
                        {point.questionIds.map((id) => (
                          <a
                            key={id}
                            href={`#answer-${id}`}
                            className="ml-1 font-mono text-[0.65rem] text-accent underline decoration-accent/30 underline-offset-2"
                          >
                            {id}
                          </a>
                        ))}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
              <h2 className="mr-auto text-base font-medium">Question record</h2>
              {(
                [
                  ["all", `All ${counts.all}`],
                  ["attention", `Needs attention ${counts.attention}`],
                  ["held", `Held ${counts.held}`],
                  ["not_asked", `Not asked ${counts.not_asked}`],
                ] as Array<[Filter, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    filter === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-input hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <ul className="divide-y divide-border">
              {filtered.map((answer) => (
                <AnswerRow key={answer.questionId} answer={answer} />
              ))}
            </ul>
            {filtered.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">Nothing in this view.</p>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="panel p-5">
            <h2 className="text-base font-medium">Notification</h2>
            <div className="mt-3">
              <StatusTimeline notification={record.notification} />
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="text-base font-medium">Review flags</h2>
            <ul className="mt-3 space-y-3">
              {record.flags.length === 0 ? (
                <li className="text-sm text-muted-foreground">No flags recorded.</li>
              ) : null}
              {record.flags.map((flag) => (
                <li key={flag.id} className="flex gap-2">
                  <span
                    className={cn(
                      "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                      flag.severity === "urgent"
                        ? "bg-danger"
                        : flag.severity === "attention"
                          ? "bg-warn"
                          : "bg-muted-foreground",
                    )}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-medium">{flag.label}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{flag.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border pt-3 text-[0.7rem] leading-relaxed text-muted-foreground">
              {unanswered > 0
                ? `${unanswered} unanswered item${unanswered === 1 ? "" : "s"} must not be read as “No”.`
                : "No unanswered items in this submission."}
            </p>
          </section>

          <section className="panel p-5">
            <h2 className="text-base font-medium">Consent evidence</h2>
            <ul className="mt-3 space-y-3">
              {consentRows.map(({ consent, revoked }) => (
                <li key={consent.id} className="text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm">{consent.label}</span>
                    <Badge tone={revoked ? "danger" : consent.granted ? "ok" : "outline"}>
                      {revoked ? "Revoked" : consent.granted ? "Given" : "Not given"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {consent.grantedAt ? formatDate(consent.grantedAt) : "No permission recorded"}
                    {revoked && latestPhoneRevocation
                      ? ` · withdrawn ${formatDate(latestPhoneRevocation.recordedAt)}`
                      : ""}{" "}
                    · text v{consent.textVersion}
                  </p>
                  <details className="mt-1">
                    <summary className="cursor-pointer text-muted-foreground">
                      Exact wording shown
                    </summary>
                    <p className="mt-1 whitespace-pre-wrap leading-relaxed text-muted-foreground">
                      {consent.text}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
            {record.marketingRevocations.length > 0 ? (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-sm font-medium">Marketing withdrawal evidence</p>
                <ul className="mt-2 space-y-2">
                  {record.marketingRevocations.map((entry) => (
                    <li key={`${entry.channel}-${entry.recordedAt}`} className="text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="danger">
                          {entry.channel === "phone" ? "Phone" : "Email"}
                        </Badge>
                        <span>{formatDate(entry.recordedAt)}</span>
                        <span className="text-muted-foreground">via {entry.source}</span>
                      </div>
                      {entry.reason ? (
                        <p className="mt-1 leading-relaxed text-muted-foreground">
                          {entry.reason}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[0.7rem] leading-relaxed text-muted-foreground">
                  The submitted consent snapshot is unchanged. This withdrawal is append-only
                  evidence and is enforced before any marketing send.
                </p>
              </div>
            ) : null}
          </section>

          <section className="panel p-5">
            <h2 className="text-base font-medium">Customer verification</h2>
            <ul className="mt-3 space-y-3">
              {record.acknowledgements.length === 0 ? (
                <li className="text-sm text-muted-foreground">No acknowledgement recorded.</li>
              ) : null}
              {record.acknowledgements.map((acknowledgement) => (
                <li key={acknowledgement.id} className="text-xs">
                  <p className="text-muted-foreground">{formatDate(acknowledgement.timestamp)}</p>
                  <p className="mt-1 leading-relaxed">{acknowledgement.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border pt-3 text-[0.7rem] leading-relaxed text-muted-foreground">
              Answers are the customer&rsquo;s own statements. They are not verified medical records,
              and no diagnosis has been inferred.
            </p>
          </section>

          <section className="panel p-5">
            <h2 className="text-base font-medium">Recorded corrections</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Corrections the customer supplies after submission. Each one is stored separately from
              the submitted answers, with who recorded it and when. The original snapshot is never
              edited.
            </p>
            <ul className="mt-3 space-y-3">
              {record.corrections.length === 0 ? (
                <li className="text-xs text-muted-foreground">No corrections recorded.</li>
              ) : null}
              {record.corrections.map((correction) => (
                <li key={correction.id} className="text-xs">
                  <p className="leading-relaxed text-foreground">{correction.detail}</p>
                  <p className="mt-1 text-muted-foreground">
                    {correction.recordedBy} · {formatDate(correction.recordedAt)}
                  </p>
                </li>
              ))}
            </ul>

            {correctionOpen ? (
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <label htmlFor="correction-detail" className="field-label">
                  What did the customer correct?
                </label>
                <Textarea
                  id="correction-detail"
                  value={correctionText}
                  maxLength={4000}
                  onChange={(event) => setCorrectionText(event.target.value)}
                  placeholder="For example: the customer confirmed the surgery was in February, not March."
                />
                {correctionError ? (
                  <p className="text-xs font-medium text-danger" role="alert">
                    {correctionError}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => void saveCorrection()}
                    disabled={correctionBusy || correctionText.trim().length === 0}
                  >
                    {correctionBusy ? <Loader2 className="animate-spin" aria-hidden /> : null}
                    Save correction
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setCorrectionOpen(false);
                      setCorrectionError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
                  This adds an entry beside the case. It does not change the submitted answers or
                  send the customer an email.
                </p>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={() => setCorrectionOpen(true)}
              >
                <PencilLine aria-hidden />
                Record a correction
              </Button>
            )}
          </section>

          <section className="panel p-5">
            <h2 className="text-base font-medium">Human review log</h2>
            <ul className="mt-3 space-y-2">
              {record.reviewLog.length === 0 ? (
                <li className="text-xs text-muted-foreground">No review activity recorded yet.</li>
              ) : null}
              {record.reviewLog.map((entry, index) => (
                <li key={`${entry.at}-${index}`} className="text-xs">
                  <p className="text-foreground">{ACTION_LABEL[entry.action]}</p>
                  <p className="text-muted-foreground">
                    {entry.actor} · {formatDate(entry.at)}
                  </p>
                  {entry.note ? <p className="mt-1 leading-relaxed text-muted-foreground">{entry.note}</p> : null}
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border pt-3 text-[0.7rem] leading-relaxed text-muted-foreground">
              Every consequential action stays with {SITE.owner}. This portal records review; it does
              not make an eligibility decision.
            </p>
          </section>

          <details className="panel p-5">
            <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
              Case header details
              <ChevronDown className="h-4 w-4" aria-hidden />
            </summary>
            <dl className="mt-3 space-y-2 text-xs">
              {[
                ["Reference", record.reference],
                ["Submitted", formatDate(record.submittedAt)],
                ["Started", formatDate(record.startedAt)],
                ["Questionnaire", record.questionnaireVersion],
                ["Residence", record.lead.state],
                ["Contact method", record.lead.preferredContact],
                ["Coverage amount", record.lead.coverageAmount ?? "Not provided"],
                ["Coverage purpose", record.lead.coveragePurpose ?? "Not provided"],
                ["Term preference", record.lead.termPreference ?? "Not provided"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </details>
        </aside>
      </div>

      <div className="flex flex-wrap gap-4 border-t border-border pt-4 text-xs">
        {SECTIONS.length > 0 ? (
          <span className="text-muted-foreground">
            {record.answers.filter((answer) => answer.status === "core").length} source questions ·{" "}
            {record.answers.filter((answer) => answer.status === "supplemental").length} supplemental
          </span>
        ) : null}
        <span className="text-muted-foreground">
          Retention is not active yet: no retention period has been approved. Deletion is manual
          until counsel approves a schedule.
        </span>
      </div>
    </div>
  );
}
