"use client";

import { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
  speed?: number;
  className?: string;
};

export default function Parallax({ children, speed = 0.12, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const section = el?.parentElement;
    if (!el || !section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const centerOffset =
        rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${(-centerOffset * speed).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);

  const buffer = Math.round(speed * 600) + 40;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: "absolute",
        top: -buffer,
        bottom: -buffer,
        left: 0,
        right: 0,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
