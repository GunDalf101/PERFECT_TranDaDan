import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gsap from 'gsap';
import { split } from 'three/src/nodes/TSL.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy } from 'lucide-react';

const RemoteMode = () => {
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);
    const websocketRef = useRef(null);
    const gameObjectsRef = useRef([]);
    const paddleRef = useRef(null);
    const paddleOpponentRef = useRef(null);
    const [scores, setScores] = useState({ player1: 0, player2: 0 });
    const [matches, setMatches] = useState({ player1: 0, player2: 0 });
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [errorMessage, setErrorMessage] = useState('');
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 1;
    const reconnectTimeout = useRef(null);
    const reconnectTimeoutId = useRef(null);
    const isReconnecting = useRef(false);
    const [winner, setWinner] = useState(null);
    const navigate = useNavigate();

    const gameSession = JSON.parse(localStorage.getItem('gameSession'));
    if (!gameSession) {
        navigate('/game-lobby/');
        return null;
    }
    const { gameId, username, opponent, isPlayer1 } = gameSession;
    const [gameStatus, setGameStatus] = useState('waiting');

    useEffect(() => {
        if (!canvasRef.current) return;

        let playerScore = 0;
        let aiScore = 0;
        const maxScore = 2;
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
        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }
        const ws = new WebSocket(
            `ws://localhost:8000/ws/game/${gameId}/?username=${username}`
        );
        websocketRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connection opened');
            setConnectionStatus('connected');
            setErrorMessage('');
            reconnectAttempts.current = 0;
            
            const initData = {
                type: 'init',
                username: username,
                opponent: opponent,
                isPlayer1: isPlayer1
            };
            ws.send(JSON.stringify(initData));
        };

        ws.onclose = (event) => {
            console.log('WebSocket connection closed', event);
            setConnectionStatus('disconnected');

            if (gameStatus !== 'completed' && !isReconnecting.current) {
                isReconnecting.current = true;
                setErrorMessage('Connection lost. Attempting to reconnect...');

                if (reconnectTimeoutId.current) {
                    clearTimeout(reconnectTimeoutId.current);
                }

                reconnectTimeoutId.current = setTimeout(() => {
                    setupWebSocket();
                }, 2000);
            }
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch(data.type) {
                case 'game_state':
                    handleGameState(data.state);
                    if (data.state.winner) {
                        handleGameEnd(data.state);
                    }
                    break;
                    
                case 'player_disconnected':
                    setErrorMessage(`${data.message}`);
                    inGame = false;
                    break;
                    
                case 'player_reconnected':
                    setErrorMessage('');
                    setTimeout(() => {
                        inGame = true;
                    }, 3000);
                    break;
                    
                case 'connection_warning':
                    // setErrorMessage(data.message);
                    break;
                    
                case 'game_ended_by_forfeit':
                    handleGameEnd(data.state);
                    setGameStatus('completed');
                    break;
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setErrorMessage('Connection error occurred.');
        };

        const handleGameEnd = (state) => {
            setGameStatus('completed');
            let winnerMessage;
            
            if (state.disconnect_forfeit) {
                winnerMessage = state.winner === username ? 
                    'You won by forfeit (opponent disconnected)' : 
                    `${state.winner} won by forfeit (you disconnected)`;
            } else {
                winnerMessage = state.winner === username ? 'You won!' : `${state.winner} won!`;
            }
            
            setWinner(winnerMessage);
        };


        const handleGameState = (state) => {
            updatePaddlePositions(state);
            if (state.player1 !== username) {
                updateBallPosition(state);
            }
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
            if (ball) {
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

        const controls = new OrbitControls(camera, canvasRef.current);
        controls.enableDamping = true;

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
                const gravity = -9.82;
                obj.velocity.y += gravity * deltaTime;
        
                const airResistance = 1;
                obj.velocity.multiplyScalar(airResistance);

                const scaledVelocity = obj.velocity.clone().multiplyScalar(deltaTime);
                obj.position.add(scaledVelocity);
        
                if (obj.position.y < 0.5) {
                    obj.velocity.y *= -0.5;
                    obj.position.y = 0.5;
                }
                obj.mesh.position.copy(obj.position);
            });
        };
        

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

        const checkCollisions = () => {
            if (!paddleRef.current || gameObjectsRef.current.length === 0 || !paddleOpponentRef.current) return;
            
            const ball = gameObjectsRef.current[gameObjectsRef.current.length - 1];

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
                let forceZ = Math.log(ballHeight / paddleHeight + 1) * 13 + 10;
                
                playerSideBounces = 0;
                aiSideBounces = 0;
                
                ball.velocity = new THREE.Vector3(0, 0, 0);
                ball.applyImpulse(new THREE.Vector3(forceX, forceY, forceZ));
            }

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
            } else if (twoObjCollide(netObject, ball)) {
                ballSound.volume = Math.min(1, 1);
                ballSound.currentTime = 0;
                // ballSound.play();

                ball.velocity.z = -ball.velocity.z * 0.5;
                ball.velocity.x += (Math.random() - 0.5) * 0.2;
                ball.velocity.y *= 0.9;
                ball.position.z += ball.velocity.z * 0.01;
            }
        };

        const handleBeforeUnload = (e) => {
            if (gameStatus !== 'completed') {
                ws.close();
            }
        };

        const resetBall = (direction = 1) => {
            gameObjectsRef.current.forEach(obj => {
                scene.remove(obj.mesh);
                obj.mesh.geometry.dispose();
                obj.mesh.material.dispose();
            });
            gameObjectsRef.current = [];
            
            const position = new THREE.Vector3(0, 5.0387, 8 * direction);
            CreateBall(position, direction);

            lastHitAI = direction === -1;
            playerSideBounces = 0;
            aiSideBounces = 0;
        };
        
        const updateScore = () => {
            setScores({ player1: playerScore, player2: aiScore });
            setMatches({ player1: playerGamesWon, player2: aiGamesWon });
        };
        
        const winCheck = () => {
            if (playerScore >= maxScore || aiScore >= maxScore) {
                if (Math.abs(playerScore - aiScore) >= 2) {
                    if (playerScore > aiScore) {
                        playerGamesWon++;
                    } else {
                        aiGamesWon++;
                    }
                    
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'game_won',
                            winner: playerScore > aiScore ? 'player1' : 'player2',
                            matches: {
                                player1: playerGamesWon,
                                player2: aiGamesWon
                            }
                        }));
                    }
                    
                    playerScore = 0;
                    aiScore = 0;
                    
                    if (playerGamesWon >= Math.ceil(maxGames / 2) ||
                        aiGamesWon >= Math.ceil(maxGames / 2)) {
                        isGameOver = true;
                        inGame = false;
                        
                        if (ws && ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({
                                type: 'match_complete',
                                winner: playerGamesWon > aiGamesWon ? 'player1' : 'player2',
                                finalScore: {
                                    player1: playerGamesWon,
                                    player2: aiGamesWon
                                },
                                forfeit: false
                            }));
                        }
                        
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
            
            let scoreUpdate = false;
            let scoringPlayer = null;
        
            if (ball.position.z > tableBounds.max.z + 3 && playerSideBounces === 1) {
                aiScore++;
                scoreUpdate = true;
                scoringPlayer = 'player2';
                updateScore();
                resetBall(-1);
            } else if (ball.position.z < tableBounds.min.z - 3 && aiSideBounces === 1) {
                playerScore++;
                scoreUpdate = true;
                scoringPlayer = 'player1';
                updateScore();
                resetBall(1);
            } else if (ball.position.z > tableBounds.max.z + 3 && playerSideBounces === 0) {
                playerScore++;
                scoreUpdate = true;
                scoringPlayer = 'player1';
                updateScore();
                resetBall(1);
            } else if (ball.position.z < tableBounds.min.z - 3 && aiSideBounces === 0) {
                aiScore++;
                scoreUpdate = true;
                scoringPlayer = 'player2';
                updateScore();
                resetBall(-1);
            }
        
            if (scoreUpdate && ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'score_update',
                    scores: {
                        player1: playerScore,
                        player2: aiScore
                    },
                    scoringPlayer: scoringPlayer,
                    playerGamesWon: playerGamesWon,
                    aiGamesWon: aiGamesWon
                }));
            }
            
            winCheck();
        };

        const handleMouseMove = (event) => {
            mouseCurrent = {
                x: (event.clientX / window.innerWidth) * 2 - 1,
                y: -(event.clientY / window.innerHeight) * 2 + 1
            };
            if (ws && ws.readyState === WebSocket.OPEN && inGame) {
                ws.send(JSON.stringify({ type: 'mouse_move', mouse_position: mouseCurrent }));
            }
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
            
            if (inGame) {
                if (paddleRef.current?.mesh) {
                    console.log("WEEE IN");
                    const ball = gameObjectsRef.current[gameObjectsRef.current.length - 1];
                    if (isPlayer1) {
                        camera.position.set(
                            4 * mouseCurrent.x,
                            6.8 + (1 * mouseCurrent.y),
                            12.8
                        );
                        if (ws && ws.readyState === WebSocket.OPEN)
                            ws.send(JSON.stringify({ type: 'ball_position', ball_position: { x: ball.position.x, y: ball.position.y, z: ball.position.z } }));
                    } else {
                        camera.position.set(
                            -4 * mouseCurrent.x,
                            6.8 + (1 * mouseCurrent.y),
                            -12.8
                        );
                    }


                    const primaryPaddleRef = isPlayer1 ? paddleRef : paddleOpponentRef;
                    const opponentPaddleRef = isPlayer1 ? paddleOpponentRef : paddleRef;

                    camera.lookAt(primaryPaddleRef.current.mesh.position);

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
            controls.update();
            
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
        
        const init = () => {
            setupLighting();
            const { netObject, tableObject } = createTableAndNet();
            CreatePaddle();
            CreateBall(new THREE.Vector3(0, 5.0387, -8));
            
            window.addEventListener('beforeunload', handleBeforeUnload);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('resize', handleResize);
            
            animate();
        };
        
         init();

        return () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
                reconnectTimeout.current = null;
            }
            if (ws) {
                ws.close();
                websocketRef.current = null;
            }
            console.log('WebSocket connection closed');
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            inGame = false;
            reconnectAttempts.current = 0;
            setErrorMessage('');
            setConnectionStatus('connecting');
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    if (object.material.map) object.material.map.dispose();
                    object.material.dispose();
                }
            });
            renderer.dispose();
            if (controls) controls.dispose();
        };

        


    }, []);

    return (
        <>
            <canvas ref={canvasRef} className="webgl" />
        
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 flex items-center justify-between w-full max-w-4xl px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full border-4 border-neon-cyan shadow-glow">

                <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-cyan-400 neon-glow-cyan">
                    <img 
                        src="/api/placeholder/64/64" 
                        alt={isPlayer1 ? username : opponent}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="flex flex-col items-center space-y-2">
                    <div className="text-neon-white text-2xl pixel-font animate-glow">
                        {username}: {scores[isPlayer1 ? 'player1' : 'player2']} | {opponent}: {scores[isPlayer1 ? 'player2' : 'player1']}
                    </div>

                    <div className="text-neon-white text-xl pixel-font">
                        MATCHES - {username}: {matches[isPlayer1 ? 'player1' : 'player2']} | {opponent}: {matches[isPlayer1 ? 'player2' : 'player1']}
                    </div>
                </div>

                <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-rose-400 neon-glow-rose">
                    <img 
                        src="/api/placeholder/64/64" 
                        alt={isPlayer1 ? opponent : username}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            {errorMessage && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-800 to-gray-900 text-neon-white text-lg pixel-font px-6 py-4 rounded-lg border-2 border-neon-red shadow-glow z-50">
                    {errorMessage}
                </div>
            )}

            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-neon-white text-lg pixel-font bg-gray-800/80 px-6 py-2 rounded-full border-2 border-neon-cyan animate-flicker">
                {connectionStatus === 'connecting'
                    ? 'Connecting...'
                    : gameStatus === 'waiting'
                    ? 'Waiting for opponent...'
                    : gameStatus === 'completed'
                    ? 'Game ended'
                    : 'Game in progress'}
            </div>

            {gameStatus === 'completed' && (
                <div className="absolute z-50 inset-0 bg-black/90 flex items-center justify-center">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-lg text-center border-2 border-neon-white neon-glow-white">
                        <Trophy className="w-16 h-16 mx-auto mb-4 text-cyan-400 animate-pulse" />
                        <div className="text-2xl font-bold text-cyan-400 pixel-font animate-glow">
                            {winner}
                        </div>
                        <button
                            onClick={() => navigate('/game-lobby')}
                            className="mt-4 bg-transparent text-neon-white border-2 border-cyan-400 px-6 py-2 rounded-lg hover:bg-cyan-400/20 transition-all duration-300 pixel-font"
                        >
                            Back to Lobby
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default RemoteMode;