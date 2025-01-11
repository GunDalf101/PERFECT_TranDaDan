import React, { useEffect } from 'react'
import styles from './GameMode.module.scss'
import "./GameMode.css"
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import gsap from 'gsap'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import { Outlet } from 'react-router-dom'


const GameMode = () => {
    useEffect(() => {
        function createStars() {
            const starsContainer = document.getElementById('stars');
            for (let i = 0; i < 100; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.width = Math.random() * 3 + 'px';
                star.style.height = star.style.width;
                star.style.animationDelay = Math.random() * 1 + 's';
                starsContainer.appendChild(star);
            }
        }

        function handleMouseMove(event) {
            const stars = document.getElementsByClassName('star');
            const mouseX = event.clientX / window.innerWidth - 0.5;
            const mouseY = event.clientY / window.innerHeight - 0.5;

            for (let star of stars) {
                const depth = parseFloat(star.style.width) * 2;
                const translateX = mouseX * depth * 100;
                const translateY = mouseY * depth * 100;
                star.style.transform = `translate(${translateX}px, ${translateY}px)`;
            }
        }

        createStars();
        document.addEventListener('mousemove', handleMouseMove);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);
    const scanlines = Array.from({ length: 10 }, (_, i) => (
        <div
            key={i}
            className="scanline"
        />
    ));


    return (
        <div id="retro-background">
            <div id="stars"></div>
            <Outlet />
            <div className="game-preview"></div>
            <div id="glitch-overlay">{scanlines}</div>
        </div>
    )
}

export default GameMode