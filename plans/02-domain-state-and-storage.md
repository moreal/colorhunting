Plan 02: Domain State and Persistent Storage
============================================

Status
------

 -  State: Done
 -  Owner: Main implementation agent
 -  Depends on: [Plan 01](./01-react-migration.md)
 -  Resume from: Completed
 -  Commit message: `Add persistent app state model`


Goal
----

Define the application state model and persist it in IndexedDB so the user can
close or refresh the tab without losing the selected color or board images.


Behavior Scope
--------------

The app state has two valid top-level states:

~~~~ ts
type AppState =
  | { state: "NO_COLOR" }
  | {
      state: "COLOR_DETERMINED";
      color: Color;
      images: Array<Image | null>;
    };
~~~~

The `images` array must always represent exactly 9 board slots.


Tasks
-----

 -  [x] Domain types
     -  Define `Color` as the product-facing color type.
     -  Define `Image` as the persisted image-slot type.
     -  Define `AppState` as a discriminated union.
     -  Add helpers for creating a valid empty board and validating board length.
 -  [x] State transition helpers
     -  Add pure helpers for selecting a color, resetting to no color, adding an
        image, removing an image, and replacing the full board.
     -  Ensure invalid slot indexes are rejected or ignored through explicit,
        tested behavior.
 -  [x] IndexedDB storage module
     -  Add a small storage adapter with public APIs such as `loadAppState`,
        `saveAppState`, and `clearAppState`.
     -  Keep browser APIs behind this module so UI tests can mock storage cleanly.
     -  Validate loaded data before accepting it.
     -  Fall back to `{ state: "NO_COLOR" }` for missing, corrupt, or incompatible
        data.
 -  [x] Tests
     -  Cover valid state transitions.
     -  Cover invalid slot indexes.
     -  Cover missing, corrupt, and incompatible stored data.
     -  Cover persistence and reload behavior at the storage API boundary.
     -  Use Korean test titles.
 -  [x] Verification
     -  Run `mise run test`.
     -  Run `mise run lint`.


Review Notes
------------

After the implementation pass, ask reviewers to focus on:

 -  Whether storage is isolated from rendering.
 -  Whether the union state prevents impossible UI states.
 -  Whether corrupt persisted data is handled safely.
 -  Whether test names and assertions communicate user-visible behavior.


Done Criteria
-------------

 -  `AppState` and related domain types are available through stable public module
    exports.
 -  IndexedDB persistence works without leaking storage concerns into UI
    components.
 -  Bad persisted data cannot crash app startup.
 -  Relevant checks pass through `mise`.
 -  This plan file is updated to `Done`.
