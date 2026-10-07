---
title: pipelinemd
tagline: A GitLab CI failure doctor — reads a failed pipeline, works out what actually broke, and says how far to trust the answer
context: Solo project — CLI, rule catalog, evaluation harness, and release pipeline
bullets:
  - Cuts a 3,000-line job log down to the ~20 lines that explain the failure
  - 59 failure signatures, each with a real fix, and a confidence that can say "needs human review"
  - 489 tests and an offline eval harness scored against a labelled corpus
stack: [Python, pytest, Docker, GitHub Actions, Claude API]
order: 1
thumbnail: /images/pipelinemd/pipelinemd-card.webp
status: pypi
links:
  github: https://github.com/rbalukja15/pipelinemd
  live: https://pypi.org/project/pipelinemd/
  liveLabel: PyPI
---

## Problem

A failed CI job hands you a terminal recording. The log can run to tens of thousands of lines, most of them progress bars that rewrote themselves five hundred times, and the line that explains the failure is somewhere in the middle. So you scroll.

The harder part is that one fault produces many error-shaped lines. A missing environment variable makes the script fail, which makes the runner report a non-zero exit, which makes the cleanup step complain. Three errors, one cause. Pick the wrong one and you spend an afternoon fixing the fallout.

I wanted a tool that reads a log the way someone experienced reads it. Throw away the noise, find the fault, separate it from what it knocked over, and be honest about how sure it is.

## What I built

A command-line tool. Give it a GitLab job URL or a log file and it tells you what broke and what to do about it.

It works in two halves. The first is deterministic. It replays the trace the way a terminal would, so escape codes and carriage returns resolve and a progress bar that rewrote itself collapses to one line. It scores every line for failure-likeness, grows a window around the strong signals, merges the windows, and spends a line budget on the best of them. What survives gets matched against a catalog of 59 known failure signatures, each carrying a fix. Every report lands in one of seven classes: `yaml`, `ci_vars`, `image_pull`, `cache_artifact`, `test`, `runner`, `flaky`.

On one of the repo's fixture logs, 3,052 lines, 23 survive. The ESLint error that stopped the build is one of them.

<figure class="shot">
  <img src="/images/pipelinemd/report.webp" width="1200" height="1276" loading="lazy" decoding="async" alt="A pipelinemd HTML report for noisy_lint_failure.log: a verdict card showing class test, fix type code_patch, high confidence and $0 cost; a suggested fix for the matched ESLint rule; and a timeline of job sections with step_script marked as where it failed." />
  <figcaption>Every report says which rule fired, what to try, and what it cost. The timeline marks the section that failed and the ones that only ran afterwards.</figcaption>
</figure>

`flaky` is the class I was most careful with. It never comes from a guess about the error text. It comes from GitLab's retry history: if another attempt of the same job passed on the same commit, the job is flaky and the report says so. Otherwise it isn't, however transient the error looks.

The second half is optional. With an API key, Claude reads the distilled evidence and names the root cause, separating the fault from its fallout. It never sees the raw log, only the lines that survived. It has to cite the evidence lines it relied on, every citation is resolved back to a real line, and a diagnosis that cites nothing real is rejected rather than printed.

The first half needs no API key, no model, and no third-party packages. `pip install pipelinemd` installs a tool whose dependency list is empty.

<figure class="shot">
  <img src="/images/pipelinemd/evidence.webp" width="1200" height="1005" loading="lazy" decoding="async" alt="The evidence section of a pipelinemd report, headed 23 of 3,052 lines kept, 99.2 percent reduced, listing the surviving log lines with their original line numbers and the ESLint failure highlighted." />
  <figcaption>The excerpt keeps original line numbers, so anything it shows you can be found in the real log.</figcaption>
</figure>

## Architecture decisions

The distiller is pure. It reads no clock, opens no socket, and calls no random source. That buys three things. Tests can assert on exact output, so a fixture either produces the evidence I expect or the change that broke it shows up in the diff. Results are cacheable. And two runs build byte-identical prompts, which is what makes a prompt regression attributable to the prompt rather than to the weather.

There are two places the tool decides what matters, and I kept them apart because they are different problems. The first is which lines count as evidence. The second is which of those lines to actually show, because a 200-line excerpt still doesn't fit a 40-line terminal. The second one ranks in tiers: the runner's closing verdict always shows, then the anchors, then their neighbours. Within a tier the earliest line wins, because the top of an error block names the fault and the bottom just repeats it.

Confidence is never higher than the weakest signal behind it. When it comes out low the report says **needs human review** and lists why, instead of dressing up a guess. Cost is printed on every run: $0 when only the rules ran, and an estimate from the API's own token counts when Claude was asked.

## Testing & quality

489 test functions across 22 files. Beyond those, `make eval` scores the deterministic half against a corpus of 62 labelled job traces. It runs offline, takes a couple of seconds, and gives the same answer every time.

The number it produces needs a caveat, and the repo carries that caveat rather than hiding it. Every corpus case is authored, which means the failure and its label were written by the same hand that wrote the rules they get matched against. That makes the score a regression signal, not a measurement of real-world accuracy. Every case has a `provenance` field so the distinction can't quietly get lost as observed traces are added.

What the eval is genuinely good for is calibration. Class accuracy is 91% on the cases it reports at high confidence and 30% on the ones it reports at low. Low confidence means what it says, which is the property I actually wanted.

The LLM half is deliberately not scored. It needs an API key, costs money per run, and isn't reproducible, so folding it in would turn a regression gate into a bill and make the number depend on which model answered that day.

## Outcome

Published. `pip install pipelinemd` gets you version 0.2.0, MIT licensed, Python 3.11 or newer, with a multi-architecture Docker image if you'd rather skip Python.

The most useful thing that happened to it was failing its own test. The first real CI log it ever met was one of its own: a build where `pip install -e .` died because `pyproject.toml` pointed at a README that branch didn't have yet. The distiller did its job, keeping the `OSError: Readme file does not exist` line that explains everything. The rule catalog did not. pip wraps every failing build backend in the same generic `subprocess-exited-with-error` line, one rule matched that line alone, and the tool confidently told me to install a C compiler. Nothing was being compiled.

A confident wrong answer is the worst thing the catalog can do, so that rule no longer matches the wrapper on its own, and real compile failures still match on their own evidence. The same log now reports no match and sends it to human review.

<figure class="shot">
  <img src="/images/pipelinemd/needs-review.webp" width="1200" height="683" loading="lazy" decoding="async" alt="A pipelinemd report headed No known failure signature matched, showing class unclassified, low confidence, and a highlighted panel reading Needs human review, confidence is low because no rule fired." />
  <figcaption>"I don't know, and here is the line to read" is the honest answer while no rule covers packaging metadata failures. That log is now the first fixture for the rule that will.</figcaption>
</figure>

Every corpus case passes. The first real log it met broke a rule, which is the argument for growing the corpus with observed traces rather than trusting a number drawn from authored ones. An auto-fix merge request generator and support for diagnosing GitHub Actions runs are the next two features.
