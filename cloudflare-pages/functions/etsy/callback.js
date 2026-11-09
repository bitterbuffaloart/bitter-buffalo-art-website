// Etsy OAuth callback handoff.
//
// This endpoint deliberately does not exchange codes or store credentials. The
// local Guardian service owns the PKCE verifier, validates state, and performs
// the token exchange. The page is a short-lived, owner-controlled handoff.

const HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
};

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Etsy authorization handoff</title>
<style>
  :root { color-scheme: light dark; font: 16px system-ui, sans-serif; }
  body { max-width: 52rem; margin: 3rem auto; padding: 0 1rem; line-height: 1.5; }
  code, textarea { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
  textarea { width: 100%; min-height: 7rem; box-sizing: border-box; }
  button { padding: .65rem 1rem; font-weight: 600; cursor: pointer; }
  .warning { color: #9a3412; }
</style>
</head>
<body>
<h1>Etsy authorization received</h1>
<p id="status">Preparing a one-time handoff for the local Guardian service…</p>
<section id="handoff" hidden>
  <p>Copy this complete callback response and paste it into Guardian. Do not send it to anyone else.</p>
  <textarea id="response" readonly aria-label="One-time Etsy callback response"></textarea>
  <p><button id="copy" type="button">Copy callback response</button> <span id="copied" role="status"></span></p>
  <p class="warning">This response is single-use. Guardian will validate the state and PKCE verifier locally. Close this tab after copying.</p>
</section>
<script>
(() => {
  const status = document.getElementById('status');
  const handoff = document.getElementById('handoff');
  const response = document.getElementById('response');
  const copy = document.getElementById('copy');
  const copied = document.getElementById('copied');
  const original = window.location.href;
  const params = new URLSearchParams(window.location.search);
  const hasCode = Boolean(params.get('code'));
  const hasError = Boolean(params.get('error'));
  if (!hasCode && !hasError) {
    status.textContent = 'No Etsy authorization response was supplied.';
  } else {
    // Remove the query from browser history immediately. The value remains in
    // memory only long enough for the owner to copy it into Guardian.
    response.value = original;
    window.history.replaceState({}, document.title, window.location.pathname);
    handoff.hidden = false;
    status.textContent = hasCode ? 'Authorization code received. Copy it into Guardian.' : 'Etsy returned an authorization error. Copy it into Guardian for diagnosis.';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(response.value);
        copied.textContent = 'Copied.';
      } catch {
        response.focus();
        response.select();
        copied.textContent = 'Clipboard access was unavailable; use Ctrl+C.';
      }
    });
  }
})();
</script>
</body>
</html>`;

export async function onRequest({ request }) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { ...HEADERS, Allow: 'GET' },
    });
  }
  return new Response(PAGE, { status: 200, headers: HEADERS });
}
