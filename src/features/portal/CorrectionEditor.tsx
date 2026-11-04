import { useEffect, useRef, useState } from "react";
import { Loader2, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { recordCorrection } from "@/lib/api";

type Save = (
  reference: string,
  detail: string,
  requestId: string,
) => Promise<void>;
export function CorrectionEditor({
  reference,
  onRefresh,
  save = recordCorrection,
}: {
  reference: string;
  onRefresh: () => Promise<void> | void;
  save?: Save;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const pending = useRef(false);
  const active = useRef(true);
  const operation = useRef<{
    reference: string;
    detail: string;
    id: string;
  } | null>(null);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function submit() {
    if (pending.current || !text.trim()) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const detail = text.trim();
      if (
        operation.current?.reference !== reference ||
        operation.current.detail !== detail
      ) {
        operation.current = { reference, detail, id: crypto.randomUUID() };
      }
      await save(reference, operation.current.detail, operation.current.id);
      if (!active.current) return;
      operation.current = null;
      setText("");
      setOpen(false);
      setStatus(
        "Correction saved. If the history has not updated, refresh this case before recording it again.",
      );
      try {
        await onRefresh();
      } catch {
        if (active.current)
          setStatus(
            "Correction saved, but the history could not be refreshed. Refresh this case before recording it again.",
          );
      }
    } catch (failure) {
      if (active.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "The correction save could not be confirmed. Retry without changing the text.",
        );
    } finally {
      pending.current = false;
      if (active.current) setBusy(false);
    }
  }
  return (
    <>
      {status ? (
        <p role="status" className="mt-3 text-sm">
          {status}
        </p>
      ) : null}
      {open ? (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <label htmlFor="correction-detail" className="field-label">
            What did the customer correct?
          </label>
          <Textarea
            id="correction-detail"
            value={text}
            maxLength={4000}
            disabled={busy}
            onChange={(event) => {
              if (!pending.current) {
                setText(event.target.value);
                setError(null);
              }
            }}
            placeholder="For example: the customer confirmed the surgery was in February, not March."
          />
          {error ? (
            <p role="alert" className="text-xs font-medium text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void submit()}
              disabled={busy || !text.trim()}
            >
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Save correction
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                if (!pending.current) {
                  setOpen(false);
                  setError(null);
                }
              }}
            >
              Cancel
            </Button>
          </div>
          <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
            This adds an entry beside the case. It does not change the submitted
            answers or send the customer an email. After an uncertain save,
            retry the unchanged text to avoid a duplicate.
          </p>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          disabled={busy}
          onClick={() => {
            if (!pending.current) {
              setStatus(null);
              setOpen(true);
            }
          }}
        >
          <PencilLine aria-hidden />
          Record a correction
        </Button>
      )}
    </>
  );
}
