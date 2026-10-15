#!/usr/bin/env node
// Generate flat SVG coverage (and optional test count) badges - no external services.

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');

function coveragePercent(lcov) {
  let found = 0;
  let hit = 0;
  for (const line of lcov.split('\n')) {
    if (line.startsWith('LF:')) found += Number(line.slice(3));
    else if (line.startsWith('LH:')) hit += Number(line.slice(3));
  }
  if (!found) throw new Error('no LF/LH line totals found in lcov data');
  return Math.round((100 * hit) / found);
}

function colorFor(percent) {
  if (percent >= 90) return '#4c1';
  if (percent >= 75) return '#dfb317';
  return '#e05d44';
}

function testCount(output) {
  const m = output.match(/^(?:ℹ|#) tests (\d+)$/m);
  if (!m) throw new Error('no "tests N" summary found in test output');
  return Number(m[1]);
}

function badgeSvg(percent) {
  return flatBadge('coverage', `${percent}%`, colorFor(percent));
}

function testsBadgeSvg(count) {
  return flatBadge('tests', `${count} passed`, '#4c1');
}

function flatBadge(label, value, color) {
  const labelWidth = 5 + label.length * 7;
  const valueWidth = 8 + value.length * 7;
  const totalWidth = labelWidth + valueWidth;
  const labelX = labelWidth / 2;
  const valueX = labelWidth + valueWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelX}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelX}" y="14">${label}</text>
    <text x="${valueX}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${valueX}" y="14">${value}</text>
  </g>
</svg>
`;
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function main(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      'lcov-file': { type: 'string', default: 'lcov.info' },
      output: { type: 'string', default: 'coverage.svg' },
      'test-output': { type: 'string', default: '' },
      'tests-output': { type: 'string', default: 'tests.svg' },
    },
  });
  const percent = coveragePercent(fs.readFileSync(values['lcov-file'], 'utf8'));
  write(values.output, badgeSvg(percent));
  console.log(`Wrote ${values.output} (${percent}% coverage)`);

  if (values['test-output']) {
    const count = testCount(fs.readFileSync(values['test-output'], 'utf8'));
    write(values['tests-output'], testsBadgeSvg(count));
    console.log(`Wrote ${values['tests-output']} (${count} tests)`);
  }
}

if (require.main === module) main(process.argv.slice(2));

module.exports = { coveragePercent, testCount, colorFor, badgeSvg, testsBadgeSvg, main };
