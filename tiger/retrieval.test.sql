BEGIN;
INSERT INTO carrier_retrieval.sources(id,title,source_url,carrier,product,edition,states,effective_from,review_due,content_sha256,status,approved_by,approval_evidence,rights_evidence)
VALUES ('synthetic-approved','Synthetic guide','https://example.invalid/synthetic','Test Carrier','Term','test-v1',ARRAY['TX'],'2020-01-01',CURRENT_DATE+1,repeat('a',64),'approved','test','synthetic test only','synthetic test only');
INSERT INTO carrier_retrieval.sources(id,title,source_url) VALUES ('synthetic-pending','Pending','https://example.invalid/pending');
INSERT INTO carrier_retrieval.chunks VALUES('synthetic-chunk','synthetic-approved',3,'Synthetic heading','Synthetic diabetes reference only','[1,0,0]','synthetic-model');
DO $$ BEGIN
 IF (SELECT page FROM carrier_retrieval.search('diabetes','Test Carrier','Term','TX'))<>3 THEN RAISE EXCEPTION 'Citation page missing'; END IF;
 IF (SELECT count(*) FROM carrier_retrieval.search('diabetes','Test Carrier','Term','TX'))<>1 THEN RAISE EXCEPTION 'Keyword retrieval failed'; END IF;
 IF (SELECT count(*) FROM carrier_retrieval.search('diabetes','Wrong Carrier','Term','TX'))<>0 THEN RAISE EXCEPTION 'Carrier isolation failed'; END IF;
 IF (SELECT count(*) FROM carrier_retrieval.search('diabetes','Test Carrier','Wrong Product','TX'))<>0 THEN RAISE EXCEPTION 'Product isolation failed'; END IF;
 IF (SELECT count(*) FROM carrier_retrieval.search('diabetes','Test Carrier','Term','CA'))<>0 THEN RAISE EXCEPTION 'State isolation failed'; END IF;
 IF (SELECT count(*) FROM carrier_retrieval.search('diabetes','Test Carrier','Term','TX','2019-01-01'))<>0 THEN RAISE EXCEPTION 'Effective date isolation failed'; END IF;
 IF (SELECT count(*) FROM carrier_retrieval.search('unrelated','Test Carrier','Term','TX',CURRENT_DATE,10,'[1,0,0]','synthetic-model'))<>1 THEN RAISE EXCEPTION 'Semantic retrieval failed'; END IF;
 IF (SELECT count(*) FROM carrier_retrieval.search('unrelated','Test Carrier','Term','TX',CURRENT_DATE,10,'[1,0,0]','wrong-model'))<>0 THEN RAISE EXCEPTION 'Model isolation failed'; END IF;
 BEGIN
 INSERT INTO carrier_retrieval.chunks(id,source_id,page,section,content) VALUES('blocked','synthetic-pending',1,'x','unapproved content');
 RAISE EXCEPTION 'Import approval gate failed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Guide import requires approved, current source metadata' THEN RAISE; END IF; END;
END $$;
UPDATE carrier_retrieval.sources SET status='retired' WHERE id='synthetic-approved';
DO $$ BEGIN IF EXISTS(SELECT 1 FROM carrier_retrieval.search('diabetes','Test Carrier','Term','TX')) THEN RAISE EXCEPTION 'Retired source visible'; END IF; END $$;
SELECT 'PASS: keyword, semantic, carrier, product, state, date, model, pending import, retired exclusion' AS result;
ROLLBACK;
