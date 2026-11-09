import { useRef, useCallback } from 'react';

/**
 * React Bits inspired interactive Spotlight & 3D Tilt hook.
 * Dynamically tracks cursor coordinates on cards, injecting CSS variables
 * for buttery-smooth GPU-rendered spotlights, dynamic border glow, and tactile tilt.
 */
export function useCardSpotlight({
  tilt = true,
  maxTilt = 2,
  glare = true,
} = {}) {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback(
    (e) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x.toFixed(1)}px`);
      card.style.setProperty('--mouse-y', `${y.toFixed(1)}px`);
      card.style.setProperty('--spotlight-opacity', '1');

      if (tilt) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;
        card.style.setProperty('--card-rotate-x', `${rotateX.toFixed(2)}deg`);
        card.style.setProperty('--card-rotate-y', `${rotateY.toFixed(2)}deg`);
      }

      if (glare) {
        const glareX = ((x / rect.width) * 100).toFixed(1);
        const glareY = ((y / rect.height) * 100).toFixed(1);
        card.style.setProperty('--glare-x', `${glareX}%`);
        card.style.setProperty('--glare-y', `${glareY}%`);
      }
    },
    [tilt, maxTilt, glare]
  );

  const handleMouseEnter = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--spotlight-opacity', '1');
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--spotlight-opacity', '0');
    if (tilt) {
      card.style.setProperty('--card-rotate-x', '0deg');
      card.style.setProperty('--card-rotate-y', '0deg');
    }
  }, [tilt]);

  return {
    ref: cardRef,
    onMouseMove: handleMouseMove,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
}
