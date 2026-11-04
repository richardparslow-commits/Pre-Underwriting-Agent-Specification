export interface CorrectionWriter {
  rpc(
    name: string,
    args: Record<string, string>,
  ): PromiseLike<{
    data: unknown;
    error: { code?: string; message?: string } | null;
  }>;
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
  } catch {
    throw new Error(
      "The correction save could not be confirmed. Retry the unchanged correction to check the same save safely.",
    );
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
    throw new Error(
      "The correction save could not be confirmed. Retry the unchanged correction to check the same save safely.",
    );
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
    throw new Error(
      "The correction save could not be confirmed. Retry the unchanged correction to check the same save safely.",
    );
  }
}
