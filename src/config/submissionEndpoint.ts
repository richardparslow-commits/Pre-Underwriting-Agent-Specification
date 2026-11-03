/** A configured relay must fail closed, never fall back to the direct gateway. */
export function submissionEndpoint(override: string | undefined, backend: string): string {
  if (override === undefined || override === "") {
    return backend ? `${backend.replace(/\/$/, "")}/functions/v1/submit-case` : "";
  }
  try {
    const url = new URL(override);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
      !["/submit-case", "/functions/v1/submit-case"].includes(url.pathname)) return "";
    return url.href;
  } catch { return ""; }
}
