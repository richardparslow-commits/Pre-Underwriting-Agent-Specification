import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface ClarificationDraft {
  reference: string;
  note: string;
}

interface ClarificationDraftValue {
  draft: ClarificationDraft | null;
  setNote: (reference: string, note: string) => void;
  clearDraft: (reference: string) => void;
}

const ClarificationDraftContext =
  createContext<ClarificationDraftValue | null>(null);

/**
 * Keeps an unsent clarification note alive while the reviewer follows an
 * in-app link. This is memory only: no note text goes to storage or the URL.
 */
export function ClarificationDraftProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [draft, setDraft] = useState<ClarificationDraft | null>(null);

  const setNote = useCallback((reference: string, note: string) => {
    setDraft((current) =>
      current?.reference === reference && current.note === note
        ? current
        : { reference, note },
    );
  }, []);

  const clearDraft = useCallback((reference: string) => {
    setDraft((current) =>
      current?.reference === reference ? null : current,
    );
  }, []);

  const value = useMemo(
    () => ({ draft, setNote, clearDraft }),
    [draft, setNote, clearDraft],
  );

  return (
    <ClarificationDraftContext.Provider value={value}>
      {children}
    </ClarificationDraftContext.Provider>
  );
}

export function useClarificationDraft(reference: string) {
  const value = useContext(ClarificationDraftContext);
  if (!value) {
    throw new Error(
      "useClarificationDraft must be used within ClarificationDraftProvider",
    );
  }

  const note =
    value.draft?.reference === reference ? value.draft.note : "";
  const setNote = useCallback(
    (next: string) => value.setNote(reference, next),
    [reference, value.setNote],
  );
  const clearDraft = useCallback(
    () => value.clearDraft(reference),
    [reference, value.clearDraft],
  );

  return { note, setNote, clearDraft };
}
