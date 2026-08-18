let audioContext: AudioContext | null = null;

function getContext() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  return audioContext;
}

function tone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  gain = 0.12,
) {
  const oscillator = ctx.createOscillator();
  const amp = ctx.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(amp);
  amp.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export async function playCorrectSfx(combo = 1) {
  const ctx = getContext();
  if (!ctx) return;
  await ctx.resume();
  const now = ctx.currentTime;
  const extra = Math.min(combo - 1, 3) * 80;
  tone(ctx, 880 + extra, now, 0.12, 0.1);
  tone(ctx, 1174 + extra, now + 0.08, 0.16, 0.12);
  if (combo >= 2) {
    tone(ctx, 1568 + extra, now + 0.16, 0.2, 0.1);
  }
}

export async function playResultSfx() {
  const ctx = getContext();
  if (!ctx) return;
  await ctx.resume();
  const now = ctx.currentTime;
  tone(ctx, 523.25, now, 0.16, 0.1);
  tone(ctx, 659.25, now + 0.12, 0.16, 0.1);
  tone(ctx, 783.99, now + 0.24, 0.18, 0.11);
  tone(ctx, 1046.5, now + 0.38, 0.32, 0.13);
}
