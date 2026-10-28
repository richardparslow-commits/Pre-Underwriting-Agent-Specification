import { QUESTION_BANK } from "./questionBank";
import { SECTIONS } from "./sections";
import type { Question } from "./types";
import {
  GAP_BY_SOURCE_ID,
  QUESTION_RECONCILIATION,
  RECONCILIATION_BY_ID,
  SOURCE_GAPS,
  sourceIdsFor,
  sourceRefFor,
  unacknowledgedSourceIds,
} from "./reconciliation";
import { SOURCE_BY_ID } from "./sourceIndex";
import { sourceTextFor } from "./sourceText";

/**
 * Structural checks for the question bank. Run in development and by the
 * launch-gate checklist: a broken reference here would silently skip a
 * question, which is exactly the failure the specification forbids.
 */
export function validateQuestionBank(bank: Question[] = QUESTION_BANK): string[] {
  const issues: string[] = [];
  const ids = new Map<string, number>();
  const sectionOrder = new Map(SECTIONS.map((section) => [section.id, section.order]));
  const validSections = new Set(SECTIONS.map((section) => section.id));

  bank.forEach((question, index) => {
    if (ids.has(question.id)) {
      issues.push(`Duplicate question id: ${question.id}`);
    } else {
      ids.set(question.id, index);
    }

    if (!validSections.has(question.section)) {
      issues.push(`${question.id}: unknown section "${question.section}"`);
    }

    // Reviewer rationale is server-only. Keeping it off the public row is the
    // invariant that stops it being bundled again; the server-bank generator
    // attaches it from reviewNotes.server.ts.
    if (Object.prototype.hasOwnProperty.call(question, "reviewNote")) {
      issues.push(`${question.id}: reviewNote must not be present on the public question row`);
    }

    // Held rows are never rendered. Their customer label must not name the
    // withheld topic in the public bundle; the internal reconciliation record
    // carries the reviewer detail.
    if (question.reviewStatus === "human_review_required") {
      const label = question.customerText.toLowerCase();
      for (const term of [
        "hiv",
        "aids",
        "suicid",
        "sex",
        "gender",
        "visa",
        "green card",
        "green-card",
        "immigration",
        "naturaliz",
      ]) {
        if (label.includes(term)) {
          issues.push(`${question.id}: held customer label names a withheld topic ("${term}")`);
        }
      }
    }

    if (question.compound && (!question.fields || question.fields.length === 0)) {
      issues.push(`${question.id}: compound question has no fields`);
    }

    if (question.kind === "yesno" && question.options) {
      issues.push(`${question.id}: yes/no question also declares options`);
    }

    if (!question.compound && question.kind !== "yesno" && question.fields?.length) {
      // A compound layout must be explicit, otherwise the renderer shows a
      // primary input the question text does not describe.
      issues.push(`${question.id}: fields present but the question is not marked compound`);
    }

    const fieldIds = new Set<string>();
    for (const field of question.fields ?? []) {
      if (fieldIds.has(field.id)) issues.push(`${question.id}: duplicate field id "${field.id}"`);
      fieldIds.add(field.id);
      if ((field.kind === "single_choice" || field.kind === "multi_choice") && !field.options?.length) {
        issues.push(`${question.id}.${field.id}: choice field has no options`);
      }
    }

    const promptIds = new Set<string>();
    for (const prompt of question.detailPrompts ?? []) {
      if (promptIds.has(prompt.id)) issues.push(`${question.id}: duplicate detail id "${prompt.id}"`);
      promptIds.add(prompt.id);
      if ((prompt.kind === "single_choice" || prompt.kind === "multi_choice") && !prompt.options?.length) {
        issues.push(`${question.id}.${prompt.id}: choice prompt has no options`);
      }
    }

    if (question.askWhen) {
      const parent = bank.find((candidate) => candidate.id === question.askWhen?.questionId);
      if (!parent) {
        issues.push(`${question.id}: askWhen references unknown question "${question.askWhen.questionId}"`);
      } else {
        const parentOrder = sectionOrder.get(parent.section) ?? 99;
        const ownOrder = sectionOrder.get(question.section) ?? 99;
        if (parentOrder > ownOrder) {
          issues.push(`${question.id}: askWhen parent appears in a later section`);
        }
      }
      if (question.askWhen.includes.length === 0) {
        issues.push(`${question.id}: askWhen has no trigger values`);
      }
    }

    // A crisis question must reach every customer. Gating it on a parent answer
    // hid it from anyone who declined or was unsure, which is exactly the group
    // that must still see the support panel.
    if (question.crisisFollowUp && question.askWhen) {
      issues.push(`${question.id}: crisis question must be asked unconditionally`);
    }
  });

  return issues;
}

/**
 * Reconciliation gate: every bank row must be traced to the source inventory
 * (or explicitly recorded as an LPP addition), every source question must be
 * acknowledged, and each verdict must agree with the row it describes.
 *
 * This is the automated half of launch gate 1. It cannot decide whether a
 * wording is approved; it only proves nothing was dropped in silence.
 */
export function validateReconciliation(bank: Question[] = QUESTION_BANK): string[] {
  const issues: string[] = [];
  const bankById = new Map(bank.map((question) => [question.id, question]));
  const recordIds = new Set<string>();

  for (const record of QUESTION_RECONCILIATION) {
    if (recordIds.has(record.questionId)) {
      issues.push(`Duplicate reconciliation record: ${record.questionId}`);
    }
    recordIds.add(record.questionId);

    const question = bankById.get(record.questionId);
    if (!question) {
      issues.push(`${record.questionId}: reconciliation record has no question row`);
      continue;
    }

    for (const sourceId of record.sourceIds) {
      if (!SOURCE_BY_ID[sourceId]) {
        issues.push(`${record.questionId}: unknown source id ${sourceId}`);
      }
    }

    if (record.verdict === "added_by_lpp" || record.verdict === "not_in_source") {
      if (record.sourceIds.length > 0) {
        issues.push(`${record.questionId}: ${record.verdict} rows must not cite source ids`);
      }
      if (question.status !== "supplemental") {
        issues.push(`${record.questionId}: ${record.verdict} but the row is marked core`);
      }
    } else if (record.sourceIds.length === 0 && record.verdict !== "held_for_review") {
      issues.push(`${record.questionId}: no source ids and no LPP verdict`);
    }

    if (record.sourceIds.length > 0 && question.status !== "core") {
      issues.push(`${record.questionId}: cites source ids but the row is not marked core`);
    }

    if (record.verdict === "matches_source" && record.flags.length > 0) {
      issues.push(`${record.questionId}: a matching row cannot carry flags`);
    }

    if (
      (record.verdict === "timeframe_changed" || record.verdict === "timeframe_merged") &&
      !record.flags.some((flag) => flag.kind === "timeframe")
    ) {
      issues.push(`${record.questionId}: timeframe verdict without a timeframe flag`);
    }

    if ((question.reviewStatus === "human_review_required") !== (record.verdict === "held_for_review")) {
      issues.push(`${record.questionId}: held status and reconciliation verdict disagree`);
    }

    if (!question.sourceRef) {
      issues.push(`${record.questionId}: empty source reference`);
    }
    if (sourceRefFor(record.questionId) !== question.sourceRef) {
      issues.push(`${record.questionId}: sourceRef is not derived from the reconciliation record`);
    }
    const sourceText = sourceTextFor(record.questionId);
    if (!sourceText) {
      issues.push(`${record.questionId}: empty source text`);
    }
    if (sourceIdsFor(record.questionId).length > 0) {
      for (const sourceId of record.sourceIds) {
        if (!sourceText.includes(sourceId)) {
          issues.push(`${record.questionId}: sourceText omits ${sourceId}`);
        }
      }
    }

    if (!record.action.trim()) {
      issues.push(`${record.questionId}: reconciliation record has no reviewer action`);
    }
  }

  for (const question of bank) {
    if (!RECONCILIATION_BY_ID[question.id]) {
      issues.push(`${question.id}: question row has no reconciliation record`);
    }
  }

  for (const gap of SOURCE_GAPS) {
    if (!SOURCE_BY_ID[gap.sourceId]) {
      issues.push(`Gap references unknown source id ${gap.sourceId}`);
    }
    if (gap.disposition === "merge_into") {
      if (!gap.target) {
        issues.push(`${gap.sourceId}: merge_into needs a target question`);
      } else if (!bankById.has(gap.target)) {
        issues.push(`${gap.sourceId}: merge_into target ${gap.target} is not a question row`);
      }
    } else if (gap.target) {
      issues.push(`${gap.sourceId}: ${gap.disposition} must not name a target`);
    }
    if (
      QUESTION_RECONCILIATION.some((record) => record.sourceIds.includes(gap.sourceId))
    ) {
      issues.push(`${gap.sourceId}: listed as a gap but also traced to a question`);
    }
    if (!gap.reason.trim()) {
      issues.push(`${gap.sourceId}: gap has no reason`);
    }
  }

  for (const sourceId of Object.keys(SOURCE_BY_ID)) {
    const traced = QUESTION_RECONCILIATION.some((record) => record.sourceIds.includes(sourceId));
    if (!traced && !GAP_BY_SOURCE_ID[sourceId]) {
      issues.push(`${sourceId}: source question is neither traced nor recorded as a gap`);
    }
  }

  for (const sourceId of unacknowledgedSourceIds()) {
    issues.push(`${sourceId}: source question is unacknowledged`);
  }

  return issues;
}
