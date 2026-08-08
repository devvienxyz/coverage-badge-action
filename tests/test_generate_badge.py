from pathlib import Path

from coverage import Coverage

from generate_badge import badge_svg, color_for, coverage_percent


def _write_coverage_data(tmp_path: Path, *, covered_lines: int, total_lines: int) -> str:
    module_path = tmp_path / "sample_module.py"
    module_path.write_text("\n".join(f"x{i} = {i}" for i in range(total_lines)) + "\n")

    data_file = str(tmp_path / ".coverage")
    cov = Coverage(data_file=data_file, source=[str(tmp_path)])
    cov.start()
    namespace: dict = {}
    exec(compile("\n".join(f"x{i} = {i}" for i in range(covered_lines)), str(module_path), "exec"), namespace)
    cov.stop()
    cov.save()
    return data_file


def test_coverage_percent_reports_full_coverage(tmp_path):
    data_file = _write_coverage_data(tmp_path, covered_lines=5, total_lines=5)

    assert coverage_percent(data_file) == 100


def test_coverage_percent_reports_partial_coverage(tmp_path):
    data_file = _write_coverage_data(tmp_path, covered_lines=1, total_lines=4)

    assert coverage_percent(data_file) == 25


def test_color_for_thresholds():
    assert color_for(95) == "#4c1"
    assert color_for(90) == "#4c1"
    assert color_for(80) == "#dfb317"
    assert color_for(75) == "#dfb317"
    assert color_for(50) == "#e05d44"


def test_badge_svg_contains_label_and_percentage():
    svg = badge_svg(87)

    assert "coverage" in svg
    assert "87%" in svg
    assert svg.startswith("<svg")
