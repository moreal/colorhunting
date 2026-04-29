Plan 03: Design System and Storybook
====================================

Status
------

 -  State: Done
 -  Owner: Main implementation agent
 -  Depends on: [Plan 01](./01-react-migration.md)
 -  Resume from: Completed
 -  Commit message: `Build Storybook design system components`


Goal
----

Build the reusable React design-system components needed for the Colorhunting
flow and make their states visible in Storybook.


Naming Rules
------------

 -  Use PascalCase names for component files and exports.
 -  Translate Figma layer names into product names:
     -  `Btn_Remove` becomes `RemoveButton`.
     -  `Btn_DOWNLOAD` becomes `DownloadButton`.
     -  `Btn_INFO` becomes `InfoButton`.
     -  `Btn_X` becomes `CloseButton`.
     -  `LOGO` becomes `Logo`.
 -  Avoid abbreviations unless they are common product language.


Component Scope
---------------

Build these components before page composition:

 -  `Logo`
 -  `InfoButton`
 -  `CloseButton`
 -  `RemoveButton`
 -  `DownloadButton`
 -  `ColorCard`
 -  `ImageSlot`
 -  `ImageBoard`
 -  `BottomActionBar`
 -  `InfoPopup`


Tasks
-----

 -  [x] Storybook setup
     -  Add Storybook for React and Vite.
     -  Add `mise` tasks for Storybook development and Storybook build if needed.
     -  Keep Storybook configuration minimal and local to this repository.
 -  [x] Design tokens
     -  Define the first token layer for color, spacing, type, radius, and motion
        timing.
     -  Keep tokens in code so tests and components can share them.
     -  Avoid hardcoding Figma layer names into public APIs.
 -  [x] Component implementation
     -  Implement semantic HTML and keyboard-friendly controls.
     -  Add visible disabled, focus, hover, active, loading, and completed states
        where relevant.
     -  Use Motion only where state transitions benefit from it.
     -  Keep components controlled by props.
 -  [x] Storybook stories
     -  Add stories for every meaningful state.
     -  Include `DownloadButton` states: enabled, completed, disabled.
     -  Include `ImageBoard` states: empty, partially filled, full.
     -  Include `InfoPopup` open and closed states.
 -  [x] Automated tests
     -  Test accessible names, roles, disabled states, keyboard behavior, and visible
        state labels.
     -  Add interaction tests where component state transitions are meaningful.
     -  Use Korean test titles.
 -  [x] Verification
     -  Run `mise run test`.
     -  Run `mise run lint`.
     -  Run Storybook build through a `mise` task if that task exists by then.


Review Notes
------------

After the implementation pass, ask reviewers to focus on:

 -  Whether components are reusable page building blocks.
 -  Whether component props are stable and explicit.
 -  Whether Storybook exposes all meaningful states.
 -  Whether tests would catch realistic regressions.
 -  Whether naming is readable to a new contributor.


Done Criteria
-------------

 -  Storybook can display the design-system components.
 -  Components use PascalCase names and product-oriented APIs.
 -  Tests cover states and interactions in Korean.
 -  Relevant checks pass through `mise`.
 -  This plan file is updated to `Done`.
