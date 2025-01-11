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
    const [scores, setScores] = useState({ player: 0, ai: 0 });
    const [matches, setMatches] = useState({ player: 0, ai: 0 });
    
    // Get game session from localStorage
    const gameSession = JSON.parse(localStorage.getItem('gameSession'));
    const { gameId, username, opponent, isPlayer1 } = gameSession;
    const [gameStatus, setGameStatus] = useState('waiting');

    useEffect(() => {
        if (!canvasRef.current) return;

        let playerScore = 0;
        let aiScore = 0;
        const maxScore = 11;
        let playerGamesWon = 0;
        let aiGamesWon = 0;
        let maxGames = 3;
        let playerSideBounces = 0;
        let aiSideBounces = 0;
        let isGameOver = false;
        let inGame = false;
        let lastHitAI = true;
        let mouseCurrent = { x: 0, y: 0 };
        const ballSound = new Audio('/sounds/ping_pong.mp3');

        console.log(gameId, username, opponent, isPlayer1);
        // const ws = new WebSocket(
        //     `ws://localhost:8000/ws/game/${gameId}/?username=${username}`
        // );
        // websocketRef.current = ws;

        // ws.onopen = () => {
        //     console.log('WebSocket connection opened');
        //     const initData = {
        //         type: 'init',
        //         username: username,
        //         opponent: opponent,
        //         isPlayer1: isPlayer1
        //     }
        //     ws.send(JSON.stringify(initData));
        // };

        // ws.onmessage = (event) => {
        //     const data = JSON.parse(event.data);

        //     if (data.type === 'game_state') {
        //         handleGameState(data.state);
        //     }

        // };

        // ws.onclose = () => {
        //     console.log('WebSocket connection closed');
        // };

        const handleGameState = (state) => {
            updatePaddlePositions(state);
            // updateBallPosition(state);
        };
        const updatePaddlePositions = (state) => {
            const paddleOpponent = paddleOpponentRef.current;
            const paddlePlayer = paddleRef.current;
            if (paddleOpponent && paddlePlayer) {
                if (state.player1 === username) {
                    paddlePlayer.mesh.position.x = state.paddle1_position.x;
                    paddlePlayer.mesh.position.y = state.paddle1_position.y;
                    paddlePlayer.mesh.position.z = state.paddle1_position.z;
                    paddleOpponent.mesh.position.x = state.paddle2_position.x;
                    paddleOpponent.mesh.position.y = state.paddle2_position.y;
                    paddleOpponent.mesh.position.z = state.paddle2_position.z;
                } else {
                    paddlePlayer.mesh.position.x = state.paddle2_position.x;
                    paddlePlayer.mesh.position.y = state.paddle2_position.y;
                    paddlePlayer.mesh.position.z = state.paddle2_position.z;
                    paddleOpponent.mesh.position.x = state.paddle1_position.x;
                    paddleOpponent.mesh.position.y = state.paddle1_position.y;
                    paddleOpponent.mesh.position.z = state.paddle1_position.z;
                }
            }
        };

        const updateBallPosition = (state) => {
            const ball = gameObjectsRef.current[gameObjectsRef.current.length - 1];
            if (ball && state.player1 !== username) {
                ball.mesh.position.x = state.ball_position.x;
                ball.mesh.position.y = state.ball_position.y;
                ball.mesh.position.z = state.ball_position.z;
            }
        };

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const paddleOpponentBoundingBox = new THREE.Box3();
        const paddlePlayerBoundingBox = new THREE.Box3();
        const tableBoundingBox = new THREE.Box3();
        const netBoundingBox = new THREE.Box3();


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

        class GameObject {
            static id = 0;
            constructor(mesh, mass = 1) {
                this.id = GameObject.id++;
                this.position = mesh.position;
                this.mass = mass;
                this.velocity = new THREE.Vector3(0, 0, 0);
                this.mesh = mesh;
            }

            applyImpulse(impulse) {
                const impulseVector = impulse.clone().divideScalar(this.mass);
                this.velocity.add(impulseVector);
            }
        }

        const CreateBall = (position, direction = -1) => {
            console.log('create ball');
            const radius = 0.1;
            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(radius),
                new THREE.MeshStandardMaterial({
                    metalness: 0.3,
                    roughness: 0.4,
                })
            );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.position.copy(position);

            const ballObject = new GameObject(mesh);
            scene.add(mesh);

            ballObject.applyImpulse(new THREE.Vector3(0, 4, 14 * -direction));
            gameObjectsRef.current.push(ballObject);
        };
        const CreatePaddle = () => {
            const loader = new GLTFLoader();
            loader.load('/models/paddle_test.gltf', (gltf) => {
                const model = gltf.scene;
                paddleRef.current = new GameObject(model);
                model.scale.set(1.8, 1.8, 1.8);
                model.position.y = 4.0387;
                model.position.z = 10;

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                scene.add(model);

                paddleOpponentRef.current = new GameObject(model.clone());
                paddleOpponentRef.current.mesh.position.z = -10;
                scene.add(paddleOpponentRef.current.mesh);
            });
        };

        let tableObject;
        let netObject;

        const createTableAndNet = () => {
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
            netObject = new GameObject(net);

            scene.add(net);

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
            tableObject = new GameObject(table);
            scene.add(table);

            return { netObject, tableObject };
        };

        const simulatePhysics = (deltaTime) => {
            gameObjectsRef.current.forEach(obj => {
                // Scale gravity by deltaTime
                const gravity = -9.82;
                obj.velocity.y += gravity * deltaTime;
        
                // Apply air resistance
                const airResistance = 1;
                obj.velocity.multiplyScalar(airResistance);
        
                // Update positions with scaled velocities
                const scaledVelocity = obj.velocity.clone().multiplyScalar(deltaTime);
                obj.position.add(scaledVelocity);
        
                // Ground collision with energy loss
                if (obj.position.y < 0.5) {
                    obj.velocity.y *= -0.5;
                    obj.position.y = 0.5;
                }
        
                // Update mesh position
                obj.mesh.position.copy(obj.position);
        
                // Sync ball position if we're player1
                // if (isPlayer1 && ws && ws.readyState === WebSocket.OPEN) {
                //     ws.send(JSON.stringify({
                //         type: 'ball_state',
                //         position: obj.position,
                //         velocity: obj.velocity
                //     }));
                // }
            });
        };
        

        
        // Collision detection
        const collisionTimestamps = new Map();
        const collisionDelay = 100;
        
        const twoObjCollide = (objA, objB) => {
            const boxA = new THREE.Box3().setFromObject(objA.mesh);
            const boxB = new THREE.Box3().setFromObject(objB.mesh);
            
            if (boxA.intersectsBox(boxB)) {
                const currentTime = performance.now();
                const key = `${objA.id}-${objB.id}`;
                
                if (!collisionTimestamps.has(key) ||
                currentTime - collisionTimestamps.get(key) > collisionDelay) {
                    collisionTimestamps.set(key, currentTime);
                    return true;
                }
            }
            return false;
        };
        
        // Add this after the collision detection functions and before the animation loop
        const checkCollisions = () => {
            if (!paddleRef.current || gameObjectsRef.current.length === 0 || !paddleOpponentRef.current) return;
            
            const ball = gameObjectsRef.current[gameObjectsRef.current.length - 1];
            
            // Paddle collision
            if (twoObjCollide(paddleRef.current, ball) && lastHitAI) {
                lastHitAI = false;
                ballSound.volume = Math.min(1, 1);
                ballSound.currentTime = 0;
                // ballSound.play();
                
                const paddleBox = new THREE.Box3().setFromObject(paddleRef.current.mesh);
                const ballWidth = ball.position.x - paddleBox.min.x;
                const paddleWidth = paddleBox.max.x - paddleBox.min.x;
                const hitDirection = ballWidth / paddleWidth;
                
                let forceX = -(hitDirection - paddleWidth / 2) * 3;
                const ballHeight = ball.position.y - paddleBox.min.y;
                const paddleHeight = paddleBox.max.y - paddleBox.min.y;
                let forceY = Math.log(ballHeight / paddleHeight + 1) * 6 + 2;
                let forceZ = Math.log(ballHeight / paddleHeight + 1) * 13 + 10;
                
                playerSideBounces = 0;
                aiSideBounces = 0;
                
                ball.velocity = new THREE.Vector3(0, 0, 0);
                ball.applyImpulse(new THREE.Vector3(forceX, forceY, -forceZ));
            }
            
            // CPU paddle collision
            else if (twoObjCollide(paddleOpponentRef.current, ball) && !lastHitAI) {
                lastHitAI = true;
                ballSound.volume = Math.min(1, 1);
                ballSound.currentTime = 0;
                // ballSound.play();
                
                const paddleBox = new THREE.Box3().setFromObject(paddleOpponentRef.current.mesh);
                const ballWidth = ball.position.x - paddleBox.min.x;
                const paddleWidth = paddleBox.max.x - paddleBox.min.x;
                const hitDirection = ballWidth / paddleWidth;
                
                let forceX = (hitDirection - paddleWidth / 2) * 3;
                const ballHeight = ball.position.y - paddleBox.min.y;
                const paddleHeight = paddleBox.max.y - paddleBox.min.y;
                let forceY = Math.log(ballHeight / paddleHeight + 1) * 6 + 2;
                
                playerSideBounces = 0;
                aiSideBounces = 0;
                
                ball.velocity = new THREE.Vector3(0, 0, 0);
                ball.applyImpulse(new THREE.Vector3(forceX, forceY, 16));
            }
            
            // Table collision
            else if (twoObjCollide(tableObject, ball)) {
                ballSound.volume = Math.min(1, 1);
                ballSound.currentTime = 0;
                // ballSound.play();
                
                ball.velocity.y = -ball.velocity.y;
                
                if (ball.position.z < 0) {
                    aiSideBounces++;
                    if (aiSideBounces === 2) {
                        playerScore++;
                        updateScore();
                        resetBall(-1);
                    }
                } else if (ball.position.z > 0) {
                    playerSideBounces++;
                    if (playerSideBounces === 2) {
                        aiScore++;
                        updateScore();
                        resetBall(1);
                    }
                }
            }

            // Net collision
            else if (twoObjCollide(netObject, ball)) {
                ballSound.volume = Math.min(1, 1);
                ballSound.currentTime = 0;
                // ballSound.play();

                ball.velocity.z = -ball.velocity.z * 0.5;
                ball.velocity.x += (Math.random() - 0.5) * 0.2;
                ball.velocity.y *= 0.9;
                ball.position.z += ball.velocity.z * 0.01;
            }
        };

        const handleClick = () => {
            
            if (gameObjectsRef.current.length > 0) {
                gameObjectsRef.current.forEach(obj => scene.remove(obj.mesh));
                gameObjectsRef.current = [];
            }
            lastHitAI = true;
            const position = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                5.0387,
                -8
            );
            CreateBall(position);
        }

        // Game logic functions
        const resetBall = (direction = 1) => {
            gameObjectsRef.current.forEach(obj => {
                scene.remove(obj.mesh);
                obj.mesh.geometry.dispose();
                obj.mesh.material.dispose();
            });
            gameObjectsRef.current = [];
            
            const position = new THREE.Vector3(0, 5.0387, 8 * direction);
            // CreateBall(position, direction);

            lastHitAI = direction === -1;
            playerSideBounces = 0;
            aiSideBounces = 0;
        };
        
        const updateScore = () => {
            setScores({ player: playerScore, ai: aiScore });
            setMatches({ player: playerGamesWon, ai: aiGamesWon });
        };
        
        const winCheck = () => {
            if (playerScore >= maxScore || aiScore >= maxScore) {
                if (Math.abs(playerScore - aiScore) >= 2) {
                    if (playerScore > aiScore) {
                        playerGamesWon++;
                    } else {
                        aiGamesWon++;
                    }
                    
                    playerScore = 0;
                    aiScore = 0;
                    
                    if (playerGamesWon >= Math.ceil(maxGames / 2) ||
                    aiGamesWon >= Math.ceil(maxGames / 2)) {
                        isGameOver = true;
                        inGame = false;
                        playerGamesWon = 0;
                        aiGamesWon = 0;
                    }
                    
                    updateScore();
                }
            }
        };

        const gameLogic = () => {
            if (gameObjectsRef.current.length === 0) return;
            
            const ball = gameObjectsRef.current[gameObjectsRef.current.length - 1];
            const tableBounds = new THREE.Box3().setFromObject(tableObject.mesh);
            
            if (ball.position.z > tableBounds.max.z + 3 && playerSideBounces === 1) {
                aiScore++;
                updateScore();
                resetBall(-1);
            } else if (ball.position.z < tableBounds.min.z - 3 && aiSideBounces === 1) {
                playerScore++;
                updateScore();
                resetBall(1);
            } else if (ball.position.z > tableBounds.max.z + 3 && playerSideBounces === 0) {
                playerScore++;
                updateScore();
                resetBall(1);
            } else if (ball.position.z < tableBounds.min.z - 3 && aiSideBounces === 0) {
                aiScore++;
                updateScore();
                resetBall(-1);
            }
            
            winCheck();
        };

        const handleMouseMove = (event) => {
            mouseCurrent = {
                x: (event.clientX / window.innerWidth) * 2 - 1,
                y: -(event.clientY / window.innerHeight) * 2 + 1
            };
            // if (ws && ws.readyState === WebSocket.OPEN) {
            //     ws.send(JSON.stringify({ type: 'mouse_move', mouse_position: mouseCurrent }));
            // }
        };

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

        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        };
        
        const clock = new THREE.Clock();
        let oldElapsedTime = 0;
        
        let isBoundingBoxVisible = false;
        const animate = () => {
            const elapsedTime = clock.getElapsedTime();
            const deltaTime = elapsedTime - oldElapsedTime;
            oldElapsedTime = elapsedTime;
            
            if (true) {
                if (paddleRef.current?.mesh) {
                    const ball = gameObjectsRef.current[gameObjectsRef.current.length - 1];
                    if (isPlayer1) {
                        camera.position.set(
                            4 * mouseCurrent.x,
                            6.8 + (0.4 * mouseCurrent.y),
                            12.8
                        );
                        // if (ws && ws.readyState === WebSocket.OPEN)
                        //     ws.send(JSON.stringify({ type: 'ball_position', ball_position: { x: ball.position.x, y: ball.position.y, z: ball.position.z } }));
                    } else {
                        camera.position.set(
                            -4 * mouseCurrent.x,
                            6.8 + (0.4 * mouseCurrent.y),
                            -12.8
                        );
                    }
                    camera.lookAt(0, 0, 0);

                    const primaryPaddleRef = isPlayer1 ? paddleRef : paddleOpponentRef;
                    const opponentPaddleRef = isPlayer1 ? paddleOpponentRef : paddleRef;

                    // Primary paddle rotation logic
                    if (primaryPaddleRef.current?.mesh.position.x > 0) {
                        gsap.to(primaryPaddleRef.current.mesh.rotation, {
                            x: 2.81,
                            y: 2.96,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    } else {
                        gsap.to(primaryPaddleRef.current.mesh.rotation, {
                            x: 2.81,
                            y: 6.28,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    }

                    if (opponentPaddleRef.current?.mesh.position.x > 0) {
                        gsap.to(opponentPaddleRef.current.mesh.rotation, {
                            x: -2.81,
                            y: 2.96,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    } else {
                        gsap.to(opponentPaddleRef.current.mesh.rotation, {
                            x: -2.81,
                            y: 6.28,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    }
                }
                if (isPlayer1) {
                    simulatePhysics(deltaTime);
                    checkCollisions();
                    gameLogic();
                }

            }
            
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
            if (gameObjectsRef.current.length >= 0 && paddleRef.current?.mesh && paddleOpponentRef.current?.mesh && tableObject.mesh && netObject.mesh) {
                
                tableBoundingBox.setFromObject(tableObject.mesh);
                netBoundingBox.setFromObject(netObject.mesh);
                if (!isBoundingBoxVisible) {
                    const tableBoxHelper = new THREE.BoxHelper(tableObject.mesh, 0x00ff00);
                    scene.add(tableBoxHelper);
                    const netBoxHelper = new THREE.BoxHelper(netObject.mesh, 0x00ff00);
                    scene.add(netBoxHelper);
                    isBoundingBoxVisible = true;
                }
            
            }
        };
        
        // Initialize scene
        const init = () => {
            setupLighting();
            const { netObject, tableObject } = createTableAndNet();
            CreatePaddle();
            CreateBall(new THREE.Vector3(0, 5.0387, -8));
            
            // Add event listeners
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('resize', handleResize);
            window.addEventListener('click', handleClick);
            
            // Start animation loop
            animate();
        };
        
        // Initialize the scene
        init();

        return () => {
            // ws.close();
            console.log('WebSocket connection closed');
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('click', handleClick);
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    if (object.material.map) object.material.map.dispose();
                    object.material.dispose();
                }
            });
            renderer.dispose();
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
                Player: {scores.player} | AI: {scores.ai}
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
                PlayerMatches: {matches.player} | AI: {matches.ai}
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
                Press ENTER to start/pause game
            </div>
        </>
    );
};

export default RemoteMode;