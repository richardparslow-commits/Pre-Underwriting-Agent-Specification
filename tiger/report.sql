-- Older runs have audit rows but no header. Use their first audit timestamp
-- and stored outcomes, and leave unavailable runner metadata null.
WITH recent_runs AS (
  SELECT run_id, created_at, source_commit, dirty_tree, code_hash, suite_hash,
         total, total-failed AS passed, failed
  FROM underwriting_eval.evaluation_runs
  UNION ALL
  SELECT audit.run_id, min(audit.evaluated_at), NULL, NULL, NULL, NULL,
         count(*), count(*) FILTER (WHERE audit.passed),
         count(*) FILTER (WHERE NOT audit.passed)
  FROM underwriting_eval.pre_underwriting_audit_log audit
  WHERE NOT EXISTS (
    SELECT 1 FROM underwriting_eval.evaluation_runs header
    WHERE header.run_id = audit.run_id
  )
  GROUP BY audit.run_id
)
SELECT * FROM recent_runs
ORDER BY created_at DESC, run_id DESC LIMIT 10;

-- Inspect actual versus expected results for the newest run's failures.
WITH run_dates AS (
  SELECT run_id, created_at FROM underwriting_eval.evaluation_runs
  UNION ALL
  SELECT audit.run_id, min(audit.evaluated_at)
  FROM underwriting_eval.pre_underwriting_audit_log audit
  WHERE NOT EXISTS (
    SELECT 1 FROM underwriting_eval.evaluation_runs header
    WHERE header.run_id = audit.run_id
  )
  GROUP BY audit.run_id
)
SELECT CASE WHEN strpos(test_case_id, ':') > 0 THEN split_part(test_case_id, ':', 2)
            ELSE test_case_id END AS case_id,
       matched_rules AS category, input_profile, outcome, expected
FROM underwriting_eval.pre_underwriting_audit_log
WHERE run_id = (SELECT run_id FROM run_dates ORDER BY created_at DESC, run_id DESC LIMIT 1)
  AND NOT passed
ORDER BY test_case_id;
