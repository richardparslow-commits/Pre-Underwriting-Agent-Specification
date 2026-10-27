import { Link, NavLink, Outlet } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE, FEATURES } from "@/config/site";
import { cn } from "@/lib/utils";

function Wordmark() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label={`${SITE.brand} home`}>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-display text-sm text-primary-foreground"
        aria-hidden
      >
        LP
      </span>
      <span className="leading-none">
        <span className="block font-display text-[1.05rem] tracking-tight">{SITE.brand}</span>
        <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
          Pre-underwriting review
        </span>
      </span>
    </Link>
  );
}

const NAV = [
  { to: "/#how", label: "How it works" },
  { to: "/#what-we-ask", label: "What we ask" },
  { to: "/privacy", label: "Privacy practices" },
];

export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Wordmark />

          <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "text-sm text-muted-foreground transition-colors hover:text-foreground",
                    isActive && !item.to.includes("#") && "text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="quiet" size="sm" className="hidden sm:inline-flex">
              <Link to="/portal">
                <LockKeyhole aria-hidden />
                Reviewer sign-in
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/start">Start the interview</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-secondary/40">
        <div className="container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="font-display text-lg">{SITE.brand}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Pre-underwriting intake reviewed personally by {SITE.owner}. Initial regulatory
              baseline: {SITE.regulatoryBaseline}.
            </p>
          </div>

          <div>
            <p className="eyebrow">Interview</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/start" className="link-quiet">
                  Start a review request
                </Link>
              </li>
              <li>
                <Link to="/#how" className="link-quiet">
                  How the interview works
                </Link>
              </li>
              <li>
                <Link to="/portal" className="link-quiet">
                  Reviewer portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow">Privacy</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy" className="link-quiet">
                  Privacy practices
                </Link>
              </li>
              <li>
                <a href={`mailto:${SITE.reviewerEmail}`} className="link-quiet">
                  Contact {SITE.owner}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow">Status</p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>
                Question bank:{" "}
                {!FEATURES.bankReconciled
                  ? "draft, awaiting reconciliation against the source PDF"
                  : FEATURES.bankSignedOff
                    ? "reconciled against the source PDF and signed off"
                    : "reconciled against the source PDF; reviewer sign-off pending"}
              </li>
              <li>Legal wording: draft, pending counsel review</li>
              <li>Not an insurer. No coverage is created by this interview.</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="container flex flex-col gap-2 py-5 text-[0.7rem] leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {SITE.brand}. Preliminary information collection only.
              Not an offer of insurance or a coverage decision.
            </p>
            <p>
              If you are in crisis, call or text 988. In immediate danger, call 911. This site does
              not monitor emergencies.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
