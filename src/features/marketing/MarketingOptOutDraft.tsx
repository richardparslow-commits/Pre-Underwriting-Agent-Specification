import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface MarketingOptOutDraft {
  reference: string;
  phone: string;
  email: string;
  reason: string;
}

const EMPTY_DRAFT: MarketingOptOutDraft = {
  reference: "",
  phone: "",
  email: "",
  reason: "",
};

interface MarketingOptOutDraftValue {
  draft: MarketingOptOutDraft;
  setField: (field: keyof MarketingOptOutDraft, value: string) => void;
  clearDraft: () => void;
}

const MarketingOptOutDraftContext =
  createContext<MarketingOptOutDraftValue | null>(null);

/**
 * Keeps a half-filled stop request alive while the visitor reads an in-app
 * policy page. This is memory only: no contact details go to storage or the URL.
 */
export function MarketingOptOutDraftProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [draft, setDraft] = useState<MarketingOptOutDraft>(EMPTY_DRAFT);

  const setField = useCallback(
    (field: keyof MarketingOptOutDraft, value: string) => {
      setDraft((current) =>
        current[field] === value ? current : { ...current, [field]: value },
      );
    },
    [],
  );

  const clearDraft = useCallback(() => setDraft(EMPTY_DRAFT), []);

  const value = useMemo(
    () => ({ draft, setField, clearDraft }),
    [draft, setField, clearDraft],
  );

  return (
    <MarketingOptOutDraftContext.Provider value={value}>
      {children}
    </MarketingOptOutDraftContext.Provider>
  );
}

export function useMarketingOptOutDraft(): MarketingOptOutDraftValue {
  const value = useContext(MarketingOptOutDraftContext);
  if (!value) {
    throw new Error(
      "useMarketingOptOutDraft must be used within MarketingOptOutDraftProvider",
    );
  }
  return value;
}
