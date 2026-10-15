#!/usr/bin/env node
// Generate a flat SVG coverage badge from an lcov file - no external services.

const fs = require('node:fs');
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

function badgeSvg(percent) {
  const label = 'coverage';
  const value = `${percent}%`;
  const labelWidth = 61;
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
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${colorFor(percent)}"/>
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

function main(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      'lcov-file': { type: 'string', default: 'lcov.info' },
      output: { type: 'string', default: 'coverage.svg' },
    },
  });
  const percent = coveragePercent(fs.readFileSync(values['lcov-file'], 'utf8'));
  fs.writeFileSync(values.output, badgeSvg(percent));
  console.log(`Wrote ${values.output} (${percent}% coverage)`);
}

if (require.main === module) main(process.argv.slice(2));

module.exports = { coveragePercent, colorFor, badgeSvg, main };
