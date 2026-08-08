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
        glowRef.current.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
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
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(124, 58, 237, 0.02) 25%, transparent 50%)',
        mixBlendMode: 'screen',
        borderRadius: '50%',
        pointerEvents: 'none',
        transition: 'opacity 0.2s ease-out',
        zIndex: 9999,
      }}
    />
  );
};

export default CursorGlow;
