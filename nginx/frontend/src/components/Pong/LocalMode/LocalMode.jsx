import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import GUI from 'lil-gui';
import gsap from 'gsap';
import { split } from 'three/src/nodes/TSL.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy } from 'lucide-react';

const LocalMode = () => {
    const navigate = useNavigate();
    const location = useLocation();
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
    let tableBoundsRef = useRef(null);

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

        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth * 0.5 / (window.innerHeight ),
            0.1,
            100
        );
        camera.position.set(10, 10, 15);
        scene.add(camera);
        const splitCamera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth * 0.5 / (window.innerHeight),
            0.1,
            100
        )
        splitCamera.position.set(-10, 10, 15);
        scene.add(splitCamera);

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

        const paddleSpeed = 0.15;
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
            
            camera.aspect = width  * 0.5 / (height);
            camera.updateProjectionMatrix();
            splitCamera.aspect = width  * 0.5 / (height);
            splitCamera.updateProjectionMatrix();
            
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

                    paddleVelocityX = lerp(paddleVelocityX, paddleVelocityX, smoothFactor);
                    paddleVelocityY = lerp(paddleVelocityY, paddleVelocityY, smoothFactor);
                    paddleCpuVelocityX = lerp(paddleCpuVelocityX, paddleCpuVelocityX, smoothFactor);
                    paddleCpuVelocityY = lerp(paddleCpuVelocityY, paddleCpuVelocityY, smoothFactor);

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
            // renderer.setScissorTest(true);
            // renderer.setViewport(0, window.innerHeight / 2, window.innerWidth, window.innerHeight / 2);
            // renderer.setScissor(0, window.innerHeight / 2, window.innerWidth, window.innerHeight / 2);
            // renderer.render(scene, splitCamera);

            // renderer.setViewport(0, 0, window.innerWidth, window.innerHeight / 2);
            // renderer.setScissor(0, 0, window.innerWidth, window.innerHeight / 2);
            // renderer.render(scene, camera);

            // requestAnimationFrame(animate);
            // renderer.setScissorTest(false);
            renderer.setScissorTest(true);

            renderer.setViewport(0, 0, window.innerWidth / 2, window.innerHeight);
            renderer.setScissor(0, 0, window.innerWidth / 2, window.innerHeight);
            renderer.render(scene, splitCamera);

            renderer.setViewport(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
            renderer.setScissor(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
            renderer.render(scene, camera);

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

            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            window.addEventListener('click', handleClick);
            window.addEventListener('resize', handleResize);
            
            animate();
        };
        
        init();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('click', handleClick);
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
    }, []);

    return (
        <>
            <canvas ref={canvasRef} className="webgl" />
            
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 flex items-center justify-between w-full max-w-4xl px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full border-4 border-cyan-400 shadow-glow">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-cyan-400">
                        {player1Image && (
                            <img 
                                src={player1Image} 
                                alt={player1Name}
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    <span className="text-cyan-400 text-xl">{player1Name}</span>
                </div>
                
                <div className="flex flex-col items-center">
                    <div className="text-white text-2xl">
                        {scores.player} - {scores.ai}
                    </div>
                    <div className="text-gray-400">
                        Round {matches.player + matches.ai + 1}
                    </div>
                </div>
                
                <div className="flex items-center space-x-4">
                    <span className="text-rose-400 text-xl">{player2Name}</span>
                    <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-rose-400">
                        {player2Image && (
                            <img 
                                src={player2Image} 
                                alt={player2Name}
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                </div>
            </div>
    
            <div className="absolute bottom-4 left-4 text-white text-sm space-y-1">
                <p>{player1Name}: Arrow Keys</p>
            </div>
            
            <div className="absolute bottom-4 right-4 text-white text-sm space-y-1 text-right">
                <p>{player2Name}: WASD</p>
            </div>
            
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-lg">
                Press ENTER to start/pause game
            </div>
    
            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-lg text-center border-2 border-cyan-400">
                        <Trophy className={`w-16 h-16 mx-auto mb-4 ${winner === player1Name ? 'text-cyan-400' : 'text-rose-400'} animate-pulse`} />
                        <div className={`text-2xl font-bold ${winner === player1Name ? 'text-cyan-400' : 'text-rose-400'} animate-pulse mb-4`}>
                            {winner} Wins!
                        </div>
                        <button
                            onClick={() => navigate('/game-lobby/local-register')}
                            className="bg-transparent text-cyan-400 border-2 border-cyan-400 px-6 py-2 rounded-lg hover:bg-cyan-400/10 transition-colors duration-300"
                        >
                            Back to Lobby
                        </button>
                    </div>
                </div>
            )}
        </>
    );

};

export default LocalMode;