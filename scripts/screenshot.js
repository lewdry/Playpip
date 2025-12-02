const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const targets = [
  { url: 'https://home.playpip.games', name: 'home' },
  { url: 'https://lewdry.github.io/littledrop', name: 'littledrop' },
  { url: 'https://whereis.playpip.games', name: 'whereis' },
  { url: 'https://drawstring.playpip.games', name: 'drawstring' },
  { url: 'https://stardust.playpip.games', name: 'stardust' },
  { url: 'https://bonk.playpip.games', name: 'bonk' },
  { url: 'https://flappybook.playpip.games', name: 'flappybook' },
  { url: 'https://shorely.playpip.games', name: 'shorely' }
];

async function takeScreenshots() {
  const imagesDir = path.resolve(__dirname, '..', 'images');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    for (const t of targets) {
      const page = await browser.newPage();
      // Large desktop viewport so we get a good quality screenshot
      await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
      console.log('Loading', t.url);
      try {
        // navigate and wait until network appears idle
        await page.goto(t.url, { waitUntil: 'networkidle2', timeout: 30000 });
      } catch (err) {
        console.warn('Navigation failed for', t.url, '-', err.message);
      }

      // attempt to hide any cookie banners or large fixed overlays (best-effort)
      try {
        await page.evaluate(() => {
          document.querySelectorAll('[role="dialog"], .cookie, .cookie-banner, .consent, .cookie-consent').forEach(el => el.style.display = 'none');
        });
      } catch (e) {}

      const out = path.join(imagesDir, `${t.name}-screenshot.png`);
      await page.screenshot({ path: out, fullPage: false });
      console.log('Saved', out);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

takeScreenshots().catch(err => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
