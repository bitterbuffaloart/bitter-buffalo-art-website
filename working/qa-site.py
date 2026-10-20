"""Validate committed static site; optionally compare every public asset over HTTP."""
import argparse, concurrent.futures, hashlib, json, pathlib, re, urllib.parse, urllib.request
from html.parser import HTMLParser

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.tags=[]; self.feed(text)
    def handle_starttag(self, tag, attrs): self.tags.append((tag,dict(attrs)))

def check(root, base=None):
    root=pathlib.Path(root).resolve(); errors=[]; pages=list(root.rglob('*.html')); resources=set(); etsy=set()
    for file in pages:
        text=file.read_text(encoding='utf-8'); p=Page(text); ids=[a['id'] for _,a in p.tags if 'id' in a]
        if len(ids)!=len(set(ids)): errors.append(f'{file.name}: duplicate IDs')
        if len(re.findall(r'<h1[ >]',text))!=1: errors.append(f'{file}: expected one h1')
        for selector in ['<title>', 'name="description"', 'name="viewport"', 'rel="canonical"', 'aria-current="page"']:
            if selector not in text: errors.append(f'{file}: missing {selector}')
        for tag,a in p.tags:
            if tag=='img' and 'alt' not in a: errors.append(f'{file}: image missing alt')
            for attr in ('href','src'):
                url=a.get(attr,''); parsed=urllib.parse.urlsplit(url)
                if parsed.hostname and parsed.hostname.endswith('etsy.com'): etsy.add(url)
                if not url or parsed.scheme or parsed.netloc: continue
                path=urllib.parse.unquote(parsed.path)
                target=(root/path.lstrip('/') if path.startswith('/') else file.parent/path).resolve() if path else file
                if not target.is_relative_to(root): errors.append(f'outside site: {url}'); continue
                if target.is_dir(): target=target/'index.html'
                if not target.is_file(): errors.append(f'{file}: missing {url}'); continue
                resources.add(target.relative_to(root).as_posix())
                if parsed.fragment and target.suffix=='.html':
                    targetids={a.get('id') for _,a in Page(target.read_text(encoding='utf-8')).tags}
                    if parsed.fragment not in targetids: errors.append(f'{file}: missing fragment {url}')
    if etsy!={'https://www.etsy.com/shop/BitterBuffaloArt'}: errors.append(f'Unexpected Etsy links: {etsy}')
    photo=(root/'photography/index.html').read_text(encoding='utf-8')
    catalog=json.loads((root/'assets/data/catalog.json').read_text(encoding='utf-8'))
    numbers=set()
    for product in catalog['products']:
        if product.get('category')=='photography prints':
            numbers.update(re.findall(r'portfolio/(?:thumbs/|large/)?(\d+)\.jpg', product.get('images','')))
    if numbers!={f'{n:02}' for n in range(1,45)}: errors.append('Portfolio must contain exactly 44 photographs')
    if 'data-catalog-grid' not in photo: errors.append('Photography gallery is not connected to the catalog')
    events=(root/'events/index.html').read_text(encoding='utf-8')
    if any(s not in events for s in ['booth-market.jpg','booth-tiedye.jpg','Union Peak','Wildoria','DISCONNECT']): errors.append('Events restoration missing')
    resources.update(['index.html','robots.txt','sitemap.xml'])
    # Include CSS background assets as well as direct HTML references.
    resources.update(f.relative_to(root).as_posix() for f in (root/'assets').rglob('*') if f.is_file())
    http=[]
    if base:
        def fetch(path):
            route=path[:-10] if path.endswith('index.html') else path
            url=base.rstrip('/')+'/'+route
            try:
                req=urllib.request.Request(url,headers={'User-Agent':'BitterBuffalo-QA/2.0'})
                with urllib.request.urlopen(req,timeout=30) as r: body=r.read(); status=r.status; mime=r.headers.get('Content-Type','')
                expected=(root/path).read_bytes()
                # Git checks text out with CRLF on Windows and LF on Linux runners.
                if pathlib.Path(path).suffix in ['.html','.css','.js','.svg','.txt','.xml']:
                    body_for_hash=body.replace(b'\r\n',b'\n');expected=expected.replace(b'\r\n',b'\n')
                else: body_for_hash=body
                same=hashlib.sha256(body_for_hash).digest()==hashlib.sha256(expected).digest()
                return {'path':path,'status':status,'bytes':len(body),'matches_source':same,'content_type':mime}
            except Exception as e: return {'path':path,'error':str(e)}
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: http=list(pool.map(fetch,sorted(resources)))
        errors.extend(f'HTTP mismatch: {x}' for x in http if x.get('status')!=200 or not x.get('matches_source'))
        # Invalid input never delivers mail; this also proves Functions were bundled.
        req=urllib.request.Request(base.rstrip('/')+'/api/contact',data=b'{}',headers={'Content-Type':'application/json','User-Agent':'BitterBuffalo-QA/2.0'},method='POST')
        try:
            with urllib.request.urlopen(req,timeout=20) as r: status=r.status; body=r.read()
        except urllib.error.HTTPError as e: status=e.code; body=e.read()
        except Exception as e: status=0; body=b'{}'; errors.append(f'Contact route unavailable: {e}')
        try: valid=status==400 and json.loads(body).get('ok') is False
        except Exception: valid=False
        http.append({'path':'api/contact (invalid input only)','status':status,'validation_pass':valid})
        if not valid: errors.append(f'Contact Function must return JSON 400 for invalid input (got HTTP {status})')
    return {'pages':len(pages),'resources':len(resources),'portfolio_unique':len(numbers),'etsy_urls':sorted(etsy),'errors':errors,'http':http}

if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('root'); p.add_argument('--base'); p.add_argument('--output'); a=p.parse_args()
    result=check(a.root,a.base); encoded=json.dumps(result,indent=2)
    if a.output: pathlib.Path(a.output).write_text(encoded,encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k!='http'},indent=2))
    raise SystemExit(bool(result['errors']))
