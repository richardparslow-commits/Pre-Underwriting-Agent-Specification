-- Producer-facing retrieval only. No production intake or eligibility integration.
CREATE SCHEMA IF NOT EXISTS carrier_retrieval;
CREATE TABLE IF NOT EXISTS carrier_retrieval.sources (
 id text PRIMARY KEY, title text NOT NULL, source_url text NOT NULL,
 carrier text, product text, edition text, states text[],
 effective_from date, effective_until date, review_due date,
 content_sha256 text, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','retired')),
 approved_by text, approval_evidence text, rights_evidence text,
 notes text NOT NULL DEFAULT '',
 CHECK(effective_until IS NULL OR effective_until > effective_from),
 CHECK(status <> 'approved' OR (
 carrier IS NOT NULL AND product IS NOT NULL AND edition IS NOT NULL AND
 cardinality(states)>0 AND effective_from IS NOT NULL AND review_due IS NOT NULL AND
 review_due >= effective_from AND content_sha256 ~ '^[0-9a-f]{64}$' AND
 length(trim(approved_by))>0 AND length(trim(approval_evidence))>0 AND length(trim(rights_evidence))>0
 AND approved_by IS NOT NULL AND approval_evidence IS NOT NULL AND rights_evidence IS NOT NULL
 AND states IS NOT NULL AND content_sha256 IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS carrier_retrieval.chunks (
 id text PRIMARY KEY, source_id text NOT NULL REFERENCES carrier_retrieval.sources(id),
 page integer NOT NULL CHECK(page>0), section text NOT NULL,
 content text NOT NULL CHECK(length(trim(content))>0),
 embedding vector, embedding_model text,
 CHECK((embedding IS NULL)=(embedding_model IS NULL))
);
CREATE INDEX IF NOT EXISTS guide_bm25 ON carrier_retrieval.chunks USING bm25(content) WITH(text_config='english');
CREATE OR REPLACE FUNCTION carrier_retrieval.require_approved_source() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM carrier_retrieval.sources WHERE id=NEW.source_id AND status='approved' AND review_due>=CURRENT_DATE) THEN
 RAISE EXCEPTION 'Guide import requires approved, current source metadata'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS approved_import ON carrier_retrieval.chunks;
CREATE TRIGGER approved_import BEFORE INSERT OR UPDATE ON carrier_retrieval.chunks FOR EACH ROW EXECUTE FUNCTION carrier_retrieval.require_approved_source();
CREATE OR REPLACE FUNCTION carrier_retrieval.search(
 p_query text,p_carrier text,p_product text,p_state text,p_date date DEFAULT CURRENT_DATE,
 p_limit integer DEFAULT 10,p_embedding vector DEFAULT NULL,p_model text DEFAULT NULL
) RETURNS TABLE(chunk_id text,source_id text,title text,edition text,source_url text,page integer,section text,excerpt text,score double precision)
LANGUAGE plpgsql STABLE SET search_path=carrier_retrieval,public AS $$
BEGIN
 IF nullif(trim(p_query),'') IS NULL OR nullif(trim(p_carrier),'') IS NULL OR nullif(trim(p_product),'') IS NULL OR p_state !~ '^[A-Z]{2}$' OR p_state IS NULL OR p_date IS NULL OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN
 RAISE EXCEPTION 'Query, carrier, product, two-letter state, as-of date and limit 1..50 are required'; END IF;
 IF (p_embedding IS NULL) <> (p_model IS NULL) THEN RAISE EXCEPTION 'Embedding and model must be supplied together'; END IF;
 RETURN QUERY
 WITH eligible AS MATERIALIZED (
 SELECT c.*,s.title,s.edition,s.source_url FROM carrier_retrieval.chunks c JOIN carrier_retrieval.sources s ON s.id=c.source_id
 WHERE s.status='approved' AND s.review_due>=CURRENT_DATE AND s.carrier=p_carrier AND s.product=p_product
 AND p_state=ANY(s.states) AND s.effective_from<=p_date AND (s.effective_until IS NULL OR p_date<s.effective_until)
 ), lexical AS (
 SELECT e.id,row_number() OVER(ORDER BY e.content <@> to_bm25query(p_query,'carrier_retrieval.guide_bm25'),e.id) AS rank
 FROM eligible e WHERE e.content <@> to_bm25query(p_query,'carrier_retrieval.guide_bm25') < 0
 ), semantic AS (
 SELECT e.id,row_number() OVER(ORDER BY e.embedding <=> p_embedding,e.id) AS rank
 FROM eligible e WHERE p_embedding IS NOT NULL AND e.embedding_model=p_model AND vector_dims(e.embedding)=vector_dims(p_embedding)
 ), fused AS (
 SELECT l.id,1.0/(60+l.rank) AS value FROM lexical l
 UNION ALL SELECT v.id,1.0/(60+v.rank) FROM semantic v
 ), ranked AS (SELECT f.id,sum(f.value)::double precision AS value FROM fused f GROUP BY f.id)
 SELECT e.id,e.source_id,e.title,e.edition,e.source_url,e.page,e.section,left(e.content,1600),r.value
 FROM ranked r JOIN eligible e ON e.id=r.id ORDER BY r.value DESC,e.id LIMIT p_limit;
END $$;
REVOKE ALL ON SCHEMA carrier_retrieval FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA carrier_retrieval FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA carrier_retrieval FROM PUBLIC;
