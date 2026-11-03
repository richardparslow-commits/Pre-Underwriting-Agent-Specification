import { useCallback, useEffect, useRef, useState } from "react";

export type MfaPhase =
  | "checking"
  | "enrolling"
  | "pending"
  | "challenging"
  | "verifying"
  | "done"
  | "error";
export interface MfaFactor {
  id: string;
  factor_type: string;
  status: string;
  friendly_name?: string;
}
interface Result<T> {
  data: T | null;
  error: unknown;
}
/** Removal is available only to explicit recovery of this mounted tab's lost enrollment. */
export interface MfaSetupApi {
  listFactors(): Promise<Result<{ all: MfaFactor[] }>>;
  enroll(params: {
    factorType: "totp";
    friendlyName: string;
  }): Promise<
    Result<{ id: string; totp?: { qr_code: string; secret: string } }>
  >;
  unenroll?(params: { factorId: string }): Promise<{ error: unknown }>;
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
  canRestart: boolean;
}
const EMPTY: SetupState = {
  phase: "checking",
  factorId: null,
  qrCode: null,
  secret: null,
  code: "",
  error: null,
  busy: false,
  canRestart: false,
};
const START_ERROR =
  "Multifactor authentication could not be started. Check setup again or sign out and try again.";
const SETUP_ERROR =
  "Authenticator setup could not be checked. Try a fresh code, or check setup again.";
const errorCode = (error: unknown) =>
  error && typeof error === "object" && "code" in error ? error.code : null;
const existingFactor = (factors: MfaFactor[]) =>
  factors.find(
    (factor) => factor.factor_type === "totp" && factor.status === "verified",
  ) ??
  factors.find(
    (factor) => factor.factor_type === "totp" && factor.status === "unverified",
  );

/** Secrets and codes live only in this gate's memory. Another tab's pending
 * factor is usable for verification, but its QR/secret is never copied here. */
export function useMfaSetup(mfa: MfaSetupApi | null, onVerified: () => void) {
  const [state, setState] = useState<SetupState>(EMPTY);
  const active = useRef(false);
  const inFlight = useRef(false);
  const ownedAttempt = useRef<string | null>(null);
  const showFactor = useCallback(
    (factor: MfaFactor) => {
      setState((current) => {
        // Only this component's matching unverified enrollment owns its one-time
        // QR/key. Another tab's factor never supplies or inherits those values.
        if (
          factor.status === "unverified" &&
          current.factorId === factor.id &&
          current.qrCode &&
          current.secret
        ) {
          return {
            ...current,
            phase: "enrolling",
            code: "",
            error: null,
            busy: false,
          };
        }
        return {
          ...EMPTY,
          factorId: factor.id,
          phase: factor.status === "verified" ? "challenging" : "pending",
          canRestart: Boolean(
            mfa?.unenroll &&
            factor.status === "unverified" &&
            ownedAttempt.current &&
            factor.friendly_name === ownedAttempt.current,
          ),
        };
      });
    },
    [mfa],
  );
  const begin = useCallback(async () => {
    if (!active.current || inFlight.current) return;
    if (!mfa) {
      setState({
        ...EMPTY,
        phase: "error",
        error: "Sign-in is not configured.",
      });
      return;
    }
    inFlight.current = true;
    setState((current) => ({
      ...current,
      phase: current.factorId ? current.phase : "checking",
      code: "",
      error: null,
      busy: true,
    }));
    try {
      const listed = await mfa.listFactors();
      if (!active.current) return;
      if (listed.error || !Array.isArray(listed.data?.all))
        throw new Error(START_ERROR);
      const existing = existingFactor(listed.data.all);
      if (existing) {
        showFactor(existing);
        return;
      }

      // A successful list confirmed the old factor is absent. Its old key must
      // not survive into a new enrollment (including a lost/raced response).
      setState({ ...EMPTY, busy: true });
      ownedAttempt.current = `Reviewer setup ${crypto.randomUUID()}`;
      const enrolled = await mfa.enroll({
        factorType: "totp",
        friendlyName: ownedAttempt.current,
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
      if (
        !enrolledFactor?.id ||
        !enrolledFactor.totp?.qr_code ||
        !enrolledFactor.totp.secret
      )
        throw new Error(START_ERROR);
      setState({
        ...EMPTY,
        phase: "enrolling",
        factorId: enrolledFactor.id,
        qrCode: enrolledFactor.totp.qr_code,
        secret: enrolledFactor.totp.secret,
      });
    } catch {
      if (active.current)
        setState((current) =>
          current.factorId
            ? { ...current, code: "", error: START_ERROR, busy: false }
            : { ...EMPTY, phase: "error", error: START_ERROR },
        );
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

  // An explicit user action may replace only this mounted tab's unverified
  // attempt whose one-time response was lost. Never persist the ownership marker.
  const restart = useCallback(async () => {
    if (
      !active.current ||
      inFlight.current ||
      !mfa?.unenroll ||
      !state.canRestart ||
      !state.factorId ||
      !ownedAttempt.current
    )
      return;
    const id = state.factorId,
      name = ownedAttempt.current;
    inFlight.current = true;
    setState((current) => ({ ...current, code: "", error: null, busy: true }));
    try {
      const listed = await mfa.listFactors();
      if (!active.current) return;
      if (listed.error || !Array.isArray(listed.data?.all))
        throw new Error(START_ERROR);
      const factors = listed.data.all;
      const verified = factors.find(
        (f) => f.factor_type === "totp" && f.status === "verified",
      );
      if (verified) {
        showFactor(verified);
        return;
      }
      const target = factors.find((f) => f.id === id);
      if (
        target &&
        (target.factor_type !== "totp" ||
          target.status !== "unverified" ||
          target.friendly_name !== name)
      ) {
        setState({ ...EMPTY, phase: "error", error: START_ERROR });
        return;
      }
      if (target) {
        // The production adapter pins an AAL1 token for removal. Supabase
        // rejects that token if the factor becomes verified after our read.
        const removed = await mfa.unenroll({ factorId: id });
        if (!active.current) return;
        if (removed.error) throw new Error(START_ERROR);
      }
      ownedAttempt.current = null;
      setState({ ...EMPTY });
      inFlight.current = false;
      await begin(); // re-list: another tab may have enrolled in the meantime
    } catch {
      if (active.current)
        setState((current) => ({
          ...current,
          code: "",
          error: START_ERROR,
          busy: false,
        }));
    } finally {
      inFlight.current = false;
      if (active.current) setState((current) => ({ ...current, busy: false }));
    }
  }, [begin, mfa, showFactor, state.canRestart, state.factorId]);

  const setCode = useCallback(
    (code: string) => setState((current) => ({ ...current, code })),
    [],
  );
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
      state.phase === "pending"
        ? "pending"
        : state.secret
          ? "enrolling"
          : "challenging";
    setState((current) => ({
      ...current,
      phase: "verifying",
      busy: true,
      error: null,
    }));
    try {
      const challenge = await mfa.challenge({ factorId: state.factorId });
      if (!active.current) return;
      if (challenge.error) throw challenge.error;
      if (!challenge.data?.id) throw new Error(SETUP_ERROR);
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
            error:
              "That code was not accepted. Wait for the next code and try again.",
          }));
          return;
        }
        throw result.error;
      }
      setState({ ...EMPTY, phase: "done" });
      onVerified();
    } catch (verificationError) {
      if (active.current)
        setState((current) =>
          errorCode(verificationError) === "mfa_factor_not_found"
            ? { ...EMPTY, phase: "error", error: SETUP_ERROR }
            : { ...current, phase: returnPhase, code: "", error: SETUP_ERROR },
        );
    } finally {
      inFlight.current = false;
      if (active.current) setState((current) => ({ ...current, busy: false }));
    }
  }, [mfa, onVerified, state.code, state.factorId, state.phase, state.secret]);
  return { ...state, setCode, begin, verify, restart };
}
