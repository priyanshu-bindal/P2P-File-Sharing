import React, { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function AnimatedThemeToggler({
  className,
  theme,
  onThemeChange,
  ...props
}) {
  const isControlled = theme !== undefined;
  const [internalIsDark, setInternalIsDark] = useState(false);
  const isDark = isControlled ? theme === "dark" : internalIsDark;

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
    const nextTheme = isDark ? "light" : "dark";

    // Disable transitions momentarily so theme switches completely instantaneously with zero animation
    const disableTransitions = document.createElement("style");
    disableTransitions.textContent =
      "*, *::before, *::after { -webkit-transition: none !important; -moz-transition: none !important; -o-transition: none !important; -ms-transition: none !important; transition: none !important; }";
    document.head.appendChild(disableTransitions);

    const root = document.documentElement;
    if (nextTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }

    const meta = document.getElementById("theme-color-meta");
    if (meta) {
      meta.setAttribute("content", nextTheme === "dark" ? "#050505" : "#f8fafc");
    }

    try {
      localStorage.setItem("theme", nextTheme);
    } catch (_) {}

    if (isControlled) {
      onThemeChange?.(nextTheme);
    } else {
      setInternalIsDark(nextTheme === "dark");
    }

    // Force style reflow so DOM updates immediately with transitions disabled
    window.getComputedStyle(document.body);
    setTimeout(() => {
      if (document.head.contains(disableTransitions)) {
        document.head.removeChild(disableTransitions);
      }
    }, 20);
  }, [isDark, isControlled, onThemeChange]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      onPointerDown={(e) => e.stopPropagation()}
      style={{ WebkitTapHighlightColor: "transparent" }}
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/90 dark:border-white/[0.1] bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-neutral-300 shadow-xs dark:shadow-sm active:scale-90 cursor-pointer touch-manipulation select-none",
        className
      )}
      title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      aria-label="Toggle theme"
      {...props}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-500 pointer-events-none" />
      ) : (
        <Moon className="h-4 w-4 text-violet-400 pointer-events-none" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

export const ThemeToggler = AnimatedThemeToggler;
