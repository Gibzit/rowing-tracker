let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function beep(frequency: number, duration: number, startTime: number) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = frequency;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.3, startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playTimerFinished() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    beep(880, 0.15, now);
    beep(880, 0.15, now + 0.25);
    beep(1100, 0.3, now + 0.5);
  } catch {
    // Web Audio not supported
  }
}

export function vibrate(pattern?: number[]) {
  try {
    navigator.vibrate?.(pattern ?? [200, 100, 200, 100, 400]);
  } catch {
    // Vibration not supported
  }
}

/** Descending tone: signals rest phase has begun */
export function playRestStart() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    beep(660, 0.15, now);
    beep(660, 0.15, now + 0.2);
    beep(440, 0.25, now + 0.45);
  } catch {
    // Web Audio not supported
  }
}

/** Single short beep for 3-2-1 countdown */
export function playCountdownBeep() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    beep(880, 0.08, now);
  } catch {
    // Web Audio not supported
  }
}

/** Ascending fanfare: signals rest is over, time to row */
export function playWorkStart() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    beep(660, 0.15, now);
    beep(880, 0.15, now + 0.2);
    beep(1100, 0.2, now + 0.45);
  } catch {
    // Web Audio not supported
  }
}
