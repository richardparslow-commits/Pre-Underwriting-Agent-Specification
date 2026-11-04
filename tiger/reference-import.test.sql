BEGIN;
INSERT INTO carrier_retrieval.sources(id,title,source_url) VALUES('reference-test','Synthetic reference','https://example.invalid/test');
INSERT INTO carrier_retrieval.private_import_approvals(source_id,approved_by,states,authorization_evidence,rights_evidence,original_pdf_sha256,extraction_sha256,intended_use) VALUES('reference-test','synthetic',ARRAY['TX'],'synthetic','synthetic',repeat('b',64),repeat('c',64),'private_producer_reference');
INSERT INTO carrier_retrieval.reference_pages VALUES('reference-test',2,'1','Synthetic reference diabetes evidence');
DO $$ BEGIN
 IF (SELECT count(*) FROM carrier_retrieval.search_private_reference('diabetes','reference-test','TX',5))<>1 THEN RAISE EXCEPTION 'Reference retrieval failed'; END IF;
 IF (SELECT pdf_page FROM carrier_retrieval.search_private_reference('diabetes','reference-test','TX',5))<>2 THEN RAISE EXCEPTION 'PDF citation failed'; END IF;
 IF EXISTS(SELECT 1 FROM carrier_retrieval.search_private_reference('diabetes','different-source','TX',5)) THEN RAISE EXCEPTION 'Source isolation failed'; END IF;
 BEGIN
 PERFORM * FROM carrier_retrieval.search_private_reference('diabetes','reference-test','CA',5);
 RAISE EXCEPTION 'Texas restriction failed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Private reference import is authorized for Texas only' THEN RAISE; END IF; END;
 IF EXISTS(SELECT 1 FROM carrier_retrieval.search('diabetes','synthetic','synthetic','TX')) THEN RAISE EXCEPTION 'Reference leaked into operational search'; END IF;
END $$;
SELECT 'PASS: reference search, PDF citations, source isolation, Texas restriction, operational exclusion' AS result;
ROLLBACK;
