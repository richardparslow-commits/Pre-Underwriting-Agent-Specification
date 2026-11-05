-- Older runs have audit rows but no header. Use their first audit timestamp
-- and stored outcomes, and leave unavailable runner metadata null.
WITH recent_headers AS (
  SELECT *
  FROM underwriting_eval.evaluation_runs
  ORDER BY created_at DESC, run_id DESC LIMIT 10
), stored AS (
  SELECT audit.run_id, count(*) AS total,
         count(DISTINCT audit.test_case_id) AS distinct_cases,
         count(*) FILTER (WHERE NOT audit.passed) AS failed,
         bool_or(audit.specification_id IS DISTINCT FROM header.specification_id
                 OR audit.specification_id IS DISTINCT FROM fixture.specification_id) AS wrong_specification
  FROM underwriting_eval.pre_underwriting_audit_log audit
  JOIN recent_headers header USING (run_id)
  LEFT JOIN underwriting_eval.test_cases fixture ON fixture.id = audit.test_case_id
  GROUP BY audit.run_id
), recent_runs AS (
  SELECT header.run_id, header.created_at, header.source_commit, header.dirty_tree,
         header.code_hash, header.suite_hash, coalesce(stored.total, 0) AS total,
         coalesce(stored.total - stored.failed, 0) AS passed,
         coalesce(stored.failed, 0) AS failed, header.total AS expected_total,
         CASE
           WHEN stored.wrong_specification OR stored.total <> stored.distinct_cases OR stored.total > header.total
                OR stored.failed > header.failed THEN 'mismatch'
           WHEN coalesce(stored.total, 0) < header.total THEN 'incomplete'
           WHEN stored.failed <> header.failed THEN 'mismatch'
           ELSE 'complete'
         END AS integrity
  FROM recent_headers header
  LEFT JOIN stored USING (run_id)
  UNION ALL
  SELECT audit.run_id, min(audit.evaluated_at), NULL, NULL, NULL, NULL,
         count(*), count(*) FILTER (WHERE audit.passed),
         count(*) FILTER (WHERE NOT audit.passed), NULL, 'legacy'
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
