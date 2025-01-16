import React, { useEffect, useRef, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import styles from './GameMode.module.scss';

const GameMode = () => {
  const starsRef = useRef(null);
  const requestRef = useRef();
  const previousTimeRef = useRef();

  const stars = useMemo(() => {
    return Array.from({ length: 100 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      width: Math.random() * 3,
      delay: Math.random()
    }));
  }, []);

  const scanlines = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => (
      <div key={i} className="scanline" />
    ));
  }, []);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!starsRef.current) return;
      
      requestRef.current = requestAnimationFrame((timestamp) => {
        if (previousTimeRef.current !== undefined) {
          const mouseX = (event.clientX / window.innerWidth - 0.5) * 100;
          const mouseY = (event.clientY / window.innerHeight - 0.5) * 100;
          
          starsRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        }
        previousTimeRef.current = timestamp;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.retroBackground}>
      <div className={styles.stars} ref={starsRef}>
        {stars.map((star, index) => (
          <div
            key={index}
            className="star"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.width}px`,
              height: `${star.width}px`,
              animationDelay: `${star.delay}s`
            }}
          />
        ))}
      </div>
      <Outlet />
      <div className="game-preview" />
      <div className={styles.glitchOverlay}>
        {scanlines}
      </div>
    </div>
  );
};

export default GameMode;
