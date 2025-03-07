import React, { useEffect, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import { Link } from 'react-router-dom'
import './GameChoice.scss'

const GameChoice = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isTablet, setIsTablet] = useState(window.innerWidth < 1200 && window.innerWidth >= 768);
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

    // Handle window resize and orientation changes
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            setIsMobile(width < 768);
            setIsTablet(width < 1200 && width >= 768);
            setIsLandscape(width > height);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    useEffect(() => {
        let audioContext;
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

        let modelUpdateRequired = true;

        // Function to check if container positions changed significantly
        function haveContainersChanged() {
            if (!pongContainer || !invadersContainer) return true;
            
            const pongRect = pongContainer.getBoundingClientRect();
            const invadersRect = invadersContainer.getBoundingClientRect();
            
            // Store positions for comparison
            if (!pongContainer._lastPos) {
                pongContainer._lastPos = { 
                    left: pongRect.left, 
                    top: pongRect.top,
                    width: pongRect.width,
                    height: pongRect.height
                };
                invadersContainer._lastPos = { 
                    left: invadersRect.left, 
                    top: invadersRect.top,
                    width: invadersRect.width,
                    height: invadersRect.height
                };
                return true;
            }
            
            // Check if position changed by more than 5px
            const pongChanged = Math.abs(pongContainer._lastPos.left - pongRect.left) > 5 ||
                Math.abs(pongContainer._lastPos.top - pongRect.top) > 5 ||
                Math.abs(pongContainer._lastPos.width - pongRect.width) > 5 ||
                Math.abs(pongContainer._lastPos.height - pongRect.height) > 5;
                
            const invadersChanged = Math.abs(invadersContainer._lastPos.left - invadersRect.left) > 5 ||
                Math.abs(invadersContainer._lastPos.top - invadersRect.top) > 5 ||
                Math.abs(invadersContainer._lastPos.width - invadersRect.width) > 5 ||
                Math.abs(invadersContainer._lastPos.height - invadersRect.height) > 5;
            
            // Update stored positions
            pongContainer._lastPos = { 
                left: pongRect.left, 
                top: pongRect.top,
                width: pongRect.width,
                height: pongRect.height
            };
            invadersContainer._lastPos = { 
                left: invadersRect.left, 
                top: invadersRect.top,
                width: invadersRect.width,
                height: invadersRect.height
            };
            
            return pongChanged || invadersChanged;
        }

        (async () => {
            try {
                const pongModelIn = await createGameModel('/models/pong/scene.gltf');
                const invadersModelIn = await createGameModel('/models/spaceship/scene.gltf');
                
                // Initial setup
                updateModelScales(pongModelIn, invadersModelIn);
                
                scene.add(pongModelIn);
                scene.add(invadersModelIn);
                pongModel = pongModelIn;
                invadersModel = invadersModelIn;

                function animate() {
                    requestAnimationFrame(animate);
                    
                    // Check if we need to update model positions
                    if (modelUpdateRequired || haveContainersChanged()) {
                        updateModelPositions();
                        modelUpdateRequired = false;
                    }
                    
                    pongModelIn.rotation.z += 0.01;
                    pongModelIn.rotation.x = Math.PI / 3;
                    invadersModelIn.position.y = Math.sin(Date.now() * 0.001);
                    invadersModelIn.rotation.x = 0.5;
                    
                    renderer.render(scene, camera);
                }

                // Initial update
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

        // Function to update model scales based on screen size
        function updateModelScales(pongModel, invadersModel) {
            if (!pongModel || !invadersModel) return;
            
            if (window.innerWidth <= 768) {
                pongModel.scale.set(20, 20, 20);
                invadersModel.scale.set(1.75, 1.75, 1.75);
            } else if (window.innerWidth <= 1200) {
                pongModel.scale.set(30, 30, 30);
                invadersModel.scale.set(3, 3, 3);
            } else {
                pongModel.scale.set(30, 30, 30);
                invadersModel.scale.set(3, 3, 3);
            }
        }

        function screenToWorld(container, camera, renderer) {
            if (!container) return new THREE.Vector3(0, 0, 0);
            
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
            if (!pongModel || !invadersModel || !pongContainer || !invadersContainer) {
                return;
            }

            const pongWorldPosition = screenToWorld(pongContainer, camera, renderer);
            const invadersWorldPosition = screenToWorld(invadersContainer, camera, renderer);
            
            // Consistent offset for all device sizes
            if (isMobile && !isLandscape) {
                // In mobile portrait, position models directly in center of containers
                pongWorldPosition.y += 0;
            } else {
                pongWorldPosition.y -= 2;
            }
            
            // Apply model scale updates
            updateModelScales(pongModel, invadersModel);
            
            // Update positions
            pongModel.position.copy(pongWorldPosition);
            invadersModel.position.copy(invadersWorldPosition);
        }

        function showOptions(container, model) {
            const options = container.querySelectorAll('.game-option');
            
            // Use consistent radius calculation across devices
            let radius;
            if (window.innerWidth <= 768) {
                radius = 120; 
            } else if (window.innerWidth <= 1200) {
                radius = 175;
            } else if (window.innerWidth <= 1920) {
                radius = 250;
            } else {
                radius = 400;
            }
            
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
            let isTouching = false;

            // For mouse devices
            container.addEventListener('mouseenter', () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                if (!isAnimating && !isTouching) {
                    isAnimating = true;
                    showOptions(container, model);
                    setTimeout(() => {
                        isAnimating = false;
                    }, 1000);
                }
            });

            container.addEventListener('mouseleave', () => {
                if (!isTouching) {
                    timeoutId = setTimeout(() => {
                        hideOptions(container, model);
                    }, 100);
                }
            });
            
            // For touch devices
            container.addEventListener('touchstart', (e) => {
                isTouching = true;
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
                // Don't prevent default as it would block links
            });
            
            // Reset touch state
            container.addEventListener('touchend', () => {
                setTimeout(() => {
                    isTouching = false;
                }, 300);
            });
            
            // Close options when touching outside (optional)
            document.addEventListener('touchstart', (e) => {
                if (isTouching && !container.contains(e.target)) {
                    hideOptions(container, model);
                    isTouching = false;
                }
            });
        }

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            
            // Request an update for model positions on next frame
            modelUpdateRequired = true;
        };

        window.addEventListener('resize', handleResize);


        function setupEventListeners() {
            const pongSection = document.getElementById('pong-container');
            const invadersSection = document.getElementById('invaders-container');
            const title = document.getElementById('dynamic-title');

            function initializeAudioContext() {
                if (!audioContext) {
                    audioContext = new AudioContext();
                }
            }

            pongSection.addEventListener('mouseenter', () => {
                initializeAudioContext();
                playSound(440);
                title.textContent = 'PONG';
            });
            
            pongSection.addEventListener('touchstart', () => {
                initializeAudioContext();
                playSound(440);
                title.textContent = 'PONG';
            });

            invadersSection.addEventListener('mouseenter', () => {
                initializeAudioContext();
                playSound(523.25);
                title.textContent = 'SPACE RIVALRY';
            });
            
            invadersSection.addEventListener('touchstart', () => {
                initializeAudioContext();
                playSound(523.25);
                title.textContent = 'SPACE RIVALRY';
            });
        }

        function playSound(frequency) {
            if (!audioContext) return;

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
    }, [isMobile, isTablet, isLandscape]);
    
    const scanlines = Array.from({ length: 10 }, (_, i) => (
        <div
            key={i}
            className="scanline"
        />
    ));
    
    return (
        <>
            <div id="dynamic-title">{isMobile ? "Choose Game" : "Choose Your Game"}</div>
            <div id="canvas-container">
            </div>
            <div className={`game-area ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''}`}>
                <div className="game-container" id="pong-container">
                    <div className="game-title">PONG</div>
                    {/* <Link to="/game-lobby/cpu-mode"><div className="game-option" data-index="0">VS CPU</div></Link> */}
                    <Link to="/game-lobby/matchmaking?gameType=pong"><div className="game-option" data-index="1">REMOTE MODE</div></Link>
                    <Link to="/game-lobby/tournament"><div className="game-option" data-index="2">TOURNAMENT</div></Link>
                    <Link to="/game-lobby/local-register"><div className="game-option" data-index="3">LOCAL MODE</div></Link>
                    <Link to="/game-lobby/quadra-register"><div className="game-option" data-index="4">QUADRA MODE</div></Link>
                    <Link to="/game-lobby/matchmaking?gameType=classic-pong"><div className="game-option" data-index="5">CLASSIC MODE</div></Link>
                </div>

                <div className="game-container" id="invaders-container">
                    <div className="game-title">SPACE RIVALRY</div>
                    <Link to="/game-lobby/space-rivalry"><div className="game-option" data-index="0">SPACE RIVALRY</div></Link>
                    <Link to="/game-lobby/matchmaking?gameType=space-rivalry"><div className="game-option" data-index="1">REMOTE RIVALRY</div></Link>
                    <Link to="/game-lobby/space-rivalry"><div className="game-option" data-index="0">SPACE RIVALRY</div></Link>
                    <Link to="/game-lobby/matchmaking?gameType=space-rivalry"><div className="game-option" data-index="1">REMOTE RIVALRY</div></Link>
                    <Link to="/game-lobby/space-rivalry"><div className="game-option" data-index="0">SPACE RIVALRY</div></Link>
                    <Link to="/game-lobby/matchmaking?gameType=space-rivalry"><div className="game-option" data-index="1">REMOTE RIVALRY</div></Link>

                </div>
            </div>
        </>
    )
}

export default GameChoice