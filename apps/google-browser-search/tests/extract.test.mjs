import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cheapScore, matchesChallenge, relevanceReason } from '../lib/extract.mjs';

test('cheapScore: positive for IT leadership title', () => {
  assert.equal(cheapScore('IT vezető állás Budapest', ''), 1);
});

test('cheapScore: negative for helpdesk', () => {
  assert.equal(cheapScore('Helpdesk munkatárs', ''), -1);
});

test('cheapScore: neutral for unrelated title', () => {
  assert.equal(cheapScore('Marketing asszisztens', ''), 0);
});

test('matchesChallenge: detects Hungarian unusual-traffic text', () => {
  assert.equal(matchesChallenge('Rendszereink szokatlan forgalmat észleltek...'), true);
});

test('matchesChallenge: false on normal results page text', () => {
  assert.equal(matchesChallenge('IT vezető állás - profession.hu'), false);
});

test('relevanceReason: excludes advanced English requirement', () => {
  const r = relevanceReason('IT vezető', 'tárgyalóképes angol szükséges');
  assert.equal(r.relevant, false);
  assert.match(r.reason, /English/);
});

test('relevanceReason: relevant for matching role term', () => {
  const r = relevanceReason('IT projektmenedzser állás', '');
  assert.equal(r.relevant, true);
});
