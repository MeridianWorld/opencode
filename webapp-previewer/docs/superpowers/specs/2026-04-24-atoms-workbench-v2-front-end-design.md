# Atoms Workbench V2 Front-End Design

## Goal

Rebuild only the workbench page in `webapp-previewer` so it visually and behaviorally reads like the supplied Atoms workbench references at a glance, with milestone 1 prioritizing screenshot-level fidelity over backend realism.

## Scope

This spec covers only the workbench page experience:

- the shared outer shell
- the top capsule toolbar
- the left conversation surface
- the middle deep-blue workflow spine
- the right `App Viewer / Design` work surface
- the right `Editor` work surface

This spec does **not** cover:

- homepage / marketing pages
- pricing / resources navigation outside the workbench shell
- real backend publishing / generation behavior
- final production data binding to the official OpenCode session state

## References

Primary visual references:

- Atoms workbench reference link:
  - `https://atoms.dev/chat/367a3a8730b3487f92a1a926fa7ef725`
- Local screenshot references supplied by the user:
  - `C:/Users/Administrator/Pictures/Screenshots/屏幕截图 2026-04-08 210154.png`
  - `C:/Users/Administrator/Pictures/Screenshots/屏幕截图 2026-04-08 210227.png`
- Repository snapshot used during analysis:
  - `D:/github_repo/opencode/webapp-previewer/atoms-dev-screenshot.png`

## Product Intent

The page must stop reading like “OpenCode with an Atoms skin” and instead read like an Atoms workbench reproduction. The immediate visual impression matters more than preserving the current shell composition. The user should recognize the same product family from:

- proportions
- toolbar density
- chip and pill styling
- whitespace rhythm
- dark-blue navigation spine
- left conversation framing
- right content-surface treatment

If a choice improves compatibility with the current OpenCode page shell but weakens the Atoms visual match, that choice should lose in milestone 1.

## Core Decisions

### 1. New front-end shell, not a continuation of the current hybrid shell

Milestone 1 should build a new `atoms-v2` style component tree inside `webapp-previewer`, rather than continuing to evolve the current `src/pages/session/atoms/*` components as the primary visual base.

Reason:

- the current shell still inherits too much OpenCode layout language
- visual fidelity is now the top-level requirement
- a clean shell is easier to tune at the pixel level

### 2. Thin route mount, thick visual shell

`src/pages/session.tsx` should become a thin mount point that passes minimal inputs into the new workbench shell. It should not remain the place where detailed visual layout is authored.

Reason:

- it keeps the route integration path available later
- it prevents OpenCode page structure from dictating the visible workbench design

### 3. Demo data first

Milestone 1 may use stable demo data for messages, file trees, tabs, forms, and editor content.

Reason:

- the user explicitly prioritized front-end fidelity first
- stable visual fixtures are required for screenshot-level comparison
- real data can be adapted later without forcing layout compromise now

### 4. New design-token layer

The rebooted workbench must have its own visual token layer for:

- colors
- radii
- border opacity
- shadows
- spacing
- icon sizes
- control heights
- typography weights

Reason:

- inheriting current OpenCode tokens would keep the page visually anchored to the wrong product language

## Milestone 1 Target States

Milestone 1 must reproduce two concrete workbench states.

### State A: App Viewer / Design

This is the primary target state and should be the first one implemented.

It includes:

- a pale outer background
- a floating top toolbar with capsule controls
- a left conversation column with soft cards and a bottom docked composer
- a narrow dark-blue workflow/navigation spine
- a right white product surface showing an app-design state

This state is the baseline shell. All other milestone-1 states inherit its outer frame.

### State B: Editor

This is the secondary target state and must share the exact same outer frame as State A.

It includes:

- the same toolbar
- the same left conversation surface
- the same dark-blue workflow spine
- a right editor layout with:
  - left file tree
  - top tab strip
  - document canvas
  - top-right action icon cluster

The transition between State A and State B must feel like the right work surface swapped while the product shell stayed stable.

## Shared Shell Architecture

The milestone-1 page is composed of four persistent visual regions.

### 1. Top Capsule Toolbar

Responsibilities:

- workbench title capsule
- mode indicator capsule
- icon clusters for secondary actions
- right-aligned `Publish` action

Visual requirements:

- very light border
- soft filled capsules
- generous horizontal spacing
- compact icon density
- low-contrast neutral chrome with one strong primary action

This must not look like:

- a browser tab bar
- an IDE ribbon
- the current OpenCode titlebar

### 2. Left Conversation Surface

Responsibilities:

- prompt / request context
- message progress cards
- result summaries
- bottom composer dock

Visual requirements:

- pale background
- large whitespace
- low-noise message framing
- soft rounded cards
- subtle separators
- strong vertical rhythm

This must not look like:

- a developer terminal chat log
- a dense LLM transcript
- a generic chat sidebar

### 3. Middle Workflow Spine

Responsibilities:

- compact project identity
- current step highlight
- surrounding steps
- stage-navigation continuity

Visual requirements:

- deep blue background
- brighter selected item
- restrained typography
- vertical focus
- stable narrow width

This must read like a workflow spine, not a typical application sidebar.

### 4. Right Work Surface

Responsibilities:

- host `App Viewer / Design`
- host `Editor`
- later host `Files` and `Inspect`

Visual requirements:

- white or near-white work canvas
- light edge treatments
- large rounded content surfaces where appropriate
- minimal visual noise
- product-tool feeling instead of IDE chrome

## Visual Fidelity Contract

Milestone 1 is accepted only if the page matches the references closely in the following dimensions.

### Layout and proportion

- left conversation width
- middle spine width
- right surface dominance
- top toolbar height and horizontal padding
- internal panel margins

### Shape language

- capsule buttons
- control radii
- card radii
- toolbar pill geometry
- editor tab geometry

### Border and shadow language

- thin grey borders
- subtle panel separation
- restrained shadows
- no heavy dark outlines

### Color relationships

- pale neutral page background
- deep blue workflow spine
- white product surfaces
- soft muted grey chrome
- blue primary action emphasis

### Typography hierarchy

- large confident headings
- muted supporting copy
- restrained labels
- dense but not cramped toolbar text

### Control density

- icon sizing
- icon spacing
- button heights
- tab strip density
- form control height

## Interaction Boundary for Milestone 1

Milestone 1 should be visually convincing but only selectively interactive.

### Must be real interactions

- main mode switch between `App Viewer` and `Editor`
- highlighted workflow-step selection in the blue spine
- basic editable state for the left composer
- editor tab switching
- editor tab closing
- stable shell preservation during mode changes

### May be demo interactions

- complex left-panel agent behavior
- actual publish flow
- actual product generation flow
- most secondary round toolbar buttons
- deep `Files` and `Inspect` behavior
- real persistence of product-side form content

The rule is:

- a real interaction is required when it helps prove the shell behaves like a believable workbench
- a demo interaction is acceptable when real plumbing would distract from visual accuracy

## State Model for Milestone 1

The front-end state for milestone 1 should stay intentionally small.

Required state:

- `mode`
  - `viewer | editor`
- `step`
  - current selected step in the blue spine
- `tabs`
  - ordered open editor tabs
- `active_tab`
  - currently visible editor tab
- `scene`
  - stable demo content set used to recreate the reference state

Optional derived state:

- toolbar selected pill
- highlighted project/work surface label
- current right-surface header copy

Not required in milestone 1:

- real sync subscriptions
- real session replay
- real diff state
- live preview discovery
- real generated files from the active session

## Demo Content Strategy

Milestone 1 should ship with stable demo fixtures that recreate the target screenshots predictably.

Required fixture groups:

- left conversation feed content for the viewer state
- left conversation feed content for the editor state
- blue-spine workflow entries
- app-viewer product form/content
- editor file tree entries
- editor document body
- editor tab labels

The implementation should allow explicit scene switching so the page can be deterministically shown in:

- `viewer-reference`
- `editor-reference`

This is necessary for both visual review and automated regression coverage.

## Integration Boundary

The workbench shell should be inserted into the existing `webapp-previewer` app, but with a clear line between current routing and new visual authorship.

Recommended boundary:

- existing route and session entry continue to decide when the workbench page mounts
- the new shell owns the full visible workbench frame once mounted
- current atoms/session components remain in the repository as the older prototype path

The new shell should not depend on current `atoms-*` visual components for its first milestone presentation.

## Acceptance Criteria

Milestone 1 is complete only when all of the following are true.

### Visual acceptance

- the `App Viewer / Design` state visually matches the supplied reference closely enough that it reads as the same product family on first glance
- the `Editor` state visually matches the supplied reference closely enough that it reads as the same product family on first glance
- the shared shell remains visually stable across the two states
- the page no longer reads like OpenCode UI with different colors

### Interaction acceptance

- the top-level mode switch works
- the blue spine selected state works
- the editor tab switch works
- the editor tab close action works
- the left composer remains visibly editable

### Structural acceptance

- the page is implemented through a new `atoms-v2` style shell path
- milestone 1 does not rely on current OpenCode visual tokens as its main token source
- the session route acts as a mount boundary, not the main visual-authoring surface

## Verification Strategy

Milestone 1 verification should focus on shell stability and reference-state reproducibility.

Recommended checks:

- targeted component tests for state transitions
- page-level tests ensuring:
  - `viewer-reference` renders
  - `editor-reference` renders
  - mode switch preserves the shell
  - tab close preserves the editor surface
- manual side-by-side visual review against the supplied screenshots

This phase should prefer stable, deterministic screenshots over deep behavioral tests.

## Next Step After This Spec

After the user approves this spec, the next artifact should be a new implementation plan for milestone 1 only:

- build the new `atoms-v2` shell
- reproduce `App Viewer / Design`
- reproduce `Editor`
- lock the new shell with focused visual/interaction regressions

