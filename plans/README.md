Colorhunting Implementation Plans
=================================

This directory tracks the execution plan for rebuilding Colorhunting from the
current SolidJS prototype into a React application with Motion animations,
Storybook-verified design-system components, persistent app state, and the two
main product pages described in the Figma file.

Each plan file is designed to be picked up by an LLM or engineer without needing
the full original conversation. Start from the first plan whose status is not
`Done`.


Status Legend
-------------

 -  `Not started`: no implementation work has begun.
 -  `In progress`: implementation has started but is not complete.
 -  `Blocked`: a decision, dependency, or external issue must be resolved first.
 -  `Reviewing`: implementation exists and reviewer feedback is being processed.
 -  `Done`: implementation, tests, review, and relevant checks are complete.


Execution Order
---------------

| Order | Plan                                                                    | Status      | Resume Rule                                                                       | Commit Message                                  |
| ----- | ----------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1     | [React Migration](./01-react-migration.md)                              | Done        | Start here if SolidJS is still present in `package.json` or `vite.config.ts`.     | Replace Solid with React application foundation |
| 2     | [Domain State and Persistent Storage](./02-domain-state-and-storage.md) | Done        | Start here if `AppState` and IndexedDB storage APIs do not exist.                 | Add persistent app state model                  |
| 3     | [Design System and Storybook](./03-design-system-and-storybook.md)      | Not started | Start here if shared PascalCase UI components or Storybook are missing.           | Build Storybook design system components        |
| 4     | [Color Selection Page](./04-color-selection-page.md)                    | Not started | Start here if color selection is not implemented as a page backed by app state.   | Build color selection page                      |
| 5     | [Image Board Page](./05-image-board-page.md)                            | Not started | Start here if the 3x3 image board and board export flow are missing.              | Build image board and export flow               |
| 6     | [App Integration](./06-app-integration.md)                              | Not started | Start here if the pages exist but are not wired into one persistent user flow.    | Connect persistent Colorhunting flow            |
| 7     | [Review and Quality Gates](./07-review-and-quality-gates.md)            | Not started | Start here after the implementation pass is complete or reviewer feedback exists. | Apply review feedback and final quality checks  |


Repository Rules
----------------

 -  Run project commands through `mise`.
 -  Prefer `mise run <task>` for repository workflows.
 -  Use `mise exec -- <command>` only when a direct tool command is necessary.
 -  Use Yarn 4 and keep dependency changes intentional.
 -  Do not use conventional commit prefixes for this work. Use the clear commit
    messages listed in each plan.
 -  Tests that describe behavior must use Korean test titles, even though these
    plan documents are written in English.
 -  Use PascalCase names for components, types, files, and exports where
    applicable. Prefer `RemoveButton` and `DownloadButton` over Figma layer
    names such as `Btn_Remove`.


Resume Checklist
----------------

Before starting a new session:

1.  Read this README.
2.  Find the first plan with a status other than `Done`.
3.  Open that plan and continue from the first unchecked task.
4.  Update the plan status and checklist as work progresses.
5.  Commit each completed plan with the plan's clear commit message.
6.  If reviewer feedback is intentionally not addressed, record the reason in
    the relevant plan file before finishing.
