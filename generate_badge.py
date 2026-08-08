#!/usr/bin/env python3
"""Generate a flat SVG coverage badge from a coverage.py data file - no external services."""

import argparse
import io
from pathlib import Path

from coverage import Coverage


def coverage_percent(data_file: str) -> int:
    cov = Coverage(data_file=data_file)
    cov.load()
    return round(cov.report(file=io.StringIO()))


def color_for(percent: int) -> str:
    if percent >= 90:
        return "#4c1"
    if percent >= 75:
        return "#dfb317"
    return "#e05d44"


def badge_svg(percent: int) -> str:
    label, value = "coverage", f"{percent}%"
    label_width, value_width = 61, 8 + len(value) * 7
    total_width = label_width + value_width
    label_x, value_x = label_width / 2, label_width + value_width / 2

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{total_width}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="{total_width}" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <rect width="{label_width}" height="20" fill="#555"/>
    <rect x="{label_width}" width="{value_width}" height="20" fill="{color_for(percent)}"/>
    <rect width="{total_width}" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="{label_x}" y="15" fill="#010101" fill-opacity=".3">{label}</text>
    <text x="{label_x}" y="14">{label}</text>
    <text x="{value_x}" y="15" fill="#010101" fill-opacity=".3">{value}</text>
    <text x="{value_x}" y="14">{value}</text>
  </g>
</svg>
"""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-file", default=".coverage", help="coverage.py data file to read")
    parser.add_argument("--output", default="coverage.svg", help="path to write the SVG badge")
    args = parser.parse_args()

    percent = coverage_percent(args.data_file)
    Path(args.output).write_text(badge_svg(percent))
    print(f"Wrote {args.output} ({percent}% coverage)")


if __name__ == "__main__":
    main()
