const pages=[
  'https://www.lumaprints.com/metal-prints/',
  'https://www.lumaprints.com/canvas-prints/',
  'https://www.lumaprints.com/framed-canvas/',
  'https://www.lumaprints.com/fine-art-paper-prints/'
];
const patterns=[
  ['metal-silver-glossy','metal-silver-glossy'],
  ['metal-vivid-details','metal-vivid-details-1'],
  ['metal-room-display','feature-metal-print-3-2'],
  ['metal-gallery','5-3.jpg'],
  ['paper-somerset','fap-somerset-velvet-3-1'],
  ['paper-finishes','papertypes-2'],
  ['canvas-stretched','1.50Canvas-1'],
  ['canvas-mirror','canvas-mirror-wrap-1'],
  ['canvas-solid','canvas-solid-border-wrap-1'],
  ['canvas-material','canvas-material-2'],
  ['canvas-stretcher','1.50_StretcherBar'],
  ['canvas-foamcore','Stretcher-Bar_Foamcore'],
  ['framed-black','Black-Floating-Frame-Canvas-labeled'],
  ['framed-1.5','1.50-Floating-Frame-Canvas-5'],
  ['framed-wire','framed-canvas-hanging-hardware-bb-hanging-wire-v3'],
  ['framed-0.75','0.75-Floating-Frame-Canvas-4.1']
];
const urls=new Set();
for(const page of pages){
  try{
    const res=await fetch(page,{headers:{'User-Agent':'Mozilla/5.0 (compatible; BitterBuffaloStudio/1.0)'},signal:AbortSignal.timeout(20000)});
    const body=await res.text();
    let matches=[...body.matchAll(/(?:https?:\\/\\/www\\.lumaprints\\.com)?\\/wp-content\\/uploads\\/[^"'\\s<>\\\\]+/gi)].map(x=>x[0].replaceAll('&amp;','&').split('?')[0]);
    for(let url of matches){if(url.startsWith('/'))url='https://www.lumaprints.com'+url;urls.add(url)}
    console.log(JSON.stringify({page,status:res.status,htmlBytes:body.length,mediaURLs:matches.length}));
  }catch(e){console.log(JSON.stringify({page,error:String(e)}))}
}
let count=0;
for(const [label,pattern] of patterns){
  const matches=[...urls].filter(u=>decodeURIComponent(u).toLowerCase().includes(pattern.toLowerCase()));
  matches.sort((a,b)=>a.length-b.length);
  const chosen=matches[0];
  if(chosen)count++;
  console.log(JSON.stringify({label,matchCount:matches.length,url:chosen||null}));
}
console.log('IDENTIFIED',count,'OF',patterns.length);
