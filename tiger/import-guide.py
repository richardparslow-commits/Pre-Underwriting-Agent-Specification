"""Import reviewed, page-preserving JSON; never grants approval or generates embeddings."""
import argparse,hashlib,json,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('manifest');p.add_argument('--service',required=True);a=p.parse_args()
d=json.loads(Path(a.manifest).read_text()); pages=d['pages']; source=d['source_id']
assert isinstance(pages,list) and pages
assert all(isinstance(x,dict) and isinstance(x['page'],int) and x['page']>0 and isinstance(x['content'],str) and x['content'].strip() for x in pages)
payload=json.dumps(pages,ensure_ascii=False,sort_keys=True,separators=(',',':'))
h=hashlib.sha256(payload.encode()).hexdigest()
def q(s):return "'"+str(s).replace("'","''")+"'"
# The reviewer approves this exact extraction hash, not a filename or inferred date.
sql=f"SELECT 1 / CASE WHEN EXISTS(SELECT 1 FROM carrier_retrieval.sources WHERE id={q(source)} AND content_sha256={q(h)} AND status='approved' AND review_due>=CURRENT_DATE) THEN 1 ELSE 0 END AS approval_hash_verified;\n"
for i,x in enumerate(pages):
 sql+=f"INSERT INTO carrier_retrieval.chunks(id,source_id,page,section,content) VALUES({q(source+':'+h+':'+str(i))},{q(source)},{x['page']},{q(x.get('section',''))},{q(x['content'])}) ON CONFLICT(id) DO NOTHING;\n"
subprocess.run(['tiger','db','query',a.service],input=sql,text=True,check=True)
print('Imported reviewed extraction:',h)
