/**
 * DO NOT RUN. This whole-site generator rewrites cloudflare-pages/index.html
 * and an older navigation. It is not the live homepage. See docs/MAINTAIN_SITE.md.
 * Build independent static site for Cloudflare Pages (Phase 3 refinements).
 * No Shopify checkout/cart/accounts. Commerce CTAs → Etsy shop.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = path.join(__dirname, '..', 'cloudflare-pages');
const ETSY = 'https://www.etsy.com/shop/BitterBuffaloArt';
const INDEX = JSON.parse(
  fs
    .readFileSync(path.join(__dirname, 'templates', 'index.json'), 'utf8')
    .replace(/^\/\*[\s\S]*?\*\/\s*/, '')
);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib
      .get(url, { headers: { 'User-Agent': 'BitterBuffaloStaticMigrate/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchText(res.headers.location).then(resolve, reject);
        }
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve(d));
      })
      .on('error', reject);
  });
}

function fetchBin(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib
      .get(url, { headers: { 'User-Agent': 'BitterBuffaloStaticMigrate/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchBin(res.headers.location).then(resolve, reject);
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

function shopifyImagePath(ref) {
  if (!ref || typeof ref !== 'string') return null;
  if (ref.startsWith('shopify://shop_images/')) {
    return ref.replace('shopify://shop_images/', '');
  }
  return null;
}

function cdnUrl(filename, width) {
  const w = width || 1200;
  return `https://cdn.shopify.com/s/files/1/0760/3181/9943/files/${filename}?v=1&width=${w}`;
}

async function downloadNamed(url, destName) {
  const dest = path.join(ROOT, 'assets', 'images', destName);
  try {
    const buf = await fetchBin(url);
    if (buf.length < 500) throw new Error('too small ' + buf.length);
    fs.writeFileSync(dest, buf);
    console.log('saved', destName, buf.length);
    return `/assets/images/${destName}`;
  } catch (e) {
    console.warn('download failed', destName, e.message);
    return null;
  }
}

function relAsset(pathPrefix, absPath) {
  if (!absPath) return '';
  if (absPath.startsWith('http')) return absPath;
  if (!pathPrefix) return absPath;
  return '..' + absPath;
}

const HERO_SVG_PATH = path.join(__dirname, 'assets', 'hero-highcountry.svg');
function loadHeroSvg() {
  const raw = fs.readFileSync(HERO_SVG_PATH, 'utf8');
  // Inject class for layout CSS; keep editable source file free of page chrome.
  return raw.replace('<svg ', '<svg class="hero-art" ');
}

function canonicalPath(active) {
  const map = {
    home: '/',
    photo: '/photography/',
    shop: '/shop/',
    tiedye: '/tie-dye/',
    laser: '/laser-art/',
    custom: '/custom/',
    events: '/events/',
    about: '/about/',
    contact: '/contact/',
  };
  return map[active] || '/';
}

function loadFinal33Portfolio() {
  const p = path.join(__dirname, 'final33-portfolio.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function layout({ title, description, pathPrefix, active, body }) {
  const p = pathPrefix || '';
  const nav = [
    { href: `${p}/`, id: 'home', label: 'Home' },
    { href: `${p}/photography/`, id: 'photo', label: 'Photography' },
    { href: `${p}/shop/`, id: 'shop', label: 'Shop' },
    { href: `${p}/tie-dye/`, id: 'tiedye', label: 'Tie-Dye' },
    { href: `${p}/laser-art/`, id: 'laser', label: 'Laser Art' },
    { href: `${p}/custom/`, id: 'custom', label: 'Custom Art' },
    { href: `${p}/events/`, id: 'events', label: 'Events' },
    { href: `${p}/about/`, id: 'about', label: 'About' },
    { href: `${p}/contact/`, id: 'contact', label: 'Contact' },
  ]
    .map(
      (n) =>
        `<a href="${n.href}" class="nav-link${active === n.id ? ' is-active' : ''}"${
          active === n.id ? ' aria-current="page"' : ''
        }>${n.label}</a>`
    )
    .join('\n          ');

  const canon = `https://bitterbuffaloart.com${canonicalPath(active)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="theme-color" content="#2D2418" />
  <link rel="canonical" href="${canon}" />
  <meta property="og:site_name" content="Bitter Buffalo Art" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canon}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${p}/assets/css/site.css" />
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="${p}/">
        <img src="${p}/assets/images/logo.png" alt="" width="152" height="152" />
        <span class="brand__stack">
          <span class="brand__text">Bitter Buffalo Art</span>
          <span class="brand__place">Breckenridge, Colorado</span>
        </span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav id="site-nav" class="site-nav" aria-label="Primary">
          ${nav}
          <a class="nav-link nav-link--etsy" href="${ETSY}" target="_blank" rel="noopener noreferrer">Shop Etsy</a>
      </nav>
    </div>
  </header>
  <main id="main">
${body}
  </main>
  <footer class="site-footer">
    <div class="site-footer__grid">
      <div>
        <h2>Bitter Buffalo Art</h2>
        <p>Original art from the Colorado High Country—fine-art photography, hand-dyed textiles, laser woodwork, and custom commissions from Breckenridge.</p>
      </div>
      <div>
        <h3>Explore</h3>
        <ul>
          <li><a href="${p}/photography/">Photography</a></li>
          <li><a href="${p}/shop/">Shop</a></li>
          <li><a href="${p}/tie-dye/">Tie-Dye</a></li>
          <li><a href="${p}/laser-art/">Laser Art</a></li>
          <li><a href="${p}/events/">Events</a></li>
          <li><a href="${p}/about/">About</a></li>
        </ul>
      </div>
      <div>
        <h3>Work With Us</h3>
        <ul>
          <li><a href="${p}/custom/">Custom Art</a></li>
          <li><a href="${p}/contact/">Contact</a></li>
          <li><a href="${ETSY}" target="_blank" rel="noopener noreferrer">Shop on Etsy</a></li>
        </ul>
      </div>
    </div>
    <p class="site-footer__note">Purchases are fulfilled through our <a href="${ETSY}" target="_blank" rel="noopener noreferrer">Etsy shop</a>. This website does not process checkout.</p>
  </footer>
  <script src="${p}/assets/js/site.js"></script>
</body>
</html>
`;
}

async function main() {
  ensureDir(path.join(ROOT, 'assets', 'css'));
  ensureDir(path.join(ROOT, 'assets', 'js'));
  ensureDir(path.join(ROOT, 'assets', 'images'));
  for (const d of ['photography', 'shop', 'tie-dye', 'laser-art', 'custom', 'about', 'contact', 'events']) {
    ensureDir(path.join(ROOT, d));
  }

  const pillars = INDEX.sections.collection_pillars_zEFkgR.blocks;
  const logoCandidates = [
    '054c6680-676e-4587-aead-92f55363c942_1_f2a3d558-d3e3-48d2-baa7-7cbf20bc3e41.png',
    '054c6680-676e-4587-aead-92f55363c942_1.png',
  ];

  let logoOk = false;
  for (const f of logoCandidates) {
    const local = await downloadNamed(cdnUrl(f, 400), 'logo.png');
    if (local) {
      logoOk = true;
      break;
    }
  }
  if (!logoOk) {
    const html = await fetchText(
      'https://zaf0bu-wj.myshopify.com/?preview_theme_id=157462167719'
    );
    const m =
      html.match(/https:\/\/cdn\.shopify\.com\/[^\"']+logo[^\"']+\.(?:png|jpg|webp)/i) ||
      html.match(/https:\/\/bitterbuffaloart\.com\/cdn\/shop\/[^\"']+\.(?:png|jpg|webp)/i);
    if (m) await downloadNamed(m[0], 'logo.png');
  }

  const pillarFiles = {
    photography: shopifyImagePath(pillars.collection_card_P6zCeb.settings.custom_image),
    'tie-dye': shopifyImagePath(pillars.collection_card_jzHtHR.settings.custom_image),
    custom: shopifyImagePath(pillars.collection_card_YgUQTw.settings.custom_image),
    tapestries: shopifyImagePath(pillars.collection_card_ghfdRq.settings.custom_image),
    laser: shopifyImagePath(pillars.collection_card_ecxKXX.settings.custom_image),
  };
  const pillarLocal = {};
  for (const [key, file] of Object.entries(pillarFiles)) {
    if (!file) continue;
    const ext = path.extname(file).split('?')[0] || '.jpg';
    const local = await downloadNamed(cdnUrl(file, 1000), `${key}${ext}`);
    pillarLocal[key] = local || '';
  }

  const photoImg = pillarLocal.photography || '/assets/images/photography.jpg';
  const tieImg = pillarLocal['tie-dye'] || '/assets/images/tie-dye.jpg';
  const customImg = pillarLocal.custom || '/assets/images/custom.png';
  const laserImg = pillarLocal.laser || customImg;
  const tapImg = pillarLocal.tapestries || '/assets/images/tapestries.jpg';

  const heroSvg = loadHeroSvg();
  fs.writeFileSync(path.join(ROOT, 'assets', 'images', 'hero-highcountry.svg'), fs.readFileSync(HERO_SVG_PATH));
  fs.writeFileSync(path.join(ROOT, 'assets', 'css', 'site.css'), CSS);
  fs.writeFileSync(path.join(ROOT, 'assets', 'js', 'site.js'), JS);
  fs.writeFileSync(
    path.join(ROOT, '_headers'),
    `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`
  );
  fs.writeFileSync(
    path.join(ROOT, '_redirects'),
    `/shop-photography  /photography/  301
/collections/*  ${ETSY}  302
/cart  ${ETSY}  302
/account  /contact/  302
/laser  /laser-art/  301
/laser-wood-art  /laser-art/  301
/pages/about  /about/  301
/pages/contact  /contact/  301
/pages/events  /events/  301
/pages/custom-art  /custom/  301
`
  );

  // HOME
  fs.writeFileSync(
    path.join(ROOT, 'index.html'),
    layout({
      title: 'Bitter Buffalo Art | Art Born in the High Country',
      description:
        'Art born in the high country—fine-art photography, hand-dyed textiles, and laser woodwork from Breckenridge, Colorado. Shop on Etsy.',
      pathPrefix: '',
      active: 'home',
      body: `
    <section class="hero" aria-label="Bitter Buffalo Art high country">
      ${heroSvg}
      <div class="hero__content">
        <div class="hero__panel">
          <p class="eyebrow"><span class="eyebrow__mark">Bitter Buffalo Art · Breckenridge, Colorado</span></p>
          <h1>Art Born in the High Country</h1>
          <p class="hero__disciplines">Photography · Tie-Dye · Laser Art</p>
          <p class="hero__support">Choose Your Trail</p>
          <div class="hero__actions">
            <a class="btn btn--solid" href="/photography/">View Photography Portfolio</a>
            <a class="btn" href="${ETSY}" target="_blank" rel="noopener noreferrer">Shop on Etsy</a>
            <a class="btn" href="/tie-dye/">Tie-Dye Portfolio</a>
            <a class="btn" href="/laser-art/">Laser Art</a>
          </div>
        </div>
      </div>
    </section>
    <section class="trust" aria-label="Studio promises">
      <div>Original Bitter Buffalo Art</div>
      <div>Handmade in Colorado</div>
      <div>Built to Live With &amp; Love</div>
    </section>
    <section class="pillars">
      <h2>Explore Our Collections</h2>
      <div class="pillars__grid pillars__grid--three">
        <article class="pillar" style="--accent:#38a6ad">
          <img src="${photoImg}" alt="Colorado fine art photography" width="800" height="1000" loading="lazy" />
          <div class="pillar__body">
            <h3>Fine-Art Photography</h3>
            <p class="pillar__note">High-country landscapes and Southwest light—portfolio first; print listings published as available.</p>
            <div class="pillar__actions">
              <a class="btn btn--solid" href="/photography/">View Portfolio</a>
            </div>
          </div>
        </article>
        <article class="pillar" style="--accent:#2d2418">
          <img src="${tieImg}" alt="Hand-dyed tie-dye clothing and textile art" width="800" height="1000" loading="lazy" />
          <div class="pillar__body">
            <h3>Tie-Dye Clothing &amp; Textile Art</h3>
            <div class="pillar__actions">
              <a class="btn btn--solid" href="${ETSY}" target="_blank" rel="noopener noreferrer">Shop Tie-Dye on Etsy</a>
              <a class="btn" href="/tie-dye/">View Portfolio</a>
            </div>
          </div>
        </article>
        <article class="pillar" style="--accent:#a5522e">
          <img src="${laserImg}" alt="Laser-engraved and layered wood artwork" width="800" height="1000" loading="lazy" />
          <div class="pillar__body">
            <h3>Laser Art &amp; Woodwork</h3>
            <div class="pillar__actions">
              <a class="btn btn--solid" href="${ETSY}" target="_blank" rel="noopener noreferrer">Shop Laser Art on Etsy</a>
              <a class="btn" href="/laser-art/">View Laser Art</a>
            </div>
          </div>
        </article>
      </div>
    </section>
    <section class="secondary-links">
      <h2 class="visually-hidden">More from the studio</h2>
      <div class="secondary-links__grid">
        <a class="secondary-card" href="/custom/">
          <img src="${customImg}" alt="" loading="lazy" />
          <span>Custom Art</span>
        </a>
        <a class="secondary-card" href="/events/">
          <img src="${tapImg}" alt="" loading="lazy" />
          <span>Events</span>
        </a>
        <a class="secondary-card" href="/about/"><span>About</span></a>
        <a class="secondary-card" href="/contact/"><span>Contact</span></a>
      </div>
    </section>
    <section class="brandstory">
      <h2>Crafted with love in Breckenridge, CO.</h2>
      <p>Created in Breckenridge, Colorado, Bitter Buffalo Art brings together original high-country photography, laser woodwork, custom commissions, and one-of-a-kind hand-dyed cloth. Every piece is designed to live with and love.</p>
      <a class="btn btn--ghost" href="/about/">Read Our Story</a>
    </section>`,
    })
  );

  // PHOTOGRAPHY — Final 33 curated portfolio (Maroon #02 featured). No fictional Etsy listing URLs.
  const portfolio = loadFinal33Portfolio();
  const featured =
    (portfolio && portfolio.photos.find((x) => x.featured)) ||
    (portfolio && portfolio.photos[0]);
  const galleryFigures = (portfolio ? portfolio.photos : [])
    .map((ph) => {
      const badge =
        ph.purchase_status === 'UNPUBLISHED_PORTFOLIO_ONLY'
          ? '<span class="portfolio-badge">Portfolio preview · not yet listed on Etsy</span>'
          : '';
      const imgSrc = `../assets/images/portfolio/${String(ph.rank).padStart(2, '0')}.jpg`;
      return `<figure class="portfolio-card${ph.featured ? ' portfolio-card--featured' : ''}">
        <img src="${imgSrc}" alt="${ph.title}" loading="${ph.featured ? 'eager' : 'lazy'}" width="1400" height="933" />
        <figcaption><strong>#${String(ph.rank).padStart(2, '0')} · ${ph.title}</strong>${badge}</figcaption>
      </figure>`;
    })
    .join('\n      ');

  fs.writeFileSync(
    path.join(ROOT, 'photography', 'index.html'),
    layout({
      title: 'Photography Portfolio | Bitter Buffalo Art',
      description:
        'Final 33 curated landscape photography portfolio from Bitter Buffalo Art—featuring Maroon Bells Reflection. Prints coming to Etsy.',
      pathPrefix: '..',
      active: 'photo',
      body: `
    <section class="page-hero">
      <p class="eyebrow"><span class="eyebrow__mark eyebrow__mark--ink">Fine Art Photography</span></p>
      <h1>Photography Portfolio</h1>
      <p class="lede">Curated Final 33 collection from Colorado and the Southwest. Featured first: <strong>Maroon Bells Reflection</strong>. Browse the portfolio here. Individual print listings open on Etsy only after publication—unpublished variants are not offered for purchase on this site.</p>
      <div class="hero__actions" style="justify-content:flex-start;margin-top:1rem">
        <a class="btn btn--ghost" href="${ETSY}" target="_blank" rel="noopener noreferrer">Visit Etsy Shop</a>
        <a class="btn" href="../shop/">Print formats &amp; shopping</a>
      </div>
    </section>
    ${
      featured
        ? `<section class="portfolio-feature" aria-label="Featured photograph">
      <figure>
        <img src="../assets/images/portfolio/${String(featured.rank).padStart(2, '0')}.jpg" alt="${featured.title}" width="1400" height="933" />
        <figcaption>
          <p class="eyebrow"><span class="eyebrow__mark eyebrow__mark--ink">Featured · #${String(featured.rank).padStart(2, '0')}</span></p>
          <h2>${featured.title}</h2>
          <p>Open-edition and signed collector-edition prints are prepared through our Phase 5 photography program. Collector editions are limited to <strong>66 total signed prints per photograph</strong> across all materials and sizes.</p>
          <p class="portfolio-badge">Not yet published on Etsy — portfolio preview only</p>
        </figcaption>
      </figure>
    </section>`
        : ''
    }
    <section class="prose formats-block">
      <h2>Print formats (when published)</h2>
      <ul class="checklist">
        <li><strong>Premium wood-stretched canvas</strong> — 1.5″ gallery wrap with mirrored edges where geometry permits</li>
        <li><strong>Premium wood floating-frame canvas</strong> — 1.5″ wrap with solid-wood floating frame</li>
        <li>Traditional photographic prints (luster / glossy)</li>
        <li>Archival giclée matte and premium cotton rag</li>
        <li>Aluminum metal prints</li>
        <li>Acrylic face-mount — future offering (not currently available for purchase)</li>
      </ul>
      <p>Exact sizes and prices follow the approved Phase 5 records. Do not treat unpublished combinations as buyable until linked from a live Etsy listing.</p>
    </section>
    <section class="gallery gallery--portfolio" aria-label="Final 33 portfolio">
      ${galleryFigures || `<figure><img src="../assets/images/photography.jpg" alt="Colorado high-country photography" loading="lazy" /><figcaption>Portfolio images pending build step</figcaption></figure>`}
    </section>`,
    })
  );

  // SHOP — category trailhead to verified Etsy shop only (no invented listing URLs)
  fs.writeFileSync(
    path.join(ROOT, 'shop', 'index.html'),
    layout({
      title: 'Shop | Bitter Buffalo Art',
      description:
        'Shop Bitter Buffalo Art on Etsy—tie-dye, laser art, and photography. Checkout happens on Etsy.',
      pathPrefix: '..',
      active: 'shop',
      body: `
    <section class="page-hero">
      <p class="eyebrow"><span class="eyebrow__mark eyebrow__mark--ink">Etsy Storefront</span></p>
      <h1>Shop on Etsy</h1>
      <p class="lede">This website is the trailhead. Merchandise, payments, and checkout are handled on our verified Etsy shop. Individual product links are added only after each listing URL is confirmed live.</p>
      <a class="btn btn--solid-ink" href="${ETSY}" target="_blank" rel="noopener noreferrer">Open BitterBuffaloArt on Etsy</a>
    </section>
    <section class="pillars">
      <h2>Browse by collection</h2>
      <div class="pillars__grid pillars__grid--three">
        <article class="pillar" style="--accent:#38a6ad">
          <img src="${relAsset('..', photoImg)}" alt="Photography collection" width="800" height="1000" loading="lazy" />
          <div class="pillar__body">
            <h3>Photography Prints</h3>
            <p class="pillar__note">Final 33 portfolio is live on this site. Etsy print listings open when published—until then use the shop home.</p>
            <div class="pillar__actions">
              <a class="btn btn--solid" href="../photography/">View Portfolio</a>
              <a class="btn" href="${ETSY}" target="_blank" rel="noopener noreferrer">Etsy Shop Home</a>
            </div>
          </div>
        </article>
        <article class="pillar" style="--accent:#2d2418">
          <img src="${relAsset('..', tieImg)}" alt="Tie-dye clothing" width="800" height="1000" loading="lazy" />
          <div class="pillar__body">
            <h3>Ice-Dye &amp; Tie-Dye</h3>
            <p class="pillar__note">Hand-dyed clothing and textile art. Shop available pieces on Etsy.</p>
            <div class="pillar__actions">
              <a class="btn btn--solid" href="${ETSY}" target="_blank" rel="noopener noreferrer">Shop Tie-Dye on Etsy</a>
              <a class="btn" href="../tie-dye/">Portfolio</a>
            </div>
          </div>
        </article>
        <article class="pillar" style="--accent:#a5522e">
          <img src="${relAsset('..', laserImg)}" alt="Laser engraved art" width="800" height="1000" loading="lazy" />
          <div class="pillar__body">
            <h3>Laser-Engraved Art</h3>
            <p class="pillar__note">Decorative laser woodwork and engraved pieces. Aspen rounds are decorative artwork only.</p>
            <div class="pillar__actions">
              <a class="btn btn--solid" href="${ETSY}" target="_blank" rel="noopener noreferrer">Shop Laser Art on Etsy</a>
              <a class="btn" href="../laser-art/">Portfolio</a>
            </div>
          </div>
        </article>
      </div>
    </section>
    <section class="prose formats-block">
      <h2>How purchasing works</h2>
      <ul class="checklist">
        <li>Browse collections and story pages on bitterbuffaloart.com</li>
        <li>Buy on <a href="${ETSY}" target="_blank" rel="noopener noreferrer">etsy.com/shop/BitterBuffaloArt</a></li>
        <li>No independent cart or payment processor on this website</li>
        <li>Photography collector editions: 66 signed prints total per photograph (all materials/sizes)</li>
      </ul>
    </section>`,
    })
  );

  // TIE-DYE
  fs.writeFileSync(
    path.join(ROOT, 'tie-dye', 'index.html'),
    layout({
      title: 'Tie-Dye Clothing & Textile Art | Bitter Buffalo Art',
      description: 'One-of-a-kind hand-dyed clothing and textile art from Bitter Buffalo Art in Breckenridge, Colorado.',
      pathPrefix: '..',
      active: 'tiedye',
      body: `
    <section class="page-hero">
      <p class="eyebrow"><span class="eyebrow__mark eyebrow__mark--ink">Hand-Dyed Cloth</span></p>
      <h1>Tie-Dye Clothing &amp; Textile Art</h1>
      <p class="lede">Earth-tone and high-country palettes dyed by hand. Browse the archive here; shop available pieces on Etsy.</p>
      <a class="btn btn--solid-ink" href="${ETSY}" target="_blank" rel="noopener noreferrer">Shop Tie-Dye on Etsy</a>
    </section>
    <section class="gallery">
      <figure><img src="${relAsset('..', tieImg)}" alt="Hand-dyed tie-dye" loading="lazy" /><figcaption>Backcountry earth tones</figcaption></figure>
    </section>`,
    })
  );

  // LASER ART
  fs.writeFileSync(
    path.join(ROOT, 'laser-art', 'index.html'),
    layout({
      title: 'Laser Art & Woodwork | Bitter Buffalo Art',
      description:
        'Laser-engraved and layered wood artwork from Bitter Buffalo Art—decorative aspen rounds, ornaments, slate, bamboo, and custom pieces.',
      pathPrefix: '..',
      active: 'laser',
      body: `
    <section class="page-hero">
      <p class="eyebrow"><span class="eyebrow__mark eyebrow__mark--ink">Laser Studio</span></p>
      <h1>Laser Art &amp; Woodwork</h1>
      <p class="lede">Layered wood artwork, engraved decorative pieces, ornaments, slate coasters, bamboo boards, and other original laser work from the Breckenridge studio.</p>
      <a class="btn btn--solid-ink" href="${ETSY}" target="_blank" rel="noopener noreferrer">Shop Laser Art on Etsy</a>
      <a class="btn btn--ghost" href="../custom/">Request Custom Laser Work</a>
    </section>
    <section class="split">
      <img src="${relAsset('..', laserImg)}" alt="Laser wood artwork from Bitter Buffalo Art" loading="lazy" />
      <div class="prose-inline">
        <h2>What we make</h2>
        <ul class="checklist">
          <li>Layered wood artwork</li>
          <li>Laser-engraved decorative wood pieces</li>
          <li>Engraved aspen wood rounds</li>
          <li>Ornaments</li>
          <li>Slate coasters</li>
          <li>Engraved bamboo boards</li>
          <li>Other original laser artwork</li>
        </ul>
      </div>
    </section>
    <section class="prose callout">
      <h2>About engraved aspen rounds</h2>
      <p>Untreated engraved aspen rounds are <strong>decorative artwork</strong>, not cutting boards or food-safe products. Display them as tabletop art or wall art. Free wall-hanger installation is available upon customer request.</p>
    </section>
    <section class="gallery">
      <figure><img src="${relAsset('..', laserImg)}" alt="Laser wood art sample" loading="lazy" /><figcaption>Studio laser work</figcaption></figure>
      <figure><img src="${relAsset('..', customImg)}" alt="Custom engraved piece" loading="lazy" /><figcaption>Custom engraving</figcaption></figure>
    </section>`,
    })
  );

  // CUSTOM
  fs.writeFileSync(
    path.join(ROOT, 'custom', 'index.html'),
    layout({
      title: 'Custom Art | Bitter Buffalo Art',
      description: 'Request custom photography, laser engraving, or commissioned artwork from Bitter Buffalo Art.',
      pathPrefix: '..',
      active: 'custom',
      body: `
    <section class="page-hero">
      <p class="eyebrow"><span class="eyebrow__mark eyebrow__mark--ink">Commissions</span></p>
      <h1>Custom Art</h1>
      <p class="lede">Tell us about a place, a gift, or a story. We design custom work that fits your walls and your trails.</p>
      <a class="btn btn--solid-ink" href="../contact/#start-custom-project">Start a Custom Project</a>
      <a class="btn btn--ghost" href="${ETSY}" target="_blank" rel="noopener noreferrer">Browse Available Work</a>
    </section>
    <section class="split">
      <img src="${relAsset('..', customImg)}" alt="Custom art example" loading="lazy" />
      <div>
        <h2>What we can make</h2>
        <ul class="checklist">
          <li>Custom photography prints and sets</li>
          <li>Engraved or laser-cut dimensional pieces</li>
          <li>Commissioned gifts for homes and lodges</li>
        </ul>
      </div>
    </section>`,
    })
  );

  // ABOUT
  fs.writeFileSync(
    path.join(ROOT, 'about', 'index.html'),
    layout({
      title: 'About | Bitter Buffalo Art',
      description: 'Bitter Buffalo Art is handmade in Breckenridge, Colorado.',
      pathPrefix: '..',
      active: 'about',
      body: `
    <section class="page-hero">
      <p class="eyebrow"><span class="eyebrow__mark eyebrow__mark--ink">Our Story</span></p>
      <h1>About Bitter Buffalo Art</h1>
      <p class="lede">Bitter Buffalo Art is handmade in Colorado—original photography, laser woodwork, custom commissions, and one-of-a-kind hand-dyed cloth. Natural materials. Quiet meaning. Built to live with and love.</p>
    </section>
    <section class="prose">
      <p>We work from Breckenridge with a simple promise: show the high country honestly, dye cloth with intention, and make pieces that earn their place in a home.</p>
      <p>Purchases ship through our Etsy shop. This website is our trailhead—portfolio, story, events, and contact—not a checkout cart.</p>
      <a class="btn btn--solid-ink" href="${ETSY}" target="_blank" rel="noopener noreferrer">Visit the Etsy Shop</a>
    </section>`,
    })
  );

  // CONTACT — restored from live Shopify contact hub + custom-project intake (Union Peaks tags removed)
  fs.writeFileSync(
    path.join(ROOT, 'contact', 'index.html'),
    layout({
      title: 'Contact | Bitter Buffalo Art',
      description:
        'Contact Bitter Buffalo Art or start a custom project request in Breckenridge, Colorado.',
      pathPrefix: '..',
      active: 'contact',
      body: `
    <section class="page-hero">
      <p class="eyebrow"><span class="eyebrow__mark eyebrow__mark--ink">Studio</span></p>
      <h1>Contact</h1>
      <p class="lede">Questions about a commission, a market date, or a custom laser piece? Reach out—or start a custom project request for review.</p>
      <p><strong>Email:</strong> <a href="mailto:backcountrytiedye@gmail.com">backcountrytiedye@gmail.com</a> · <strong>Shop:</strong> <a href="${ETSY}" target="_blank" rel="noopener noreferrer">Etsy</a> · Breckenridge, Colorado</p>
    </section>

    <section class="contact-hub prose" data-bb-contact-tabs aria-labelledby="BbContactChoicesHeading">
      <h2 id="BbContactChoicesHeading">How can we help?</h2>
      <div class="contact-hub__choices" role="tablist" aria-label="Contact forms">
        <button type="button" class="contact-hub__choice is-active" id="BbTabGeneral" role="tab" aria-selected="true" aria-controls="general-contact" data-bb-contact-tab="general">
          <strong>General contact</strong>
          <span>Questions, studio hours, and anything that is not a custom project request.</span>
        </button>
        <button type="button" class="contact-hub__choice" id="BbTabProject" role="tab" aria-selected="false" aria-controls="start-custom-project" data-bb-contact-tab="project">
          <strong>Start a custom project</strong>
          <span>Tell us what you want made. This is a request for review, not an order or price.</span>
        </button>
        <button type="button" class="contact-hub__choice" id="BbTabLaser" role="tab" aria-selected="false" aria-controls="laser-intake" data-bb-contact-tab="laser">
          <strong>Custom laser artwork</strong>
          <span>Laser engraving intake for photo, memorial, sign, and decorative wood requests.</span>
        </button>
      </div>

      <div id="general-contact" role="tabpanel" aria-labelledby="BbTabGeneral" data-bb-contact-panel="general">
        <h3>General contact</h3>
        <form class="bb-form" data-bb-form="general" method="post" action="https://bitterbuffaloart.com/contact#ContactForm" accept-charset="UTF-8" novalidate>
          <input type="hidden" name="form_type" value="contact" />
          <input type="hidden" name="utf8" value="✓" />
          <input type="hidden" name="form_kind" value="general" />
          <label class="hp" aria-hidden="true">Company website<input type="text" name="website" tabindex="-1" autocomplete="off" /></label>
          <div class="bb-form__grid">
            <label>Full name <span aria-hidden="true">*</span><input name="contact[name]" required autocomplete="name" /></label>
            <label>Email address <span aria-hidden="true">*</span><input type="email" name="contact[email]" required autocomplete="email" /></label>
          </div>
          <label>Phone (optional)<input type="tel" name="contact[phone]" autocomplete="tel" /></label>
          <label>Subject <span aria-hidden="true">*</span>
            <select name="contact[Subject]" required>
              <option value="" disabled selected>What is this about?</option>
              <option value="General question">General question</option>
              <option value="Studio hours or visit">Studio hours or visit</option>
              <option value="Care or display">Care or display</option>
              <option value="Order question">Order question</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label>Message <span aria-hidden="true">*</span><textarea name="contact[body]" rows="6" required></textarea></label>
          <p class="bb-form__hint">I read every message and reply as soon as studio work allows. For custom artwork, use Start a Custom Project.</p>
          <button class="btn btn--solid-ink" type="submit">Send message</button>
          <p class="bb-form__status" data-bb-form-status role="status" hidden></p>
        </form>
      </div>

      <div id="start-custom-project" role="tabpanel" aria-labelledby="BbTabProject" data-bb-contact-panel="project" hidden>
        <h3>Start a custom project</h3>
        <p>Tell us what you have in mind. Bitter Buffalo Art will review the request before discussing options, pricing, or production. A submission is not an order, price, or completion promise.</p>
        <form class="bb-form" data-bb-form="custom-project" method="post" action="https://bitterbuffaloart.com/contact#BbCustomProject" accept-charset="UTF-8" novalidate>
          <input type="hidden" name="form_type" value="contact" />
          <input type="hidden" name="utf8" value="✓" />
          <input type="hidden" name="contact[form_type]" value="custom-project-intake" />
          <input type="hidden" name="contact[Subject]" value="Custom project request" />
          <input type="hidden" name="form_kind" value="custom-project" />
          <label class="hp" aria-hidden="true">Company website<input type="text" name="website" tabindex="-1" autocomplete="off" /></label>
          <div class="bb-form__grid">
            <label>Full name <span aria-hidden="true">*</span><input name="contact[name]" required autocomplete="name" /></label>
            <label>Email address <span aria-hidden="true">*</span><input type="email" name="contact[email]" required autocomplete="email" /></label>
          </div>
          <label>Product or commission type <span aria-hidden="true">*</span>
            <select name="contact[product_category]" required>
              <option value="">Select a category</option>
              <option value="Custom laser artwork">Custom laser artwork</option>
              <option value="Custom Dickies">Custom Dickies</option>
              <option value="Custom tie-dye">Custom tie-dye</option>
              <option value="Shirt">Shirt</option>
              <option value="Leggings">Leggings</option>
              <option value="Scarf">Scarf</option>
              <option value="Tapestry">Tapestry</option>
              <option value="Fine-art photography">Fine-art photography</option>
              <option value="Laser wood art">Laser wood art</option>
              <option value="Lighted artwork">Lighted artwork</option>
              <option value="Other custom artwork">Other custom artwork</option>
              <option value="Custom commission">Custom commission</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label>Description of the requested design <span aria-hidden="true">*</span><textarea name="contact[body]" rows="4" required></textarea></label>
          <div class="bb-form__grid">
            <label>Phone (optional)<input type="tel" name="contact[phone]" autocomplete="tel" /></label>
            <label>Preferred contact method
              <select name="contact[preferred_contact]">
                <option value="">Select</option>
                <option value="Email">Email</option>
                <option value="Phone">Phone</option>
                <option value="Either">Either</option>
              </select>
            </label>
            <label>Size (optional)<input name="contact[size]" /></label>
            <label>Colors (optional)<input name="contact[colors]" /></label>
            <label>Quantity (optional)<input type="number" name="contact[quantity]" min="1" step="1" /></label>
            <label>Budget range (optional)<input name="contact[budget_range]" /></label>
            <label>Needed-by date (optional)<input type="date" name="contact[needed_by]" /></label>
          </div>
          <label>Additional notes (optional)<textarea name="contact[additional_notes]" rows="3"></textarea></label>
          <p class="bb-form__hint">Reference-image upload is not available on this site yet—the original Shopify Forms file upload was never enabled on the live contact page. After submitting, you may email reference photos to <a href="mailto:backcountrytiedye@gmail.com">backcountrytiedye@gmail.com</a>.</p>
          <p class="bb-form__hint">Do not send card numbers or other payment details. A request is not an order until the owner reviews and approves it.</p>
          <label class="bb-form__check"><input type="checkbox" name="contact[project_contact_ack]" value="yes" required /> I agree that Bitter Buffalo Art may contact me about this specific project request. <span aria-hidden="true">*</span></label>
          <label class="bb-form__check"><input type="checkbox" name="contact[marketing_consent]" value="yes" /> Send me occasional updates, new artwork, and event announcements. (Optional — separate from project contact.)</label>
          <button class="btn btn--solid-ink" type="submit">Start my project</button>
          <p class="bb-form__status" data-bb-form-status role="status" hidden></p>
        </form>
      </div>

      <div id="laser-intake" role="tabpanel" aria-labelledby="BbTabLaser" data-bb-contact-panel="laser" hidden>
        <h3>Custom laser engraving intake</h3>
        <p>Restored from the Shopify laser intake page. A submission is a request for review and quote, not an order.</p>
        <form class="bb-form" data-bb-form="laser-intake" method="post" action="https://bitterbuffaloart.com/contact#BbLaserIntake" accept-charset="UTF-8" novalidate>
          <input type="hidden" name="form_type" value="contact" />
          <input type="hidden" name="utf8" value="✓" />
          <input type="hidden" name="contact[tags]" value="custom-laser-intake,website-pages" />
          <input type="hidden" name="contact[Subject]" value="Custom laser engraving intake" />
          <input type="hidden" name="form_kind" value="laser-intake" />
          <label class="hp" aria-hidden="true">Company website<input type="text" name="website" tabindex="-1" autocomplete="off" /></label>
          <div class="bb-form__grid">
            <label>Customer name <span aria-hidden="true">*</span><input name="contact[name]" required autocomplete="name" /></label>
            <label>Email address <span aria-hidden="true">*</span><input type="email" name="contact[email]" required autocomplete="email" /></label>
          </div>
          <label>Phone (optional)<input type="tel" name="contact[phone]" autocomplete="tel" /></label>
          <label>Project type <span aria-hidden="true">*</span>
            <select name="contact[project_type]" required>
              <option value="">Select a project type</option>
              <option value="Photo engraving">Photo engraving</option>
              <option value="Pet portrait">Pet portrait</option>
              <option value="Family portrait">Family portrait</option>
              <option value="Memorial engraving">Memorial engraving</option>
              <option value="Sign or plaque">Sign or plaque</option>
              <option value="Logo or business engraving">Logo or business engraving</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <div class="bb-form__grid">
            <label>Requested item or surface <span aria-hidden="true">*</span><input name="contact[requested_item]" required /></label>
            <label>Approximate finished size <span aria-hidden="true">*</span><input name="contact[approximate_size]" required /></label>
            <label>Quantity <span aria-hidden="true">*</span><input type="number" name="contact[quantity]" min="1" step="1" required /></label>
            <label>Needed-by date (not guaranteed) <span aria-hidden="true">*</span><input type="date" name="contact[needed_by]" required /></label>
          </div>
          <label>Preferred contact method <span aria-hidden="true">*</span>
            <select name="contact[preferred_contact]" required>
              <option value="">Select</option>
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
            </select>
          </label>
          <label>Additional project notes <span aria-hidden="true">*</span><textarea name="contact[body]" rows="6" required></textarea></label>
          <p class="bb-form__hint">Secure photo upload is not available on this static site yet (same limitation as the original Shopify intake). Email reference photographs to <a href="mailto:backcountrytiedye@gmail.com">backcountrytiedye@gmail.com</a> after submitting.</p>
          <label class="bb-form__check"><input type="checkbox" name="contact[owns_photo]" value="yes" required /> I confirm that I own this photograph or have permission to use it. <span aria-hidden="true">*</span></label>
          <label class="bb-form__check"><input type="checkbox" name="contact[request_not_order]" value="yes" required /> I understand this submission is a request for review and quote, not an order. <span aria-hidden="true">*</span></label>
          <label class="bb-form__check"><input type="checkbox" name="contact[approval_required]" value="yes" required /> I understand that final design, material, dimensions, price, production schedule, and suitability require approval. <span aria-hidden="true">*</span></label>
          <label class="bb-form__check"><input type="checkbox" name="contact[production_use]" value="yes" required /> I authorize Bitter Buffalo Art to use the submitted files only to evaluate and produce the requested commission. <span aria-hidden="true">*</span></label>
          <label class="bb-form__check"><input type="checkbox" name="contact[marketing_permission]" value="yes" /> Optional: separate permission to display finished work in marketing or public galleries.</label>
          <button class="btn btn--solid-ink" type="submit">Send laser engraving request</button>
          <p class="bb-form__status" data-bb-form-status role="status" hidden></p>
        </form>
      </div>
    </section>`,
    })
  );

  // EVENTS — restored from live Shopify /pages/events (2026-10-17 scrape); no invented history
  fs.writeFileSync(
    path.join(ROOT, 'events', 'index.html'),
    layout({
      title: 'Events & Exhibitions | Bitter Buffalo Art',
      description:
        'Upcoming markets and a professional record of Bitter Buffalo Art festival and exhibition participation.',
      pathPrefix: '..',
      active: 'events',
      body: `
    <section class="page-hero">
      <p class="eyebrow"><span class="eyebrow__mark eyebrow__mark--ink">Markets &amp; Exhibitions</span></p>
      <h1>Events</h1>
      <p class="lede">A living calendar of confirmed appearances and a professional record of past vendor work—for customers, promoters, and festival applications.</p>
      <p class="event-intro">Schedules can change. Confirm dates, location, and admission with the official event organizer before you travel.</p>
    </section>

    <section class="prose event-section" id="upcoming">
      <h2>Upcoming Events</h2>
      <p class="event-intro">Only confirmed festivals, art markets, and exhibitions are listed here. Applications and tentative bookings are never shown as confirmed.</p>
      <div class="event-empty">
        <p><strong>No confirmed upcoming events are published at this time.</strong></p>
        <p>As dates are confirmed, they will appear here with event name, date, location, and verified event links.</p>
      </div>
    </section>

    <section class="prose event-section" id="past">
      <h2>Past Events &amp; Exhibitions</h2>
      <p class="event-intro">Restored from the live Bitter Buffalo Art Events page. Past appearances stay listed as working history; they are not removed because the date has passed. Retired promotional giveaways are not treated as exhibitions.</p>
      <div class="event-grid">
        <article class="event-card">
          <h3>Bitter Buffalo Art at Union Peak Festival</h3>
          <p class="event-card__meta">August 28–30, 2026</p>
          <p class="event-card__meta">Center Village, Copper Mountain, Colorado</p>
          <p>Find Bitter Buffalo Art at Union Peak Festival, Copper Mountain’s celebration of community, art, music, and mountain culture.</p>
          <p class="event-card__badge">Past appearance</p>
          <a class="btn btn--ghost" href="https://www.coppercolorado.com/events-activities/union-peak-festival/" target="_blank" rel="noopener noreferrer">Official event information</a>
        </article>
        <article class="event-card">
          <h3>Till the Break of Dawn: DISCONNECT</h3>
          <p class="event-card__meta">September 4–5, 2026</p>
          <p class="event-card__meta">Lake George, Colorado</p>
          <p class="event-card__badge">Past appearance</p>
          <a class="btn btn--ghost" href="https://www.tillthebreakofdawnco.com" target="_blank" rel="noopener noreferrer">Official event information</a>
        </article>
        <article class="event-card">
          <h3>Wildoria Music &amp; Arts Festival</h3>
          <p class="event-card__meta">September 25–28, 2026</p>
          <p class="event-card__meta">Boone, Colorado</p>
          <p class="event-card__badge">Past appearance</p>
          <a class="btn btn--ghost" href="https://wildoriafestival.com" target="_blank" rel="noopener noreferrer">Official event information</a>
        </article>
        <article class="event-card">
          <h3>Black Uhru</h3>
          <p class="event-card__meta">July 12, 2026</p>
          <p class="event-card__meta">Levitt Pavilion Denver</p>
          <p>Bitter Buffalo Art appeared with tie-dye shirts and women’s apparel.</p>
          <p class="event-card__badge">Past appearance</p>
        </article>
        <article class="event-card">
          <h3>Questing the Wilderealm</h3>
          <p class="event-card__meta">July 16–18, 2026</p>
          <p class="event-card__meta">Moffett, Colorado</p>
          <p class="event-card__badge">Past appearance</p>
        </article>
      </div>
    </section>

    <section class="prose event-section" id="gallery">
      <h2>Event Gallery &amp; References</h2>
      <p class="event-intro">Booth and market photographs recovered from the published Bitter Buffalo Art website assets (Shopify CDN). Lightroom and original photo archives were not opened for this restoration.</p>
      <div class="gallery gallery--events">
        <figure>
          <img src="../assets/images/events/booth-market.jpg" alt="Outdoor market booth with tents and shoppers" loading="lazy" width="1200" height="800" />
          <figcaption>Market booth — outdoor vendor setting</figcaption>
        </figure>
        <figure>
          <img src="../assets/images/events/booth-tiedye.jpg" alt="Colorful tie-dye shirts displayed under a canopy tent" loading="lazy" width="1200" height="800" />
          <figcaption>Tie-dye display under canopy</figcaption>
        </figure>
      </div>
      <p style="margin-top:1.25rem"><a class="btn btn--ghost" href="../contact/">Contact for festival / promoter references</a></p>
    </section>`,
    })
  );

  fs.writeFileSync(path.join(ROOT, 'DEPLOY.md'), DEPLOY_MD);
  fs.writeFileSync(path.join(ROOT, 'MAINTENANCE.md'), MAINTENANCE_MD);

  const sitePaths = [
    '/',
    '/photography/',
    '/shop/',
    '/tie-dye/',
    '/laser-art/',
    '/custom/',
    '/events/',
    '/about/',
    '/contact/',
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitePaths
  .map(
    (u) => `  <url><loc>https://bitterbuffaloart.com${u}</loc><changefreq>weekly</changefreq></url>`
  )
  .join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
  fs.writeFileSync(
    path.join(ROOT, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: https://bitterbuffaloart.com/sitemap.xml\n`
  );
  fs.writeFileSync(
    path.join(ROOT, 'README.md'),
    `# Bitter Buffalo Art — Cloudflare Pages static site

Independent website (Phase 3, 2026-10-17). Not the Art Builder app.

- Preview: https://bitter-buffalo-art.pages.dev/
- Etsy: ${ETSY}
- Build: \`node ../working/build-static-site.js\`
- Deploy: \`deploy-preview.cmd\` or see DEPLOY.md
- Maintenance notes for assistants: MAINTENANCE.md
`
  );

  console.log('Static site written to', ROOT);
}

const CSS = `:root {
  --ink: #2d2418;
  --cream: #f3e7cf;
  --paper: #f7f4ee;
  --teal: #087c85;
  --teal-bright: #38a6ad;
  --rust: #a5522e;
  --gold: #c4a35a;
  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-body: "Source Sans 3", system-ui, sans-serif;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--font-body);
  color: var(--ink);
  background: var(--paper);
  line-height: 1.55;
}
img { max-width: 100%; height: auto; display: block; }
a { color: var(--teal); }
.visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
.skip-link {
  position: absolute; left: -999px; top: 0; background: var(--ink); color: #fff; padding: .5rem 1rem; z-index: 100;
}
.skip-link:focus { left: .5rem; top: .5rem; outline: 3px solid var(--gold); }
.site-header {
  background: rgba(247,244,238,.97);
  border-bottom: 1px solid rgba(45,36,24,.16);
  position: sticky; top: 0; z-index: 40;
  backdrop-filter: blur(8px);
}
.site-header__inner {
  max-width: 1200px; margin: 0 auto; padding: .7rem 1.25rem;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
}
.brand {
  display: flex; align-items: center; gap: .75rem; text-decoration: none; color: var(--ink);
  min-width: 0;
}
.brand img {
  width: 52px; height: 52px; object-fit: contain; flex-shrink: 0;
  background: #fff; border: 1px solid rgba(45,36,24,.12); border-radius: 4px;
}
.brand__stack { display: flex; flex-direction: column; gap: .1rem; min-width: 0; }
.brand__text {
  font-family: var(--font-display); font-size: 1.35rem; font-weight: 700;
  letter-spacing: .01em; line-height: 1.1; color: var(--ink);
}
.brand__place {
  font-size: .78rem; font-weight: 700; letter-spacing: .04em;
  text-transform: uppercase; color: #5a4a36;
}
.site-nav { display: flex; flex-wrap: wrap; gap: .25rem .55rem; align-items: center; }
.nav-link {
  text-decoration: none; color: #3a2f22; font-weight: 700; font-size: .9rem;
  padding: .4rem .55rem; border-radius: 4px; border: 1px solid transparent;
  transition: color .15s ease, background .15s ease, border-color .15s ease;
}
.nav-link:hover {
  color: var(--rust); background: rgba(165,82,46,.08); border-color: rgba(165,82,46,.2);
}
.nav-link:focus-visible {
  outline: 3px solid var(--teal-bright); outline-offset: 2px; color: var(--ink);
}
.nav-link.is-active {
  color: var(--ink); background: rgba(8,124,133,.12);
  border-color: rgba(8,124,133,.35); box-shadow: inset 0 -2px 0 var(--teal);
}
.nav-link--etsy {
  background: var(--rust) !important; color: #fff !important;
  border-color: #8a4224 !important; padding: .45rem .9rem; margin-left: .25rem;
}
.nav-link--etsy:hover, .nav-link--etsy:focus-visible {
  background: #8a4224 !important; color: #fff !important;
}
.nav-toggle {
  display: none; background: #fff; border: 2px solid var(--ink);
  color: var(--ink); padding: .45rem .85rem; font: inherit; font-weight: 700;
}
.nav-toggle:focus-visible { outline: 3px solid var(--teal-bright); outline-offset: 2px; }
.hero { position: relative; background: #2d2418; color: #fff; overflow: hidden; }
.hero-art { width: 100%; display: block; min-height: 420px; }
.hero::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(180deg, rgba(45,36,24,.18) 0%, rgba(45,36,24,.55) 55%, rgba(45,36,24,.78) 100%);
}
.hero__content {
  position: absolute; inset: auto 0 0 0; z-index: 2; padding: 1.5rem 1.25rem 2rem;
  background: linear-gradient(to top, rgba(16,12,9,.92) 0%, rgba(16,12,9,.45) 55%, transparent 100%);
  max-width: 1200px; margin: 0 auto; right: 0; left: 0;
  width: min(1200px, 100%);
  box-sizing: border-box;
}
.hero__panel {
  max-width: 36rem;
  padding: 1.25rem 1.35rem 1.45rem;
  background: rgba(14,11,8,.9);
  border: 1px solid rgba(243,231,207,.45);
  box-shadow: 0 10px 32px rgba(0,0,0,.45);
  backdrop-filter: blur(3px);
}
.eyebrow { margin: 0 0 .65rem; }
.eyebrow__mark {
  display: inline-block; padding: .35rem .7rem;
  background: rgba(247,244,238,.98); color: var(--ink);
  font-size: .78rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  border: 1px solid rgba(243,231,207,.9);
}
.eyebrow__mark--ink {
  background: rgba(45,36,24,.06); border-color: rgba(45,36,24,.15); color: var(--ink);
}
.hero h1, .page-hero h1 {
  font-family: var(--font-display); font-weight: 700;
  font-size: clamp(2.15rem, 5.5vw, 3.35rem);
  line-height: 1.08; margin: 0 0 .45rem; color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,.65), 0 0 24px rgba(0,0,0,.35);
  letter-spacing: .01em;
}
.page-hero h1 { color: var(--ink); text-shadow: none; }
.hero__disciplines {
  margin: 0 0 .55rem; font-weight: 700; font-size: 1.05rem;
  letter-spacing: .04em; color: #f3e7cf;
}
.hero__support {
  font-family: var(--font-display); font-size: clamp(1.15rem, 2.6vw, 1.55rem);
  margin: 0 0 .9rem; color: #e8d9b8; font-weight: 600;
}
.lede { max-width: 40rem; font-size: 1.12rem; margin: 0 0 1.25rem; color: #f7f4ee; }
.page-hero .lede { color: #3a2f22; }
.hero__actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .65rem; max-width: 42rem; }
.btn {
  display: inline-flex; align-items: center; justify-content: center; min-height: 48px;
  padding: .7rem 1.1rem; border: 2px solid currentColor; text-decoration: none; font-weight: 700;
  color: #fff; background: rgba(20,16,12,.25);
}
.btn:hover { background: rgba(243,231,207,.16); }
.btn:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }
.btn--solid { background: #fff; color: var(--ink); border-color: #fff; }
.btn--solid:hover { background: var(--cream); color: var(--ink); }
.btn--solid-ink { background: var(--ink); color: #fff; border-color: var(--ink); }
.btn--solid-ink:hover { background: #1c1710; }
.btn--ghost { color: var(--ink); border-color: rgba(45,36,24,.4); background: transparent; }
.btn--ghost:hover { background: rgba(45,36,24,.06); }
.page-hero .btn--ghost, .brandstory .btn--ghost, .prose .btn--ghost { color: var(--ink); }
.trust {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
  background: var(--teal); color: #fff; text-align: center; padding: 1.25rem 5%;
  font-weight: 700;
}
.pillars, .brandstory, .page-hero, .gallery, .split, .prose, .secondary-links {
  max-width: 1200px; margin: 0 auto; padding: 3rem 1.25rem;
}
.pillars h2, .brandstory h2 {
  font-family: var(--font-display); text-align: center; color: var(--ink);
}
.page-hero h1 { text-align: left; }
.pillars h2 { font-size: clamp(2rem, 4vw, 3rem); margin: 0 0 2rem; }
.pillars__grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem;
}
.pillars__grid--three { grid-template-columns: repeat(3, 1fr); }
.pillar {
  position: relative; outline: 5px solid var(--accent, var(--rust)); background: #111; color: #fff;
  min-height: 400px; overflow: hidden; display: flex; flex-direction: column;
}
.pillar img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
.pillar__body {
  position: relative; margin-top: auto; padding: 1.35rem; z-index: 1;
  background: linear-gradient(to top, rgba(0,0,0,.94), rgba(0,0,0,.55) 55%, transparent);
}
.pillar h3 { font-family: var(--font-display); font-size: 1.7rem; margin: 0 0 .5rem; color: #fff; }
.pillar__note { font-size: .92rem; margin: 0 0 .85rem; color: #f3e7cf; }
.pillar__actions { display: flex; flex-direction: column; gap: .5rem; }
.pillar .btn { width: 100%; }
.secondary-links__grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
}
.secondary-card {
  display: flex; align-items: flex-end; min-height: 120px; padding: 1rem;
  text-decoration: none; color: var(--ink); font-weight: 700; font-family: var(--font-display);
  font-size: 1.35rem; background: var(--cream); border: 1px solid rgba(45,36,24,.14);
  position: relative; overflow: hidden;
}
.secondary-card img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .35;
}
.secondary-card span { position: relative; z-index: 1; }
.secondary-card:hover { border-color: var(--teal); color: var(--teal); }
.secondary-card:focus-visible { outline: 3px solid var(--teal-bright); outline-offset: 2px; }
.brandstory { text-align: center; }
.brandstory p { max-width: 40rem; margin: 0 auto 1.25rem; color: #3a2f22; }
.page-hero { text-align: left; }
.gallery {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem;
}
.gallery--portfolio { grid-template-columns: repeat(3, 1fr); }
.gallery figure { margin: 0; background: #fff; border: 1px solid rgba(45,36,24,.12); }
.gallery img { width: 100%; aspect-ratio: 4/3; object-fit: cover; }
.gallery figcaption { padding: .65rem .85rem; font-size: .9rem; color: #3a2f22; }
.portfolio-feature {
  max-width: 1200px; margin: 0 auto 2rem; padding: 0 1.25rem;
}
.portfolio-feature figure {
  display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.5rem; align-items: center;
  margin: 0; background: #fff; border: 1px solid rgba(45,36,24,.14);
}
.portfolio-feature img { width: 100%; height: 100%; object-fit: cover; aspect-ratio: 3/2; }
.portfolio-feature figcaption { padding: 1.25rem 1.5rem 1.5rem; }
.portfolio-feature h2 {
  font-family: var(--font-display); font-size: 2rem; margin: .35rem 0 .75rem; color: var(--ink);
}
.portfolio-card--featured { grid-column: 1 / -1; }
.portfolio-badge {
  display: inline-block; margin-top: .45rem; padding: .2rem .55rem;
  font-size: .72rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  background: rgba(165,82,46,.12); color: #7a3d22; border: 1px solid rgba(165,82,46,.3);
}
.formats-block { max-width: 42rem; margin: 0 auto 2rem; padding: 0 1.25rem; }
@media (max-width: 900px) {
  .portfolio-feature figure { grid-template-columns: 1fr; }
  .gallery--portfolio { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 640px) {
  .gallery--portfolio { grid-template-columns: 1fr; }
}
.split {
  display: grid; grid-template-columns: 1.1fr 1fr; gap: 2rem; align-items: center;
  max-width: 1200px; margin: 0 auto; padding: 0 1.25rem 2rem;
}
.checklist { padding-left: 1.1rem; color: #3a2f22; }
.prose { color: #3a2f22; }
.prose h2, .prose-inline h2, .split h2 {
  font-family: var(--font-display); color: var(--ink); font-size: 1.85rem;
}
.callout {
  background: rgba(196,163,90,.12); border: 1px solid rgba(165,82,46,.25);
  border-radius: 4px; margin-top: 0;
}
.event-section { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.event-intro { max-width: 42rem; }
.event-empty {
  margin-top: 1rem; padding: 1.25rem 1.35rem;
  background: #fff; border: 1px dashed rgba(45,36,24,.28);
}
.event-grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-top: 1rem;
}
.event-card {
  background: #fff; border: 1px solid rgba(45,36,24,.16); padding: 1.15rem 1.25rem;
}
.event-card h3 {
  font-family: var(--font-display); font-size: 1.45rem; margin: 0 0 .45rem; color: var(--ink);
}
.event-card__meta { margin: .15rem 0; font-weight: 700; color: #5a4a36; }
.event-card__badge {
  display: inline-block; margin: .65rem 0; padding: .2rem .55rem;
  font-size: .75rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  background: rgba(8,124,133,.12); color: var(--teal); border: 1px solid rgba(8,124,133,.28);
}
.contact-hub { max-width: 1200px; }
.contact-hub__choices {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; margin: 1rem 0 1.5rem;
}
.contact-hub__choice {
  text-align: left; background: #fff; border: 2px solid rgba(45,36,24,.18);
  padding: .9rem 1rem; font: inherit; cursor: pointer; color: var(--ink);
}
.contact-hub__choice strong { display: block; margin-bottom: .35rem; font-family: var(--font-display); font-size: 1.2rem; }
.contact-hub__choice span { font-size: .9rem; color: #5a4a36; }
.contact-hub__choice.is-active, .contact-hub__choice[aria-selected="true"] {
  border-color: var(--teal); background: rgba(8,124,133,.08);
}
.contact-hub__choice:focus-visible { outline: 3px solid var(--teal-bright); outline-offset: 2px; }
.bb-form {
  max-width: 42rem; background: #fff; border: 1px solid rgba(45,36,24,.16);
  padding: 1.25rem 1.35rem; display: grid; gap: .85rem;
}
.bb-form__grid { display: grid; grid-template-columns: 1fr 1fr; gap: .85rem; }
.bb-form label { display: grid; gap: .35rem; font-weight: 700; color: #3a2f22; }
.bb-form input, .bb-form select, .bb-form textarea {
  font: inherit; font-weight: 400; padding: .55rem .65rem;
  border: 1px solid rgba(45,36,24,.28); background: #fff; color: var(--ink);
}
.bb-form input:focus-visible, .bb-form select:focus-visible, .bb-form textarea:focus-visible {
  outline: 3px solid var(--teal-bright); outline-offset: 1px;
}
.bb-form__hint { margin: 0; font-weight: 400; font-size: .92rem; color: #5a4a36; }
.bb-form__check { display: flex; gap: .55rem; align-items: flex-start; font-weight: 600; }
.bb-form__check input { margin-top: .25rem; }
.bb-form__status { margin: 0; font-weight: 700; }
.bb-form__status.is-ok { color: var(--teal); }
.bb-form__status.is-err { color: #8a2424; }
.bb-form .hp { position: absolute; left: -9999px; height: 1px; width: 1px; overflow: hidden; }
.site-footer {
  background: #efe6d4; border-top: 1px solid rgba(45,36,24,.16); padding: 3rem 1.25rem 2rem;
}
.site-footer__grid {
  max-width: 1200px; margin: 0 auto 1.5rem; display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 2rem;
}
.site-footer h2, .site-footer h3 { font-family: var(--font-display); margin: 0 0 .75rem; color: var(--ink); }
.site-footer p { color: #3a2f22; }
.site-footer ul { list-style: none; padding: 0; margin: 0; }
.site-footer li { margin: .35rem 0; }
.site-footer a { color: var(--ink); text-decoration: none; font-weight: 700; }
.site-footer a:hover { color: var(--rust); }
.site-footer a:focus-visible { outline: 3px solid var(--teal-bright); outline-offset: 2px; }
.site-footer__note { max-width: 1200px; margin: 0 auto; font-size: .9rem; color: #3a2f22; }
@media (max-width: 960px) {
  .pillars__grid, .pillars__grid--three { grid-template-columns: 1fr 1fr; }
  .secondary-links__grid { grid-template-columns: 1fr 1fr; }
  .trust { grid-template-columns: 1fr; }
  .split, .site-footer__grid { grid-template-columns: 1fr; }
  .hero__actions { grid-template-columns: 1fr; }
}
@media (max-width: 780px) {
  .nav-toggle { display: inline-block; }
  .site-nav {
    display: none; width: 100%; flex-direction: column; align-items: stretch;
    padding: .5rem 0 1rem; gap: .35rem;
  }
  .site-nav.is-open { display: flex; }
  .site-header__inner { flex-wrap: wrap; }
  .nav-link, .nav-link--etsy { width: 100%; text-align: left; margin-left: 0; }
  .pillars__grid, .pillars__grid--three, .gallery, .secondary-links__grid { grid-template-columns: 1fr; }
  .brand__text { font-size: 1.15rem; }
  .hero__content { padding: 1rem .85rem 1.35rem; }
  .hero__panel { padding: 1rem 1rem 1.15rem; max-width: none; width: 100%; }
  .hero h1 { font-size: clamp(1.85rem, 8vw, 2.4rem); overflow-wrap: anywhere; }
  .hero__disciplines { font-size: .95rem; }
  .event-grid, .contact-hub__choices, .bb-form__grid { grid-template-columns: 1fr; }
}
`;

const JS = `document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  const tabRoot = document.querySelector('[data-bb-contact-tabs]');
  if (tabRoot) {
    const tabs = [...tabRoot.querySelectorAll('[data-bb-contact-tab]')];
    const panels = [...tabRoot.querySelectorAll('[data-bb-contact-panel]')];
    const activate = (id) => {
      tabs.forEach((t) => {
        const on = t.getAttribute('data-bb-contact-tab') === id;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach((p) => {
        const on = p.getAttribute('data-bb-contact-panel') === id;
        p.hidden = !on;
      });
    };
    tabs.forEach((t) => t.addEventListener('click', () => activate(t.getAttribute('data-bb-contact-tab'))));
    if (location.hash === '#start-custom-project') activate('project');
    if (location.hash === '#laser-intake') activate('laser');
  }

  // Try Pages /api/contact (Resend when secrets set); else native Shopify contact POST.
  document.querySelectorAll('form[data-bb-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      const status = form.querySelector('[data-bb-form-status]');
      if (form.querySelector('input[name="website"]')?.value) {
        e.preventDefault();
        return;
      }
      if (!form.reportValidity()) {
        e.preventDefault();
        if (status) {
          status.hidden = false;
          status.textContent = 'Please complete the required fields.';
          status.classList.add('is-err');
          status.classList.remove('is-ok');
        }
        return;
      }
      e.preventDefault();
      if (status) {
        status.hidden = false;
        status.textContent = 'Sending your request…';
        status.classList.add('is-ok');
        status.classList.remove('is-err');
      }
      const fd = new FormData(form);
      const payload = {};
      fd.forEach((v, k) => { if (typeof v === 'string') payload[k] = v; });
      payload.name = payload.name || payload['contact[name]'] || '';
      payload.email = payload.email || payload['contact[email]'] || '';
      payload.phone = payload.phone || payload['contact[phone]'] || '';
      payload.message = payload.message || payload['contact[body]'] || '';
      payload.subject = payload.subject || payload['contact[Subject]'] || '';
      payload.description = payload.description || payload['contact[body]'] || '';
      payload.product_category = payload.product_category || payload['contact[product_category]'] || '';
      payload.additional_notes = payload.additional_notes || payload['contact[additional_notes]'] || '';
      payload.size = payload.size || payload['contact[size]'] || '';
      payload.colors = payload.colors || payload['contact[colors]'] || '';
      payload.quantity = payload.quantity || payload['contact[quantity]'] || '';
      payload.budget_range = payload.budget_range || payload['contact[budget_range]'] || '';
      payload.needed_by = payload.needed_by || payload['contact[needed_by]'] || '';
      payload.preferred_contact = payload.preferred_contact || payload['contact[preferred_contact]'] || '';
      payload.project_type = payload.project_type || payload['contact[project_type]'] || '';
      payload.requested_item = payload.requested_item || payload['contact[requested_item]'] || '';
      payload.approximate_size = payload.approximate_size || payload['contact[approximate_size]'] || '';
      payload.body = payload['contact[body]'] || payload.message || '';
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          if (status) {
            status.textContent = 'Thank you — your request was sent. We will reply by email.';
            status.classList.add('is-ok');
            status.classList.remove('is-err');
          }
          form.reset();
          return;
        }
        if (res.status === 503 || data.shopifyBridgeStatus) {
          form.submit();
          return;
        }
        throw new Error(data.error || 'Submission failed');
      } catch (err) {
        try {
          form.submit();
        } catch (_) {
          if (status) {
            status.textContent = 'Could not send through the website. Please email backcountrytiedye@gmail.com.';
            status.classList.add('is-err');
            status.classList.remove('is-ok');
          }
        }
      }
    });
  });
});
`;

const DEPLOY_MD = `# Cloudflare Pages deployment — Bitter Buffalo Art

## What this is
Independent static website (no Shopify checkout, cart, or Liquid runtime).
Commerce CTAs open \`${ETSY}\`.

## Source directory
Deploy **only** \`cloudflare-pages/\` (must contain \`index.html\` + \`assets/\`).

## GitHub (source of truth)
Repository: https://github.com/bitterbuffaloart/bitter-buffalo-art-website  
(Do **not** use \`bitterbuffaloart/BitterBuffaloArt\` — that is Art Builder.)

Cloudflare Pages Git settings (when connected):
- Production branch: \`main\`
- Root directory: \`cloudflare-pages\`
- Build command: *(empty — commit built static files)*
- Output directory: *(empty / \`/\`)*

## Preview deploy (no DNS change)
\`\`\`bat
cd path\\to\\cloudflare-pages
deploy-preview.cmd
\`\`\`

Or:
\`\`\`powershell
$env:CLOUDFLARE_ACCOUNT_ID='f3ee68d66369fd4b2bc390d1dae218f6'
npx wrangler pages deploy . --project-name=bitter-buffalo-art --branch=main --commit-dirty=true
\`\`\`

Project: \`bitter-buffalo-art\`  
Preview: https://bitter-buffalo-art.pages.dev/

## Production cutover (OWNER APPROVAL REQUIRED)
1. Confirm pages.dev preview on desktop + mobile.
2. Cloudflare Pages → Custom domains → add \`bitterbuffaloart.com\` and \`www\`.
3. Update DNS from Shopify A/CNAME to Pages targets.
4. Keep Shopify online until verified; do not cancel Shopify in the same step.
5. Do **not** delete existing Cloudflare Workers.

## Rollback
- DNS: apex A \`23.227.38.65\` / Shopify AAAA; \`www\` CNAME \`shops.myshopify.com\` (proxied: false).
- Shopify MAIN theme \`155995406503\` remains live until DNS moves.
- PREVIEW2 theme \`157462167719\` remains unpublished.
`;

const MAINTENANCE_MD = `# Website maintenance guide (for ChatGPT / assistants)

Use this after Cursor access ends. Work only on the static website—not Art Builder, Trout, Lightroom, or Shopify DNS unless Clyde explicitly asks.

## Locations
| Item | Path / URL |
|------|------------|
| Local work copy | \`C:\\\\Users\\\\bitte\\\\bitter-buffalo-website-etsy-update-2026-10-17\\\\cloudflare-pages\` |
| Repo archive | \`project-record/website-etsy-update-2026-10-17/\` in BitterBuffaloArt |
| Builder script | \`../working/build-static-site.js\` (from cloudflare-pages) |
| Live domain (Shopify until cutover) | https://bitterbuffaloart.com |
| Cloudflare Pages preview | https://bitter-buffalo-art.pages.dev/ |
| Pages project | \`bitter-buffalo-art\` (account \`f3ee68d66369fd4b2bc390d1dae218f6\`) |
| Etsy shop | https://www.etsy.com/shop/BitterBuffaloArt |
| Git branch | \`art-builder-ui-rebuild-local-2026-09-03\` |

## Safe edit workflow
1. Edit \`working/build-static-site.js\` (preferred) or HTML/CSS under \`cloudflare-pages/\`.
2. Rebuild: \`node working/build-static-site.js\` from the migration folder.
3. Preview locally if needed (\`npx serve cloudflare-pages -l 4173\`).
4. Deploy: \`cloudflare-pages\\\\deploy-preview.cmd\` (requires \`npx wrangler login\` once).
5. Commit **only** files under \`project-record/website-etsy-update-2026-10-17/\`.
6. Push development branch. Do not change production DNS without approval.

## Content rules
- All purchase CTAs → verified Etsy shop URL unless an individual listing URL is independently verified.
- Do not invent event history, booth photos, or product inventory.
- Engraved aspen rounds = decorative artwork only (not food-safe / not cutting boards).
- Photography: prefer portfolio wording until print listings are verified.
- Never reintroduce Shopify cart, Free Shipping promos, Ground Builder, or Union Peaks giveaways.
- Events stays a top-level nav item (calendar + vendor record).
- Hero SVG editable source: \`working/assets/hero-highcountry.svg\` (copied to \`assets/images/\`).

## Contact / custom-order forms
Original system = Shopify theme contact forms (\`form_type=contact\`) on \`/pages/contact\` and laser intake.
While Shopify hosts the live store, static forms POST to \`https://bitterbuffaloart.com/contact\`.
Cloudflare-only delivery (after cutover): set Pages secrets \`RESEND_API_KEY\`, \`CONTACT_TO_EMAIL\`, \`CONTACT_FROM_EMAIL\` and wire \`functions/api/contact.js\`.
Do not commit API keys. Reference photo upload was never enabled on the original Shopify Forms block.

## Navigation (canonical)
Home | Photography | Shop | Tie-Dye | Laser Art | Custom Art | Events | About | Contact | Shop Etsy

## Hard restrictions
No production DNS changes, Shopify cancel, PREVIEW2 publish, Worker deletion, Lightroom/archive edits, or unrelated art-builder changes unless Clyde authorizes.
`;

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
