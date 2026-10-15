const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { coveragePercent, testCount, colorFor, badgeSvg, testsBadgeSvg, main } = require('./generate-badge');

const LCOV = ['SF:a.js', 'LF:3', 'LH:1', 'end_of_record', 'SF:b.js', 'LF:1', 'LH:1', 'end_of_record'].join('\n');

const SPEC_OUTPUT = 'ℹ tests 12\nℹ pass 12\nℹ fail 0\n';

let dir;
let lcovFile;
let output;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'badge-'));
  lcovFile = path.join(dir, 'lcov.info');
  output = path.join(dir, 'coverage.svg');
  fs.writeFileSync(lcovFile, LCOV);
});
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

test('coveragePercent sums line totals across files', () => {
  assert.equal(coveragePercent(LCOV), 50);
});

test('coveragePercent reports full coverage', () => {
  assert.equal(coveragePercent('LF:5\nLH:5\n'), 100);
});

test('coveragePercent throws on lcov with no line totals', () => {
  assert.throws(() => coveragePercent('SF:a.js\nend_of_record\n'), /no LF\/LH/);
});

test('colorFor thresholds', () => {
  assert.equal(colorFor(95), '#4c1');
  assert.equal(colorFor(90), '#4c1');
  assert.equal(colorFor(80), '#dfb317');
  assert.equal(colorFor(75), '#dfb317');
  assert.equal(colorFor(50), '#e05d44');
});

test('badgeSvg contains label and percentage', () => {
  const svg = badgeSvg(87);
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('coverage'));
  assert.ok(svg.includes('87%'));
});

test('testCount reads spec and TAP summaries', () => {
  assert.equal(testCount(SPEC_OUTPUT), 12);
  assert.equal(testCount('TAP version 13\n# tests 7\n# pass 7\n'), 7);
});

test('testCount throws when no summary is found', () => {
  assert.throws(() => testCount('ok 1 - something\n'), /no "tests N"/);
});

test('testsBadgeSvg contains label and count', () => {
  const svg = testsBadgeSvg(12);
  assert.ok(svg.includes('>tests<'));
  assert.ok(svg.includes('12 passed'));
});

test('main writes the coverage badge from an lcov file', () => {
  main(['--lcov-file', lcovFile, '--output', output]);
  assert.ok(fs.readFileSync(output, 'utf8').includes('50%'));
  assert.equal(fs.existsSync(path.join(dir, 'tests.svg')), false);
});

test('main also writes the tests badge when given test output', () => {
  const testOutput = path.join(dir, 'test-output.txt');
  const testsOutput = path.join(dir, 'badges', 'tests.svg');
  fs.writeFileSync(testOutput, SPEC_OUTPUT);
  main(['--lcov-file', lcovFile, '--output', output, '--test-output', testOutput, '--tests-output', testsOutput]);
  assert.ok(fs.readFileSync(testsOutput, 'utf8').includes('12 passed'));
});
