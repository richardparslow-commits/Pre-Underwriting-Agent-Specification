# SC-01 owner attestation — revised decision record and copy-review role

**Prepared:** 28 October 2026\
**Status:** **COMPLETED — ATTESTED 29 October 2026.** Parts A and B are completed (A1, B3), the evidence method is M3, and the owner instructed `SC-01` to be marked resolved. Recorded in the [closure note](2026-10-28-sc-01-closure-note.md); this file is the attestation instrument, not a cryptographic signature.\
**Findings addressed:** `AS-08` (the decision-record revision is not attributable), `AS-09` (copy-review participation is not established)\
**Related:** `SC-01` / `MI-05`; sign-off row `O-1`\
**Accountable owner:** Richard Parslow, product/business owner\
**Prepared by:** Engineering, for owner completion

> **Why this exists.** The decision record was issued at one hash and revised afterwards; the earlier bytes were not retained, so no one can reconstruct the difference. Separately, the copy walkthrough records what the browser rendered, not who reviewed it, while the approval block reads as if the owner took part. Neither gap can be closed by engineering. One owner statement, recorded additively, either closes both findings or records honestly that they stay open.

---

## 1. The two gaps, in plain terms

### `AS-08` — the record changed after issue

The decision record was issued with SHA-256 `d257fea8…`. The file now hashes `3ba842e2…`. The earlier bytes were never committed and no copy was kept, so the byte-level difference cannot be rebuilt or authenticated from this repository. The [integrity receipt](2026-10-28-sc-01-decision-record-integrity.md) preserves both hashes and deliberately does not replace the issued one.

The instruction quoted in the decision record is: “Sign the SC-01 decision and issue specification version 1.1 with the thirteen redlines and hash record.” On its face that authorises the decision and the issue of version `1.1`. It does **not** say who made or authorised the later revision. That is the gap.

### `AS-09` — the walkthrough does not name its reviewer

The [copy walkthrough](2026-10-28-sc-01-copy-walkthrough.md) records rendered text from the permission, review and portal surfaces. It is written in the passive voice and names no reviewer. The approval block in the decision record says:

> | Engineering copy review | Richard Parslow / engineering walkthrough | [x] Complete | 28 October 2026 | [Copy walkthrough](2026-10-28-sc-01-copy-walkthrough.md); no AI-active claim or AI-generated summary label found. |

That row reads as owner participation. The walkthrough evidences the copy, not the person. The finding asks for the difference between an engineering review and an owner review to be stated, not for the owner to claim work they did not do.

---

## 2. What you are being asked to do

1. Read §4, which fixes the hashes and the exact revision being attributed.
2. Complete **Part A** (`AS-08`) and **Part B** (`AS-09`) in §5. Each has exactly one tick.
3. Record how the statement was made in §6, and give the `SC-01` status instruction there.
4. Do not edit the decision record, the issue hash record or the integrity receipt. All three are preserved as issued. This file is the additive record.

## 3. What this attestation does not do

- It does not authenticate the lost bytes or prove that no other edit occurred. It attributes the revision; it does not reconstruct the difference.
- It does not re-approve Path A. That decision is already recorded in the decision record §8 and is unchanged.
- It does not decide `SC-03`, `SC-04`, `SC-05`, retention, vendors, marketing or deployment.
- It is not legal, clinical or underwriting advice, and it creates no compliance claim.
- Completing it does not, by itself, change any status. Engineering records the outcome in §7 after completion.

## 4. Facts fixed before you complete §5

| Artefact | SHA-256 | State |
|---|---|---|
| [Specification version `1.1`](2026-10-28-sc-01-specification-v1.1.md) | `0b3d609931c8902e5e0c1996bd49ae16be113053d0ac5e758b1e471f4e79ebf3` | Matches the issue record |
| [Decision record](2026-10-28-sc-01-decision-record.md) — issued | `d257fea889269438cdfcfc5900fdbf6bbaf7d08c3677b11e29829047d5b3f0aa` | Preserved in the issue record; file no longer matches |
| [Decision record](2026-10-28-sc-01-decision-record.md) — current | `3ba842e23ddf383746a708775fbd77900fd5848c7b3f04e133301947ba0b275a` | Committed at `406473e`; unchanged at `HEAD` |
| [Copy walkthrough](2026-10-28-sc-01-copy-walkthrough.md) | `dde63b2cdad7ebcb1de3fc34b94ed38febc3ebfdd3d295244f64dfe67207a132` | Matches the integrity receipt |

The check below **exits 1 by design**. The `FAILED` line is the finding, preserved rather than suppressed:

```text
$ shasum -a 256 -c audit/2026-10-28-sc-01-issue.sha256
audit/2026-10-28-sc-01-specification-v1.1.md: OK
audit/2026-10-28-sc-01-decision-record.md: FAILED
shasum: WARNING: 1 computed checksum did NOT match
$ echo $?
1
```

**What the post-issue revision is recorded as containing:** the completion of the customer-copy walkthrough, the engineering copy-review tick in the §8 approval block, and the status wording consequential to those two changes. The pre-revision bytes are unavailable, so this list is the receipt's account, not a diff.

**One stale table, deliberately not rewritten.** The decision record's §7 table still says step 5 is “Partial — `check:docs` passed; `typecheck` and `build` pending”, and its header still says closure is pending `typecheck`/`build`. The later [verification record](2026-10-28-sc-01-verification.md) supplies the passing result on `e0a0664`. The decision record is not edited, because editing it would break the attribution this file exists to establish. The closure note should cite the verification record; §7 is a point-in-time snapshot.

## 5. Your attestation

Complete **both** parts. Use the narrower statement if you are unsure; an accurate “not me” is more useful than an unsupported “yes”.

### Part A — `AS-08`: the revision after issue

> By completing §6 and ticking **one** box below, I confirm that:
>
> **(a)** the revision made to `2026-10-28-sc-01-decision-record.md` after its issue on 28 October 2026 was made at my direction, and comprised the completion of the customer-copy walkthrough, the engineering copy-review tick in the §8 approval block, and the status wording consequential to those changes;
>
> **(b)** the file whose SHA-256 is `3ba842e23ddf383746a708775fbd77900fd5848c7b3f04e133301947ba0b275a` is the revision I authorised, and its §8 approval block reflects my Path A decision and residual-risk acceptance;
>
> **(c)** I have read the [integrity receipt](2026-10-28-sc-01-decision-record-integrity.md) and accept that the issued hash `d257fea8…` stays in the issue record, the current hash is recorded, and the pre-revision bytes are unavailable;
>
> **(d)** I do not ask for the issue record, the integrity receipt or the decision record to be rewritten, and I understand that editing this file after completion breaks the hash binding above.

Tick exactly one:

- [x] **A1 — I confirm (a) to (d) as written.**
- [ ] **A2 — I confirm (a) and (c)–(d), but the revision also included, or did not include, the following:** `______________________________________________`
  *An addendum is recorded before `AS-08` closes; the finding stays open until it is.*
- [ ] **A3 — I cannot confirm the revision.**
  *The decision record is then treated as a draft rather than an issued approval artifact. `AS-08` stays open, and the amendment is not relied on outside engineering. The specification hash still verifies; the approval attribution does not.*

You are **not** being asked to certify the contents of the lost revision, to prove that no other edit occurred, or to re-sign the Path A decision.

### Part B — `AS-09`: your part in the copy review

Tick exactly one. The difference matters because the approval block currently names you in the engineering copy-review row.

- [ ] **B1 — I personally took part in the 28 October 2026 walkthrough.** I observed the rendered screens, or performed the walkthrough myself, and I reviewed the copy recorded in it.
  *No correction to the approval block is needed.*
- [ ] **B2 — I did not perform or observe the walkthrough, but I reviewed the walkthrough record and the rendered copy it quotes on** `______________`, **and I adopt its conclusion as my own review.**
  *The approval-block row is corrected additively to read “Engineering walkthrough; owner reviewed the record and adopted it on [date].” The decision record itself is not edited.*
- [x] **B3 — I did not take part in the copy review.** It was performed by engineering only.
  *The approval-block row is corrected additively to “Engineering walkthrough; owner did not participate.” `AS-09` closes as a corrected attribution, not as owner participation, and the `SC-01` closure note must not claim otherwise.*

Part B does not change your Path A decision. If you no longer hold that decision, do not complete this form; record a new decision record instead.

### Your `SC-01` status instruction

The verification record completes the engineering checks and leaves step 8 to you. Tick one:

- [x] **Mark `SC-01` Resolved — specification amended**, once this attestation is recorded and the dated closure note is written.
- [ ] **Leave `SC-01` open** for now, with this reason: `______________________________________________`

## 6. How this statement was made

Complete one method. A code flag, an unsigned draft or a chat message with no retained artifact is not sufficient.

- [ ] **M1 — Owner-authored commit.** I committed this completed file myself. The commit SHA is recorded in the closure note §6 under “M1 commit SHA (M1 only)”, not in this file, so that recording it cannot change this file's hash.
- [ ] **M2 — Signed memo retained outside the repository.** Description: `________________`; SHA-256: `________________`; custodian: `________________`. The memo is **not** committed; only its description and hash are recorded here.
- [x] **M3 — Retained owner instruction, transcribed verbatim.** Exact words: `Record the SC-01 attestation as A1 and B3, mark it resolved, and update the closure note, registers and index — I confirm the attestation's terms.`; date and time: `2026-10-29 09:47 CDT`; channel: `Freebuff Desktop session`. Engineering transcribes at my direction; this completed file is the durable artifact.

| Field | Entry |
|---|---|
| Name | Richard Parslow |
| Role | Product/business owner |
| Date | `2026-10-29` |
| Location (optional) | `________________` |

> I make this attestation in my capacity as product/business owner. I understand it will be recorded in this repository and linked from the sign-off pack and audit index, and that engineering will not describe it as a cryptographic signature.

**Owner completion:** `[x]` I have completed Parts A and B, one evidence method, and the status instruction.

*Engineering use only — do not complete:* recorded by `____________` on `____________`; register entries updated at `____________`.

## 7. What engineering records afterwards

| Completed outcome | `AS-08` | `AS-09` | `SC-01` step 8 |
|---|---|---|---|
| A1 + B1 | Resolved — revision attributed, both hashes preserved | Resolved — owner participated | May be taken if the owner ticked “Mark resolved” |
| A1 + B2 | Resolved | Resolved — owner reviewed and adopted; attribution corrected | Same |
| A1 + B3 | Resolved | Resolved as corrected attribution, **not** owner participation | Same; the closure note records engineering-only review |
| A2 | Open until the addendum is recorded | Depends on Part B | Not taken |
| A3 | Open — decision record treated as draft | Depends on Part B | Not taken |
| Not completed | Open | Open | Not taken |

Recording rules:

1. Add the outcome to [the consolidated register](2026-10-28-consolidated-master-issues.md) `AS-08`/`AS-09` rows and to sign-off row `O-1`. Do not edit the decision record, the issue hash record or the integrity receipt.
2. Write a dated closure note that links this file, the verification record and the issued amendment (prepared: [SC-01 closure note](2026-10-28-sc-01-closure-note.md); it is not in force until this attestation is complete). If the owner ticked “Mark resolved”, the closure note takes step 8; otherwise it records that step 8 is withheld.
3. Re-run `shasum -a 256 -c audit/2026-10-28-sc-01-issue.sha256` and record that the decision record still `FAILED`. A passing check would mean the historical hash had been altered.
4. Do not regenerate any earlier manifest. This record is additive.

## 8. Completion checklist

- [x] I have read §1 and §4, including the expected `FAILED` line.
- [x] I ticked exactly one box in Part A and one in Part B.
- [x] I completed one evidence method in §6 and the name, role and date fields.
- [x] I ticked the “Owner completion” line in §6.
- [x] I gave the `SC-01` status instruction.
- [x] I did not edit the decision record, the issue hash record or the integrity receipt.

## 9. Reproduction and verification

```bash
# The four hashes quoted in §4
shasum -a 256 \
  audit/2026-10-28-sc-01-specification-v1.1.md \
  audit/2026-10-28-sc-01-decision-record.md \
  audit/2026-10-28-sc-01-copy-walkthrough.md \
  audit/2026-10-28-sc-01-decision-record-integrity.md

# The preserved issue record: specification OK, decision record FAILED, exit 1
shasum -a 256 -c audit/2026-10-28-sc-01-issue.sha256

# The current revision is the one committed at 406473e and unchanged at HEAD
git show 406473e:audit/2026-10-28-sc-01-decision-record.md | shasum -a 256
git show HEAD:audit/2026-10-28-sc-01-decision-record.md | shasum -a 256
```
