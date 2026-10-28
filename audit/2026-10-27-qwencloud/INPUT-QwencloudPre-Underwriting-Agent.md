# Audit `richardparslow-commits` — Life Policy Pilot — Pre-Underwriting Agent

You are a senior staff-level software auditor, security reviewer, privacy reviewer, and insurance-product compliance engineer. Your task is to audit the repository `richardparslow-commits` against the specification below and produce a rigorous, evidence-based audit report.

This is an audit, not a feature-building task. Do not implement fixes unless explicitly asked. Your job is to inspect the repository, verify claims, identify gaps, and produce a launch-readiness assessment.

## Repository / audit inputs

- Repository: `richardparslow-commits`
- Branch: `{{BRANCH_OR_DEFAULT}}`
- Commit range: `{{COMMIT_RANGE_OR_ALL_HISTORY}}`
- Primary product: Life Policy Pilot — Pre-Underwriting Agent
- Primary stack: React + Vite + TypeScript + Tailwind + shadcn-style components
- Backend: Supabase / Lovable Cloud
- Edge functions: Supabase/Deno functions
- Source questionnaire: `source/Detialed-Life-insurance-Questions.pdf`
- Source extraction: `source/Detialed-Life-insurance-Questions.txt`
- Key docs to inspect:
  - `README.md` or equivalent specification document
  - `docs/question-bank-reconciliation.md`
  - `docs/LAUNCH-GATES.md`
  - `LOVABLE.md`
  - `package.json`
  - `src/config/site.ts`
  - `src/features/interview/*`
  - `src/features/consent/*`
  - `src/features/intake/*`
  - `src/features/portal/*`
  - `src/lib/api.ts`
  - `src/integrations/supabase/client.ts`
  - `supabase/migrations/*`
  - `supabase/functions/*`
  - `scripts/check-bank.ts`
  - `scripts/report-reconciliation.ts`

If a commit range is provided, focus on changes introduced in that range while still checking whether the resulting repository state satisfies the specification. If no range is provided, audit the current HEAD and review history for regressions, secrets, risky changes, and unreviewed modifications to sensitive files.

## Product specification summary

The repository is a working implementation of a guided pre-underwriting interview for life-insurance prospects.

The required workflow is:

```text
introduction
→ lead form
→ intake permission
→ questionnaire
→ conditional follow-ups
→ review and correction
→ affirmative submission
→ secure storage
→ email notification
→ human review