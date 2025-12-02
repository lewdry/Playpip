const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function captureBonk() {
  const outDir = path.resolve(__dirname, '..', 'images');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
    const url = 'https://bonk.playpip.games';
    console.log('Opening', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Try clicking a 'Start' button / element that looks like it begins the game.
    // We'll search for an element with exact text 'Start' or matching common button classes.
    const clickSelectors = [
      'button',
      'a',
      '[role="button"]',
      '.start',
      '.btn',
      '.play',
      '#start'
    ];

    let clicked = false;
    for (const sel of clickSelectors) {
      try {
        const elements = await page.$$(sel);
        for (const el of elements) {
          const text = (await page.evaluate(el => el.innerText || el.textContent || '', el)).trim();
          if (!text) continue;
          // match common 'Start' keywords
          if (/^start$/i.test(text) || /start game/i.test(text) || /play/i.test(text)) {
            console.log('Clicking element:', sel, 'with text:', text);
            await el.click({delay: 50});
            clicked = true;
            break;
          }
        }
      } catch (e) {
        // ignore selector errors
      }
      if (clicked) break;
    }

    // If not clicked, try xpath text search
    if (!clicked) {
      try {
        const [btn] = await page.$x("//*[text()[contains(., 'Start') or contains(., 'start') or contains(., 'Play') or contains(., 'play')]]");
        if (btn) {
          console.log('Clicking xpath Start element');
          await btn.click({delay: 50});
          clicked = true;
        }
      } catch (e) {}
    }

    // Allow some time for the game to start and visuals to settle
    if (clicked) await new Promise(resolve => setTimeout(resolve, 1000));

    // hide overlays best-effort
    try {
      await page.evaluate(() => {
        document.querySelectorAll('[role="dialog"], .cookie, .cookie-banner, .consent, .cookie-consent').forEach(el => el.style.display = 'none');
      });
    } catch (e) {}

    const outPath = path.join(outDir, 'bonk-screenshot.png');
    await page.screenshot({ path: outPath, fullPage: false });
    console.log('Saved', outPath, 'clicked:', clicked);
  } finally {
    await page.close();
    await browser.close();
  }
}

captureBonk().catch(err => {
  console.error('Failed to capture Bonk:', err);
  process.exit(1);
});
