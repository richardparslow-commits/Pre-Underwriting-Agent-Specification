import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="container max-w-xl py-24">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-3 text-3xl">This page does not exist</h1>
      <p className="prose-note mt-3">
        The link may be out of date. Your case reference still works in the reviewer portal.
      </p>
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link to="/" className="link-quiet">
          Home
        </Link>
        <Link to="/start" className="link-quiet">
          Start the interview
        </Link>
        <Link to="/portal" className="link-quiet">
          Reviewer portal
        </Link>
      </div>
    </div>
  );
}
