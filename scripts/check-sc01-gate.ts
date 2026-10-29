/**
 * Fails when the SC-01 closure note, the owner attestation and the live
 * registers disagree about whether step 8 has been taken.
 *
 * The rule lives in `scripts/sc01-gate.ts`. This file owns the paths, the
 * contract table that pins the rule's boundaries, and the exit code.
 *
 * Three outcomes, and only one is green:
 *
 *  * the attestation is incomplete — exit 2 when enforced, exit 0 with a
 *    warning annotation when not. The gate is open, and a green build must not
 *    let it become background noise — but an open launch gate is not a defect
 *    in the branch under review, so blocking every pull request on the owner's
 *    signature would teach people to route around CI. CI enforces on pushes to
 *    a protected branch and reports a warning everywhere else.
 *  * the documents disagree — exit 1, on every branch. A resolution recorded
 *    before the owner attested, or a completed attestation the registers never
 *    picked up. That is drift the author introduced and can fix.
 *  * closed and consistent — exit 0.
 *
 * Enforcement is the `SC01_ENFORCE` env var: `0` reports advisories, anything
 * else (including an unset variable) enforces. Unset means fail closed, so a
 * local run and a CI job that forgets to set it both behave like `main`.
 *
 * The decision-record hash is expected to keep failing — a pass would mean the
 * issued hash had been overwritten, which is `AS-08`, not a fix.
 *
 * Run: `npm run check:sc01`. Pass a directory to check a copy of the documents.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  evaluateGate,
  m1CommitOk,
  reviewClosure,
  type Documents,
  type Failure,
  type GateState,
} from "./sc01-gate";

// An argument lets the completed world be exercised against a copy of the
// documents; CI passes none and checks the repository itself.
const root = resolve(process.argv[2] ?? ".");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const documents: Documents = {
  attestation: read("audit/2026-10-28-sc-01-owner-attestation.md"),
  note: read("audit/2026-10-28-sc-01-closure-note.md"),
  register: read("audit/2026-10-28-consolidated-master-issues.md"),
  signOff: read("audit/2026-10-28-owner-signoff-pack.md"),
  issueRecord: read("audit/2026-10-28-sc-01-issue.sha256"),
};

/** Exit codes, so CI can tell an open gate from a broken one. */
const EXIT_INCONSISTENT = 1;
const EXIT_GATE_OPEN = 2;

// Branch scope is CI's decision; this file only honours it. Anything other than
// an explicit "0" enforces, so a missing variable fails closed.
const enforced = process.env.SC01_ENFORCE !== "0";

const failures: string[] = [];
const fail = (message: string) => failures.push(message);

// 1. The gate as a contract: one table, every branch and boundary that matters.
const base: GateState = {
  partA: ["A1"],
  partB: ["B1"],
  status: ["mark"],
  method: ["M1"],
  methodEvidence: true,
  attestationHash: "a".repeat(64),
  ownerCompletion: true,
  addendumRecorded: false,
  hashesOk: true,
};

const cases: Array<[string, Partial<GateState>, Failure["condition"][]]> = [
  ["complete: A1 + B1", {}, []],
  ["complete: A1 + B2 adoption", { partB: ["B2"] }, []],
  ["complete: A1 + B3 corrected attribution", { partB: ["B3"] }, []],
  ["complete: A2 with addendum", { partA: ["A2"], addendumRecorded: true }, []],
  ["stop: A2 without addendum", { partA: ["A2"] }, ["C1"]],
  ["stop: A3 revision not confirmed", { partA: ["A3"] }, ["C1"]],
  ["stop: two Part A ticks", { partA: ["A1", "A3"] }, ["C1"]],
  ["stop: no Part A tick", { partA: [] }, ["C1"]],
  ["stop: no Part B tick", { partB: [] }, ["C2"]],
  ["stop: two Part B ticks", { partB: ["B1", "B2"] }, ["C2"]],
  ["stop: owner left it open", { status: ["leave"] }, ["C3"]],
  ["stop: M1 without a commit SHA", { methodEvidence: false }, ["C4"]],
  ["stop: hash truncated", { attestationHash: "a".repeat(63) }, ["C4"]],
  ["stop: owner completion unticked", { ownerCompletion: false }, ["C4"]],
  ["stop: issue-record hash restored", { hashesOk: false }, ["C5"]],
  [
    "draft: nothing attested",
    {
      partA: [],
      partB: [],
      status: [],
      method: [],
      methodEvidence: false,
      attestationHash: "",
      ownerCompletion: false,
    },
    ["C1", "C2", "C3", "C4"],
  ],
];

for (const [name, patch, expected] of cases) {
  const got = [...new Set(evaluateGate({ ...base, ...patch }).map((f) => f.condition))];
  if (got.join(",") !== expected.join(",")) {
    fail(`${name}: expected ${expected.join(",") || "closure"}, got ${got.join(",") || "closure"}`);
  }
}

// 1b. M1's evidence is a note field, not a box in the attestation, so the file
// whose hash the note pins never has to change after the commit. A value that
// cannot be resolved is not evidence: prefixes, uppercase and blanks all fail.
const commitCases: Array<[string, string, boolean]> = [
  ["40-hex SHA-1", "a".repeat(40), true],
  ["64-hex SHA-256", "a".repeat(64), true],
  ["39-hex prefix", "a".repeat(39), false],
  ["41-hex", "a".repeat(41), false],
  ["uppercase", "A".repeat(40), false],
  ["blank", "", false],
  ["underscores", "_".repeat(40), false],
];

for (const [name, value, expected] of commitCases) {
  if (m1CommitOk(value) !== expected) {
    fail(`M1 ${name}: expected ${expected ? "accepted" : "rejected"}`);
  }
}

// 2. The documents on disk, judged by the same rule.
const review = reviewClosure(documents, read);
for (const problem of review.problems) fail(problem);

// An inconsistent tree is a defect, not a gate state: fix that first.
if (failures.length > 0) {
  for (const message of failures) console.error(`FAIL: ${message}`);
  console.error(`\nSC-01 gate check failed with ${failures.length} issue(s).`);
  process.exit(EXIT_INCONSISTENT);
}

// Consistent, but still open. Enforced on a protected branch: a green pipeline
// there must mean the gate is closed, or nobody notices that step 8 was never
// taken. Advisory elsewhere, so a feature branch is not held hostage to a
// signature only the owner can provide.
if (!review.fires) {
  const openOn = [...new Set(review.gate.map((f) => f.condition))].join(", ");
  const summary =
    `The attestation is incomplete (blocked on ${openOn}); ${cases.length} gate cases and ` +
    `${commitCases.length} M1 evidence cases pass. ` +
    `This stays red until the owner completes audit/2026-10-28-sc-01-owner-attestation.md ` +
    `and the registers are updated. Do not silence it by deleting the step.`;

  if (!enforced) {
    console.log("::warning::SC-01 gate is open — step 8 has not been taken. Advisory on this ref.");
    console.log(summary);
    process.exit(0);
  }

  console.error("::error::SC-01 gate is open — step 8 has not been taken.");
  console.error(summary);
  process.exit(EXIT_GATE_OPEN);
}

console.log(
  `SC-01 gate: ${cases.length} gate cases and ${commitCases.length} M1 evidence cases pass; ` +
    `closed and consistent — step 8 recorded, registers updated.`,
);
