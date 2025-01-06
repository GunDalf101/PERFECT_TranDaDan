import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gsap from 'gsap';

const RemoteMode = () => {
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);
    const websocketRef = useRef(null);
    const gameObjectsRef = useRef([]);
    const paddleRef = useRef(null);
    const paddleOpponentRef = useRef(null);
    
    // Get game session from localStorage
    const gameSession = JSON.parse(localStorage.getItem('gameSession'));
    const { gameId, username, opponent, isPlayer1 } = gameSession;
    
    const [scores, setScores] = useState({ player1: 0, player2: 0 });
    const [matches, setMatches] = useState({ player1: 0, player2: 0 });
    const [gameStatus, setGameStatus] = useState('waiting');

    useEffect(() => {
        if (!canvasRef.current) return;

        
        // Game state
        let inGame = true;
        let lastHit = isPlayer1 ? 'player2' : 'player1';
        let playerSideBounces = 0;
        let opponentSideBounces = 0;
        let mouseCurrent = { x: 0, y: 0 };
        
        const ballSound = new Audio('/sounds/ping_pong.mp3');
        
        // Initialize WebSocket connection
        if (!websocketRef.current) {
          const ws = new WebSocket(
            `ws://localhost:8000/ws/game/${gameId}/?username=${username}`
          );
          websocketRef.current = ws;
        }
        
        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = null;

        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        camera.position.set(10, 10, 15);
        scene.add(camera);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current
        });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x000000, 0);
        renderer.setClearAlpha(0);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const controls = new OrbitControls(camera, canvasRef.current);
        controls.enableDamping = true;

        // WebSocket message handling
        websocketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'game_state') {
                const state = data.state;
                
                // Update ball position if it exists
                if (gameObjectsRef.current.length > 0) {
                    const ball = gameObjectsRef.current[0];
                    ball.position.set(
                        state.ball_position.x,
                        state.ball_position.y,
                        state.ball_position.z
                    );
                }

                // Update opponent paddle position
                if (paddleOpponentRef.current?.mesh) {
                    const opponentPos = isPlayer1 ? 
                        state.paddle2_position : 
                        state.paddle1_position;
                    
                    paddleOpponentRef.current.mesh.position.set(
                        opponentPos.x,
                        opponentPos.y,
                        opponentPos.z
                    );
                }

                // Update game state
                setScores(state.scores);
                setMatches(state.matches);
                setGameStatus(state.game_status);
                lastHit = state.last_hit;
                playerSideBounces = state.player_side_bounces[isPlayer1 ? 'player1' : 'player2'];
                opponentSideBounces = state.player_side_bounces[isPlayer1 ? 'player2' : 'player1'];
            }
        };

        // Handle mouse movement
        const handleMouseMove = (event) => {
            mouseCurrent = {
                x: (event.clientX / window.innerWidth) * 2 - 1,
                y: -(event.clientY / window.innerHeight) * 2 + 1
            };

            // Send paddle position to server
            if (websocketRef.current.readyState === WebSocket.OPEN && paddleRef.current?.mesh) {
                const paddlePosition = {
                    x: 5.5 * mouseCurrent.x,
                    y: 5.03 + (2 * mouseCurrent.y),
                    z: isPlayer1 ? 10 : -10
                };

                websocketRef.current.send(JSON.stringify({
                    type: 'paddle_position',
                    position: paddlePosition,
                    player: isPlayer1 ? 'player1' : 'player2'
                }));
            }
        };

        // Game object creation functions
        const CreatePaddle = () => {
            const loader = new GLTFLoader();
            loader.load('/models/paddle_test.gltf', (gltf) => {
                const model = gltf.scene;
                paddleRef.current = { mesh: model };
                model.scale.set(1.8, 1.8, 1.8);
                model.position.y = 4.0387;
                model.position.z = isPlayer1 ? 10 : -10;

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                scene.add(model);

                // Create opponent paddle
                paddleOpponentRef.current = { mesh: model.clone() };
                paddleOpponentRef.current.mesh.position.z = isPlayer1 ? -10 : 10;
                scene.add(paddleOpponentRef.current.mesh);
            });
        };

        const createTableAndNet = () => {
            // Table
            const table = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshStandardMaterial({
                    color: '#777777',
                    transparent: true,
                    opacity: 0,
                    metalness: 0.3,
                    roughness: 0.4,
                })
            );
            table.position.set(-0.01, 4, -0.06);
            table.scale.set(8.28, 18.51, 0.3);
            table.receiveShadow = true;
            table.rotation.x = -Math.PI * 0.5;
            scene.add(table);

            // Net
            const net = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshStandardMaterial({
                    color: '#ff0000',
                    transparent: true,
                    opacity: 0,
                    metalness: 0.3,
                    roughness: 0.4,
                })
            );
            net.position.set(0, 4.3, 0);
            net.scale.set(8.28, 0.3, 1.2);
            net.receiveShadow = true;
            net.rotation.x = -Math.PI * 0.5;
            scene.add(net);
        };

        // Lighting setup
        const setupLighting = () => {
            const ambientLight = new THREE.AmbientLight(0xffffff, 2.1);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.set(1024, 1024);
            directionalLight.shadow.camera.far = 15;
            directionalLight.shadow.camera.left = -7;
            directionalLight.shadow.camera.top = 7;
            directionalLight.shadow.camera.right = 7;
            directionalLight.shadow.camera.bottom = -7;
            directionalLight.position.set(5, 5, 5);
            scene.add(directionalLight);
        };

        // Animation loop
        const animate = () => {
            if (inGame) {
                // Update paddle positions based on mouse
                if (paddleRef.current?.mesh) {
                    camera.position.set(
                        4 * mouseCurrent.x,
                        6.8 + (1 * mouseCurrent.y),
                        isPlayer1 ? 12.8 : -12.8
                    );
                    
                    paddleRef.current.mesh.position.x = 5.5 * mouseCurrent.x;
                    paddleRef.current.mesh.position.y = 5.03 + (2 * mouseCurrent.y);

                    // Paddle rotation animation
                    if (paddleRef.current.mesh.position.x > 0) {
                        gsap.to(paddleRef.current.mesh.rotation, {
                            x: isPlayer1 ? 2.81 : -2.81,
                            y: 2.96,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    } else {
                        gsap.to(paddleRef.current.mesh.rotation, {
                            x: isPlayer1 ? 2.81 : -2.81,
                            y: 6.28,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    }
                }
            }

            controls.update();
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };

        // Initialize scene
        const init = () => {
            setupLighting();
            createTableAndNet();
            CreatePaddle();
            
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
            
            animate();
        };

        init();

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            websocketRef.current.close();
            renderer.dispose();
            controls.dispose();
        };
    }, []);

    return (
        <>
            <canvas ref={canvasRef} className="webgl" />
            <div
                style={{
                    position: 'absolute',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'white',
                    fontSize: '24px'
                }}
            >
                {username}: {scores[isPlayer1 ? 'player1' : 'player2']} | {opponent}: {scores[isPlayer1 ? 'player2' : 'player1']}
            </div>
            <div
                style={{
                    position: 'absolute',
                    top: '50px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'white',
                    fontSize: '24px'
                }}
            >
                Matches - {username}: {matches[isPlayer1 ? 'player1' : 'player2']} | {opponent}: {matches[isPlayer1 ? 'player2' : 'player1']}
            </div>
            <div
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'white',
                    fontSize: '16px'
                }}
            >
                {gameStatus === 'waiting' ? 'Waiting for opponent...' : 'Game in progress'}
            </div>
        </>
    );
};

export default RemoteMode;