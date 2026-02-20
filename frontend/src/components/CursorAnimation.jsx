import { useEffect, useRef } from 'react';

export default function CursorAnimation() {
  const dotsRef = useRef([]);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Create cursor dots
    const dotCount = 12;
    const container = document.body;
    
    dotsRef.current = Array.from({ length: dotCount }, (_, i) => {
      const dot = document.createElement('div');
      dot.className = `cursor-dot ${i % 2 === 0 ? 'cursor-dot-outer' : 'cursor-dot-inner'}`;
      dot.style.left = '0px';
      dot.style.top = '0px';
      container.appendChild(dot);
      return {
        element: dot,
        x: mousePos.current.x,
        y: mousePos.current.y,
        vx: 0,
        vy: 0,
      };
    });

    // Listen to mouse movement
    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    // Animation loop
    let animationId;
    const animate = () => {
      dotsRef.current.forEach((dot, i) => {
        // Calculate direction to mouse
        const dx = mousePos.current.x - dot.x;
        const dy = mousePos.current.y - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Easing towards mouse
        const speed = 0.08 + (i * 0.01);
        if (distance > 1) {
          dot.vx += (dx / distance) * speed;
          dot.vy += (dy / distance) * speed;
        }

        // Apply velocity with friction
        dot.vx *= 0.92;
        dot.vy *= 0.92;

        // Update position
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Update DOM
        dot.element.style.left = `${dot.x}px`;
        dot.element.style.top = `${dot.y}px`;
      });

      animationId = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', handleMouseMove);
    animationId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
      dotsRef.current.forEach((dot) => {
        if (dot.element.parentNode) {
          dot.element.parentNode.removeChild(dot.element);
        }
      });
    };
  }, []);

  return null;
}
