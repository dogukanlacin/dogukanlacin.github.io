const fs = require('fs');
const path = require('path');

const rootDir = path.resolve('c:/Users/user/Desktop/Yaptığım programlar/blog');
const templateHtml = fs.readFileSync(path.join(rootDir, 'post-template.html'), 'utf8');
const postJs = fs.readFileSync(path.join(rootDir, 'assets', 'post.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(rootDir, 'assets', 'style.css'), 'utf8');

const tests = [];
function test(name, fn) {
  try {
    fn();
    tests.push({ name, pass: true });
    console.log(`PASS: ${name}`);
  } catch (err) {
    tests.push({ name, pass: false, error: err.message });
    console.error(`FAIL: ${name} -> ${err.message}`);
  }
}

// 1. Template HTML DOM Elements & ARIA checks
test('post-template.html contains Okuma Ayarları button', () => {
  if (!templateHtml.includes('id="btn-reading-settings"')) throw new Error('btn-reading-settings missing');
  if (!templateHtml.includes('aria-controls="reading-settings-panel"')) throw new Error('aria-controls missing');
  if (!templateHtml.includes('aria-expanded="false"')) throw new Error('aria-expanded missing');
  if (!templateHtml.includes('aria-haspopup="dialog"')) throw new Error('aria-haspopup missing');
});

test('post-template.html contains reading-settings-panel with all 3 setting sections', () => {
  if (!templateHtml.includes('id="reading-settings-panel"')) throw new Error('reading-settings-panel missing');
  if (!templateHtml.includes('role="dialog"')) throw new Error('role="dialog" missing');
  if (!templateHtml.includes('id="btn-close-settings"')) throw new Error('btn-close-settings missing');
  if (!templateHtml.includes('data-setting="font-size"')) throw new Error('font-size buttons missing');
  if (!templateHtml.includes('data-setting="line-height"')) throw new Error('line-height buttons missing');
  if (!templateHtml.includes('data-setting="content-width"')) throw new Error('content-width buttons missing');
});

test('post-template.html has exactly 4 font size options (15px, 17px, 19px, 21px)', () => {
  const sizes = ['15px', '17px', '19px', '21px'];
  sizes.forEach(s => {
    if (!templateHtml.includes(`data-setting="font-size" data-val="${s}"`)) {
      throw new Error(`Missing font size button for ${s}`);
    }
  });
});

test('post-template.html has exactly 3 line height options (1.75, 1.95, 2.15)', () => {
  const lh = ['1.75', '1.95', '2.15'];
  lh.forEach(h => {
    if (!templateHtml.includes(`data-setting="line-height" data-val="${h}"`)) {
      throw new Error(`Missing line height button for ${h}`);
    }
  });
});

test('post-template.html has exactly 3 content width options (640px, 760px, 880px)', () => {
  const w = ['640px', '760px', '880px'];
  w.forEach(width => {
    if (!templateHtml.includes(`data-setting="content-width" data-val="${width}"`)) {
      throw new Error(`Missing content width button for ${width}`);
    }
  });
});

test('post-template.html retains existing A- and A+ controls and indicator', () => {
  if (!templateHtml.includes('id="btn-font-decrease"')) throw new Error('btn-font-decrease missing');
  if (!templateHtml.includes('id="btn-font-increase"')) throw new Error('btn-font-increase missing');
  if (!templateHtml.includes('id="font-size-indicator"')) throw new Error('font-size-indicator missing');
});

test('post-template.html early loading script covers dl_theme, dl_font_size, dl_line_height, and dl_content_width', () => {
  if (!templateHtml.includes('localStorage.getItem(\'dl_theme\')')) throw new Error('dl_theme early load missing');
  if (!templateHtml.includes('localStorage.getItem(\'dl_font_size\')')) throw new Error('dl_font_size early load missing');
  if (!templateHtml.includes('localStorage.getItem(\'dl_line_height\')')) throw new Error('dl_line_height early load missing');
  if (!templateHtml.includes('localStorage.getItem(\'dl_content_width\')')) throw new Error('dl_content_width early load missing');
});

// 2. CSS Styles Checks
test('style.css defines all required CSS variables on :root', () => {
  if (!styleCss.includes('--post-body-font-size: 17px;')) throw new Error('--post-body-font-size missing in :root');
  if (!styleCss.includes('--post-body-line-height: 1.95;')) throw new Error('--post-body-line-height missing in :root');
  if (!styleCss.includes('--post-content-width: 760px;')) throw new Error('--post-content-width missing in :root');
});

test('style.css applies content width to .post-container with min(..., 100%)', () => {
  if (!styleCss.includes('max-width: min(var(--post-content-width, 760px), 100%);')) {
    throw new Error('post-container max-width with min(..., 100%) missing');
  }
});

test('style.css applies content width to focus mode as well', () => {
  if (!styleCss.includes('body.focus-mode .post-container')) {
    throw new Error('focus-mode .post-container missing');
  }
});

test('style.css contains complete styles for reading-settings-panel (Noir & Sepia)', () => {
  if (!styleCss.includes('.reading-settings-panel {')) throw new Error('.reading-settings-panel missing');
  if (!styleCss.includes('html[data-dl-theme="sepia"] .reading-settings-panel')) throw new Error('Sepia panel style missing');
  if (!styleCss.includes('.settings-segment-btn')) throw new Error('.settings-segment-btn missing');
  if (!styleCss.includes('.settings-segment-btn.active')) throw new Error('.settings-segment-btn.active missing');
  if (!styleCss.includes('html[data-dl-theme="sepia"] .settings-segment-btn.active')) throw new Error('Sepia active segment missing');
});

test('style.css mobile media query ensures reading-settings-panel does not overflow', () => {
  if (!styleCss.includes('@media (max-width: 700px)')) throw new Error('Mobile media query missing');
  if (!styleCss.includes('width: 100%;\n    max-width: 100%;')) {
    // Check if within mobile query
    const mobileIdx = styleCss.indexOf('@media (max-width: 700px)');
    const mobileBlock = styleCss.substring(mobileIdx, mobileIdx + 1200);
    if (!mobileBlock.includes('.reading-settings-panel')) {
      throw new Error('Mobile media query does not style .reading-settings-panel');
    }
  }
});

// 3. post.js Logic & Independence Simulation
test('post.js implements initReadingSettings with independent controls', () => {
  if (!postJs.includes('function initReadingSettings()')) throw new Error('initReadingSettings function missing');
  if (!postJs.includes('storage.set(\'dl_font_size\',')) throw new Error('dl_font_size storage missing');
  if (!postJs.includes('storage.set(\'dl_line_height\',')) throw new Error('dl_line_height storage missing');
  if (!postJs.includes('storage.set(\'dl_content_width\',')) throw new Error('dl_content_width storage missing');
  if (!postJs.includes('initReadingSettings();')) throw new Error('initReadingSettings call in init() missing');
});

test('post.js does NOT couple font size changes with line height changes', () => {
  // Check applyFontSize in postJs
  const applyFontIdx = postJs.indexOf('function applyFontSize(');
  const applyFontEnd = postJs.indexOf('function applyLineHeight(');
  const applyFontFn = postJs.substring(applyFontIdx, applyFontEnd);
  if (applyFontFn.includes('--post-body-line-height')) {
    throw new Error('applyFontSize should NOT modify --post-body-line-height!');
  }
});

test('post.js supports ESC key capture to close settings panel without closing focus mode prematurely', () => {
  if (!postJs.includes('e.key === \'Escape\' && isPanelOpen()')) {
    throw new Error('Escape key handler for settings panel missing');
  }
});

console.log('\n--- Test Summary ---');
const failed = tests.filter(t => !t.pass);
console.log(`Total tests: ${tests.length}, Passed: ${tests.length - failed.length}, Failed: ${failed.length}`);
if (failed.length > 0) {
  process.exit(1);
}
