# Training Insights — Design Spec

**Date:** 2026-04-02
**Scope:** Three connected features — RPE logging, power level logging, and pace predictions — that give the user richer context around their training data. No new tabs or major UI restructuring.
**Primary user context:** Mobile-first, logging sessions at the gym quickly. Uses a rowing machine with a 1-10 power dial (not a standard Concept2 drag factor display).

---

## 1. Data Model Changes

### SessionRecord — two new optional fields

```typescript
rpe?: number;        // 1-10, integer. Rate of perceived exertion.
dragFactor?: number; // 1-10, integer. Machine power level setting.
```

The field is named `dragFactor` in the data model for semantic clarity in code (it represents the resistance setting), but labeled "Power Level" in the UI to match the user's machine.

### StoredData — one new top-level field

```typescript
defaultDragFactor?: number; // 1-10, integer. User's default power level.
```

Lives in `StoredData` (not a separate localStorage key) so it's included in data export/import backups. No storage version bump needed — new fields are optional and backwards-compatible.

### Hook Changes

Add `setDefaultDragFactor(value: number) => void` to `useTrainingData` that patches `StoredData.defaultDragFactor` and persists. Expose `data.defaultDragFactor` and `setDefaultDragFactor` from the hook. Pass both down through `App -> WeekView -> SessionCard` as new props.

---

## 2. RPE Input — Post-Save Prompt

### Flow

1. User fills in pace/time/etc in an expanded SessionCard, taps **Save**
2. Card collapses and save toast appears (existing behavior)
3. An RPE prompt slides in below the collapsed card: **"How hard was that?"** with a 1-10 scale
4. User taps a number — it saves immediately (single tap, no confirm) and the prompt slides away with a brief fade-out
5. If user ignores it or scrolls away, the prompt auto-dismisses after **8 seconds**
6. If user taps outside the prompt, it dismisses (no RPE saved — it's optional)

### The 1-10 Scale

- Horizontal row of 10 tappable circles. Visible circle diameter ~28-32px, but each has a 44px minimum touch target achieved via padding/negative margins (10 × 32px = 320px fits comfortably on a 375px viewport; the 44px touch areas overlap slightly which is acceptable for adjacent targets)
- Color gradient: **green** (1-3), **amber** (4-6), **red** (7-10)
- End labels only: "Easy" on left, "Max" on right
- Tapping highlights the selected number with a brief scale animation, then the prompt dismisses

### Why circles, not a slider

On mobile, tapping one of 10 discrete targets is faster and less fiddly than dragging a slider handle. The 1-10 integer granularity is all that's needed for RPE.

### Collapsed Card Badge

Once saved, RPE shows as a small badge on the collapsed card alongside existing pace and stroke rate badges:
- Format: `RPE 7`
- Color-coded: green (1-3), amber (4-6), red (7-10)
- Same size and styling as existing badges (`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg`)

### Implementation Notes

- The RPE prompt is a new component rendered by SessionCard, positioned below the card's main `<div>` in the fragment (same level as SaveToast and ConfirmDialog)
- `SessionCard` tracks a `showRpePrompt: boolean` state. `handleSave` sets it to `true` after `setExpanded(false)`. It resets to `false` when the prompt saves, dismisses, or auto-dismisses
- The prompt appears only after a successful save — not on re-renders or when `record.rpe` already exists
- Animation: `animation: slideDown 0.25s ease-out` on mount. On dismiss, apply `animation: slideUp 0.2s ease-in forwards` (the `forwards` keeps it at opacity 0), then remove from DOM after animation ends via `onAnimationEnd`
- The prompt receives the session's week/day key and calls `onUpdate({ rpe: value })` directly
- Auto-dismiss uses a `setTimeout(8000)` with cleanup on unmount

---

## 3. Power Level Input

### Per-Session Field

- New input in the expanded SessionCard, placed **after StrokeRateInput** (both are machine settings)
- Displayed as a horizontal row of 10 tappable circles (same pattern as RPE)
- Label: **"Power Level"**
- Neutral styling: gray/blue tones (not green-to-red — it's a machine setting, not an effort metric)
- Pre-fills with `defaultDragFactor` when expanding a card that has no saved value. The pre-filled value is shown as a default-selected circle with a slightly muted style to distinguish it from a deliberate choice
- User can tap a different number to override, or tap the pre-filled number to confirm it

### Default Setting

- When the user saves a session with a power level for the first time and no `defaultDragFactor` exists, a toast-like prompt appears: **"Use [N] as your default power level?"** with **Yes / No** buttons
- Tapping Yes sets `defaultDragFactor` in StoredData via `setDefaultDragFactor`
- This is a one-time setup flow that happens naturally during use
- First-save prompt only — no subsequent prompts, no long-press, no reset UI. If the user wants a different power level on a session, they override it per session. The pre-fill is a convenience, not a constraint

### Collapsed Card Badge

- Format: `PWR 7`
- Neutral gray styling: `bg-gray-100 dark:bg-[#1a2640] text-gray-600 dark:text-gray-400`
- Same size as other badges

### DraftState Change

Add `dragFactor?: number` to the `DraftState` interface in SessionCard. The `makeDraft` function populates it from `record.dragFactor ?? defaultDragFactor ?? undefined`.

**Important: `isDraftChanged` guard.** The pre-filled default must not trigger "Unsaved changes." Update `isDraftChanged` so that `dragFactor` is only considered changed when `record.dragFactor !== undefined` — i.e., if the record has no saved drag factor, a pre-filled default does not count as a user change. The comparison: `if (record.dragFactor !== undefined && draft.dragFactor !== record.dragFactor) return true;` and `if (record.dragFactor === undefined && draft.dragFactor !== undefined && draft.dragFactor !== defaultDragFactor) return true;`. This ensures that only deliberate user changes (tapping a different circle) trigger the unsaved indicator.

### Default Setting Detection

In `App.tsx`'s `handleUpdateSession`, after calling `updateSession`, check: if `partial.dragFactor !== undefined && !data.defaultDragFactor` → show the default-setting prompt. This mirrors the existing PB detection pattern in `handleUpdateSession`.

---

## 4. Pace Predictor

### Location

New section in the **Analysis tab** (`ChartsView.tsx`), below the existing pace trend and stroke rate trend charts.

### The Math — Paul's Law

The standard rowing pace prediction formula:

```
time2 = time1 * (distance2 / distance1) ^ 1.06
```

Given a known performance at one distance, this predicts the time at another distance. The 1.06 exponent is well-established in the rowing community for ergometer predictions.

### Data Source

For each completed session with pace data:
1. Determine the session's distance (parse from label: "5000m" -> 5000, "6 x 500m" -> 3000, "20min" -> estimate from pace and time)
2. Determine the session's total time: use `record.totalTime` directly (parsed to seconds). For interval sessions this is critical — `record.pace` is the average split pace, but Paul's Law needs actual elapsed time over the total distance. If `record.totalTime` is absent, fall back to `paceSeconds * (distance / 500)` as an approximation.
3. Apply Paul's Law to predict 2k and 5k times
4. Use the prediction from the session that yields the fastest predicted time (this is the user's best indicator)

Note: this requires `pacePredictor.ts` to read from `SessionRecord` directly (not from the `PersonalBest` type, which only stores `paceSeconds` without `totalTime`).

### Distance Parsing

- **Distance sessions** (e.g., "5000m", "10000m"): Parse the number directly
- **Interval sessions** (e.g., "6 x 500m"): Multiply reps by distance (6 * 500 = 3000m)
- **Time sessions** (e.g., "20min"): Calculate distance from pace and time. If pace is 2:05/500m and time is 20:00, that's ~4800m. This is approximate but sufficient for prediction.

### Display

Section title: **"Race Predictions"**

Two cards side by side:

**2K Card:**
- Large text: predicted total time (e.g., **"7:15.0"**)
- Below: predicted pace/500m (e.g., "1:48.7/500m")
- Source line: "From 5000m at 2:05 — RPE 8, PWR 7"
  - RPE and PWR only shown if the source session has those values
  - Gives the user context: how hard were they working when they set the pace this prediction is based on?

**5K Card:**
- Same layout

**Empty state:** "Complete a session with pace data to see race predictions" — with the same icon + message pattern used in PBs and Compare empty states.

**Edge cases:**
- If the source session's parsed distance equals exactly 2000m, the 2k card shows the actual time (labeled "Actual" instead of "Predicted"). Label parsing: "2000m" -> 2000, "4 x 500m" -> 2000. Same logic applies for 5000m and the 5k card.
- If only one session exists, both predictions come from it
- Predictions update automatically when new sessions are logged

### No Manual Input

The predictor is purely derived. No distance picker, no manual pace entry. It shows predictions based on what you've actually done.

---

## 5. RPE Overlay on Pace Chart

### Toggle

A small toggle below the existing pace trend chart: **"Show RPE"** (off by default). Uses a simple text button or small switch — not a heavy toggle component.

### Behavior

When enabled:
- Data points on the pace trend chart that have RPE values get a colored dot overlay
- Dot color follows the RPE color scheme: green (1-3), amber (4-6), red (7-10)
- Dot size: slightly larger than the existing chart dots to be visible
- The existing tooltip (shows pace, week/day) also shows **"RPE 7"** when available
- Data points without RPE are unaffected — they keep their existing appearance

### Implementation

- The toggle state is local to ChartsView (no persistence needed)
- Add `rpe?: number` to the `PaceDataPoint` interface in `src/utils/paceUtils.ts`. `extractPaceData()` populates it from `SessionRecord.rpe`
- `PaceTrendChart` receives a single new prop: `showRpe: boolean`. No separate RPE array — RPE lives on each `PaceDataPoint` already
- Rendering: when `showRpe` is true, a second SVG pass over data points that have `rpe` draws colored circles on top

---

## Files Affected

### Create (~4 files)

| File | Purpose |
|------|---------|
| `src/components/RpePrompt.tsx` | Post-save RPE prompt with 1-10 circle scale |
| `src/components/PowerLevelInput.tsx` | 1-10 circle input for power level in expanded card |
| `src/components/RacePredictions.tsx` | 2k/5k prediction cards for Analysis tab |
| `src/utils/pacePredictor.ts` | Paul's Law calculations, distance parsing, prediction logic |

### Modify (~6 files)

| File | Changes |
|------|---------|
| `src/utils/storage.ts` | Add `rpe`, `dragFactor` to SessionRecord; `defaultDragFactor` to StoredData |
| `src/components/SessionCard.tsx` | Add PowerLevelInput to expanded form, RpePrompt after save, dragFactor in DraftState, badges for RPE and PWR |
| `src/components/views/ChartsView.tsx` | Add RacePredictions section, RPE toggle, pass RPE data to chart |
| `src/components/charts/PaceTrendChart.tsx` | Accept `showRpe` prop, render RPE dot overlay, include RPE in tooltip |
| `src/components/WeekView.tsx` | Pass `defaultDragFactor` through to SessionCard |
| `src/App.tsx` | Pass `defaultDragFactor` and setter to WeekView, handle default-setting prompt |

### Reuse

| Existing Code | What to reuse |
|---------------|---------------|
| `src/utils/paceValidation.ts` | `validatePace()` / `paceToSeconds()` for prediction math |
| `src/components/StrokeRateInput.tsx` | Pattern for PowerLevelInput (label + input + hint + validation) |
| `src/components/SaveToast.tsx` | Pattern for the default-DF prompt toast |
| `src/components/views/PersonalBestsView.tsx` | Best-pace-per-category extraction logic |

---

## Verification

1. `npx tsc --noEmit` — clean TypeScript
2. `npx vitest run` — all tests pass
3. `npx vite build` — clean production build
4. Preview: expand a session card → Power Level circles visible after stroke rate, pre-filled with default if set
5. Preview: save a session → card collapses → RPE prompt slides in below → tap a number → saves and dismisses
6. Preview: RPE prompt auto-dismisses after 8 seconds if ignored
7. Preview: collapsed card shows RPE and PWR badges alongside pace and stroke rate
8. Preview: first save with power level (no default set) → "Use N as your default?" prompt appears
9. Preview: Analysis tab → Race Predictions section shows 2k and 5k cards with source info
10. Preview: Analysis tab → pace chart → toggle "Show RPE" → colored dots appear on data points
11. Preview: export data → import on fresh browser → RPE, power level, default DF all preserved
