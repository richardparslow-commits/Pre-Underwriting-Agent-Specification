import { useCallback, useMemo, useState } from "react";
import {
  buildCaseDraft,
  crisisDisclosed,
  ORDERED_QUESTIONS,
  progressFor,
  pruneBranchClosedAnswers,
  visibleQuestions,
} from "./engine";
import type {
  AnswerRecord,
  Answers,
  CaseDraft,
  ConsentId,
  ConsentRecord,
  LeadDetails,
  SubmissionAcknowledgement,
  SubmissionReceipt,
} from "./types";
import { QUESTIONNAIRE_VERSION } from "./types";
import { QUESTION_BY_ID } from "./questionBank";
import {
  buildConsentRecords,
  CONSENT_VERSION,
  SUBMISSION_ACKNOWLEDGEMENT_TEXT,
  type ConsentSelection,
  type ConsentTimestamps,
} from "@/features/consent/consentTexts";

export type IntakeStep = "lead" | "permission" | "interview" | "review" | "submitted";

export interface ConsentState extends ConsentSelection {
  timestamps: ConsentTimestamps;
}

/** Selection keys and consent-record ids are deliberately different shapes. */
const CONSENT_ID_BY_KEY: Record<keyof ConsentSelection, ConsentId> = {
  intakePermission: "intake_permission",
  privacyAcknowledged: "privacy_acknowledgement",
  marketingCall: "marketing_call",
  marketingText: "marketing_text",
};

const EMPTY_CONSENT: ConsentState = {
  intakePermission: false,
  privacyAcknowledged: false,
  marketingCall: false,
  marketingText: false,
  timestamps: {},
};

export interface InterviewHook {
  step: IntakeStep;
  lead: Partial<LeadDetails>;
  consent: ConsentState;
  answers: Answers;
  acknowledgements: SubmissionAcknowledgement[];
  prefilledIds: string[];
  receipt: SubmissionReceipt | null;
  draft: CaseDraft | null;
  /** Stable intake operation key: retries deduplicate; edits after a saved request conflict. */
  submissionKey: string;
  currentQuestionId: string | null;
  crisis: boolean;
  progress: ReturnType<typeof progressFor>;
  setLeadField: (field: keyof LeadDetails, value: string) => void;
  setAdultAttested: (value: boolean) => void;
  setConsent: (key: keyof ConsentSelection, value: boolean) => void;
  begin: () => void;
  givePermission: () => void;
  backToLead: () => void;
  setAnswer: (questionId: string, patch: Partial<AnswerRecord>) => void;
  goToQuestion: (questionId: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  finishInterview: () => void;
  confirmReview: (confirmed: boolean) => void;
  markSubmitted: (receipt: SubmissionReceipt) => void;
  startOver: () => void;
}

/**
 * The interview state lives in memory only. Health answers are intentionally
 * never written to localStorage, sessionStorage, analytics or the URL.
 */
export function useInterview(): InterviewHook {
  const [step, setStep] = useState<IntakeStep>("lead");
  const [lead, setLead] = useState<Partial<LeadDetails>>({
    preferredContact: "email",
    state: "",
    dateOfBirth: "",
    adultAttested: false,
  });
  const [consent, setConsentState] = useState<ConsentState>(EMPTY_CONSENT);
  const [answers, setAnswers] = useState<Answers>({});
  const [acknowledgements, setAcknowledgements] = useState<SubmissionAcknowledgement[]>([]);
  const [prefilledIds, setPrefilledIds] = useState<string[]>([]);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [submissionKey, setSubmissionKey] = useState(() => crypto.randomUUID());
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [startedAt] = useState(() => new Date().toISOString());

  const progress = useMemo(() => progressFor(answers), [answers]);
  const visible = useMemo(() => visibleQuestions(answers), [answers]);
  const crisis = useMemo(() => crisisDisclosed(answers), [answers]);

  const setLeadField = useCallback((field: keyof LeadDetails, value: string) => {
    setLead((current) => ({ ...current, [field]: value }));
    setAcknowledgements([]);
  }, []);

  const setAdultAttested = useCallback((value: boolean) => {
    setLead((current) => ({ ...current, adultAttested: value }));
    setAcknowledgements([]);
  }, []);

  const setConsent = useCallback((key: keyof ConsentSelection, value: boolean) => {
    setConsentState((current) => {
      const timestamps = { ...current.timestamps };
      const consentId = CONSENT_ID_BY_KEY[key];
      if (value) {
        timestamps[consentId] = new Date().toISOString();
      } else {
        delete timestamps[consentId];
      }
      return { ...current, [key]: value, timestamps };
    });
  }, []);

  // Returning from the review screen should not ask for permission twice.
  const begin = useCallback(
    () => setStep(consent.intakePermission ? "interview" : "permission"),
    [consent.intakePermission],
  );

  const givePermission = useCallback(() => {
    if (!consent.intakePermission) return;

    // Reuse a fact the customer already gave, visibly and only where the scope
    // matches: residence state on the lead form and in the interview.
    const residence = QUESTION_BY_ID["ID-03"];
    const birth = QUESTION_BY_ID["ID-01"];
    const state = lead.state?.trim();
    const dateOfBirth = lead.dateOfBirth?.trim();
    const prefill: Answers = {};
    if (residence && state && !answers["ID-03"]) {
      prefill[residence.id] = { value: state, updatedAt: new Date().toISOString() };
    }
    if (birth && dateOfBirth && !answers["ID-01"]) {
      prefill[birth.id] = { value: dateOfBirth, updatedAt: new Date().toISOString() };
    }
    if (Object.keys(prefill).length > 0) {
      setAnswers((current) => ({ ...current, ...prefill }));
      setPrefilledIds(Object.keys(prefill));
    }

    setStep("interview");
    setCurrentQuestionId((current) => current ?? visible[0]?.id ?? null);
  }, [answers, consent.intakePermission, lead.state, visible]);

  const backToLead = useCallback(() => setStep("lead"), []);

  const setAnswer = useCallback((questionId: string, patch: Partial<AnswerRecord>) => {
    setAnswers((current) => {
      const previous = current[questionId] ?? {};
      const next = {
        ...current,
        [questionId]: { ...previous, ...patch, updatedAt: new Date().toISOString() },
      };
      // Closing a parent branch removes the descendant answers immediately, so
      // withdrawn health detail cannot survive into the review screen or case.
      return pruneBranchClosedAnswers(next);
    });
    // Any edit invalidates a prior review confirmation: the customer must see
    // the new complete picture before it is submitted.
    setAcknowledgements([]);
  }, []);

  const goToQuestion = useCallback((questionId: string) => {
    setCurrentQuestionId(questionId);
    setStep("interview");
  }, []);

  const move = useCallback(
    (direction: 1 | -1) => {
      setCurrentQuestionId((current) => {
        if (!current) return visible[0]?.id ?? null;
        const index = visible.findIndex((question) => question.id === current);
        const nextIndex = Math.max(0, Math.min(visible.length - 1, index + direction));
        const next = visible[nextIndex];
        if (next) return next.id;
        return current;
      });
    },
    [visible],
  );

  const nextQuestion = useCallback(() => {
    const index = currentQuestionId
      ? visible.findIndex((question) => question.id === currentQuestionId)
      : -1;
    if (index >= visible.length - 1) {
      setStep("review");
      return;
    }
    move(1);
  }, [currentQuestionId, move, visible]);

  const previousQuestion = useCallback(() => move(-1), [move]);

  const finishInterview = useCallback(() => setStep("review"), []);

  const confirmReview = useCallback((confirmed: boolean) => {
    setAcknowledgements(() => {
      if (!confirmed) return [];
      return [
        {
          id: "submission_requested",
          text: SUBMISSION_ACKNOWLEDGEMENT_TEXT,
          textVersion: CONSENT_VERSION,
          timestamp: new Date().toISOString(),
        },
      ];
    });
  }, []);

  const draft = useMemo<CaseDraft | null>(() => {
    if (
      !lead.firstName ||
      !lead.lastName ||
      !lead.state ||
      !lead.dateOfBirth ||
      !lead.email ||
      !lead.preferredContact ||
      lead.adultAttested !== true
    ) {
      return null;
    }
    if (acknowledgements.length === 0) return null;

    const consents: ConsentRecord[] = buildConsentRecords(
      consent,
      consent.marketingCall || consent.marketingText ? lead.phone : undefined,
      consent.timestamps,
    );

    return buildCaseDraft({
      lead: lead as LeadDetails,
      answers,
      consents,
      acknowledgements,
      startedAt,
      adultAttested: true,
    });
  }, [acknowledgements, answers, consent, lead, startedAt]);

  const markSubmitted = useCallback((next: SubmissionReceipt) => {
    setReceipt(next);
    setStep("submitted");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const startOver = useCallback(() => {
    setStep("lead");
    setLead({ preferredContact: "email", state: "", dateOfBirth: "", adultAttested: false });
    setConsentState(EMPTY_CONSENT);
    setAnswers({});
    setAcknowledgements([]);
    setPrefilledIds([]);
    setReceipt(null);
    setSubmissionKey(crypto.randomUUID());
    setCurrentQuestionId(null);
  }, []);

  // A question can disappear (a branch closes) or a held row can never appear.
  const safeCurrentId = useMemo(() => {
    if (currentQuestionId && visible.some((question) => question.id === currentQuestionId)) {
      return currentQuestionId;
    }
    return visible[0]?.id ?? null;
  }, [currentQuestionId, visible]);

  return {
    step,
    lead,
    consent,
    answers,
    acknowledgements,
    prefilledIds,
    receipt,
    draft,
    submissionKey,
    currentQuestionId: safeCurrentId,
    crisis,
    progress,
    setLeadField,
    setAdultAttested,
    setConsent,
    begin,
    givePermission,
    backToLead,
    setAnswer,
    goToQuestion,
    nextQuestion,
    previousQuestion,
    finishInterview,
    confirmReview,
    markSubmitted,
    startOver,
  };
}

export const TOTAL_QUESTIONS = ORDERED_QUESTIONS.filter(
  (question) => question.reviewStatus === "approved",
).length;

export const QUESTIONNAIRE_LABEL = `Questionnaire ${QUESTIONNAIRE_VERSION}`;
