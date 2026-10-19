// Stage LumaPrints product-reference images from verified manufacturer originals.
// Only images explicitly supplied by the owner are included. The original sample artwork is not Bitter Buffalo Art.
import {mkdir,writeFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
const destination=process.argv[2]||'.site-build/public/assets/images/lumaprints';
const origin='https://www.lumaprints.com/wp-content/uploads/';
const examples=[
  [
    "metal/metal-silver-glossy.jpg",
    "2023/02/metal-silver-glossy.jpg"
  ],
  [
    "metal/metal-vivid-details.png",
    "2023/02/metal-vivid-details-1.png"
  ],
  [
    "metal/metal-room-display.jpg",
    "2023/06/feature-metal-print-3-2.jpg"
  ],
  [
    "paper/somerset-velvet.jpg",
    "2023/08/fap-somerset-velvet-3-1.jpg"
  ],
  [
    "paper/paper-finishes.png",
    "2023/02/papertypes-2.png"
  ],
  [
    "canvas/stretched-canvas.jpg",
    "2023/11/1.50Canvas-1.jpg"
  ],
  [
    "canvas/mirror-wrap.jpg",
    "2023/02/canvas-mirror-wrap-1.jpg"
  ],
  [
    "canvas/solid-border-wrap.jpg",
    "2023/02/canvas-solid-border-wrap-1.jpg"
  ],
  [
    "canvas/canvas-surface.png",
    "2023/06/canvas-material-2.png"
  ],
  [
    "canvas/stretcher-profile.png",
    "2023/02/1.50_StretcherBar.png"
  ],
  [
    "canvas/foamcore-reinforcement.jpg",
    "2026/08/Stretcher-Bar_Foamcore.jpg"
  ],
  [
    "framed/black-floating-frame.jpg",
    "2024/06/Black-Floating-Frame-Canvas-labeled.jpg"
  ],
  [
    "framed/1-50-floating-frame.webp",
    "2025/07/1.50-Floating-Frame-Canvas-5.webp"
  ],
  [
    "framed/hanging-wire.webp",
    "2025/03/framed-canvas-hanging-hardware-bb-hanging-wire-v3.webp"
  ],
  [
    "framed/0-75-frame-comparison.webp",
    "2025/07/0.75-Floating-Frame-Canvas-4.1.webp"
  ]
];
let errors=0; let total=0;
for (const [relative,remotePath] of examples){
  const url=origin+remotePath;
  try {
    const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; BitterBuffaloArt/1.0)'},signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw Error('HTTP '+response.status);
    const bytes=Buffer.from(await response.arrayBuffer());
    if(bytes.length<5000 || bytes.length>10000000)throw Error('Unexpected media size '+bytes.length);
    const target=join(destination,relative);
    await mkdir(dirname(target),{recursive:true});
    await writeFile(target,bytes);
    total+=bytes.length; console.log('STAGED',relative,bytes.length);
  }catch(e){errors++; console.error('FAILED',relative,String(e));}
}
console.log('LumaPrints supplier images',examples.length-errors,'/',examples.length,'bytes',total);
if(errors)process.exitCode=1;
