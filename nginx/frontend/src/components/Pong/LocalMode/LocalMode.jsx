import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gsap from 'gsap';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy } from 'lucide-react';

const LocalMode = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    
    useEffect(() => {
        if (!location.state) {
            navigate('/game-lobby/local-register');
        }
        
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setIsLandscape(window.innerWidth > window.innerHeight);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [location.state, navigate]);
    
    if (!location.state) {
        return null;
    }
    
    const { player1Name, player2Name, player1Image, player2Image } = location.state;
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);
    const gameObjectsRef = useRef([]);
    const paddleRef = useRef(null);
    const paddleCPURef = useRef(null);
    const [scores, setScores] = useState({ player: 0, ai: 0 });
    const [matches, setMatches] = useState({ player: 0, ai: 0 });
    const [winner, setWinner] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    let tableBoundsRef = useRef(null);

    // Touch controls state
    const [touchControls, setTouchControls] = useState({
        player1: { up: false, down: false, left: false, right: false },
        player2: { up: false, down: false, left: false, right: false }
    });

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
        let inGame = false;
        let lastHitAI = true;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const ballBoundingBox = new THREE.Box3();
        const paddleBoundingBox = new THREE.Box3();
        const paddleCPUBoundingBox = new THREE.Box3();
        const tableBoundingBox = new THREE.Box3();
        const netBoundingBox = new THREE.Box3();

        scene.background = null;

        const ballSound = new Audio('/sounds/ping_pong.mp3');

        // Different camera setup for mobile vs desktop
        const aspectRatio = isLandscape 
            ? window.innerWidth * 0.5 / (window.innerHeight)
            : window.innerWidth / (window.innerHeight * 0.5);
        
        const camera = new THREE.PerspectiveCamera(
            75,
            aspectRatio,
            0.1,
            100
        );
        camera.position.set(10, 10, 15);
        scene.add(camera);
        
        const splitCamera = new THREE.PerspectiveCamera(
            75,
            aspectRatio,
            0.1,
            100
        );
        splitCamera.position.set(-10, 10, 15);
        scene.add(splitCamera);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true
        });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x000000, 0);
        renderer.setClearAlpha(0);
        
        // Initial size - will be updated in handleResize
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const controls = new OrbitControls(camera, canvasRef.current);
        controls.enableDamping = true;
        controls.enablePan = false;

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

                paddleCPURef.current = new GameObject(model.clone());
                paddleCPURef.current.mesh.position.z = -10;
                scene.add(paddleCPURef.current.mesh);
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
                obj.velocity.y += -9.82 * deltaTime;
                obj.position.x += obj.velocity.x * deltaTime;
                obj.position.y += obj.velocity.y * deltaTime;
                obj.position.z += obj.velocity.z * deltaTime;
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
            if (!paddleRef.current || gameObjectsRef.current.length === 0 || !paddleCPURef.current) return;
            
            const ball = gameObjectsRef.current[gameObjectsRef.current.length - 1];

            if (twoObjCollide(paddleRef.current, ball) && lastHitAI) {
                lastHitAI = false;
                ballSound.volume = Math.min(1, 1);
                ballSound.currentTime = 0;
                ballSound.play();
                
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
            } else if (twoObjCollide(paddleCPURef.current, ball) && !lastHitAI) {
                lastHitAI = true;
                ballSound.volume = Math.min(1, 1);
                ballSound.currentTime = 0;
                ballSound.play();
                
                const paddleBox = new THREE.Box3().setFromObject(paddleCPURef.current.mesh);
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
            else if (twoObjCollide(tableObject, ball)) {
                ballSound.volume = Math.min(1, 1);
                ballSound.currentTime = 0;
                ballSound.play();
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
                ballSound.play();

                ball.velocity.z = -ball.velocity.z * 0.5;
                ball.velocity.x += (Math.random() - 0.5) * 0.2;
                ball.velocity.y *= 0.9;
                ball.position.z += ball.velocity.z * 0.01;
            }
        };
        
        const resetBall = (direction = 1) => {
            gameObjectsRef.current.forEach(obj => scene.remove(obj.mesh));
            gameObjectsRef.current = [];
            
            const position = new THREE.Vector3(0, 5.0387, 8 * direction);
            CreateBall(position, direction);

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
                        setGameOver(true);
                        inGame = false;
                        setWinner(playerGamesWon > aiGamesWon ? player1Name : player2Name);
                        navigate('/game-lobby/local-register', {
                            state: {
                                winner: playerGamesWon > aiGamesWon ? 'left' : 'right',
                                player1Name,
                                player2Name,
                                player1Image,
                                player2Image
                            }
                        });
                    }
                    
                    updateScore();
                }
            }
        };

        const gameLogic = () => {
            if (gameObjectsRef.current.length === 0) return;
            
            const ball = gameObjectsRef.current[gameObjectsRef.current.length - 1];
            const tableBounds = new THREE.Box3().setFromObject(tableObject.mesh);
            tableBoundsRef.current = tableBounds;
            
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

        const paddleSpeed = isMobile ? 0.10 : 0.08;
        const smoothFactor = 0.05;
        let paddleVelocityX = 0;
        let paddleVelocityY = 0;
        let paddleCpuVelocityY = 0;
        let paddleCpuVelocityX = 0;

        const handleKeyDown = (event) => {
            if (event.key === 'ArrowUp') {
                paddleVelocityY = paddleSpeed;
            }
            if (event.key === 'ArrowDown') {
                paddleVelocityY = -paddleSpeed;
            }
            if (event.key === 'ArrowLeft') {
                paddleVelocityX = -paddleSpeed;
            }
            if (event.key === 'ArrowRight') {
                paddleVelocityX = paddleSpeed;
            }
            if (event.key === 'W' || event.key === 'w') {
                paddleCpuVelocityY = paddleSpeed;
            }
            if (event.key === 'S' || event.key === 's') {
                paddleCpuVelocityY = -paddleSpeed;
            }
            if (event.key === 'A' || event.key === 'a') {
                paddleCpuVelocityX = paddleSpeed;
            }
            if (event.key === 'D' || event.key === 'd') {
                paddleCpuVelocityX = -paddleSpeed;
            }
            if (event.key === 'Enter') {
                inGame = !inGame;
                setGameStarted(inGame);
                controls.enableRotate = !inGame;
            }
        };

        const handleKeyUp = (event) => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                paddleVelocityY = 0;
            }
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                paddleVelocityX = 0;
            }
            if (event.key === 'W' || event.key === 'w' || event.key === 'S' || event.key === 's') {
                paddleCpuVelocityY = 0;
            }
            if (event.key === 'A' || event.key === 'a' || event.key === 'D' || event.key === 'd') {
                paddleCpuVelocityX = 0;
            }
        };

        const lerp = (current, target, smoothFactor) => {
            return current + (target - current) * smoothFactor;
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
            
            // Update landscape state
            const isCurrentlyLandscape = width > height;
            setIsLandscape(isCurrentlyLandscape);
            
            // Use client dimensions to avoid scrollbars
            const clientWidth = document.documentElement.clientWidth;
            const clientHeight = document.documentElement.clientHeight;
            
            // Adjust aspect ratio based on orientation
            const aspectRatio = isCurrentlyLandscape 
                ? clientWidth * 0.5 / clientHeight
                : clientWidth / (clientHeight * 0.5);
                
            camera.aspect = aspectRatio;
            camera.updateProjectionMatrix();
            splitCamera.aspect = aspectRatio;
            splitCamera.updateProjectionMatrix();
            
            // Set renderer size to client dimensions to avoid scrollbars
            renderer.setSize(clientWidth, clientHeight);
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
                if (paddleRef.current?.mesh && paddleCPURef.current?.mesh) {
                    const cameraOffset = new THREE.Vector3(0, -2.5, 4);
                    const splitCameraOffset = new THREE.Vector3(0, 2.5, 4);
                    const lookAtOffset = new THREE.Vector3(0, 1, 0);

                    const playerPaddlePos = paddleRef.current.mesh.position.clone();
                    const targetCameraPos = playerPaddlePos.clone().add(splitCameraOffset);
                    const targetLookAt = playerPaddlePos.clone().add(lookAtOffset);

                    const cpuPaddlePos = paddleCPURef.current.mesh.position.clone();
                    const targetSplitCameraPos = cpuPaddlePos.clone().sub(cameraOffset);
                    const targetSplitLookAt = cpuPaddlePos.clone().add(lookAtOffset);

                    camera.position.lerp(targetCameraPos, 0.05);
                    splitCamera.position.lerp(targetSplitCameraPos, 0.05);

                    const currentLookAt = new THREE.Vector3();
                    const currentSplitLookAt = new THREE.Vector3();
                    
                    camera.getWorldDirection(currentLookAt);
                    splitCamera.getWorldDirection(currentSplitLookAt);
                    
                    const newLookAt = currentLookAt.lerp(targetLookAt, 0.05);
                    const newSplitLookAt = currentSplitLookAt.lerp(targetSplitLookAt, 0.05);

                    camera.lookAt(newLookAt);
                    splitCamera.lookAt(newSplitLookAt);

                    // Apply paddle movement - keyboard and touch combined
                    paddleVelocityX = lerp(paddleVelocityX, paddleVelocityX, smoothFactor);
                    paddleVelocityY = lerp(paddleVelocityY, paddleVelocityY, smoothFactor);
                    paddleCpuVelocityX = lerp(paddleCpuVelocityX, paddleCpuVelocityX, smoothFactor);
                    paddleCpuVelocityY = lerp(paddleCpuVelocityY, paddleCpuVelocityY, smoothFactor);

                    // Add touch controls velocity
                    if (touchControls.player1.up) paddleVelocityY = paddleSpeed;
                    if (touchControls.player1.down) paddleVelocityY = -paddleSpeed;
                    if (touchControls.player1.left) paddleVelocityX = -paddleSpeed;
                    if (touchControls.player1.right) paddleVelocityX = paddleSpeed;
                    
                    if (touchControls.player2.up) paddleCpuVelocityY = paddleSpeed;
                    if (touchControls.player2.down) paddleCpuVelocityY = -paddleSpeed;
                    if (touchControls.player2.left) paddleCpuVelocityX = paddleSpeed;
                    if (touchControls.player2.right) paddleCpuVelocityX = -paddleSpeed;

                    paddleRef.current.mesh.position.x += paddleVelocityX;
                    paddleRef.current.mesh.position.y += paddleVelocityY;
                    paddleCPURef.current.mesh.position.x += paddleCpuVelocityX;
                    paddleCPURef.current.mesh.position.y += paddleCpuVelocityY;

                    if (tableBoundsRef.current) {
                        if (paddleRef.current.mesh.position.x < tableBoundsRef.current.min.x) {
                            paddleRef.current.mesh.position.x = tableBoundsRef.current.min.x;
                        } else if (paddleRef.current.mesh.position.x > tableBoundsRef.current.max.x) {
                            paddleRef.current.mesh.position.x = tableBoundsRef.current.max.x;
                        }

                        if (paddleRef.current.mesh.position.y < tableBoundsRef.current.min.y - 0.5) {
                            paddleRef.current.mesh.position.y = tableBoundsRef.current.min.y - 0.5;
                        } else if (paddleRef.current.mesh.position.y > tableBoundsRef.current.max.y + 3) {
                            paddleRef.current.mesh.position.y = tableBoundsRef.current.max.y + 3;
                        }

                        if (paddleCPURef.current.mesh.position.x < tableBoundsRef.current.min.x) {
                            paddleCPURef.current.mesh.position.x = tableBoundsRef.current.min.x;
                        } else if (paddleCPURef.current.mesh.position.x > tableBoundsRef.current.max.x) {
                            paddleCPURef.current.mesh.position.x = tableBoundsRef.current.max.x;
                        }

                        if (paddleCPURef.current.mesh.position.y < tableBoundsRef.current.min.y - 0.5) {
                            paddleCPURef.current.mesh.position.y = tableBoundsRef.current.min.y - 0.5;
                        } else if (paddleCPURef.current.mesh.position.y > tableBoundsRef.current.max.y + 3) {
                            paddleCPURef.current.mesh.position.y = tableBoundsRef.current.max.y + 3;
                        }
                    }

                    if (paddleRef.current.mesh.position.x > 0) {
                        gsap.to(paddleRef.current.mesh.rotation, {
                            x: 2.81,
                            y: 2.96,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    } else {
                        gsap.to(paddleRef.current.mesh.rotation, {
                            x: 2.81,
                            y: 6.28,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    }

                    if (paddleCPURef.current?.mesh.position.x > 0) {
                        gsap.to(paddleCPURef.current.mesh.rotation, {
                            x: -2.81,
                            y: 2.96,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    } else {
                        gsap.to(paddleCPURef.current.mesh.rotation, {
                            x: -2.81,
                            y: 6.28,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    }
                }

                simulatePhysics(deltaTime);
                checkCollisions();
                gameLogic();
            }
            
            controls.update();
            
            // Get current client dimensions to prevent scrollbars
            const clientWidth = document.documentElement.clientWidth;
            const clientHeight = document.documentElement.clientHeight;
            
            // Render different layouts based on orientation
            renderer.setScissorTest(true);

            if (isLandscape) {
                // Landscape mode: side by side with fixed dimensions
                const halfWidth = Math.floor(clientWidth / 2);
                const fullHeight = clientHeight;
                
                renderer.setViewport(0, 0, halfWidth, fullHeight);
                renderer.setScissor(0, 0, halfWidth, fullHeight);
                renderer.render(scene, splitCamera);

                renderer.setViewport(halfWidth, 0, halfWidth, fullHeight);
                renderer.setScissor(halfWidth, 0, halfWidth, fullHeight);
                renderer.render(scene, camera);
            } else {
                // Portrait mode: stacked with fixed dimensions
                const fullWidth = clientWidth;
                const halfHeight = Math.floor(clientHeight / 2);
                
                renderer.setViewport(0, halfHeight, fullWidth, halfHeight);
                renderer.setScissor(0, halfHeight, fullWidth, halfHeight);
                renderer.render(scene, splitCamera);

                renderer.setViewport(0, 0, fullWidth, halfHeight);
                renderer.setScissor(0, 0, fullWidth, halfHeight);
                renderer.render(scene, camera);
            }

            requestAnimationFrame(animate);
            renderer.setScissorTest(false);
            
            if (gameObjectsRef.current.length > 0 && paddleRef.current?.mesh && paddleCPURef.current?.mesh && tableObject.mesh && netObject.mesh) {
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
            const position = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                5.0387,
                -8
            );
            CreateBall(position);

            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            window.addEventListener('resize', handleResize);
            
            // Call handleResize initially to set correct canvas size
            handleResize();
            
            animate();
        };
        
        init();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('resize', handleResize);
            inGame = false;
            
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
    }, [isLandscape]);

    // Function to handle touch controls
    const handleTouchControl = (player, direction, isPressed) => {
        setTouchControls(prev => ({
            ...prev,
            [player]: {
                ...prev[player],
                [direction]: isPressed
            }
        }));
    };

    // Function to start/pause the game
    const toggleGame = () => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        window.dispatchEvent(event);
    };

    return (
        <div className="relative w-full h-full overflow-hidden">
            <canvas ref={canvasRef} className="webgl absolute top-0 left-0 w-full h-full" />
            
            {/* Updated Score display with unified styling */}
            <div className={`
                fixed z-10 flex items-center justify-between 
                ${isLandscape ? 'top-4 left-1/2 transform -translate-x-1/2 w-4/5 max-w-4xl' : 'top-2 left-1/2 transform -translate-x-1/2 w-11/12 max-w-sm'}
                px-4 py-2 bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg
                border-2 border-gradient-to-r from-cyan-400 to-rose-400
            `}>
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-cyan-400">
                        {player2Image && (
                            <img 
                                src={player2Image} 
                                alt={player2Name}
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    <span className="text-cyan-400 text-xs sm:text-base">{player2Name}</span>
                </div>
                
                <div className="flex flex-col items-center mx-2">
                    <div className="text-white text-sm sm:text-xl font-bold">
                        {scores.ai} - {scores.player}
                    </div>
                    <div className="text-gray-400 text-xs sm:text-sm">
                        Round {matches.player + matches.ai + 1}
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    <span className="text-rose-400 text-xs sm:text-base">{player1Name}</span>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-rose-400">
                        {player1Image && (
                            <img 
                                src={player1Image} 
                                alt={player1Name}
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                </div>
            </div>
    
            {/* Updated Start/Pause button */}
            <button
                onClick={toggleGame}
                className={`
                    fixed z-10 bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm
                    text-white px-4 py-2 rounded-full
                    border border-white/30 text-xs sm:text-sm hover:bg-gray-700/80
                    ${isLandscape ? 'left-1/2 transform -translate-x-1/2 bottom-4' : 'left-1/2 transform -translate-x-1/2 bottom-4'}
                    transition-all duration-300 ease-in-out
                `}
            >
                {gameStarted ? "Pause Game" : "Start Game"}
            </button>
    
            {/* Touch controls for mobile */}
            {isMobile && (
                <div className={`fixed z-10 w-full ${isLandscape ? 'h-full' : 'h-1/2 bottom-0'} pointer-events-none`}>
                    {/* Controls divider */}
                    <div className={`absolute ${isLandscape ? 'h-full w-0.5 left-1/2 top-0' : 'w-full h-0.5 top-1/2 left-0'} bg-white/10`}></div>
                    
                    {/* Player 1 controls */}
                    <div className={`absolute pointer-events-auto ${isLandscape ? 'right-4 bottom-20 w-24 h-24' : 'right-4 bottom-16 w-24 h-24'}`}>
                        <div className="relative w-full h-full">
                            <button 
                                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-rose-500/30 rounded-full flex items-center justify-center"
                                onTouchStart={() => handleTouchControl('player1', 'up', true)}
                                onTouchEnd={() => handleTouchControl('player1', 'up', false)}
                            >
                                <span className="text-white text-lg">↑</span>
                            </button>
                            
                            <button 
                                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-rose-500/30 rounded-full flex items-center justify-center"
                                onTouchStart={() => handleTouchControl('player1', 'down', true)}
                                onTouchEnd={() => handleTouchControl('player1', 'down', false)}
                            >
                                <span className="text-white text-lg">↓</span>
                            </button>
                            
                            <button 
                                className="absolute left-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-rose-500/30 rounded-full flex items-center justify-center"
                                onTouchStart={() => handleTouchControl('player1', 'left', true)}
                                onTouchEnd={() => handleTouchControl('player1', 'left', false)}
                            >
                                <span className="text-white text-lg">←</span>
                            </button>
                            
                            <button 
                                className="absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-rose-500/30 rounded-full flex items-center justify-center"
                                onTouchStart={() => handleTouchControl('player1', 'right', true)}
                                onTouchEnd={() => handleTouchControl('player1', 'right', false)}
                            >
                                <span className="text-white text-lg">→</span>
                            </button>
                            
                            <div className="absolute -bottom-6 w-full text-center text-rose-400 text-xs">
                                {player1Name}
                            </div>
                        </div>
                    </div>
                    
                    {/* Player 2 controls */}
                    <div className={`absolute pointer-events-auto ${isLandscape ? 'left-4 bottom-20 w-24 h-24' : 'left-4 top-16 w-24 h-24'}`}>
                        <div className="relative w-full h-full">
                            <button 
                                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-cyan-500/30 rounded-full flex items-center justify-center"
                                onTouchStart={() => handleTouchControl('player2', 'up', true)}
                                onTouchEnd={() => handleTouchControl('player2', 'up', false)}
                            >
                                <span className="text-white text-lg">↑</span>
                            </button>
                            
                            <button 
                                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-cyan-500/30 rounded-full flex items-center justify-center"
                                onTouchStart={() => handleTouchControl('player2', 'down', true)}
                                onTouchEnd={() => handleTouchControl('player2', 'down', false)}
                            >
                                <span className="text-white text-lg">↓</span>
                            </button>
                            
                            <button 
                                className="absolute left-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-cyan-500/30 rounded-full flex items-center justify-center"
                                onTouchStart={() => handleTouchControl('player2', 'left', true)}
                                onTouchEnd={() => handleTouchControl('player2', 'left', false)}
                            >
                                <span className="text-white text-lg">←</span>
                            </button>
                            
                            <button 
                                className="absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-cyan-500/30 rounded-full flex items-center justify-center"
                                onTouchStart={() => handleTouchControl('player2', 'right', true)}
                                onTouchEnd={() => handleTouchControl('player2', 'right', false)}
                            >
                                <span className="text-white text-lg">→</span>
                            </button>
                            
                            <div className="absolute -bottom-6 w-full text-center text-cyan-400 text-xs">
                                {player2Name}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Desktop control instructions */}
            {!isMobile && (
                <div className="fixed z-10 bottom-16 left-1/2 transform -translate-x-1/2
                            bg-black/50 backdrop-blur-sm rounded-lg p-2
                            grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                    <div className="text-rose-400">{player1Name}: Arrow Keys</div>
                    <div className="text-cyan-400">{player2Name}: WASD</div>
                </div>
            )}
            
            {/* Game over screen */}
            {gameOver && (
                <div className="fixed inset-0 z-20 bg-black/80 flex items-center justify-center">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 rounded-lg text-center border-2 border-gradient-to-r from-cyan-400 to-rose-400 max-w-xs sm:max-w-md">
                        <Trophy className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${winner === player1Name ? 'text-rose-400' : 'text-cyan-400'} animate-pulse`} />
                        <div className={`text-xl sm:text-2xl font-bold ${winner === player1Name ? 'text-rose-400' : 'text-cyan-400'} animate-pulse mb-4`}>
                            {winner} Wins!
                        </div>
                        <div className="text-white/70 text-sm mb-4">
                            Final Score: {matches.player} - {matches.ai}
                        </div>
                        <button
                            onClick={() => navigate('/game-lobby/local-register')}
                            className="bg-transparent text-white border-2 border-gradient-to-r from-cyan-400 to-rose-400 px-4 sm:px-6 py-2 rounded-lg hover:bg-gradient-to-r hover:from-cyan-400/10 hover:to-rose-400/10 transition-colors duration-300 text-sm sm:text-base"
                        >
                            Back to Lobby
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocalMode;