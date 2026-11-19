// usage: node bite_card.mjs <data.json> <out.png>   (data = {spot, day} from bite_data.mjs)
// Needs playwright-core + a Chromium. Set PLAYWRIGHT_CORE / CHROMIUM_PATH if not in the default places.
import { createRequire } from "module";
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const here = path.dirname(fileURLToPath(import.meta.url));
const cands = [process.env.PLAYWRIGHT_CORE, path.join(here, "../package.json"), process.env.HOME + "/Projects/verslag-assistent/package.json"].filter(Boolean);
let chromium;
for (const c of cands) { try { chromium = createRequire(c.endsWith(".json") ? c : c + "/package.json")("playwright-core").chromium; break; } catch {} }
if (!chromium) { console.error("playwright-core not found"); process.exit(2); }
const [dataFile, out] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
let executablePath = process.env.CHROMIUM_PATH;
if (!executablePath) {
  const root = process.env.HOME + "/Library/Caches/ms-playwright";
  try { const d = fs.readdirSync(root).filter(x => x.startsWith("chromium-")).sort().pop();
    const p = `${root}/${d}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`; if (fs.existsSync(p)) executablePath = p; } catch {}
}
const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
await page.addInitScript(d => { window.DATA = d; }, data);
await page.goto("file://" + path.join(here, "bite_card.html"));
await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
await page.screenshot({ path: out, type: out.endsWith(".png") ? "png" : "jpeg", quality: out.endsWith(".png") ? undefined : 94 });
await browser.close();
