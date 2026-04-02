# Training Insights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add RPE logging, power level logging, and pace race predictions to the Rowing Training Tracker PWA.

**Architecture:** Three features share a common data model extension (two new fields on `SessionRecord`, one on `StoredData`). RPE and Power Level are input components in SessionCard. Pace Predictor is a pure utility + display component in ChartsView. RPE data also overlays on the existing pace trend chart.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest, custom SVG charts

---

## File Structure

### Create

| File | Responsibility |
|------|---------------|
| `src/utils/pacePredictor.ts` | Paul's Law math, distance parsing from labels, prediction computation |
| `src/components/PowerLevelInput.tsx` | 1-10 circle selector for machine power level |
| `src/components/RpePrompt.tsx` | Post-save RPE prompt with 1-10 circles, auto-dismiss |
| `src/components/RacePredictions.tsx` | Two-card prediction display for Analysis tab |
| `src/utils/__tests__/pacePredictor.test.ts` | Unit tests for pace prediction logic |

### Modify

| File | Changes |
|------|---------|
| `src/utils/storage.ts` | Add `rpe`, `dragFactor` to `SessionRecord`; `defaultDragFactor` to `StoredData`; update `createEmptySession` |
| `src/hooks/useTrainingData.ts` | Add `setDefaultDragFactor` method, expose in return |
| `src/utils/paceUtils.ts` | Add `rpe?: number` to `PaceDataPoint`; populate in `extractPaceData` |
| `src/components/SessionCard.tsx` | Add `dragFactor` to DraftState, update `makeDraft`/`isDraftChanged`, add PowerLevelInput + RpePrompt + badges |
| `src/components/WeekView.tsx` | Add `defaultDragFactor`/`setDefaultDragFactor` props, pass through |
| `src/App.tsx` | Wire `defaultDragFactor`/`setDefaultDragFactor` to WeekView, add default-DF prompt in `handleUpdateSession` |
| `src/components/charts/PaceTrendChart.tsx` | Add `showRpe` prop, render RPE dot overlay, update tooltip |
| `src/components/views/ChartsView.tsx` | Add RPE toggle, RacePredictions section, pass `showRpe` to chart |

---

## Task 1: Data Model — Add `rpe`, `dragFactor`, `defaultDragFactor`

**Files:**
- Modify: `src/utils/storage.ts`
- Modify: `src/hooks/useTrainingData.ts`

- [ ] **Step 1: Add fields to `SessionRecord` in `storage.ts`**

In `src/utils/storage.ts`, add two optional fields to the `SessionRecord` interface after `completedDate`:

```typescript
rpe?: number;        // 1-10, rate of perceived exertion
dragFactor?: number; // 1-10, machine power level setting
```

Add `defaultDragFactor` to `StoredData` after `planSessions`:

```typescript
defaultDragFactor?: number; // 1-10, user's default power level
```

No changes to `createEmptySession()` — both fields default to `undefined` which is correct for optional fields.

- [ ] **Step 2: Add `setDefaultDragFactor` to `useTrainingData`**

In `src/hooks/useTrainingData.ts`, add a new callback alongside `logRestDay`/`undoRestDay`:

```typescript
const setDefaultDragFactor = useCallback((value: number) => {
  setData((prev) => ({ ...prev, defaultDragFactor: value }));
}, []);
```

Add `setDefaultDragFactor` to the hook's return object.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean, zero errors

- [ ] **Step 4: Verify tests pass**

Run: `npx vitest run`
Expected: All existing tests pass (no behavior changed)

- [ ] **Step 5: Commit**

```bash
git add src/utils/storage.ts src/hooks/useTrainingData.ts
git commit -m "feat: add rpe, dragFactor, defaultDragFactor to data model"
```

---

## Task 2: Pace Predictor Utility — `pacePredictor.ts` with tests

**Files:**
- Create: `src/utils/pacePredictor.ts`
- Create: `src/utils/__tests__/pacePredictor.test.ts`

- [ ] **Step 1: Write tests for distance parsing**

Create `src/utils/__tests__/pacePredictor.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseDistance, predictTime, computePredictions } from '../pacePredictor';

describe('parseDistance', () => {
  it('parses distance sessions', () => {
    expect(parseDistance('5000m')).toBe(5000);
    expect(parseDistance('10000m')).toBe(10000);
    expect(parseDistance('2000m')).toBe(2000);
  });

  it('parses interval sessions', () => {
    expect(parseDistance('6 x 500m / 2min rest')).toBe(3000);
    expect(parseDistance('4 x 1000m / 3min rest')).toBe(4000);
    expect(parseDistance('8 x 500m / 2min rest')).toBe(4000);
  });

  it('returns null for time-based sessions without pace/time', () => {
    expect(parseDistance('20min')).toBeNull();
    expect(parseDistance('30min')).toBeNull();
  });
});

describe('predictTime', () => {
  it('predicts 2k from 5k using Paul\'s Law', () => {
    // 5000m in 20:00 (1200s) → 2k prediction
    const predicted = predictTime(1200, 5000, 2000);
    // time2 = 1200 * (2000/5000)^1.06 = 1200 * 0.4^1.06 ≈ 462.8s ≈ 7:42.8
    expect(predicted).toBeCloseTo(462.8, 0);
  });

  it('predicts 5k from 2k using Paul\'s Law', () => {
    // 2000m in 7:00 (420s) → 5k prediction
    const predicted = predictTime(420, 2000, 5000);
    // time2 = 420 * (5000/2000)^1.06 = 420 * 2.5^1.06 ≈ 1090.6s ≈ 18:10.6
    expect(predicted).toBeCloseTo(1090.6, 0);
  });

  it('returns same time when distances match', () => {
    const predicted = predictTime(1200, 5000, 5000);
    expect(predicted).toBe(1200);
  });
});

describe('computePredictions', () => {
  it('returns null predictions when no sessions have pace data', () => {
    const result = computePredictions({}, []);
    expect(result.twoK).toBeNull();
    expect(result.fiveK).toBeNull();
  });

  it('marks actual when source distance matches target', () => {
    const sessions = {
      '1-1': {
        completed: true,
        pace: '2:00',
        totalTime: '20:00',
        intervalTimes: [],
        notes: '',
        completedDate: '2026-01-01',
      },
    };
    const plan = [
      { weekNumber: 1, dayNumber: 1, label: '5000m', description: '', isOptional: false },
    ];
    const result = computePredictions(sessions, plan);
    expect(result.fiveK).not.toBeNull();
    expect(result.fiveK!.isActual).toBe(true);
    expect(result.fiveK!.totalSeconds).toBeCloseTo(1200, 0);
  });

  it('computes predictions from a distance session', () => {
    const sessions = {
      '1-1': {
        completed: true,
        pace: '2:05',
        totalTime: '20:50',
        intervalTimes: [],
        notes: '',
        completedDate: '2026-01-01',
      },
    };
    const plan = [
      { weekNumber: 1, dayNumber: 1, label: '5000m', description: '', isOptional: false },
    ];
    const result = computePredictions(sessions, plan);
    expect(result.twoK).not.toBeNull();
    expect(result.twoK!.isActual).toBe(false);
    expect(result.twoK!.totalSeconds).toBeGreaterThan(0);
    expect(result.twoK!.pacePerFiveHundred).toBeGreaterThan(0);
    expect(result.twoK!.sourceLabel).toBe('5000m');
  });

  it('uses totalTime for intervals instead of pace × distance', () => {
    const sessions = {
      '1-1': {
        completed: true,
        pace: '1:55',       // split pace
        totalTime: '12:30', // actual elapsed time including rest? No — totalTime is work time
        intervalTimes: ['1:55', '1:54', '1:56', '1:55', '1:54', '1:56'],
        notes: '',
        completedDate: '2026-01-01',
      },
    };
    const plan = [
      { weekNumber: 1, dayNumber: 1, label: '6 x 500m / 2min rest', description: '', isOptional: false },
    ];
    const result = computePredictions(sessions, plan);
    expect(result.twoK).not.toBeNull();
    // Total distance = 3000m, totalTime = 12:30 = 750s
    // Prediction should use 750s over 3000m, not pace-derived time
    expect(result.twoK!.sourceLabel).toBe('6 x 500m / 2min rest');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/__tests__/pacePredictor.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `pacePredictor.ts`**

Create `src/utils/pacePredictor.ts`:

```typescript
import type { SessionRecord } from './storage';
import type { SessionDescriptor } from '../data/trainingPlan';
import { paceToSeconds } from './paceUtils';

export interface RacePrediction {
  totalSeconds: number;
  pacePerFiveHundred: number; // seconds per 500m
  isActual: boolean;          // true if source distance matches target
  sourceLabel: string;        // e.g. "5000m"
  sourcePace: string;         // e.g. "2:05"
  sourceRpe?: number;
  sourceDragFactor?: number;
}

export interface Predictions {
  twoK: RacePrediction | null;
  fiveK: RacePrediction | null;
}

/**
 * Parse total distance in meters from a session label.
 * Returns null for time-based sessions (need pace+time to estimate).
 */
export function parseDistance(label: string): number | null {
  // Interval: "6 x 500m / 2min rest"
  const intervalMatch = label.match(/(\d+)\s*x\s*(\d+)m/i);
  if (intervalMatch) {
    return parseInt(intervalMatch[1], 10) * parseInt(intervalMatch[2], 10);
  }
  // Distance: "5000m", "10000m"
  const distMatch = label.match(/^(\d+)m$/i);
  if (distMatch) {
    return parseInt(distMatch[1], 10);
  }
  // Time-based: "20min" — cannot determine distance from label alone
  return null;
}

/**
 * Parse a time string "mm:ss" or "m:ss" into total seconds.
 * Returns null if unparseable.
 */
function parseTime(time: string): number | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

/**
 * Paul's Law: time2 = time1 * (distance2 / distance1) ^ 1.06
 */
export function predictTime(
  knownTimeSeconds: number,
  knownDistanceMeters: number,
  targetDistanceMeters: number
): number {
  if (knownDistanceMeters === targetDistanceMeters) return knownTimeSeconds;
  return knownTimeSeconds * Math.pow(targetDistanceMeters / knownDistanceMeters, 1.06);
}

/**
 * Compute 2k and 5k race predictions from all completed sessions.
 */
export function computePredictions(
  sessions: Record<string, SessionRecord>,
  plan: SessionDescriptor[]
): Predictions {
  let best2k: RacePrediction | null = null;
  let best5k: RacePrediction | null = null;

  for (const desc of plan) {
    const key = `${desc.weekNumber}-${desc.dayNumber}`;
    const record = sessions[key];
    if (!record?.completed || !record.pace) continue;

    const paceSeconds = paceToSeconds(record.pace);
    if (paceSeconds === null) continue;

    // Determine distance
    let distance = parseDistance(desc.label);

    // For time-based sessions, estimate distance from pace and totalTime
    if (distance === null) {
      const totalTimeSec = record.totalTime ? parseTime(record.totalTime) : null;
      if (totalTimeSec && totalTimeSec > 0) {
        // distance = totalTime / (pace per 500m) * 500
        distance = Math.round((totalTimeSec / paceSeconds) * 500);
      } else {
        continue; // Can't determine distance, skip
      }
    }

    if (distance <= 0) continue;

    // Determine total time for Paul's Law
    let totalTimeSec: number;
    const parsedTotalTime = record.totalTime ? parseTime(record.totalTime) : null;
    if (parsedTotalTime && parsedTotalTime > 0) {
      totalTimeSec = parsedTotalTime;
    } else {
      // Fallback: derive from pace
      totalTimeSec = paceSeconds * (distance / 500);
    }

    // Predict 2k
    const predicted2k = predictTime(totalTimeSec, distance, 2000);
    const pace2k = predicted2k / (2000 / 500); // seconds per 500m
    if (best2k === null || predicted2k < best2k.totalSeconds) {
      best2k = {
        totalSeconds: predicted2k,
        pacePerFiveHundred: pace2k,
        isActual: distance === 2000,
        sourceLabel: desc.label,
        sourcePace: record.pace,
        sourceRpe: record.rpe,
        sourceDragFactor: record.dragFactor,
      };
    }

    // Predict 5k
    const predicted5k = predictTime(totalTimeSec, distance, 5000);
    const pace5k = predicted5k / (5000 / 500); // seconds per 500m
    if (best5k === null || predicted5k < best5k.totalSeconds) {
      best5k = {
        totalSeconds: predicted5k,
        pacePerFiveHundred: pace5k,
        isActual: distance === 5000,
        sourceLabel: desc.label,
        sourcePace: record.pace,
        sourceRpe: record.rpe,
        sourceDragFactor: record.dragFactor,
      };
    }
  }

  return { twoK: best2k, fiveK: best5k };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/__tests__/pacePredictor.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/pacePredictor.ts src/utils/__tests__/pacePredictor.test.ts
git commit -m "feat: add pace predictor utility with Paul's Law and tests"
```

---

## Task 3: PowerLevelInput Component

**Files:**
- Create: `src/components/PowerLevelInput.tsx`

- [ ] **Step 1: Create `PowerLevelInput.tsx`**

```typescript
import { useCallback } from 'react';

interface PowerLevelInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  isDefault?: boolean; // true when value came from defaultDragFactor pre-fill
}

export default function PowerLevelInput({ value, onChange, isDefault }: PowerLevelInputProps) {
  const handleSelect = useCallback(
    (level: number) => {
      // Tapping the already-selected value deselects it
      onChange(value === level ? undefined : level);
    },
    [value, onChange]
  );

  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">
        Power Level
      </label>
      <div className="flex justify-between">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => {
          const isSelected = value === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => handleSelect(level)}
              className="min-w-[44px] min-h-[44px] -mx-[3px] flex items-center justify-center touch-manipulation"
              aria-label={`Power level ${level}`}
              aria-pressed={isSelected}
            >
              <span className={`
                w-8 h-8 rounded-full text-xs font-bold
                flex items-center justify-center
                transition-all duration-150
                ${
                  isSelected
                    ? isDefault
                      ? 'bg-gray-300 dark:bg-[#404b66] text-gray-700 dark:text-gray-200 ring-2 ring-gray-400 dark:ring-gray-500'
                      : 'bg-teal-500 dark:bg-[#00d2ff] text-white dark:text-[#060e20] ring-2 ring-teal-400 dark:ring-[#00d2ff] scale-110'
                    : 'bg-gray-100 dark:bg-[#1a2640] text-gray-500 dark:text-gray-400'
                }
              `}>
                {level}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 3: Commit**

```bash
git add src/components/PowerLevelInput.tsx
git commit -m "feat: add PowerLevelInput component with 1-10 circle selector"
```

---

## Task 4: RpePrompt Component

**Files:**
- Create: `src/components/RpePrompt.tsx`

- [ ] **Step 1: Create `RpePrompt.tsx`**

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';

interface RpePromptProps {
  onSelect: (rpe: number) => void;
  onDismiss: () => void;
}

function rpeColor(rpe: number): string {
  if (rpe <= 3) return 'bg-green-500 dark:bg-green-500';
  if (rpe <= 6) return 'bg-amber-500 dark:bg-amber-400';
  return 'bg-red-500 dark:bg-red-500';
}

function rpeTextColor(rpe: number): string {
  if (rpe <= 3) return 'text-green-700 dark:text-green-400';
  if (rpe <= 6) return 'text-amber-700 dark:text-amber-400';
  return 'text-red-700 dark:text-red-400';
}

export default function RpePrompt({ onSelect, onDismiss }: RpePromptProps) {
  const [exiting, setExiting] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
    }, 8000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Handle outside clicks/taps
  useEffect(() => {
    const handleClick = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExiting(true);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, []);

  const handleAnimationEnd = useCallback(() => {
    if (exiting) onDismiss();
  }, [exiting, onDismiss]);

  const handleSelect = useCallback(
    (rpe: number) => {
      setSelected(rpe);
      if (timerRef.current) clearTimeout(timerRef.current);
      // Brief highlight, then save and exit
      setTimeout(() => {
        onSelect(rpe);
      }, 200);
    },
    [onSelect]
  );

  return (
    <div
      ref={containerRef}
      className="mx-5 mb-4 p-4 rounded-2xl bg-white dark:bg-[#0f1b33] border border-gray-100 dark:border-white/[0.06]"
      style={{
        animation: exiting
          ? 'slideUp 0.2s ease-in forwards'
          : 'slideDown 0.25s ease-out',
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider text-center">
        How hard was that?
      </p>
      <div className="flex justify-between items-center gap-1">
        <span className="text-[9px] text-gray-400 dark:text-[#5a6580] font-bold uppercase w-8 text-center shrink-0">Easy</span>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((rpe) => {
          const isSelected = selected === rpe;
          return (
            <button
              key={rpe}
              type="button"
              onClick={() => handleSelect(rpe)}
              className="min-w-[44px] min-h-[44px] -mx-[3px] flex items-center justify-center touch-manipulation"
              aria-label={`RPE ${rpe}`}
            >
              <span className={`
                w-7 h-7 rounded-full text-[10px] font-bold
                flex items-center justify-center
                transition-all duration-150
                ${
                  isSelected
                    ? `${rpeColor(rpe)} text-white scale-125`
                    : `bg-gray-100 dark:bg-[#1a2640] ${rpeTextColor(rpe)}`
                }
              `}>
                {rpe}
              </span>
            </button>
          );
        })}
        <span className="text-[9px] text-gray-400 dark:text-[#5a6580] font-bold uppercase w-8 text-center shrink-0">Max</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 3: Commit**

```bash
git add src/components/RpePrompt.tsx
git commit -m "feat: add RpePrompt component with 1-10 circles and auto-dismiss"
```

---

## Task 5: Wire PowerLevelInput + RpePrompt into SessionCard

**Files:**
- Modify: `src/components/SessionCard.tsx`
- Modify: `src/components/WeekView.tsx`

- [ ] **Step 1: Update `SessionCardProps`, `DraftState`, `makeDraft`, `isDraftChanged`**

In `src/components/SessionCard.tsx`:

Add to `SessionCardProps`:
```typescript
defaultDragFactor?: number;
```

Add to `DraftState`:
```typescript
dragFactor?: number;
```

Update `makeDraft` — add `defaultDragFactor` parameter (3rd param):
```typescript
function makeDraft(record: SessionRecord, intervalCount: number, defaultDragFactor?: number): DraftState {
  return {
    pace: record.pace,
    totalTime: record.totalTime,
    intervalTimes: record.intervalTimes.length === intervalCount
      ? record.intervalTimes
      : Array.from({ length: intervalCount }, (_, i) => record.intervalTimes[i] || ''),
    strokeRate: record.strokeRate,
    notes: record.notes,
    dragFactor: record.dragFactor ?? defaultDragFactor,
  };
}
```

Update `isDraftChanged` — add `defaultDragFactor` parameter (3rd param):
```typescript
function isDraftChanged(draft: DraftState, record: SessionRecord, defaultDragFactor?: number): boolean {
  if (draft.pace !== record.pace) return true;
  if (draft.totalTime !== record.totalTime) return true;
  if (draft.notes !== record.notes) return true;
  if (draft.strokeRate !== record.strokeRate) return true;
  // dragFactor: pre-filled default doesn't count as a change
  if (record.dragFactor !== undefined && draft.dragFactor !== record.dragFactor) return true;
  if (record.dragFactor === undefined && draft.dragFactor !== undefined && draft.dragFactor !== defaultDragFactor) return true;
  if (draft.intervalTimes.length !== record.intervalTimes.length) return true;
  for (let i = 0; i < draft.intervalTimes.length; i++) {
    if (draft.intervalTimes[i] !== record.intervalTimes[i]) return true;
  }
  return false;
}
```

Update all call sites of `makeDraft` and `isDraftChanged` inside the component to pass `defaultDragFactor`:
- `useState<DraftState>(() => makeDraft(record, intervalCount, defaultDragFactor))`
- `setDraft(makeDraft(record, intervalCount, defaultDragFactor))` (in the useEffect at ~line 101)
- `isDraftChanged(draft, record, defaultDragFactor)` (in `hasChanges` computation)
- `handleDiscard`: `setDraft(makeDraft(record, intervalCount, defaultDragFactor))`

- [ ] **Step 2: Add `showRpePrompt` state, update `handleSave`, add imports**

Add imports at top of SessionCard:
```typescript
import PowerLevelInput from './PowerLevelInput';
import RpePrompt from './RpePrompt';
```

Add state:
```typescript
const [showRpePrompt, setShowRpePrompt] = useState(false);
```

Update `handleSave` to include `dragFactor` in the update and show RPE prompt:
```typescript
const handleSave = useCallback(() => {
  const savedPace = draft.pace;
  onUpdate({
    pace: draft.pace,
    totalTime: draft.totalTime,
    intervalTimes: draft.intervalTimes,
    strokeRate: draft.strokeRate,
    dragFactor: draft.dragFactor,
    notes: draft.notes,
  });
  if (!record.completed) {
    onToggleComplete();
  }
  setExpanded(false);
  if (!record.rpe) {
    setShowRpePrompt(true);
  }
  const toastMsg = savedPace ? `Saved: ${savedPace}/500m` : 'Session saved & completed';
  setShowToast(toastMsg);
}, [draft, onUpdate, record.completed, onToggleComplete]);
```

Update `handlePhotoData` to include `dragFactor` (it doesn't touch it, but the existing `setDraft` spread handles it).

- [ ] **Step 3: Add PowerLevelInput to expanded card JSX**

Insert after `StrokeRateInput` (around line 307 in the expanded content area, before `NotesInput`):

```tsx
<PowerLevelInput
  value={draft.dragFactor}
  onChange={(v) => setDraft((prev) => ({ ...prev, dragFactor: v }))}
  isDefault={record.dragFactor === undefined && draft.dragFactor === defaultDragFactor}
/>
```

- [ ] **Step 4: Add RPE and PWR badges to collapsed card**

In the collapsed badge section (around line 196), update the condition and add new badges:

```tsx
{!expanded && (record.pace || record.strokeRate || record.rpe || record.dragFactor) && (
  <div className="flex gap-2 mt-2 flex-wrap">
    {record.pace && (
      <span className="text-[10px] font-mono font-bold bg-teal-50 dark:bg-[#00d2ff]/10 text-teal-700 dark:text-[#00d2ff] px-2.5 py-1 rounded-lg">
        {record.pace}/500m
      </span>
    )}
    {record.strokeRate && (
      <span className="text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-lg">
        {record.strokeRate} spm
      </span>
    )}
    {record.rpe && (
      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg ${
        record.rpe <= 3
          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
          : record.rpe <= 6
            ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
      }`}>
        RPE {record.rpe}
      </span>
    )}
    {record.dragFactor && (
      <span className="text-[10px] font-mono font-bold bg-gray-100 dark:bg-[#1a2640] text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-lg">
        PWR {record.dragFactor}
      </span>
    )}
  </div>
)}
```

- [ ] **Step 5: Add RpePrompt after the card's main div**

In the fragment return, after `showToast && (...)` and before `showUncheckConfirm && (...)`:

```tsx
{showRpePrompt && (
  <RpePrompt
    onSelect={(rpe) => {
      onUpdate({ rpe });
      setShowRpePrompt(false);
    }}
    onDismiss={() => setShowRpePrompt(false)}
  />
)}
```

- [ ] **Step 6: Update WeekView to pass `defaultDragFactor`**

In `src/components/WeekView.tsx`, add to `WeekViewProps`:
```typescript
defaultDragFactor?: number;
```

Pass it through to each `<SessionCard>`:
```tsx
defaultDragFactor={defaultDragFactor}
```

(Two places: core sessions map and optional sessions map)

- [ ] **Step 7: Verify TypeScript compiles and tests pass**

Run: `npx tsc --noEmit && npx vitest run`
Expected: Clean TypeScript, all tests pass

- [ ] **Step 8: Commit**

```bash
git add src/components/SessionCard.tsx src/components/WeekView.tsx
git commit -m "feat: wire PowerLevelInput and RpePrompt into SessionCard"
```

---

## Task 6: Wire `defaultDragFactor` through App.tsx + Default-Setting Prompt

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add default drag factor state and prompt**

In `src/App.tsx`, add `setDefaultDragFactor` to the existing destructure from `useTrainingData()`. Find the line that destructures the hook return (around line 77) and append `setDefaultDragFactor` to the destructure list.

Add state for the default-setting prompt:
```typescript
const [showDfPrompt, setShowDfPrompt] = useState<number | null>(null);
```

- [ ] **Step 2: Update `handleUpdateSession` to detect first drag factor save**

After the existing `updateSession(week, day, partial)` call, add:
```typescript
// First-save default drag factor prompt
if (partial.dragFactor !== undefined && !data.defaultDragFactor) {
  setShowDfPrompt(partial.dragFactor);
}
```

- [ ] **Step 3: Pass props to WeekView**

Add to the `<WeekView>` JSX:
```tsx
defaultDragFactor={data.defaultDragFactor}
```

- [ ] **Step 4: Render the default-setting prompt**

After the existing modals at the bottom of App's JSX, add a simple toast-like prompt:

```tsx
{showDfPrompt !== null && (
  <div
    className="fixed left-4 right-4 z-50"
    style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px) + 3.5rem)', animation: 'toastSlideIn 0.25s ease-out' }}
  >
    <div className="max-w-md mx-auto bg-white dark:bg-[#1a2640] rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-white/[0.06] flex items-center gap-3">
      <p className="flex-1 text-sm text-gray-700 dark:text-gray-200">
        Use <strong>{showDfPrompt}</strong> as your default power level?
      </p>
      <button
        onClick={() => {
          setDefaultDragFactor(showDfPrompt!);
          setShowDfPrompt(null);
        }}
        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider btn-primary-gradient min-h-[44px] touch-manipulation"
      >
        Yes
      </button>
      <button
        onClick={() => setShowDfPrompt(null)}
        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gray-100 dark:bg-[#0f1b33] text-gray-600 dark:text-gray-400 min-h-[44px] touch-manipulation"
      >
        No
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 5: Verify TypeScript compiles and tests pass**

Run: `npx tsc --noEmit && npx vitest run`
Expected: Clean

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire defaultDragFactor through App and add first-save prompt"
```

---

## Task 7: Add `rpe` to `PaceDataPoint` and `extractPaceData`

**Files:**
- Modify: `src/utils/paceUtils.ts`

- [ ] **Step 1: Add `rpe` to `PaceDataPoint`**

In `src/utils/paceUtils.ts`, add to the `PaceDataPoint` interface:
```typescript
rpe?: number;
```

- [ ] **Step 2: Populate `rpe` in `extractPaceData`**

In the `extractPaceData` function, where the `PaceDataPoint` object is constructed (inside the map/filter), add:
```typescript
rpe: record.rpe,
```

(The function iterates `plan` and looks up `sessions[key]` — `record` is `sessions[key]`, which is `SessionRecord`.)

- [ ] **Step 3: Verify TypeScript compiles and tests pass**

Run: `npx tsc --noEmit && npx vitest run`
Expected: Clean

- [ ] **Step 4: Commit**

```bash
git add src/utils/paceUtils.ts
git commit -m "feat: include rpe in PaceDataPoint for chart overlay"
```

---

## Task 8: RPE Overlay on PaceTrendChart

**Files:**
- Modify: `src/components/charts/PaceTrendChart.tsx`

- [ ] **Step 1: Add `showRpe` prop**

Update `PaceTrendChartProps`:
```typescript
interface PaceTrendChartProps {
  data: PaceDataPoint[];
  showRpe?: boolean;
}
```

Destructure in component: `{ data, showRpe = false }`

- [ ] **Step 2: Add RPE color helper**

Add inside the file:
```typescript
function rpeOverlayColor(rpe: number): string {
  if (rpe <= 3) return '#34c06a'; // green-400
  if (rpe <= 6) return '#fabd00'; // amber-400
  return '#ef4444';               // red-500
}
```

- [ ] **Step 3: Render RPE dot overlay**

After the existing data point circles in the SVG (the `data.map` that renders `<circle>` elements), add a second pass when `showRpe` is true:

```tsx
{showRpe && data.map((point, i) => {
  if (!point.rpe) return null;
  const x = /* same x calculation as existing circles */;
  const y = /* same y calculation as existing circles */;
  return (
    <circle
      key={`rpe-${i}`}
      cx={x}
      cy={y}
      r={6}
      fill={rpeOverlayColor(point.rpe)}
      opacity={0.85}
      stroke="white"
      strokeWidth={1.5}
    />
  );
})}
```

The exact x/y calculations should reuse the same scale functions already used for the data point circles in the component.

- [ ] **Step 4: Update tooltip to show RPE**

In the tooltip rendering section, when a data point is hovered, add RPE info if available:

```tsx
{hoveredPoint?.rpe && (
  <span className="text-[10px] font-mono">RPE {hoveredPoint.rpe}</span>
)}
```

- [ ] **Step 5: Verify TypeScript compiles and tests pass**

Run: `npx tsc --noEmit && npx vitest run`
Expected: Clean

- [ ] **Step 6: Commit**

```bash
git add src/components/charts/PaceTrendChart.tsx
git commit -m "feat: add RPE dot overlay and tooltip info on pace trend chart"
```

---

## Task 9: RacePredictions Display Component

**Files:**
- Create: `src/components/RacePredictions.tsx`

- [ ] **Step 1: Create `RacePredictions.tsx`**

```typescript
import { useMemo } from 'react';
import type { SessionRecord } from '../utils/storage';
import type { SessionDescriptor } from '../data/trainingPlan';
import { computePredictions } from '../utils/pacePredictor';
import type { RacePrediction } from '../utils/pacePredictor';

interface RacePredictionsProps {
  sessions: Record<string, SessionRecord>;
  plan: SessionDescriptor[];
}

function formatTime(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds * 10) / 10;
  const minutes = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${minutes}:${secs.toFixed(1).padStart(4, '0')}`;
}

function formatPace(paceSeconds: number): string {
  const minutes = Math.floor(paceSeconds / 60);
  const secs = Math.floor(paceSeconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function PredictionCard({ label, prediction }: { label: string; prediction: RacePrediction | null }) {
  if (!prediction) return null;

  const sourceContext = [
    prediction.sourceRpe ? `RPE ${prediction.sourceRpe}` : null,
    prediction.sourceDragFactor ? `PWR ${prediction.sourceDragFactor}` : null,
  ].filter(Boolean).join(', ');

  return (
    <div className="flex-1 p-4 rounded-xl bg-white dark:bg-[#0f1b33] border border-gray-100 dark:border-white/[0.06]">
      <div className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase tracking-wider mb-1">
        {prediction.isActual ? `${label} Actual` : `${label} Predicted`}
      </div>
      <div className="font-mono text-2xl font-bold text-gray-800 dark:text-[#dae2fd]">
        {formatTime(prediction.totalSeconds)}
      </div>
      <div className="font-mono text-xs text-teal-600 dark:text-[#00d2ff] mt-0.5">
        {formatPace(prediction.pacePerFiveHundred)}/500m
      </div>
      <div className="text-[10px] text-gray-400 dark:text-[#5a6580] mt-2 leading-relaxed">
        From {prediction.sourceLabel} at {prediction.sourcePace}
        {sourceContext && ` — ${sourceContext}`}
      </div>
    </div>
  );
}

export default function RacePredictions({ sessions, plan }: RacePredictionsProps) {
  const predictions = useMemo(() => computePredictions(sessions, plan), [sessions, plan]);

  if (!predictions.twoK && !predictions.fiveK) {
    return (
      <div className="mt-6">
        <h3 className="font-display text-lg font-bold text-gray-800 dark:text-[#dae2fd] mb-3">
          Race Predictions
        </h3>
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#1a2640] flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-gray-400 dark:text-[#5a6580]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            No predictions yet
          </p>
          <p className="text-xs text-gray-400 dark:text-[#5a6580] mt-1">
            Complete a session with pace data to see race predictions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="font-display text-lg font-bold text-gray-800 dark:text-[#dae2fd] mb-3">
        Race Predictions
      </h3>
      <div className="flex gap-3">
        <PredictionCard label="2K" prediction={predictions.twoK} />
        <PredictionCard label="5K" prediction={predictions.fiveK} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 3: Commit**

```bash
git add src/components/RacePredictions.tsx
git commit -m "feat: add RacePredictions display component for Analysis tab"
```

---

## Task 10: Wire RacePredictions + RPE Toggle into ChartsView

**Files:**
- Modify: `src/components/views/ChartsView.tsx`

- [ ] **Step 1: Add imports and state**

Add imports:
```typescript
import RacePredictions from '../RacePredictions';
import { useState } from 'react'; // may already be imported
```

Add state for RPE toggle:
```typescript
const [showRpe, setShowRpe] = useState(false);
```

- [ ] **Step 2: Add RPE toggle below PaceTrendChart**

Inside the pace chart card div, insert after `<PaceTrendChart>` and before `{legend}`:

```tsx
<div className="flex justify-end mt-2">
  <button
    onClick={() => setShowRpe(!showRpe)}
    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors touch-manipulation min-h-[44px] ${
      showRpe
        ? 'bg-teal-50 dark:bg-[#00d2ff]/10 text-teal-700 dark:text-[#00d2ff]'
        : 'text-gray-400 dark:text-[#5a6580] hover:text-gray-600 dark:hover:text-gray-300'
    }`}
  >
    {showRpe ? 'Hide RPE' : 'Show RPE'}
  </button>
</div>
```

- [ ] **Step 3: Pass `showRpe` to PaceTrendChart**

Update the `<PaceTrendChart>` call:
```tsx
<PaceTrendChart data={filteredPace} showRpe={showRpe} />
```

- [ ] **Step 4: Add RacePredictions section**

Place `<RacePredictions>` **outside** the `{!hasAnyData ? <EmptyState> : <>...</>}` conditional block, so it renders independently and can show its own empty state even when the charts have no data. Add it after the closing of that conditional:

```tsx
<RacePredictions sessions={sessions} plan={plan} />
```

- [ ] **Step 5: Verify TypeScript compiles and tests pass**

Run: `npx tsc --noEmit && npx vitest run`
Expected: Clean

- [ ] **Step 6: Verify build**

Run: `npx vite build`
Expected: Clean production build

- [ ] **Step 7: Commit**

```bash
git add src/components/views/ChartsView.tsx
git commit -m "feat: add RPE toggle on pace chart and Race Predictions section"
```

---

## Task 11: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (existing 164 + new pacePredictor tests)

- [ ] **Step 3: Production build**

Run: `npx vite build`
Expected: Clean build, no warnings

- [ ] **Step 4: Visual verification — expanded card with Power Level**

Preview: expand a session card. Verify:
- Power Level circles appear after stroke rate input
- 10 circles in a row, labeled "Power Level"
- Tapping a circle selects it (teal highlight)
- Unsaved changes indicator appears

- [ ] **Step 5: Visual verification — save and RPE prompt**

Preview: fill in pace "2:05", tap Save. Verify:
- Card collapses
- Save toast appears
- RPE prompt slides in below card: "How hard was that?" with 1-10 colored circles
- Tapping a number saves and dismisses the prompt
- Wait 8 seconds without tapping: prompt auto-dismisses

- [ ] **Step 6: Visual verification — collapsed card badges**

Preview: after saving with RPE and Power Level. Verify:
- Collapsed card shows: pace badge, RPE badge (color-coded), PWR badge (gray)

- [ ] **Step 7: Visual verification — default power level prompt**

Preview: first save with a power level (fresh data). Verify:
- Toast-like prompt: "Use N as your default power level?" with Yes/No
- Tapping Yes sets the default
- Next card expansion pre-fills the power level

- [ ] **Step 8: Visual verification — Race Predictions**

Preview: go to Analysis tab with at least one completed session with pace data. Verify:
- "Race Predictions" section below charts
- 2K and 5K cards with predicted times and source info

- [ ] **Step 9: Visual verification — RPE overlay on chart**

Preview: Analysis tab with RPE data logged. Verify:
- "Show RPE" toggle below pace chart
- Toggle on: colored dots appear on data points with RPE
- Tooltip shows RPE value when hovering

- [ ] **Step 10: Verify data export/import**

Preview: Export backup, import on fresh browser. Verify RPE, power level, and default drag factor are all preserved.
