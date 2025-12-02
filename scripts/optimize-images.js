const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const names = ['home','littledrop','whereis','drawstring','stardust','bonk','flappybook','shorely'];
const sizes = [480, 720, 1080, 1600];

async function optimize() {
  const dir = path.resolve(__dirname, '..', 'images');
  for (const name of names) {
    const inPath = path.join(dir, `${name}-screenshot.png`);
    if (!fs.existsSync(inPath)) {
      console.warn('Missing input', inPath);
      continue;
    }

    // Produce a square PNG fallback (1600x1600) by center-cropping the original image.
    const squarePng = path.join(dir, `${name}-screenshot.png`);
    const tmpPng = path.join(dir, `${name}-screenshot.tmp.png`);
    try {
      await sharp(inPath)
        .resize({ width: 1600, height: 1600, fit: 'cover', position: 'centre' })
        .png({ quality: 90 })
        .toFile(tmpPng);
      // rename (atomic-ish) to avoid writing to same input simultaneously
      fs.renameSync(tmpPng, squarePng);
      console.log('Wrote square PNG', squarePng);
    } catch (err) {
      if (fs.existsSync(tmpPng)) fs.unlinkSync(tmpPng);
      console.warn('Failed to write square PNG for', name, err.message);
    }

    // Now generate square webp variants at different widths/heights
    for (const w of sizes) {
      const outWebp = path.join(dir, `${name}-${w}.webp`);
      await sharp(inPath)
        .resize({ width: w, height: w, fit: 'cover', position: 'centre' })
        .webp({ quality: 80 })
        .toFile(outWebp);
      console.log('Wrote', outWebp);
    }
  }
}

optimize().catch(err => {
  console.error('Optimize failed', err);
  process.exit(1);
});
