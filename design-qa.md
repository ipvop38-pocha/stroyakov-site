# Manufacturers and partners design QA — 2026-09-11

Final result: passed for the changed sections.

## Selected target
User-selected architecture concept, file_00000000272481f4a82025eadeb50d81.
Source: private/catalog-research/brands-concepts/architecture.png.
Side-by-side comparison: private/catalog-research/brands-comparison-final.jpg.
Implementation capture: private/catalog-research/brands-desktop-final.png.
Source and implementation sections cropped without browser chrome, normalized to 900 px width with preserved aspect ratios and shown together.

## Implementation
- Ten original manufacturer logos in two open desktop rows; two columns on mobile. No individual cards or descriptions.
- Original partner artwork preserved using bounded CSS sprite regions from the existing asset; six logos with accessible names.
- Dedicated generated architectural photograph, optimized as architecture-v1.webp. Photo contains no interface, text or project claims.
- Existing warm canvas, page gutter, Golos Text, red accent and thin horizontal rules retained.
- Every manufacturer link applies the exact catalogue brand filter. All brands link reveals the full filter list and opens the filter drawer on mobile.
- User-supplied favicon raster preserved inside a rounded SVG clipping path, excluding the baked checkerboard outside the dark tile. ICO 16/32/48, PNG 48, Apple icon 180, SVG provided; metadata versioned to avoid stale browser caches.

## Findings resolved
- Initial grayscale filter darkened white logo backgrounds. Replaced with white-preserving grayscale and adjusted ROKS separately for legibility.
- Initial optical sizes made Ильский строитель and ВОЛМА too small because their source PNGs contain horizontal whitespace. Corrected rendered sizes.
- At 768 px the image was shorter than the adjacent copy. Final tablet image stretches to the same top and bottom as copy (377.78 px measured).

## Verification
- Production build passed; all 454 static routes generated and TypeScript validation passed.
- git diff --check passed.
- Desktop 1440, tablet 768 and mobile 390 inspected. No horizontal overflow; all 11 section images loaded.
- Mobile lower section separately inspected: all six partners visible, geography wraps without clipping, clean transition to existing calculation section.
- Clicking Ильский строитель opens the catalogue with ИС selected and 12 matching products.
- Mobile All brands link opens the filter drawer with all 42 known brands plus the unbranded option.
- Icon metadata URLs confirmed in rendered document; Apple icon visually inspected without checkerboard corners.
- Evidence: brands-mobile-final.png, brands-mobile-bottom.png and brands-tablet-final.png in private/catalog-research.

## Remaining limitations
Original supplied manufacturer images retain their existing resolution and artwork; no logos were redrawn from generated references. The older calculation form elsewhere on the page is outside this selected change.
No blocking P0/P1/P2 design issues remain in the changed sections.
