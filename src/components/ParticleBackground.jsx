import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const ParticleBackground = () => {
  const { animationsEnabled } = useTheme();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Set canvas to full screen
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Particle settings
    const particles = [];
    const numParticles = 200; // Balanced for beauty and performance

    // Vibrant colors like in the screenshot
    const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8A2BE2', '#FF1493', '#00FFFF'];

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.length = Math.random() * 6 + 3;
        this.thickness = Math.random() * 1.5 + 0.5;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.angle = Math.random() * Math.PI * 2;

        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.rotationSpeed = (Math.random() - 0.5) * 0.01;
      }

      update(mouseX, mouseY) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.angle += this.rotationSpeed;

        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          const force = (150 - distance) / 150;
          this.x -= (dx / distance) * force * 2;
          this.y -= (dy / distance) * force * 2;
          this.angle += force * 0.05;
        }

        if (this.x < -20) this.x = canvas.width + 20;
        if (this.x > canvas.width + 20) this.x = -20;
        if (this.y < -20) this.y = canvas.height + 20;
        if (this.y > canvas.height + 20) this.y = -20;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        ctx.moveTo(-this.length / 2, 0);
        ctx.lineTo(this.length / 2, 0);

        // Fake glow effect (much faster than shadowBlur)
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = this.thickness * 4;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Core line
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = this.thickness;
        ctx.stroke();

        ctx.restore();
      }
    }

    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }

    let mouseX = -1000;
    let mouseY = -1000;
    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    // When mouse leaves, reset so they don't get stuck pushed away
    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      // Clear with a slight fade for motion blur effect
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update(mouseX, mouseY);
        p.draw();
      });
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [animationsEnabled]);

  if (!animationsEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1, // Ensure it is behind ALL other elements
        pointerEvents: 'none',
        opacity: 0.8 // Slightly transparent so it doesn't overwhelm the dark mode
      }}
    />
  );
};

export default ParticleBackground;
