Codex Instructions
==================

This project is `colorhunting`, a small web frontend project. Treat it as a
real product codebase, not as a throwaway demo. A change is not complete just
because the UI appears to work; it should be easy to test, easy to read, and
safe to evolve.


Development Environment
-----------------------

This project uses mise for its development environment.

When working in this repository, Codex must run project commands through mise so
the versions declared in `mise.toml` are active.

 -  Do not run package manager, build, test, lint, typecheck, or dev-server
    commands directly on the host shell.
 -  Prefer `mise run <task>` for project workflows declared in `mise.toml`.
 -  Use `mise exec -- <command>` when a direct tool command is needed.
 -  Use Yarn 4 as the JavaScript package manager.
 -  Use `yarn install --immutable` for dependency installation.

Examples:

 -  `mise install`
 -  `mise run install`
 -  `mise run test`
 -  `mise run lint`
 -  `mise run build`
 -  `mise run dev`
 -  `mise exec -- yarn --version`

For compound commands that require shell features, run them through `mise exec`:

 -  `mise exec -- bash -lc '<command>'`

Codex should not run `npm`, `pnpm`, `node`, `yarn`, `cargo`, `python`, `make`,
or similar project tooling outside mise.


Quality Bar
-----------

Every meaningful code change should improve or preserve these properties:

 -  Meaningful tests: tests should cover observable behavior, edge cases, and
    failure states instead of only checking implementation details.
 -  Clear role separation: business logic, data transformation, UI state, and
    rendering should be separated enough that each can be tested without
    excessive setup.
 -  Readability: prefer small, named functions and components with direct control
    flow. Avoid clever abstractions unless they remove real duplication or
    clarify a domain concept.
 -  Performance: avoid unnecessary re-renders, expensive work during render,
    wasteful asset loading, and layout patterns that scale poorly.
 -  Accessibility and UX: interactive elements should have semantic roles,
    keyboard access, visible states, and responsive layouts.

When these goals conflict, choose the simplest design that keeps behavior
testable and explicit.


Implementation Workflow
-----------------------

1.  Understand the current code before editing. Use existing project patterns
    unless they clearly block the requested change.
2.  Define the behavior change in concrete terms: user-visible result, important
    states, and expected edge cases.
3.  Design the code so important behavior can be tested through stable public
    interfaces. Extract pure helpers, hooks, or small modules when that makes
    tests clearer.
4.  Implement the change in the narrowest reasonable scope.
5.  Add or update tests that would fail without the implementation.
6.  Run the relevant checks through mise. At minimum, run tests affected by the
    change. For broad or user-facing changes, also run lint and build.
7.  Review the result as if preparing a pull request: look for brittle tests,
    unclear names, accidental complexity, rendering issues, and avoidable work.
8.  Fix valid review findings, then rerun the checks that prove the fix.


Agent Orchestration
-------------------

When the execution environment supports sub-agents or delegated reviews, and no
higher-priority instruction forbids it, use them for non-trivial changes after
the first implementation pass. The goal is to catch issues that a single agent
is likely to miss, then actually incorporate the valid feedback before
finishing.

Use focused agents with distinct responsibilities:

 -  Test Quality Reviewer: checks whether tests prove behavior, cover edge cases,
    avoid implementation coupling, and would catch realistic regressions.
 -  Architecture Reviewer: checks role separation, module boundaries, data flow,
    and whether logic is placed where future changes can extend it safely.
 -  Readability Reviewer: checks naming, component size, control flow, duplication,
    and whether a new contributor can understand the change quickly.
 -  Performance and UX Reviewer: checks avoidable render work, inefficient data
    processing, asset usage, layout stability, accessibility, and responsive UI.

Orchestration rules:

 -  Give each reviewer a concrete scope and ask for findings only, ordered by
    severity with file and line references when possible.
 -  Do not ask multiple agents to perform overlapping edits at the same time.
 -  If a review finding is valid, update the code or tests and rerun the smallest
    command that verifies the fix.
 -  If a finding is intentionally not addressed, document the reason in the final
    response.
 -  For large changes, run a final integration pass after reviewer feedback has
    been applied to ensure the code still reads as one coherent change.

Suggested reviewer prompts:

 -  “Review this change only for test quality. Identify missing behavioral tests,
    brittle assertions, and cases where the implementation could be broken
    without failing tests.”
 -  “Review this change only for architecture and role separation. Identify logic
    that is hard to test, misplaced state, leaky boundaries, or abstractions
    that are either missing or unnecessary.”
 -  “Review this change only for readability and maintainability. Identify naming,
    flow, duplication, or component-size problems that would slow future work.”
 -  “Review this change only for frontend performance, accessibility, and UX.
    Identify unnecessary render work, unstable layout, missing semantics,
    keyboard issues, or responsive problems.”


Frontend Standards
------------------

 -  Build the actual usable interface first; avoid landing-page filler unless the
    task specifically asks for marketing content.
 -  Prefer semantic HTML and accessible controls over custom interaction patterns.
 -  Keep visual state explicit: loading, empty, error, success, hover, focus, and
    disabled states should be considered when relevant.
 -  Keep fixed-format UI stable with explicit dimensions, aspect ratios, or grid
    constraints so content changes do not cause surprising layout shifts.
 -  Put expensive computations outside render paths or memoize them when inputs
    are stable and the cost is meaningful.
 -  Avoid storing derived state unless it prevents duplicated expensive work or
    represents a deliberate user interaction state.


Testing Standards
-----------------

 -  Tests should describe behavior in user or domain language.
 -  Prefer testing through public component/module APIs over private internals.
 -  Include edge cases for empty data, invalid input, boundary values, async
    states, and user interaction flows when relevant.
 -  Keep test fixtures small and purposeful.
 -  Avoid snapshots unless they protect a stable, intentionally reviewed output.
 -  When a bug is fixed, add a regression test that fails for the old behavior.


Final Response Expectations
---------------------------

When finishing a task, summarize:

 -  What changed.
 -  Which tests or checks were run through mise.
 -  Any reviewer findings that were intentionally not addressed.
 -  Any remaining risk or follow-up that matters.
