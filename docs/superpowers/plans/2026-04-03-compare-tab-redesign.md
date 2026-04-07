# Compare Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Compare tab's label-matching comparison with training volume charts and a pin-any-two session comparator.

**Architecture:** Delete the old comparison infrastructure (workoutGrouping, ComparisonSparkline, ComparisonTable). Build a volume calculation utility and two new components (VolumeChart, SessionComparison). Add pin state to App.tsx and thread it through WeekView to SessionCard. Rewrite ComparisonView to compose the new components.

**Tech Stack:** React 19, TypeScript strict, Tailwind CSS v4, Vite, Vitest

**Spec:** `docs/superpowers/specs/2026-04-03-compare-tab-redesign.md`

---

### Task 1: Export `parseTime` and create `volumeCalc.ts` with tests

**Files:**
- Modify: `src/utils/pacePredictor.ts:32` — add `export` keyword to `parseTime`
- Create: `src/utils/volumeCalc.ts`
- Create: `src/utils/__tests__/volumeCalc.test.ts`

- [ ] **Step 1: Export `parseTime` from `pacePredictor.ts`**

In `src/utils/pacePredictor.ts`, line 32, change:
```typescript
function parseTime(time: string): number | null {
```
to:
```typescript
export function parseTime(time: string): number | null {
```

- [ ] **Step 2: Run existing tests to ensure no regression**

Run: `npx vitest run src/utils/__tests__/pacePredictor.test.ts`
Expected: All 10 tests pass (exporting doesn't change behavior).

- [ ] **Step 3: Write `volumeCalc.test.ts`**

Create `src/utils/__tests__/volumeCalc.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeWeeklyVolume } from '../volumeCalc';
import type { SessionRecord } from '../storage';
import type { SessionDescriptor } from '../../data/trainingPlan';

function makeDesc(week: number, day: number, label: string): SessionDescriptor {
  return { weekNumber: week, dayNumber: day, label, description: '', isOptional: false };
}

function makeRecord(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    completed: true,
    pace: '',
    totalTime: '',
    intervalTimes: [],
    notes: '',
    ...overrides,
  };
}

describe('computeWeeklyVolume', () => {
  it('returns empty array when no sessions completed', () => {
    const plan = [makeDesc(1, 1, '5000m')];
    const sessions = { '1-1': makeRecord({ completed: false }) };
    expect(computeWeeklyVolume(sessions, plan)).toEqual([]);
  });

  it('computes meters from a simple distance label', () => {
    const plan = [makeDesc(1, 1, '5000m')];
    const sessions = { '1-1': makeRecord({ completed: true, pace: '2:00', totalTime: '20:00' }) };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result).toHaveLength(1);
    expect(result[0].weekNumber).toBe(1);
    expect(result[0].totalMeters).toBe(5000);
  });

  it('computes meters from an interval label', () => {
    const plan = [makeDesc(1, 1, '6 x 500m / 2min rest')];
    const sessions = { '1-1': makeRecord({ completed: true, pace: '1:55', totalTime: '18:00' }) };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result[0].totalMeters).toBe(3000);
  });

  it('estimates meters from pace and time for time-based sessions', () => {
    // 20min session at 2:00/500m pace → 20*60 / 120 * 500 = 5000m
    const plan = [makeDesc(1, 1, '20min')];
    const sessions = { '1-1': makeRecord({ completed: true, pace: '2:00', totalTime: '20:00' }) };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result[0].totalMeters).toBe(5000);
  });

  it('contributes 0 meters when no distance or pace available', () => {
    const plan = [makeDesc(1, 1, '20min')];
    const sessions = { '1-1': makeRecord({ completed: true, totalTime: '20:00' }) };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result[0].totalMeters).toBe(0);
    expect(result[0].totalMinutes).toBeCloseTo(20);
  });

  it('computes totalMinutes from totalTime', () => {
    const plan = [makeDesc(1, 1, '5000m')];
    const sessions = { '1-1': makeRecord({ completed: true, pace: '2:00', totalTime: '20:00' }) };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result[0].totalMinutes).toBeCloseTo(20);
  });

  it('contributes 0 minutes when totalTime is empty', () => {
    const plan = [makeDesc(1, 1, '5000m')];
    const sessions = { '1-1': makeRecord({ completed: true, pace: '2:00' }) };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result[0].totalMeters).toBe(5000);
    expect(result[0].totalMinutes).toBe(0);
  });

  it('aggregates multiple sessions in the same week', () => {
    const plan = [makeDesc(1, 1, '5000m'), makeDesc(1, 2, '3000m')];
    const sessions = {
      '1-1': makeRecord({ completed: true, pace: '2:00', totalTime: '20:00' }),
      '1-2': makeRecord({ completed: true, pace: '1:50', totalTime: '11:00' }),
    };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result).toHaveLength(1);
    expect(result[0].totalMeters).toBe(8000);
    expect(result[0].totalMinutes).toBeCloseTo(31);
  });

  it('returns weeks sorted by weekNumber', () => {
    const plan = [makeDesc(3, 1, '5000m'), makeDesc(1, 1, '3000m')];
    const sessions = {
      '3-1': makeRecord({ completed: true, pace: '2:00', totalTime: '20:00' }),
      '1-1': makeRecord({ completed: true, pace: '1:50', totalTime: '11:00' }),
    };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result[0].weekNumber).toBe(1);
    expect(result[1].weekNumber).toBe(3);
  });

  it('handles 3-digit minute totalTime (e.g., 120:00)', () => {
    const plan = [makeDesc(1, 1, '5000m')];
    const sessions = { '1-1': makeRecord({ completed: true, pace: '2:00', totalTime: '120:00' }) };
    const result = computeWeeklyVolume(sessions, plan);
    expect(result[0].totalMinutes).toBeCloseTo(120);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/utils/__tests__/volumeCalc.test.ts`
Expected: FAIL — module `../volumeCalc` not found.

- [ ] **Step 5: Implement `volumeCalc.ts`**

Create `src/utils/volumeCalc.ts`:

```typescript
import type { SessionRecord } from './storage';
import type { SessionDescriptor } from '../data/trainingPlan';
import { parseDistance, parseTime } from './pacePredictor';
import { paceToSeconds } from './paceUtils';

export interface WeekVolume {
  weekNumber: number;
  totalMeters: number;
  totalMinutes: number;
}

export function computeWeeklyVolume(
  sessions: Record<string, SessionRecord>,
  plan: SessionDescriptor[]
): WeekVolume[] {
  const weekMap = new Map<number, { meters: number; minutes: number }>();

  for (const desc of plan) {
    const key = `${desc.weekNumber}-${desc.dayNumber}`;
    const record = sessions[key];
    if (!record?.completed) continue;

    const existing = weekMap.get(desc.weekNumber) ?? { meters: 0, minutes: 0 };

    // Distance: try parseDistance first, then pace×time fallback
    let meters = 0;
    const parsedDist = parseDistance(desc.label);
    if (parsedDist !== null) {
      meters = parsedDist;
    } else if (record.pace && record.totalTime) {
      const paceSeconds = paceToSeconds(record.pace);
      const totalTimeSec = parseTime(record.totalTime);
      if (paceSeconds && paceSeconds > 0 && totalTimeSec && totalTimeSec > 0) {
        meters = Math.round((totalTimeSec / paceSeconds) * 500);
      }
    }

    // Time: parse totalTime into minutes
    let minutes = 0;
    if (record.totalTime) {
      const totalTimeSec = parseTime(record.totalTime);
      if (totalTimeSec !== null && totalTimeSec > 0) {
        minutes = totalTimeSec / 60;
      }
    }

    existing.meters += meters;
    existing.minutes += minutes;
    weekMap.set(desc.weekNumber, existing);
  }

  return Array.from(weekMap.entries())
    .map(([weekNumber, { meters, minutes }]) => ({
      weekNumber,
      totalMeters: meters,
      totalMinutes: minutes,
    }))
    .sort((a, b) => a.weekNumber - b.weekNumber);
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/utils/__tests__/volumeCalc.test.ts`
Expected: All 10 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/utils/pacePredictor.ts src/utils/volumeCalc.ts src/utils/__tests__/volumeCalc.test.ts
git commit -m "feat: add volumeCalc utility and export parseTime"
```

---

### Task 2: Delete old comparison infrastructure

**Files:**
- Delete: `src/utils/workoutGrouping.ts`
- Delete: `src/utils/__tests__/workoutGrouping.test.ts`
- Delete: `src/components/comparison/ComparisonSparkline.tsx`
- Delete: `src/components/comparison/ComparisonTable.tsx`

- [ ] **Step 1: Verify no other files import the deleted modules**

Run grep for each:
- `grep -r "workoutGrouping" src/` — should only hit `ComparisonView.tsx` and the test
- `grep -r "ComparisonSparkline" src/` — should only hit `ComparisonView.tsx`
- `grep -r "ComparisonTable" src/` — should only hit `ComparisonView.tsx`

`ComparisonView.tsx` will be rewritten in Task 5, so these imports will disappear.

- [ ] **Step 2: Delete the four files**

```bash
rm src/utils/workoutGrouping.ts
rm src/utils/__tests__/workoutGrouping.test.ts
rm src/components/comparison/ComparisonSparkline.tsx
rm src/components/comparison/ComparisonTable.tsx
```

- [ ] **Step 3: Temporarily stub ComparisonView to avoid build errors**

Replace the entire contents of `src/components/views/ComparisonView.tsx` with a minimal stub:

```typescript
export default function ComparisonView() {
  return <div className="p-6 text-center text-gray-400 dark:text-[#5a6580]">Compare tab — rebuilding...</div>;
}
```

This removes the old imports. The full rewrite happens in Task 5.

- [ ] **Step 4: Run tests and build**

Run: `npx vitest run`
Expected: All tests pass (workoutGrouping tests are deleted, everything else unaffected).

Run: `npx tsc --noEmit`
Expected: Type errors in `App.tsx` because `ComparisonView` no longer accepts its current props. This is expected — we'll fix `App.tsx` in Task 4.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: delete old comparison infrastructure (workoutGrouping, sparkline, table)"
```

---

### Task 3: Create `VolumeChart` component

**Files:**
- Create: `src/components/comparison/VolumeChart.tsx`

- [ ] **Step 1: Create `VolumeChart.tsx`**

```typescript
import { useMemo } from 'react';

interface VolumeDataPoint {
  weekNumber: number;
  value: number;
}

interface VolumeChartProps {
  data: VolumeDataPoint[];
  color: string;           // Tailwind bg class, e.g. "bg-teal-500 dark:bg-[#00d2ff]"
  currentWeek: number;
  formatValue: (value: number) => string;
  label: string;           // e.g. "METERS" or "TIME"
}

export default function VolumeChart({ data, color, currentWeek, formatValue, label }: VolumeChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  if (data.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="flex flex-col gap-1.5">
        {data.map((d) => {
          const isCurrent = d.weekNumber === currentWeek;
          const widthPercent = Math.max((d.value / maxValue) * 100, 2); // min 2% for visibility
          return (
            <div key={d.weekNumber} className="flex items-center gap-2 h-7">
              <span
                className={`text-[10px] font-mono w-7 shrink-0 text-right ${
                  isCurrent
                    ? 'font-bold text-gray-700 dark:text-white'
                    : 'text-gray-400 dark:text-[#5a6580]'
                }`}
              >
                W{d.weekNumber}
              </span>
              <div className="flex-1 h-5 rounded-full bg-gray-100 dark:bg-[#1a2640] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${color} ${
                    isCurrent ? 'opacity-100' : 'opacity-70'
                  }`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              <span
                className={`text-[10px] font-mono w-16 shrink-0 text-right ${
                  isCurrent
                    ? 'font-bold text-gray-700 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {formatValue(d.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: May still have errors from `App.tsx` props mismatch (from Task 2 stub). The new file itself should compile cleanly.

- [ ] **Step 3: Commit**

```bash
git add src/components/comparison/VolumeChart.tsx
git commit -m "feat: add VolumeChart component with CSS horizontal bars"
```

---

### Task 4: Create `SessionComparison` component

**Files:**
- Create: `src/components/comparison/SessionComparison.tsx`

- [ ] **Step 1: Create `SessionComparison.tsx`**

```typescript
import type { SessionRecord } from '../../utils/storage';
import type { SessionDescriptor } from '../../data/trainingPlan';
import { parseDistance, parseTime } from '../../utils/pacePredictor';
import { paceToSeconds } from '../../utils/paceUtils';

interface SessionComparisonProps {
  leftSession: SessionRecord;
  rightSession: SessionRecord;
  leftDescriptor: SessionDescriptor;
  rightDescriptor: SessionDescriptor;
  onClear: () => void;
}

function deriveDistance(desc: SessionDescriptor, record: SessionRecord): number | null {
  const parsed = parseDistance(desc.label);
  if (parsed !== null) return parsed;
  if (record.pace && record.totalTime) {
    const paceSec = paceToSeconds(record.pace);
    const timeSec = parseTime(record.totalTime);
    if (paceSec && paceSec > 0 && timeSec && timeSec > 0) {
      return Math.round((timeSec / paceSec) * 500);
    }
  }
  return null;
}

function formatDistance(meters: number): string {
  return `${meters.toLocaleString('en')}m`;
}

type HighlightRule = 'lower' | 'higher' | 'none';

interface MetricRow {
  label: string;
  leftValue: string;
  rightValue: string;
  leftRaw: number | null;
  rightRaw: number | null;
  highlight: HighlightRule;
}

function buildMetrics(
  left: SessionRecord,
  right: SessionRecord,
  leftDesc: SessionDescriptor,
  rightDesc: SessionDescriptor
): MetricRow[] {
  const leftPace = left.pace ? paceToSeconds(left.pace) : null;
  const rightPace = right.pace ? paceToSeconds(right.pace) : null;
  const leftDist = deriveDistance(leftDesc, left);
  const rightDist = deriveDistance(rightDesc, right);

  return [
    {
      label: 'Pace /500m',
      leftValue: left.pace || '—',
      rightValue: right.pace || '—',
      leftRaw: leftPace,
      rightRaw: rightPace,
      highlight: 'lower',
    },
    {
      label: 'Total Time',
      leftValue: left.totalTime || '—',
      rightValue: right.totalTime || '—',
      leftRaw: left.totalTime ? parseTime(left.totalTime) : null,
      rightRaw: right.totalTime ? parseTime(right.totalTime) : null,
      highlight: 'none',
    },
    {
      label: 'Distance',
      leftValue: leftDist !== null ? formatDistance(leftDist) : '—',
      rightValue: rightDist !== null ? formatDistance(rightDist) : '—',
      leftRaw: leftDist,
      rightRaw: rightDist,
      highlight: 'higher',
    },
    {
      label: 'Stroke Rate',
      leftValue: left.strokeRate ? `${left.strokeRate} spm` : '—',
      rightValue: right.strokeRate ? `${right.strokeRate} spm` : '—',
      leftRaw: left.strokeRate ?? null,
      rightRaw: right.strokeRate ?? null,
      highlight: 'none',
    },
    {
      label: 'Power Level',
      leftValue: left.dragFactor ? `${left.dragFactor}` : '—',
      rightValue: right.dragFactor ? `${right.dragFactor}` : '—',
      leftRaw: left.dragFactor ?? null,
      rightRaw: right.dragFactor ?? null,
      highlight: 'none',
    },
    {
      label: 'RPE',
      leftValue: left.rpe ? `${left.rpe}` : '—',
      rightValue: right.rpe ? `${right.rpe}` : '—',
      leftRaw: left.rpe ?? null,
      rightRaw: right.rpe ?? null,
      highlight: 'none',
    },
  ];
}

function getHighlight(
  leftRaw: number | null,
  rightRaw: number | null,
  rule: HighlightRule
): { left: boolean; right: boolean } {
  if (rule === 'none' || leftRaw === null || rightRaw === null) return { left: false, right: false };
  if (leftRaw === rightRaw) return { left: false, right: false };
  if (rule === 'lower') return { left: leftRaw < rightRaw, right: rightRaw < leftRaw };
  return { left: leftRaw > rightRaw, right: rightRaw > leftRaw };
}

function sessionLabel(desc: SessionDescriptor): string {
  return `W${desc.weekNumber} D${desc.dayNumber} · ${desc.label}`;
}

export default function SessionComparison({
  leftSession,
  rightSession,
  leftDescriptor,
  rightDescriptor,
  onClear,
}: SessionComparisonProps) {
  const metrics = buildMetrics(leftSession, rightSession, leftDescriptor, rightDescriptor);

  return (
    <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-[#0f1b33] border border-gray-100 dark:border-white/[0.06]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex gap-4">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
              {sessionLabel(leftDescriptor)}
            </span>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
              {sessionLabel(rightDescriptor)}
            </span>
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 dark:text-[#5a6580] hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 touch-manipulation"
          aria-label="Clear comparison"
        >
          ✕ Clear
        </button>
      </div>

      {/* Metric rows */}
      <div className="flex flex-col gap-3">
        {metrics.map((row) => {
          const hl = getHighlight(row.leftRaw, row.rightRaw, row.highlight);
          return (
            <div key={row.label} className="flex items-center">
              <span
                className={`flex-1 text-sm font-mono text-right ${
                  hl.left
                    ? 'text-teal-600 dark:text-[#00d2ff] font-bold'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {row.leftValue}
              </span>
              <span className="w-24 text-center text-[10px] font-bold text-gray-400 dark:text-[#5a6580] uppercase tracking-wider shrink-0">
                {row.label}
              </span>
              <span
                className={`flex-1 text-sm font-mono ${
                  hl.right
                    ? 'text-teal-600 dark:text-[#00d2ff] font-bold'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {row.rightValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles for this file**

Run: `npx tsc --noEmit 2>&1 | grep SessionComparison` — should produce no output (no errors from this file).

- [ ] **Step 3: Commit**

```bash
git add src/components/comparison/SessionComparison.tsx
git commit -m "feat: add SessionComparison side-by-side comparison component"
```

---

### Task 5: Rewrite `ComparisonView`

**Files:**
- Rewrite: `src/components/views/ComparisonView.tsx`

- [ ] **Step 1: Rewrite `ComparisonView.tsx`**

```typescript
import { useMemo } from 'react';
import type { SessionRecord } from '../../utils/storage';
import type { SessionDescriptor } from '../../data/trainingPlan';
import { computeWeeklyVolume } from '../../utils/volumeCalc';
import VolumeChart from '../comparison/VolumeChart';
import SessionComparison from '../comparison/SessionComparison';

interface ComparisonViewProps {
  sessions: Record<string, SessionRecord>;
  plan: SessionDescriptor[];
  compareSlots: [string | null, string | null];
  onClearCompare: () => void;
  currentWeek: number;
}

function formatMeters(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toLocaleString('en', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
  }
  return `${value}m`;
}

function formatMinutes(value: number): string {
  return `${Math.round(value)} min`;
}

export default function ComparisonView({
  sessions,
  plan,
  compareSlots,
  onClearCompare,
  currentWeek,
}: ComparisonViewProps) {
  const weeklyVolume = useMemo(() => computeWeeklyVolume(sessions, plan), [sessions, plan]);

  const currentWeekVolume = useMemo(
    () => weeklyVolume.find((w) => w.weekNumber === currentWeek),
    [weeklyVolume, currentWeek]
  );

  const metersData = useMemo(
    () => weeklyVolume.map((w) => ({ weekNumber: w.weekNumber, value: w.totalMeters })),
    [weeklyVolume]
  );

  const timeData = useMemo(
    () => weeklyVolume.map((w) => ({ weekNumber: w.weekNumber, value: w.totalMinutes })),
    [weeklyVolume]
  );

  // Resolve pinned sessions for comparison
  const comparison = useMemo(() => {
    if (!compareSlots[0] || !compareSlots[1]) return null;
    const leftRecord = sessions[compareSlots[0]];
    const rightRecord = sessions[compareSlots[1]];
    if (!leftRecord?.completed || !rightRecord?.completed) return null;
    const leftDesc = plan.find((d) => `${d.weekNumber}-${d.dayNumber}` === compareSlots[0]);
    const rightDesc = plan.find((d) => `${d.weekNumber}-${d.dayNumber}` === compareSlots[1]);
    if (!leftDesc || !rightDesc) return null;
    return { leftRecord, rightRecord, leftDesc, rightDesc };
  }, [compareSlots, sessions, plan]);

  return (
    <div className="px-5 py-6">
      <h2 className="font-display text-2xl font-bold text-gray-800 dark:text-[#dae2fd] mb-1">
        Training Volume
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Weekly meters and time logged
      </p>

      {weeklyVolume.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#1a2640] flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-gray-400 dark:text-[#5a6580]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 15h18M9 3v18" />
            </svg>
          </div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            No volume data yet
          </p>
          <p className="text-xs text-gray-400 dark:text-[#5a6580] mt-1">
            Complete sessions to see training volume
          </p>
        </div>
      ) : (
        <>
          {/* Summary line */}
          {currentWeekVolume && (
            <div className="text-sm font-mono text-gray-600 dark:text-gray-300 mb-4">
              <span className="font-bold">W{currentWeek}:</span>{' '}
              {currentWeekVolume.totalMeters > 0 && (
                <span>{formatMeters(currentWeekVolume.totalMeters)}</span>
              )}
              {currentWeekVolume.totalMeters > 0 && currentWeekVolume.totalMinutes > 0 && (
                <span> · </span>
              )}
              {currentWeekVolume.totalMinutes > 0 && (
                <span>{formatMinutes(currentWeekVolume.totalMinutes)}</span>
              )}
            </div>
          )}

          <VolumeChart
            data={metersData}
            color="bg-teal-500 dark:bg-[#00d2ff]"
            currentWeek={currentWeek}
            formatValue={formatMeters}
            label="Meters"
          />
          <VolumeChart
            data={timeData}
            color="bg-amber-500 dark:bg-amber-400"
            currentWeek={currentWeek}
            formatValue={formatMinutes}
            label="Time"
          />
        </>
      )}

      {comparison && (
        <SessionComparison
          leftSession={comparison.leftRecord}
          rightSession={comparison.rightRecord}
          leftDescriptor={comparison.leftDesc}
          rightDescriptor={comparison.rightDesc}
          onClear={onClearCompare}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles for this file**

Run: `npx tsc --noEmit 2>&1 | grep ComparisonView`
Expected: Only errors from `App.tsx` where the old props are still being passed.

- [ ] **Step 3: Commit**

```bash
git add src/components/views/ComparisonView.tsx
git commit -m "feat: rewrite ComparisonView with volume charts and session comparison"
```

---

### Task 6: Add pin icon to `SessionCard`

**Files:**
- Modify: `src/components/SessionCard.tsx`

- [ ] **Step 1: Add `isPinned` and `onTogglePin` to `SessionCardProps`**

In `src/components/SessionCard.tsx`, add to the `SessionCardProps` interface (after `defaultDragFactor?: number`):

```typescript
  isPinned?: boolean;
  onTogglePin?: () => void;
```

And destructure them in the component function params alongside the other props.

- [ ] **Step 2: Add the pin icon button to the collapsed card header**

In the collapsed card's icon/chevron area (around line 242-277, the `<div className="flex items-center gap-1 shrink-0 mt-1">` section), add the pin button **before** the chevron, but **after** the timer icon and delete button. Only render it for completed sessions that have an `onTogglePin` handler:

```typescript
{record.completed && onTogglePin && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onTogglePin();
    }}
    className="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
    aria-label={isPinned ? 'Unpin from comparison' : 'Pin for comparison'}
    aria-pressed={isPinned}
  >
    <svg
      className={`w-4 h-4 transition-colors ${
        isPinned
          ? 'text-teal-500 dark:text-[#00d2ff]'
          : 'text-gray-400 dark:text-[#5a6580]'
      }`}
      viewBox="0 0 24 24"
      fill={isPinned ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="8" height="13" rx="1" />
      <rect x="14" y="8" width="8" height="13" rx="1" />
    </svg>
  </button>
)}
```

This uses two overlapping rectangles as the "compare" icon, matching the spec's "two overlapping squares" glyph.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: May still have `App.tsx` errors (props mismatch). `SessionCard.tsx` itself should be clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/SessionCard.tsx
git commit -m "feat: add pin-for-comparison icon to completed session cards"
```

---

### Task 7: Wire `compareSlots` through `WeekView`

**Files:**
- Modify: `src/components/WeekView.tsx`

- [ ] **Step 1: Add `compareSlots` and `onTogglePin` to `WeekViewProps`**

In the `WeekViewProps` interface, add:

```typescript
  compareSlots?: [string | null, string | null];
  onTogglePin?: (key: string) => void;
```

Both optional so existing usage without comparison features still compiles.

- [ ] **Step 2: Pass `isPinned` and `onTogglePin` to each SessionCard**

In the core sessions `map` (around line 68), add these props to each `<SessionCard>`:

```typescript
isPinned={compareSlots?.includes(`${session.weekNumber}-${session.dayNumber}`) ?? false}
onTogglePin={onTogglePin ? () => onTogglePin(`${session.weekNumber}-${session.dayNumber}`) : undefined}
```

Do the same in the optional sessions `map` (around line 88).

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Should be getting closer to clean. Only `App.tsx` errors remain.

- [ ] **Step 4: Commit**

```bash
git add src/components/WeekView.tsx
git commit -m "feat: thread compareSlots and onTogglePin through WeekView to SessionCard"
```

---

### Task 8: Wire everything in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add `compareSlots` state and handlers**

Near the other state declarations (around line 112-120), add:

```typescript
const [compareSlots, setCompareSlots] = useState<[string | null, string | null]>([null, null]);
```

Add the handler functions (near other handlers, around line 213):

```typescript
const handleTogglePin = useCallback(
  (key: string) => {
    setCompareSlots((prev) => {
      // If already pinned, unpin it (always takes priority)
      if (prev[0] === key) return [prev[1], null];
      if (prev[1] === key) return [prev[0], null];

      // Fill empty slot
      if (prev[0] === null) return [key, prev[1]];
      if (prev[1] === null) {
        // Second pin filled — auto-navigate to compare (1→2 transition only)
        setTimeout(() => setActiveView('compare'), 0);
        return [prev[0], key];
      }

      // Both full — replace oldest (slot 0). No auto-navigate:
      // user is likely already on Compare tab or browsing intentionally.
      return [key, prev[1]];
    });
  },
  []
);

const handleClearCompare = useCallback(() => {
  setCompareSlots([null, null]);
}, []);
```

Note: `setTimeout` wraps `setActiveView` to avoid batching issues when updating two state values in the same event handler. The `visitedViews` guard in `App.tsx` uses a `useEffect` that runs after render, so the first render after `setActiveView('compare')` may briefly show nothing before `visitedViews` includes `'compare'`. On the next render cycle the `CompareSkeleton` Suspense fallback will appear, then the lazy-loaded `ComparisonView` mounts. This produces at most a single-frame flash — acceptable and imperceptible in practice.

- [ ] **Step 2: Pass `compareSlots` and `onTogglePin` to `WeekView`**

Find the `<WeekView` JSX (search for `<WeekView`). Add these props:

```typescript
compareSlots={compareSlots}
onTogglePin={handleTogglePin}
```

- [ ] **Step 3: Update `ComparisonView` props**

Find the `<ComparisonView` JSX (around line 347). Replace the old props with the new interface:

```typescript
<ComparisonView
  sessions={data.sessions}
  plan={combinedPlan}
  compareSlots={compareSlots}
  onClearCompare={handleClearCompare}
  currentWeek={currentWeek}
/>
```

Remove the old `onGoToTraining` prop if present.

- [ ] **Step 4: Add the floating pin indicator**

After the existing `showDfPrompt` toast JSX (around line 403), and before the `Onboarding` section, add:

```typescript
{compareSlots[0] !== null && compareSlots[1] === null && (
  <div
    role="status"
    aria-live="polite"
    className="fixed left-4 right-4 z-40"
    style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
  >
    <div className="max-w-md mx-auto bg-white dark:bg-[#1a2640] rounded-2xl px-4 py-3 shadow-lg border border-gray-200 dark:border-white/[0.06] flex items-center justify-between">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        1 selected — tap another to compare
      </p>
      <button
        onClick={() => setCompareSlots([null, null])}
        className="text-gray-400 dark:text-[#5a6580] hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
        aria-label="Cancel comparison"
      >
        ✕
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 5: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean — no errors.

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All tests pass. The old workoutGrouping tests are deleted, new volumeCalc tests run.

- [ ] **Step 7: Run production build**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire compareSlots state, pin handlers, and floating indicator in App"
```

---

### Task 9: Visual verification

**Files:** None (verification only)

- [ ] **Step 1: Start dev server and open the app**

Run: `npx vite dev` (or use existing dev server)

- [ ] **Step 2: Verify the Compare tab shows volume empty state**

Navigate to Compare tab. Should see "Training Volume" heading, "No volume data yet" empty state. No old comparison UI should remain.

- [ ] **Step 3: Complete a session and verify volume appears**

Go to Session tab, expand a card, enter pace (e.g., `2:05`), total time (`20:50`), save. Navigate to Compare tab. Should see:
- Summary line: `W1: 5.0k · 21 min` (or similar)
- Meters bar chart with one row (W1)
- Time bar chart with one row (W1)

- [ ] **Step 4: Test the pin-to-compare flow**

On the Session tab, find the completed session. Tap the compare icon (two overlapping rectangles). Verify:
- Icon turns teal
- Floating indicator appears: "1 selected — tap another to compare"

Complete a second session. Tap its compare icon. Verify:
- Auto-navigates to Compare tab
- SessionComparison panel appears below volume charts with both sessions' metrics side by side
- Pace highlighting works (lower pace gets teal accent)
- Clear button works (comparison disappears, volume remains)

- [ ] **Step 5: Test pin/unpin edge cases**

- Tap a pinned card's icon → should unpin (icon goes gray)
- With 2 pinned, tap a third unpinned → should replace slot 0
- Dismiss floating indicator via ✕ → should unpin and indicator disappears

- [ ] **Step 6: Commit any fixes**

If any visual issues were found and fixed, commit them.

---
