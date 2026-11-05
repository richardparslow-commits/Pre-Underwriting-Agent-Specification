# Tiger development evaluation store

Project `xtb16bcthd`, account `richard.parslow@g.austincc.edu`, service `obr0cb2d7s`
(`pre-underwriting-dev`), Shared compute in `us-east-1`.

This is an isolated synthetic evaluation store. The existing Supabase intake,
reviewer permissions, consent, and launch gates remain the application's backend.
Never put a database URL in VITE variables or browser code.

Run `npm ci`, then `npm run test:tiger` to exercise the real application engine
and intake validation against independent expected results. The current bank
produces 456 checks: answer states, stale Yes-only detail on No answers, hidden
answers, nested branch closure, current-safety combinations, impossible dates,
and age boundaries. The count adapts when the question bank changes.
This matrix runs in CI without database credentials. To install the schema,
snapshot the question bank and code identity, seed fixtures, and append a live run:

```sh
TIGER_SERVICE_ID=obr0cb2d7s npm run test:tiger:live
```

Requires Tiger CLI signed into the project and its password in the Mac keychain.
A private `.env.test` is provisioned locally; it is ignored by Git. CLI uses its
keychain directly. Generated SQL is ignored. Each run has a distinct UUID.
Live execution refuses services that are not READY and marked DEV. Failed
checks are saved before the process exits with a failing status, so CI/test
failures can be investigated rather than losing their evidence. Database
errors also fail the command; a local pass alone does not prove persistence.

Each run records its Git commit, whether the checkout had uncommitted changes,
code hash, fixture-suite hash, and pass/fail counts. Fixture identity includes
the code and expectations, so changing an expected result cannot silently reuse
an older fixture. Compare `suite_hash` when comparing code revisions; different
suites are not automatically comparable. To inspect recent runs and failures:

```sh
tiger db query obr0cb2d7s --file tiger/report.sql
```

The report also includes older runs recorded before run headers existed. It
uses the first audit timestamp and counts the stored results for those runs.
Unavailable Git and fixture metadata appear as null.

New audit rows require an existing run header. The schema upgrade adds this
foreign key without validating historical rows, so earlier audits stay
readable. Writers create the run header before inserting its audit results.

The engine deliberately has no carrier screening, knockout decisions, or health
classes. No medical rating rules are invented. `carrier_rules` is an empty,
versioned staging structure for future source-backed rules. No RAG embeddings
are generated without approved carrier documents and a selected embedding model.
All fixtures are synthetic and never represent insurance eligibility decisions.
This matrix complements `npm run test:regressions`, `npm run check:db`,
`npm run check:reviewer-visibility`, and the Deno server-handler tests in CI;
it does not replace those suites or test production traffic. Live persistence
is an explicit local command; CI does not have Tiger credentials configured.

The audit table is a Timescale hypertable. Update/delete/truncate triggers block
ordinary mutation; a database owner can disable these protections, so this is
not cryptographic or administrator-proof immutability. No automatic deletion
policy is installed. The schema is private to its owner; no public grants or
production writer credentials are created.

`test:tiger:live` executes the real TypeScript engine, compares to explicit expected
results, writes inputs/results to Postgres, checks stored pass flags and exercises
connectivity. It does not claim to implement a second SQL underwriting engine.

Tiger MCP is installed for Codex. A successful query of `evaluation_runs` through
MCP verifies database connectivity; `tiger mcp list` alone only lists capabilities.
