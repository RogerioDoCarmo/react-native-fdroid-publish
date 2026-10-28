import assert from 'node:assert/strict';
import { test } from 'node:test';
import { OTHER_STORES, templateGaps } from '../skills/react-native-fdroid-publish/scripts/text-guards.mjs';

test('names of other stores and platforms are caught', () => {
  for (const text of [
    'Also on the App Store',
    'Built for iOS and Android',
    'works on iPhone',
    'on my iPad',
    'beta via TestFlight',
    'listed on Google Play',
    'the Play Store build',
    'see Play Console',
    'https://apps.apple.com/app/id1',
    'https://play.google.com/store/apps/details?id=x',
    'APPLE',
    'app store',
  ]) {
    assert.ok(OTHER_STORES.test(text), text);
  }
});

test('library names used to explain a removal pass', () => {
  for (const text of [
    'I removed Google Play Services from this version.',
    'Play Install Referrer is gone too.',
    'No proprietary dependencies; plays Morse code.',
    'The pineapple and the radiosity.',
  ]) {
    assert.equal(OTHER_STORES.test(text), false, text);
  }
});

const template = [
  '## Abstract',
  'Fields:',
  '- [ ] The app complies with the inclusion policy',
  '* [x] I read the docs',
  'Closes rfp#',
  '/label ~"New App"',
].join('\n');

const filled = [
  '## Abstract',
  'Fields:',
  '- [x] The app complies with the inclusion policy',
  '- [x] I read the docs',
  'Closes rfp#4676',
  '/label ~"New App"',
].join('\n');

test('a fully filled body has no gaps', () => {
  assert.deepEqual(templateGaps(template, filled), []);
});

test('each kind of missing line is reported', () => {
  assert.deepEqual(templateGaps(template, filled.replace('## Abstract', '')), ['## Abstract']);
  assert.deepEqual(templateGaps(template, filled.replace('Fields:', '')), ['Fields:']);
  assert.deepEqual(templateGaps(template, filled.replace('I read the docs', 'x')), ['* [x] I read the docs']);
  assert.deepEqual(templateGaps(template, filled.replace('/label ~"New App"', '')), ['/label ~"New App"']);
});

test('Closes rfp# needs a number', () => {
  assert.deepEqual(templateGaps(template, filled.replace('rfp#4676', 'rfp#')), ['Closes rfp#']);
  assert.deepEqual(templateGaps(template, filled.replace('Closes rfp#4676', 'Closes rfp#4676 and more')), ['Closes rfp#']);
});
