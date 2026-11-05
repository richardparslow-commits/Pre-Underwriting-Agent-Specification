-- Recent application runs, including failed and uncommitted revisions.
SELECT run_id, created_at, source_commit, dirty_tree, code_hash, suite_hash,
       total, total-failed AS passed, failed
FROM underwriting_eval.evaluation_runs
ORDER BY created_at DESC, run_id DESC LIMIT 10;

-- Inspect actual versus expected results for the newest run's failures.
SELECT split_part(test_case_id, ':', 2) AS case_id,
       matched_rules AS category, input_profile, outcome, expected
FROM underwriting_eval.pre_underwriting_audit_log
WHERE run_id = (SELECT run_id FROM underwriting_eval.evaluation_runs
                ORDER BY created_at DESC, run_id DESC LIMIT 1)
  AND NOT passed
ORDER BY test_case_id;
