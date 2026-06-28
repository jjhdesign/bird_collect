---
name: project-bird-dex-design-system
description: Established design conventions for the Korean bird field guide (조류도감) app
metadata:
  type: project
---

Forest green (forest-50 to forest-900) is the primary palette; amber is the accent for 1st-place/gold states (Ranking podium). Slate-700 to slate-900 gradient is the established "locked/undiscovered" treatment applied to BirdCard and DexDetail hero areas.

**Why:** App is a Pokédex-style discovery app — locked birds need visual mystery, not just gray placeholders. Dark atmospheric backgrounds signal "undiscovered" to users without explanation.

**How to apply:** Any silhouette or locked-state image area should use `bg-gradient-to-br from-slate-700 to-slate-900` with `brightness-0 invert opacity-20` on the silhouette image. Unlocked birds with real photos use `bg-gray-100`.

---

## Color tokens
- forest-300: #86efac (added for mid-tone use)
- forest-400: #4ade80 (added for mid-tone use)
- Amber = podium/gold accent (1st place, rare moments)
- Orange = 3rd place / endangered-II badge
- Red = endangered-I badge (semantic danger color, not decorative)

## Typography
- Font: Noto Sans KR (400/500/600/700/900) loaded via CSS @import in index.css
- Base applied via @layer base in index.css

## Icons
- All icons are inline SVG (no external icon library dependency)
- Style: 24px viewBox, stroke-based, strokeWidth 1.75 for nav/secondary; 2.0 for primary actions; 2.5 for small button icons
- Camera icon: path + circle pattern (path d="M23 19..." + circle cx="12" cy="13" r="4")
- Back arrow: chevron-left style (path d="M19 12H5M12 5l-7 7 7 7")
- Lock icon: rect + path for padlock body and shackle

## Navigation
- BottomNav: 4 items with inline SVG icons (IconCollection=grid, IconBook=book, IconChart=bar-chart, IconPerson=person)
- Active state: top border indicator (w-8 h-0.5 bg-forest-600) + text-forest-700
- Inactive: text-gray-400

## FAB buttons (Dex + Collection)
- w-14 h-14 bg-forest-600, camera SVG icon (w-6 h-6), fixed bottom-20 right-4
- No emoji in FAB buttons

## Progress bar (Dex page)
- Height: h-2.5 (10px) — increased from original h-1.5 for mobile visibility
- Track: bg-forest-100 (cohesive with palette)
- Fill: bg-forest-500

## Ranking podium
- Slots displayed in order: 2nd (left), 1st (center), 3rd (right)
- Heights: 1st=h-20, 2nd=h-14, 3rd=h-10
- Avatar sizes: 1st=w-14h-14, 2nd=w-11h-11, 3rd=w-10h-10
- Colors: 1st=amber-400, 2nd=gray-300, 3rd=orange-300
- Rank 4+ shown as a separate regular list below the podium

## Empty states
- Collection empty: forest-50 circle container with camera SVG illustration, descriptive text, primary CTA button with camera icon
- Pattern: illustration circle + headline + sub-copy + action button
