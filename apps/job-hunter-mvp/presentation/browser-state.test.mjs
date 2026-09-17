import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { renderHtmlReport } from './render.mjs';

function page(storage, failWrite = false) {
  const html = renderHtmlReport({ results: [] }, { decisionsDict: {} });
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const classList = { add() {}, remove() {} };
  const reason = { value: '' }, save = { innerText: 'Mentés', style: {} };
  const card = { id: 'job-card-0', dataset: { url: 'https://example.org/job', visible: 'true', excluded: 'false', poDecision: '' },
    style: { display: 'block' }, querySelector(selector) {
      if (selector === '.reason-input') return reason;
      if (selector === '.btn-save') return save;
      return { classList };
    } };
  let initialized;
  const alerts = [];
  const context = vm.createContext({
    document: {
      querySelectorAll: selector => selector === '.job-card' ? [card] : [{ classList }],
      getElementById: () => card,
      addEventListener: (_, fn) => { initialized = fn; },
    },
    localStorage: { getItem: () => storage, setItem: () => { if (failWrite) throw new Error('denied'); } },
    alert: message => alerts.push(message), setTimeout() {},
  });
  vm.runInContext(script, context);
  return { context, card, reason, save, alerts, initialize: () => initialized() };
}

test('restored browser rejection is filtered on load; All Scored still exposes it without global event', () => {
  const p = page(JSON.stringify({ 'https://example.org/job': { poDecision: 'DO_NOT_APPLY', poReason: 'Indok' } }));
  p.initialize();
  assert.equal(p.card.style.display, 'none');
  assert.equal(p.reason.value, 'Indok');
  vm.runInContext("filterTab('all')", p.context);
  assert.equal(p.card.style.display, 'block');
  vm.runInContext("filterTab('apply')", p.context);
  assert.equal(p.card.style.display, 'none');
});

test('corrupt browser storage does not prevent initialization of the results', () => {
  const p = page('{broken-json');
  assert.doesNotThrow(p.initialize);
  assert.equal(p.card.style.display, 'block');
});

test('failed browser persistence never claims the decision was saved', () => {
  const p = page('{}', true);
  p.initialize();
  vm.runInContext("selectDecision('job-card-0', 'DO_NOT_APPLY'); saveCardDecision('job-card-0', 'https://example.org/job')", p.context);
  assert.equal(p.alerts.length, 1);
  assert.match(p.alerts[0], /nincs tartósan elmentve/);
  assert.equal(p.save.innerText, 'Mentés');
});
