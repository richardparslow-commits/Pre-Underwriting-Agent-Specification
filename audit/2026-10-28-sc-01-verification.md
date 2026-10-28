# SC-01 — verification record

**Date:** 28 October 2026\
**Baseline:** `main` @ `e0a0664263ff68a5cead6677da011f95040e9239` (clean working tree)\
**Scope:** §7 steps 5–8 of the [SC-01 decision record](2026-10-28-sc-01-decision-record.md)\
**Outcome:** **Verification complete. `SC-01` is not marked resolved**, because the
approval attribution (`AS-09`) and the decision-record hash question (`AS-08`)
remain open. This record supplies the evidence; the resolution decision stays
with the owner.

## 1. Commands run

All three commands in §7 step 5 were run on the baseline above:

| Command | Result | Notes |
|---|---|---|
| `npm run check:docs` | **Pass** | Reported the audited totals: 92 rows, 87 approved, 5 held, 0 signed off; 113 source items, 85 traced, 28 gaps. |
| `npm run typecheck` | **Pass** | `tsc --noEmit` exited 0 with no diagnostics. |
| `npm run build` | **Pass** | `vite build` completed; the only output beyond success was the existing warning that the main chunk exceeds 500 kB. That is a size warning, not a failure. |

The warning is recorded rather than suppressed. It is the same warning present in
the earlier audit logs and does not indicate a broken build.

## 2. Where this leaves §7

| Step | Status after this record |
|---|---|
| 1. Owner approval | Complete — recorded in §8 of the decision record. |
| 2. Issue specification `1.1` | Complete — hash matches `0b3d6099…`, confirmed by `shasum`. |
| 3. Apply the redlines | Complete — recorded in the issued amendment. |
| 4. Customer-copy review | Complete — see the [copy walkthrough](2026-10-28-sc-01-copy-walkthrough.md). |
| 5. `check:docs`, `typecheck`, `build` | **Complete** — this record, §1. |
| 6. Non-customer walkthrough | Complete — see the copy walkthrough. |
| 7. Dated closure note and register update | Evidence supplied here and in the consolidated register. |
| 8. Mark `SC-01` resolved | **Not taken.** |

## 3. Why step 8 is not taken here

`SC-01` is a product/specification finding, and the owner approved Path A. Two
separate audit findings nevertheless limit what this repository can assert about
that approval:

- **`AS-08`** — the decision record was revised after issue and its historical
  hash no longer verifies. The [additive integrity receipt](2026-10-28-sc-01-decision-record-integrity.md)
  records both hashes but cannot authenticate the revision.
- **`AS-09`** — the available copy-walkthrough evidence does not establish the
  owner's participation in the engineering copy review. The approval block cites
  a retained owner instruction; this repository cannot independently verify a
  session instruction.

Marking `SC-01` resolved would therefore assert more about the approval artifact
than the evidence supports. The engineering checks in §7 are complete; the
attribution question is not. If the owner confirms the approval artifact and the
revision, step 8 can be taken without further code or documentation work beyond
recording the confirmation additively.

## 4. What is not claimed

- No hosted deployment, provider call, model provider or legal approval.
- No closure of `AS-08`, `AS-09`, `SC-03`, `SC-04` or `SC-05`.
- No change to the A6 package or its manifest. This record is additive.
