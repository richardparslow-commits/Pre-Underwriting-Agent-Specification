/** Compare the saved, canonical customer content without server/workflow metadata. */
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordered);
  if (!record(value)) return value;
  return Object.fromEntries(
    Object.keys(value).sort().filter((key) => value[key] !== undefined)
      .map((key) => [key, ordered(value[key])]),
  );
}

function content(value: unknown): string | null {
  if (
    !record(value) || !record(value.lead) || !Array.isArray(value.answers) ||
    !Array.isArray(value.consents) || !Array.isArray(value.acknowledgements) ||
    !value.answers.every(record) || !value.consents.every(record) ||
    !value.acknowledgements.every(record)
  ) return null;
  // completedAt changes when the client rebuilds an otherwise identical draft.
  // Consent and acknowledgement timestamps are evidence and remain compared.
  const fields = [
    "questionnaireVersion",
    "startedAt",
    "lead",
    "answers",
    "consents",
    "acknowledgements",
    "adultAttested",
    "relationship",
  ];
  const snapshot = Object.fromEntries(fields.map((key) => [key, value[key]]));
  // The canonical validator accepts consent records in either order.
  snapshot.consents = [...value.consents].sort((a, b) =>
    String(a.id).localeCompare(String(b.id))
  );
  return JSON.stringify(ordered(snapshot));
}

export function sameSubmissionContent(
  saved: unknown,
  incoming: unknown,
): boolean {
  const before = content(saved);
  return before !== null && before === content(incoming);
}
