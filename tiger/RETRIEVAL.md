# Private carrier guide retrieval

Apply `tiger db query <service> -f tiger/retrieval.sql`, then run
`tiger db query <service> -f tiger/retrieval.test.sql` for rollback-only synthetic checks.
The installed development service is `obr0cb2d7s`. Supabase intake remains unchanged.

Source metadata can be registered as pending. No pending guide text can be inserted.
Before approval, a named reviewer must record permitted cloud/producer use, authoritative
source/version, issuing-entity-specific carrier, exact product, explicit two-letter states,
effective dates and review deadline. This review does not determine insurance eligibility.
Producer/internal restrictions must be respected. No public access is granted.

After reviewing a page-preserving extraction, create a private JSON file:
`{"source_id":"registered-id","pages":[{"page":1,"section":"Heading","content":"Reviewed text"}]}`.
Use actual PDF page numbers; visually check tables and headers. The source content_sha256
must match SHA256 of `json.dumps(pages, ensure_ascii=False, sort_keys=True, separators=(',',':'))`
encoded as UTF-8. The original PDF byte checksum should be retained in source notes.
Keep both checksums: a changed extraction or source edition needs a new review/source ID.

Set status to approved only after explicit approval evidence is supplied. Then run
`python3 tiger/import-guide.py /private/path/manifest.json --service obr0cb2d7s`.
Import does not grant approval and fails on hash mismatch. Files and inventories containing
private source details should stay outside Git. The database owner remains trusted;
these checks are not a boundary against an owner editing metadata or disabling triggers.

Search from a trusted server or Tiger MCP (never expose credentials to a browser):

```sql
SELECT * FROM carrier_retrieval.search('diabetes', 'Exact issuing carrier',
 'Exact product', 'TX', CURRENT_DATE, 10);
```

Returns source title, edition, URL, PDF page, section, excerpt and ranking score.
No match means no approved, current evidence; do not invent an answer or health class.
BM25 uses pg_textsearch with carrier/product/state/date filtering. Optional same-model
vectors may be passed as the final two parameters for reciprocal-rank fusion. No provider
is configured, no guide is sent to an external embedding service and no ANN index is
needed for this empty/small corpus. Scores are relevance ranks, not underwriting certainty.
Review expiry uses today even for historical as-of searches; retired sources stay excluded.

Sources: Tiger's pg_textsearch documentation, retrieved through Tiger MCP search_docs:
https://www.tigerdata.com/docs/deploy/tiger-cloud/tiger-cloud-aws/tiger-cloud-extensions/pg-textsearch

## Authorized private reference imports

`reference-import.sql` adds private-import approvals and page-preserving reference
storage for user-authorized guides whose operational metadata is still unresolved.
This preserves unknown carrier effective dates. Apply it after `retrieval.sql`.
Run `reference-import.test.sql` for rollback-only checks.

`search_private_reference(query, exact_source_id, 'TX', limit)` searches only the
explicitly authorized source, returns PDF/printed-page citations and always labels
its validation status. It refuses states other than TX. This separate reference
corpus does not enter `search()` or imply current carrier/product eligibility.
Original PDF and extraction SHA256 values and user authorization are retained.
No external embedding calls are made. No public permissions are granted.

The source corpus still requires exact issuing-company/product/state checks,
carrier effective dates, currentness confirmation and visual table validation
before operational activation. User permission to store a document does not
establish those facts. No carrier rules are automatically converted into decisions.
