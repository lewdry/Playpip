const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [480, 720, 1080, 1600];

async function optimizeOne(name) {
  const dir = path.resolve(__dirname, '..', 'images');
  const inPath = path.join(dir, `${name}-screenshot.png`);
  if (!fs.existsSync(inPath)) {
    console.warn('Missing input', inPath);
    return;
  }

  // write a rectangular PNG fallback (1600x1000) to tmp then rename
  const tmpPng = path.join(dir, `${name}-screenshot.tmp.png`);
  const outPng = path.join(dir, `${name}-screenshot.png`);
  try {
    await sharp(inPath)
      .resize({ width: 1600, height: 1000, fit: 'cover', position: 'centre' })
      .png({ quality: 90 })
      .toFile(tmpPng);
    fs.renameSync(tmpPng, outPng);
    console.log('Wrote rectangular PNG', outPng);
  } catch (err) {
    if (fs.existsSync(tmpPng)) fs.unlinkSync(tmpPng);
    console.warn('Failed rectangular PNG for', name, err.message);
  }

  // generate rectangular webp variants
  for (const w of sizes) {
    const h = Math.round(w * 1000 / 1600);
    const outWebp = path.join(dir, `${name}-${w}.webp`);
    await sharp(inPath)
      .resize({ width: w, height: h, fit: 'cover', position: 'centre' })
      .webp({ quality: 80 })
      .toFile(outWebp);
    console.log('Wrote', outWebp, `(${w}x${h})`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/optimize-single.js <name> [<name> ...]');
    process.exit(2);
  }

  for (const name of args) {
    await optimizeOne(name);
  }
}

main().catch(err => {
  console.error('optimize-single failed', err);
  process.exit(1);
});
