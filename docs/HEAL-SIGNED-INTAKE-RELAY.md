# Anonymous submission quota isolation — prepared, not activated

Heal Nov 1 report: [Distinct prospects share submit limit](https://app.heal.dev/fa38cc97-45dd-4b98-8550-5fde5c59913c/runs/fae088ee-8575-4656-8440-c5cbc58b432e/defects/s6-distinct-prospects-share-submit-limit-1).

The TCP-peer limiter fixed forwarded-header spoofing but combined visitors
behind the Supabase gateway. The gateway-appended client entry now separates
them. This repair prepares a separate Cloudflare Worker that additionally
attests the visitor's edge connection before forwarding to the existing Supabase
`submit-case` function. Prospects remain anonymous; reviewer
sign-in, MFA, the database, notifications and marketing withdrawal are unchanged.

## Trust boundary

The Worker signs an HMAC envelope over version, timestamp, HMAC-pseudonymized
canonical client IP, POST method, fixed Supabase destination, Origin, idempotency
key and SHA-256 of the forwarded body. Supabase verifies it before using that
identity with the existing salted durable 10-per-600-second counter. The
configured SUPABASE_URL supplies the verification audience: internal gateway URL
rewrites cannot change the destination binding. Proofs expire after 60 seconds,
with 5 seconds of future clock tolerance. Valid retransmissions consume the same
quota and existing submission idempotency still prevents duplicate cases. No
proof is returned to the browser. No raw IP, secret or submission is logged.

When `INTAKE_RELAY_REQUIRED=true`, missing/invalid proofs fail closed before a
counter or case write. A missing/short secret returns 503. A proof received while
relay mode is disabled also returns 503, avoiding accidental partial-rollout
fallback. Without activation, the functions use the ingress gateway's final
`X-Forwarded-For` entry, falling back to the runtime peer if it is missing or
malformed. The relay remains the stronger hosted submission path.

The relay accepts only `/submit-case`, explicit Origins, and a fixed HTTPS
`<project-ref>.supabase.co/functions/v1/submit-case` destination. It reconstructs
headers rather than forwarding cookies, Authorization or caller attestations,
bounds bodies to 512 KiB, aborts upstream requests after 15 seconds, and refuses
redirects. A timeout means the save outcome is uncertain; retry unchanged with
the same key. Both relay and origin retain their independent launch locks.

## Cloudflare deployment contract — mandatory before activation

Use the ORIGINAL request passed to the deployed Worker fetch handler. Its `cf`
metadata must exist; local/dashboard preview is not a trusted ingress. The code
rejects `CF-Worker` subrequests, the cross-zone fixed client address, and Pseudo
IPv4 overwrite metadata. Do not wrap this handler in a caller-accessible service
binding, upstream Worker, stacked proxy/CDN, or an adapter that constructs `cf`.

On a dedicated owned zone/hostname, require a WAF block rule for ALL Worker
subrequests: `cf.worker.upstream_zone ne ""` (scope to the relay hostname).
Disable Pseudo IPv4 and visitor-IP-removal transforms. Do not enable workers.dev,
preview URLs or alternate unprotected routes. These are deployment requirements,
not settings created by this change. Verify external attempts to forge
CF-Connecting-IP, CF-Worker, x-real-ip and XFF and same-/cross-zone Worker calls
against the deployed route before any launch decision.

Cloudflare documents that CF-Connecting-IP semantics change for Worker
subrequests and that CF-Worker is added to all fetch subrequests. The WAF rule
uses provider-controlled metadata, not caller headers:
[Cloudflare HTTP headers](https://developers.cloudflare.com/fundamentals/reference/http-headers/).
Incoming `cf` metadata and redirect behavior are documented in
[Workers Request API](https://developers.cloudflare.com/workers/runtime-apis/request/).
These facts inform the conservative deployment contract; unit tests do not prove
hosted ingress behavior.

## Separate authorized rollout, while intake stays locked

1. Review and merge prepared code separately. No migration is required.
2. With explicit authorization, provision the dedicated zone route and WAF
   controls above. `edge/intake-relay/wrangler.toml` intentionally has no route,
   `workers_dev=false`, `preview_urls=false`, and QUESTIONNAIRE_APPROVED=false.
3. Generate a private random secret (at least 32 random bytes). Store the same
   `INTAKE_RELAY_SECRET` only in Worker and Supabase secret stores. Never use VITE,
   commit it, reuse RATE_LIMIT_SALT, or put it in browser/localStorage/logs.
4. Configure Worker APP_ORIGIN (exact allowed origins), SUPABASE_URL (existing
   project), and SUPABASE_PUBLISHABLE_KEY (public key only, never service role).
5. Deploy matching submit-case verification, set INTAKE_RELAY_REQUIRED=true in
   Supabase, retaining QUESTIONNAIRE_APPROVED=false. Configure browser
   VITE_SUBMIT_CASE_URL / Policy Compass VITE_QUESTIONNAIRE_SUBMIT_CASE_URL to the
   relay HTTPS `/submit-case` URL. An invalid explicit URL fails closed rather
   than falling back. Keep the Policy Compass public intake lock true.
6. Run ingress-forgery, independent-IP quota, repeated-IP quota, direct-origin
   rejection, timeout/replay, CORS, byte-limit and launch-lock checks in an
   isolated deployment with synthetic data. Confirm existing email/receipt flow.
   Do not temporarily unlock this hosted intake for tests.
7. Public activation and Lovable publication require a later explicit decision
   and all existing questionnaire/legal/deployment launch gates. This task
   authorizes neither. Roll back only while locked; removing relay-required
   restores conservative shared quotas, not visitor fairness.

Quotas identify connections, not people. NAT/VPN users sharing a public IP still
share a quota; an attacker with multiple IPs can obtain multiple quotas. Secret
rotation changes bucket identities; perform it while locked and test both sides
together. The withdrawal endpoint uses the same gateway client entry and retains
its 5-per-600-second limit.

## Regression evidence

`supabase/functions/tests/intake-relay_test.ts` exercises the real Worker and
submit-case entrypoint with a synthetic database transport: independent visitors
behind one gateway, rotating XFF/key variants, blocked direct/forged/expired
calls, content/audience/origin/method binding, IPv6 canonicalization, ingress
metadata and subrequest rejection, byte caps, lock/config failures, header
stripping, no redirects and uncertain transport errors. Rate-limit identity tests cover independent quotas for distinct
gateway-forwarded clients, ignored caller-prepended entries, peer/shared
fallbacks and withdrawals.
`src/config/submissionEndpoint.test.ts` covers relay selection and invalid URL
fail-closed behavior. Run `deno test --allow-env --lock=deno.lock
supabase/functions/tests/` and the submission UI suite. All test credentials,
addresses and payloads are synthetic; no hosted cases or emails are created.
