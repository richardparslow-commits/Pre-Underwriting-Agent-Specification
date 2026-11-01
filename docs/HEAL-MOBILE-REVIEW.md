# Mobile return to review

Heal report: `s4-phone-edit-no-way-back-to-review-1`.

The only **Review my answers** action was inside the section sidebar, which is
hidden below the desktop breakpoint. Editing MH-03 from review on a phone left
only sequential question navigation.

The same action now appears above the question, outside responsive containers,
at every width. There is one action, using the existing review callback. The
normal Save and continue behavior and unanswered-question rules are unchanged.

Two regressions mount the real intake page and interview state. They fail
against the previous sidebar-only action and verify direct review without
inventing an answer, plus editing MH-03 and returning with the edit, other
answers and consent intact. Editing still invalidates the previous review
confirmation. Navigation does not send a case or email.

Checks: both new tests, the existing submission/navigation suites, typecheck and
production build passed. Isolated browser checks at 390, 768 and 1280 pixels
confirmed the review action is visible and preserves the edited answer. The
private browser harness uses only synthetic in-memory state and has sending
disabled. It is not part of the public application.

The Policy Compass copy has the same repair and tests. Hosted intake remains
locked. No database, function deployment, authentication or publication is
needed for this interface repair.
