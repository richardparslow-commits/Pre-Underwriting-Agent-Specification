import type { CasePage } from "@/lib/api";

type QueueLoadCallbacks = {
  started: (appending: boolean) => void;
  received: (page: CasePage, appending: boolean) => void;
  failed: (error: unknown) => void;
  finished: () => void;
};

/** Ignore overlapping requests synchronously, before React can render disabled controls. */
export async function runQueueLoad(
  busy: { current: boolean },
  fetchPage: (cursor?: string) => Promise<CasePage>,
  callbacks: QueueLoadCallbacks,
  cursor?: string,
): Promise<void> {
  if (busy.current) return;
  busy.current = true;
  try {
    const appending = Boolean(cursor);
    callbacks.started(appending);
    const page = await fetchPage(cursor);
    callbacks.received(page, appending);
  } catch (error) {
    callbacks.failed(error);
  } finally {
    busy.current = false;
    callbacks.finished();
  }
}
