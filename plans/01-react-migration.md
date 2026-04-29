Plan 01: React Migration
========================

Status
------

 -  State: Done
 -  Owner: Main implementation agent
 -  Depends on: None
 -  Resume from: Completed
 -  Commit message: `Replace Solid with React application foundation`


Goal
----

Replace the current SolidJS/Vite setup with a React/Vite setup so Motion can be
used through its officially supported React API. Preserve existing pure domain
logic where possible.


Behavior Scope
--------------

 -  The app renders through React.
 -  The Vite dev server, test runner, lint, format, and build workflows still run
    through `mise`.
 -  Existing palette behavior remains available until later plans replace the
    prototype UI.
 -  Tests use React Testing Library instead of Solid rendering APIs.


Tasks
-----

 -  [x] Dependency changes
     -  Remove Solid runtime and Solid Vite plugin packages.
     -  Add React, React DOM, React Vite plugin, and Motion for React.
     -  Add React testing dependencies if missing.
     -  Run dependency installation with `mise run install`.
 -  [x] Vite and TypeScript migration
     -  Replace `vite-plugin-solid` with `@vitejs/plugin-react`.
     -  Ensure JSX settings match React.
     -  Keep Vitest configured with `jsdom`, CSS loading, and existing setup file.
 -  [x] Entry point migration
     -  Replace Solid's `render` from `@solidjs/web` with React DOM `createRoot`.
     -  Keep `src/main.tsx` small and focused on mounting the app.
 -  [x] App component migration
     -  Replace Solid primitives such as `createSignal`, `createMemo`, `Show`, and
        `For` with React state, memoization, and normal JSX control flow.
     -  Keep existing observable palette behavior intact until page-level plans
        replace it.
 -  [x] Test migration
     -  Rewrite component tests with React Testing Library.
     -  Keep behavioral coverage equivalent to the existing Solid tests.
     -  Use Korean test titles.
 -  [x] Verification
     -  Run `mise run test`.
     -  Run `mise run lint`.
     -  Run `mise run build`.


Review Notes
------------

After the implementation pass, ask reviewers to focus on:

 -  Whether the migration removed Solid completely.
 -  Whether the React app preserves the previous behavior.
 -  Whether the tests check behavior instead of implementation details.


Done Criteria
-------------

 -  `package.json` and lockfile no longer reference SolidJS packages.
 -  Vite uses React.
 -  The app mounts successfully through React.
 -  Relevant tests, lint, and build pass through `mise`.
 -  This plan file is updated to `Done`.
