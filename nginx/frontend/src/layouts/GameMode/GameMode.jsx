import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import styles from './GameMode.module.scss';
import { Link } from "react-router-dom";

const GameMode = () => {
  const starsRef = useRef(null);
  const requestRef = useRef();
  const previousTimeRef = useRef();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Generate stars with density based on screen size
  const stars = useMemo(() => {
    const starCount = window.innerWidth < 768 ? 50 : 100;
    return Array.from({ length: starCount }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      width: Math.random() * 3,
      delay: Math.random()
    }));
  }, []);

  // Generate fewer scanlines on mobile for better performance
  const scanlines = useMemo(() => {
    const scanlineCount = window.innerWidth < 768 ? 5 : 10;
    return Array.from({ length: scanlineCount }, (_, i) => (
      <div key={i} className={styles.scanline} />
    ));
  }, []);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!starsRef.current) return;

      requestRef.current = requestAnimationFrame((timestamp) => {
        if (previousTimeRef.current !== undefined) {
          // Reduce parallax effect on mobile for better performance
          const multiplier = isMobile ? 0.3 : 1.0;
          const mouseX = (event.clientX / window.innerWidth - 0.5) * 100 * multiplier;
          const mouseY = (event.clientY / window.innerHeight - 0.5) * 100 * multiplier;

          starsRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        }
        previousTimeRef.current = timestamp;
      });
    };

    // Add touch move handler for mobile
    const handleTouchMove = (event) => {
      if (!starsRef.current || !event.touches[0]) return;
      
      const touch = event.touches[0];
      requestRef.current = requestAnimationFrame((timestamp) => {
        if (previousTimeRef.current !== undefined) {
          const multiplier = 0.2; // Even gentler for touch
          const touchX = (touch.clientX / window.innerWidth - 0.5) * 100 * multiplier;
          const touchY = (touch.clientY / window.innerHeight - 0.5) * 100 * multiplier;

          starsRef.current.style.transform = `translate(${touchX}px, ${touchY}px)`;
        }
        previousTimeRef.current = timestamp;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isMobile]);

  return (
    <div className={styles.retroBackground}>
      <div className={styles.stars} ref={starsRef}>
        {stars.map((star, index) => (
          <div
            key={index}
            className={styles.star}
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
      <div className={styles.outletContainer}>
        <Outlet />
      </div>
      <div className={styles.gamePreview} />
      <div className={styles.glitchOverlay}>
        {scanlines}
      </div>
      <Link to="/">
        <button className={styles.backButton}>
          <svg
            fill="#00d4ff"
            className={styles.backIcon}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 330 330"
          >
            <path d="M111.213,165.004L250.607,25.607c5.858-5.858,5.858-15.355,0-21.213c-5.858-5.858-15.355-5.858-21.213,0.001 l-150,150.004C76.58,157.211,75,161.026,75,165.004c0,3.979,1.581,7.794,4.394,10.607l150,149.996 C232.322,328.536,236.161,330,240,330s7.678-1.464,10.607-4.394c5.858-5.858,5.858-15.355,0-21.213L111.213,165.004z" />
          </svg>
        </button>
      </Link>
    </div>
  );
};

export default GameMode;