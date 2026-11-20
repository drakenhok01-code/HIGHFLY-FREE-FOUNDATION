# HIGHFLY F0.14.8 — Premium art laboratory (20 Nov 2026)

## Protected baseline
- Approved tree: `4e481e102a1237e72eb86533134d9240d6c74faf`.
- Approved commit: `38e59550766b0914652eb7412393f91b298e29f6`.
- Recovery branch `f014-premium-rpg-ui-lab` and backup `backup-f0148-before-visual-149-20261120` MUST NOT be modified by this experiment.
- This branch: `lab-f0148-premium-art-integration-20261120`.

## Implementation completed in the lab
- Real RPG DOM + game mechanics preserved; top nav, inventory, gear, quests, professions, skills, forge, maps and options still interactive.
- A custom scoped `premium-art-lab.css` enhances frames, gold/violet details and responsive 915×412 CSS.
- `premium-vector-art.mjs`: 13 unique item IDs, 8 profession IDs and 10 empty slot silhouettes as individual transparent SVG markup, never baked UI screenshots.
- Inventory, equipment, forge and professions reuse the same semantic object ID for illustrations.
- Skill SVG art no longer contains the same rectangular frame baked into each icon.
- `premium-quest-illustrations.mjs`: 19 semantic SVG variants keyed by native quest IDs/title. They are *temporary vectors*, not painted high-res final scenes.
- Original `approved-hero.webp` stage background, `forge-chamber.svg` and the living KayKit 3D canvas are unchanged.
- Build pipeline copies the new modules; GitHub Actions on this branch runs QA but deploy is gated to the published `f014-premium-rpg-ui-lab` branch.

## Verified
- GitHub Actions run 44825341667 passed build + static/mechanics tests + Playwright Chromium/Android 915x412 + KayKit WebGL/rig QA.
- Browser screenshots include character, attributes, bag, skills, professions, forge, quests, map and options.
- Tests assert 13 real item asset IDs, 8 professions, 10 equip silhouettes, 19 quest scene IDs.

## Not yet approved and NOT published
- Current semantic SVG icons and quest art do not visually reproduce the full painterly fidelity of the supplied nine references. Do not call them final 8K assets.
- Three illustration-only WebP crops from the user references are prepared outside the repository, for `names`, `vellum` and `count`. Their original crop dimensions are about 900×460. These are NOT yet committed. No text, progress counters or buttons are baked into these crops.
- 16 additional mission scenes plus final individual raster art for the remaining items, professions and iconography still need approval/source assets.
- Chromium screenshot of the menu captures a transient 3D character loading state; independent KayKit WebGL QA succeeds, but final real-menu portrait deserves manual Android verification before release.
- Never merge the lab branch or deploy it based solely on CI status. Compare all menus at 915x412 and touch-test on an actual S23 Ultra.

## Integration principle
A static image may decorate a panel or show a quest illustration, but counts/slots/buttons/counters/actions never move into the image. The game owns the frames. Character remains an actual live Canvas model. Item art is keyed by exact native IDs. No fake character over live KayKit.
