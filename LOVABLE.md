# Using this project in Lovable

This codebase is shaped the way Lovable expects a React project to be, so it can
be imported, edited and deployed from Lovable without restructuring.

## What makes it Lovable-compatible

- **Vite + React 18 + TypeScript**, entry at `src/main.tsx`, routes in
  `src/App.tsx` using `react-router-dom`.
- **Tailwind with CSS variables** in `src/index.css` and `tailwind.config.ts`
  (`background`, `primary`, `accent`, `muted`, `border`, `ok`, `warn`, `danger`).
  Restyling means changing those HSL tokens, not rewriting components.
- **shadcn-style UI** in `src/components/ui/` with `class-variance-authority`,
  `clsx`, `tailwind-merge` and the `@/` alias. `components.json` is included, so
  `npx shadcn@latest add …` writes into the right place.
- **Lovable tagger** is loaded only in development (`vite.config.ts`), and the
  build does not depend on it.
- **Lovable Cloud client** lives at `src/integrations/supabase/client.ts`, the
  path Lovable's Supabase integration expects. It is `null` until configured, and
  the portal refuses to pretend it has a session.
- **Pages** in `src/pages/`, feature code in `src/features/`, shared helpers in
  `src/lib/`.

## Import

1. Push this repository to GitHub (the workspace here is not committed — see the
   handoff note in chat).
2. In Lovable: **Create project → Import from GitHub**, choose the repo and the
   branch. Keep the default build command (`npm run build`) and output (`dist`).
3. The project runs immediately in **preview mode**: no backend, no email, cases
   held in the tab. Use `/portal` → “Open the portal preview” to see the reviewer
   package.

## Connect Lovable Cloud (Supabase)

1. Enable **Lovable Cloud** for the project (this creates the Supabase project and
   injects `VITE_SUPABASE_URL` and the publishable key).
2. Open the Supabase SQL editor and run, in order,
   `supabase/migrations/0001_pre_underwriting.sql`,
   `0002_case_corrections.sql`, `0003_reliability_and_access.sql`,
   `0004_reviewer_write_paths.sql` and `0005_case_summary_view.sql` top to bottom.
3. Auth → Users: create the reviewer account, enrol MFA, then register it. An
   AAL2 session is required by the policies, not merely recommended:

   ```sql
   insert into public.reviewers (user_id, email, display_name)
   select id, email, 'Richard Parslow'
   from auth.users
   where email = 'richardparslow@lifepolicypilot.blog'
   on conflict (user_id) do nothing;
   ```

4. Deploy the three functions (`submit-case`, `email-events`,
   `retry-case-notifications`) with the JWT settings in the committed
   `supabase/config.toml`. In Lovable this is usually done through the Supabase
   integration; if the dashboard does not expose `verify_jwt`, use the Supabase
   CLI against the same project. Keep `QUESTIONNAIRE_APPROVED=false` until every
   row is signed off, and apply `supabase/ops/retry-schedule.sql` only after
   storing the Vault secrets.
5. Add the function secrets listed in the README under Supabase → Edge Functions
   → Secrets. Never put them in `.env` or any `VITE_` variable.
6. Set `VITE_APP_MODE=live` and rebuild. Submit a labelled non-customer test case
   and confirm the case row, notification state and portal access.

## Prompts that are safe to give Lovable

- “Style the reviewer portal to match the marketing site, keeping all existing
  fields and the consent evidence visible.”
- “Add a printable PDF export of a case for the reviewer, generated from the
  existing answer records, without changing what is stored.”
- “Add a retention report that lists cases older than the documented retention
  period, without deleting anything automatically.”
- “Improve keyboard navigation and screen-reader labels on the interview, and add
  a visible focus state to every control.”

## Prompts that must be rejected or rewritten

Lovable will happily add things that break the specification. Do not accept:

- analytics, pixels, session replay or tag managers on `/start` or `/portal`;
- storing answers in `localStorage`, `sessionStorage`, cookies or the URL;
- putting the notification recipient in the client, or a `mailto:` submission;
- letting the model (or the UI) skip, merge or reword source questions;
- pre-ticking marketing consent, or making it a condition of submission;
- “HIPAA compliant” badges or claims;
- auto-approval, rate classes, quotes or carrier submission;
- deleting the crisis panel or the held-for-review rows to simplify the form;
- loosening RLS “so the demo works”;
- putting a service-role key anywhere in the front end.

If a request conflicts with those rules, change the request, not the safeguards.

## Differences from a stock Lovable template

- No Lovable-generated `supabase/types.ts`; queries are cast to explicit row types
  in `src/lib/api.ts`. Generate types later if desired — it will not change the
  contract.
- The interview state machine is custom (`useInterview.ts`) rather than a form
  library, because the specification requires branch-aware, non-coercive answer
  states and immutable review confirmation.
- The draft summary is deterministic and extractive. If an LLM summary is added,
  keep it labelled as a navigation aid, keep every point linked to question ids,
  and never let it introduce a diagnosis or an eligibility view.

## Known Lovable friction

- Edge-function deployment and `verify_jwt` settings may require the Supabase CLI
  even when the database is managed through Lovable Cloud.
- Preview URLs are public. Do not enter real customer data until the deployment
  has been security-reviewed and the legal gates in `docs/LAUNCH-GATES.md` are
  closed.
- `BrowserRouter` works in Lovable’s preview and on static hosting with an SPA
  fallback. If the host does not provide one, add a 404 → `index.html` rewrite;
  do not switch to hash routing (case references in URLs are fine; health data is
  not, and none is placed there).
