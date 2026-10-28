import { Link } from "react-router-dom";
import { Alert, Badge } from "@/components/ui/surface";
import { MARKETING, MARKETING_ENABLED, SITE } from "@/config/site";
import { DISCLOSURE_VERSION } from "@/features/consent/consentTexts";

function channelList(): string {
  if (MARKETING.calls && MARKETING.texts) return "marketing telephone calls and marketing text messages";
  if (MARKETING.calls) return "marketing telephone calls";
  return "marketing text messages";
}

function technologyNotes(): string[] {
  const notes: string[] = [];
  if (MARKETING.calls && MARKETING.autodialer) {
    notes.push("Calls may be placed using an automatic telephone dialing system.");
  }
  if (MARKETING.calls && MARKETING.aiVoice) {
    notes.push(
      "Calls may use an artificial or prerecorded voice, including an AI-generated voice.",
    );
  }
  return notes;
}

const SECTIONS = [
  {
    title: "What this program covers",
    body: "These terms cover optional marketing about life insurance. They do not cover the pre-underwriting interview itself, a response you request to your enquiry, or any transactional message about a case you submit.",
  },
  {
    title: "What you agree to when you opt in",
    body: `If you tick a marketing box, you authorize ${SITE.legalEntity || SITE.brand} to contact the telephone number you provided with marketing information about life insurance, using only the channel you selected. Marketing consent is never a condition of purchasing any goods or services, and it is never required to submit the interview.`,
  },
  {
    title: "How to stop",
    body: `You can withdraw marketing consent at any time by ${
      MARKETING.texts && MARKETING.calls
        ? "replying STOP to a text, telling the caller, or"
        : MARKETING.texts
          ? "replying STOP to a text, or"
          : "telling the caller, or"
    } emailing ${SITE.reviewerEmail}. We act on a revocation promptly and no later than 10 business days after we receive it. A withdrawal stops future marketing; it does not affect your requested review.`,
  },
  {
    title: "What this program does not do",
    body: "We do not send marketing without a permission recorded for that channel. We do not put diagnoses, medications, or other health answers into marketing calls, texts, or marketing lists. A marketing permission is not permission to share health information, and it is not a medical-record release.",
  },
];

export default function MessagingTermsPage() {
  const notes = technologyNotes();
  const heading = !MARKETING_ENABLED
    ? "Marketing calls and texts"
    : MARKETING.calls && MARKETING.texts
      ? "Marketing calls and texts"
      : MARKETING.calls
        ? "Marketing calls"
        : "Marketing texts";

  return (
    <div className="container max-w-3xl py-14">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="eyebrow">Messaging terms</p>
          <Badge tone="warn">Draft — pending counsel review</Badge>
        </div>
        <h1 className="text-3xl leading-tight sm:text-4xl">{heading}</h1>
        <p className="prose-note">
          Optional marketing for {SITE.brand}. Version {DISCLOSURE_VERSION}.
        </p>
      </header>

      <Alert tone="warn" className="mt-8">
        This is draft product copy prepared for legal review. It is not legal advice or a
        compliance certification, and it does not replace the consent disclosure shown in the
        interview.
      </Alert>

      <section className="panel mt-8 space-y-3 p-6">
        <h2 className="text-lg">Current channels</h2>
        {MARKETING_ENABLED ? (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {SITE.brand} currently operates {channelList()}. Marketing is offered only for the
              channels shown in the interview, and only when a telephone number has been provided
              for that purpose.
            </p>
            {notes.map((note) => (
              <p key={note} className="text-sm leading-relaxed text-muted-foreground">
                {note}
              </p>
            ))}
            {MARKETING.texts ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Message frequency varies. Message and data rates may apply.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            No marketing calls or texts are offered in this version. The interview does not request
            marketing consent, and submitting it never requires marketing consent. These terms are
            published so the program is documented before any channel is enabled.
          </p>
        )}
      </section>

      {MARKETING_ENABLED ? (
        <div className="mt-10 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="text-xl leading-snug">{section.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
          <p className="text-sm leading-relaxed text-muted-foreground">
            You can also record a stop request online with the{" "}
            <Link to="/marketing-opt-out" className="link-quiet">
              marketing opt-out form
            </Link>
            .
          </p>
        </div>
      ) : null}

      <section className="panel mt-12 space-y-3 p-6">
        <h2 className="text-lg">Operator and contact</h2>
        {SITE.legalEntity ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {SITE.legalEntity}, doing business as {SITE.brand}. Initial regulatory baseline:{" "}
            {SITE.regulatoryBaseline}.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            The operating legal entity is not named here yet. Marketing remains disabled until it
            is confirmed and configured.
          </p>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">
          Questions or a request to stop:{" "}
          <a href={`mailto:${SITE.reviewerEmail}`} className="link-quiet">
            {SITE.reviewerEmail}
          </a>
          .
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link to="/privacy" className="link-quiet">
          Privacy practices
        </Link>
        <Link to="/start" className="link-quiet">
          Return to the interview
        </Link>
      </div>
    </div>
  );
}
