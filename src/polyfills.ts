/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 */

// Polyfill for Node.js globals in browser environment
(window as any).global = globalThis || window;
(window as any).process = {
  env: { DEBUG: undefined },
  version: '',
  platform: 'browser',
  nextTick: (fn: Function) => setTimeout(fn, 0)
};

// __dirname and __filename polyfills for tesseract.js
(window as any).__dirname = '/';
(window as any).__filename = '/index.js';

// Buffer polyfill for tesseract.js
if (typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = {
    isBuffer: () => false,
    from: (data: any) => data,
    alloc: (size: number) => new Array(size).fill(0)
  };
}

// Module polyfill
if (typeof (window as any).module === 'undefined') {
  (window as any).module = { exports: {} };
}

// Require polyfill
if (typeof (window as any).require === 'undefined') {
  (window as any).require = () => ({});
}
