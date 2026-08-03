import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const CursorGlow = () => {
  const { animationsEnabled } = useTheme();
  const [hidden, setHidden] = useState(true);
  const glowRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (hidden) setHidden(false);
      if (glowRef.current) {
        // Direct DOM manipulation completely bypasses React render cycle = 60fps buttery smooth
        glowRef.current.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
      }
    };

    const handleMouseLeave = () => {
      setHidden(true);
    };

    const handleMouseEnter = () => {
      setHidden(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);
    document.body.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [hidden]);

  if (hidden || !animationsEnabled) return null;

  return (
    <div
      ref={glowRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, rgba(124, 58, 237, 0.05) 30%, transparent 60%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        // Start off-screen or wait for mouse move to set transform
        transition: 'opacity 0.15s ease-out',
        zIndex: 9999,
      }}
    />
  );
};

export default CursorGlow;
