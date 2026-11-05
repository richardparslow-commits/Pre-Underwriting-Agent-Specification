import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const report = readFileSync(new URL('./report.sql', import.meta.url), 'utf8');
const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');

test('Tiger report shows older audit runs alongside runs with headers', async () => {
  const database = new PGlite();
  const legacyRun = '11111111-1111-4111-8111-111111111111';
  const currentRun = '22222222-2222-4222-8222-222222222222';
  try {
    // The report only needs the relational tables, before Timescale setup.
    await database.exec(schema.split("SELECT create_hypertable(")[0]);
    await database.exec(`
      INSERT INTO underwriting_eval.specifications (id, source_commit, content_hash, definition)
      VALUES ('spec', 'spec-commit', 'spec-hash', '{}');
      INSERT INTO underwriting_eval.test_cases
      VALUES ('legacy-case', 'spec', '{}', '{}'), ('hash:modern-case', 'spec', '{}', '{}');
    `);

    const insertAudit = (run, caseId, at, passed) => database.query(`
      INSERT INTO underwriting_eval.pre_underwriting_audit_log
        (run_id, test_case_id, evaluated_at, passed, specification_id,
         input_profile, matched_rules, outcome, expected)
      VALUES ($1, $2, $3, $4, 'spec', '{}', '[]', '{}', '{}')
    `, [run, caseId, at, passed]);

    await insertAudit(legacyRun, 'legacy-case', '2025-01-01T00:00:00Z', false);
    await insertAudit(legacyRun, 'hash:modern-case', '2025-01-01T00:00:01Z', true);
    const [olderSummary, olderFailures] = await database.exec(report);
    assert.deepEqual(olderSummary.rows.map(row => ({
      ...row, total: Number(row.total), passed: Number(row.passed), failed: Number(row.failed),
    })), [{
      run_id: legacyRun, created_at: new Date('2025-01-01T00:00:00Z'),
      source_commit: null, dirty_tree: null, code_hash: null, suite_hash: null,
      total: 2, passed: 1, failed: 1, expected_total: null, integrity: 'legacy',
    }]);
    assert.deepEqual(olderFailures.rows.map(row => row.case_id), ['legacy-case']);

    await database.query(`
      INSERT INTO underwriting_eval.evaluation_runs
        (run_id, specification_id, created_at, source_commit, dirty_tree, code_hash, suite_hash, total, failed)
      VALUES ($1, 'spec', '2025-02-01T00:00:00Z', 'actual-commit', true, 'code-hash', 'suite-hash', 1, 1)
    `, [currentRun]);
    await insertAudit(currentRun, 'hash:modern-case', '2025-02-01T00:00:01Z', false);
    const [mixedSummary, mixedFailures] = await database.exec(report);
    assert.deepEqual(mixedSummary.rows.map(row => row.run_id), [currentRun, legacyRun]);
    assert.equal(mixedSummary.rows[0].source_commit, 'actual-commit');
    assert.equal(mixedSummary.rows[0].dirty_tree, true);
    assert.equal(mixedSummary.rows[0].integrity, 'complete');
    assert.deepEqual(mixedFailures.rows.map(row => row.case_id), ['modern-case']);
  } finally {
    await database.close();
  }
});

test('Tiger report distinguishes an incomplete run from a complete or inconsistent run', async () => {
  const database = new PGlite();
  const run = '33333333-3333-4333-8333-333333333333';
  try {
    await database.exec(schema.split("SELECT create_hypertable(")[0]);
    await database.exec(`
      INSERT INTO underwriting_eval.specifications (id, source_commit, content_hash, definition)
      VALUES ('spec', 'commit', 'hash', '{}');
      INSERT INTO underwriting_eval.test_cases VALUES
        ('case-a', 'spec', '{}', '{}'), ('case-b', 'spec', '{}', '{}');
    `);
    await database.query(`
      INSERT INTO underwriting_eval.evaluation_runs
        (run_id, specification_id, source_commit, dirty_tree, code_hash, suite_hash, total, failed)
      VALUES ($1, 'spec', 'commit', false, 'code-hash', 'suite-hash', 2, 1)
    `, [run]);
    const insert = (id, timestamp, passed) => database.query(`
      INSERT INTO underwriting_eval.pre_underwriting_audit_log
        (run_id, test_case_id, evaluated_at, passed, specification_id,
         input_profile, matched_rules, outcome, expected)
      VALUES ($1, $2, $3, $4, 'spec', '{}', '[]', '{}', '{}')
    `, [run, id, timestamp, passed]);
    const summary = async () => {
      const [result] = await database.exec(report);
      const { total, passed, failed, expected_total, integrity } = result.rows[0];
      return { total: Number(total), passed: Number(passed), failed: Number(failed), expected_total, integrity };
    };
    assert.deepEqual(await summary(), { total: 0, passed: 0, failed: 0, expected_total: 2, integrity: 'incomplete' });
    await insert('case-a', '2025-03-01T00:00:00Z', true);
    assert.deepEqual(await summary(), { total: 1, passed: 1, failed: 0, expected_total: 2, integrity: 'incomplete' });
    await insert('case-b', '2025-03-01T00:00:01Z', false);
    assert.deepEqual(await summary(), { total: 2, passed: 1, failed: 1, expected_total: 2, integrity: 'complete' });
    await insert('case-a', '2025-03-01T00:00:02Z', true);
    assert.deepEqual(await summary(), { total: 3, passed: 2, failed: 1, expected_total: 2, integrity: 'mismatch' });
  } finally {
    await database.close();
  }
});
