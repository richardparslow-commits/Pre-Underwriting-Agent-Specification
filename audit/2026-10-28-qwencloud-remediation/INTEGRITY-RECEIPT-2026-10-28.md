# Non-destructive integrity receipt — A5 remediation package

**Package:** `audit/2026-10-28-qwencloud-remediation/`  
**Receipt date:** 28 October 2026  
**Repository baseline:** `542ba2574766900fbd569a474b6dfb8d2bf60cb7` (`main`)  
**Package status at receipt:** tracked and clean; no uncommitted changes under this package  
**Method:** `shasum -a 256` (SHA-256) over each file

This receipt is additive. It does **not** replace, regenerate or overwrite
[`MANIFEST.sha256`](MANIFEST.sha256), and it does not re-baseline the package.
The historical manifest and the files it hashed remain as they were committed.

## 1. Historical manifest is preserved

The historical manifest itself hashes to:

```text
d0735dc7c45319e5128671e98ddb20cc37b19b933fd8d0d9e9a8eba31dd05860  MANIFEST.sha256
```

It still contains the original four entries. Nothing in this receipt modifies
that file.

## 2. Current versus historical hashes

| File | Historical manifest | Current SHA-256 | Result |
| --- | --- | --- | --- |
| `README.md` | `5c016e97e00040651c3f1fc8c045ce458a7c4b392571fed07e516f0ba2c6d02e` | `77f0a91bd6519eb01135efba97e54ccc1a3a04c7f59d2fa6510698929f5101ed` | **Differs** |
| `LEDGER.md` | `0a8c06696ce6e596704d105fefeb511e699352cad3c1a8ccc47c8a4ef9cb2b6f` | `f053d29035d0dd375dfb98f89b11f93aa4bd24abd619bfb3f123c5ec7f82535a` | **Differs** |
| `logs/bundle-red-test.log` | `99e01c4a29e675b670a771ba952d42cfc3df511778876a5fdaafd4d521eb08d0` | `99e01c4a29e675b670a771ba952d42cfc3df511778876a5fdaafd4d521eb08d0` | Matches |
| `logs/full-verification.log` | `9dafb2953d10f6ac15dd5b7268a215870da0654b945e7dbd587081394b94a855` | `9dafb2953d10f6ac15dd5b7268a215870da0654b945e7dbd587081394b94a855` | Matches |

Current sizes: `README.md` 3,513 bytes; `LEDGER.md` 8,408 bytes.

## 3. What the mismatch means

Only the two Markdown files differ. Both evidence logs still match the
historical manifest, so the recorded command output has not changed.

The mismatch is the one already recorded in the
[cross-pass register](../2026-10-28-spec-conformance/CURRENT-FINDING-REGISTER.md#manifest-integrity-checked-on-28-october-2026):
the README and ledger were edited after the manifest was generated. This receipt
records the current values so the package can be checked going forward without
pretending the historical manifest described the current text.

It is **not** evidence that the A5 findings were resolved, that the logs were
regenerated, or that the package is now correctly baselined. It is also not a
claim about any later remediation.

## 4. Reproduce

From this directory:

```bash
shasum -a 256 MANIFEST.sha256 README.md LEDGER.md \
  logs/bundle-red-test.log logs/full-verification.log
```

Expected current values for the two changed files are in the table above. To
confirm the historical manifest is untouched, hash it and compare with
`d0735dc7c45319e5128671e98ddb20cc37b19b933fd8d0d9e9a8eba31dd05860`.

## 5. Rules for this receipt

1. Do not edit this receipt to match later content. Add a new dated receipt.
2. Do not overwrite `MANIFEST.sha256` as part of a receipt.
3. Re-baselining the package is a separate, explicit decision; this file does
   not make it.
4. If `README.md` or `LEDGER.md` changes again, the values above become stale
   by design and a later receipt must record the new hashes.
