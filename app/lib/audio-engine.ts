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
