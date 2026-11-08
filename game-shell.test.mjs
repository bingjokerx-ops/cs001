import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source = readFileSync(new URL('assets/site.js', import.meta.url), 'utf8');
function gamePage() {
  const elements = new Map();
  const events = [];
  const animationFrames = [];
  const timers = new Map();
  let nextTimer = 0;
  const frames = [];
  const choices = {reload: false};
  function element() {
    return {hidden: true, dataset: {}, listeners: new Map(), srcWrites: 0,
      addEventListener(name, listener) { this.listeners.set(name, listener); },
      set src(address) { this.address = address; this.srcWrites++; },
      get src() { return this.address; },
      append(frame) { frames.push(frame); },
    };
  }
  for (const id of ['load-game', 'game-frame-slot', 'game-status', 'game-shell', 'game-loading', 'game-wait-notice', 'game-placeholder', 'game-tools', 'reload-controls', 'reload-game', 'expand-game', 'load-help']) elements.set(`#${id}`, element());
  const document = {
    querySelector: selector => elements.get(selector), querySelectorAll: () => [],
    createElement: () => element(), dispatchEvent: event => events.push(event.type),
  };
  runInNewContext(source, {document, window: {confirm: () => choices.reload},
    requestAnimationFrame: callback => animationFrames.push(callback),
    setTimeout: callback => { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearTimeout: id => timers.delete(id),
    CustomEvent: class { constructor(type) { this.type = type; } }, DOMException,
  });
  return {elements, frames, events, timers, choices,
    click: id => elements.get(`#${id}`).listeners.get('click')(),
    paint: () => animationFrames.shift()?.(),
  };
}

test('feedback and stable loading state precede the external frame, repeated start creates one request', () => {
  const page = gamePage();
  page.click('load-game'); page.click('load-game');
  assert.equal(page.frames.length, 0);
  assert.equal(page.elements.get('#game-loading').hidden, false);
  assert.equal(page.elements.get('#game-shell').dataset.state, 'loading');
  page.paint(); assert.equal(page.frames.length, 0);
  page.paint(); assert.equal(page.frames.length, 1);
  assert.deepEqual(page.events, ['howbetter-game-launch']);
  assert.match(page.frames[0].src, /cloud.onlinegames.io/);
});

test('frame load describes a window, never asserts an actual game session', () => {
  const page = gamePage(); page.click('load-game'); page.paint(); page.paint();
  page.frames[0].listeners.get('load')();
  assert.equal(page.elements.get('#game-shell').dataset.state, 'opened');
  assert.equal(page.timers.size, 0);
  assert.equal(page.elements.get('#game-loading').hidden, true);
  assert.match(page.elements.get('#game-status').textContent, /Continue or Play/);
  assert.deepEqual(page.events, ['howbetter-game-launch']);
});

test('cancelled reload preserves the run; confirmed reload restarts its waiting notice', () => {
  const page = gamePage(); page.click('load-game'); page.paint(); page.paint();
  const frame = page.frames[0]; frame.listeners.get('load')();
  page.click('reload-game');
  assert.equal(frame.srcWrites, 1); assert.equal(page.events.length, 1);
  page.choices.reload = true; page.click('reload-game');
  assert.equal(frame.srcWrites, 2); assert.equal(page.frames.length, 1);
  assert.equal(page.elements.get('#game-loading').hidden, false);
  assert.equal(page.timers.size, 1);
  assert.deepEqual(page.events, ['howbetter-game-launch', 'howbetter-game-reload']);
});

test('a long wait offers help without resetting the game or inventing progress', () => {
  const page = gamePage(); page.click('load-game'); page.paint(); page.paint();
  [...page.timers.values()][0]();
  assert.equal(page.elements.get('#game-wait-notice').hidden, false);
  assert.equal(page.frames[0].srcWrites, 1);
  assert.equal(page.events.length, 1);
  page.frames[0].listeners.get('error')();
  assert.equal(page.elements.get('#load-help').open, true);
  assert.equal(page.elements.get('#game-shell').dataset.state, 'error');
});
