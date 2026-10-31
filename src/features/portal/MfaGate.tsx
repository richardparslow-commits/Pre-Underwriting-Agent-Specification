import { useId } from "react";
import { useMfaSetup } from "./useMfaSetup";
import { KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Alert, Badge } from "@/components/ui/surface";
import { supabase } from "@/integrations/supabase/client";

interface MfaGateProps {
  email: string | null;
  onVerified: () => void;
  onLeave: () => void;
}

/**
 * In-app TOTP step-up.
 *
 * The portal refuses an aal1 session, so without this gate a real reviewer can
 * sign in and then has no way to reach the queue. Everything here goes through
 * Supabase's MFA API: a verified factor is challenged, a first factor is enrolled, and an existing pending setup is retained, and the session is only reported as usable after
 * `verify` succeeds. No factor, secret or code is persisted by this component.
 */
export function MfaGate(props: MfaGateProps) {
  return <MfaSession key={props.email ?? "reviewer"} {...props} />;
}

function MfaSession({ email, onVerified, onLeave }: MfaGateProps) {
  const codeInputId = useId();
  const secretInputId = useId();
  const { phase, qrCode, secret, code, error, busy, setCode, begin, verify } = useMfaSetup(
    supabase?.auth.mfa ?? null,
    onVerified,
  );

  return (
    <div className="container max-w-md py-16">
      <div className="panel p-7">
        <Badge tone="warn">MFA required</Badge>
        <h1 className="mt-4 text-2xl leading-snug">
          {phase === "enrolling"
            ? "Set up your authenticator"
            : phase === "pending"
              ? "Finish authenticator setup"
              : "Step up your session"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          You are signed in as {email ?? "a reviewer"}, but this session has not completed
          multifactor authentication. Case data is not available until you verify a second factor.
        </p>

        {phase === "checking" ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Checking your authenticator…
          </p>
        ) : null}

        {phase === "pending" ? (
          <div role="status">
            <Alert tone="warn" className="mt-5">
              <p>An authenticator setup is already in progress. It has not been changed.</p>
              <p className="mt-2">
                Finish in the original tab, or enter a code here if you already scanned that setup
                key.
              </p>
              <p className="mt-2">
                If the original tab was closed before you added the key, sign out and ask the
                operator to clear the pending setup. Opening another tab will not replace it.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void begin()}
                disabled={busy}
              >
                Check setup again
              </Button>
            </Alert>
          </div>
        ) : null}

        {phase === "enrolling" && qrCode ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Scan this code with an authenticator app, or enter the setup key manually. The key is
              shown once and is never stored by this site.
            </p>
            <img
              src={`data:image/svg+xml;utf-8,${encodeURIComponent(qrCode)}`}
              alt="Authenticator setup QR code"
              className="mx-auto h-44 w-44 rounded-md border border-border bg-white p-2"
            />
            {secret ? (
              <div>
                <Label htmlFor={secretInputId}>Setup key</Label>
                <code
                  id={secretInputId}
                  className="mt-1.5 block break-all rounded-md border border-border bg-secondary/40 px-3 py-2 font-mono text-xs"
                >
                  {secret}
                </code>
              </div>
            ) : null}
          </div>
        ) : null}

        {phase === "enrolling" ||
        phase === "pending" ||
        phase === "challenging" ||
        phase === "verifying" ? (
          <form
            className="mt-5 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void verify();
            }}
          >
            <div>
              <Label htmlFor={codeInputId}>Six-digit code</Label>
              <Input
                id={codeInputId}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ""))}
                className="mt-1.5 tracking-[0.35em]"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <KeyRound aria-hidden />}
              Verify and open the queue
            </Button>
          </form>
        ) : null}

        {phase === "done" ? (
          <Alert tone="ok" className="mt-5">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Second factor verified. Loading the queue…
            </span>
          </Alert>
        ) : null}

        {error ? (
          <div role="alert">
            <Alert tone="danger" className="mt-4">
              {error}
            </Alert>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
          {phase === "error" ? (
            <Button variant="outline" size="sm" onClick={() => void begin()} disabled={busy}>
              Try again
            </Button>
          ) : null}
          <Button variant="quiet" size="sm" onClick={onLeave}>
            <LogOut aria-hidden />
            Sign out
          </Button>
        </div>

        <p className="mt-5 text-[0.7rem] leading-relaxed text-muted-foreground">
          If you lose access to your authenticator, an operator must remove the factor from your
          account before you can enrol a replacement. Do not share a code with anyone.
        </p>
      </div>
    </div>
  );
}
