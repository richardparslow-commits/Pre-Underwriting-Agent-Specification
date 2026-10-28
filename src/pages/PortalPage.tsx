import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Alert, Badge } from "@/components/ui/surface";
import { SITE } from "@/config/site";
import { MfaGate } from "@/features/portal/MfaGate";
import { useReviewerAuth } from "@/features/portal/useReviewerAuth";
import { listCases, type CaseListItem } from "@/lib/api";
import type { CaseStatus, NotificationState } from "@/features/interview/types";
import { formatDate } from "@/lib/utils";

const STATUS_TONE: Record<CaseStatus, "ok" | "warn" | "neutral" | "accent"> = {
  saved: "neutral",
  submitted: "accent",
  reviewed: "ok",
  needs_clarification: "warn",
};

const STATUS_LABEL: Record<CaseStatus, string> = {
  saved: "Saved",
  submitted: "Submitted",
  reviewed: "Reviewed",
  needs_clarification: "Clarification requested",
};

const NOTIFICATION_LABEL: Record<NotificationState, string> = {
  not_sent: "Notification not sent",
  queued: "Notification queued",
  accepted: "Provider accepted",
  delivered: "Delivery confirmed",
  failed: "Notification failed",
};

function SignInCard({ auth }: { auth: ReturnType<typeof useReviewerAuth> }) {
  const [address, setAddress] = useState("");

  return (
    <div className="mx-auto max-w-md">
      <div className="panel p-7">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary">
            <LockKeyhole className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl leading-snug">Reviewer sign-in</h1>
            <p className="text-xs text-muted-foreground">Authorised access only</p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          Cases contain health information. Sign in with the address on the reviewer allowlist and
          we will email a single-use link. A forwarded notification email does not grant access.
        </p>

        <form
          className="mt-6 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void auth.requestLink(address);
          }}
        >
          <div>
            <Label htmlFor="reviewer-email">Email address</Label>
            <Input
              id="reviewer-email"
              type="email"
              autoComplete="email"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder={SITE.reviewerEmail}
              className="mt-1.5"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            <Mail aria-hidden />
            Email me a sign-in link
          </Button>
        </form>

        {auth.linkSent ? (
          <Alert tone="ok" className="mt-4">
            If that address is on the allowlist, a sign-in link is on its way. Check the inbox for
            the exact address you entered.
          </Alert>
        ) : null}
        {auth.error ? (
          <Alert tone="danger" className="mt-4">
            {auth.error}
          </Alert>
        ) : null}

        <p className="mt-6 border-t border-border pt-4 text-[0.7rem] leading-relaxed text-muted-foreground">
          Multifactor authentication is required: the portal refuses an aal1 session and every
          reviewer policy independently requires an aal2 session. After the email link, this page
          walks you through an authenticator app if you have not enrolled one yet. Every case
          request is also authorised against the reviewer allowlist on the server.
        </p>
      </div>
    </div>
  );
}

export default function PortalPage() {
  const auth = useReviewerAuth();
  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (cursor?: string) => {
    const appending = Boolean(cursor);
    if (appending) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const page = await listCases(cursor);
      setCases((current) => (appending ? [...(current ?? []), ...page.items] : page.items));
      setTotal(page.total);
      setNextCursor(page.nextCursor);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Cases could not be loaded.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (auth.signedIn) void load();
  }, [auth.signedIn, load]);

  if (auth.loading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center py-20">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Checking your session…
        </p>
      </div>
    );
  }

  if (auth.needsMfa && !auth.previewMode) {
    return (
      <MfaGate
        email={auth.email}
        onVerified={() => void auth.refreshAssurance()}
        onLeave={() => void auth.leave()}
      />
    );
  }

  if (!auth.signedIn) {
    if (!auth.previewMode) return <div className="container py-16"><SignInCard auth={auth} /></div>;

    return (
      <div className="container max-w-2xl py-16">
        <div className="panel p-7">
          <Badge tone="warn">Preview build</Badge>
          <h1 className="mt-4 text-2xl leading-snug">Reviewer portal</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sign-in is not configured in this build, so this is a local preview with no
            authentication. In production the portal requires an authorised Supabase session, MFA on
            the reviewer account, and row-level security on every case.
          </p>
          <Alert tone="warn" className="mt-4">
            Do not enter or review real customer information in preview mode. Cases live in this
            browser tab only and disappear on refresh.
          </Alert>
          <Button className="mt-5" onClick={auth.unlockPreview}>
            Open the portal preview
            <ArrowRight aria-hidden />
          </Button>
        </div>
      </div>
    );
  }

  const crisisCases = (cases ?? []).filter((item) => item.crisisDisclosure);

  return (
    <div className="container py-10 sm:py-14">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Reviewer portal</p>
          <h1 className="mt-2 text-3xl leading-tight sm:text-4xl">Case queue</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {auth.email ?? "reviewer"} · showing {cases?.length ?? 0} of {total} case
            {total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading || loadingMore}>
            {loading ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void auth.leave()}>
            <LogOut aria-hidden />
            Sign out
          </Button>
        </div>
      </header>

      {auth.previewMode ? (
        <Alert tone="warn" className="mt-6">
          Preview mode. Cases are held in this tab only and the email notification is not connected.
          The portal shows exactly what the reviewer would see.
        </Alert>
      ) : null}

      {crisisCases.length > 0 ? (
        <Alert tone="danger" className="mt-6" title="Current safety disclosure">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              {crisisCases.length} case{crisisCases.length === 1 ? "" : "s"} include a disclosure of
              current thoughts of self-harm. Review{" "}
              {crisisCases.map((item) => item.reference).join(", ")} first. The site did not and does
              not monitor an emergency.
            </p>
          </div>
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="danger" className="mt-6">
          {error}
        </Alert>
      ) : null}

      <div className="mt-8 space-y-3">
        {loading && !cases ? (
          <div className="panel flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading cases…
          </div>
        ) : null}

        {cases && cases.length === 0 ? (
          <div className="panel p-8 text-center">
            <ShieldCheck className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-sm font-medium">No cases yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Submitted interviews appear here once the case store is connected.
            </p>
          </div>
        ) : null}

        {cases?.map((item) => (
          <Link
            key={item.reference}
            to={`/portal/${item.reference}`}
            className="panel block p-5 transition-colors hover:border-input focus-visible:border-ring"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm">{item.reference}</span>
                  <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                  {item.crisisDisclosure ? <Badge tone="danger">Safety disclosure</Badge> : null}
                  {item.sample ? <Badge tone="outline">Sample test case</Badge> : null}
                </div>
                <p className="mt-2 text-sm font-medium">
                  {item.firstName} {item.lastName}{" "}
                  <span className="font-normal text-muted-foreground">· {item.residenceState}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submitted {formatDate(item.submittedAt)} · {NOTIFICATION_LABEL[item.notificationState]}
                  {item.unanswered > 0 ? ` · ${item.unanswered} unanswered` : " · all applicable answered"}
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                Review
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </div>
          </Link>
        ))}

        {nextCursor ? (
          <div className="pt-2 text-center">
            <Button
              variant="outline"
              onClick={() => void load(nextCursor)}
              disabled={loadingMore}
            >
              {loadingMore ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Load more cases
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Showing {cases?.length ?? 0} of {total}. Older cases load next.
            </p>
          </div>
        ) : cases && cases.length > 0 ? (
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Showing all {cases.length} case{cases.length === 1 ? "" : "s"} visible to you.
          </p>
        ) : null}
      </div>
    </div>
  );
}
