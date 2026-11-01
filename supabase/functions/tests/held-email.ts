/** Synthetic provider only: settles after nine seconds if cancellation is absent. */
export function heldEmail(mode: "headers" | "body") {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let finish: (() => void) | undefined;
  let signal: AbortSignal | null | undefined;
  const keys: Array<string | null> = [];
  const fetch = (
    _input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    signal = init?.signal;
    keys.push(new Headers(init?.headers).get("Idempotency-Key"));
    if (mode === "headers") {
      return new Promise((resolve, reject) => {
        finish = () => resolve(Response.json({ id: "synthetic-held-message" }));
        timer = setTimeout(() => {
          const complete = finish;
          finish = undefined;
          complete?.();
        }, 9_000);
        signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(signal?.reason);
        }, { once: true });
      });
    }
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        finish = () => {
          controller.enqueue(
            new TextEncoder().encode('{"id":"synthetic-held-message"}'),
          );
          controller.close();
        };
        timer = setTimeout(() => {
          const complete = finish;
          finish = undefined;
          complete?.();
        }, 9_000);
        signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          finish = undefined;
          controller.error(signal?.reason);
        }, { once: true });
      },
    });
    return Promise.resolve(
      new Response(body, { headers: { "content-type": "application/json" } }),
    );
  };
  return {
    fetch: fetch as typeof globalThis.fetch,
    keys,
    aborted: () => signal?.aborted === true,
    close() {
      clearTimeout(timer);
      const complete = finish;
      finish = undefined;
      complete?.();
    },
  };
}
