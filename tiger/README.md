# Tiger development evaluation store

Project `xtb16bcthd`, account `richard.parslow@g.austincc.edu`, service `obr0cb2d7s`
(`pre-underwriting-dev`), Shared compute in `us-east-1`.

This is an isolated synthetic evaluation store. The existing Supabase intake,
reviewer permissions, consent, and launch gates remain the application's backend.
Never put a database URL in VITE variables or browser code.

Run `npm ci`, then `npm run test:tiger` for ten independently specified expected
interview outcomes. To install the schema, snapshot the versioned question bank,
seed fixtures, and append a live evaluation run:

```sh
TIGER_SERVICE_ID=obr0cb2d7s npm run test:tiger:live
```

Requires Tiger CLI signed into the project and its password in the Mac keychain.
A private `.env.test` is provisioned locally; it is ignored by Git. CLI uses its
keychain directly. Generated SQL is ignored. Each run has a distinct UUID.

The engine deliberately has no carrier screening, knockout decisions, or health
classes. No medical rating rules are invented. `carrier_rules` is an empty,
versioned staging structure for future source-backed rules. No RAG embeddings
are generated without approved carrier documents and a selected embedding model.
The fixtures cover answer disposition, branch visibility and current safety;
they are synthetic, and never represent insurance eligibility decisions.

The audit table is a Timescale hypertable. Update/delete/truncate triggers block
ordinary mutation; a database owner can disable these protections, so this is
not cryptographic or administrator-proof immutability. No automatic deletion
policy is installed. The schema is private to its owner; no public grants or
production writer credentials are created.

`test:tiger:live` executes the real TypeScript engine, compares to explicit expected
results, writes inputs/results to Postgres, checks stored pass flags and exercises
connectivity. It does not claim to implement a second SQL underwriting engine.

Tiger MCP is installed for Codex; restart Codex to load it. `tiger mcp list`
lists available capabilities, not proof of database connectivity.
