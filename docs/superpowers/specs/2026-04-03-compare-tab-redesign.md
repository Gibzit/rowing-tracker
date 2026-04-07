# Compare Tab Redesign: Training Volume + Session Comparator

## Overview

Replace the current Compare tab's label-matching comparison (which rarely finds matches in a progressive 24-week plan) with two useful features:

1. **Training Volume** — weekly meters and time charts showing training load over time
2. **Session Comparator** — pin any two completed sessions from the Session tab to see them side by side

Both live in the Compare tab. Volume charts are always visible. The session comparison appears below when two sessions are pinned.

## 1. Training Volume

### Layout

Two horizontal bar charts stacked vertically in the top portion of the Compare tab.

**Summary line** above the charts showing current week totals:
```
12,400m this week · 42 min
```

If no sessions are completed, show empty state: "Complete sessions to see training volume."

### Weekly Meters Chart

- Horizontal bar chart, one bar per week (W1, W2, ... up to the latest week with data)
- Week labels on the left vertical axis
- Bar length = total meters rowed that week (sum of all completed sessions' distances)
- Color: teal/cyan gradient (consistent with app accent)
- Current week's bar highlighted (brighter or outlined)
- Future weeks are not rendered (no empty/grayed bars)

### Weekly Time Chart

- Same horizontal bar layout as meters
- Bar length = total minutes rowed that week (sum of `totalTime` across completed sessions)
- Color: amber/gold to distinguish from the meters chart
- Same current-week highlight treatment

### Distance Derivation

Reuse the existing `parseDistance(label)` from `pacePredictor.ts`:
- `"5000m"` → 5000
- `"6 x 500m / 2min rest"` → 3000

For time-based sessions (e.g., `"20min"`) where `parseDistance` returns null:
- Derive distance from `totalTime / paceSeconds * 500` (same fallback used in `computePredictions`)
- If neither distance nor pace is available, that session contributes 0 meters but still contributes its `totalTime` to the time chart

### Time Derivation

Parse `totalTime` (format `"mm:ss"` or `"m:ss"`) into minutes. Use the same `parseTime` regex from `pacePredictor.ts` (now accepting 1-3 digit minutes). Sessions without `totalTime` contribute 0 to the time chart.

## 2. Pin-to-Compare Interaction

### Pin Icon on Session Cards

Each **completed** collapsed `SessionCard` in the Session tab displays a small compare icon in the top-right area, near the existing expand chevron. The icon is two overlapping squares (or similar "compare" glyph).

- **Unpinned state:** Icon is subtle/muted (gray), same visual weight as the chevron
- **Pinned state:** Icon fills with teal/cyan accent, indicating selection
- Only completed sessions show the pin icon (incomplete sessions have nothing to pin)

### Pin State Machine

| Pins | Behavior |
|------|----------|
| 0 | Normal state. No indicators. |
| 1 | Pinned card's icon highlighted. Floating indicator near bottom nav: **"1 selected — tap another to compare"**. Indicator is small, non-blocking, dismissible by tapping its X. |
| 2 | Auto-navigate to Compare tab. Side-by-side comparison renders below volume charts. Floating indicator disappears. |

Additional rules:
- Tapping a pinned card's icon again unpins it (deselects)
- If two are already pinned and user taps a third, it replaces the oldest pin (slot 0)
- The "Clear" button on the comparison view unpins both

### State Management

State lives in `App.tsx` as ephemeral React state (not persisted to localStorage):

```typescript
const [compareSlots, setCompareSlots] = useState<[string | null, string | null]>([null, null]);
```

Values are session keys (e.g., `"3-1"` for week 3, day 1). Navigating between tabs preserves the pin state. Only clearing or unmounting the app resets it.

### Floating Indicator

When exactly one session is pinned, a small bar appears above the bottom navigation:

```
[1 selected — tap another to compare          ✕]
```

- Positioned similarly to the existing `SaveToast` / default power level prompt pattern
- Dismissing via ✕ unpins the session (resets to 0 pins)
- Uses `role="status"` and `aria-live="polite"` for accessibility

## 3. Side-by-Side Comparison

### Placement

Renders below the volume charts in the Compare tab, only when both `compareSlots` are non-null and reference valid completed sessions.

### Header

Two session identifiers side by side with a clear button:

```
W3 D1 · 5000m          W8 D2 · 6 x 500m          ✕ Clear
```

### Metric Rows

Stacked vertically. Each row shows the left session's value, the metric label centered, and the right session's value:

| Left | Metric | Right |
|------|--------|-------|
| 2:05.0 | **Pace /500m** | 1:58.3 |
| 20:50 | **Total Time** | 23:12 |
| 5,000m | **Distance** | 3,000m |
| 24 spm | **Stroke Rate** | 26 spm |
| 7 | **Power Level** | 7 |
| — | **RPE** | 6 |

### Highlighting

The "better" value in performance rows gets a subtle teal text accent:
- **Pace:** Lower is better
- **Total Time:** No highlight (context-dependent — longer isn't necessarily worse)
- **Distance:** Higher is more volume (teal highlight)
- **Stroke Rate:** No highlight (context-dependent)
- **Power Level:** No highlight (context, not performance)
- **RPE:** No highlight (context, not performance)

### Missing Data

If a session lacks a field (e.g., no stroke rate, no RPE), display "—" for that side. If both sides lack a field, the row still renders with "—" on both sides (keeps the layout consistent).

### Distance in Comparison

Same derivation as the volume charts: `parseDistance(label)` with pace×time fallback. Displayed with comma formatting (e.g., `5,000m`).

## 4. File Structure and Cleanup

### New Files

| File | Purpose |
|------|---------|
| `src/components/comparison/VolumeChart.tsx` | Reusable horizontal bar chart component. Props: `data` (week number + value pairs), `color` (teal or amber), `currentWeek`, `unit` (m or min). Used twice — once for meters, once for time. |
| `src/components/comparison/SessionComparison.tsx` | Side-by-side metric rows. Props: `leftSession`, `rightSession`, `leftDescriptor`, `rightDescriptor`, `onClear`. |

### Rewritten Files

| File | Change |
|------|--------|
| `src/components/views/ComparisonView.tsx` | Complete rewrite. Renders volume summary line, two `VolumeChart` instances, and `SessionComparison` when pins are active. Props: `sessions`, `plan`, `compareSlots`, `onClearCompare`. |
| `src/components/SessionCard.tsx` | Add pin icon to completed collapsed cards. New props: `isPinned?: boolean`, `onTogglePin?: () => void`. |
| `src/App.tsx` | Add `compareSlots` state, `handleTogglePin(sessionKey)` callback, auto-navigate to Compare on second pin, pass `compareSlots`/`onClearCompare` to ComparisonView, pass `isPinned`/`onTogglePin` through to SessionCard. |
| `src/components/WeekView.tsx` | Pass `isPinned` and `onTogglePin` through to SessionCard instances. |

### Deleted Files

| File | Reason |
|------|--------|
| `src/utils/workoutGrouping.ts` | Label-matching grouping logic no longer needed |
| `src/components/comparison/ComparisonSparkline.tsx` | Old sparkline chart no longer needed |
| `src/components/comparison/ComparisonTable.tsx` | Old comparison table no longer needed |

### Preserved

- The `CompareSkeleton` in `App.tsx` (lazy loading fallback) stays as-is
- The Compare tab's position in the bottom nav and its icon stay unchanged
- `React.lazy` import pattern stays

## 5. Props Flow

```
App.tsx
  compareSlots state: [string | null, string | null]
  handleTogglePin(key: string): void
  handleClearCompare(): void
  │
  ├── WeekView
  │     └── SessionCard
  │           isPinned: boolean
  │           onTogglePin: () => void
  │
  └── ComparisonView (lazy)
        sessions: Record<string, SessionRecord>
        plan: SessionDescriptor[]
        compareSlots: [string | null, string | null]
        onClearCompare: () => void
        │
        ├── VolumeChart (meters)
        ├── VolumeChart (time)
        └── SessionComparison (conditional)
```

## 6. Volume Calculation Utility

Create `src/utils/volumeCalc.ts`:

```typescript
interface WeekVolume {
  weekNumber: number;
  totalMeters: number;
  totalMinutes: number;
}

function computeWeeklyVolume(
  sessions: Record<string, SessionRecord>,
  plan: SessionDescriptor[]
): WeekVolume[]
```

This function:
1. Groups plan sessions by `weekNumber`
2. For each completed session, derives distance via `parseDistance` (imported from pacePredictor.ts) with pace×time fallback
3. Parses `totalTime` into minutes
4. Aggregates per week
5. Returns only weeks that have at least one completed session
6. Sorts by week number ascending

## 7. Design Tokens

Consistent with existing app conventions:

- **Meters bar color:** `bg-teal-500 dark:bg-[#00d2ff]` (matches app accent)
- **Time bar color:** `bg-amber-500 dark:bg-amber-400` (matches RPE mid-range accent)
- **Better-value highlight:** `text-teal-600 dark:text-[#00d2ff]` (same as pace display in RacePredictions)
- **Pin icon active:** `text-teal-500 dark:text-[#00d2ff]`
- **Pin icon inactive:** `text-gray-400 dark:text-[#5a6580]`
- **Floating indicator:** Same styling as default power level prompt toast (white/dark surface, rounded-2xl, shadow-lg)
- **Card surfaces:** `bg-white dark:bg-[#0f1b33]` with `border-gray-100 dark:border-white/[0.06]`
- **Touch targets:** All interactive elements minimum 44px
