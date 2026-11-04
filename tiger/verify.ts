import { QUESTION_BANK } from '../src/features/interview/questionBank';
import { QUESTIONNAIRE_VERSION, type Answers } from '../src/features/interview/types';
import { dispositionFor, crisisDisclosed } from '../src/features/interview/engine';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const at = '2026-10-27T12:00:00Z';
const answer = (state: 'yes' | 'no' | 'unknown' | 'declined' | 'not_applicable') => ({state, updatedAt: at});
const cases = [
 ['blank-medical', 'MED-01', {}, 'unresolved', false],
 ['medical-no', 'MED-01', {'MED-01': answer('no')}, 'answered', false],
 ['medical-yes', 'MED-01', {'MED-01': answer('yes')}, 'answered', false],
 ['medical-unknown', 'MED-01', {'MED-01': answer('unknown')}, 'unknown', false],
 ['medical-declined', 'MED-01', {'MED-01': answer('declined')}, 'declined', false],
 ['medical-na', 'MED-01', {'MED-01': answer('not_applicable')}, 'not_applicable', false],
 ['history-branch-closed', 'MH-02', {'MH-01': answer('no')}, 'not_asked', false],
 ['history-details-missing', 'MH-02', {'MH-01': answer('yes')}, 'unresolved', false],
 ['current-crisis', 'MH-05', {'MH-05': answer('yes')}, 'answered', true],
 ['current-safety-unknown', 'MH-05', {'MH-05': answer('unknown')}, 'unknown', false],
] as const;
const definition = JSON.stringify(QUESTION_BANK);
const hash = createHash('sha256').update(definition).digest('hex');
const spec = `${QUESTIONNAIRE_VERSION}:${hash}`;
const commit = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const quote = (v: unknown) => "'" + String(v).replaceAll("'", "''") + "'";
const json = (v: unknown) => quote(JSON.stringify(v)) + '::jsonb';
let sql = readFileSync(new URL('./schema.sql', import.meta.url),'utf8');
sql += `\nINSERT INTO underwriting_eval.specifications VALUES (${quote(spec)},${quote(commit)},${quote(hash)},${json(QUESTION_BANK)},now()) ON CONFLICT DO NOTHING;\n`;
const run = randomUUID();
const results = cases.map(([id,qid,input,disposition,crisis]) => {
 const question = QUESTION_BANK.find(q=>q.id===qid);
 assert(question, qid);
 const actual = {disposition:dispositionFor(question,input[qid as keyof typeof input],input as Answers),crisis:crisisDisclosed(input as Answers)};
 const expected = {disposition,crisis};
 assert.deepEqual(actual,expected,id);
 const key = `${hash}:${id}`;
 sql += `INSERT INTO underwriting_eval.test_cases VALUES (${quote(key)},${quote(spec)},${json(input)},${json(expected)}) ON CONFLICT DO NOTHING;\n`;
 sql += `INSERT INTO underwriting_eval.pre_underwriting_audit_log (run_id,test_case_id,specification_id,input_profile,matched_rules,outcome,expected,passed) VALUES (${quote(run)},${quote(key)},${quote(spec)},${json(input)},${json([qid])},${json(actual)},${json(expected)},${json(actual)}=${json(expected)});\n`;
 return {id,...actual,passed:true};
});
sql += `DO $$ BEGIN IF (SELECT count(*) FROM underwriting_eval.pre_underwriting_audit_log WHERE run_id=${quote(run)} AND passed) <> 10 THEN RAISE EXCEPTION 'Live evaluation verification failed'; END IF; END $$;`;
sql += `SELECT test_case_id, outcome, expected, passed FROM underwriting_eval.pre_underwriting_audit_log WHERE run_id=${quote(run)};`;
writeFileSync(new URL('./generated.sql',import.meta.url),sql);
console.table(results);
if(process.argv.includes('--live')) {
 const service=process.env.TIGER_SERVICE_ID;
 if (!service) throw new Error('Set TIGER_SERVICE_ID explicitly for the intended account');
 execFileSync('tiger',['db','query',service,'--file',new URL('./generated.sql',import.meta.url).pathname],{stdio:'inherit'});
 execFileSync('tiger',['db','query',service,'-c','SELECT current_database(), 1 AS connected'],{stdio:'inherit'});
} else console.log('LOCAL ONLY: generated migration + fixtures; no live database assertions executed.');
