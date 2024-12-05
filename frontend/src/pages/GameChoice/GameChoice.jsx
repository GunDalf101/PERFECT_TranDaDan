import React, { useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import gsap from 'gsap'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import { Link } from 'react-router-dom'


const GameChoice = () => {

    useEffect(() => {
        const container = document.getElementById('canvas-container');
        const scene = new THREE.Scene();
        scene.background = null
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const GLTFloader = new GLTFLoader();
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setClearColor(0x000000, 0);
        renderer.setClearAlpha(0);

        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        function createGameModel(modelUrl) {
            return new Promise((resolve, reject) => {
                GLTFloader.load(
                    modelUrl,
                    (gltf) => {
                        const model = gltf.scene;
                        model.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });
                        resolve(model);
                    },
                    undefined,
                    (error) => {
                        reject(error);
                    }
                );
            });
        }

        let pongModel = null;
        let invadersModel = null;

        const pongContainer = document.getElementById('pong-container');
        const invadersContainer = document.getElementById('invaders-container');

        (async () => {
            try {
                const pongModelIn = await createGameModel('/models/pong/scene.gltf');
                const invadersModelIn = await createGameModel('/models/spaceship/scene.gltf');
                const pongContainerPosition = pongContainer.getBoundingClientRect();
                const invadersContainerPosition = invadersContainer.getBoundingClientRect();
                const pongContainerCenter = {
                    x: pongContainerPosition.left + pongContainerPosition.width / 2,
                    y: pongContainerPosition.top + pongContainerPosition.height / 2
                };
                const invadersContainerCenter = {
                    x: invadersContainerPosition.left + invadersContainerPosition.width / 2,
                    y: invadersContainerPosition.top + invadersContainerPosition.height / 2
                };
                const pongContainerSize = {
                    width: pongContainerPosition.width,
                    height: pongContainerPosition.height
                };
                const invadersContainerSize = {
                    width: invadersContainerPosition.width,
                    height: invadersContainerPosition.height
                };

                const controls = new OrbitControls(camera, renderer.domElement);

                pongModelIn.scale.set(30, 30, 30);
                invadersModelIn.scale.set(3, 3, 3);

                scene.add(pongModelIn);
                scene.add(invadersModelIn);
                pongModel = pongModelIn;
                invadersModel = invadersModelIn;

                function animate() {
                    requestAnimationFrame(animate);
                    updateModelPositions();
                    pongModelIn.rotation.z += 0.01;
                    pongModelIn.rotation.x = Math.PI / 3;
                    invadersModelIn.position.y = Math.sin(Date.now() * 0.001);
                    invadersModelIn.rotation.x = 0.5;
                    renderer.render(scene, camera);
                }

                updateModelPositions();
                addContainerListeners(pongContainer, pongModel);
                addContainerListeners(invadersContainer, invadersModel);

                animate();
            } catch (error) {
                console.error('Error loading models:', error);
            }
        })();

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        camera.position.z = 15;

        function screenToWorld(container, camera, renderer) {
            const containerRect = container.getBoundingClientRect();
            const centerX = containerRect.left + containerRect.width / 2;
            const centerY = containerRect.top + containerRect.height / 2;

            const normalizedX = (centerX / window.innerWidth) * 2 - 1;
            const normalizedY = -(centerY / window.innerHeight) * 2 + 1;

            const vector = new THREE.Vector3(normalizedX, normalizedY, 0.5);
            vector.unproject(camera);

            const dir = vector.sub(camera.position).normalize();
            const distance = -camera.position.z / dir.z;
            const position = camera.position.clone().add(dir.multiplyScalar(distance));
            return position;
        }

        function updateModelPositions() {
            if (!pongModel || !invadersModel) {
                return;
            }

            const pongWorldPosition = screenToWorld(pongContainer, camera, renderer);
            const invadersWorldPosition = screenToWorld(invadersContainer, camera, renderer);
            pongWorldPosition.y -= 2;

            if (window.innerWidth <= 768) {
                pongModel.scale.set(20, 20, 20);
                invadersModel.scale.set(1.75, 1.75, 1.75);
            } else if (window.innerWidth <= 1200) {
                pongModel.scale.set(30, 30, 30);
                invadersModel.scale.set(3, 3, 3);
            }
            pongModel.position.copy(pongWorldPosition);
            invadersModel.position.copy(invadersWorldPosition);
        }

        function showOptions(container, model) {
            const options = container.querySelectorAll('.game-option');
            const radius = window.innerWidth <= 768 ? 120 : window.innerWidth <= 1200 ? 175 : window.innerWidth <= 1920 ? 250 : 400;
            const totalOptions = options.length;
            const safeRadius = radius;

            options.forEach((option, index) => {
                const angle = ((index * (360 / totalOptions)) - 45) * (Math.PI / 180);
                const x = Math.cos(angle) * safeRadius;
                const y = Math.sin(angle) * safeRadius;

                gsap.to(option, {
                    x: x,
                    y: y,
                    opacity: 1,
                    scale: 1,
                    rotation: 720,
                    duration: 0.8,
                    delay: index * 0.15,
                    ease: "elastic.out(1, 0.7)"
                });
            });

        }

        function hideOptions(container, model) {
            const options = container.querySelectorAll('.game-option');

            options.forEach(option => {
                gsap.killTweensOf(option);
            });

            options.forEach((option, index) => {
                gsap.to(option, {
                    x: 0,
                    y: 0,
                    opacity: 0,
                    scale: 0,
                    rotation: 0,
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "power2.inOut",
                    onComplete: () => {
                        option.style.transform = 'translate(0, 0) scale(0) rotate(0deg)';
                        option.style.opacity = '0';
                    }
                });
            });

            gsap.killTweensOf(model.position);
        }

        function addContainerListeners(container, model) {
            let isAnimating = false;
            let timeoutId = null;

            container.addEventListener('mouseenter', () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                if (!isAnimating) {
                    isAnimating = true;
                    showOptions(container, model);
                    setTimeout(() => {
                        isAnimating = false;
                    }, 1000);
                }
            });

            container.addEventListener('mouseleave', () => {
                timeoutId = setTimeout(() => {
                    hideOptions(container, model);
                }, 100);
            });
        }

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            updateModelPositions();
        });

        let audioContext;

        function setupEventListeners() {
            const pongSection = document.getElementById('pong-container');
            const invadersSection = document.getElementById('invaders-container');
            const title = document.getElementById('dynamic-title');

            pongSection.addEventListener('mouseenter', () => {
                playSound(440);
                title.textContent = 'PONG';
            });

            invadersSection.addEventListener('mouseenter', () => {
                playSound(523.25);
                title.textContent = 'SPACE INVADERS';
            });
        }

        function playSound(frequency) {
            if (!audioContext) {
                audioContext = new AudioContext();
            }

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
            oscillator.stop(audioContext.currentTime + 0.5);
        }
        setupEventListeners();

        return () => {
            window.removeEventListener('resize', updateModelPositions);
            renderer.dispose();
        };
    }, []);
    const scanlines = Array.from({ length: 10 }, (_, i) => (
        <div
            key={i}
            className="scanline"
        />
    ));
    return (
        <>
            <div id="dynamic-title">Choose Your Game</div>
            <div id="canvas-container">
            </div>
            <div className="game-area">
                <div className="game-container" id="pong-container">
                    <div className="game-title">PONG</div>
                    <Link to="/"><div className="game-option" data-index="0">VS CPU</div></Link> 
                    <Link to="/game-lobby/matchmaking"><div className="game-option" data-index="1">2 PLAYER</div></Link> 
                    <Link to="/"><div className="game-option" data-index="2">TOURNAMENT</div></Link> 
                    <Link to="/"><div className="game-option" data-index="3">PRACTICE</div></Link>
                    <Link to="/"><div className="game-option" data-index="0">OPTIONS</div></Link> 
                </div>

                <div className="game-container" id="invaders-container">
                    <div className="game-title">SPACE INVADERS</div>
                    <Link to="/"><div className="game-option" data-index="0">CLASSIC</div></Link> 
                    <Link to="/"><div className="game-option" data-index="1">ENDLESS</div></Link> 
                    <Link to="/"><div className="game-option" data-index="2">SPEED RUN</div></Link> 
                    <Link to="/"><div className="game-option" data-index="3">BOSS RUSH</div></Link>
                    <Link to="/"><div className="game-option" data-index="0">OPTIONS</div></Link> 
                </div>
            </div>
        </>
    )
}

export default GameChoice
