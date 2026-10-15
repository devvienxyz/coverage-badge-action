# coverage-badge-action

Generates a flat SVG coverage badge from a [coverage.py](https://coverage.readthedocs.io/) data
file, or from an lcov file with the [Node version](#node-version). No external services, no API tokens, no rate limits - the badge is a plain SVG file you
commit to your repo and embed in your README.

```markdown
![coverage](coverage.svg)
```

## Usage

Run your tests with coverage first, then generate the badge:

```yaml
- name: Test
  run: pytest --cov=app

- name: Generate coverage badge
  uses: devvienxyz/coverage-badge-action@v1
  with:
    data-file: .coverage       # optional, defaults to .coverage
    output-path: coverage.svg  # optional, defaults to coverage.svg
```

### Keeping the badge committed

This action only writes the file - it doesn't commit anything. Pair it with a commit-back
action if you want the badge to stay in sync automatically on every CI run:

```yaml
- name: Test
  run: pytest --cov=app

- name: Generate coverage badge
  uses: devvienxyz/coverage-badge-action@v1

- name: Commit updated badge
  uses: stefanzweifel/git-auto-commit-action@v5
  with:
    commit_message: "chore: update coverage badge"
    file_pattern: coverage.svg
```

For `pull_request`-triggered workflows, add `ref: ${{ github.head_ref }}` to your `actions/checkout`
step so the commit lands on the PR branch itself, not a detached merge ref. You'll also need
`permissions: contents: write` on the job.

### Running it locally

```bash
pip install coverage
python generate_badge.py --data-file .coverage --output coverage.svg
```

## Node version

For JS/TS projects, use the `node` sub-action. It reads any lcov file (`node --test`, c8, nyc, Jest,
Vitest) and needs no installs beyond the Node already on the runner. The badge looks the same.

```yaml
- name: Test
  run: |
    set -o pipefail
    node --test --experimental-test-coverage \
      --test-reporter=spec --test-reporter-destination=stdout \
      --test-reporter=lcov --test-reporter-destination=lcov.info | tee test-output.txt

- name: Generate badges
  uses: devvienxyz/coverage-badge-action/node@v1
  with:
    lcov-file: lcov.info            # optional, defaults to lcov.info
    output-path: coverage.svg       # optional, defaults to coverage.svg
    test-output: test-output.txt    # optional, also writes a tests badge
    tests-output-path: tests.svg    # optional, defaults to tests.svg
```

The percentage is line coverage: total `LH` over total `LF` across every file in the lcov data.
With `test-output` set, the action also reads the runner's `tests N` summary (spec `ℹ tests N` or
TAP `# tests N`) and writes a `tests | N passed` badge. Run it only after a passing test step.

## Examples

Complete workflows to copy into `.github/workflows/`:

- [`examples/python.yml`](examples/python.yml): coverage badge committed back to each PR branch.
- [`examples/node.yml`](examples/node.yml): tests + coverage badges published to an orphan `badges`
  branch on every push to `main`, so nothing commits to protected branches. Works in private repos.

## Inputs

| Name          | Default        | Description                                    |
| ------------- | -------------- | ----------------------------------------------- |
| `data-file`   | `.coverage`    | Coverage data file to read.                     |
| `output-path` | `coverage.svg` | Where to write the generated SVG.                |

Node version (`/node`):

| Name          | Default        | Description                                    |
| ------------- | -------------- | ----------------------------------------------- |
| `lcov-file`   | `lcov.info`    | lcov file to read.                              |
| `output-path` | `coverage.svg` | Where to write the generated SVG.                |
| `test-output` | (unset)        | Saved test output; when set, a tests badge is written too. |
| `tests-output-path` | `tests.svg` | Where to write the tests badge.            |

## Color thresholds

`>= 90%` green, `>= 75%` yellow, below that red - matches the common badge convention used by
most coverage services.

## Development

```bash
uv sync
uv run pytest
uv run ruff check .
node --test node/*.test.js
```

## License

MIT
