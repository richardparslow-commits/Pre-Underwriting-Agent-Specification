export interface CorrectionWriter {
  rpc(
    name: string,
    args: Record<string, string>,
  ): PromiseLike<{
    data: unknown;
    error: { code?: string; message?: string } | null;
  }>;
}
const CONNECTION_LOST =
  "The correction was not saved because the connection was lost. Reconnect and save it again.";
const UNCONFIRMED =
  "The correction save could not be confirmed. Retry the unchanged correction to check the same save safely.";

function networkFailure(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const name = error instanceof Error ? error.name : "";
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /failed to fetch|networkerror|network request failed|load failed|authretryablefetch/i.test(
    `${name} ${message}`,
  );
}

export function correctionInput(detail: string, requestId: string) {
  const trimmed = detail.trim();
  if (!trimmed) throw new Error("Enter the correction before saving it.");
  if (trimmed.length > 4000)
    throw new Error("Keep the correction within 4,000 characters.");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      requestId,
    )
  )
    throw new Error("A correction request ID is required.");
  return trimmed;
}
export async function writeCorrection(
  client: CorrectionWriter,
  reference: string,
  detail: string,
  requestId: string,
): Promise<void> {
  const trimmed = correctionInput(detail, requestId);
  let result: Awaited<ReturnType<CorrectionWriter["rpc"]>>;
  try {
    result = await client.rpc("record_case_correction", {
      p_reference: reference,
      p_detail: trimmed,
      p_request_id: requestId,
    });
  } catch (error) {
    throw new Error(networkFailure(error) ? CONNECTION_LOST : UNCONFIRMED);
  }
  if (result.error) {
    if (result.error.code === "PGRST202")
      throw new Error(
        "Correction saving needs a backend update. Your text is retained; contact the administrator before retrying.",
      );
    if (result.error.message?.includes("already used for different content"))
      throw new Error(
        "This save request was already used for different correction text. Refresh the case before recording another correction.",
      );
    // Definitive answers from the server are final: inviting a retry of the
    // unchanged correction would loop forever on a deleted case.
    if (/case not found/i.test(result.error.message ?? ""))
      throw new Error("This case no longer exists. The correction was not saved.");
    if (/not authorised|not authorized/i.test(result.error.message ?? ""))
      throw new Error(
        "You are not authorised to record a correction on this case. Sign in again with an authorised reviewer account.",
      );
    if (networkFailure(result.error))
      throw new Error(CONNECTION_LOST);
    throw new Error(UNCONFIRMED);
  }
  const receipt = result.data as {
    recorded?: unknown;
    correction_id?: unknown;
  } | null;
  if (
    receipt?.recorded !== true ||
    typeof receipt.correction_id !== "string" ||
    !/^[1-9][0-9]*$/.test(receipt.correction_id)
  ) {
    throw new Error(UNCONFIRMED);
  }
}
