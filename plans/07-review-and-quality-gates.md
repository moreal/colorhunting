Plan 07: Review and Quality Gates
=================================

Status
------

 -  State: Not started
 -  Owner: Main implementation agent
 -  Depends on:
     -  [Plan 01](./01-react-migration.md)
     -  [Plan 02](./02-domain-state-and-storage.md)
     -  [Plan 03](./03-design-system-and-storybook.md)
     -  [Plan 04](./04-color-selection-page.md)
     -  [Plan 05](./05-image-board-page.md)
     -  [Plan 06](./06-app-integration.md)
 -  Resume from: Start at “Reviewer pass”
 -  Commit message: `Apply review feedback and final quality checks`


Goal
----

Run a focused review pass after implementation, incorporate valid feedback, and
leave the project in a state that is readable, tested, accessible, and safe to
evolve.


Reviewer Pass
-------------

Use focused reviewers with distinct scopes:

 -  Test Quality Reviewer
     -  Look for missing behavioral tests, brittle assertions, weak edge-case
        coverage, and tests that would not fail for realistic regressions.
 -  Architecture Reviewer
     -  Look for misplaced state, hard-to-test logic, leaky module boundaries, and
        missing or unnecessary abstractions.
 -  Readability Reviewer
     -  Look for unclear naming, oversized components, confusing control flow,
        duplication, and difficult onboarding paths for future contributors.
 -  Performance and UX Reviewer
     -  Look for avoidable render work, unstable layout, inefficient image handling,
        missing semantics, keyboard problems, and responsive issues.


Tasks
-----

 -  [ ] Reviewer pass
     -  Ask each reviewer for findings only.
     -  Require file and line references when possible.
     -  Keep findings ordered by severity.
 -  [ ] Feedback triage
     -  Mark each finding as accepted, rejected, or deferred.
     -  Fix accepted findings.
     -  Record the reason for rejected or deferred findings in this file.
 -  [ ] Final integration pass
     -  Re-read changed modules as one coherent change.
     -  Look for mismatched naming, duplicated helpers, stale stories, or weak test
        descriptions.
     -  Ensure all user-visible behavior has Korean test titles.
 -  [ ] Full verification
     -  Run `mise run test`.
     -  Run `mise run lint`.
     -  Run `mise run build`.
     -  Run Storybook build through `mise` if a Storybook build task exists.
 -  [ ] Final documentation update
     -  Update all completed plan files to `Done`.
     -  Update [README](./README.md) statuses.
     -  Record any remaining risk or follow-up below.


Feedback Log
------------

Record reviewer findings here as they are triaged.

| Reviewer | Finding | Decision | Reason or Fix |
| -------- | ------- | -------- | ------------- |
|          |         |          |               |


Remaining Risk
--------------

Record important remaining risks here before marking this plan `Done`.

 -  None recorded yet.


Done Criteria
-------------

 -  Reviewer feedback has been addressed or explicitly documented.
 -  Full checks pass through `mise`.
 -  Plan statuses reflect the actual project state.
 -  The final commit is created with the message listed above.
 -  This plan file is updated to `Done`.
