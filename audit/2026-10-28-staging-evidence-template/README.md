# Staging evidence template — migrations 0006–0010

**Status:** template only. It proves nothing until an operator copies it, fills it from a real staging run, and hashes the result.

**Use with:** [docs/STAGING-RUNBOOK.md](../../docs/STAGING-RUNBOOK.md). The section numbers here match that document.
**Companion check:** [supabase/ops/staging-runbook-checks.sql](../../supabase/ops/staging-runbook-checks.sql).

The point of this package is consistency: two operators running the same window should produce the same files, the same rows and the same expected values, so a reviewer can tell a pass from a blank cell.

---

## 1. Start a run

The template sits at the same directory depth as a run directory, so relative links keep working after the copy.

```bash
run="audit/2026-10-28-staging-run-$(date +%Y%m%d)"
cp -R audit/2026-10-28-staging-evidence-template "$run"
mv "$run/EVIDENCE-TEMPLATE.md" "$run/EVIDENCE.md"
```

Then:

1. Fill the **Run metadata** block in `EVIDENCE.md`.
2. Follow the runbook, writing each command's output to the log file named in the map below.
3. Fill every `Actual` and `Verdict` cell. Use `PASS`, `FAIL` or `NOT RUN`.
4. Regenerate the manifest after the last edit (section 4).
5. Run the redaction scan (section 5) before you share or commit the directory.

Do not rename the log files. The runbook and the completion table refer to them by name.

## 2. File map and expected headline

| File | Runbook step | What it must show |
|---|---|---|
| `00-baseline.log` | §1 | Commit SHA; remote `0001`–`0005` only; `0006`–`0010` local-only |
| `01-checks-0006-0008.log` | §3 | All `0006`–`0008` rows `t`; `0009`/`0010` rows `f` |
| `02-functions-deploy.log` | §4 | Five functions deployed with `verify_jwt = false`; secret **names** only |
| `03-checks-0009.log` | §5 | All `0009` rows `t`; only `0010` rows may still be `f` |
| `04-checks-0010.log` | §6 | All 22 rows `t`, including `SUMMARY — every check passed` |
| `05-audited-read.log` | §7 | One `opened` row with the reviewer's email; `42501` for four direct reads; `anon` queue read denied |
| `06-withdrawal.log` | §8 | `202` twice; one revocation after replay; `202` and two after a new key; guard raises; `provider: not_configured` with the row still pending; sixth request `429` |
| `07-retry-window.log` | §9 | 25-hour claim returns 0 rows and appears in the backlog; 23-hour claim returns one row; signed-in backlog read denied |

Each checks log must contain **23 rows**: 22 assertions plus the summary. A log with fewer rows was truncated or run against the wrong database.

Exact values worth checking by eye:

- withdrawal success body is `{"status":"received"}` — it is deliberately identical for a match and a non-match;
- unconfigured sync body is `{"inspected":0,"synced":0,"failed":0,"provider":"not_configured"}`;
- direction failure is the PostgreSQL code `42501`, returned with HTTP `401` or `403`. A `200` with rows is a stop condition, not a warning;
- the suppression guard raises `Contact is suppressed for marketing`;
- the retry window is 24 hours measured from `notification_first_attempted_at`.

## 3. Rules for the record

1. **No verdict without output.** `PASS` requires a pasted result, a log line, or a transcript reference in the same directory. An empty `Actual` cell is `NOT RUN`, never a pass.
2. **A failure stays in the record.** Do not delete a failing log and keep only the later pass. Record the failure, then the re-run, each with its own timestamp.
3. **One window, one log.** Append, do not overwrite, when a command is repeated.
4. **Stop on the first failure.** The runbook's §11 says what to do; record which path you took.
5. **Never record a secret.** Names only for environment variables. No token, password, connection string, anon key, service-role key, TOTP secret or provider key.
6. **Synthetic data only.** Use the reserved `@example.com` address and `555` numbers from the runbook. If a real value reached the log by accident, redact it and record that you did.
7. **Do not close a human gate.** This package can support `P-1` and part of `P-2` in the [sign-off pack](../2026-10-28-owner-signoff-pack.md). It cannot approve legal, clinical or product items, and it is not production evidence.

## 4. Manifest

After the final edit, from inside the run directory:

```bash
{ LC_ALL=C find . -type f ! -name 'MANIFEST.sha256' -print | sort \
    | while read -r f; do shasum -a 256 "$f"; done; } \
  | sed 's|  \./|  |' > MANIFEST.sha256

shasum -a 256 -c MANIFEST.sha256
```

Expected: one `OK` line per file and exit 0. On a system without `shasum`, use `sha256sum` in both commands.

The manifest is what distinguishes a documented run from an edited summary. Regenerating it after changing a log defeats the purpose; if a correction is needed, write a dated addendum instead.

## 5. Redaction scan

```bash
grep -RInE 'eyJ[A-Za-z0-9_-]{20,}|postgres(ql)?://[^ ]*:[^ ]*@|Bearer [A-Za-z0-9._-]{20,}|sb_secret_[A-Za-z0-9_-]+' . \
  || echo "no credential-shaped strings found"
```

Any hit is a stop: remove the value, record that the log was redacted, and regenerate the manifest. The pattern is written so this file does not match itself.

## 6. What a complete package contains

- `EVIDENCE.md` with every verdict filled and the completion table at the bottom signed;
- the eight logs from the map;
- `MANIFEST.sha256` that verifies;
- optional portal screenshots, named `05-queue.png` and `05-case.png`.

Only then does the directory record a run. It still does not record a production deployment, a provider delivery, a scheduler tick, a retention execution, a restore drill or any approval — those remain separate gates.
