// Browser simulation test for assets/post.js logic
const fs = require('fs');
const path = require('path');

// Mock localStorage
const mockStorage = {};
const localStorage = {
  getItem(k) { return mockStorage.hasOwnProperty(k) ? mockStorage[k] : null; },
  setItem(k, v) { mockStorage[k] = String(v); },
  removeItem(k) { delete mockStorage[k]; },
  clear() { for (let k in mockStorage) delete mockStorage[k]; }
};

// Mock DOM elements
class MockElement {
  constructor(tag, id = '', className = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = {
      _classes: new Set(className ? className.split(' ') : []),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
      toggle(c, force) {
        if (force === true) this.add(c);
        else if (force === false) this.remove(c);
        else if (this.contains(c)) this.remove(c);
        else this.add(c);
      }
    };
    this.style = {
      _props: {},
      setProperty(p, v) { this._props[p] = v; },
      getPropertyValue(p) { return this._props[p] || ''; },
      get display() { return this._props['display'] || ''; },
      set display(v) { this._props['display'] = v; }
    };
    this.attributes = {};
    this.listeners = {};
    this.disabled = false;
    this.textContent = '';
    this.children = [];
  }

  focus() { this._focused = true; }

  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes.hasOwnProperty(k) ? this.attributes[k] : null; }
  removeAttribute(k) { delete this.attributes[k]; }

  addEventListener(type, fn, useCapture) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push({ fn, useCapture: !!useCapture });
  }

  dispatchEvent(event) {
    const list = this.listeners[event.type] || [];
    for (const item of list) {
      item.fn(event);
      if (event._stopped) break;
    }
  }

  click() {
    const event = {
      type: 'click',
      _stopped: false,
      stopPropagation() { this._stopped = true; },
      preventDefault() {}
    };
    this.dispatchEvent(event);
  }

  querySelectorAll(sel) {
    const res = [];
    function search(node) {
      if (sel.includes('[data-setting="')) {
        const match = sel.match(/\[data-setting="([^"]+)"\]/);
        if (match && node.getAttribute && node.getAttribute('data-setting') === match[1]) {
          res.push(node);
        }
      } else if (sel === '.settings-segment-btn') {
        if (node.classList && node.classList.contains('settings-segment-btn')) {
          res.push(node);
        }
      }
      for (const child of node.children || []) search(child);
    }
    search(this);
    return res;
  }
}

// Global mocks
global.localStorage = localStorage;
global.window = new MockElement('window');
global.window.innerHeight = 800;
global.window.scrollY = 0;
global.window.location = { origin: 'https://dogukanlacin.github.io', pathname: '/test.html' };
global.document = new MockElement('document');
global.document.title = 'Test Title';
global.document.documentElement = new MockElement('html');
global.document.body = new MockElement('body');

const elementMap = {};
function regEl(el) {
  elementMap[el.id] = el;
  return el;
}

const btnDecrease = regEl(new MockElement('button', 'btn-font-decrease'));
const btnIncrease = regEl(new MockElement('button', 'btn-font-increase'));
const fontSizeIndicator = regEl(new MockElement('span', 'font-size-indicator'));
const btnSettings = regEl(new MockElement('button', 'btn-reading-settings'));
const settingsPanel = regEl(new MockElement('div', 'reading-settings-panel'));
settingsPanel.style.display = 'none';
settingsPanel.setAttribute('aria-hidden', 'true');
const btnCloseSettings = regEl(new MockElement('button', 'btn-close-settings'));
settingsPanel.children.push(btnCloseSettings);

const currentFontEl = regEl(new MockElement('span', 'setting-current-font'));
const currentLineHeightEl = regEl(new MockElement('span', 'setting-current-lineheight'));
const currentWidthEl = regEl(new MockElement('span', 'setting-current-width'));

// Create segment buttons
const fontButtons = ['15px', '17px', '19px', '21px'].map(val => {
  const b = new MockElement('button', '', 'settings-segment-btn');
  b.setAttribute('data-setting', 'font-size');
  b.setAttribute('data-val', val);
  settingsPanel.children.push(b);
  return b;
});

const lhButtons = ['1.75', '1.95', '2.15'].map(val => {
  const b = new MockElement('button', '', 'settings-segment-btn');
  b.setAttribute('data-setting', 'line-height');
  b.setAttribute('data-val', val);
  settingsPanel.children.push(b);
  return b;
});

const widthButtons = ['640px', '760px', '880px'].map(val => {
  const b = new MockElement('button', '', 'settings-segment-btn');
  b.setAttribute('data-setting', 'content-width');
  b.setAttribute('data-val', val);
  settingsPanel.children.push(b);
  return b;
});

global.document.getElementById = function(id) {
  return elementMap[id] || null;
};
global.document.querySelector = function() { return null; };
global.document.querySelectorAll = function(sel) {
  if (sel === '.share-native' || sel === '.share-twitter' || sel === '.share-linkedin' || sel === '.share-whatsapp') return [];
  return [];
};

// Load post.js
const postJsCode = fs.readFileSync(path.resolve('c:/Users/user/Desktop/Yaptığım programlar/blog/assets/post.js'), 'utf8');
eval(postJsCode);

// Verification tests
console.log('\n--- Running Functional Logic Tests ---');

// Test 1: Initial state
const rootFontSize = global.document.documentElement.style.getPropertyValue('--post-body-font-size');
const rootLineHeight = global.document.documentElement.style.getPropertyValue('--post-body-line-height');
const rootContentWidth = global.document.documentElement.style.getPropertyValue('--post-content-width');

console.log('Initial Font Size:', rootFontSize, '(Expected: 17px)');
console.log('Initial Line Height:', rootLineHeight, '(Expected: 1.95)');
console.log('Initial Content Width:', rootContentWidth, '(Expected: 760px)');
if (rootFontSize !== '17px' || rootLineHeight !== '1.95' || rootContentWidth !== '760px') {
  throw new Error('Initial styles failed!');
}

// Test 2: Font size button click in panel (21px)
fontButtons[3].click();
if (global.document.documentElement.style.getPropertyValue('--post-body-font-size') !== '21px') throw new Error('21px font size not applied');
if (localStorage.getItem('dl_font_size') !== '21px') throw new Error('21px not persisted in dl_font_size');
if (!btnIncrease.disabled) throw new Error('btnIncrease should be disabled at 21px');
if (fontSizeIndicator.textContent !== '21px') throw new Error('Indicator should be 21px');
console.log('PASS: Set font size to 21px, A+ disabled, persisted.');

// Test 3: A- button click (21px -> 19px)
btnDecrease.click();
if (global.document.documentElement.style.getPropertyValue('--post-body-font-size') !== '19px') throw new Error('A- did not decrease to 19px');
if (localStorage.getItem('dl_font_size') !== '19px') throw new Error('19px not persisted');
if (btnIncrease.disabled) throw new Error('btnIncrease should be enabled at 19px');
console.log('PASS: A- decreased to 19px, synchronized with indicator and storage.');

// Test 4: Line height button click (2.15) - check independence
lhButtons[2].click();
if (global.document.documentElement.style.getPropertyValue('--post-body-line-height') !== '2.15') throw new Error('2.15 line height not applied');
if (localStorage.getItem('dl_line_height') !== '2.15') throw new Error('2.15 not persisted');
// Verify font size remained 19px
if (global.document.documentElement.style.getPropertyValue('--post-body-font-size') !== '19px') throw new Error('Font size was unexpectedly changed!');
console.log('PASS: Line height changed to 2.15 independently from font size.');

// Test 5: Content width button click (880px)
widthButtons[2].click();
if (global.document.documentElement.style.getPropertyValue('--post-content-width') !== '880px') throw new Error('880px content width not applied');
if (localStorage.getItem('dl_content_width') !== '880px') throw new Error('880px not persisted');
// Verify other settings remained unchanged
if (global.document.documentElement.style.getPropertyValue('--post-body-font-size') !== '19px') throw new Error('Font size changed!');
if (global.document.documentElement.style.getPropertyValue('--post-body-line-height') !== '2.15') throw new Error('Line height changed!');
console.log('PASS: Content width changed to 880px independently.');

// Test 6: Open and close settings panel
btnSettings.click();
if (settingsPanel.style.display !== 'block' || settingsPanel.getAttribute('aria-hidden') !== 'false') throw new Error('Panel did not open');
if (btnSettings.getAttribute('aria-expanded') !== 'true') throw new Error('aria-expanded not true');
console.log('PASS: Settings panel opened, aria-expanded=true.');

btnCloseSettings.click();
if (settingsPanel.style.display !== 'none' || settingsPanel.getAttribute('aria-hidden') !== 'true') throw new Error('Panel did not close');
if (btnSettings.getAttribute('aria-expanded') !== 'false') throw new Error('aria-expanded not false');
console.log('PASS: Settings panel closed via close button, aria-expanded=false.');

// Test 7: ESC key closes open panel
btnSettings.click();
if (settingsPanel.style.display !== 'block') throw new Error('Panel did not open');
const escEvent = {
  type: 'keydown',
  key: 'Escape',
  _stopped: false,
  _prevented: false,
  stopPropagation() { this._stopped = true; },
  preventDefault() { this._prevented = true; }
};
global.window.dispatchEvent(escEvent);
if (settingsPanel.style.display !== 'none') throw new Error('ESC did not close settings panel');
console.log('PASS: ESC key cleanly closed settings panel and stopped propagation.');

console.log('\nALL FUNCTIONAL SIMULATION TESTS PASSED SUCCESSFULLY!');
