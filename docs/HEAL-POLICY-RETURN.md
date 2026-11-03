# Resume from policy-page header and footer links

[Heal Nov 1 report](https://app.heal.dev/fa38cc97-45dd-4b98-8550-5fde5c59913c/runs/fae088ee-8575-4656-8440-c5cbc58b432e/defects/s6-header-start-link-drops-interview-place-1) identifies a gap in the plain header Start link: unlike the policy page's explicit Return link, it carries no questionnaire screen marker, so the router falls back to contact details despite the active interview remaining in memory.

The router adapter now recognizes a new, unmarked link return from privacy or messaging terms into the form within the same mounted questionnaire scope. It borrows the remembered screen marker for that transition, then replaces the new route entry with only the existing opaque session ID and screen name. Question position, lead, answers, consent timestamps, acknowledgement, payload and submission key stay in the existing memory store. No additional Back entry is created.

React Router uses its navigation type to exclude POP. Policy Compass uses visited opaque router-entry keys held only in mounted memory to distinguish a new link from Back/Forward. Explicit return markers keep their existing behavior; malformed/foreign markers still fall back safely. Back to an original unmarked lead entry retains its original meaning. Reload, leaving the scope and Start over cannot revive old private state. Current lead/permission validation, pending-submission freeze and terminal receipts remain enforced.

The Policy Compass public header retains its questionnaire availability/status labels and locked routes. Its private synthetic questionnaire retains its separate scope and reset-on-leave behavior. Only a local test harness mounts a synthetic form to exercise the carried-over TanStack router adapter; this does not unlock the hosted public questionnaire.

Ten added source regressions use the real header/footer links and React Router to cover both policy pages, exact question restoration, review/acknowledgement retention, metadata-only history, unrelated unmarked form navigation, Start over, invalid contact details, terminal receipts and Back to the original entry. The previous implementation fails the resume regressions. Five added TanStack rendered regressions cover the corresponding header/footer returns and old Back entry. Existing policy, reload, permission and private-test regressions remain active.

Validation: 39 targeted source history/policy tests and all 60 submission UI tests pass, along with the build and access/documentation guards. Policy Compass passes 38 targeted history/policy/private-test tests with strict typecheck and lint.

Frontend only: no migration, function deployment, backend permission or hosted setting change. Public intake remains locked, marketing stays disabled and MFA stays required. Sync Lovable preview only; keep repair PRs unmerged for review and do not publish.
