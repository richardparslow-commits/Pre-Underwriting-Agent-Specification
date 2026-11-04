-- User authorization is separate from operational source validation.
CREATE TABLE IF NOT EXISTS carrier_retrieval.private_import_approvals (
 source_id text PRIMARY KEY REFERENCES carrier_retrieval.sources(id),
 approved_by text NOT NULL, approved_at timestamptz NOT NULL DEFAULT now(),
 states text[] NOT NULL CHECK(states=ARRAY['TX']::text[]),
 authorization_evidence text NOT NULL, rights_evidence text NOT NULL,
 original_pdf_sha256 text NOT NULL CHECK(original_pdf_sha256 ~ '^[0-9a-f]{64}$'),
 extraction_sha256 text NOT NULL CHECK(extraction_sha256 ~ '^[0-9a-f]{64}$'),
 intended_use text NOT NULL CHECK(intended_use='private_producer_reference'),
 validation_status text NOT NULL DEFAULT 'pending_metadata_and_visual_review'
);
CREATE TABLE IF NOT EXISTS carrier_retrieval.reference_pages (
 source_id text NOT NULL REFERENCES carrier_retrieval.private_import_approvals(source_id),
 pdf_page integer NOT NULL CHECK(pdf_page>0), printed_page text,
 content text NOT NULL, PRIMARY KEY(source_id,pdf_page)
);
CREATE INDEX IF NOT EXISTS reference_pages_bm25 ON carrier_retrieval.reference_pages USING bm25(content) WITH(text_config='english');
CREATE OR REPLACE FUNCTION carrier_retrieval.search_private_reference(p_query text,p_source_id text,p_state text DEFAULT 'TX',p_limit integer DEFAULT 5)
RETURNS TABLE(title text,edition text,source_url text,pdf_page integer,printed_page text,excerpt text,validation_status text,restriction text)
LANGUAGE plpgsql STABLE SET search_path=carrier_retrieval,public AS $$
BEGIN
 IF p_state IS DISTINCT FROM 'TX' THEN RAISE EXCEPTION 'Private reference import is authorized for Texas only'; END IF;
 IF p_query IS NULL OR trim(p_query)='' OR p_source_id IS NULL OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Query, exact source ID and limit 1..20 required'; END IF;
 RETURN QUERY SELECT s.title,s.edition,s.source_url,r.pdf_page,r.printed_page,left(r.content,2000),a.validation_status,
 'Private producer reference only; carrier currentness, effective dates, exact product/state applicability and extracted tables not yet verified'::text
 FROM carrier_retrieval.reference_pages r JOIN carrier_retrieval.private_import_approvals a ON a.source_id=r.source_id
 JOIN carrier_retrieval.sources s ON s.id=r.source_id
 WHERE r.source_id=p_source_id AND p_state=ANY(a.states)
 AND r.content <@> to_bm25query(p_query,'carrier_retrieval.reference_pages_bm25') < 0
 ORDER BY r.content <@> to_bm25query(p_query,'carrier_retrieval.reference_pages_bm25'),r.pdf_page LIMIT p_limit;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA carrier_retrieval FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION carrier_retrieval.search_private_reference(text,text,text,integer) FROM PUBLIC;
