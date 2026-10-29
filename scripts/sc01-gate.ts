/**
 * SC-01 closure-gate policy.
 *
 * Everything here is text in, verdict out: the five conditions from the
 * closure note, the parsing of the two instruments, and the rule that the live
 * registers may not disagree with the gate. There is no filesystem access, no
 * `process.exit` and no console output, so the rule can be read — and driven —
 * without running a check.
 *
 * `scripts/check-sc01-gate.ts` is the I/O shell; it owns the paths and the
 * exit code.
 */

import { createHash } from "node:crypto";

type PartA = "A1" | "A2" | "A3";
type PartB = "B1" | "B2" | "B3";
type Method = "M1" | "M2" | "M3";
type Status = "mark" | "leave";

export interface GateState {
  /** Part A boxes ticked, in document order. */
  partA: PartA[];
  partB: PartB[];
  status: Status[];
  method: Method[];
  /** The ticked method carries its own evidence (commit SHA, memo hash, wording). */
  methodEvidence: boolean;
  /** SHA-256 of the completed attestation, recorded in the note's §6. */
  attestationHash: string;
  /** The attestation's "Owner completion" line is ticked. */
  ownerCompletion: boolean;
  /** The note records an A2 addendum. */
  addendumRecorded: boolean;
  /** Issue record still reports the specification OK and the decision record FAILED. */
  hashesOk: boolean;
}

export interface Failure {
  condition: "C1" | "C2" | "C3" | "C4" | "C5";
  detail: string;
}

export interface Documents {
  attestation: string;
  note: string;
  register: string;
  signOff: string;
  issueRecord: string;
}

export interface Review {
  /** Empty means the gate fired. */
  gate: Failure[];
  fires: boolean;
  /** Every reason this state cannot be published as recorded, gate included. */
  problems: string[];
}

const RESOLVED = "Resolved — specification amended";
const DRAFT_HEADING = "PREPARED — NOT IN FORCE";

/** The gate as a pure function, so every boundary is a table row rather than prose. */
export function evaluateGate(state: GateState): Failure[] {
  const failed: Failure[] = [];
  const [a] = state.partA;

  if (state.partA.length !== 1) {
    failed.push({ condition: "C1", detail: `Part A has ${state.partA.length} ticks, expected 1` });
  } else if (a === "A3") {
    failed.push({ condition: "C1", detail: "A3 — the revision is not confirmed" });
  } else if (a === "A2" && !state.addendumRecorded) {
    failed.push({ condition: "C1", detail: "A2 needs an addendum recorded before closure" });
  }

  if (state.partB.length !== 1) {
    failed.push({ condition: "C2", detail: `Part B has ${state.partB.length} ticks, expected 1` });
  }

  if (state.status.length !== 1 || state.status[0] !== "mark") {
    failed.push({ condition: "C3", detail: "the owner did not instruct the finding to be marked resolved" });
  }

  if (state.method.length !== 1) {
    failed.push({ condition: "C4", detail: `${state.method.length} evidence methods ticked, expected 1` });
  } else if (!state.methodEvidence) {
    failed.push({ condition: "C4", detail: `${state.method[0]} is ticked but carries no evidence of its own` });
  }
  if (!/^[0-9a-f]{64}$/.test(state.attestationHash)) {
    failed.push({ condition: "C4", detail: "the completed attestation's SHA-256 is not recorded" });
  }
  if (!state.ownerCompletion) {
    failed.push({ condition: "C4", detail: "the owner's completion line is not ticked" });
  }

  if (!state.hashesOk) {
    failed.push({ condition: "C5", detail: "the issue record no longer reports specification OK + record FAILED" });
  }

  return failed;
}

/** An untouched form. Half a form is neither pristine nor complete. */
function isPristine(state: GateState): boolean {
  return (
    state.partA.length === 0 &&
    state.partB.length === 0 &&
    state.status.length === 0 &&
    state.method.length === 0 &&
    !state.ownerCompletion &&
    state.attestationHash === ""
  );
}

function section(text: string, start: string, end: string): string {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  if (from < 0 || to < 0) {
    throw new Error(`document no longer has the "${start}" … "${end}" section this check parses`);
  }
  return text.slice(from, to);
}

const ticked = (block: string, marker: string) =>
  block.includes(`- [x] ${marker}`) || block.includes(`- [X] ${marker}`);

const filled = (value: string | undefined): boolean =>
  typeof value === "string" && !value.includes("___") && value.trim().length > 0;

function blockValue(note: string, label: string): string {
  const pattern = new RegExp(`^\\| ${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\| (.*) \\|$`, "m");
  return (pattern.exec(note)?.[1] ?? "").trim();
}

/**
 * M1's evidence: the object name of the commit that introduced the completed
 * attestation. Full SHA-1 (40) or SHA-256 (64) lowercase hex only — an
 * abbreviated prefix cannot be resolved, and uppercase is not a git object name.
 *
 * It is read from the closure note rather than the attestation because a commit
 * cannot contain its own hash: filling it in afterwards would change the file
 * whose hash the note already records, which is the `AS-08` failure mode.
 */
export function m1CommitOk(value: string): boolean {
  return /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value);
}

function parseAttestation(
  text: string,
): Pick<GateState, "partA" | "partB" | "status" | "method" | "methodEvidence" | "ownerCompletion"> {
  const partA = section(text, "### Part A", "### Part B");
  const partB = section(text, "### Part B", "### Your `SC-01` status instruction");
  const status = section(text, "### Your `SC-01` status instruction", "## 6. How this statement was made");
  const method = section(text, "## 6. How this statement was made", "| Field | Entry |");

  const methodTicks: Method[] = (["M1", "M2", "M3"] as const).filter((id) => ticked(method, `**${id}`));
  // M1 carries no evidence field in this file; `reviewClosure` supplies it from
  // the note. M2 and M3 keep theirs here because neither value changes the file.
  const evidenceField: Record<"M2" | "M3", RegExp> = {
    M2: /SHA-256: `([^`]*)`; custodian: `([^`]*)`/,
    M3: /Exact words: `([^`]*)`; date and time: `([^`]*)`; channel: `([^`]*)`/,
  };
  const chosen = methodTicks.length === 1 ? methodTicks[0] : undefined;
  const evidence = chosen === "M2" || chosen === "M3" ? evidenceField[chosen].exec(text) : null;
  const methodEvidence = evidence ? evidence.slice(1).every(filled) : false;

  return {
    partA: (["A1", "A2", "A3"] as const).filter((id) => ticked(partA, `**${id}`)),
    partB: (["B1", "B2", "B3"] as const).filter((id) => ticked(partB, `**${id}`)),
    status: [
      ...(ticked(status, "**Mark `SC-01` Resolved") ? (["mark"] as const) : []),
      ...(ticked(status, "**Leave `SC-01` open") ? (["leave"] as const) : []),
    ],
    method: methodTicks,
    methodEvidence,
    ownerCompletion: /\*\*Owner completion:\*\* `\[[xX]\]`/.test(text),
  };
}

function parseClosureNote(
  text: string,
): Pick<GateState, "attestationHash" | "addendumRecorded"> & { m1Commit: string } {
  // An A2 addendum has its own row. Reading the B2/B3 correction row instead
  // would let a ticked attribution correction stand in for an A2 addendum.
  const addendum = blockValue(text, "A2 addendum (A2 only)");
  const raw = blockValue(text, "Completed attestation SHA-256").replace(/[`\s]/g, "");
  const commit = blockValue(text, "M1 commit SHA (M1 only)").replace(/[`\s]/g, "");
  return {
    // An unfilled cell is underscores; it must read as absent, not as a hash.
    attestationHash: raw.includes("___") ? "" : raw,
    addendumRecorded: /\[x\]\s*recorded as:\s*[^_`|]*[A-Za-z]/.test(addendum),
    // M1's evidence lives here, outside the file whose hash this note records.
    m1Commit: commit.includes("___") ? "" : commit,
  };
}

/**
 * Recomputed, not trusted: the specification must still match its issued hash
 * and the decision record must still not. A pass on the record would mean the
 * issued hash had been overwritten — the `AS-08` finding, not a fix.
 */
function issueRecordVerdict(record: string, readAsset: (path: string) => string): { ok: boolean; detail: string } {
  const entries = record
    .split("\n")
    .filter((line) => /^[0-9a-f]{64} {2}/.test(line))
    .map((line) => {
      const [expected, path] = line.split(/ {2}/);
      const actual = createHash("sha256").update(readAsset(path ?? ""), "utf8").digest("hex");
      return { path: path ?? "", matches: actual === expected };
    });

  const spec = entries.find((entry) => entry.path.endsWith("specification-v1.1.md"));
  const decision = entries.find((entry) => entry.path.endsWith("decision-record.md"));
  return {
    ok: Boolean(spec?.matches) && decision?.matches === false,
    detail: `${entries.length} entries checked`,
  };
}

/**
 * The full verdict: the gate, plus the requirement that the note and the live
 * registers agree with it in both directions. A register may not record a
 * closure the gate has not authorised, and a completed attestation may not
 * leave the registers behind.
 */
export function reviewClosure(docs: Documents, readAsset: (path: string) => string): Review {
  const attestation = parseAttestation(docs.attestation);
  const note = parseClosureNote(docs.note);
  const hashes = issueRecordVerdict(docs.issueRecord, readAsset);
  const { m1Commit, ...noteFields } = note;
  // M1's evidence is held outside the hashed attestation, so a commit SHA that
  // is only knowable after the commit cannot invalidate the recorded hash.
  const methodEvidence =
    attestation.method.length === 1 && attestation.method[0] === "M1"
      ? m1CommitOk(m1Commit)
      : attestation.methodEvidence;
  const state: GateState = { ...attestation, ...noteFields, methodEvidence, hashesOk: hashes.ok };
  const gate = evaluateGate(state);
  const fires = gate.length === 0;
  const problems: string[] = [];

  // A recorded hash that is merely 64 hex characters proves nothing: it has to
  // describe this file. Checked only once the gate has fired, so an open gate
  // stays "open" (exit 2) rather than becoming "inconsistent" (exit 1).
  if (fires) {
    const actual = createHash("sha256").update(docs.attestation, "utf8").digest("hex");
    if (note.attestationHash !== actual) {
      problems.push(
        `the recorded attestation hash does not match this file (recorded ${note.attestationHash.slice(0, 8) || "none"}…, actual ${actual.slice(0, 8)}…)`,
      );
    }
  }

  if (!hashes.ok) {
    problems.push(`issue record: expected the specification OK and the decision record FAILED (${hashes.detail})`);
  }

  // A form is either untouched or it fires the gate. Half a form is the state
  // that would otherwise pass unnoticed until someone read the registers.
  if (fires && isPristine(state)) {
    problems.push("the gate fired on a blank attestation");
  } else if (!fires && !isPristine(state)) {
    problems.push(
      `the attestation is partially completed: ${gate.map((f) => `${f.condition} (${f.detail})`).join("; ")}`,
    );
  }

  const registerRow = new RegExp(`^\\| MI-05 \\|.*$`, "m").exec(docs.register)?.[0] ?? "";
  const signOffRow = new RegExp(`^\\| O-1 \\|.*$`, "m").exec(docs.signOff)?.[0] ?? "";
  const noteIsDraft = docs.note.includes(DRAFT_HEADING);
  const registerResolved = registerRow.includes(RESOLVED);
  const signOffRecorded = /\*\*Recorded\*\* \|$/.test(signOffRow);

  if (registerRow === "") problems.push("the consolidated register has no MI-05 row to update");
  if (signOffRow === "") problems.push("the sign-off pack has no O-1 row to update");

  if (!fires) {
    if (!noteIsDraft) problems.push(`the closure note no longer reads "${DRAFT_HEADING}" but the gate has not fired`);
    if (registerResolved) problems.push(`the register records "${RESOLVED}" before the gate has fired`);
    if (signOffRecorded) problems.push("the sign-off pack marks O-1 Recorded before the gate has fired");
  } else {
    if (noteIsDraft) problems.push(`the closure note still reads "${DRAFT_HEADING}" after the gate fired`);
    if (!registerResolved) problems.push(`the register MI-05 does not record "${RESOLVED}" after the gate fired`);
    if (!signOffRecorded) problems.push("the sign-off pack O-1 is not Recorded after the gate fired");
  }

  return { gate, fires, problems };
}
