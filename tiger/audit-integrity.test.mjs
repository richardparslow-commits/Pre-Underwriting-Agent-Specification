import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const initialTables = schema.split('SELECT create_hypertable(')[0];
const upgrade = schema.split('-- Retrieval capabilities')[0]
  .replace(/^SELECT create_hypertable\(.*\);$/m, '');

test('schema replay preserves legacy audits and prevents orphan, cross-specification, and duplicate results', async () => {
  const database = new PGlite();
  const legacyRun = '11111111-1111-4111-8111-111111111111';
  const currentRun = '22222222-2222-4222-8222-222222222222';
  const insertAudit = (runId, timestamp, caseId = 'test-case', spec = 'spec') => database.query(`
    INSERT INTO underwriting_eval.pre_underwriting_audit_log
      (run_id, test_case_id, evaluated_at, passed, specification_id,
       input_profile, matched_rules, outcome, expected)
    VALUES ($1, $3, $2, false, $4, '{}', '[]', '{}', '{}')
  `, [runId, timestamp, caseId, spec]);

  try {
    await database.exec(initialTables);
    await database.exec(`
      INSERT INTO underwriting_eval.specifications (id, source_commit, content_hash, definition)
      VALUES ('spec', 'spec-commit', 'spec-hash', '{}'),
             ('other-spec', 'other-commit', 'other-hash', '{}');
      INSERT INTO underwriting_eval.test_cases VALUES
        ('test-case', 'spec', '{}', '{}'), ('other-case', 'other-spec', '{}', '{}');
    `);
    await insertAudit(legacyRun, '2025-01-01T00:00:00Z');
    await insertAudit(legacyRun, '2025-01-02T00:00:00Z');
    await database.exec(upgrade);
    await database.exec(upgrade);

    const legacyKeys = await database.query('SELECT run_id FROM underwriting_eval.audit_result_keys');
    assert.deepEqual(legacyKeys.rows, [{ run_id: legacyRun }]);
    await assert.rejects(insertAudit(legacyRun, '2025-01-03T00:00:00Z'),
      { code: '23503', constraint: 'audit_run_header_fk' });
    await assert.rejects(insertAudit(currentRun, '2026-01-01T00:00:00Z'),
      { code: '23503', constraint: 'audit_run_header_fk' });

    await database.transaction(async transaction => {
      await transaction.query(`
        INSERT INTO underwriting_eval.evaluation_runs
          (run_id, specification_id, source_commit, dirty_tree, code_hash, suite_hash, total, failed)
        VALUES ($1, 'spec', 'commit', false, 'code-hash', 'suite-hash', 1, 1)
      `, [currentRun]);
      await transaction.query(`
        INSERT INTO underwriting_eval.pre_underwriting_audit_log
          (run_id, test_case_id, passed, specification_id, input_profile,
           matched_rules, outcome, expected)
        VALUES ($1, 'test-case', false, 'spec', '{}', '[]', '{}', '{}')
      `, [currentRun]);
    });
    await assert.rejects(insertAudit(currentRun, '2026-01-02T00:00:00Z'),
      { code: '23505', constraint: 'audit_result_keys_pkey' });
    await assert.rejects(insertAudit(currentRun, '2026-01-03T00:00:00Z', 'other-case', 'other-spec'),
      { code: '23503', constraint: 'audit_run_specification_fk' });
    await assert.rejects(insertAudit(currentRun, '2026-01-03T00:00:00Z', 'other-case'),
      { code: '23503', constraint: 'audit_case_specification_fk' });
    await assert.rejects(database.exec(`
      UPDATE underwriting_eval.test_cases SET specification_id = 'other-spec' WHERE id = 'test-case'
    `), { code: '23503', constraint: 'audit_case_specification_fk' });
    const { rows } = await database.query(`
      SELECT run_id, passed FROM underwriting_eval.pre_underwriting_audit_log ORDER BY run_id
    `);
    assert.deepEqual(rows, [
      { run_id: legacyRun, passed: false },
      { run_id: legacyRun, passed: false },
      { run_id: currentRun, passed: false },
    ]);
  } finally {
    await database.close();
  }
});
