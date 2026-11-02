import test from "node:test";
import assert from "node:assert/strict";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { StaticRouter } from "react-router-dom";
import { CaseReview } from "./CaseReview";
import type { CaseRecord, MarketingRevocationRecord } from "@/features/interview/types";
const at = "2026-01-01T00:00:00Z";
const phone: MarketingRevocationRecord = { channel: "phone", reason: "Synthetic old phone withdrawal", source: "customer_web", recordedBy: "customer", recordedAt: at };
function fixture(latest?: MarketingRevocationRecord | null, entries: MarketingRevocationRecord[] = []): CaseRecord {
  return {
    reference: "LPP-2026-WITH01", questionnaireVersion: "test", startedAt: at, completedAt: at, submittedAt: at,
    lead: { firstName: "Synthetic", lastName: "Case", state: "TX", dateOfBirth: "1990-01-01", adultAttested: true, email: "synthetic@example.test", preferredContact: "email" },
    adultAttested: true, relationship: "self", answers: [], flags: [], acknowledgements: [], crisisDisclosure: false,
    consents: ["marketing_call", "marketing_text"].map(id=>({ id: id as "marketing_call" | "marketing_text", label: id, granted: true, grantedAt: at, textVersion: "test", text: "Synthetic consent wording" })),
    status: "submitted", notification: {state:"not_sent", attempts:0, updatedAt:at}, reviewLog:[], reviewHistoryCursor:null, corrections:[], correctionsCursor:null,
    marketingRevocations: entries, latestPhoneRevocation: latest, revocationsCursor:null,
    draftSummary: {generatedAt:at,line:"Synthetic",sections:[],flags:[]},
  };
}
const text = (v: ReactTestRenderer) => JSON.stringify(v.toJSON());
async function render(record: CaseRecord, check: (view: ReactTestRenderer)=>void) {
  let view!: ReactTestRenderer;
  await act(async()=>{view=create(<StaticRouter location="/portal/LPP-2026-WITH01"><CaseReview record={record} onRefresh={()=>{}} /></StaticRouter>);});
  try { check(view); } finally {act(()=>view.unmount());}
}
test("phone withdrawal stays visible and both consent badges stay Revoked after 20 newer email events", async()=>{
  const emails=Array.from({length:20},(_,i)=>({...phone,channel:"email" as const,reason:`Synthetic newer email ${i}`,recordedAt:`2026-02-01T00:00:${String(i).padStart(2,'0')}Z`}));
  const record=fixture(phone,emails);
  const before=JSON.stringify(record.consents);
  await render(record,view=>{
    assert.match(text(view),/Latest phone withdrawal/);
    assert.match(text(view),/Synthetic old phone withdrawal/);
    assert.equal(view.root.findAll(n=>n.children.length===1 && n.children[0]==='Revoked').length,2);
    assert.doesNotMatch(text(view),/withdrawal status unavailable/);
  });
  assert.equal(JSON.stringify(record.consents),before,'never rewrite the consent snapshot');
});
test("an older backend with only email events cannot establish that phone consent is current",async()=>{
  await render(fixture(undefined,[{...phone,channel:'email'}]),view=>{
    assert.match(text(view),/Current phone withdrawal status could not be checked/);
    assert.equal(view.root.findAll(n=>n.children.length===1 && n.children[0]==='Given').length,0);
    assert.match(text(view),/Given at submission; withdrawal status unavailable/);
  });
});
test("a complete null summary preserves original consent and known legacy phone evidence remains revoked",async()=>{
  await render(fixture(null),view=>{
    assert.equal(view.root.findAll(n=>n.children.length===1 && n.children[0]==='Given').length,2);
    assert.doesNotMatch(text(view),/Current phone withdrawal status could not be checked/);
  });
  await render(fixture(undefined,[phone]),view=>{
    assert.equal(view.root.findAll(n=>n.children.length===1 && n.children[0]==='Revoked').length,2);
    assert.doesNotMatch(text(view),/Current phone withdrawal status could not be checked/);
  });
});
