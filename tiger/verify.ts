import { QUESTION_BANK } from '../src/features/interview/questionBank';
import { QUESTIONNAIRE_VERSION } from '../src/features/interview/types';
import { evaluationCases } from './cases';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const quote = (value: unknown) => "'" + String(value).replaceAll("'", "''") + "'";
const json = (value: unknown) => quote(JSON.stringify(value)) + '::jsonb';
const fixtures = evaluationCases();
const suiteHash = digest(JSON.stringify(fixtures.map(({ evaluate: _evaluate, ...fixture }) => fixture)));
const files = ['src/features/interview/engine.ts', 'src/features/interview/types.ts',
  'src/features/interview/questionBank.ts', 'src/features/interview/questionSourceRefs.ts',
  'src/features/interview/sections.ts', 'src/features/intake/validation.ts',
  'supabase/functions/_shared/lead-validation.ts', 'tiger/cases.ts', 'tiger/verify.ts'];
const codeHash = digest(JSON.stringify(files.map(path => [path, readFileSync(path, 'utf8')])));
const definition = { bank: QUESTION_BANK, codeHash, suiteHash };
const hash = digest(JSON.stringify(definition));
const spec = `${QUESTIONNAIRE_VERSION}:${hash}`;
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0;
const run = randomUUID();
const results = fixtures.map(fixture => {
  let actual: unknown;
  try { actual = fixture.evaluate(); }
  catch (error) { actual = { error: error instanceof Error ? error.message : String(error) }; }
  return { ...fixture, actual, passed: isDeepStrictEqual(actual, fixture.expected) };
});
const failed = results.filter(result => !result.passed);
// A failing app check must be persisted before this process exits unsuccessfully.
let sql = 'BEGIN;\n' + readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
sql += `\nINSERT INTO underwriting_eval.specifications (id,source_commit,content_hash,definition) VALUES (${quote(spec)},${quote(commit)},${quote(hash)},${json(definition)}) ON CONFLICT DO NOTHING;\n`;
sql += `INSERT INTO underwriting_eval.evaluation_runs (run_id,specification_id,source_commit,dirty_tree,code_hash,suite_hash,total,failed) VALUES (${quote(run)},${quote(spec)},${quote(commit)},${dirty},${quote(codeHash)},${quote(suiteHash)},${results.length},${failed.length});\n`;
for (const result of results) {
  const key = `${hash}:${result.id}`;
  sql += `INSERT INTO underwriting_eval.test_cases (id,specification_id,synthetic_input,expected) VALUES (${quote(key)},${quote(spec)},${json(result.input)},${json(result.expected)}) ON CONFLICT DO NOTHING;\n`;
  sql += `INSERT INTO underwriting_eval.pre_underwriting_audit_log (run_id,test_case_id,specification_id,input_profile,matched_rules,outcome,expected,passed) VALUES (${quote(run)},${quote(key)},${quote(spec)},${json(result.input)},${json([result.category])},${json(result.actual)},${json(result.expected)},${json(result.actual)}=${json(result.expected)});\n`;
}
// Assert storage integrity, not success: rolling back failed checks would erase bug evidence.
sql += `DO $$ BEGIN IF (SELECT count(*) FROM underwriting_eval.pre_underwriting_audit_log WHERE run_id=${quote(run)}) <> ${results.length} OR (SELECT count(*) FROM underwriting_eval.pre_underwriting_audit_log WHERE run_id=${quote(run)} AND NOT passed) <> ${failed.length} THEN RAISE EXCEPTION 'Evaluation persistence mismatch'; END IF; END $$;\nCOMMIT;\n`;
sql += `SELECT run_id,total,total-failed AS passed,failed,source_commit,dirty_tree FROM underwriting_eval.evaluation_runs WHERE run_id=${quote(run)};\n`;
writeFileSync(new URL('./generated.sql', import.meta.url), sql, { mode: 0o600 });
console.table([...new Set(results.map(r => r.category))].map(category => {
  const rows = results.filter(r => r.category === category);
  return { category, total: rows.length, passed: rows.filter(r => r.passed).length, failed: rows.filter(r => !r.passed).length };
}));
for (const result of failed) console.error(result.id, { expected: result.expected, actual: result.actual });
console.log(`Run ${run}: ${results.length - failed.length}/${results.length} passed; commit ${commit}; dirty=${dirty}`);
if (process.argv.includes('--live')) {
  const service = process.env.TIGER_SERVICE_ID;
  if (!service) throw new Error('Set TIGER_SERVICE_ID explicitly for the intended development service');
  const response = JSON.parse(execFileSync('tiger', ['service', 'get', service, '--output', 'json'], { encoding: 'utf8' }));
  const target = response.service ?? response;
  if ((target.metadata?.environment ?? target.environment) !== 'DEV' || target.status !== 'READY') throw new Error('Live evaluations require a READY DEV service');
  execFileSync('tiger', ['db', 'query', service, '--file', new URL('./generated.sql', import.meta.url).pathname], { stdio: 'inherit' });
} else console.log('LOCAL ONLY: app checks executed; generated SQL has not been written to Tiger.');
process.exitCode = failed.length ? 1 : 0;
