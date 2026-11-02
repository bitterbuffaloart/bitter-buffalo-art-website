"""Read-back verification; no production mutation, mail or account changes."""
from pathlib import Path
import json,urllib.request,urllib.error,hashlib,re,concurrent.futures,time,sys
root=Path(__file__).resolve().parents[2]/'.site-build/public'
base=sys.argv[1].rstrip('/');out=Path(sys.argv[2])
CF_BEACON=re.compile(rb'<script\b[^>]*\bsrc="https://static\.cloudflareinsights\.com/beacon\.min\.js/[^"<>]+"[^>]*\bdata-cf-beacon=[^>]*></script>')
SCRIPT=re.compile(rb'<script>\(function\(\)\{function c\(\)\{var b=a\.contentDocument.*?</script>',re.S)
def normalize(body,suffix):
 count={'cloudflare_beacon':0,'cloudflare_jsd':0,'cloudflare_email_links':0,'cloudflare_email_decoder':0}
 if suffix in ['.html','.css','.js','.svg','.txt','.xml','.json']:
  body=body.replace(b'\r\n',b'\n')
 if suffix=='.html':
  def email(m):
   def decode(s):
    data=bytes.fromhex(s.decode());return bytes(x^data[0] for x in data[1:])
   href=decode(m[1]);text=decode(m[2])
   if href!=text or b'@' not in href:raise ValueError('Unexpected Cloudflare email rewrite')
   count['cloudflare_email_links']+=1
   return b'<a href="mailto:'+href+b'">'+text+b'</a>'
  body=re.sub(rb'<a href="/cdn-cgi/l/email-protection#([a-f0-9]+)"><span class="__cf_email__" data-cfemail="([a-f0-9]+)">\[email&#160;protected\]</span></a>',email,body)
  body,n=re.subn(rb'<script data-cfasync="false" src="/cdn-cgi/scripts/[a-f0-9]+/cloudflare-static/email-decode\.min\.js"></script>',b'',body);count['cloudflare_email_decoder']=n
  body,n=CF_BEACON.subn(b'',body);count['cloudflare_beacon']=n
  def remove(m):
   s=m.group()
   if b'window.__CF$cv$params' in s and b'/cdn-cgi/challenge-platform/scripts/jsd/main.js' in s and b'a.style.visibility=\'hidden\'' in s:
    count['cloudflare_jsd']+=1;return b''
   return s
  body=SCRIPT.sub(remove,body)
  body=re.sub(rb'\n[ \t]*\n',b'\n',body)
 return body,count
def verify(file):
 rel=file.relative_to(root).as_posix();route=rel[:-10] if rel.endswith('index.html') else rel
 target=base+'/'+route;err=None
 expected=file.read_bytes();ex,_=normalize(expected,file.suffix)
 for attempt in range(4):
  try:
   req=urllib.request.Request(target,headers={'User-Agent':'BitterBuffalo-QA/2.0'})
   with urllib.request.urlopen(req,timeout=40) as r:body=r.read();status=r.status
   actual,removed=normalize(body,file.suffix)
   same=hashlib.sha256(actual).digest()==hashlib.sha256(ex).digest()
   return dict(path=rel,status=status,bytes=len(body),source_sha256=hashlib.sha256(expected).hexdigest(),readback_sha256=hashlib.sha256(body).hexdigest(),normalized_match=same,edge_injections_removed=removed,attempts=attempt+1)
  except Exception as e:
   err=str(e)
   if attempt<3:time.sleep(.3*(attempt+1))
 return dict(path=rel,error=err,normalized_match=False,attempts=4)
files=sorted(p for p in root.rglob('*') if p.is_file() and not p.name.startswith('_'))
retry='--retry-failed' in sys.argv
if retry:
 previous=json.loads(out.read_text());old={r['path']:r for r in previous['rows']}
 Path(str(out)+'.initial-failure.json').write_text(json.dumps(previous,indent=2)+'\n')
 files=[root/r['path'] for r in previous['failed']]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:new_rows=list(pool.map(verify,files))
if retry:
 old.update({r['path']:r for r in new_rows});rows=[old[k] for k in sorted(old)]
else:rows=new_rows
failed=[r for r in rows if not r['normalized_match']]
result=dict(base=base,source_commit='9d8cd7eb672dde7ef1a492ab7913f5388b78f8b6',files=len(rows),matched=len(rows)-len(failed),failed=failed,rows=rows,normalization='Text CRLF to LF; HTML removes observed Cloudflare Web Analytics/JSD injections and email decoder, decodes Cloudflare-protected email links after matching href and text, and collapses repeated blank lines. No other content removed. Images/binary files compared byte-for-byte.',status='PASS' if not failed else 'FAIL')
out.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='rows'},indent=2))
raise SystemExit(bool(failed))
