Plan 07: Review and Quality Gates
=================================

Status
------

 -  State: Done
 -  Owner: Main implementation agent
 -  Depends on:
     -  [Plan 01](./01-react-migration.md)
     -  [Plan 02](./02-domain-state-and-storage.md)
     -  [Plan 03](./03-design-system-and-storybook.md)
     -  [Plan 04](./04-color-selection-page.md)
     -  [Plan 05](./05-image-board-page.md)
     -  [Plan 06](./06-app-integration.md)
 -  Resume from: Completed
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

 -  [x] Reviewer pass
     -  Ask each reviewer for findings only.
     -  Require file and line references when possible.
     -  Keep findings ordered by severity.
 -  [x] Feedback triage
     -  Mark each finding as accepted, rejected, or deferred.
     -  Fix accepted findings.
     -  Record the reason for rejected or deferred findings in this file.
 -  [x] Final integration pass
     -  Re-read changed modules as one coherent change.
     -  Look for mismatched naming, duplicated helpers, stale stories, or weak test
        descriptions.
     -  Ensure all user-visible behavior has Korean test titles.
 -  [x] Full verification
     -  Run `mise run test`.
     -  Run `mise run lint`.
     -  Run `mise run build`.
     -  Run Storybook build through `mise` if a Storybook build task exists.
 -  [x] Final documentation update
     -  Update all completed plan files to `Done`.
     -  Update [README](./README.md) statuses.
     -  Record any remaining risk or follow-up below.


Feedback Log
------------

Record reviewer findings here as they are triaged.

| Reviewer                    | Finding                                                         | Decision | Reason or Fix                                                                                                                                                            |
| --------------------------- | --------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Test Quality Reviewer       | Missing App-level board mutation persistence coverage.          | Accepted | Added an App integration test that uploads, persists, reloads, and removes a board image through the injected storage boundary.                                          |
| Test Quality Reviewer       | Missing App-boundary test for color confirmation save failure.  | Accepted | Added an App integration test that rejects `saveAppState`, keeps color selection visible, and prevents board navigation.                                                 |
| Architecture Reviewer       | Page modules still own persistence.                             | Accepted | Removed direct page defaults to global storage; pages now use injected save callbacks with no-op standalone defaults while `App` owns storage.                           |
| Architecture Reviewer       | Board page duplicates app state ownership.                      | Accepted | Made `ImageBoardPage` controlled by its `state` prop and parent `onBoardChange`, keeping only transient UI state locally.                                                |
| Architecture Reviewer       | Transition contract is split across save and notify callbacks.  | Accepted | Kept page-level sequencing for UI errors, but made persistence injectable and owned by `App`; App tests now cover both success and failure wiring.                       |
| Architecture Reviewer       | Duplicate save callbacks hide the missing app-flow abstraction. | Accepted | Replaced duplicate App save callbacks with one `saveColorDeterminedState` callback.                                                                                      |
| Readability Reviewer        | Duplicate persistence callbacks obscure one behavior.           | Accepted | Replaced with one neutral callback name in `App`.                                                                                                                        |
| Readability Reviewer        | Page-state checks are repeated inline.                          | Accepted | Named the derived `isColorSelection` state and transition offset before JSX.                                                                                             |
| Readability Reviewer        | App-specific CSS is tucked into the global stylesheet.          | Accepted | Moved App loading/status styles into `src/App.css`.                                                                                                                      |
| Performance and UX Reviewer | Modal allows focus to escape behind `aria-modal`.               | Accepted | Added a Tab/Shift+Tab focus trap and regression test for `InfoPopup`.                                                                                                    |
| Performance and UX Reviewer | Large images are read and stored before size control.           | Accepted | Added a pre-read file-size guard tied to the data URL storage limit and covered it with a test.                                                                          |
| Performance and UX Reviewer | Logo activation silently resets the whole board.                | Accepted | Changed the board-page logo accessible label to describe the reset action. Confirmation before reset is deferred until the product flow defines destructive-action copy. |
| Performance and UX Reviewer | Motion ignores reduced-motion preference.                       | Accepted | Added reduced-motion handling to Motion transitions and CSS transition durations.                                                                                        |
| Performance and UX Reviewer | Mobile board can push primary actions below short viewports.    | Accepted | Switched mobile board layout to dynamic viewport units with shrinkable header/content/footer rows.                                                                       |
| Performance and UX Reviewer | Board state mirror causes extra heavy renders.                  | Accepted | Removed the mirrored board state from `ImageBoardPage`.                                                                                                                  |


Remaining Risk
--------------

Record important remaining risks here before marking this plan `Done`.

 -  Storybook build succeeds, but Vite reports the generated Storybook iframe
    chunk is larger than 500 kB. The product build does not report this warning.
 -  Reset confirmation copy remains a product decision. The reset action is now
    labeled explicitly, but it still does not ask for confirmation before
    clearing a filled board.


Done Criteria
-------------

 -  Reviewer feedback has been addressed or explicitly documented.
 -  Full checks pass through `mise`.
 -  Plan statuses reflect the actual project state.
 -  The final commit is created with the message listed above.
 -  This plan file is updated to `Done`.
