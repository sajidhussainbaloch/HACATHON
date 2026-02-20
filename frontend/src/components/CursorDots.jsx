import { useEffect, useRef } from 'react';

export default function CursorDots() {
  const canvasRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const particles = useRef([]);
  const isMobileRef = useRef(false);
  const animationTimeRef = useRef(0);

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
    const particleCount = 100;
    const gridSize = Math.ceil(Math.sqrt(particleCount));

    // Initialize particles - spread evenly across entire page in grid
    particles.current = Array.from({ length: particleCount }, (_, i) => {
      const gridX = (i % gridSize) * (window.innerWidth / gridSize);
      const gridY = Math.floor(i / gridSize) * (window.innerHeight / gridSize);
      
      // Add small random offset for natural look
      const baseX = gridX + Math.random() * (window.innerWidth / gridSize) * 0.8;
      const baseY = gridY + Math.random() * (window.innerHeight / gridSize) * 0.8;
      
      return {
        id: i,
        x: baseX,
        y: baseY,
        baseX: baseX, // Original position
        baseY: baseY,
        vx: 0,
        vy: 0,
        floatOffsetX: Math.sin(i * 0.5) * 30,
        floatOffsetY: Math.cos(i * 0.7) * 30,
        radius: 1.5 + Math.random() * 2.5,
        baseOpacity: 0.3 + Math.random() * 0.5,
        pulseOffset: Math.random() * Math.PI * 2,
        repelDistance: 270 + Math.random() * 120,
      };
    });

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
      animationTimeRef.current += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((particle) => {
        // Calculate target position with floating animation
        const floatX =
          particle.baseX +
          Math.sin(animationTimeRef.current * 0.5 + particle.id) * particle.floatOffsetX * 0.5;
        const floatY =
          particle.baseY +
          Math.cos(animationTimeRef.current * 0.7 + particle.id) * particle.floatOffsetY * 0.5;

        // Calculate distance to cursor
        const dx = particle.x - mousePos.current.x;
        const dy = particle.y - mousePos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Repel from cursor when close
        if (distance < particle.repelDistance) {
          const angle = Math.atan2(dy, dx);
          const repelForce = (particle.repelDistance - distance) / particle.repelDistance * 8;
          particle.vx += Math.cos(angle) * repelForce;
          particle.vy += Math.sin(angle) * repelForce;
        }

        // Ease back to floating position
        const returnEasing = 0.08;
        particle.vx += (floatX - particle.x) * returnEasing;
        particle.vy += (floatY - particle.y) * returnEasing;

        // Friction
        particle.vx *= 0.82;
        particle.vy *= 0.82;

        particle.x += particle.vx;
        particle.y += particle.vy;

        // Calculate pulsing opacity (dark to bright star twinkling effect)
        const pulse = Math.sin(
          animationTimeRef.current * 1.5 + particle.pulseOffset
        ) * 0.5 + 0.5;
        const finalOpacity = particle.baseOpacity * (0.1 + pulse * 0.9); // Dark (0.1) to bright (1.0)

        // Draw star-like dot with dark-to-bright shining effect
        ctx.save();
        ctx.globalAlpha = finalOpacity;

        // Very large outer glow (dark blue)
        const outerGlow = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 5
        );
        outerGlow.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
        outerGlow.addColorStop(0.3, 'rgba(6, 182, 212, 0.08)');
        outerGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 5, 0, Math.PI * 2);
        ctx.fill();

        // Large glow (brighter)
        const largeGlow = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 3.5
        );
        largeGlow.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
        largeGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.15)');
        largeGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = largeGlow;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Medium glow
        const mediumGlow = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 2
        );
        mediumGlow.addColorStop(0, 'rgba(6, 182, 212, 0.5)');
        mediumGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = mediumGlow;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Star core - white bright center that pulses
        const coreGradient = ctx.createRadialGradient(
          particle.x - particle.radius * 0.4,
          particle.y - particle.radius * 0.4,
          0,
          particle.x,
          particle.y,
          particle.radius * 1.2
        );
        // Dark to bright pulsing effect
        const brightFactor = 0.3 + pulse * 0.7; // 0.3 to 1.0
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * brightFactor})`);
        coreGradient.addColorStop(0.3, `rgba(150, 220, 255, ${0.7 * brightFactor})`);
        coreGradient.addColorStop(0.6, `rgba(6, 182, 212, ${0.5 * brightFactor})`);
        coreGradient.addColorStop(1, `rgba(6, 182, 212, ${0.1 * brightFactor})`);
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 1.2, 0, Math.PI * 2);
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

