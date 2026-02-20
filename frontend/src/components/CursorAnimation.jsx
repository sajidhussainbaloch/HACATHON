import { useEffect, useRef } from 'react';

export default function CursorAnimation() {
  const canvasRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const particles = useRef([]);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    const particleCount = 20;

    // Initialize particles
    particles.current = Array.from({ length: particleCount }, (_, i) => ({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
      vx: 0,
      vy: 0,
      radius: 3 - (i / particleCount) * 2.5,
      delay: i * 0.02,
      opacity: 1 - (i / particleCount) * 0.7,
    }));

    // Mouse tracking
    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    // Window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Animation loop
    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.current.forEach((particle, i) => {
        const isFirst = i === 0;
        
        if (isFirst) {
          // First particle follows mouse directly
          particle.targetX = mousePos.current.x;
          particle.targetY = mousePos.current.y;
        } else {
          // Other particles follow the previous particle
          const prevParticle = particles.current[i - 1];
          particle.targetX = prevParticle.x;
          particle.targetY = prevParticle.y;
        }

        // Smooth easing towards target
        const easing = 0.25;
        particle.vx += (particle.targetX - particle.x) * easing;
        particle.vy += (particle.targetY - particle.y) * easing;

        // Friction
        particle.vx *= 0.85;
        particle.vy *= 0.85;

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Calculate opacity with distance-based glow
        const distance = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
        const dynamicOpacity = particle.opacity * (0.5 + Math.min(distance / 5, 0.5));

        // Draw particle with glow effect
        ctx.save();
        ctx.globalAlpha = dynamicOpacity;

        // Glow
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 3
        );
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `rgba(6, 182, 212, ${dynamicOpacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    animationId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, []);

  return null;
}
