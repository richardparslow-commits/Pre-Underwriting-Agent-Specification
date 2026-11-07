import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface ReviewerSignInDraftValue {
  address: string;
  setAddress: (address: string) => void;
  clear: () => void;
}

const ReviewerSignInDraftContext =
  createContext<ReviewerSignInDraftValue | null>(null);

/**
 * Keeps an unsent reviewer sign-in address alive while the reviewer follows an
 * in-app link. This is memory only: no address goes to storage or the URL.
 */
export function ReviewerSignInDraftProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [address, setAddress] = useState("");
  const clear = useCallback(() => setAddress(""), []);
  const value = useMemo(
    () => ({ address, setAddress, clear }),
    [address, clear],
  );

  return (
    <ReviewerSignInDraftContext.Provider value={value}>
      {children}
    </ReviewerSignInDraftContext.Provider>
  );
}

export function useReviewerSignInDraft() {
  const value = useContext(ReviewerSignInDraftContext);
  if (!value) {
    throw new Error(
      "useReviewerSignInDraft must be used within ReviewerSignInDraftProvider",
    );
  }
  return value;
}
