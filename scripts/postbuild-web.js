const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcNext = path.join(rootDir, 'apps', 'web', '.next');
const destNext = path.join(rootDir, '.next');
const srcPublic = path.join(rootDir, 'apps', 'web', 'public');
const destPublic = path.join(rootDir, 'public');

try {
  if (fs.existsSync(srcNext)) {
    fs.cpSync(srcNext, destNext, { recursive: true, force: true });
    console.log(`[postbuild-web] Successfully synced .next to root: ${destNext}`);
  } else {
    console.warn(`[postbuild-web] Warning: ${srcNext} not found.`);
  }

  if (fs.existsSync(srcPublic)) {
    fs.cpSync(srcPublic, destPublic, { recursive: true, force: true });
    console.log(`[postbuild-web] Successfully synced public assets to root: ${destPublic}`);
  }
} catch (err) {
  console.error('[postbuild-web] Error copying build artifacts:', err);
}
