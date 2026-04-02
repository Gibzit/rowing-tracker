# Full Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Holistic UX polish of the Rowing Training Tracker — smooth card animations, consistent dark mode, harmonized timings, better touch targets, skeleton loaders, performance fixes, and accessibility improvements.

**Architecture:** Pure CSS/React changes across ~25 existing files + 4 new skeleton components. No new dependencies, no structural refactors. Each task is independently verifiable.

**Tech Stack:** React 19, TypeScript strict, Tailwind CSS v4, Vite, Vitest

**Spec:** `docs/superpowers/specs/2026-04-02-polish-pass-design.md`

---

## Task 1: Card Expand/Collapse Animation

**Files:**
- Modify: `src/components/SessionCard.tsx:148-237`
- Modify: `src/App.css` (add new CSS classes)

- [ ] **Step 1: Add CSS classes for grid expand/collapse to App.css**

At the end of `src/App.css`, add:

```css
/* Card expand/collapse animation */
.card-expandable {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms ease-in;
}
.card-expandable.card-expanded {
  grid-template-rows: 1fr;
  transition: grid-template-rows 250ms ease-out;
}
.card-expandable-inner {
  overflow: hidden;
  min-height: 0;
}
.card-expandable-content {
  opacity: 0;
  transition: opacity 200ms ease-out 50ms;
}
.card-expanded .card-expandable-content {
  opacity: 1;
}
.card-expandable:not(.card-expanded) .card-expandable-content {
  visibility: hidden;
  transition: opacity 150ms ease-in, visibility 0s 200ms;
}

/* Chevron rotation */
.chevron-icon {
  transition: transform 250ms ease-out;
}
.chevron-icon.chevron-rotated {
  transform: rotate(180deg);
}
```

- [ ] **Step 2: Replace conditional rendering with grid animation in SessionCard.tsx**

In `src/components/SessionCard.tsx`, replace the expand arrow span (lines 226-228):

```tsx
// OLD:
<span className="text-gray-400 dark:text-[#5a6580] text-sm">
  {expanded ? '\u25B2' : '\u25BC'}
</span>

// NEW:
<svg
  className={`w-4 h-4 text-gray-400 dark:text-[#5a6580] chevron-icon${expanded ? ' chevron-rotated' : ''}`}
  viewBox="0 0 20 20"
  fill="currentColor"
>
  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
</svg>
```

Replace the conditional block (lines 232-onward):

```tsx
// OLD:
{expanded && (
  <div
    ref={contentRef}
    className="mt-5 space-y-4 border-t border-gray-100 dark:border-white/[0.04] pt-5"
    style={{ animation: 'slideDown 0.2s ease-out' }}
  >
    ...content...
  </div>
)}

// NEW:
<div className={`card-expandable${expanded ? ' card-expanded' : ''}`}>
  <div className="card-expandable-inner">
    <div
      ref={contentRef}
      className="card-expandable-content mt-5 space-y-4 border-t border-gray-100 dark:border-white/[0.06] pt-5"
    >
      ...content (unchanged)...
    </div>
  </div>
</div>
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Run tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Verify in preview**

Start dev server, expand/collapse a session card. Confirm:
- Smooth height animation (~250ms)
- Chevron rotates smoothly
- Content fades in with slight delay
- Collapsed content is not tab-focusable

- [ ] **Step 6: Commit**

```bash
git add src/components/SessionCard.tsx src/App.css
git commit -m "feat: smooth card expand/collapse animation with grid technique"
```

---

## Task 2: Auto-Focus Pace Input on Expand

**Files:**
- Modify: `src/components/PaceInput.tsx` (add forwardRef)
- Modify: `src/components/SessionCard.tsx` (add focus logic)

- [ ] **Step 1: Add forwardRef to PaceInput**

In `src/components/PaceInput.tsx`, change the component to use `forwardRef`:

```tsx
import { useState, forwardRef } from 'react';
import { validatePace } from '../utils/paceValidation';

interface PaceInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const PaceInput = forwardRef<HTMLInputElement, PaceInputProps>(function PaceInput({ label, value, onChange }, ref) {
  // ... existing body unchanged ...
  // Add ref to the <input> element:
  <input
    ref={ref}
    type="text"
    // ... rest unchanged
  />
});

export default PaceInput;
```

- [ ] **Step 2: Add deferred focus to SessionCard**

In `src/components/SessionCard.tsx`, add a ref and focus logic triggered after expand animation:

```tsx
const paceInputRef = useRef<HTMLInputElement>(null);
const focusTimerRef = useRef<ReturnType<typeof setTimeout>>();

// When expanded changes, schedule focus after animation:
useEffect(() => {
  if (expanded) {
    focusTimerRef.current = setTimeout(() => paceInputRef.current?.focus(), 300);
  }
  return () => { if (focusTimerRef.current) clearTimeout(focusTimerRef.current); };
}, [expanded]);

// On the card-expandable div (no onTransitionEnd needed — setTimeout is more reliable for grid-template-rows):
<div className={`card-expandable${expanded ? ' card-expanded' : ''}`}>

// On PaceInput:
<PaceInput
  ref={paceInputRef}
  label="Average Pace (per 500m)"
  value={draft.pace}
  onChange={(v) => setDraft((prev) => ({ ...prev, pace: v }))}
/>
```

- [ ] **Step 3: Run TypeScript check and tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: Clean

- [ ] **Step 4: Verify in preview**

Expand a session card. After animation completes, pace input should be focused.

- [ ] **Step 5: Commit**

```bash
git add src/components/PaceInput.tsx src/components/SessionCard.tsx
git commit -m "feat: auto-focus pace input after card expand animation"
```

---

## Task 3: Touch Targets — All Sub-44px Buttons

**Files:**
- Modify: `src/components/Header.tsx:45`
- Modify: `src/components/StreakDisplay.tsx:93,100`
- Modify: `src/components/planEditor/PlanEditorModal.tsx` (3 occurrences of `min-h-[36px]`)
- Modify: `src/components/planEditor/PlanManagerModal.tsx` (5 occurrences of `min-h-[36px]`)
- Modify: `src/components/planEditor/PlanSessionRow.tsx` (2 occurrences of `min-h-[36px]`)

Note: `BottomNav.tsx` was audited — already uses `min-h-[56px]`, no changes needed.

- [ ] **Step 1: Fix Header manage-plans button**

In `src/components/Header.tsx`, change the manage-plans button from `min-w-[36px] min-h-[36px]` to `min-w-[44px] min-h-[44px]`.

- [ ] **Step 2: Fix StreakDisplay rest-day buttons**

In `src/components/StreakDisplay.tsx`, change both rest-day buttons from `min-h-[32px]` to `min-h-[44px]`.

- [ ] **Step 3: Fix plan editor modal buttons**

In `src/components/planEditor/PlanEditorModal.tsx`, `PlanManagerModal.tsx`, and `PlanSessionRow.tsx`, change all `min-h-[36px]` to `min-h-[44px]` (10 occurrences total across the 3 files).

- [ ] **Step 4: Verify in preview**

Inspect buttons — all should be >= 44px touch target. Check header, streak rest-day buttons, and plan editor modals.

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx src/components/StreakDisplay.tsx src/components/planEditor/PlanEditorModal.tsx src/components/planEditor/PlanManagerModal.tsx src/components/planEditor/PlanSessionRow.tsx
git commit -m "fix: increase all sub-44px buttons to meet WCAG touch target minimum"
```

---

## Task 4: Strengthen Focus Ring on Inputs

**Files:**
- Modify: `src/components/PaceInput.tsx:47`
- Modify: `src/components/StrokeRateInput.tsx:41`
- Modify: `src/components/SessionCard.tsx:273` (total time input)
- Modify: `src/components/AddWorkoutForm.tsx` (2 occurrences)
- Modify: `src/components/NotesInput.tsx` (1 occurrence)
- Modify: `src/components/planEditor/PlanEditorModal.tsx` (2 occurrences)
- Modify: `src/components/planEditor/PlanSessionRow.tsx` (2 occurrences)
- Modify: `src/components/planEditor/PlanManagerModal.tsx` (2 occurrences)

- [ ] **Step 1: Update focus ring classes**

In **all listed files**, change `focus:ring-[#00d2ff]/20` to `focus:ring-[#00d2ff]/40` (the border class `focus:border-[#00d2ff]/40` is already correct). Use find-and-replace across all files — 12 total occurrences.

- [ ] **Step 2: Add aria-describedby to inputs**

In `src/components/PaceInput.tsx`, add an `id` to the hint paragraph and `aria-describedby` to the input:

```tsx
<input
  aria-describedby={!error && !value ? 'pace-hint' : undefined}
  // ... rest
/>
// On the hint:
<p id="pace-hint" className="...">minutes:seconds per 500m</p>
```

In `src/components/StrokeRateInput.tsx`, same pattern with `id="spm-hint"`.

In `src/components/SessionCard.tsx` total time input, add `aria-describedby` linking to a hint or just the label.

- [ ] **Step 3: Run TypeScript check and tests**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 4: Commit**

```bash
git add src/components/PaceInput.tsx src/components/StrokeRateInput.tsx src/components/SessionCard.tsx
git commit -m "fix: stronger focus rings and aria-describedby on form inputs"
```

---

## Task 5: Field Spacing in Expanded Cards

**Files:**
- Modify: `src/components/SessionCard.tsx`

- [ ] **Step 1: Increase spacing**

In `SessionCard.tsx`, the expanded content div currently has `space-y-4` (16px). Verify this is correct per spec. If any inner groups are tighter, bump them to `space-y-4`.

Note: The expanded content border (`dark:border-white/[0.04]` to `dark:border-white/[0.06]`) was already updated in Task 1's code sample. Verify it's correct; if Task 1 didn't run yet, change it here.

- [ ] **Step 2: Verify in preview**

Expand card — fields should have comfortable 16px vertical gaps.

- [ ] **Step 3: Commit**

```bash
git add src/components/SessionCard.tsx
git commit -m "fix: normalize field spacing and border colors in session cards"
```

---

## Task 6: Dark Mode Color Normalization

**Files:**
- Modify: ~15 component files (all `dark:bg-*` and `dark:border-*` classes)

The 4-tier system:
- Base: `#0b1326` — page bg, app shell
- Surface: `#0f1b33` — cards, inputs
- Elevated: `#1a2640` — modals, dropdowns, active
- Hover: `#222a3d` — hover/pressed only

Border standard: `dark:border-white/[0.06]`

- [ ] **Step 1: Audit and fix Session-tab components**

Files: `SessionCard.tsx`, `CheckCircle.tsx`, `PaceInput.tsx`, `StrokeRateInput.tsx`, `WeekView.tsx`, `ProgressGrid.tsx`, `AchievementBadges.tsx`

For each file:
- Replace any `dark:border-white/[0.04]` or `dark:border-white/[0.08]` with `dark:border-white/[0.06]`
- Verify `dark:bg-*` values match the 4-tier hierarchy
- `#222a3d` only on `hover:` or `active:` states

- [ ] **Step 2: Audit and fix modal/dialog components**

Files: `ConfirmDialog.tsx`, `ApiKeySettings.tsx`, `PlanEditorModal.tsx`, `PlanManagerModal.tsx`

- Modal backgrounds should use Elevated (`#1a2640`)
- Inner inputs use Surface (`#0f1b33`)
- Borders: `dark:border-white/[0.06]`

- [ ] **Step 3: Audit and fix views**

Files: `ChartsView.tsx`, `PersonalBestsView.tsx`, `CalendarView.tsx`, `ComparisonView.tsx`

Same normalization rules. Specifically:
- Change any `dark:border-white/[0.04]` or `dark:border-white/[0.08]` to `dark:border-white/[0.06]`
- Verify all `dark:bg-*` values match the 4-tier hierarchy
- Also audit `AddWorkoutForm.tsx` and `NotesInput.tsx` for border consistency

- [ ] **Step 4: Audit celebrations and toasts**

Files: `PBCelebration.tsx`, `WeekCelebration.tsx`, `AchievementCelebration.tsx`, `SaveToast.tsx`

Celebration card backgrounds: Surface (`#0f1b33`)

- [ ] **Step 5: Light mode normalization**

Audit light mode `bg-*` classes against: Base `#f8f9fc`, Surface `white`, Elevated `#f0f3f8`, Hover `#e8ecf2`.

- [ ] **Step 6: Run TypeScript check and tests**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 7: Verify in preview**

Toggle dark/light mode. Check backgrounds are consistent across all screens.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "fix: normalize dark mode colors to 4-tier hierarchy and standardize borders"
```

---

## Task 7: Animation Timing Harmonization

**Files:**
- Modify: `src/App.css` (keyframe durations)
- Modify: `src/App.tsx:68` (tab switch timing)
- Modify: `src/components/SaveToast.tsx:12-13,25` (toast timing)
- Modify: `src/components/ConfirmDialog.tsx:53` (backdrop timing)
- Modify: `src/components/PhotoScanButton.tsx:76` (success timing)

- [ ] **Step 1: Update App.css animation durations**

```css
/* backdropFadeIn: 0.2s -> 0.25s */
@keyframes backdropFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* No keyframe change needed — duration is set inline */

/* toastSlideIn/Out: 0.3s -> 0.25s — set inline, no CSS change needed */
```

- [ ] **Step 2: Update App.tsx tab switch timing**

Line 68: Change `'viewFadeIn 0.15s ease-out'` to `'viewFadeIn 0.2s ease-out'`

- [ ] **Step 3: Update SaveToast timing**

In `src/components/SaveToast.tsx`:
- Line 12: Change exit timer from `1500` to `1500` (keep — this is show duration, not animation)
- Line 13: Change remove timer from `1900` to `1750` (1500 + 250ms animation instead of 1500 + 400ms)
- Line 25: Change `'toastSlideOut 0.3s ease-in forwards'` to `'toastSlideOut 0.25s ease-in forwards'`
- Change `'toastSlideIn 0.3s ease-out'` to `'toastSlideIn 0.25s ease-out'`

- [ ] **Step 4: Update ConfirmDialog backdrop timing**

Line 53: Change `'backdropFadeIn 0.2s ease-out'` to `'backdropFadeIn 0.25s ease-out'`

- [ ] **Step 5: Update PhotoScanButton success timing**

Line 76: Change `setTimeout(() => setStatus('idle'), 1500)` to `setTimeout(() => setStatus('idle'), 2500)`

- [ ] **Step 6: Add prefers-reduced-motion to App.css**

Add at end of `src/App.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .card-expandable, .chevron-icon {
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run`

- [ ] **Step 8: Verify in preview**

- Switch tabs — slightly smoother fade
- Open a dialog — backdrop and dialog feel synchronized
- Save a session — toast timing feels snappier
- Photo scan success — shows for 2.5s instead of 1.5s

- [ ] **Step 9: Commit**

```bash
git add src/App.css src/App.tsx src/components/SaveToast.tsx src/components/ConfirmDialog.tsx src/components/PhotoScanButton.tsx
git commit -m "fix: harmonize animation timings and add prefers-reduced-motion"
```

---

## Task 8: Skeleton Loaders for Lazy Tabs

**Files:**
- Create: `src/components/skeletons/ChartsSkeleton.tsx`
- Create: `src/components/skeletons/PBsSkeleton.tsx`
- Create: `src/components/skeletons/CalendarSkeleton.tsx`
- Create: `src/components/skeletons/CompareSkeleton.tsx`
- Modify: `src/App.tsx:51-57` (replace ViewLoader)

- [ ] **Step 1: Create ChartsSkeleton**

```tsx
export default function ChartsSkeleton() {
  return (
    <div className="space-y-4 p-5">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl bg-white dark:bg-[#0f1b33] p-4">
          <div className="h-3 w-24 rounded bg-gray-200 dark:bg-[#1a2640] mb-4" />
          <div
            className="h-48 rounded-lg bg-gray-100 dark:bg-[#1a2640]"
            style={{
              backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create PBsSkeleton**

```tsx
export default function PBsSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {[100, 80, 90, 70, 60].map((w, i) => (
        <div key={i} className="rounded-2xl bg-white dark:bg-[#0f1b33] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#1a2640]" />
          <div className="flex-1">
            <div
              className="h-3 rounded bg-gray-200 dark:bg-[#1a2640] mb-2"
              style={{
                width: `${w}%`,
                backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
            <div className="h-2 w-16 rounded bg-gray-100 dark:bg-[#1a2640]" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create CalendarSkeleton**

```tsx
export default function CalendarSkeleton() {
  return (
    <div className="p-5">
      <div className="rounded-2xl bg-white dark:bg-[#0f1b33] p-4">
        <div className="h-3 w-32 rounded bg-gray-200 dark:bg-[#1a2640] mb-4" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }, (_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-gray-100 dark:bg-[#1a2640]"
              style={{
                backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: `shimmer 1.5s infinite ${i * 30}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create CompareSkeleton**

```tsx
export default function CompareSkeleton() {
  return (
    <div className="p-5">
      <div className="rounded-2xl bg-white dark:bg-[#0f1b33] p-4">
        <div className="h-3 w-28 rounded bg-gray-200 dark:bg-[#1a2640] mb-4" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-white/[0.06] last:border-0">
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-[#1a2640]" />
            <div
              className="flex-1 h-3 rounded bg-gray-100 dark:bg-[#1a2640]"
              style={{
                backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Wire skeletons into App.tsx**

Note: The `shimmer` keyframe already exists in `App.css` (line ~177) — no new keyframe needed.

Replace the single `ViewLoader` with specific skeleton fallbacks. Import the skeletons (not lazy — they must be bundled in main chunk):

```tsx
import ChartsSkeleton from './components/skeletons/ChartsSkeleton';
import PBsSkeleton from './components/skeletons/PBsSkeleton';
import CalendarSkeleton from './components/skeletons/CalendarSkeleton';
import CompareSkeleton from './components/skeletons/CompareSkeleton';
```

Then for each lazy tab's `<Suspense>`, use the matching skeleton as fallback instead of `<ViewLoader />`.

- [ ] **Step 6: Run TypeScript check and tests**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 7: Commit**

```bash
git add src/components/skeletons/ src/App.tsx
git commit -m "feat: add content-shaped skeleton loaders for lazy tabs"
```

---

## Task 9: Performance — Debounce Achievement Checks

**Files:**
- Modify: `src/App.tsx:186-206`

- [ ] **Step 1: Add debounce to achievement useEffect**

Replace the achievement `useEffect` (lines 186-206) with a debounced version:

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    const alreadyUnlocked = new Set((data.achievements || []).map((a) => a.id));
    const newlyEarned = earnedAchievements.filter(
      (id) => !alreadyUnlocked.has(id) && !achievementReportedRef.current.has(id)
    );

    if (newlyEarned.length > 0) {
      newlyEarned.forEach((id) => achievementReportedRef.current.add(id));
      const newUnlocks: UnlockedAchievement[] = newlyEarned.map((id) => ({
        id,
        unlockedDate: new Date().toISOString().split('T')[0],
      }));
      unlockAchievements(newUnlocks);
      const defs = newlyEarned.map((id) => getAchievementDef(id));
      setAchievementQueue((prev) => [...prev, ...defs]);
    }
  }, 300);
  return () => clearTimeout(timer);
}, [earnedAchievements, data.achievements, unlockAchievements]);
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run`

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "perf: debounce achievement checks by 300ms"
```

---

## Task 10: Performance — Memoize CalendarView & Guard makeDraft

**Files:**
- Modify: `src/components/views/CalendarView.tsx:71`
- Modify: `src/components/SessionCard.tsx:25-33`

- [ ] **Step 1: Verify CalendarView memoization**

Check `CalendarView.tsx` line 71 — it already has `useMemo`. Verify the dependency array is `[sessions, plan]` (correct). If already memoized, no change needed.

- [ ] **Step 2: Guard makeDraft in SessionCard**

In `src/components/SessionCard.tsx`, update `makeDraft` to avoid unnecessary array copies:

```tsx
function makeDraft(record: SessionRecord, intervalCount: number): DraftState {
  return {
    pace: record.pace,
    totalTime: record.totalTime,
    intervalTimes: record.intervalTimes.length === intervalCount
      ? record.intervalTimes
      : Array.from({ length: intervalCount }, (_, i) => record.intervalTimes[i] || ''),
    strokeRate: record.strokeRate,
    notes: record.notes,
  };
}
```

Update the call site to pass `intervalCount`.

- [ ] **Step 3: Run tests**

Run: `npx vitest run`

- [ ] **Step 4: Commit**

```bash
git add src/components/SessionCard.tsx src/components/views/CalendarView.tsx
git commit -m "perf: guard makeDraft array allocation, verify calendar memoization"
```

---

## Task 11: Performance — Extract WeekCell with React.memo

**Files:**
- Modify: `src/components/ProgressGrid.tsx`

- [ ] **Step 1: Extract WeekCell component**

At the top of `src/components/ProgressGrid.tsx` (above the main component), add:

```tsx
import { memo } from 'react';

interface WeekCellProps {
  week: number;
  isComplete: boolean;
  isCurrent: boolean;
  isSelected: boolean;
  onSelect: (week: number) => void;
}

const WeekCell = memo(function WeekCell({ week, isComplete, isCurrent, isSelected, onSelect }: WeekCellProps) {
  let cellClasses = 'aspect-square rounded-lg transition-all duration-200 cursor-pointer relative flex items-center justify-center text-[9px] font-mono font-bold';

  if (isSelected) {
    cellClasses += ' text-[#060e20] ring-2 ring-[#00d2ff]/40';
  } else if (isComplete) {
    cellClasses += ' bg-green-500/90 dark:bg-green-500/80 text-white';
  } else if (isCurrent) {
    cellClasses += ' bg-teal-100 dark:bg-[#00d2ff]/10 text-teal-700 dark:text-[#00d2ff] ring-1 ring-[#00d2ff]/40';
  } else {
    cellClasses += ' bg-gray-100 dark:bg-[#1a2640] text-gray-400 dark:text-[#5a6580] hover:bg-gray-200 dark:hover:bg-[#222a3d]';
  }

  return (
    <button
      onClick={() => onSelect(week)}
      className={cellClasses}
      style={isSelected ? { background: 'linear-gradient(135deg, #a5e7ff, #00d2ff)' } : undefined}
      aria-label={`Week ${week}${isComplete ? ', completed' : ''}${isCurrent ? ', current' : ''}${isSelected ? ', selected' : ''}`}
    >
      {week}
    </button>
  );
});
```

- [ ] **Step 2: Use WeekCell in the grid map**

Replace the inline map body in `ProgressGrid` with:

```tsx
<WeekCell
  key={week}
  week={week}
  isComplete={isWeekComplete(week)}
  isCurrent={week === currentWeek}
  isSelected={week === selectedWeek}
  onSelect={onSelectWeek}
/>
```

- [ ] **Step 3: Run TypeScript check and tests**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 4: Commit**

```bash
git add src/components/ProgressGrid.tsx
git commit -m "perf: extract WeekCell with React.memo to reduce re-renders"
```

---

## Task 12: Accessibility — SaveToast, Card Expand, Celebrations

**Files:**
- Modify: `src/components/SaveToast.tsx`
- Modify: `src/components/SessionCard.tsx`
- Modify: `src/components/PBCelebration.tsx`
- Modify: `src/components/WeekCelebration.tsx`
- Modify: `src/components/AchievementCelebration.tsx`

- [ ] **Step 1: Add aria-live to SaveToast**

In `src/components/SaveToast.tsx`, add to the outer `div`:

```tsx
<div
  role="status"
  aria-live="polite"
  className="fixed left-1/2 ..."
>
```

- [ ] **Step 2: Add aria-expanded to SessionCard header**

In `src/components/SessionCard.tsx`, on the clickable header div (line 154-156):

```tsx
<div
  className="flex items-start gap-3 cursor-pointer touch-manipulation"
  onClick={() => setExpanded(!expanded)}
  role="button"
  aria-expanded={expanded}
>
```

- [ ] **Step 3: Add keyboard dismiss to celebrations**

In `PBCelebration.tsx`, `WeekCelebration.tsx`, and `AchievementCelebration.tsx`, add an `onKeyDown` handler and `tabIndex`:

```tsx
<div
  className="fixed inset-0 z-[60] ..."
  onClick={onDone}
  onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') onDone(); }}
  tabIndex={0}
  role="alertdialog"
  aria-label="Celebration"
>
```

Also add a `useEffect` to auto-focus the overlay on mount:

```tsx
const overlayRef = useRef<HTMLDivElement>(null);
useEffect(() => { overlayRef.current?.focus(); }, []);
// Add ref={overlayRef} to the outer div
```

Note: `WeekView.tsx` optional sessions toggle and `AchievementBadges.tsx` milestones toggle already have `aria-expanded` — verified in codebase, no changes needed.

- [ ] **Step 4: Run TypeScript check and tests**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 5: Commit**

```bash
git add src/components/SaveToast.tsx src/components/SessionCard.tsx src/components/PBCelebration.tsx src/components/WeekCelebration.tsx src/components/AchievementCelebration.tsx
git commit -m "a11y: aria-live on toast, aria-expanded on cards, keyboard-dismiss celebrations"
```

---

## Task 13: Final Verification

- [ ] **Step 1: Full TypeScript check**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 2: Full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Production build**

Run: `npx vite build`
Expected: Clean build, no warnings

- [ ] **Step 4: Visual verification in preview**

Check all items from spec verification list:
1. Card expand/collapse smooth
2. Chevron rotates
3. Pace input auto-focuses after expand
4. Header buttons 44px+
5. Dark mode backgrounds consistent
6. Tab switch smooth at 200ms
7. Skeleton loaders on first lazy tab visit
8. Celebrations 2500ms
9. Toast snappier at 250ms
10. Escape dismisses celebrations
