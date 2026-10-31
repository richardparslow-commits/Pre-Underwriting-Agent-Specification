import { useCallback, useEffect, useRef, useState } from "react";

export type MfaPhase =
  "checking" | "enrolling" | "pending" | "challenging" | "verifying" | "done" | "error";
export interface MfaFactor {
  id: string;
  factor_type: string;
  status: string;
}
interface Result<T> {
  data: T | null;
  error: unknown;
}
/** The supported SDK surface deliberately has no factor-removal operation. */
export interface MfaSetupApi {
  listFactors(): Promise<Result<{ all: MfaFactor[] }>>;
  enroll(params: {
    factorType: "totp";
    friendlyName: string;
  }): Promise<Result<{ id: string; totp?: { qr_code: string; secret: string } }>>;
  challenge(params: { factorId: string }): Promise<Result<{ id: string }>>;
  verify(params: {
    factorId: string;
    challengeId: string;
    code: string;
  }): Promise<{ error: unknown }>;
}
interface SetupState {
  phase: MfaPhase;
  factorId: string | null;
  qrCode: string | null;
  secret: string | null;
  code: string;
  error: string | null;
  busy: boolean;
}
const EMPTY: SetupState = {
  phase: "checking",
  factorId: null,
  qrCode: null,
  secret: null,
  code: "",
  error: null,
  busy: false,
};
const START_ERROR =
  "Multifactor authentication could not be started. Check setup again or sign out and try again.";
const SETUP_ERROR =
  "Authenticator setup could not be checked. Check setup again; if it was restarted, use the new setup key.";
const errorCode = (error: unknown) =>
  error && typeof error === "object" && "code" in error ? error.code : null;
const existingFactor = (factors: MfaFactor[]) =>
  factors.find((factor) => factor.factor_type === "totp" && factor.status === "verified") ??
  factors.find((factor) => factor.factor_type === "totp" && factor.status === "unverified");

/** Secrets and codes live only in this gate's memory. Another tab's pending
 * factor is usable for verification, but its QR/secret is never copied here. */
export function useMfaSetup(mfa: MfaSetupApi | null, onVerified: () => void) {
  const [state, setState] = useState<SetupState>(EMPTY);
  const active = useRef(false);
  const inFlight = useRef(false);
  const showFactor = useCallback((factor: MfaFactor) => {
    setState({
      ...EMPTY,
      factorId: factor.id,
      phase: factor.status === "verified" ? "challenging" : "pending",
    });
  }, []);
  const begin = useCallback(async () => {
    if (!active.current || inFlight.current) return;
    if (!mfa) {
      setState({ ...EMPTY, phase: "error", error: "Sign-in is not configured." });
      return;
    }
    inFlight.current = true;
    setState({ ...EMPTY, busy: true });
    try {
      const listed = await mfa.listFactors();
      if (!active.current) return;
      if (listed.error || !Array.isArray(listed.data?.all)) throw new Error(START_ERROR);
      const existing = existingFactor(listed.data.all);
      if (existing) {
        showFactor(existing);
        return;
      }

      const enrolled = await mfa.enroll({
        factorType: "totp",
        friendlyName: "Reviewer authenticator",
      });
      if (!active.current) return;
      if (enrolled.error) {
        // A second tab may have filled the single factor slot after our read.
        // Re-read once; never delete the other tab's setup to make room.
        const raced = await mfa.listFactors();
        if (!active.current) return;
        if (!raced.error && Array.isArray(raced.data?.all)) {
          const existing = existingFactor(raced.data.all);
          if (existing) {
            showFactor(existing);
            return;
          }
        }
        throw new Error(START_ERROR);
      }
      const enrolledFactor = enrolled.data;
      if (!enrolledFactor?.id || !enrolledFactor.totp?.qr_code || !enrolledFactor.totp.secret)
        throw new Error(START_ERROR);
      setState({
        ...EMPTY,
        phase: "enrolling",
        factorId: enrolledFactor.id,
        qrCode: enrolledFactor.totp.qr_code,
        secret: enrolledFactor.totp.secret,
      });
    } catch {
      if (active.current) setState({ ...EMPTY, phase: "error", error: START_ERROR });
    } finally {
      inFlight.current = false;
      if (active.current) setState((current) => ({ ...current, busy: false }));
    }
  }, [mfa, showFactor]);

  useEffect(() => {
    active.current = true;
    void begin();
    return () => {
      active.current = false;
    };
  }, [begin]);

  const setCode = useCallback((code: string) => setState((current) => ({ ...current, code })), []);
  const verify = useCallback(async () => {
    if (!active.current || inFlight.current || !mfa || !state.factorId) return;
    const code = state.code.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(code)) {
      setState((current) => ({
        ...current,
        error: "Enter the six-digit code from your authenticator app.",
      }));
      return;
    }
    inFlight.current = true;
    const returnPhase =
      state.phase === "pending" ? "pending" : state.secret ? "enrolling" : "challenging";
    setState((current) => ({ ...current, phase: "verifying", busy: true, error: null }));
    try {
      const challenge = await mfa.challenge({ factorId: state.factorId });
      if (!active.current) return;
      if (challenge.error || !challenge.data?.id) throw new Error(SETUP_ERROR);
      const result = await mfa.verify({
        factorId: state.factorId,
        challengeId: challenge.data.id,
        code,
      });
      if (!active.current) return;
      if (result.error) {
        if (errorCode(result.error) === "mfa_verification_failed") {
          setState((current) => ({
            ...current,
            phase: returnPhase,
            code: "",
            error: "That code was not accepted. Wait for the next code and try again.",
          }));
          return;
        }
        throw new Error(SETUP_ERROR);
      }
      setState({ ...EMPTY, phase: "done" });
      onVerified();
    } catch {
      if (active.current) setState({ ...EMPTY, phase: "error", error: SETUP_ERROR });
    } finally {
      inFlight.current = false;
      if (active.current) setState((current) => ({ ...current, busy: false }));
    }
  }, [mfa, onVerified, state.code, state.factorId, state.phase, state.secret]);
  return { ...state, setCode, begin, verify };
}
