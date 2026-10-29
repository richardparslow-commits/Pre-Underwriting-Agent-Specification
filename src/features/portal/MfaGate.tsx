import { useCallback, useEffect, useRef, useState } from "react";
import { KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Alert, Badge } from "@/components/ui/surface";
import { supabase } from "@/integrations/supabase/client";

type Phase = "checking" | "enrolling" | "challenging" | "verifying" | "done" | "error";

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
 * Supabase's MFA API: a verified factor is challenged, an unverified/first
 * factor is enrolled, and the session is only reported as usable after
 * `verify` succeeds. No factor, secret or code is persisted by this component.
 */
export function MfaGate({ email, onVerified, onLeave }: MfaGateProps) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  const begin = useCallback(async () => {
    if (!supabase) {
      setError("Sign-in is not configured.");
      setPhase("error");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      const allFactors = factors?.all ?? [];
      const verified = allFactors.find(
        (factor) => factor.factor_type === "totp" && factor.status === "verified",
      );

      if (verified) {
        if (!active.current) return;
        setFactorId(verified.id);
        setPhase("challenging");
        return;
      }

      // An abandoned enrolment leaves an unverified factor behind. Remove it
      // before creating another so the account does not accumulate dead rows.
      for (const factor of allFactors) {
        if (factor.factor_type === "totp" && factor.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }

      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Reviewer authenticator",
      });
      if (enrollError) throw enrollError;
      if (!active.current) return;

      setFactorId(enrolled.id);
      setQrCode(enrolled.totp.qr_code);
      setSecret(enrolled.totp.secret);
      setPhase("enrolling");
    } catch {
      if (!active.current) return;
      setError("Multifactor authentication could not be started. Sign out and try again.");
      setPhase("error");
    } finally {
      if (active.current) setBusy(false);
    }
  }, []);

  useEffect(() => {
    void begin();
  }, [begin]);

  const verify = useCallback(async () => {
    if (!supabase || !factorId) return;
    const trimmed = code.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(trimmed)) {
      setError("Enter the six-digit code from your authenticator app.");
      return;
    }

    setError(null);
    setBusy(true);
    setPhase("verifying");
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: trimmed,
      });
      if (verifyError) throw verifyError;

      if (!active.current) return;
      setCode("");
      setPhase("done");
      onVerified();
    } catch {
      if (!active.current) return;
      setError("That code was not accepted. Wait for the next code and try again.");
      setPhase(factorId && secret ? "enrolling" : "challenging");
    } finally {
      if (active.current) setBusy(false);
    }
  }, [code, factorId, onVerified, secret]);

  return (
    <div className="container max-w-md py-16">
      <div className="panel p-7">
        <Badge tone="warn">MFA required</Badge>
        <h1 className="mt-4 text-2xl leading-snug">
          {phase === "enrolling" ? "Set up your authenticator" : "Step up your session"}
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

        {phase === "enrolling" && qrCode ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Scan this code with an authenticator app, or enter the setup key manually. The key is
              shown once and is never stored by this site.
            </p>
            {/* `totp.qr_code` is already a `data:image/svg+xml;utf-8,…` URL:
                @supabase/auth-js prefixes it before returning. Prefixing again
                renders a broken image. */}
            <img
              src={qrCode}
              alt="Authenticator setup QR code"
              className="mx-auto h-44 w-44 rounded-md border border-border bg-white p-2"
            />
            {secret ? (
              <div>
                <Label htmlFor="mfa-secret">Setup key</Label>
                <code
                  id="mfa-secret"
                  className="mt-1.5 block break-all rounded-md border border-border bg-secondary/40 px-3 py-2 font-mono text-xs"
                >
                  {secret}
                </code>
              </div>
            ) : null}
          </div>
        ) : null}

        {phase === "enrolling" || phase === "challenging" || phase === "verifying" ? (
          <form
            className="mt-5 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void verify();
            }}
          >
            <div>
              <Label htmlFor="mfa-code">Six-digit code</Label>
              <Input
                id="mfa-code"
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
          <Alert tone="danger" className="mt-4">
            {error}
          </Alert>
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
