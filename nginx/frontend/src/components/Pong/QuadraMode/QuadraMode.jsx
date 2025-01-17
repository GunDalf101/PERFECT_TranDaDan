import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import GUI from 'lil-gui';
import gsap from 'gsap';
import { split } from 'three/src/nodes/TSL.js';
import { useNavigate, useLocation } from 'react-router-dom';

const QuadraMode = () => {
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        if (!location.state) {
            navigate('/game-lobby/quadra-register');
        }
    }, [location.state, navigate]);
    if (!location.state) {
        return null;
    }
    const {teams} = location.state;
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);
    const gameObjectsRef = useRef([]);
    const paddleRefP1 = useRef(null);
    const paddleRefP2 = useRef(null);
    const paddleRefP3 = useRef(null);
    const paddleRefP4 = useRef(null);
    const [scores, setScores] = useState({ player: 0, ai: 0 });
    const [matches, setMatches] = useState({ player: 0, ai: 0 });
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
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
        let isGameOver = false;
        let inGame = false;
        let lastHitAI = true;
        let mouseCurrent = { x: 0, y: 0 };

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const ballBoundingBox = new THREE.Box3();
        const paddleBoundingBox = new THREE.Box3();
        const paddleCPUBoundingBox = new THREE.Box3();
        const tableBoundingBox = new THREE.Box3();
        const netBoundingBox = new THREE.Box3();

        scene.background = null;


        const ballSound = new Audio('/sounds/ping_pong.mp3');

        const cameraP1 = new THREE.PerspectiveCamera(
            75,
            (window.innerWidth * 0.5) / (window.innerHeight * 0.5),
            0.1,
            100
        );
        scene.add(cameraP1);

        const cameraP2 = new THREE.PerspectiveCamera(
            75,
            (window.innerWidth * 0.5) / (window.innerHeight * 0.5),
            0.1,
            100
        );
        scene.add(cameraP2);

        const cameraP3 = new THREE.PerspectiveCamera(
            75,
            (window.innerWidth * 0.5) / (window.innerHeight * 0.5),
            0.1,
            100
        );
        scene.add(cameraP3);

        const cameraP4 = new THREE.PerspectiveCamera(
            75,
            (window.innerWidth * 0.5) / (window.innerHeight * 0.5),
            0.1,
            100
        );
        scene.add(cameraP4);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current
        });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x000000, 0);
        renderer.setClearAlpha(0);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const controls = new OrbitControls(cameraP1, canvasRef.current);
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
                paddleRefP1.current = new GameObject(model);
                model.scale.set(1.8, 1.8, 1.8);
                model.position.x = 1.2;
                model.position.y = 5;
                model.position.z = 10;

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                scene.add(model);

                paddleRefP2.current = new GameObject(model.clone());
                paddleRefP2.current.mesh.position.x = -1.2;
                paddleRefP2.current.mesh.position.z = -10;
                scene.add(paddleRefP2.current.mesh);
                paddleRefP3.current = new GameObject(model.clone());
                paddleRefP3.current.mesh.position.x = 1.2;
                paddleRefP3.current.mesh.position.z = -10;
                scene.add(paddleRefP3.current.mesh);
                paddleRefP4.current = new GameObject(model.clone());
                paddleRefP4.current.mesh.position.x = -1.2;
                paddleRefP4.current.mesh.position.z = 10;
                scene.add(paddleRefP4.current.mesh);
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
            if (!paddleRefP1.current || gameObjectsRef.current.length === 0 || !paddleRefP2.current || !paddleRefP3.current || !paddleRefP4.current) return;
            
            const ball = gameObjectsRef.current[gameObjectsRef.current.length - 1];

            if (twoObjCollide(paddleRefP1.current, ball) && lastHitAI) {
                lastHitAI = false;
                ballSound.volume = Math.min(1, 1);
                ballSound.currentTime = 0;
                ballSound.play();
                
                const paddleBox = new THREE.Box3().setFromObject(paddleRefP1.current.mesh);
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
            } else if (twoObjCollide(paddleRefP2.current, ball) && !lastHitAI) {
                lastHitAI = true;
                ballSound.volume = Math.min(1, 1);
                ballSound.currentTime = 0;
                ballSound.play();
                
                const paddleBox = new THREE.Box3().setFromObject(paddleRefP2.current.mesh);
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
            } else if (twoObjCollide(paddleRefP3.current, ball) && !lastHitAI) {
                lastHitAI = true;
                ballSound.volume = Math.min(1, 1);
                ballSound.currentTime = 0;
                ballSound.play();
                
                const paddleBox = new THREE.Box3().setFromObject(paddleRefP3.current.mesh);
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
            } else if (twoObjCollide(paddleRefP4.current, ball) && lastHitAI) {
                lastHitAI = false;
                ballSound.volume = Math.min(1, 1);
                ballSound.currentTime = 0;
                ballSound.play();
                
                const paddleBox = new THREE.Box3().setFromObject(paddleRefP4.current.mesh);
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
            } else if (twoObjCollide(tableObject, ball)) {
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
                        const winningTeam = playerGamesWon > aiGamesWon ? 'red' : 'blue';
                        setWinner(winningTeam);
                        navigate('/game-lobby/quadra-register', {
                            state: {
                                winner: winningTeam,
                                teams: teams
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

        const paddleSpeed = 0.08;
        const smoothFactor = 0.05;
        let paddleP1VelocityX = 0;
        let paddleP1VelocityY = 0;
        let paddleP2VelocityY = 0;
        let paddleP2VelocityX = 0;
        let paddleP3VelocityY = 0;
        let paddleP3VelocityX = 0;
        let paddleP4VelocityY = 0;
        let paddleP4VelocityX = 0;

        const handleKeyDown = (event) => {
            if (event.key === 'ArrowUp') {
                paddleP1VelocityY = paddleSpeed;
            }
            if (event.key === 'ArrowDown') {
                paddleP1VelocityY = -paddleSpeed;
            }
            if (event.key === 'ArrowLeft') {
                paddleP1VelocityX = -paddleSpeed;
            }
            if (event.key === 'ArrowRight') {
                paddleP1VelocityX = paddleSpeed;
            }
            if (event.key === 'W' || event.key === 'w') {
                paddleP2VelocityY = paddleSpeed;
            }
            if (event.key === 'S' || event.key === 's') {
                paddleP2VelocityY = -paddleSpeed;
            }
            if (event.key === 'A' || event.key === 'a') {
                paddleP2VelocityX = paddleSpeed;
            }
            if (event.key === 'D' || event.key === 'd') {
                paddleP2VelocityX = -paddleSpeed;
            }
            if (event.key === 'I' || event.key === 'i') {
                paddleP3VelocityY = paddleSpeed;
            }
            if (event.key === 'K' || event.key === 'k') {
                paddleP3VelocityY = -paddleSpeed;
            }
            if (event.key === 'J' || event.key === 'j') {
                paddleP3VelocityX = paddleSpeed;
            }
            if (event.key === 'L' || event.key === 'l') {
                paddleP3VelocityX = -paddleSpeed;
            }
            if (event.key === '8') {
                paddleP4VelocityY = paddleSpeed;
            }
            if (event.key === '5') {
                paddleP4VelocityY = -paddleSpeed;
            }
            if (event.key === '6') {
                paddleP4VelocityX = paddleSpeed;
            }
            if (event.key === '4') {
                paddleP4VelocityX = -paddleSpeed;
            }
            if (event.key === 'Enter') {
                inGame = !inGame;
                controls.enableRotate = !inGame;
            }
        };

        const handleKeyUp = (event) => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                paddleP1VelocityY = 0;
            }
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                paddleP1VelocityX = 0;
            }
            if (event.key === 'W' || event.key === 'w' || event.key === 'S' || event.key === 's') {
                paddleP2VelocityY = 0;
            }
            if (event.key === 'A' || event.key === 'a' || event.key === 'D' || event.key === 'd') {
                paddleP2VelocityX = 0;
            }
            if (event.key === 'I' || event.key === 'i' || event.key === 'K' || event.key === 'k') {
                paddleP3VelocityY = 0;
            }
            if (event.key === 'J' || event.key === 'j' || event.key === 'L' || event.key === 'l') {
                paddleP3VelocityX = 0;
            }
            if (event.key === '8' || event.key === '5') {
                paddleP4VelocityY = 0;
            }
            if (event.key === '4' || event.key === '6') {
                paddleP4VelocityX = 0;
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
            
            cameraP1.aspect = width * 0.5 / (height * 0.5);
            cameraP1.updateProjectionMatrix();
            cameraP2.aspect = width * 0.5 / (height * 0.5);
            cameraP2.updateProjectionMatrix();
            cameraP3.aspect = width * 0.5 / (height * 0.5);
            cameraP3.updateProjectionMatrix();
            cameraP4.aspect = width * 0.5 / (height * 0.5);
            cameraP4.updateProjectionMatrix();
            
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
                if (paddleRefP1.current?.mesh && paddleRefP2.current?.mesh && paddleRefP3.current?.mesh && paddleRefP4.current?.mesh) {
                    
                    const cameraOffset = new THREE.Vector3(0, 2.5, 4);
                    const splitCameraOffset = new THREE.Vector3(0, 2.5, -4);
                    const lookAtOffset = new THREE.Vector3(0, 1, 0);

                    const player1PaddlePos = paddleRefP1.current.mesh.position.clone();
                    const target1CameraPos = player1PaddlePos.clone().add(cameraOffset);
                    const target1LookAt = player1PaddlePos.clone().add(lookAtOffset);

                    const player2PaddlePos = paddleRefP2.current.mesh.position.clone();
                    const target2CameraPos = player2PaddlePos.clone().add(splitCameraOffset);
                    const target2LookAt = player2PaddlePos.clone().add(lookAtOffset);

                    const player3PaddlePos = paddleRefP3.current.mesh.position.clone();
                    const target3CameraPos = player3PaddlePos.clone().add(splitCameraOffset);
                    const target3LookAt = player3PaddlePos.clone().add(lookAtOffset);

                    const player4PaddlePos = paddleRefP4.current.mesh.position.clone();
                    const target4CameraPos = player4PaddlePos.clone().add(cameraOffset);
                    const target4LookAt = player4PaddlePos.clone().add(lookAtOffset);

                    cameraP1.position.lerp(target1CameraPos, 0.05);
                    cameraP2.position.lerp(target2CameraPos, 0.05);
                    cameraP3.position.lerp(target3CameraPos, 0.05);
                    cameraP4.position.lerp(target4CameraPos, 0.05);

                    const current1LookAt = new THREE.Vector3(cameraP1.position.x, cameraP1.position.y, cameraP1.position.z);
                    const current2LookAt = new THREE.Vector3(cameraP2.position.x, cameraP2.position.y, cameraP2.position.z);
                    const current3LookAt = new THREE.Vector3(cameraP3.position.x, cameraP3.position.y, cameraP3.position.z);
                    const current4LookAt = new THREE.Vector3(cameraP4.position.x, cameraP4.position.y, cameraP4.position.z);

                    const newLookAt1 = target1LookAt.lerp(current1LookAt, 0.05);
                    const newLookAt2 = target2LookAt.lerp(current2LookAt, 0.05);
                    const newLookAt3 = target3LookAt.lerp(current3LookAt, 0.05);
                    const newLookAt4 = target4LookAt.lerp(current4LookAt, 0.05);

                    cameraP1.lookAt(newLookAt1);
                    cameraP2.lookAt(newLookAt2);
                    cameraP3.lookAt(newLookAt3);
                    cameraP4.lookAt(newLookAt4);


                    paddleP1VelocityX = lerp(paddleP1VelocityX, paddleP1VelocityX, smoothFactor);
                    paddleP1VelocityY = lerp(paddleP1VelocityY, paddleP1VelocityY, smoothFactor);
                    paddleP2VelocityX = lerp(paddleP2VelocityX, paddleP2VelocityX, smoothFactor);
                    paddleP2VelocityY = lerp(paddleP2VelocityY, paddleP2VelocityY, smoothFactor);
                    paddleP3VelocityY = lerp(paddleP3VelocityY, paddleP3VelocityY, smoothFactor);
                    paddleP3VelocityY = lerp(paddleP3VelocityY, paddleP3VelocityY, smoothFactor);
                    paddleP4VelocityY = lerp(paddleP4VelocityY, paddleP4VelocityY, smoothFactor);
                    paddleP4VelocityY = lerp(paddleP4VelocityY, paddleP4VelocityY, smoothFactor);

                    paddleRefP1.current.mesh.position.x += paddleP1VelocityX;
                    paddleRefP1.current.mesh.position.y += paddleP1VelocityY;
                    paddleRefP2.current.mesh.position.x += paddleP2VelocityX;
                    paddleRefP2.current.mesh.position.y += paddleP2VelocityY;
                    paddleRefP3.current.mesh.position.x += paddleP3VelocityX;
                    paddleRefP3.current.mesh.position.y += paddleP3VelocityY;
                    paddleRefP4.current.mesh.position.x += paddleP4VelocityX;
                    paddleRefP4.current.mesh.position.y += paddleP4VelocityY;

                    if (tableBoundsRef.current) {
                        if (paddleRefP1.current.mesh.position.x < tableBoundsRef.current.min.x) {
                            paddleRefP1.current.mesh.position.x = tableBoundsRef.current.min.x;
                        } else if (paddleRefP1.current.mesh.position.x > tableBoundsRef.current.max.x) {
                            paddleRefP1.current.mesh.position.x = tableBoundsRef.current.max.x;
                        }

                        if (paddleRefP1.current.mesh.position.y < tableBoundsRef.current.min.y - 0.5) {
                            paddleRefP1.current.mesh.position.y = tableBoundsRef.current.min.y - 0.5;
                        } else if (paddleRefP1.current.mesh.position.y > tableBoundsRef.current.max.y + 3) {
                            paddleRefP1.current.mesh.position.y = tableBoundsRef.current.max.y + 3;
                        }

                        if (paddleRefP2.current.mesh.position.x < tableBoundsRef.current.min.x) {
                            paddleRefP2.current.mesh.position.x = tableBoundsRef.current.min.x;
                        } else if (paddleRefP2.current.mesh.position.x > tableBoundsRef.current.max.x) {
                            paddleRefP2.current.mesh.position.x = tableBoundsRef.current.max.x;
                        }

                        if (paddleRefP2.current.mesh.position.y < tableBoundsRef.current.min.y - 0.5) {
                            paddleRefP2.current.mesh.position.y = tableBoundsRef.current.min.y - 0.5;
                        } else if (paddleRefP2.current.mesh.position.y > tableBoundsRef.current.max.y + 3) {
                            paddleRefP2.current.mesh.position.y = tableBoundsRef.current.max.y + 3;
                        }

                        if (paddleRefP3.current.mesh.position.x < tableBoundsRef.current.min.x) {
                            paddleRefP3.current.mesh.position.x = tableBoundsRef.current.min.x;
                        } else if (paddleRefP3.current.mesh.position.x > tableBoundsRef.current.max.x) {
                            paddleRefP3.current.mesh.position.x = tableBoundsRef.current.max.x;
                        }

                        if (paddleRefP3.current.mesh.position.y < tableBoundsRef.current.min.y - 0.5) {
                            paddleRefP3.current.mesh.position.y = tableBoundsRef.current.min.y - 0.5;

                        } else if (paddleRefP3.current.mesh.position.y > tableBoundsRef.current.max.y + 3) {
                            paddleRefP3.current.mesh.position.y = tableBoundsRef.current.max.y + 3;
                        }

                        if (paddleRefP4.current.mesh.position.x < tableBoundsRef.current.min.x) {
                            paddleRefP4.current.mesh.position.x = tableBoundsRef.current.min.x;
                        } else if (paddleRefP4.current.mesh.position.x > tableBoundsRef.current.max.x) {
                            paddleRefP4.current.mesh.position.x = tableBoundsRef.current.max.x;
                        }

                        if (paddleRefP4.current.mesh.position.y < tableBoundsRef.current.min.y - 0.5) {
                            paddleRefP4.current.mesh.position.y = tableBoundsRef.current.min.y - 0.5;
                        } else if (paddleRefP4.current.mesh.position.y > tableBoundsRef.current.max.y + 3) {
                            paddleRefP4.current.mesh.position.y = tableBoundsRef.current.max.y + 3;
                        }
                            
                    }

                    if (paddleRefP1.current.mesh.position.x > 0) {
                        gsap.to(paddleRefP1.current.mesh.rotation, {
                            x: 2.81,
                            y: 2.96,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    } else {
                        gsap.to(paddleRefP1.current.mesh.rotation, {
                            x: 2.81,
                            y: 6.28,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    }
                    
                    if (paddleRefP4.current.mesh.position.x > 0) {
                        gsap.to(paddleRefP4.current.mesh.rotation, {
                            x: 2.81,
                            y: 2.96,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    } else {
                        gsap.to(paddleRefP4.current.mesh.rotation, {
                            x: 2.81,
                            y: 6.28,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    }

                    if (paddleRefP2.current?.mesh.position.x > 0) {
                        gsap.to(paddleRefP2.current.mesh.rotation, {
                            x: -2.81,
                            y: 2.96,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    } else {
                        gsap.to(paddleRefP2.current.mesh.rotation, {
                            x: -2.81,
                            y: 6.28,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    }

                    if (paddleRefP3.current?.mesh.position.x > 0) {
                        gsap.to(paddleRefP3.current.mesh.rotation, {
                            x: -2.81,
                            y: 2.96,
                            z: 2.81,
                            duration: 0.095,
                            ease: "power2.inOut",
                        });
                    } else {
                        gsap.to(paddleRefP3.current.mesh.rotation, {
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
            renderer.setScissorTest(true);

            renderer.setViewport(0, 0, window.innerWidth / 2, window.innerHeight / 2);
            renderer.setScissor(0, 0, window.innerWidth / 2, window.innerHeight / 2);
            renderer.render(scene, cameraP2);

            renderer.setViewport(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight / 2);
            renderer.setScissor(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight / 2);
            renderer.render(scene, cameraP1);

            renderer.setViewport(0, window.innerHeight / 2, window.innerWidth / 2, window.innerHeight / 2);
            renderer.setScissor(0, window.innerHeight / 2, window.innerWidth / 2, window.innerHeight / 2);
            renderer.render(scene, cameraP3);

            renderer.setViewport(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth / 2, window.innerHeight / 2);
            renderer.setScissor(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth / 2, window.innerHeight / 2);
            renderer.render(scene, cameraP4);

            requestAnimationFrame(animate);

            renderer.setScissorTest(false);
            if (gameObjectsRef.current.length > 0 && paddleRefP1.current?.mesh && paddleRefP2.current?.mesh && tableObject.mesh && netObject.mesh) {

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
    }, []);

    return (
        <>
            <canvas ref={canvasRef} className="webgl" />
            
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 flex items-center justify-between w-full max-w-5xl px-8 py-6 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full border-4 border-cyan-400 shadow-glow">
                {/* Red Team */}
                <div className="flex items-center space-x-4">
                    {teams.red.map((player, index) => (
                        <div key={`red-${index}`} className="flex items-center space-x-2">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-4 border-rose-400">
                                {player.image && (
                                    <img 
                                        src={player.image} 
                                        alt={player.nickname}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <span className="text-rose-400 text-sm">{player.nickname}</span>
                        </div>
                    ))}
                </div>
                
                {/* Score Display */}
                <div className="flex flex-col items-center">
                    <div className="text-white text-2xl">
                        {scores.player} - {scores.ai}
                    </div>
                    <div className="text-gray-400">
                        Round {matches.player + matches.ai + 1}
                    </div>
                </div>
                
                {/* Blue Team */}
                <div className="flex items-center space-x-4">
                    {teams.blue.map((player, index) => (
                        <div key={`blue-${index}`} className="flex items-center space-x-2">
                            <span className="text-cyan-400 text-sm">{player.nickname}</span>
                            <div className="w-12 h-12 rounded-full overflow-hidden border-4 border-cyan-400">
                                {player.image && (
                                    <img 
                                        src={player.image} 
                                        alt={player.nickname}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Controls Info */}
            <div className="absolute bottom-4 left-4 text-white text-sm space-y-1">
                <p>Red Team Controls:</p>
                <p>Player 1: Arrow Keys</p>
                <p>Player 2: WASD</p>
            </div>
            
            <div className="absolute bottom-4 right-4 text-white text-sm space-y-1 text-right">
                <p>Blue Team Controls:</p>
                <p>Player 1: IJKL</p>
                <p>Player 2: Numpad 8456</p>
            </div>
            
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-lg">
                Press ENTER to start/pause game
            </div>
            
            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-lg text-center border-2 border-cyan-400">
                        <Swords className={`w-16 h-16 mx-auto mb-4 ${winner === 'red' ? 'text-rose-400' : 'text-cyan-400'} animate-pulse`} />
                        <div className={`text-2xl font-bold ${winner === 'red' ? 'text-rose-400' : 'text-cyan-400'} animate-pulse mb-4`}>
                            {winner.toUpperCase()} Team Wins!
                        </div>
                        <button
                            onClick={() => navigate('/game-lobby/quadra-register')}
                            className="bg-transparent text-cyan-400 border-2 border-cyan-400 px-6 py-2 rounded-lg hover:bg-cyan-400/10 transition-colors duration-300"
                        >
                            Back to Lobby
                        </button>
                    </div>
                </div>
            )}
        </>
    );


}

export default QuadraMode;