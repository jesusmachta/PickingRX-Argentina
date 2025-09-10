/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 */

// Polyfill for Node.js globals in browser environment
(window as any).global = window;
(window as any).process = {
  env: { DEBUG: undefined },
  version: '',
  platform: 'browser'
};

// __dirname polyfill for tesseract.js
(window as any).__dirname = '/';

// Buffer polyfill for tesseract.js
if (typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = {
    isBuffer: () => false
  };
}
