Plan 05: Image Board Page
=========================

Status
------

 -  State: Done
 -  Owner: Image board page implementation agent
 -  Depends on:
     -  [Plan 02](./02-domain-state-and-storage.md)
     -  [Plan 03](./03-design-system-and-storybook.md)
 -  Resume from: Completed
 -  Commit message: `Build image board and export flow`


Goal
----

Implement the second product page: a confirmed color theme drives a 3x3 image
board. The user can fill image slots, remove images, and download the full board
as one image.


Behavior Scope
--------------

 -  The page only renders for:

~~~~ ts
{
  state: "COLOR_DETERMINED",
  color,
  images,
}
~~~~

 -  `images` is always exactly 9 slots.
 -  Empty slots are visually distinct from filled slots.
 -  Filled slots can be removed.
 -  The board can be exported as a single image.
 -  Download state must reflect whether export is currently available, completed,
    or disabled.


Tasks
-----

 -  [x] Board behavior
     -  Define accepted image input types.
     -  Define how uploaded images are represented in persisted state.
     -  Define removal behavior.
     -  Define when download is enabled, disabled, and completed.
 -  [x] Board export module
     -  Implement image composition outside React rendering.
     -  Keep a stable API such as `composeBoardImage(images, options)`.
     -  Validate input before composition.
     -  Return a downloadable `Blob` or object URL through an explicit API.
 -  [x] Page composition
     -  Use `ImageBoard`, `ImageSlot`, `RemoveButton`, and `DownloadButton`.
     -  Keep board slot updates flowing through domain transition helpers.
     -  Persist every meaningful board change.
 -  [x] Motion transitions
     -  Animate image slot fill and removal.
     -  Animate download state changes.
     -  Avoid layout shifts in the 3x3 board.
 -  [x] Accessibility and UX
     -  File inputs must have accessible labels.
     -  Removal controls must identify the slot they affect.
     -  Disabled download state must be clear and semantic.
     -  The board layout must remain stable on mobile-sized viewports.
 -  [x] Tests
     -  Cover empty, partial, and full board states.
     -  Cover image add and remove behavior.
     -  Cover download enablement and completed state.
     -  Cover export input validation.
     -  Use Korean test titles.
 -  [x] Verification
     -  Run `mise run test`.
     -  Run `mise run lint`.


Sub-Agent Scope
---------------

This page can be implemented by a focused worker agent after Plans 02 and 03 are
complete. The worker should own only image-board page files, board export logic,
and related tests. The worker must not edit the color-selection page except for
integration types agreed in Plan 06.


Review Notes
------------

After the implementation pass, ask reviewers to focus on:

 -  Whether board export logic is separate from rendering.
 -  Whether image state is persisted safely.
 -  Whether file and download controls are accessible.
 -  Whether the fixed 3x3 layout avoids shifts and overflow.
 -  Whether tests prove user-visible behavior.


Done Criteria
-------------

 -  Users can fill, remove, and download a 3x3 board.
 -  Board changes are represented in the domain state model.
 -  Export logic is tested independently of React rendering.
 -  Relevant checks pass through `mise`.
 -  This plan file is updated to `Done`.
