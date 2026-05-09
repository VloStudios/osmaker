import { useMemo } from "react";

/**
 * Falling sakura (cherry blossom) petals — site-wide ambient overlay.
 * Pure CSS animation, no canvas, no JS loop.
 */
export function SakuraPetals({ count = 40 }: { count?: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const size = 10 + Math.random() * 16; // 10-26px
        const left = Math.random() * 100;
        const duration = 8 + Math.random() * 10; // 8-18s
        const delay = -Math.random() * duration; // negative => already in flight
        const drift = (Math.random() * 200 - 100).toFixed(0) + "px";
        const sway = 4 + Math.random() * 6;
        const rotate = Math.random() * 360;
        const hue = 335 + Math.random() * 20; // pink range
        const opacity = 0.55 + Math.random() * 0.4;
        return { i, size, left, duration, delay, drift, sway, rotate, hue, opacity };
      }),
    [count]
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden"
    >
      {petals.map((p) => (
        <span
          key={p.i}
          className="sakura-petal"
          style={
            {
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s, ${p.sway}s`,
              animationDelay: `${p.delay}s, ${p.delay}s`,
              opacity: p.opacity,
              ["--drift" as any]: p.drift,
              ["--rot" as any]: `${p.rotate}deg`,
              background: `radial-gradient(circle at 30% 30%, hsl(${p.hue} 100% 92%), hsl(${p.hue} 85% 72%) 60%, hsl(${p.hue} 70% 60%) 100%)`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
