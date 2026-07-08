import { useEffect, useRef } from "react";
import { initAudio, playBlip, playGlitch } from "~/lib/audio-engine";
import { loadSvgHalftone, type HalftonePoint } from "~/lib/svg-points";

const FALLBACK_DRAWINGS = ["/bg-svg/2360761.svg", "/bg-svg/1299497.svg"];

const MAX_POINTS = 2200;
const INK = "#14140f";
const ACCENT_RGB = "122, 138, 96"; // muted retro green, matches --color-accent
const DOT_MIN = 0.6;
const DOT_MAX = 4.2;
const FIT_PAD = 0.97; // fill ~100% of the available area, centered
const HOLD_MS = 5200;
const TRANSITION_MS = 3400;
const REPEL_RADIUS = 110;
const REPEL_STRENGTH = 46;
const SPRING_K = 0.085;
const DAMPING = 0.82;
const BURST_STRENGTH = 260;
const BURST_RADIUS = 420;

type Shape = {
  points: HalftonePoint[]; // resampled to a common length N, index-aligned
  vbWidth: number;
  vbHeight: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  seed: number;
};

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(v: number) {
  const c = clamp01(v);
  return c * c * (3 - 2 * c);
}

function hash(i: number) {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

/** Resample a point cloud to exactly `n` entries (deterministic, proportional). */
function resampleToN(points: HalftonePoint[], n: number): HalftonePoint[] {
  if (points.length === 0 || n === 0) return [];
  const out: HalftonePoint[] = new Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = points[Math.floor((i / n) * points.length) % points.length];
  }
  return out;
}

/** Project a normalized (0..1 within its own viewBox) point to canvas pixels, "contain" fit. */
function project(
  nx: number,
  ny: number,
  vbW: number,
  vbH: number,
  cw: number,
  ch: number
) {
  const scale = Math.min(cw / vbW, ch / vbH) * FIT_PAD;
  const drawW = vbW * scale;
  const drawH = vbH * scale;
  const offX = (cw - drawW) / 2;
  const offY = (ch - drawH) / 2;
  return { x: offX + nx * drawW, y: offY + ny * drawH };
}

// Preferred opening shape (the "Pike"-style fish) — everything else from the
// folder still shows up, just cycled in after this one.
const PREFERRED_FIRST = "2360761.svg";

function prioritize(files: string[]): string[] {
  const idx = files.findIndex((f) => f.endsWith(PREFERRED_FIRST));
  if (idx <= 0) return files;
  const copy = files.slice();
  const [preferred] = copy.splice(idx, 1);
  copy.unshift(preferred);
  return copy;
}

async function fetchDrawingList(): Promise<string[]> {
  try {
    const res = await fetch("/api/bg-svg");
    if (!res.ok) return FALLBACK_DRAWINGS;
    const data = (await res.json()) as { files?: string[] };
    const files = data.files && data.files.length > 0 ? data.files : FALLBACK_DRAWINGS;
    return prioritize(files);
  } catch {
    return FALLBACK_DRAWINGS;
  }
}

export type ParticleDrawingProps = {
  className?: string;
  soundEnabled: boolean;
  /** When false the drawing is frozen on its first static pose. */
  active?: boolean;
  onPulse?: () => void;
};

export function ParticleDrawing({
  className,
  soundEnabled,
  active = true,
  onPulse,
}: ParticleDrawingProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    let disposed = false;
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles: Particle[] = [];
    let shapes: Shape[] = [];
    let ready = false;
    let raf = 0;
    let startTime = performance.now();
    let wasActive = activeRef.current;
    let wasTransitioning = false;

    const pointer = { x: 0, y: 0, active: false };
    type Burst = { x: number; y: number; born: number };
    const bursts: Burst[] = [];

    function resize() {
      if (!canvas || !parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx2d?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function toLocal(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function onPointerMove(e: PointerEvent) {
      if (!activeRef.current) return;
      const p = toLocal(e.clientX, e.clientY);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = true;
    }

    function onPointerLeave() {
      pointer.active = false;
    }

    function onPointerDown(e: PointerEvent) {
      const p = toLocal(e.clientX, e.clientY);
      if (activeRef.current) {
        bursts.push({ x: p.x, y: p.y, born: performance.now() });
        if (bursts.length > 4) bursts.shift();
      }
      void initAudio();
      if (soundRef.current) {
        const freq = 180 + (1 - clamp01(p.y / Math.max(height, 1))) * 520;
        playBlip(freq, { type: "square", duration: 0.22 });
      }
      onPulse?.();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointerdown", onPointerDown);

    fetchDrawingList()
      .then((urls) => Promise.all(urls.map((url) => loadSvgHalftone(url))))
      .then((loaded) => {
        if (disposed) return;
        const valid = loaded.filter((s) => s.points.length > 0);
        if (valid.length === 0) return;

        const n = Math.min(Math.max(...valid.map((s) => s.points.length)), MAX_POINTS);
        shapes = valid.map((s) => ({
          points: resampleToN(s.points, n),
          vbWidth: s.vbWidth,
          vbHeight: s.vbHeight,
        }));

        particles = Array.from({ length: n }, (_, i) => ({
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          seed: hash(i),
        }));

        const home = shapes[0];
        for (let i = 0; i < particles.length; i++) {
          const pt = home.points[i];
          const proj = project(
            pt.nx,
            pt.ny,
            home.vbWidth,
            home.vbHeight,
            width || parent.clientWidth,
            height || parent.clientHeight
          );
          particles[i].x = proj.x;
          particles[i].y = proj.y;
        }
        ready = true;
      })
      .catch(() => {
        ready = false;
      });

    function frame(now: number) {
      const isActive = activeRef.current;
      if (isActive && !wasActive) {
        // Kick straight into the transition to the next drawing on boot,
        // instead of waiting through a full hold period first.
        startTime = now - HOLD_MS;
      }
      wasActive = isActive;

      ctx2d!.clearRect(0, 0, width, height);

      if (!ready || particles.length === 0 || shapes.length === 0) {
        raf = requestAnimationFrame(frame);
        return;
      }

      const t = (now - startTime) / 1000;
      const count = shapes.length;

      let currentIndex = 0;
      let nextIndex = 0;
      let morphT = 0;
      let isTransitioning = false;
      if (isActive && count > 1) {
        const cycleMs = HOLD_MS + TRANSITION_MS;
        const elapsed = now - startTime;
        const pos = elapsed % (cycleMs * count);
        currentIndex = Math.floor(pos / cycleMs) % count;
        nextIndex = (currentIndex + 1) % count;
        const within = pos % cycleMs;
        isTransitioning = within > HOLD_MS;
        morphT = isTransitioning ? smoothstep((within - HOLD_MS) / TRANSITION_MS) : 0;
      }

      if (isTransitioning && !wasTransitioning) {
        void initAudio();
        if (soundRef.current) playGlitch();
      }
      wasTransitioning = isTransitioning;

      const shapeA = shapes[currentIndex];
      const shapeB = shapes[nextIndex];

      const liveBursts = isActive
        ? bursts.filter((b) => now - b.born < 1100)
        : [];
      bursts.length = 0;
      bursts.push(...liveBursts);

      const pointerActive = isActive && pointer.active;

      ctx2d!.fillStyle = INK;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const ptA = shapeA.points[i];
        const homeA = project(ptA.nx, ptA.ny, shapeA.vbWidth, shapeA.vbHeight, width, height);

        let targetX: number;
        let targetY: number;
        let coverage: number;

        if (isActive) {
          const ptB = shapeB.points[i];
          const homeB = project(ptB.nx, ptB.ny, shapeB.vbWidth, shapeB.vbHeight, width, height);
          const bx = homeA.x + (homeB.x - homeA.x) * morphT;
          const by = homeA.y + (homeB.y - homeA.y) * morphT;
          coverage = ptA.coverage + (ptB.coverage - ptA.coverage) * morphT;
          const wobble = 1.8;
          const jx = Math.sin(t * 0.9 + p.seed * 18.8) * wobble;
          const jy = Math.cos(t * 1.1 + p.seed * 13.3) * wobble;
          targetX = bx + jx;
          targetY = by + jy;
        } else {
          targetX = homeA.x;
          targetY = homeA.y;
          coverage = ptA.coverage;
        }

        let fx = (targetX - p.x) * SPRING_K;
        let fy = (targetY - p.y) * SPRING_K;

        if (pointerActive) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < REPEL_RADIUS) {
            const push = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
            fx += (dx / dist) * push * 0.06;
            fy += (dy / dist) * push * 0.06;
          }
        }

        for (const b of liveBursts) {
          const dx = p.x - b.x;
          const dy = p.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < BURST_RADIUS) {
            const age = (now - b.born) / 1000;
            const decay = Math.max(0, 1 - age / 1.1);
            const push = (1 - dist / BURST_RADIUS) * BURST_STRENGTH * decay * decay;
            fx += (dx / dist) * push * 0.06;
            fy += (dy / dist) * push * 0.06;
          }
        }

        if (isActive) {
          p.vx = (p.vx + fx) * DAMPING;
          p.vy = (p.vy + fy) * DAMPING;
          p.x += p.vx;
          p.y += p.vy;
        } else {
          p.vx = 0;
          p.vy = 0;
          p.x = targetX;
          p.y = targetY;
        }

        const size = DOT_MIN + (DOT_MAX - DOT_MIN) * Math.pow(clamp01(coverage), 0.85);
        if (size < 0.35) continue;
        ctx2d!.globalAlpha = isActive ? 0.82 + 0.18 * p.seed : 0.94;
        ctx2d!.beginPath();
        ctx2d!.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
        ctx2d!.fill();
      }

      if (pointerActive) {
        for (const p of particles) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 128) {
            const alpha = (1 - dist / 128) * 0.28;
            ctx2d!.strokeStyle = `rgba(${ACCENT_RGB}, ${alpha})`;
            ctx2d!.lineWidth = 0.6;
            ctx2d!.beginPath();
            ctx2d!.moveTo(p.x, p.y);
            ctx2d!.lineTo(pointer.x, pointer.y);
            ctx2d!.stroke();
          }
        }
      }

      ctx2d!.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onPulse]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ touchAction: "none", cursor: active ? "crosshair" : "default" }}
      aria-label="Desenho interativo construído com pontos — clique ou passe o mouse para interagir"
      role="img"
    />
  );
}
