# HIGHFLY — F0.11.4 + F0.11.5 — Laboratory acceptance report

## Single actor guarantee
One original Unsung Player/capsule and one stylized KayKit FREE skinned Knight.
No second Quaternius mannequin, no KayKit SOURCE or restricted ClaudeCraft assets.

## Context and item action policy
- The independent USAR action addresses explicitly tagged pickup/loot objects.
- The universal teal circle chooses TALAR for tagged tree nodes, PICAR for tagged ore nodes,
  PESCAR for qualifying nearby deep water, TREPAR otherwise.
- Native tree trunk collision remains a valid climbing surface unless a specific resource tag overrides.
- Object inventories, ore harvesting and wood yield are still previews, not a real economy.

## F0.11.4 — Collision-driven climbing
- One tap latches climbing. A second tap, DASH, or SALTO detaches.
- Raycast samples multiple heights and 5 angular offsets to tolerate lumpy rock.
- Upper ledge probe attempts mantle; terrain and capsule remain authoritative.
- Character animation amplitude follows collision-accepted displacement.
- No automatic climbing when blocked and no artificial grip drift at idle.
- Stamina depletes while latched, slower when holding still.

## F0.11.5 — Attack locomotion and swim
- Native Unsung combo / stamina / damage / hit windows are unchanged.
- A temporary interception adjusts horizontal velocity BEFORE the sole native physics integration.
- Idle attacks plant feet; walking/running attacks select lower-body gait from real speed.
- Changing leg gait preserves stride phase.
- Swim uses Quaternius CC0 rotations retargeted to the original KayKit bones.
- 120-frame WebGL QA checks head stability, real arm motion and upright recovery.

## CI and limitations
- 46/46 controller integration tests passed on the first full 0.11.4/5 green controller run.
- Real KayKit GLB/41 bones/76 clips and Quaternius animation tests passed in Chromium.
- S23 landscape simulated DOM QA confirms context button and independent DASH pointing.
- Full-world Chromium software-WebGL smoke failed to complete the **cosmetic terrain pre-bake**
  within its timeout. That specific test is retained as a diagnostic, **not a passing gate**.
- Real S23 device tests are still required, particularly on irregular rock surfaces, water entry
  and exiting upper ledges; no Android hardware run has been claimed.

The F0.11.4/5 release is a test candidate, not a certified production build.
