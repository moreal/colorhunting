Plan 04: Color Selection Page
=============================

Status
------

 -  State: Done
 -  Owner: Color selection page implementation agent
 -  Depends on:
     -  [Plan 02](./02-domain-state-and-storage.md)
     -  [Plan 03](./03-design-system-and-storybook.md)
 -  Resume from: Completed
 -  Commit message: `Build color selection page`


Goal
----

Implement the first product page: the user sees the Colorhunting logo, receives
or selects a color, can reset it, can confirm it, and can open the information
popup.


Behavior Scope
--------------

 -  The page starts from `{ state: "NO_COLOR" }`.
 -  A displayed color can be reset before confirmation.
 -  Confirming the color transitions the app to:

~~~~ ts
{
  state: "COLOR_DETERMINED",
  color,
  images: [null, null, null, null, null, null, null, null, null],
}
~~~~

 -  The confirmed state must be persisted through the app storage layer.


Tasks
-----

 -  [x] Page behavior
     -  Define how the initial color is chosen.
     -  Define reset behavior.
     -  Define confirm behavior.
     -  Define info popup open and close behavior.
 -  [x] Component composition
     -  Compose existing design-system components instead of creating page-local
        duplicates.
     -  Use `Logo`, `InfoButton`, `ColorCard`, `InfoPopup`, and a confirm action
        button.
 -  [x] Motion transitions
     -  Animate color card changes.
     -  Animate popup entry and exit.
     -  Animate the transition out of the page after confirmation if the app
        integration layer supports it.
 -  [x] Accessibility and UX
     -  Confirm and reset controls must be keyboard accessible.
     -  Popup focus management must be explicit.
     -  Visible focus states must remain clear on dark and bright color states.
 -  [x] Tests
     -  Cover reset behavior.
     -  Cover confirm behavior and the emitted `AppState`.
     -  Cover popup open and close behavior.
     -  Cover keyboard behavior.
     -  Use Korean test titles.
 -  [x] Verification
     -  Run `mise run test`.
     -  Run `mise run lint`.


Sub-Agent Scope
---------------

This page can be implemented by a focused worker agent after Plans 02 and 03 are
complete. The worker should own only the color-selection page files and related
tests. The worker must not edit the image-board implementation.


Review Notes
------------

After the implementation pass, ask reviewers to focus on:

 -  Whether the page depends on domain APIs instead of duplicating state logic.
 -  Whether interactions remain readable and testable.
 -  Whether Motion usage improves state transitions without hiding behavior.
 -  Whether popup accessibility is complete.


Done Criteria
-------------

 -  The color selection page can confirm a color into persisted app state.
 -  Reset and popup interactions are tested.
 -  Relevant checks pass through `mise`.
 -  This plan file is updated to `Done`.
