import test from "node:test";
import assert from "node:assert/strict";
import { useState } from "react";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { StaticRouter } from "react-router-dom";
import { LeadForm } from "./LeadForm";
import type { LeadDetails } from "@/features/interview/types";

function text(node: ReactTestInstance | string): string {
  return typeof node === "string" ? node : node.children.map(text).join("");
}
const BASE: Partial<LeadDetails> = {
  firstName: "Synthetic", lastName: "Contact", state: "TX",
  dateOfBirth: "1980-01-01", adultAttested: true,
  email: "contact@example.invalid", preferredContact: "phone",
};
const consent = {
  privacyAcknowledged: true, intakePermission: false,
  marketingCall: false, marketingText: false,
};
async function fixture(
  initial: Partial<LeadDetails>,
  run: (f: {
    view: ReactTestRenderer;
    read: () => Partial<LeadDetails>;
    continued: () => number;
    enter: (name: string, value: string) => Promise<void>;
    email: () => Promise<void>;
    submit: () => Promise<void>;
  }) => Promise<void>,
) {
  let current!: Partial<LeadDetails>;
  let continues = 0;
  function Harness() {
    const [lead, setLead] = useState({ ...BASE, ...initial });
    current = lead;
    return <StaticRouter location="/start"><LeadForm
      lead={lead} consent={consent}
      onField={(field, value) => setLead((previous) => ({ ...previous, [field]: value }))}
      onAdultAttested={(value) => setLead((previous) => ({ ...previous, adultAttested: value }))}
      onConsent={() => {}}
      onContinue={() => { continues++; }}
    /></StaticRouter>;
  }
  let view!: ReactTestRenderer;
  await act(async () => { view = create(<Harness />); });
  try {
    await run({
      view, read: () => current, continued: () => continues,
      enter: async (name, value) => {
        const field = view.root.findAllByType("input").find((node) => node.props.name === name);
        assert.ok(field, `${name} must stay editable`);
        await act(async () => field.props.onChange({ target: { value } }));
      },
      email: async () => {
        const choice = view.root.findAllByType("input").find((node) => node.props.name === "preferredContact" && node.props.value === "email");
        assert.ok(choice);
        await act(async () => choice.props.onChange());
      },
      submit: async () => {
        await act(async () => view.root.findByType("form").props.onSubmit({ preventDefault() {} }));
      },
    });
  } finally { await act(async () => view.unmount()); }
}

test("switching from a partial phone to Email shows the error and allows clearing the number", async () => {
  await fixture({}, async ({ view, read, continued, enter, email, submit }) => {
    await enter("phone", "555");
    await email();
    await submit();
    assert.equal(continued(), 0);
    assert.match(text(view.root), /Enter a valid 10-digit telephone number/);
    assert.ok(view.root.findAllByType("input").some((node) => node.props.name === "phone" && node.props["aria-invalid"]));
    assert.match(text(view.root), /number is optional/i);
    assert.equal(view.root.findAllByType("input").find((node) => node.props.name === "phone")?.props["aria-describedby"], "phone-help");
    await enter("phone", "");
    await submit();
    assert.equal(continued(), 1);
    assert.equal(read().preferredContact, "email");
    assert.equal(read().phone, "");
  });
});

test("switching to Email retains a valid number and contact time without blocking continuation", async () => {
  await fixture({ preferredContactTime: "Weekday mornings" }, async ({ view, read, continued, enter, email, submit }) => {
    await enter("phone", "5125550134");
    const phone = read().phone;
    await email();
    assert.equal(view.root.findAllByType("input").find((node) => node.props.name === "phone")?.props.value, phone);
    assert.equal(read().preferredContactTime, "Weekday mornings");
    await submit();
    assert.equal(continued(), 1);
    assert.equal(read().phone, phone, "changing preference must not silently delete an entered value");
  });
});

test("an empty phone is optional for Email and fresh email-only forms remain compact", async () => {
  await fixture({ preferredContact: "email" }, async ({ view, continued, submit }) => {
    assert.ok(!view.root.findAllByType("input").some((node) => node.props.name === "phone"));
    await submit();
    assert.equal(continued(), 1);
  });
});

test("a retained invalid contact time stays visible and recoverable for Email", async () => {
  await fixture({ preferredContact: "email", preferredContactTime: "x".repeat(121) }, async ({ view, read, continued, enter, submit }) => {
    await submit();
    assert.equal(continued(), 0);
    assert.match(text(view.root), /120/);
    const time = view.root.findAllByType("input").find((node) => node.props.name === "preferredContactTime");
    assert.ok(time);
    assert.equal(time.props.value.length, 121, "the old value must remain visible rather than be truncated");
    await enter("preferredContactTime", "");
    await submit();
    assert.equal(continued(), 1);
    assert.equal(read().preferredContactTime, "");
  });
});
