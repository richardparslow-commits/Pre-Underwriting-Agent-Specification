CREATE SCHEMA IF NOT EXISTS underwriting_eval;
CREATE TABLE IF NOT EXISTS underwriting_eval.specifications (
 id text PRIMARY KEY, source_commit text NOT NULL, content_hash text NOT NULL, definition jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS underwriting_eval.carrier_rules (
 id text PRIMARY KEY, carrier text NOT NULL, jurisdiction text NOT NULL,
 effective_from date NOT NULL, effective_until date, source_url text NOT NULL,
 specification_id text NOT NULL REFERENCES underwriting_eval.specifications(id),
 rule jsonb NOT NULL, approved boolean NOT NULL DEFAULT false,
 CHECK(effective_until IS NULL OR effective_until > effective_from)
);
CREATE TABLE IF NOT EXISTS underwriting_eval.test_cases (
 id text PRIMARY KEY, specification_id text NOT NULL REFERENCES underwriting_eval.specifications(id),
 synthetic_input jsonb NOT NULL, expected jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS underwriting_eval.evaluation_runs (
 run_id uuid PRIMARY KEY,
 specification_id text NOT NULL REFERENCES underwriting_eval.specifications(id),
 source_commit text NOT NULL, dirty_tree boolean NOT NULL,
 code_hash text NOT NULL, suite_hash text NOT NULL,
 total integer NOT NULL CHECK (total > 0), failed integer NOT NULL CHECK (failed BETWEEN 0 AND total),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS underwriting_eval.pre_underwriting_audit_log (
 evaluated_at timestamptz NOT NULL DEFAULT now(), run_id uuid NOT NULL,
 test_case_id text NOT NULL REFERENCES underwriting_eval.test_cases(id),
 specification_id text NOT NULL REFERENCES underwriting_eval.specifications(id),
 input_profile jsonb NOT NULL, matched_rules jsonb NOT NULL, outcome jsonb NOT NULL,
 expected jsonb NOT NULL, passed boolean NOT NULL, health_class text CHECK(health_class IS NULL),
 PRIMARY KEY(evaluated_at, run_id, test_case_id)
);
SELECT create_hypertable('underwriting_eval.pre_underwriting_audit_log', 'evaluated_at', if_not_exists => true);
-- Historical audits predate run headers. Enforce the link on new writes
-- while preserving those existing rows and their original metadata.
DO $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_constraint
   WHERE conrelid = 'underwriting_eval.pre_underwriting_audit_log'::regclass
     AND conname = 'audit_run_header_fk'
 ) THEN
   ALTER TABLE underwriting_eval.pre_underwriting_audit_log
     ADD CONSTRAINT audit_run_header_fk FOREIGN KEY (run_id)
     REFERENCES underwriting_eval.evaluation_runs(run_id) NOT VALID;
 END IF;
END $$;
-- Keep historical mismatches readable, but require new results to use the
-- same specification as both their run header and their test case.
CREATE UNIQUE INDEX IF NOT EXISTS evaluation_runs_specification_key
ON underwriting_eval.evaluation_runs (run_id, specification_id);
CREATE UNIQUE INDEX IF NOT EXISTS test_cases_specification_key
ON underwriting_eval.test_cases (id, specification_id);
DO $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_constraint
   WHERE conrelid = 'underwriting_eval.pre_underwriting_audit_log'::regclass
     AND conname = 'audit_run_specification_fk'
 ) THEN
   ALTER TABLE underwriting_eval.pre_underwriting_audit_log
     ADD CONSTRAINT audit_run_specification_fk FOREIGN KEY (run_id, specification_id)
     REFERENCES underwriting_eval.evaluation_runs(run_id, specification_id) NOT VALID;
 END IF;
 IF NOT EXISTS (
   SELECT 1 FROM pg_constraint
   WHERE conrelid = 'underwriting_eval.pre_underwriting_audit_log'::regclass
     AND conname = 'audit_case_specification_fk'
 ) THEN
   ALTER TABLE underwriting_eval.pre_underwriting_audit_log
     ADD CONSTRAINT audit_case_specification_fk FOREIGN KEY (test_case_id, specification_id)
     REFERENCES underwriting_eval.test_cases(id, specification_id) NOT VALID;
 END IF;
END $$;
CREATE OR REPLACE FUNCTION underwriting_eval.reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Evaluation history and specifications are append-only'; END $$;

-- The hypertable key includes time. Claim the logical run/case key separately
-- in the same transaction as each new result.
CREATE OR REPLACE FUNCTION underwriting_eval.claim_audit_result_key() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
BEGIN
 INSERT INTO underwriting_eval.audit_result_keys (run_id, test_case_id)
 VALUES (NEW.run_id, NEW.test_case_id);
 RETURN NEW;
END $$;

DO $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_trigger
   WHERE tgrelid = 'underwriting_eval.pre_underwriting_audit_log'::regclass
     AND tgname = 'audit_claim_result_key'
 ) THEN
   -- Block inserts between seeding existing keys and installing the trigger.
   LOCK TABLE underwriting_eval.pre_underwriting_audit_log IN SHARE ROW EXCLUSIVE MODE;
   CREATE TABLE IF NOT EXISTS underwriting_eval.audit_result_keys (
     run_id uuid NOT NULL,
     test_case_id text NOT NULL,
     PRIMARY KEY (run_id, test_case_id)
   );
   INSERT INTO underwriting_eval.audit_result_keys (run_id, test_case_id)
   SELECT DISTINCT run_id, test_case_id FROM underwriting_eval.pre_underwriting_audit_log
   ON CONFLICT DO NOTHING;

   CREATE OR REPLACE TRIGGER audit_keys_append_only
     BEFORE UPDATE OR DELETE ON underwriting_eval.audit_result_keys
     FOR EACH ROW EXECUTE FUNCTION underwriting_eval.reject_mutation();
   CREATE OR REPLACE TRIGGER audit_keys_no_truncate
     BEFORE TRUNCATE ON underwriting_eval.audit_result_keys
     FOR EACH STATEMENT EXECUTE FUNCTION underwriting_eval.reject_mutation();
   CREATE OR REPLACE TRIGGER audit_claim_result_key
     AFTER INSERT ON underwriting_eval.pre_underwriting_audit_log
     FOR EACH ROW EXECUTE FUNCTION underwriting_eval.claim_audit_result_key();
 END IF;
END $$;
REVOKE EXECUTE ON FUNCTION underwriting_eval.claim_audit_result_key() FROM PUBLIC;

DROP TRIGGER IF EXISTS audit_append_only ON underwriting_eval.pre_underwriting_audit_log;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON underwriting_eval.pre_underwriting_audit_log
FOR EACH ROW EXECUTE FUNCTION underwriting_eval.reject_mutation();
DROP TRIGGER IF EXISTS spec_append_only ON underwriting_eval.specifications;
CREATE TRIGGER spec_append_only BEFORE UPDATE OR DELETE ON underwriting_eval.specifications
FOR EACH ROW EXECUTE FUNCTION underwriting_eval.reject_mutation();
DROP TRIGGER IF EXISTS run_append_only ON underwriting_eval.evaluation_runs;
CREATE TRIGGER run_append_only BEFORE UPDATE OR DELETE ON underwriting_eval.evaluation_runs
FOR EACH ROW EXECUTE FUNCTION underwriting_eval.reject_mutation();
DROP TRIGGER IF EXISTS run_no_truncate ON underwriting_eval.evaluation_runs;
CREATE TRIGGER run_no_truncate BEFORE TRUNCATE ON underwriting_eval.evaluation_runs
FOR EACH STATEMENT EXECUTE FUNCTION underwriting_eval.reject_mutation();
REVOKE ALL ON SCHEMA underwriting_eval FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA underwriting_eval FROM PUBLIC;

DROP TRIGGER IF EXISTS audit_no_truncate ON underwriting_eval.pre_underwriting_audit_log;
CREATE TRIGGER audit_no_truncate BEFORE TRUNCATE ON underwriting_eval.pre_underwriting_audit_log FOR EACH STATEMENT EXECUTE FUNCTION underwriting_eval.reject_mutation();

-- Retrieval capabilities; documents must be source-backed before ingestion.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS vectorscale CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_textsearch;
CREATE TABLE IF NOT EXISTS underwriting_eval.carrier_guide_chunks (
 id text PRIMARY KEY, carrier text NOT NULL, jurisdiction text NOT NULL,
 guide_version text NOT NULL, effective_from date NOT NULL, effective_until date,
 source_url text NOT NULL, source_page integer CHECK(source_page > 0),
 content text NOT NULL, content_sha256 text NOT NULL,
 embedding_model text, embedding vector,
 CHECK (effective_until IS NULL OR effective_until > effective_from),
 CHECK ((embedding IS NULL) = (embedding_model IS NULL))
);
CREATE INDEX IF NOT EXISTS carrier_guide_scope ON underwriting_eval.carrier_guide_chunks
(carrier,jurisdiction,effective_from);
REVOKE ALL ON underwriting_eval.carrier_guide_chunks FROM PUBLIC;
