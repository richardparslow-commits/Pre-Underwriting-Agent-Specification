# SC-01 closure note — executed

**Prepared:** 28 October 2026\
**Status:** **IN FORCE — `SC-01` resolved 29 October 2026.** Executed on the owner's completed [attestation](2026-10-28-sc-01-owner-attestation.md) and the register updates in §5.\
**Finding:** `SC-01` — High, specification conflict / product decision (A6)\
**Cross-pass IDs:** `MI-05`, `A7-05`\
**Closure rule:** [decision record](2026-10-28-sc-01-decision-record.md) §7 steps 7–8\
**Decision:** Path A approved; specification version `1.1` issued\
**Effective date:** `2026-10-29`

> **Why this is written in advance.** Step 7 of the closure rule asks for a dated note that links the decision record, the issued amendment and the copy-review evidence. Everything except the owner's attestation is already in place. Pre-writing the note leaves one owner action and one recording action, and it deliberately does not pre-date the resolution: until §6 is completed, this file is a draft and no register changes.

---

## 1. What this note records when executed

**When executed, this note records** `SC-01` as **Resolved — specification amended**. The controlling specification is version `1.1`, which describes the deterministic guided interview and the deterministic, source-linked draft summary that the build actually operates. The customer and portal copy already matched that design; the amendment removed the conflict, and the owner attestation attributes the approval artifact.

It is a **specification-conformance closure only**. It is not a legal, clinical, vendor or deployment approval, and it does not close `SC-03`, `SC-04` or `SC-05`.

## 2. Evidence chain

| Artefact | SHA-256 | State at preparation |
|---|---|---|
| [Specification `1.1`](2026-10-28-sc-01-specification-v1.1.md) | `0b3d609931c8902e5e0c1996bd49ae16be113053d0ac5e758b1e471f4e79ebf3` | Issued; matches the issue record |
| [Decision record](2026-10-28-sc-01-decision-record.md) — issued | `d257fea889269438cdfcfc5900fdbf6bbaf7d08c3677b11e29829047d5b3f0aa` | Preserved in the issue record; not the current file |
| [Decision record](2026-10-28-sc-01-decision-record.md) — current | `3ba842e23ddf383746a708775fbd77900fd5848c7b3f04e133301947ba0b275a` | Committed at `406473e`; unchanged at `HEAD` |
| [Copy walkthrough](2026-10-28-sc-01-copy-walkthrough.md) | `dde63b2cdad7ebcb1de3fc34b94ed38febc3ebfdd3d295244f64dfe67207a132` | Matches the integrity receipt |
| [Integrity receipt](2026-10-28-sc-01-decision-record-integrity.md) | `5e93f76e3f0725d941aefd0151d26e3642a6c7c9ec3b4cf30cc2b1f8ce5dbb07` | Additive; records both record hashes |
| [Verification record](2026-10-28-sc-01-verification.md) | `31e46d26332f83fc9b929eb1246c2a9ac3e0b75ed1cd397127c445df2cc05703` | Records `check:docs`, `typecheck`, `build` passing on `e0a0664` |
| [Owner attestation](2026-10-28-sc-01-owner-attestation.md) | `ee3858feee0350e0c6b31e61d2ac93e8e473df0076274dd0a0e542b142cd4c08` | Completed 2026-10-29; the file this note records |

The issue record itself is `audit/2026-10-28-sc-01-issue.sha256`. Its own hash was recorded in the integrity receipt as `88aac5e0daf84c741e77c43c8979b23cdc19ce7a8b8b75c5b71d57114ffcbb53`.

**Integrity rule:** if any of the five fixed hashes above differs when this note is executed, stop. The evidence chain has changed and this note must be revised before it can close anything. Do not update the table to match; record a new note.

## 3. Step status at preparation

| §7 step | Status | Evidence |
|---|---|---|
| 1. Owner approval | Complete | Decision record §8; retained owner instruction |
| 2. Issue specification `1.1` | Complete | Issued amendment; hash matches |
| 3. Apply redlines and sweep references | Complete | Issued amendment §§2–4 |
| 4. Customer-surface copy review | Complete as an **engineering** walkthrough | [Copy walkthrough](2026-10-28-sc-01-copy-walkthrough.md); the owner's role is the subject of `AS-09` and §5 of the attestation |
| 5. `check:docs`, `typecheck`, `build` | Complete | [Verification record](2026-10-28-sc-01-verification.md), run on `e0a0664` |
| 6. Non-customer walkthrough | Complete | Copy walkthrough |
| 7. Dated closure note and register update | **Complete — this file** | In force 2026-10-29 |
| 8. Mark `SC-01` resolved | **Taken — 2026-10-29** | Owner attestation completed |

The decision record's own §7 table still shows step 5 as “Partial” and its header still says closure is pending `typecheck`/`build`. That is a point-in-time snapshot, not a contradiction: the later verification record supplies the passing result. The decision record is not edited, because editing it would break the attribution `AS-08` depends on.

## 4. The gate

All five conditions must hold on the same day:

| # | Condition | Where it is recorded |
|---|---|---|
| C1 | Part A of the attestation is **A1**, or **A2** with an addendum that has been recorded | Attestation §5; addendum in this note §6 |
| C2 | Part B is **B1**, **B2** or **B3**, and any attribution correction required by B2/B3 is written | Attestation §5; this note §6 |
| C3 | The owner ticked **“Mark `SC-01` Resolved — specification amended”** | Attestation §5 |
| C4 | One evidence method is completed **with its own evidence** — a commit SHA for `M1` (recorded in §6 below, never in the attestation), the memo's hash and custodian for `M2`, or the dated retained instruction for `M3` — and the finished attestation's hash is recorded | Attestation §6; this note §6 |
| C5 | `shasum -a 256 -c audit/2026-10-28-sc-01-issue.sha256` still reports the specification `OK` and the decision record `FAILED`, exit `1` | §7 |

If any condition fails, this note stays a draft. `SC-01` stays **Open**, no register is edited, and the intake lock is unaffected.

The condition set is executable: `npm run check:sc01` (`scripts/check-sc01-gate.ts`) evaluates C1–C5 from these two documents and fails in **both** directions — when a register records closure the gate has not authorised, and when a completed attestation has not been carried into the registers. It also fails by design while the gate is open (exit `2`, distinct from exit `1` for an inconsistency), so a green pipeline on a protected branch means `SC-01` is closed rather than merely consistent. CI enforces that on pushes to `main` and `release` only: a pull request reports the open gate as a warning so everyday work is not blocked, while an inconsistency fails on every branch.

## 5. What takes effect on execution

**Status wording recorded in the live registers:**

> `SC-01` — **Resolved — specification amended** (owner attestation recorded 2026-10-29; engineering verification on `e0a0664`).

**What that means:** the specification now describes the deterministic interview and source-linked summary the build operates; no customer surface claims an active AI assistant or an AI-generated summary; `FEATURES.aiExplainerEnabled` remains `false`; no model provider or key is configured.

**What it does not mean:** no AI layer is approved, no legal or vendor review is complete, no hosted deployment or provider delivery is evidenced, and no real customer submission is authorised. `SC-03`, `SC-04`, `SC-05` and every other gate keep their own status.

**Register edits, and only these:**

1. `audit/2026-10-28-consolidated-master-issues.md` — replace the `MI-05` row's status with:
   > **Resolved — specification amended.** Path A approved; specification `1.1` issued; owner attestation recorded [`date`]; `check:docs`/`typecheck`/`build` pass on `e0a0664`. Link this note. No AI layer is approved.
2. Same register — `AS-08` becomes **Resolved — revision attributed**, citing the completed attestation. `AS-09` becomes **Resolved — [owner participated | owner reviewed and adopted the walkthrough | corrected attribution]**, using the box the owner ticked.
3. `audit/2026-10-28-owner-signoff-pack.md` — row `O-1` status becomes **Recorded**, with the attestation and this note as the artifact. The §5 sign-off block row gets the same date.
4. `audit/AUDIT-INDEX.md` — the `SC-01` paragraph records the resolution date and links this note; the attestation sentence changes from “draft” to “completed”.
5. If B2 or B3 was ticked, the attribution correction lives in §6 of this note. The approval block is not edited.

**Do not edit:** the decision record, `2026-10-28-sc-01-issue.sha256`, the integrity receipt, the completed attestation (editing it breaks its hash binding), or anything under `audit/2026-10-28-spec-conformance/` including `CURRENT-FINDING-REGISTER.md` and `MANIFEST.sha256`. That directory is the preserved A6 package; its register states the finding as it stood at `79e8af4` and is not the live index. The live index is the consolidated register.

## 6. Completion block

Complete only when C1–C5 hold. Leave blank otherwise.

| Field | Entry |
|---|---|
| Attestation completed on | `2026-10-29` |
| Part A ticked | `[x] A1  [ ] A2 (+ addendum recorded)  [ ] A3` |
| Part B ticked | `[ ] B1  [ ] B2  [x] B3` |
| Attribution correction (B2/B3) | `[x] recorded as: Engineering walkthrough; owner did not participate.` |
| A2 addendum (A2 only) | `[x] not required  [ ] recorded as: ________________` |
| Owner status instruction | `[x] Mark resolved  [ ] Leave open` |
| Evidence method | `[ ] M1  [ ] M2 memo hash ________________  [x] M3 instruction dated 2026-10-29` |
| M1 commit SHA (M1 only) | `________________` |
| Completed attestation SHA-256 | `ee3858feee0350e0c6b31e61d2ac93e8e473df0076274dd0a0e542b142cd4c08` |
| Recorded by / date | `Engineering / 2026-10-29` |
| Attestation revision history (29 October 2026) | `b20ff6c5…` recorded → `1854a4f5…` draft banner removed → `2a520762…` §8 checklist → `ee3858fe…` M1 restructured. All four revisions are 29 October 2026, before commit or reliance; the current file is the binding one. |

**Execution statement** — copy into the register only after the table above is complete:

> `SC-01` is **Resolved — specification amended** as of `2026-10-29`, on the owner's completed attestation (SHA-256 `ee3858feee0350e0c6b31e61d2ac93e8e473df0076274dd0a0e542b142cd4c08`) and the engineering verification on `e0a0664`. No AI layer is approved.

## 7. Verification before execution

```bash
# Five fixed hashes: compare each with §2. Any difference is a stop.
shasum -a 256 \
  audit/2026-10-28-sc-01-specification-v1.1.md \
  audit/2026-10-28-sc-01-decision-record.md \
  audit/2026-10-28-sc-01-copy-walkthrough.md \
  audit/2026-10-28-sc-01-decision-record-integrity.md \
  audit/2026-10-28-sc-01-verification.md

# Expected: specification OK; decision record FAILED; exit 1. A pass means the
# historical hash was altered and the finding was suppressed.
shasum -a 256 -c audit/2026-10-28-sc-01-issue.sha256

# The current revision is the one committed at 406473e and unchanged at HEAD.
git show 406473e:audit/2026-10-28-sc-01-decision-record.md | shasum -a 256
git show HEAD:audit/2026-10-28-sc-01-decision-record.md | shasum -a 256

# The documentation guard still passes on the tree that will be recorded.
npm run check:docs

# The gate itself: exit 2 while SC-01 is open (enforced by default), 1 on an
# inconsistency, 0 only when the attestation is complete and the registers
# record it. SC01_ENFORCE=0 downgrades the open gate to a warning.
npm run check:sc01
```

Expected values: `0b3d6099…` (specification), `3ba842e2…` (decision record, current), `dde63b2c…` (walkthrough), `5e93f76e…` (receipt), `31e46d26…` (verification). The issued hash `d257fea8…` is expected to remain unmatched.

## 8. If the owner cannot confirm

- **A3 ticked:** the decision record is treated as a draft, not an issued approval artifact. This note is not executed. The specification hash still verifies, but the amendment is not relied on outside engineering. `SC-01` stays **Open**.
- **B3 ticked:** `AS-09` closes as a corrected attribution, not as owner participation. The closure note and registers must say the copy review was engineering-only. `SC-01` may still close if C1, C3, C4 and C5 hold; the owner's Path A decision is separate from who performed the walkthrough.
- **No attestation:** nothing changes. `AS-08`, `AS-09` and `SC-01` remain **Open**, and the intake lock stays as it is.
- **A hash differs:** treat the evidence chain as broken. Do not execute this note; write a new one that explains the change.

## 9. Limits

- This note is **in force** as of 2026-10-29. It records one specification-conformance resolution and changes no other status.
- It is not a legal opinion, a clinical decision, a vendor approval or deployment evidence.
- It does not authorise enabling `FEATURES.aiExplainerEnabled`, accepting real customer health information, or relying on the amendment externally.
- It is not committed, and it is not a signature. The only attestation instrument is the owner-completed [attestation](2026-10-28-sc-01-owner-attestation.md).
