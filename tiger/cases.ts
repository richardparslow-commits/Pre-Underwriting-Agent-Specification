import { QUESTION_BANK, QUESTION_BY_ID } from '../src/features/interview/questionBank';
import { crisisDisclosed, dispositionFor, toSubmittedAnswers, pruneBranchClosedAnswers } from '../src/features/interview/engine';
import { ageOn, validateLead } from '../src/features/intake/validation';
import type { Answers, AnswerState, Question } from '../src/features/interview/types';

const at = '2026-11-04T12:00:00.000Z';
const answer = (state: AnswerState) => ({ state, updatedAt: at });
export interface EvaluationCase {
  id: string;
  category: string;
  input: unknown;
  expected: unknown;
  evaluate: () => unknown;
}

// Open ancestors explicitly; expected outcomes below never come from the engine.
function openAncestors(question: Question): Answers {
  if (!question.askWhen) return {};
  const parent = QUESTION_BY_ID[question.askWhen.questionId];
  if (!parent) throw new Error(`Missing parent of ${question.id}`);
  const value = question.askWhen.includes[0];
  if (!value) throw new Error(`Empty branch condition on ${question.id}`);
  const record = parent.kind === 'yesno' ? answer(value as AnswerState) :
    parent.kind === 'multi_choice' ? { values: [value], updatedAt: at } : { value, updatedAt: at };
  return { ...openAncestors(parent), [parent.id]: record };
}

export function evaluationCases(): EvaluationCase[] {
  const cases: EvaluationCase[] = [];
  for (const question of QUESTION_BANK) {
    const parents = openAncestors(question);
    if (question.reviewStatus === 'approved' && question.kind === 'yesno' && !question.compound) {
      for (const state of [undefined, 'yes', 'no', 'unknown', 'declined'] as const) {
        const input = state ? { ...parents, [question.id]: answer(state) } : parents;
        cases.push({ id: `${question.id}-${state ?? 'blank'}`, category: 'answer-state', input,
          expected: { disposition: state === undefined ? 'unresolved' : state === 'yes' || state === 'no' ? 'answered' : state },
          evaluate: () => ({ disposition: dispositionFor(question, input[question.id], input) }) });
      }
      if (question.fields?.length || question.detailPrompts?.length) {
        const input = { ...parents, [question.id]: { ...answer('no'),
          fields: Object.fromEntries((question.fields ?? []).map(f => [f.id, 'synthetic stale detail'])),
          details: Object.fromEntries((question.detailPrompts ?? []).map(f => [f.id, 'synthetic stale detail'])) } };
        cases.push({ id: `${question.id}-no-stale-detail`, category: 'submission-contract', input,
          expected: { fields: [], details: [] }, evaluate: () => {
            const row = toSubmittedAnswers(input).find(r => r.questionId === question.id)!;
            return { fields: row.fields, details: row.details };
          } });
      }
    }
    if (question.reviewStatus === 'human_review_required' || question.askWhen) {
      const input: Answers = { [question.id]: { ...answer('yes'), value: 'synthetic hidden value',
        values: ['synthetic hidden value'], fields: { condition: 'synthetic hidden detail' } } };
      cases.push({ id: `${question.id}-hidden-content`, category: 'hidden-answer', input,
        expected: { disposition: question.reviewStatus === 'human_review_required' ? 'held_for_review' : 'not_asked',
          fields: [], details: [], hasState: false, hasValues: false }, evaluate: () => {
          const row = toSubmittedAnswers(input).find(r => r.questionId === question.id)!;
          return { disposition: row.disposition, fields: row.fields, details: row.details,
            hasState: row.answerState !== undefined, hasValues: row.answerValues !== undefined };
        } });
    }
  }
  for (const history of ['yes', 'no', 'unknown', 'declined'] as const) {
    for (const current of ['yes', 'no', 'unknown', 'declined'] as const) {
      const input = { 'MH-04': answer(history), 'MH-05': answer(current) };
      cases.push({ id: `safety-${history}-${current}`, category: 'current-safety', input,
        expected: current === 'yes', evaluate: () => crisisDisclosed(input) });
    }
  }
  const closed: Answers = { 'MIL-01': answer('no'), 'MIL-02': answer('yes'),
    'MIL-04': { values: ['proficiency'], updatedAt: at } };
  cases.push({ id: 'nested-branch-closure', category: 'branch-pruning', input: closed,
    expected: { childRetained: false, grandchildRetained: false }, evaluate: () => {
      const pruned = pruneBranchClosedAnswers(closed);
      return { childRetained: !!pruned['MIL-02'], grandchildRetained: !!pruned['MIL-04'] };
    } });
  for (const [dob, expected] of [
    ['1980-02-30', false], ['1981-02-29', false], ['1980-04-31', false],
    ['1980-02-29', true], ['1980-01-01', true],
  ] as const) {
    const input = { firstName: 'Synthetic', lastName: 'Fixture', state: 'TX',
      email: 'synthetic@example.invalid', dateOfBirth: dob, preferredContact: 'email' as const, adultAttested: true };
    cases.push({ id: `calendar-${dob}`, category: 'calendar-validation', input, expected,
      evaluate: () => validateLead(input).dateOfBirth === undefined });
  }
  for (const [dob, expected] of [['2008-11-04', 18], ['2008-11-05', 17], ['1906-11-04', 120]] as const) {
    cases.push({ id: `age-${dob}`, category: 'age-boundary', input: { dob, on: at }, expected,
      evaluate: () => ageOn(dob, new Date(at)) });
  }
  return cases;
}
