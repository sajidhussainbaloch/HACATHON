import { useEffect, useRef } from 'react';

/**
 * Professional background animation with floating shapes and ambient effects.
 * Creates a modern, subtle animated background without cursor interaction.
 */
export default function BackgroundAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    canvas.style.opacity = '0.5';
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    const shapes = [];
    const shapeCount = 8;

    // Create floating geometric shapes
    for (let i = 0; i < shapeCount; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 50 + Math.random() * 150,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        type: Math.floor(Math.random() * 3), // 0: circle, 1: square, 2: triangle
        color: `hsl(${220 + Math.random() * 40}, ${60 + Math.random() * 20}%, ${50 + Math.random() * 20}%)`,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.01,
      });
    }

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Animation loop
    let animationId;
    const animate = () => {
      // Clear with fade effect instead of clearing completely
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      shapes.forEach((shape) => {
        // Update position
        shape.x += shape.vx;
        shape.y += shape.vy;
        shape.rotation += shape.rotationSpeed;
        shape.pulsePhase += shape.pulseSpeed;

        // Bounce off edges
        if (shape.x - shape.size / 2 < 0 || shape.x + shape.size / 2 > canvas.width) {
          shape.vx *= -1;
          shape.x = Math.max(shape.size / 2, Math.min(canvas.width - shape.size / 2, shape.x));
        }
        if (shape.y - shape.size / 2 < 0 || shape.y + shape.size / 2 > canvas.height) {
          shape.vy *= -1;
          shape.y = Math.max(shape.size / 2, Math.min(canvas.height - shape.size / 2, shape.y));
        }

        // Calculate pulse effect
        const pulse = Math.sin(shape.pulsePhase) * 0.3 + 0.7;
        const size = shape.size * pulse;

        // Draw shape with glow
        ctx.save();

        // Glow effect
        ctx.globalAlpha = 0.15 * pulse;
        ctx.fillStyle = shape.color;
        ctx.shadowBlur = 30;
        ctx.shadowColor = shape.color;

        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rotation);

        // Draw different shape types
        if (shape.type === 0) {
          // Circle
          ctx.beginPath();
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape.type === 1) {
          // Square
          ctx.fillRect(-size / 2, -size / 2, size, size);
        } else {
          // Triangle
          ctx.beginPath();
          ctx.moveTo(0, -size / 2);
          ctx.lineTo(size / 2, size / 2);
          ctx.lineTo(-size / 2, size / 2);
          ctx.closePath();
          ctx.fill();
        }

        // Draw border
        ctx.globalAlpha = 0.3 * pulse;
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 1.5;

        ctx.translate(-shape.x, -shape.y);
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rotation);

        if (shape.type === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (shape.type === 1) {
          ctx.strokeRect(-size / 2, -size / 2, size, size);
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -size / 2);
          ctx.lineTo(size / 2, size / 2);
          ctx.lineTo(-size / 2, size / 2);
          ctx.closePath();
          ctx.stroke();
        }

        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, []);

  return null;
}
