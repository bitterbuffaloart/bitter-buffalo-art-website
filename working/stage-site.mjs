// Package only public website files; Functions stay outside the static directory.
import { mkdirSync, cpSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
const source=resolve('cloudflare-pages');
const build=resolve('.site-build');
if (existsSync(build)) throw new Error('Build directory already exists; use a clean checkout for a release.');
mkdirSync(join(build,'public'),{recursive:true});
for (const item of readdirSync(source,{withFileTypes:true})) {
  if (item.name==='assets' || ['about','contact','custom','events','laser-art','original-fine-art','photography','shop','sketchbook','tie-dye'].includes(item.name) || ['index.html','404.html','robots.txt','sitemap.xml','pinterest-feed.xml','_headers','_redirects','favicon.ico'].includes(item.name)) cpSync(join(source,item.name),join(build,'public',item.name),{recursive:true});
}
cpSync(join(source,'functions'),join(build,'functions'),{recursive:true});
writeFileSync(join(build,'public','_routes.json'),JSON.stringify({version:1,include:['/api/*'],exclude:[]}));
console.log('Prepared .site-build/public and .site-build/functions; deployment notes and local scripts excluded.');
