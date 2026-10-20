import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../cloudflare-pages");
const expected = ["Home", "Shop", "Tie-Dye", "Photography", "Sketchbook", "Custom Art", "Events", "About"];
const hrefs = ["/", "/shop/", "/tie-dye/", "/photography/", "/sketchbook/", "/custom/", "/events/", "/about/"];

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const path = resolve(dir, name);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else if (name.endsWith(".html")) files.push(path);
  }
  return files;
}

test("every public page uses the same eight-item header", () => {
  const files = walk(root);
  assert.ok(files.length > 8);
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    const nav = html.slice(html.indexOf('<nav id="site-nav"'), html.indexOf("</nav>"));
    assert.notEqual(nav.indexOf('<nav id="site-nav"'), -1, file);
    const labels = [...nav.matchAll(/>([^<]+)<\/a>/g)].map((match) => match[1]);
    const links = [...nav.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(labels, expected, file);
    assert.deepEqual(links, hrefs, file);
    assert.equal(nav.includes("Shop Etsy"), false, file);
    assert.equal(nav.includes("Laser Art"), false, file);
    assert.equal(nav.includes("Contact"), false, file);
  }
});

test("local asset paths in public HTML exist", () => {
  const files = walk(root);
  const missing = [];
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    const refs = [...html.matchAll(/\b(?:src|href|srcset)="([^"]+)"/g)].map((match) => match[1]);
    for (const ref of refs) {
      const path = ref.split(/[?#]/)[0];
      if (!path.startsWith("/assets/") && !path.startsWith("/assets".slice(0))) continue;
      if (!path.startsWith("/assets/")) continue;
      const target = resolve(root, path.slice(1));
      try {
        if (!statSync(target).isFile()) missing.push(`${file} ${path}`);
      } catch {
        missing.push(`${file} ${path}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});
