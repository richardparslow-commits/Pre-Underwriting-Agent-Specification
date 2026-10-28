# SC-01 decision record — additive integrity receipt

**Date:** 28 October 2026\
**Finding:** `AS-08` — the issued decision-record hash no longer matches the file\
**Status:** **Additive record only. It does not authenticate the revision and does not close AS-08.**\
**Scope:** the working tree, not the attached ZIP (`20e0eff`).

This receipt is deliberately separate from the issue record. It does not edit
[`2026-10-28-sc-01-issue.sha256`](2026-10-28-sc-01-issue.sha256), replace the
historical hash, or claim a cryptographic signature. It exists so a later reader
can tell which bytes were issued, which bytes are present now, and why the
difference cannot be verified from this repository.

## 1. Recorded hashes

| Artefact | Issued SHA-256 (from the issue record) | SHA-256 at this date | Matches? |
|---|---|---|---|
| [`2026-10-28-sc-01-specification-v1.1.md`](2026-10-28-sc-01-specification-v1.1.md) | `0b3d609931c8902e5e0c1996bd49ae16be113053d0ac5e758b1e471f4e79ebf3` | `0b3d609931c8902e5e0c1996bd49ae16be113053d0ac5e758b1e471f4e79ebf3` | **Yes** |
| [`2026-10-28-sc-01-decision-record.md`](2026-10-28-sc-01-decision-record.md) | `d257fea889269438cdfcfc5900fdbf6bbaf7d08c3677b11e29829047d5b3f0aa` | `3ba842e23ddf383746a708775fbd77900fd5848c7b3f04e133301947ba0b275a` | **No** |

Supporting hashes at this date, recorded for future comparison:

- `2026-10-28-sc-01-issue.sha256` — `88aac5e0daf84c741e77c43c8979b23cdc19ce7a8b8b75c5b71d57114ffcbb53`
- `2026-10-28-sc-01-copy-walkthrough.md` — `dde63b2cdad7ebcb1de3fc34b94ed38febc3ebfdd3d295244f64dfe67207a132`

Verify with:

```bash
shasum -a 256 -c audit/2026-10-28-sc-01-issue.sha256
```

That command exits `1` while the decision record is the current revision. The
failure is expected and is the finding, not a regression introduced here.

## 2. What changed, as far as the repository can show

The decision record was issued, then revised to record the completed customer-copy
walkthrough and to mark the engineering copy review complete in its approval
block. The revision is the reason the issued hash no longer verifies.

The pre-revision bytes are not available: the file was untracked when the hash
was issued, and no copy of the earlier revision was retained. The byte-level
difference therefore **cannot be reconstructed or authenticated** from this
repository, and this receipt does not assert that the only changes were the
walkthrough and approval rows.

## 3. What this establishes and what it does not

**Establishes**

- The issued specification `1.1` is byte-identical to the hash in the issue record.
- The issued decision-record hash is preserved unmodified in the issue record.
- The decision record present today is a later revision, and its current hash is
  recorded above for any future comparison.

**Does not establish**

- That the later revision was made or approved by the product owner. That is
  `AS-09` and remains open; see the approval block's evidence column, which cites
  an owner instruction retained outside this file.
- That no other change was made to the decision record.
- That `SC-01` is closed. Its own closure checks remain in §7 of the record.

## 4. Required follow-up

1. The accountable owner confirms, in writing, the revision that followed issue
   and the approval block as it now stands. Record the confirmation additively;
   do not rewrite this receipt or the issue record.
2. If the owner cannot confirm the revision, treat the decision record as a draft
   rather than an issued approval artifact, and do not rely on it externally.
3. Keep the failing `shasum -c` result as the honest state until an attributable
   record exists. Do not delete the decision record from the issue manifest, and
   do not replace the historical hash with the current one.

**Owner:** product owner, with engineering maintaining the record. **This receipt
does not close AS-08 by itself.**
