const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../node_modules/@mediapipe/tasks-vision/package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.exports && pkg.exports.import) {
    const oldExports = pkg.exports;
    pkg.exports = {
      ".": {
        "import": oldExports.import,
        "require": oldExports.require,
        "default": oldExports.default,
        "types": oldExports.types
      }
    };
    for (const key in oldExports) {
      if (key !== 'import' && key !== 'require' && key !== 'default' && key !== 'types') {
        pkg.exports[key] = oldExports[key];
      }
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('[Patch] Successfully patched @mediapipe/tasks-vision package.json exports');
  } else {
    console.log('[Patch] @mediapipe/tasks-vision package.json already patched or has different format');
  }
} else {
  console.log('[Patch] @mediapipe/tasks-vision package.json not found... skipping');
}
