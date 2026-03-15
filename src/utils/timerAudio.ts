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

export function vibrate() {
  try {
    navigator.vibrate?.([200, 100, 200, 100, 400]);
  } catch {
    // Vibration not supported
  }
}
