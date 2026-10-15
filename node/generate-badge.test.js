const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { coveragePercent, colorFor, badgeSvg, main } = require('./generate-badge');

const LCOV = ['SF:a.js', 'LF:3', 'LH:1', 'end_of_record', 'SF:b.js', 'LF:1', 'LH:1', 'end_of_record'].join('\n');

let dir;
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'badge-')); });
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

test('main writes the badge from an lcov file', () => {
  const lcovFile = path.join(dir, 'lcov.info');
  const output = path.join(dir, 'coverage.svg');
  fs.writeFileSync(lcovFile, LCOV);
  main(['--lcov-file', lcovFile, '--output', output]);
  assert.ok(fs.readFileSync(output, 'utf8').includes('50%'));
});
