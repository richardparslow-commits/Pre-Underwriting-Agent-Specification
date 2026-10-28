import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, LockKeyhole, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Badge } from "@/components/ui/surface";
import { SITE } from "@/config/site";
import { CaseReview } from "@/features/portal/CaseReview";
import { useReviewerAuth } from "@/features/portal/useReviewerAuth";
import { getCase } from "@/lib/api";
import type { CaseRecord } from "@/features/interview/types";

export default function PortalCasePage() {
  const { reference } = useParams<{ reference: string }>();
  const auth = useReviewerAuth();
  const [record, setRecord] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!reference) return;
    setLoading(true);
    setError(null);
    try {
      const loaded = await getCase(reference);
      setRecord(loaded);
      if (!loaded) setError("This case could not be found, or you do not have permission to read it.");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "This case could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [reference]);

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
      <div className="container max-w-md py-20">
        <div className="panel p-7">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary">
            <LockKeyhole className="h-4 w-4" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl leading-snug">Multifactor authentication required</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your session is signed in but has not completed a second factor. Case data stays hidden
            until the session reaches AAL2.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/portal">Return to the portal</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!auth.signedIn) {
    return (
      <div className="container max-w-md py-20">
        <div className="panel p-7">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary">
            <LockKeyhole className="h-4 w-4" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl leading-snug">This case requires sign-in</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Possession of a reference or a forwarded email is not enough. Access requires an
            authorised reviewer account, and every case request is checked against that permission.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/portal">Go to sign-in</Link>
            </Button>
            {auth.previewMode ? (
              <Button variant="outline" onClick={auth.unlockPreview}>
                Preview this case locally
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 sm:py-14">
      {error ? (
        <Alert tone="danger" title="Case unavailable">
          <div className="flex gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p>{error}</p>
              <p className="mt-2">
                <Link to="/portal" className="link-quiet">
                  Return to the case queue
                </Link>
              </p>
            </div>
          </div>
        </Alert>
      ) : null}

      {loading && !record ? (
        <div className="panel flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading the case…
        </div>
      ) : null}

      {record ? <CaseReview record={record} onRefresh={load} /> : null}

      {!loading && !record && !error ? (
        <div className="panel p-6">
          <p className="text-sm">There is nothing to show for this case.</p>
        </div>
      ) : null}

      <footer className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-[0.7rem] text-muted-foreground">
        <Badge tone="outline">Authorised reviewer view</Badge>
        <span>
          Health information. Access is limited to {SITE.owner}&rsquo;s allowlisted account; do not
          forward or screenshot this page.
        </span>
      </footer>
    </div>
  );
}
