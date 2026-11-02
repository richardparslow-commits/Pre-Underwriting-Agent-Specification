import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { StatusTimeline } from "./StatusTimeline";
import { ConfirmationScreen } from "./ConfirmationScreen";
import type { NotificationRecord, SubmissionReceipt } from "@/features/interview/types";

const base = { updatedAt: "2026-11-02T12:00:00Z", attempts: 1 };
const timeline = (record: NotificationRecord) => renderToStaticMarkup(<StatusTimeline notification={record} />);

test("a timeout or request error never establishes provider rejection or delivery", () => {
 for (const detail of ["Provider request timed out; delivery is unconfirmed and queued for retry", "Provider request failed", undefined]) {
  const html = timeline({ ...base, state: "failed", detail });
  assert.match(html, /Provider acceptance is unconfirmed/);
  assert.match(html, /Only a provider delivery event can confirm this step/);
  assert.doesNotMatch(html, /provider rejected|could not accept|— failed/i);
 }
});

test("confirmation keeps the saved case separate from an unconfirmed notification", () => {
 const receipt: SubmissionReceipt = { reference: "LPP-2026-TEST01", submittedAt: base.updatedAt, status: "submitted", notification: { ...base, state: "failed", detail: "Provider request timed out" } };
 const html = renderToStaticMarkup(<StaticRouter location="/start"><ConfirmationScreen receipt={receipt} onStartOver={() => {}} /></StaticRouter>);
 assert.match(html, /Your answers are saved/);
 assert.match(html, /notification to .* could not be confirmed/);
 assert.doesNotMatch(html, /notification to .* failed\./);
 assert.match(html, /LPP-2026-TEST01/);
});

test("acceptance remains distinct from provider-confirmed delivery", () => {
 const accepted = timeline({ ...base, state: "accepted" });
 assert.match(accepted, /The provider accepted it for delivery/);
 assert.match(accepted, /Only a provider delivery event can confirm this step/);
 assert.doesNotMatch(accepted, /The provider reported a delivery event/);
 const delivered = timeline({ ...base, state: "delivered" });
 assert.match(delivered, /The provider reported a delivery event/);
 const notSent = timeline({ ...base, state: "not_sent" });
 assert.match(notSent, /No notification was attempted/);
 assert.doesNotMatch(notSent, /The provider accepted it for delivery/);
});
