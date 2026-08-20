let audioContext: AudioContext | null = null;
let drumrollStops: Array<() => void> = [];

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
  type: OscillatorType = "triangle",
) {
  const oscillator = ctx.createOscillator();
  const amp = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(amp);
  amp.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function snare(ctx: AudioContext, start: number, duration: number, gain: number) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1800, start);
  filter.Q.setValueAtTime(0.9, start);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  source.start(start);
  source.stop(start + duration);

  drumrollStops.push(() => {
    try {
      source.stop();
    } catch {
      /* already stopped */
    }
    amp.gain.cancelScheduledValues(ctx.currentTime);
    amp.gain.setValueAtTime(0.0001, ctx.currentTime);
  });
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

export async function playWrongSfx() {
  const ctx = getContext();
  if (!ctx) return;
  await ctx.resume();
  const now = ctx.currentTime;
  tone(ctx, 247, now, 0.16, 0.1, "square");
  tone(ctx, 185, now + 0.12, 0.28, 0.12, "square");
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

export const DRUMROLL_MS = 2600;

export function stopDrumrollSfx() {
  for (const stop of drumrollStops) stop();
  drumrollStops = [];
}

export async function playDrumrollSfx() {
  const ctx = getContext();
  if (!ctx) return;
  await ctx.resume();
  stopDrumrollSfx();
  const now = ctx.currentTime;

  let t = 0;
  let interval = 0.15;
  while (t < 2.15) {
    snare(ctx, now + t, 0.07, 0.055 + t * 0.028);
    t += interval;
    interval = Math.max(0.042, interval * 0.91);
  }

  snare(ctx, now + t, 0.55, 0.18);
  tone(ctx, 392, now + t, 0.28, 0.08);
  tone(ctx, 523.25, now + t + 0.04, 0.4, 0.1);
  tone(ctx, 783.99, now + t + 0.08, 0.45, 0.09);
}
