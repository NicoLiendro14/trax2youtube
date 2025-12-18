import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BROWSERS = ['chrome', 'firefox'];
const SRC_FILES = ['background.js', 'content.js', 'popup', 'icons'];

function parseArgs() {
  const args = process.argv.slice(2);
  const browserIdx = args.indexOf('--browser');

  if (browserIdx !== -1 && args[browserIdx + 1]) {
    const browser = args[browserIdx + 1].toLowerCase();
    if (browser === 'all') return BROWSERS;
    if (BROWSERS.includes(browser)) return [browser];
    console.error(`Unknown browser: ${browser}. Use: chrome, firefox, or all`);
    process.exit(1);
  }

  return BROWSERS;
}

function deepMerge(target, source, replaceKeys = ['background']) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (replaceKeys.includes(key)) {
      result[key] = source[key];
    } else if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key], replaceKeys);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function createZip(sourceDir, zipPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function build(browser) {
  console.log(`\nBuilding for ${browser}...`);

  const distDir = path.join(rootDir, 'dist', browser);
  const srcDir = path.join(rootDir, 'src');

  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  for (const file of SRC_FILES) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(distDir, file);

    if (fs.existsSync(srcPath)) {
      copyRecursive(srcPath, destPath);
    }
  }

  const baseManifest = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'manifests', 'base.json'), 'utf8')
  );
  const browserOverrides = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'manifests', `${browser}.json`), 'utf8')
  );

  const manifest = deepMerge(baseManifest, browserOverrides);
  fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const version = manifest.version;
  const zipName = `trax2youtube-${browser}-v${version}.zip`;
  const zipPath = path.join(rootDir, 'dist', zipName);

  await createZip(distDir, zipPath);

  console.log(`  ✓ ${browser} build complete`);
  console.log(`    → dist/${browser}/`);
  console.log(`    → dist/${zipName}`);
}

const browsers = parseArgs();
console.log('Trax2YouTube Build System');
console.log('=========================');

(async () => {
  for (const browser of browsers) {
    await build(browser);
  }
  console.log('\nDone!');
})();
