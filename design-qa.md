# Supply section design QA — 2026-09-11

final result: passed

## Visual target and evidence
- Selected target: ChatGPT generated image file_00000000a32c81f4a33cd37986db6f56, explicitly approved by the user.
- Source capture: private/catalog-research/supply-reference-qa.png (996×920), source region private/catalog-research/supply-reference-region.png.
- Implementation: http://127.0.0.1:3000/#business; screenshot private/catalog-research/supply-desktop-final.png (1425×990 viewport content, requested desktop viewport 1440×1000).
- Same-state side-by-side comparison: private/catalog-research/supply-comparison-final.jpg. Browser chrome excluded; content widths normalized to 1000 px, aspect ratios preserved. Source region 682×335 and implementation region 1252×581. Scale differences were not treated as product defects.
- Focused banner and process text are readable in the combined image; separate detail crops were unnecessary.
- Mobile and tablet evidence: private/catalog-research/supply-mobile-qa.png, supply-tablet-qa.png.

## Findings and iteration history
1. P2: initial cover image cropped the employee cap on desktop. Reduced the photo container to 76% of the banner and moved its focal point upward. Final capture shows head and tablet.
2. P2: warehouse detail competed with copy at 768 px. Added a photo mask into the charcoal background, disabled on stacked mobile layout. Tablet recapture confirms readable copy and separated employee.
3. Original defects resolved: no photo step cards, no images overlapping text, no fixed service-section height, no mismatching gradients between adjacent sections.

## Required fidelity surfaces
- Typography: existing Golos Text, 36 px section heading / up to 38 px banner heading, 17 px step titles, 14 px descriptions. Slightly more restrained than the raster mock to keep the existing site type scale. No truncation or hidden copy.
- Spacing: shared page gutters; 72 px section transition on desktop / 48 px mobile; four open step columns desktop, two columns mobile. Header and section left edges match exactly.
- Color: existing warm canvas retained consistently across solutions, supply and manufacturers. Charcoal banner and red CTA match selected direction.
- Image: dedicated generated warehouse photo, 2048×768, optimized WebP 66,538 bytes; no rasterized UI. Phosphor library icons remain crisp. Regenerated employee photo preserves the approved composition, rather than copying screenshot pixels.
- Copy: approved banner and four process steps; real email and phone actions in the request dialog.

## Verification
- Production build: 454 static routes; TypeScript checks passed.
- Widths 320, 390, 768, 1024, 1440 and 1920 inspected. Automated DOM measurements at 320/768/1024/1920: no horizontal overflow, zero header/section left-edge delta, photo loaded, identical section background colors. See supply-responsive-qa.json.
- Primary CTA opens labeled native dialog, email URL is valid, Escape closes it and focus returns to CTA. No request is represented as submitted.
- Browser console: no errors captured.
- Existing manufacturer content, catalogue, search and sticky header retained.

## Follow-up polish
No blocking P0/P1/P2 issues remain. Existing global telephone form elsewhere on the homepage is outside this selected section and remains unchanged.
