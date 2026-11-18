// A slowly swaying spider web, drawn on a canvas behind the whole site.
// It reacts to the mouse (or a finger): the strands near the pointer are pushed away and fade out.
// It only draws lines, so the page color behind it shows through. Phones get a web with fewer lines,
// and people who ask their device for less motion get a still picture.
import { useEffect, useRef } from "react";

// How many spokes and rings the web has, on a normal screen and on a small one.
const N_RADIALS = 24;
const N_RINGS = 14;
const SMALL_SCREEN_WIDTH = 640;
const SMALL_RADIALS = 16;
const SMALL_RINGS = 9;

// How strong the web looks, from 0 (invisible) to 1. Lowered a little so text on top stays easy to read.
const INTENSITY = 0.7;

// The gentle swaying of the points of the web.
const SWAY_AMP = 3.5;
const SWAY_SPD = 0.00045;

// The slow bowing of each strand.
const BOW_AMP = 6;
const BOW_SPD = 0.55;

// How the points are pushed away by the pointer and spring back.
const NODE_PUSH_R = 90;
const NODE_PUSH_STR = 3.2;
const SPRING_K = 0.07;
const SPRING_DAMP = 0.84;

// How far the pointer bends the strands near it.
const PUSH_RADIUS = 280;
const PUSH_MAX = 18;

// A point where strands meet. It has a resting place (bx, by), a sway phase, and an offset (sx, sy)
// from being pushed, with its speed (svx, svy).
interface WebNode {
  bx: number;
  by: number;
  phase: number;
  sx: number;
  sy: number;
  svx: number;
  svy: number;
}

// A line between two points: a spoke (radial) or a piece of a ring.
interface Strand {
  a: number;
  b: number;
  kind: "radial" | "ring";
  ring: number;
  bowPhase: number;
  bowPerpX: number;
  bowPerpY: number;
}

interface Web {
  nodes: WebNode[];
  strands: Strand[];
  rings: number;
}

// Builds the web for a screen of this size: a center point, rings of points around it, and the strands between them.
function buildWeb(W: number, H: number, nRadials: number, nRings: number): Web {
  const cx = W / 2;
  const cy = H / 2;
  const maxR = Math.sqrt(W * W + H * H) * 0.56;

  const nodes: WebNode[] = [];
  nodes.push({ bx: cx, by: cy, phase: 0, sx: 0, sy: 0, svx: 0, svy: 0 });

  for (let r = 1; r <= nRings; r++) {
    const baseR = maxR * (r / nRings);
    for (let s = 0; s < nRadials; s++) {
      const angle = s * ((2 * Math.PI) / nRadials) - Math.PI / 2;
      const jitter = 1 + (Math.random() - 0.5) * 0.18;
      nodes.push({
        bx: cx + Math.cos(angle) * baseR * jitter,
        by: cy + Math.sin(angle) * baseR * jitter,
        phase: Math.random() * Math.PI * 2,
        sx: 0,
        sy: 0,
        svx: 0,
        svy: 0,
      });
    }
  }

  const strands: Strand[] = [];

  function addStrand(a: number, b: number, kind: "radial" | "ring", ring: number) {
    const na = nodes[a];
    const nb = nodes[b];
    const dx = nb.bx - na.bx;
    const dy = nb.by - na.by;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    strands.push({ a, b, kind, ring, bowPhase: (na.phase + nb.phase) / 2, bowPerpX: -dy / len, bowPerpY: dx / len });
  }

  // The spokes, from the center out.
  for (let s = 0; s < nRadials; s++) {
    addStrand(0, 1 + s, "radial", 1);
    for (let r = 1; r < nRings; r++) {
      addStrand(1 + (r - 1) * nRadials + s, 1 + r * nRadials + s, "radial", r + 1);
    }
  }

  // The rings, going around.
  for (let r = 1; r <= nRings; r++) {
    for (let s = 0; s < nRadials; s++) {
      addStrand(1 + (r - 1) * nRadials + s, 1 + (r - 1) * nRadials + ((s + 1) % nRadials), "ring", r);
    }
  }

  return { nodes, strands, rings: nRings };
}

export default function WebBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let alive = true;
    let time = 0;
    let frame = 0;
    let W = 0;
    let H = 0;
    let small = false;
    let web: Web | null = null;
    let mouse: { x: number; y: number } | null = null;

    // Sizes the canvas to the screen. The web is only rebuilt when the screen really changed
    // (not when a phone's address bar slides in and out), so it does not jump around.
    function resize() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const nowSmall = w < SMALL_SCREEN_WIDTH;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const changed = !web || Math.abs(w - W) > 1 || Math.abs(h - H) > 150 || nowSmall !== small;
      W = w;
      H = h;
      small = nowSmall;
      if (changed) {
        web = buildWeb(w, h, nowSmall ? SMALL_RADIALS : N_RADIALS, nowSmall ? SMALL_RINGS : N_RINGS);
      }
      if (reduceMotion) draw();
    }

    // Draws one picture of the web at the current time, and moves the points that the pointer pushed.
    function draw() {
      if (!ctx || !web) return;

      for (const n of web.nodes) {
        const swayX = n.bx + Math.sin(time * 1.1 + n.phase) * SWAY_AMP;
        const swayY = n.by + Math.cos(time * 0.9 + n.phase * 1.4) * SWAY_AMP;

        if (mouse) {
          const dx = swayX + n.sx - mouse.x;
          const dy = swayY + n.sy - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < NODE_PUSH_R && dist > 0.1) {
            const force = (1 - dist / NODE_PUSH_R) * NODE_PUSH_STR;
            n.svx += (dx / dist) * force;
            n.svy += (dy / dist) * force;
          }
        }

        n.svx += -n.sx * SPRING_K;
        n.svy += -n.sy * SPRING_K;
        n.svx *= SPRING_DAMP;
        n.svy *= SPRING_DAMP;
        n.sx += n.svx;
        n.sy += n.svy;
      }

      const pos = web.nodes.map((n) => ({
        x: n.bx + Math.sin(time * 1.1 + n.phase) * SWAY_AMP + n.sx,
        y: n.by + Math.cos(time * 0.9 + n.phase * 1.4) * SWAY_AMP + n.sy,
      }));

      // Only the lines are drawn: the page color behind the canvas shows through.
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (const s of web.strands) {
        const pa = pos[s.a];
        const pb = pos[s.b];
        const mx = (pa.x + pb.x) / 2;
        const my = (pa.y + pb.y) / 2;

        const bow = BOW_AMP * Math.sin(time * BOW_SPD * 60 + s.bowPhase);
        let cpx = mx + s.bowPerpX * bow;
        let cpy = my + s.bowPerpY * bow;

        const depthFade = 1 - (s.ring - 1) / (web.rings + 2);
        let alpha = (s.kind === "radial" ? 0.42 : 0.2) * depthFade * INTENSITY;

        if (mouse) {
          const cdx = mouse.x - mx;
          const cdy = mouse.y - my;
          const cdist2 = cdx * cdx + cdy * cdy;
          const cdist = Math.sqrt(cdist2);
          const bend = PUSH_MAX * Math.exp(-cdist2 / (PUSH_RADIUS * PUSH_RADIUS));
          if (cdist > 0.1) {
            cpx -= (cdx / cdist) * bend;
            cpy -= (cdy / cdist) * bend;
          }
          // The strands fade out around the pointer.
          const proximity = Math.exp(-cdist2 / (PUSH_RADIUS * PUSH_RADIUS * 0.35));
          alpha *= 1 - proximity * 0.82;
        }

        ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.lineWidth = s.kind === "radial" ? 0.75 : 0.5;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.quadraticCurveTo(cpx, cpy, pb.x, pb.y);
        ctx.stroke();
      }

      for (let i = 0; i < pos.length; i++) {
        const p = pos[i];
        let alpha = (i === 0 ? 0.45 : 0.16) * INTENSITY;
        if (mouse) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          alpha *= 1 - Math.exp(-(dx * dx + dy * dy) / (160 * 160)) * 0.82;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, i === 0 ? 1.8 : 1.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.fill();
      }
    }

    // The animation: draw, move time forward, and ask the browser for the next frame.
    function tick() {
      if (!alive) return;
      frame = requestAnimationFrame(tick);
      time += SWAY_SPD;
      draw();
    }

    function onMove(e: MouseEvent) {
      mouse = { x: e.clientX, y: e.clientY };
    }
    function onLeave() {
      mouse = null;
    }
    function onTouch(e: TouchEvent) {
      const t = e.touches[0];
      if (t) mouse = { x: t.clientX, y: t.clientY };
    }

    resize();
    window.addEventListener("resize", resize);
    if (!reduceMotion) {
      frame = requestAnimationFrame(tick);
      window.addEventListener("mousemove", onMove);
      document.addEventListener("mouseleave", onLeave);
      window.addEventListener("touchstart", onTouch, { passive: true });
      window.addEventListener("touchmove", onTouch, { passive: true });
      window.addEventListener("touchend", onLeave);
    }

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onLeave);
    };
  }, []);

  // Fixed to the screen, behind everything, and it never gets in the way of clicks.
  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
