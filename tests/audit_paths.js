/**
 * TEST: Audit Paths (Static Analysis)
 * Verifies that all files referenced in manifest.json and HTML files actually exist.
 * Run with: node tests/audit_paths.js
 */

const fs = require('fs');
const path = require('path');
const { exit } = require('process');

const ROOT_DIR = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT_DIR, 'manifest.json');

console.log('🔍 Starting Path Audit...');

// Helpers
function fileExists(relPath) {
  const absPath = path.join(ROOT_DIR, relPath);
  return fs.existsSync(absPath);
}

function check(relPath, sourceName) {
  if (!fileExists(relPath)) {
    console.error(`❌ BROKEN LINK in [${sourceName}]: ${relPath} not found.`);
    return false;
  }
  console.log(`   ✅ Link OK: ${relPath}`);
  return true;
}

let allPassed = true;

// 1. Check Manifest
if (!fileExists('manifest.json')) {
  console.error('❌ CRITICAL: manifest.json not found in root.');
  exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
console.log('📄 Checking manifest.json...');

if (manifest.background && manifest.background.service_worker) {
  allPassed = check(manifest.background.service_worker, 'manifest.background') && allPassed;
}
if (manifest.side_panel && manifest.side_panel.default_path) {
  allPassed = check(manifest.side_panel.default_path, 'manifest.side_panel') && allPassed;
}
if (manifest.options_ui && manifest.options_ui.page) {
  allPassed = check(manifest.options_ui.page, 'manifest.options_ui') && allPassed;
}
if (manifest.icons) {
  Object.values(manifest.icons).forEach(iconPath => {
    allPassed = check(iconPath, 'manifest.icons') && allPassed;
  });
}

// 2. Check HTML Files (Scripts and CSS)
const htmlFiles = ['sidepanel.html', 'options.html']; // Add others if needed source files

htmlFiles.forEach(fileName => {
  // Determine if file is in root or src (during migration)
  let filePath = fileName;
  if (!fileExists(filePath)) {
     // Check if it moved to src
     if (fileExists(`src/${fileName}`)) {
         filePath = `src/${fileName}`;
     } else {
         console.warn(`⚠️  HTML file ${fileName} not found (might be intentional if moving). Skipping scan.`);
         return;
     }
  }

  const content = fs.readFileSync(path.join(ROOT_DIR, filePath), 'utf8');
  console.log(`📄 Checking ${filePath}...`);
  
  // Regex to find src="..." or href="..."
  // Very basic regex, can be improved but sufficient for this static check
  const refRegex = /(?:src|href)=["']([^"']+)["']/g;
  let match;
  
  // Need to resolve relative paths in HTML to project root
  const fileDir = path.dirname(filePath);

  while ((match = refRegex.exec(content)) !== null) {
      const ref = match[1];
      if (ref.startsWith('http') || ref.startsWith('#') || ref.startsWith('chrome:')) continue;
      
      // Resolve relative to the HTML file
      // e.g. "styles.css" inside "src/sidepanel.html" -> "src/styles.css"
      const absPath = path.join(ROOT_DIR, fileDir, ref);
      const relPath = path.relative(ROOT_DIR, absPath);

      allPassed = check(relPath, filePath) && allPassed;
  }
});

if (!allPassed) {
  console.error('\n💥 VALIDATION FAILED: Fix broken links before committing.');
  exit(1);
} else {
  console.log('\n✅ AUDIT PASSED: All paths verify.');
  exit(0);
}
