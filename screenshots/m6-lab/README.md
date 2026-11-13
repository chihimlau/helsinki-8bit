# M6 Lab — Senate Diorama side test

**Branch:** `m6-lab-diorama`  
**URL:** `/?lab=senate-diorama&preset=day&debug=1&area=helsinki-kruununhaka`

## Goal
Recreate the Helsinki Cathedral / Senate Square pixel diorama art style. Lab is a floating-island focus for eye QA; reusable art ports back to full map (`m6-look`) after you pass.

## What to open
1. Preview this branch (Cloudflare Pages or local `npm run build && npx vite preview`)
2. Open the lab URL above
3. Compare `lab-hero.png` / live view to your reference diorama

## Screenshots here
- `lab-hero.png` — default locked composition
- `lab-cathedral.png` — after jumping to Cathedral
- `lab-square.png` — Senate Square
- `lab-mobile-390x844.png`

## Done in this pass (phases 1–5 bundled)
1. Larger Cathedral silhouette (body, colonnade, drum, big teal dome, secondary domes, stairs)
2. Warm-white / teal / soft-yellow materials, brighter day plate
3. Chunky 4-shade trees
4. Large low-contrast plaza tiles
5. Lab RT 640×360, quieter outline; no LoD1 chunks in lab

## Your check
Reply **pass** / **not yet** + what still fails vs the reference. Then we merge art into `m6-look` full map.
