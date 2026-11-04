# CI regression coverage

The existing required `Bank check, typecheck and build` check remains named the same, and now enforces the independently reported `Regression (ui)`, `Regression (server)` and `Regression (database)` matrix. Fail-fast is disabled. The required job uses `always()` so a failed regression does not hide bank, policy, typecheck or build results; its final step refuses a non-success regression result.

UI regressions are discovered recursively from every `.test.ts` and `.test.tsx` file under src. New regressions cannot be silently omitted because a package script still lists yesterday's files. Server tests already discover the whole functions/tests directory. Database tests run against isolated PostgreSQL fixtures and preserve reviewer grants, bounded queue projection, suppression claims and delivery evidence checks.

No hosted credentials, case submissions, email sends, migrations or deployment steps are added. Keep public intake locked. Policy Compass's separate questionnaire workflow checks this repository's runtime inventory, integrated adapters and the Lovable-connected branch. Backend-only source changes also require explicitly reviewing the sync ledger. Neither ledger hashes nor local fixture tests prove hosted configuration; retain separately authorized hosted tests.
