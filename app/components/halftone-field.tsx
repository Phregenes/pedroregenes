import { useEffect, useRef } from "react";
import { initAudio, playBlip } from "~/lib/audio-engine";

const SPACING = 22;
const MAX_DOT = 8.6;
const SOFT_EDGE = 150;

type Pulse = { x: number; y: number; born: number };

function hash(ix: number, iy: number) {
  const s = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(v: number) {
  const c = clamp01(v);
  return c * c * (3 - 2 * c);
}

export type HalftoneFieldProps = {
  className?: string;
  soundEnabled: boolean;
  onPulse?: () => void;
};

export function HalftoneField({
  className,
  soundEnabled,
  onPulse,
}: HalftoneFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const pointer = { x: 0, y: 0, active: false };
    const look = { x: 0, y: 0 };
    const pulses: Pulse[] = [];
    let raf = 0;
    let startTime = performance.now();

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
      look.x = width / 2;
      look.y = height / 2;
      pointer.x = width / 2;
      pointer.y = height / 2;
    }

    function toLocal(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function onPointerMove(e: PointerEvent) {
      const p = toLocal(e.clientX, e.clientY);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = true;
    }

    function onPointerLeave() {
      pointer.active = false;
    }

    function spawnPulse(clientX: number, clientY: number) {
      const p = toLocal(clientX, clientY);
      pulses.push({ x: p.x, y: p.y, born: performance.now() });
      if (pulses.length > 6) pulses.shift();

      void initAudio();
      if (soundRef.current) {
        const freq = 180 + (1 - clamp01(p.y / Math.max(height, 1))) * 520;
        playBlip(freq, { type: "square", duration: 0.22 });
      }
      onPulse?.();
    }

    function onPointerDown(e: PointerEvent) {
      spawnPulse(e.clientX, e.clientY);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointerdown", onPointerDown);

    function frame(now: number) {
      const t = (now - startTime) / 1000;

      const cx = width / 2;
      const cy = height / 2;
      const pull = 0.32;
      const targetX = cx + (pointer.active ? (pointer.x - cx) * pull : 0);
      const targetY = cy + (pointer.active ? (pointer.y - cy) * pull : 0);
      look.x += (targetX - look.x) * 0.045;
      look.y += (targetY - look.y) * 0.045;

      ctx2d!.clearRect(0, 0, width, height);
      ctx2d!.fillStyle = "#14140f";

      const baseRadius = Math.min(width, height) * 0.3;
      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;

      const activePulses = pulses.filter((p) => now - p.born < 1400);
      pulses.length = 0;
      pulses.push(...activePulses);

      for (let iy = 0; iy < rows; iy++) {
        for (let ix = 0; ix < cols; ix++) {
          const x = ix * SPACING;
          const y = iy * SPACING;
          const dx = x - look.x;
          const dy = y - look.y;
          const angle = Math.atan2(dy, dx);
          const dist = Math.sqrt(dx * dx + dy * dy);

          const boundary =
            baseRadius *
            (1 +
              0.2 * Math.sin(angle * 3 + t * 0.6) +
              0.12 * Math.sin(angle * 5 - t * 0.9) +
              0.08 * Math.cos(angle * 2 + t * 0.35));

          const edge = boundary - dist;
          let amt = smoothstep((edge + SOFT_EDGE) / (SOFT_EDGE * 2));

          for (const p of activePulses) {
            const age = (now - p.born) / 1000;
            const ringR = age * 340;
            const pdx = x - p.x;
            const pdy = y - p.y;
            const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
            const band = 46;
            const ringDist = Math.abs(pDist - ringR);
            if (ringDist < band) {
              const fade = clamp01(1 - age / 1.4);
              const bump = (1 - ringDist / band) * fade * 0.9;
              amt = clamp01(amt + bump);
            }
          }

          if (amt <= 0.02) continue;

          const n = hash(ix, iy);
          const size = MAX_DOT * amt * (0.5 + 0.5 * n);
          if (size < 0.4) continue;

          ctx2d!.globalAlpha = 0.82 + 0.18 * n;
          ctx2d!.beginPath();
          ctx2d!.arc(x, y, size / 2, 0, Math.PI * 2);
          ctx2d!.fill();
        }
      }
      ctx2d!.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return () => {
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
      style={{ touchAction: "none", cursor: "crosshair" }}
      aria-label="Campo interativo de partículas — clique ou arraste para interagir"
      role="img"
    />
  );
}
