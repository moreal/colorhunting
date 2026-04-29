Plan 06: App Integration
========================

Status
------

 -  State: Done
 -  Owner: Main implementation agent
 -  Depends on:
     -  [Plan 02](./02-domain-state-and-storage.md)
     -  [Plan 04](./04-color-selection-page.md)
     -  [Plan 05](./05-image-board-page.md)
 -  Resume from: Completed
 -  Commit message: `Connect persistent Colorhunting flow`


Goal
----

Wire the color-selection page, image-board page, and persistent state into one
coherent Colorhunting application.


Behavior Scope
--------------

 -  App startup loads persisted state.
 -  Missing or invalid persisted state starts at `{ state: "NO_COLOR" }`.
 -  Confirming a color moves to the image-board page.
 -  Board updates persist.
 -  Resetting the flow returns to color selection and clears persisted board data.
 -  Refreshing the tab preserves the current valid state.


Tasks
-----

 -  [x] Application shell
     -  Keep `App` responsible for loading, saving, and routing between the two
        state-driven pages.
     -  Avoid putting page-specific business logic in `App`.
 -  [x] Startup states
     -  Add explicit loading state while storage is read.
     -  Add safe fallback state if storage fails.
     -  Ensure startup does not flash the wrong page.
 -  [x] State actions
     -  Add clear action callbacks for color confirmation, image changes, board
        reset, and full flow reset.
     -  Persist state after successful transitions.
     -  Handle persistence errors without corrupting in-memory state.
 -  [x] Page transition motion
     -  Use Motion to animate between major app states.
     -  Keep animations deterministic enough for tests.
 -  [x] Integration tests
     -  Cover startup from no persisted state.
     -  Cover startup from confirmed color state.
     -  Cover confirm-to-board flow.
     -  Cover refresh-style state reload.
     -  Cover reset back to color selection.
     -  Use Korean test titles.
 -  [x] Verification
     -  Run `mise run test`.
     -  Run `mise run lint`.
     -  Run `mise run build`.


Review Notes
------------

After the implementation pass, ask reviewers to focus on:

 -  Whether `App` coordinates state without owning page behavior.
 -  Whether storage errors are handled predictably.
 -  Whether app state transitions are easy to follow.
 -  Whether integration tests describe full user workflows.


Done Criteria
-------------

 -  The two pages work as one persistent app flow.
 -  Refresh/reload behavior is tested.
 -  Relevant checks pass through `mise`.
 -  This plan file is updated to `Done`.
