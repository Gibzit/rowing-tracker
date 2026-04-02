# Full Polish Pass — Design Spec

**Date:** 2026-04-02
**Scope:** Holistic UX refinement of the Rowing Training Tracker PWA — interaction feel, visual consistency, animation timing, performance, and accessibility. No new features.
**Primary user context:** Mobile-first, logging sessions at the gym quickly.

---

## 1. Card Expand/Collapse Animation

**Problem:** Session cards snap open/closed instantly with no transition.

**Solution:**
- Use `grid-template-rows: 0fr` / `1fr` technique for height animation — works with unknown/variable content height (SessionCard renders IntervalInputs, SessionTimer, PhotoScanButton conditionally). The inner wrapper gets `overflow: hidden` and `min-height: 0`. Transition on `grid-template-rows` at 250ms ease-out.
- Collapse reverses at 200ms ease-in (slightly faster feels snappier)
- Replace ▼/▲ Unicode characters with an SVG chevron that rotates smoothly via `transform: rotate(180deg)` CSS transition (250ms)
- Content opacity fades in ~50ms after height starts opening (staggered feel via `transition-delay`)
- **Structural change:** SessionCard currently uses conditional rendering (`{expanded && (...)}`) at line 232. This must change to always rendering the expanded content in DOM, with the grid animation controlling visibility. The content wrapper gets `visibility: hidden` when collapsed (after transition ends) to prevent tab-focus into hidden content.
- No JS animation libraries needed.

---

## 2. Touch Target & Input Ergonomics

**Problem:** Header buttons are 36px (below 44px WCAG minimum), expanded card form fields feel fiddly on mobile.

**Solution:**
- All interactive elements minimum 44px touch target. Specifically: Manage Plans button in Header (`min-h-[36px]` -> `min-h-[44px]`), and StreakDisplay rest-day buttons (`min-h-[32px]` -> `min-h-[44px]`). ThemeToggle is already 44px.
- Auto-focus pace input when card expands — **deferred until after expand animation completes** (~300ms delay via `onTransitionEnd` callback) to prevent keyboard-triggered layout reflow from janking the animation. `PaceInput.tsx` will need to accept a `ref` via `forwardRef` or expose an `autoFocus` prop.
- Field spacing inside expanded cards increased to 16px gaps between form groups.
- Input font size stays at 16px minimum (prevents iOS auto-zoom).
- Focus states strengthened: `focus:ring-[#00d2ff]/40` with visible border color shift for bright gym lighting.

---

## 3. Visual Consistency — Dark Mode & Spacing

**Problem:** Three dark backgrounds used without system (`#0b1326`, `#0f1b33`, `#1a2640`), inconsistent card padding and section gaps.

**Solution — Dark mode hierarchy:**

| Level | Color | Usage |
|-------|-------|-------|
| Base | `#0b1326` | Page background, app shell |
| Surface | `#0f1b33` | Cards, input fields, content areas |
| Elevated | `#1a2640` | Modals, dropdowns, active states |
| Hover | `#222a3d` | Hover/pressed states on Elevated surfaces (already used in ProgressGrid and SessionCard) |

- Audit all `dark:bg-*` classes and normalize to this 4-tier system. The `#222a3d` value currently in the codebase is kept as a dedicated hover variant — lighter than Elevated but only used for interactive feedback, never as a resting background.
- Standardize card padding to `p-4` (16px). Inner sections `p-3`.
- Section gaps: `gap-4` between cards, `gap-3` within card sections, `gap-6` between major page sections.
- Card borders: all standardized to `border-white/[0.06]` in dark mode.
- Light mode normalization: Base `#f8f9fc`, Surface `white`, Elevated `#f0f3f8`, Hover `#e8ecf2`. Same audit approach — normalize all `bg-*` classes to these tiers.

---

## 4. Animation Timing Harmonization

**Problem:** Entrance timings range from 0.15s to 0.3s. Celebration display durations inconsistent (1500ms vs 2500ms).

**Timing tokens:**

| Token | Duration | Usage |
|-------|----------|-------|
| `fast` | 150ms | Button press, color changes, focus rings |
| `normal` | 250ms | Card expand, dialog entrance, view fade |
| `slow` | 400ms | Celebrations: PB pop, confetti, check bounce |

**Changes:**
- Tab switch fade: 150ms -> 200ms (note: currently set imperatively in `App.tsx` line 69, not in CSS — must update the JS value there as well as any CSS keyframe)
- Dialog pop-in: keep 250ms
- Backdrop fade: 200ms -> 250ms (sync with dialog)
- Toast in/out: 300ms -> 250ms
- Card expand/collapse: 250ms/200ms
- All celebration display durations: normalize to 2500ms (photo scan success bumps from 1500ms)
- Celebration animations (PB pop, confetti, check bounce): keep 400ms

**Reduced motion:** Add `prefers-reduced-motion` media query. When enabled, skip scale/translate animations and use opacity fades only.

---

## 5. Skeleton Loaders for Lazy Tabs

**Problem:** First visit to lazy tabs (Charts, PBs, Calendar, Compare) shows a generic spinner.

**Solution:**
- Replace spinner with skeleton placeholders matching each tab's content shape:
  - Charts: Two rectangular chart-shaped blocks with shimmer
  - PBs: 4-5 horizontal bars of varying width
  - Calendar: 7x5 grid of small squares
  - Compare: Table skeleton with 3-4 rows
- Uses existing `shimmer` animation from photo scan
- Skeletons use Surface (`#0f1b33`) background with Elevated (`#1a2640`) shimmer bands
- ~15-20 lines each, just styled divs
- **Note:** Due to the `useVisitedViews` pattern, skeletons only appear on the very first visit to each tab per app session (while the JS chunk loads). On fast connections or cached visits they'll flash briefly or not at all. Given the low effort (~60 lines total across 4 files), this is still worth doing for the cold-load experience, but expectations should be calibrated — this is not a high-visibility change.

---

## 6. Performance & Debouncing

**Problem:** Achievement checks fire on every state change without debounce. CalendarView rebuilds data every render. Unnecessary object creation in SessionCard.

**Solution:**
- **Debounce achievement checks:** The `earnedAchievements` useMemo (App.tsx ~line 173) stays synchronous. The downstream `useEffect` (~line 186) that processes the earned list into the celebration queue gets a 300ms debounce via `setTimeout` + cleanup return. This ensures rapid state changes (e.g., toggle complete + save pace) coalesce into a single achievement check.
- **Memoize `sessionsByDate`** in CalendarView with `useMemo` keyed on sessions reference
- **Guard `makeDraft()`:** Only create new interval arrays when count differs
- **Memoize ProgressGrid cells:** Currently cells are rendered inline via `.map()`. Extract a `WeekCell` component, then wrap with `React.memo` so only selected/deselected cells re-render.

---

## 7. Accessibility Gaps

**Problem:** Good foundation but missing ARIA states for dynamic content.

**Fixes:**

| Gap | Fix |
|-----|-----|
| Toast doesn't announce | `aria-live="polite"` + `role="status"` on SaveToast |
| Card expand no state | `aria-expanded` on card header tap target |
| Inputs no descriptions | `aria-describedby` linking to hint text |
| Celebrations not keyboard-dismissible | Focus trap + Enter/Escape dismiss |

Note: Optional sessions toggle and Milestones toggle already have `aria-expanded` — verified in codebase. No changes needed there.

**Not in scope:** Full WCAG AA audit, color contrast overhaul.

---

## Files Affected (Estimated)

**Modify (~20-25 files):**
- `src/App.tsx` — achievement debounce, celebration timing normalization, tab switch timing (line 69 imperative JS)
- `src/App.css` — timing tokens, reduced motion, skeleton styles, expand animation
- `src/components/SessionCard.tsx` — expand animation, auto-focus, aria-expanded, spacing, makeDraft guard
- `src/components/WeekView.tsx` — optional sessions aria-expanded
- `src/components/BottomNav.tsx` — touch targets
- `src/components/Header.tsx` — Manage Plans button touch target increase to 44px
- `src/components/StreakDisplay.tsx` — rest-day button touch targets from 32px to 44px
- `src/components/PaceInput.tsx` — focus ring increase, aria-describedby
- `src/components/StrokeRateInput.tsx` — focus ring increase, aria-describedby
- `src/components/SaveToast.tsx` — aria-live, role
- `src/components/PBCelebration.tsx` — timing, focus trap, keyboard dismiss
- `src/components/WeekCelebration.tsx` — timing, focus trap, keyboard dismiss
- `src/components/AchievementCelebration.tsx` — timing, focus trap, keyboard dismiss
- `src/components/PhotoScanButton.tsx` — success timing to 2500ms
- `src/components/ConfirmDialog.tsx` — backdrop timing sync
- `src/components/CheckCircle.tsx` — touch target verification
- `src/components/ProgressGrid.tsx` — React.memo on cells
- `src/components/views/CalendarView.tsx` — useMemo for sessionsByDate
- `src/components/views/ChartsView.tsx` — (spacing normalization)
- `src/components/views/PersonalBestsView.tsx` — (spacing normalization)
- `src/components/views/ComparisonView.tsx` — (spacing normalization)
- `src/components/planEditor/PlanEditorModal.tsx` — dark mode normalization
- `src/components/planEditor/PlanManagerModal.tsx` — dark mode normalization
- `src/components/ApiKeySettings.tsx` — dark mode normalization
- `src/components/AchievementBadges.tsx` — spacing normalization (aria-expanded already present)

**Create (~4-5 files):**
- `src/components/skeletons/ChartsSkeleton.tsx`
- `src/components/skeletons/PBsSkeleton.tsx`
- `src/components/skeletons/CalendarSkeleton.tsx`
- `src/components/skeletons/CompareSkeleton.tsx`

---

## Verification

1. `npx tsc --noEmit` — clean TypeScript
2. `npx vitest run` — all existing tests pass
3. `npx vite build` — clean production build
4. Preview: expand/collapse session card — smooth 250ms/200ms animation
5. Preview: arrow rotates smoothly on expand/collapse
6. Preview: pace input auto-focused on card expand
7. Preview: all header buttons have 44px+ touch area
8. Preview: dark mode backgrounds follow 3-tier hierarchy consistently
9. Preview: tab switch feels smooth at 200ms
10. Preview: first visit to Charts/PBs/Calendar/Compare shows skeleton, not spinner
11. Preview: complete a session — celebration shows for 2500ms consistently
12. Preview: enable reduced-motion in OS — animations use opacity only
13. Preview: screen reader announces toast on save
14. Preview: keyboard can dismiss celebration overlays with Escape
