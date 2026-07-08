// Minimal Web Audio engine for retro UI feedback sounds.
// No external dependency: everything is synthesized with oscillators.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let droneNodes: {
  oscA: OscillatorNode;
  oscB: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  lfo: OscillatorNode;
} | null = null;
let muted = false;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function isReady() {
  return ctx !== null;
}

export async function initAudio() {
  const c = getCtx();
  if (c.state === "suspended") await c.resume();
  return c;
}

export function setMuted(next: boolean) {
  muted = next;
  if (master) {
    master.gain.setTargetAtTime(muted ? 0 : 0.55, getCtx().currentTime, 0.08);
  }
}

export function getMuted() {
  return muted;
}

/** Short percussive blip, pitch in Hz. Used for clicks / hits. */
export function playBlip(freq = 440, opts: { duration?: number; type?: OscillatorType } = {}) {
  const c = getCtx();
  if (!master) return;
  const { duration = 0.18, type = "square" } = opts;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(
    Math.max(40, freq * 0.55),
    c.currentTime + duration
  );

  filter.type = "lowpass";
  filter.frequency.value = 3200;

  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  osc.start();
  osc.stop(c.currentTime + duration + 0.02);
}

function makeDistortionCurve(amount: number) {
  const n = 4096;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

/** Short distorted glitch/sweep — signals the drawing is about to morph. */
export function playGlitch() {
  const c = getCtx();
  if (!master) return;
  const duration = 0.48;
  const osc = c.createOscillator();
  const osc2 = c.createOscillator();
  const shaper = c.createWaveShaper();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();

  osc.type = "sawtooth";
  osc2.type = "square";
  osc.frequency.setValueAtTime(260, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(55, c.currentTime + duration);
  osc2.frequency.setValueAtTime(150, c.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(42, c.currentTime + duration);

  shaper.curve = makeDistortionCurve(70);
  shaper.oversample = "4x";

  filter.type = "bandpass";
  filter.Q.value = 1.3;
  filter.frequency.setValueAtTime(1400, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(200, c.currentTime + duration);

  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.38, c.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);

  osc.connect(shaper);
  osc2.connect(shaper);
  shaper.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  osc.start();
  osc2.start();
  const stopAt = c.currentTime + duration + 0.03;
  osc.stop(stopAt);
  osc2.stop(stopAt);
}

/** Soft, quiet transient for hover/scan ticks. */
export function playTick(freq = 900) {
  const c = getCtx();
  if (!master) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.06, c.currentTime + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.07);
  osc.connect(gain);
  gain.connect(master);
  osc.start();
  osc.stop(c.currentTime + 0.08);
}

/** Toggle a very quiet evolving ambient drone. */
export function setDroneActive(active: boolean) {
  const c = getCtx();
  if (!master) return;

  if (active && !droneNodes) {
    const oscA = c.createOscillator();
    const oscB = c.createOscillator();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();

    oscA.type = "sine";
    oscB.type = "triangle";
    oscA.frequency.value = 55;
    oscB.frequency.value = 55.6;

    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.6;

    lfo.frequency.value = 0.06;
    lfoGain.gain.value = 160;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    gain.gain.setValueAtTime(0.0001, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.09, c.currentTime + 1.4);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    oscA.start();
    oscB.start();
    lfo.start();

    droneNodes = { oscA, oscB, filter, gain, lfo };
  } else if (!active && droneNodes) {
    const { oscA, oscB, lfo, gain } = droneNodes;
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.6);
    const stopAt = c.currentTime + 0.65;
    oscA.stop(stopAt);
    oscB.stop(stopAt);
    lfo.stop(stopAt);
    droneNodes = null;
  }
}
