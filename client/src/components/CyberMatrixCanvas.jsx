import React, { useEffect, useRef } from 'react';

/**
 * High-performance 60fps Cyber Matrix & Particle Canvas
 * Generates dynamic glowing cyber particles, constellation connection lines,
 * and scanning digital lasers for an authentic gaming arena atmosphere.
 */
export function CyberMatrixCanvas({
  className = '',
  particleCount = 45,
  interactive = true,
  theme = 'cyber' // 'cyber' | 'emerald' | 'amber'
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle Palette
    const colors =
      theme === 'emerald'
        ? ['#9CD67D', '#22c55e', '#10b981', '#4ade80']
        : theme === 'amber'
        ? ['#FABD00', '#f59e0b', '#fbbf24', '#f97316']
        : ['#AAC7FF', '#415F91', '#DDBCE0', '#38bdf8', '#a855f7'];

    // Initialize particles
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      pulseAngle: Math.random() * Math.PI * 2
    }));

    // Mouse interactivity
    const mouse = { x: -1000, y: -1000, radius: 100 };
    const handleMouseMove = (e) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Laser scanline tracking
    let laserY = 0;
    let laserSpeed = 0.75;

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Moving Cyber Laser Scanline
      laserY += laserSpeed;
      if (laserY > height) laserY = 0;

      const gradient = ctx.createLinearGradient(0, laserY - 10, 0, laserY + 10);
      gradient.addColorStop(0, 'rgba(170, 199, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(170, 199, 255, 0.12)');
      gradient.addColorStop(1, 'rgba(170, 199, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, laserY - 10, width, 20);

      // 2. Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 90) {
            const lineAlpha = (1 - dist / 90) * 0.18;
            ctx.strokeStyle = `rgba(170, 199, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // 3. Update & Draw Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce at edges
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse avoidance/attraction
        if (interactive) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < mouse.radius && mdist > 0) {
            const force = (mouse.radius - mdist) / mouse.radius;
            p.x += (mdx / mdist) * force * 2;
            p.y += (mdy / mdist) * force * 2;
          }
        }

        // Pulse alpha
        p.pulseAngle += p.pulseSpeed;
        const currentAlpha = p.alpha + Math.sin(p.pulseAngle) * 0.2;

        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.min(1, currentAlpha));
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [particleCount, interactive, theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-auto w-full h-full ${className}`}
    />
  );
}
