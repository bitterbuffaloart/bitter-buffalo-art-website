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
        for selector in ['<title>', 'name="description"', 'name="viewport"', 'rel="canonical"']:
            if selector not in text: errors.append(f'{file}: missing {selector}')
        rel = file.relative_to(root).as_posix()
        if 'aria-current="page"' not in text and rel not in {'contact/index.html', 'laser-art/index.html'}:
            errors.append(f'{file}: missing aria-current="page"')
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
    allowed_etsy={
        'https://www.etsy.com/shop/BitterBuffaloArt',
        'https://www.etsy.com/listing/4596278804/hand-dyed-dickies-bib-overalls-geode-tie',
        'https://www.etsy.com/listing/4595591399/turquoise-geode-style-mandala-reverse',
        'https://www.etsy.com/listing/4599061887/wildfire-bramble-hand-dyed-v-neck-ruffle',
        'https://www.etsy.com/listing/4599062175/desert-nocturne-hand-dyed-strappy-maxi',
        'https://www.etsy.com/listing/4599062615/midnight-bramble-hand-dyed-pink-and',
        'https://www.etsy.com/listing/4599086486/midnight-bloom-hand-dyed-pink-violet-and',
        'https://www.etsy.com/listing/4599084460/canyon-rose-hand-dyed-ruffle-dress-rose',
        'https://www.etsy.com/listing/4597159476/xl-reverse-tie-dye-hoodie-pink-purple',
        'https://www.etsy.com/listing/4597138439/xl-reverse-tie-dye-hoodie-pink-black',
        'https://www.etsy.com/listing/4596457374/moonlit-mosaic-reverse-ice-dyed',
        'https://www.etsy.com/listing/4595627250/geode-tie-dye-cotton-dress-medium-old',
        'https://www.etsy.com/listing/4596991556/hand-dyed-dickies-bib-overalls-40x32',
        'https://www.etsy.com/listing/4596921803/3xl-reverse-tie-dye-hoodie-green-aqua',
        'https://www.etsy.com/listing/4596850932/3xl-reverse-tie-dye-hoodie-pink-black',
        'https://www.etsy.com/listing/4596420937/hand-dyed-dickies-bib-overalls-34x30',
        'https://www.etsy.com/listing/4596377932/hand-dyed-dickies-bib-overalls-36x30',
        'https://www.etsy.com/listing/4596232860/reverse-tie-dye-dickies-bib-overalls',
        'https://www.etsy.com/listing/4596003319/hand-dyed-beaded-dress-xl-no-boundaries',
        'https://www.etsy.com/listing/4595996185/hand-dyed-ruffle-dress-large-old-navy',
        'https://www.etsy.com/listing/4595632928/turquoise-geode-tie-dye-dress-xl-old',
        'https://www.etsy.com/listing/4595584025/purple-geode-style-mandala-reverse-tie',
        'https://www.etsy.com/listing/4596729532/midnight-bloom-reverse-ice-dyed',
        'https://www.etsy.com/listing/4596421779/hand-dyed-dickies-bib-overalls-38x32',
        'https://www.etsy.com/listing/4596257603/hand-dyed-dickies-bib-overalls-34x30',
        'https://www.etsy.com/listing/4596019472/hand-dyed-ruffle-dress-xl-old-navy-pink',
    }
    if not etsy <= allowed_etsy: errors.append(f'Unexpected Etsy links: {etsy - allowed_etsy}')
    photo=(root/'photography/index.html').read_text(encoding='utf-8')
    catalog=json.loads((root/'assets/data/catalog.json').read_text(encoding='utf-8'))
    known_subjects={'Landscapes','Wildlife','Waterscapes','Night Skies','Historic/Rural','Desert/Rock'}
    public=[p for p in catalog['products'] if p.get('category')=='photography prints' and p.get('availability')!='withheld']
    withheld=[p for p in catalog['products'] if p.get('availability')=='withheld']
    count=len(public)
    if {p.get('name') for p in withheld}!={'Green Light Over the Peak','Snow on the Near Bank','The Creek Under Bare Branches'}:
        errors.append('Withheld photographs must be the three rejected titles')
    if f'Explore {count} original landscapes' not in photo or '53 original' in photo:
        errors.append(f'Photography description must name the calculated {count} photographs')
    sitemap=(root/'sitemap.xml').read_text(encoding='utf-8')
    for slug in ('green-light-over-the-peak','snow-on-the-near-bank','the-creek-under-bare-branches'):
        if slug in sitemap: errors.append(f'sitemap still lists {slug}')
        if (root/'photography'/'prints'/slug/'index.html').exists(): errors.append(f'retired print page remains {slug}')
    for subject in ('all','landscapes','wildlife','waterscapes','night-skies','historic-rural','desert-rock'):
        if not (root/'photography'/subject/'index.html').is_file(): errors.append(f'missing photography collection {subject}')
        if f'/photography/{subject}/' not in photo: errors.append(f'photography index missing /photography/{subject}/')
    for product in public:
        link=product.get('inquiry_or_external_link','').strip('/')
        if not (root/link/'index.html').is_file(): errors.append(f'missing print page for {product.get("id")}')
        unknown=[name for name in product.get('subjects') or [] if name not in known_subjects]
        if unknown: errors.append(f'unknown subject on {product.get("id")}: {unknown}')
    wide_titles = ('Small Life, Wide Silence', 'Where Stone Holds the Stars', 'Gold Beneath the Wild', 'The Gold That Stayed')
    if any(title not in photo for title in wide_titles):
        errors.append('Photography page must name every 16:9 photograph that has no published price')
    if 'data-catalog-grid' not in photo: errors.append('Photography gallery is not connected to the catalog')
    events=(root/'events/index.html').read_text(encoding='utf-8')
    required_events = ['booth-market.jpg','booth-tiedye.jpg','Union Peak','DISCONNECT','soul-rebel-black-uhuru.jpg','questing-the-wilderealm.jpg','elevate-love-2026-lineup.jpg','elevate-love-2026-poster.jpg','Soul Rebel Festival','WildeRealm','Elevate Love']
    if any(s not in events for s in required_events): errors.append('Events restoration missing')
    if 'Wildoria' in events: errors.append('Wildoria participation claimed without proof')
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
    return {'pages':len(pages),'resources':len(resources),'portfolio_unique':count,'etsy_urls':sorted(etsy),'errors':errors,'http':http}

if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('root'); p.add_argument('--base'); p.add_argument('--output'); a=p.parse_args()
    result=check(a.root,a.base); encoded=json.dumps(result,indent=2)
    if a.output: pathlib.Path(a.output).write_text(encoded,encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k!='http'},indent=2))
    raise SystemExit(bool(result['errors']))
