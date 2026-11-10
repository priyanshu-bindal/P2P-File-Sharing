import React, { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";

function polygonCollapsed(point, vertexCount) {
  const pairs = Array.from({ length: vertexCount }, () => point).join(", ");
  return `polygon(${pairs})`;
}

// All coordinates are percentages of the snapshot reference box: Chrome
// renders absolute px clip-path coordinates on ::view-transition-new(root)
// unscaled on fractional display scales (e.g. Windows 125%/150%) for the first
// transition after load, so percentage values land at the exact position.
function getThemeTransitionClipPaths(
  variant = "circle",
  cx,
  cy,
  maxRadius,
  viewportWidth,
  viewportHeight
) {
  const toX = (x) => `${(x / viewportWidth) * 100}%`;
  const toY = (y) => `${(y / viewportHeight) * 100}%`;
  const point = (x, y) => `${toX(x)} ${toY(y)}`;
  const toRadius = (r) =>
    `${(r / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`;

  switch (variant) {
    case "circle":
      return [
        `circle(0% at ${point(cx, cy)})`,
        `circle(${toRadius(maxRadius)} at ${point(cx, cy)})`,
      ];
    case "square": {
      const halfW = Math.max(cx, viewportWidth - cx);
      const halfH = Math.max(cy, viewportHeight - cy);
      const halfSide = Math.max(halfW, halfH) * 1.05;
      const end = [
        point(cx - halfSide, cy - halfSide),
        point(cx + halfSide, cy - halfSide),
        point(cx + halfSide, cy + halfSide),
        point(cx - halfSide, cy + halfSide),
      ].join(", ");
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`];
    }
    case "diamond": {
      const R = maxRadius * Math.SQRT2;
      const end = [
        point(cx, cy - R),
        point(cx + R, cy),
        point(cx, cy + R),
        point(cx - R, cy),
      ].join(", ");
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`];
    }
    default:
      return [
        `circle(0% at ${point(cx, cy)})`,
        `circle(${toRadius(maxRadius)} at ${point(cx, cy)})`,
      ];
  }
}

export function AnimatedThemeToggler({
  className,
  duration = 400,
  variant = "circle",
  fromCenter = false,
  theme,
  onThemeChange,
  ...props
}) {
  const shape = variant ?? "circle";
  const isControlled = theme !== undefined;
  const [internalIsDark, setInternalIsDark] = useState(false);
  const isDark = isControlled ? theme === "dark" : internalIsDark;
  const buttonRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const activeAnimRef = useRef(null);
  const safetyTimeoutRef = useRef(null);

  const cancelAnim = useCallback(() => {
    activeAnimRef.current?.cancel();
    activeAnimRef.current = null;
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelAnim();
      const root = document.documentElement;
      delete root.dataset.magicuiThemeVt;
      root.style.removeProperty("--magicui-theme-toggle-vt-duration");
      root.style.removeProperty("--magicui-theme-vt-clip-from");
    };
  }, [cancelAnim]);

  useEffect(() => {
    if (isControlled) return;
    const updateTheme = () => {
      setInternalIsDark(document.documentElement.classList.contains("dark"));
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [isControlled]);

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current;
    if (!button || isTransitioningRef.current) return;

    const newTheme = !isDark;

    // Apply theme synchronously to DOM, localStorage, and state
    const applyTheme = () => {
      const root = document.documentElement;
      if (newTheme) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }

      const meta = document.getElementById("theme-color-meta");
      if (meta) {
        meta.setAttribute("content", newTheme ? "#050505" : "#f8fafc");
      }

      try {
        localStorage.setItem("theme", newTheme ? "dark" : "light");
      } catch (_) {}

      if (isControlled) {
        onThemeChange?.(newTheme ? "dark" : "light");
      } else {
        setInternalIsDark(newTheme);
      }
    };

    // If browser doesn't support View Transitions or user prefers reduced motion
    if (
      typeof document.startViewTransition !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      applyTheme();
      return;
    }

    // Adaptive duration: 320ms on mobile touch screens for snappy, 60fps response
    const isMobile =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches ||
      window.innerWidth < 640;
    const animDuration = isMobile ? Math.min(duration, 320) : duration;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x;
    let y;
    if (fromCenter) {
      x = viewportWidth / 2;
      y = viewportHeight / 2;
    } else {
      const rect = button.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    );

    const clipPath = getThemeTransitionClipPaths(
      shape,
      x,
      y,
      maxRadius,
      viewportWidth,
      viewportHeight
    );

    const root = document.documentElement;
    root.dataset.magicuiThemeVt = "active";
    root.style.setProperty(
      "--magicui-theme-toggle-vt-duration",
      `${animDuration}ms`
    );
    root.style.setProperty("--magicui-theme-vt-clip-from", clipPath[0]);

    const cleanup = () => {
      isTransitioningRef.current = false;
      delete root.dataset.magicuiThemeVt;
      root.style.removeProperty("--magicui-theme-toggle-vt-duration");
      root.style.removeProperty("--magicui-theme-vt-clip-from");
      cancelAnim();
    };

    isTransitioningRef.current = true;

    // Fail-safe timeout so button NEVER stays stuck if transition is interrupted
    safetyTimeoutRef.current = setTimeout(cleanup, animDuration + 200);

    let transition;
    try {
      transition = document.startViewTransition(() => {
        flushSync(applyTheme);
      });
    } catch (_err) {
      applyTheme();
      cleanup();
      return;
    }

    if (typeof transition?.finished?.finally === "function") {
      transition.finished.finally(cleanup).catch(() => {});
    } else {
      cleanup();
    }

    const ready = transition?.ready;
    if (ready && typeof ready.then === "function") {
      ready
        .then(() => {
          const anim = document.documentElement.animate(
            { clipPath },
            {
              duration: animDuration,
              easing: "cubic-bezier(0.16, 1, 0.3, 1)",
              fill: "forwards",
              pseudoElement: "::view-transition-new(root)",
            }
          );
          activeAnimRef.current = anim;
        })
        .catch(() => {});
    }
  }, [
    shape,
    fromCenter,
    duration,
    isDark,
    isControlled,
    onThemeChange,
    cancelAnim,
  ]);

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      onPointerDown={(e) => e.stopPropagation()}
      style={{ WebkitTapHighlightColor: "transparent" }}
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/90 dark:border-white/[0.1] bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-neutral-300 shadow-xs dark:shadow-sm transition-all duration-200 active:scale-90 cursor-pointer touch-manipulation select-none",
        className
      )}
      title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      aria-label="Toggle theme"
      {...props}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300 rotate-0 scale-100 pointer-events-none" />
      ) : (
        <Moon className="h-4 w-4 text-violet-400 transition-transform duration-300 rotate-0 scale-100 pointer-events-none" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
