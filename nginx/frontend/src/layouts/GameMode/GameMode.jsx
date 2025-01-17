import React, { useEffect, useRef, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import styles from './GameMode.module.scss';
import { Link } from "react-router-dom";

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
      <div className={styles.outletContainer}>
        <Outlet />
      </div>
      <div className="game-preview" />
      <div className={styles.glitchOverlay}>
        {scanlines}
      </div>
      <Link to="/">
					<button className="absolute top-4 left-4 rounded-full bg-transparent transition-colors w-[40px] h-[40px]">
						<svg
							fill="#00d4ff"
							className="w-6 h-6"
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
