import { useRef, useCallback, useEffect } from 'react';

/**
 * High-Performance Spotlight & 3D Tilt Hook
 * Optimized for 60-120fps on both low-end and high-end devices:
 * - Batches coordinate calculations to requestAnimationFrame (vsync-synchronized)
 * - Caches getBoundingClientRect on enter/resize to eliminate layout thrashing
 * - Automatically detects fine pointer (mouse/trackpad) vs touch to prevent scroll jank on mobile
 * - Sets data-hovered attribute for instantaneous cursor tracking with zero CSS transition lag
 */
export function useCardSpotlight({
  tilt = true,
  maxTilt = 2,
  glare = true,
} = {}) {
  const cardRef = useRef(null);
  const rafIdRef = useRef(null);
  const rectRef = useRef(null);
  const isPointerFineRef = useRef(true);

  // Detect pointer capability (fine mouse/trackpad vs touch)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
      isPointerFineRef.current = mql.matches;
      const onChange = (e) => {
        isPointerFineRef.current = e.matches;
      };
      mql.addEventListener?.('change', onChange);

      // Window resize / orientation change resets cached rect
      const handleResize = () => {
        if (cardRef.current) {
          rectRef.current = cardRef.current.getBoundingClientRect();
        }
      };
      window.addEventListener('resize', handleResize, { passive: true });

      return () => {
        mql.removeEventListener?.('change', onChange);
        window.removeEventListener('resize', handleResize);
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }
      };
    }
  }, []);

  const handlePointerEnter = useCallback((e) => {
    // If it's a touch pointer, avoid hover calculations to keep scrolling smooth
    if (e.pointerType === 'touch' || !isPointerFineRef.current) return;
    const card = cardRef.current;
    if (!card) return;

    // Cache the card bounding box on enter
    rectRef.current = card.getBoundingClientRect();
    card.setAttribute('data-hovered', 'true');
    card.style.setProperty('--spotlight-opacity', '1');
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      if (e.pointerType === 'touch' || !isPointerFineRef.current) return;
      const card = cardRef.current;
      if (!card) return;

      if (!rectRef.current) {
        rectRef.current = card.getBoundingClientRect();
      }

      const clientX = e.clientX;
      const clientY = e.clientY;

      // Throttle DOM style updates to screen refresh rate via requestAnimationFrame
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const rect = rectRef.current;
        if (!rect || !card) return;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x.toFixed(1)}px`);
        card.style.setProperty('--mouse-y', `${y.toFixed(1)}px`);

        if (tilt) {
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          // Soft clamp to preserve tactile feel
          const normalX = Math.max(-1, Math.min(1, (x - centerX) / centerX));
          const normalY = Math.max(-1, Math.min(1, (y - centerY) / centerY));
          const rotateX = normalY * -maxTilt;
          const rotateY = normalX * maxTilt;

          card.style.setProperty('--card-rotate-x', `${rotateX.toFixed(2)}deg`);
          card.style.setProperty('--card-rotate-y', `${rotateY.toFixed(2)}deg`);
        }

        if (glare) {
          const glareX = ((x / rect.width) * 100).toFixed(1);
          const glareY = ((y / rect.height) * 100).toFixed(1);
          card.style.setProperty('--glare-x', `${glareX}%`);
          card.style.setProperty('--glare-y', `${glareY}%`);
        }
      });
    },
    [tilt, maxTilt, glare]
  );

  const handlePointerLeave = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    rectRef.current = null;
    const card = cardRef.current;
    if (!card) return;

    card.removeAttribute('data-hovered');
    card.style.setProperty('--spotlight-opacity', '0');
    if (tilt) {
      card.style.setProperty('--card-rotate-x', '0deg');
      card.style.setProperty('--card-rotate-y', '0deg');
    }
  }, [tilt]);

  return {
    ref: cardRef,
    onPointerMove: handlePointerMove,
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
    // Mouse events as fallback
    onMouseMove: handlePointerMove,
    onMouseEnter: handlePointerEnter,
    onMouseLeave: handlePointerLeave,
  };
}
