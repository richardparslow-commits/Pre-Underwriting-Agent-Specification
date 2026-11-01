# Recoverable contact-preference validation

Heal report: `s1-hidden-phone-blocks-lead-form-1`.

A partially entered telephone number was retained when the customer switched
from a phone call to Email. Validation correctly rejected the supplied invalid
number, but the telephone control, error and focus target were no longer
rendered. Continue appeared to do nothing.

Entered telephone/contact-time values and related validation errors now keep
that group visible after a preference change. The optional-number explanation
and validation error are associated with the input. The customer can correct
or clear an unwanted value. Valid values remain intact, and a fresh Email form
with no telephone details stays compact. The same recovery works for Continue
online. No validation or submission rule changed.

Four component regressions cover partial-number recovery, preservation of valid
contact details, an empty email-only form and a retained overlong contact time.
Three failed against the previous implementation in both repositories. The
source submission/navigation suite has 32 passing tests; typecheck and
production build passed. Policy Compass has matching repair and regressions.

An isolated browser harness at 390 and 1280 pixels verified a visible error,
focus on the telephone field, and successful navigation to permission after
clearing the number, for Email and Continue online. It uses synthetic in-memory
details with case/email sending disabled. Hosted intake stays locked. No
database, authentication, backend deployment or publication is required.
