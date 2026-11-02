# Heal repair — retain MFA setup through temporary checking errors

Addresses Nov 1 finding `s9-setup-check-failure-wipes-setup-key-1`.

## Behavior

A temporary challenge or verification error previously reset the gate to EMPTY,
losing this tab's one-time QR code and setup key. Try again then found the same
unverified factor but could no longer show its key, making this tab look like a
second tab with no setup data.

Recoverable errors now retain the current factor and local setup data, clear the
entered code, and offer a fresh-code retry plus Check setup again. Rechecking a
matching unverified factor preserves only the QR/key already held by this gate.
A failed lookup does not prove the factor disappeared and does not discard it.
No access callback fires on any error or factor-list response.

A successful lookup showing another factor or a verified factor clears the old
key. A confirmed missing-factor API error also clears it. If a fresh lookup finds
no factor, the existing enrollment path can obtain a fresh setup; the old key is
cleared first. Success still requires challenge and verification, clears all
setup data/code and then notifies the parent. The input disables during a request.

No key is recovered from a backend read, copied from another tab or written to
storage. The existing reviewer-keyed gate still clears setup on account change
or unmount. No factor deletion, automatic reset or additional permissions/API
operation is introduced.

## Regression coverage

Source hook tests use synthetic MFA responses for challenge/verify returned and
thrown errors, repeated lookup, lookup failure, factor replacement/removal,
verified/pending factors, successful retry and data clearing. Eight new cases
fail against the old hook. Existing single-flight, invalid-code, closing-gate and
no-connection safeguards remain checked.

Policy Compass carries equivalent hook regressions and four rendered-gate tests
that exercise the visible QR/key, empty code, Check setup again, success and fresh
replacement. Existing tests cover two tabs, Strict Mode, factor removal, failed
codes and changing accounts. No real QR, key, authenticator code or account is used.

## Scope

Frontend-only repair: no Supabase migration, function, MFA configuration, reviewer
account or factor change is required. Public intake stays locked and marketing
disabled. Preview sync must not publish Lovable; leave PRs unmerged until authorized.

An enrollment response lost before its one-time key arrives is a separate Heal
issue. An unverified factor with no local key may still require the original
scanned authenticator or operator recovery; this repair never deletes it to make
room for a replacement. It does not weaken the existing AAL2/allowlist boundary.
