import { useEffect, useRef } from 'react';

export default function CursorDots() {
  const canvasRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const particles = useRef([]);
  const lastActivityTime = useRef(Date.now());
  const isMobileRef = useRef(false);

  useEffect(() => {
    // Detect mobile/touch devices
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.matchMedia('(max-width: 768px)').matches;

    isMobileRef.current = isMobile;

    if (isMobile) return; // Disable on mobile

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9998';
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    const particleCount = 18;

    // Initialize particles
    particles.current = Array.from({ length: particleCount }, (_, i) => ({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
      vx: 0,
      vy: 0,
      radius: 2 - (i / particleCount) * 1.5,
      index: i,
      baseOpacity: 0.6 - (i / particleCount) * 0.5,
    }));

    // Mouse tracking
    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      lastActivityTime.current = Date.now();
    };

    // Window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Animation loop
    let animationId;
    const animate = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTime.current;
      const isIdle = timeSinceActivity > 1000;
      const fadeOutAlpha = isIdle ? Math.max(0, 1 - (timeSinceActivity - 1000) / 500) : 1;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((particle, i) => {
        const isFirst = i === 0;

        if (isFirst) {
          particle.targetX = mousePos.current.x;
          particle.targetY = mousePos.current.y;
        } else {
          const prevParticle = particles.current[i - 1];
          particle.targetX = prevParticle.x;
          particle.targetY = prevParticle.y;
        }

        // Smooth easing (slower, more elegant)
        const easing = 0.15; // Reduced from 0.25 for slower movement
        particle.vx += (particle.targetX - particle.x) * easing;
        particle.vy += (particle.targetY - particle.y) * easing;

        // Friction (more damping for smoother feel)
        particle.vx *= 0.88;
        particle.vy *= 0.88;

        particle.x += particle.vx;
        particle.y += particle.vy;

        // Calculate opacity
        const distance = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
        const speedOpacity = 0.3 + Math.min(distance / 8, 0.7);
        const finalOpacity = particle.baseOpacity * speedOpacity * fadeOutAlpha;

        // Draw smooth circle
        ctx.save();
        ctx.globalAlpha = finalOpacity;

        // Soft glow
        const glowGradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 2.5
        );
        glowGradient.addColorStop(0, 'rgba(6, 182, 212, 0.6)');
        glowGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = `rgba(6, 182, 212, ${finalOpacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 0.8, 0, Math.PI * 2);
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
