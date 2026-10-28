import { Link } from "react-router-dom";
import { Alert, Badge } from "@/components/ui/surface";
import { MARKETING_ENABLED, SITE } from "@/config/site";
import { PRIVACY_PRACTICES_VERSION } from "@/features/consent/consentTexts";

const SECTIONS = [
  {
    title: "What this interview collects",
    body: "Contact details you enter (name, state, email, and a telephone number only if you choose a call or text), the answers you give to the interview, optional coverage details, and the consent choices you make. We do not collect Social Security numbers, payment card details, passport, visa or green-card numbers, identity-document scans, or information about family members.",
  },
  {
    title: "Why it is collected",
    body: `To prepare a preliminary pre-underwriting review for ${SITE.owner} at ${SITE.brand}, to let you correct your answers before submission, and to contact you in the way you asked us to. ${
      MARKETING_ENABLED
        ? "Marketing calls and texts are separate, optional permissions and are never required to submit."
        : "No marketing calls or texts are offered in this version, so no marketing consent is requested."
    }`,
  },
  {
    title: "Marketing choices",
    body: `Marketing calls and texts are optional and are never required to submit. You can withdraw at any time using the marketing opt-out page or by emailing ${SITE.reviewerEmail}. A withdrawal stops future marketing and does not affect your requested review.`,
  },
  {
    title: "Who reads it",
    body: `Your submitted case is available to ${SITE.owner} through an authenticated reviewer portal. Access requires an individual account, and every case is checked for permission on each request. A forwarded notification email does not grant access to a case.`,
  },
  {
    title: "How it is stored",
    body: "Submitted answers are written to an access-controlled case store and transmitted over TLS. Hosted storage encryption and key management are provider controls that must be confirmed for the deployed project before launch; this draft does not claim that verification. A submitted snapshot is immutable: corrections are recorded alongside it rather than overwriting the original record. The case reference, submission time and questionnaire version are fixed at submission.",
  },
  {
    title: "What is kept out of other systems",
    body: "Health answers are excluded from advertising pixels, session-replay tools, ordinary analytics events, URL query strings, public document links, and routine application or monitoring logs. This interview does not train a general-purpose model on your answers.",
  },
  {
    title: "Retention and deletion",
    body: `Retention and deletion schedules must be documented before launch and confirmed with counsel. To request a copy, a correction, or deletion of your case, contact ${SITE.owner} using the address below and quote your case reference.`,
  },
  {
    title: "Your choices during the interview",
    body: "You can answer, mark an answer uncertain, decline to answer, or skip. Declining is never converted into a “No”. If you withhold something sensitive, the product offers a conversation with a person rather than pressing for an answer, and a human reviews anything consequential.",
  },
  {
    title: "Security limits, stated plainly",
    body: "No website can promise perfect security, and this interview is not an emergency or monitoring service. If you are in crisis, call or text 988; if your life is in immediate danger, call 911.",
  },
  {
    title: "Regulatory status",
    body: "This page describes product practice; it is not a claim of HIPAA compliance. Whether HIPAA, the Texas Insurance Code, or another regime applies depends on the actual legal entity, its role, and its vendor arrangements — that assessment belongs with counsel, not the website copy.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-14">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="eyebrow">Privacy practices</p>
          <Badge tone="warn">Draft — pending counsel review</Badge>
        </div>
        <h1 className="text-3xl leading-tight sm:text-4xl">How your information is handled</h1>
        <p className="prose-note">
          Written in plain language for the pre-underwriting interview at {SITE.brand}. Version{" "}
          {PRIVACY_PRACTICES_VERSION}.
        </p>
      </header>

      <Alert tone="warn" className="mt-8">
        This is draft product copy prepared for legal review. It is not a complete privacy notice or
        a substitute for one, and it does not replace a counsel-approved authorization. Do not treat
        it as legal advice or as a compliance certification.
      </Alert>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="text-xl leading-snug">{section.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>

      <section className="panel mt-12 space-y-3 p-6">
        <h2 className="text-lg">Contact</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {SITE.owner} at {SITE.brand} —{" "}
          <a href={`mailto:${SITE.reviewerEmail}`} className="link-quiet">
            {SITE.reviewerEmail}
          </a>
          . Initial regulatory baseline: {SITE.regulatoryBaseline}.
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Not an insurer. Submitting this interview creates no coverage and no application to a
          carrier. Optional marketing is governed by the{" "}
          <Link to="/messaging-terms" className="link-quiet">
            Messaging Terms
          </Link>
          ; you can withdraw it with the{" "}
          <Link to="/marketing-opt-out" className="link-quiet">
            marketing opt-out form
          </Link>
          .
        </p>
      </section>

      <div className="mt-8">
        <Link to="/start" className="link-quiet text-sm">
          Return to the interview
        </Link>
      </div>
    </div>
  );
}
