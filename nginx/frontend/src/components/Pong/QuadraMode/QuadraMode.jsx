import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gsap from 'gsap';
import { useNavigate, useLocation } from 'react-router-dom';
import { Swords } from 'lucide-react';
import { Trophy } from 'lucide-react';

const QuadraMode = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const [gameStarted, setGameStarted] = useState(false);
    
    // Set up responsive detection
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setIsLandscape(window.innerWidth > window.innerHeight);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
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
    
    // Touch controls for all 4 players
    const [touchControls, setTouchControls] = useState({
        player1: { up: false, down: false, left: false, right: false },
        player2: { up: false, down: false, left: false, right: false },
        player3: { up: false, down: false, left: false, right: false },
        player4: { up: false, down: false, left: false, right: false }
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
        const tableBoundingBox = new THREE.Box3();
        const netBoundingBox = new THREE.Box3();

        scene.background = null;

        const ballSound = new Audio('/sounds/ping_pong.mp3');

        // Create responsive cameras
        const aspectRatio = (window.innerWidth * 0.5) / (window.innerHeight * 0.5);
        
        const cameraP1 = new THREE.PerspectiveCamera(
            75,
            aspectRatio,
            0.1,
            100
        );
        scene.add(cameraP1);

        const cameraP2 = new THREE.PerspectiveCamera(
            75,
            aspectRatio,
            0.1,
            100
        );
        scene.add(cameraP2);

        const cameraP3 = new THREE.PerspectiveCamera(
            75,
            aspectRatio,
            0.1,
            100
        );
        scene.add(cameraP3);

        const cameraP4 = new THREE.PerspectiveCamera(
            75,
            aspectRatio,
            0.1,
            100
        );
        scene.add(cameraP4);

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

        const controls = new OrbitControls(cameraP1, canvasRef.current);
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

                // Create paddles for other 3 players
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

        // Adjust paddle speed for mobile
        const paddleSpeed = isMobile ? 0.10 : 0.08;
        const smoothFactor = 0.05;
        
        // Velocity states for all 4 paddles
        let paddleP1VelocityX = 0;
        let paddleP1VelocityY = 0;
        let paddleP2VelocityY = 0;
        let paddleP2VelocityX = 0;
        let paddleP3VelocityY = 0;
        let paddleP3VelocityX = 0;
        let paddleP4VelocityY = 0;
        let paddleP4VelocityX = 0;

        const handleKeyDown = (event) => {
            // Player 1 controls
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
            
            // Player 2 controls
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
            
            // Player 3 controls
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
            
            // Player 4 controls
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
            
            // Start/pause game
            if (event.key === 'Enter') {
                inGame = !inGame;
                setGameStarted(inGame);
                controls.enableRotate = !inGame;
            }
        };

        const handleKeyUp = (event) => {
            // Player 1
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                paddleP1VelocityY = 0;
            }
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                paddleP1VelocityX = 0;
            }
            
            // Player 2
            if (event.key === 'W' || event.key === 'w' || event.key === 'S' || event.key === 's') {
                paddleP2VelocityY = 0;
            }
            if (event.key === 'A' || event.key === 'a' || event.key === 'D' || event.key === 'd') {
                paddleP2VelocityX = 0;
            }
            
            // Player 3
            if (event.key === 'I' || event.key === 'i' || event.key === 'K' || event.key === 'k') {
                paddleP3VelocityY = 0;
            }
            if (event.key === 'J' || event.key === 'j' || event.key === 'L' || event.key === 'l') {
                paddleP3VelocityX = 0;
            }
            
            // Player 4
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
            
            // Update landscape state
            const isCurrentlyLandscape = width > height;
            setIsLandscape(isCurrentlyLandscape);
            
            // Use client dimensions to avoid scrollbars
            const clientWidth = document.documentElement.clientWidth;
            const clientHeight = document.documentElement.clientHeight;
            
            // Calculate new aspect ratio and adjust based on layout
            let newAspectRatio;
            if (isCurrentlyLandscape) { // Landscape
                newAspectRatio = (clientWidth * 0.5) / (clientHeight * 0.5);
            } else { // Portrait - stack the quadrants vertically
                newAspectRatio = clientWidth / (clientHeight * 0.25);
            }
            
            // Update all camera aspect ratios
            cameraP1.aspect = newAspectRatio;
            cameraP1.updateProjectionMatrix();
            cameraP2.aspect = newAspectRatio;
            cameraP2.updateProjectionMatrix();
            cameraP3.aspect = newAspectRatio;
            cameraP3.updateProjectionMatrix();
            cameraP4.aspect = newAspectRatio;
            cameraP4.updateProjectionMatrix();
            
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

                    // Look at targets
                    cameraP1.lookAt(target1LookAt);
                    cameraP2.lookAt(target2LookAt);
                    cameraP3.lookAt(target3LookAt);
                    cameraP4.lookAt(target4LookAt);

                    // Apply smooth velocity for all paddles
                    paddleP1VelocityX = lerp(paddleP1VelocityX, paddleP1VelocityX, smoothFactor);
                    paddleP1VelocityY = lerp(paddleP1VelocityY, paddleP1VelocityY, smoothFactor);
                    paddleP2VelocityX = lerp(paddleP2VelocityX, paddleP2VelocityX, smoothFactor);
                    paddleP2VelocityY = lerp(paddleP2VelocityY, paddleP2VelocityY, smoothFactor);
                    paddleP3VelocityY = lerp(paddleP3VelocityY, paddleP3VelocityY, smoothFactor);
                    paddleP3VelocityX = lerp(paddleP3VelocityX, paddleP3VelocityX, smoothFactor);
                    paddleP4VelocityY = lerp(paddleP4VelocityY, paddleP4VelocityY, smoothFactor);
                    paddleP4VelocityX = lerp(paddleP4VelocityX, paddleP4VelocityX, smoothFactor);

                    // Apply touch controls
                    if (touchControls.player1.up) paddleP1VelocityY = paddleSpeed;
                    if (touchControls.player1.down) paddleP1VelocityY = -paddleSpeed;
                    if (touchControls.player1.left) paddleP1VelocityX = -paddleSpeed;
                    if (touchControls.player1.right) paddleP1VelocityX = paddleSpeed;
                    
                    if (touchControls.player2.up) paddleP2VelocityY = paddleSpeed;
                    if (touchControls.player2.down) paddleP2VelocityY = -paddleSpeed;
                    if (touchControls.player2.left) paddleP2VelocityX = paddleSpeed;
                    if (touchControls.player2.right) paddleP2VelocityX = -paddleSpeed;
                    
                    if (touchControls.player3.up) paddleP3VelocityY = paddleSpeed;
                    if (touchControls.player3.down) paddleP3VelocityY = -paddleSpeed;
                    if (touchControls.player3.left) paddleP3VelocityX = paddleSpeed;
                    if (touchControls.player3.right) paddleP3VelocityX = -paddleSpeed;
                    
                    if (touchControls.player4.up) paddleP4VelocityY = paddleSpeed;
                    if (touchControls.player4.down) paddleP4VelocityY = -paddleSpeed;
                    if (touchControls.player4.left) paddleP4VelocityX = paddleSpeed;
                    if (touchControls.player4.right) paddleP4VelocityX = -paddleSpeed;

                    // Apply velocities to paddles
                    paddleRefP1.current.mesh.position.x += paddleP1VelocityX;
                    paddleRefP1.current.mesh.position.y += paddleP1VelocityY;
                    paddleRefP2.current.mesh.position.x += paddleP2VelocityX;
                    paddleRefP2.current.mesh.position.y += paddleP2VelocityY;
                    paddleRefP3.current.mesh.position.x += paddleP3VelocityX;
                    paddleRefP3.current.mesh.position.y += paddleP3VelocityY;
                    paddleRefP4.current.mesh.position.x += paddleP4VelocityX;
                    paddleRefP4.current.mesh.position.y += paddleP4VelocityY;

                    // Constrain paddle positions to table bounds
                    if (tableBoundsRef.current) {
                        const paddleRefs = [paddleRefP1, paddleRefP2, paddleRefP3, paddleRefP4];
                        paddleRefs.forEach(paddleRef => {
                            const paddle = paddleRef.current.mesh;
                            
                            // X-axis bounds
                            if (paddle.position.x < tableBoundsRef.current.min.x) {
                                paddle.position.x = tableBoundsRef.current.min.x;
                            } else if (paddle.position.x > tableBoundsRef.current.max.x) {
                                paddle.position.x = tableBoundsRef.current.max.x;
                            }

                            // Y-axis bounds
                            if (paddle.position.y < tableBoundsRef.current.min.y - 0.5) {
                                paddle.position.y = tableBoundsRef.current.min.y - 0.5;
                            } else if (paddle.position.y > tableBoundsRef.current.max.y + 3) {
                                paddle.position.y = tableBoundsRef.current.max.y + 3;
                            }
                        });
                    }

                    // Animate paddle rotations based on position
                    const paddleRotations = [
                        { ref: paddleRefP1, positive: { x: 2.81, y: 2.96, z: 2.81 }, negative: { x: 2.81, y: 6.28, z: 2.81 } },
                        { ref: paddleRefP2, positive: { x: -2.81, y: 2.96, z: 2.81 }, negative: { x: -2.81, y: 6.28, z: 2.81 } },
                        { ref: paddleRefP3, positive: { x: -2.81, y: 2.96, z: 2.81 }, negative: { x: -2.81, y: 6.28, z: 2.81 } },
                        { ref: paddleRefP4, positive: { x: 2.81, y: 2.96, z: 2.81 }, negative: { x: 2.81, y: 6.28, z: 2.81 } }
                    ];
                    
                    paddleRotations.forEach(({ ref, positive, negative }) => {
                        const paddle = ref.current.mesh;
                        if (paddle.position.x > 0) {
                            gsap.to(paddle.rotation, {
                                x: positive.x, y: positive.y, z: positive.z,
                                duration: 0.095, ease: "power2.inOut"
                            });
                        } else {
                            gsap.to(paddle.rotation, {
                                x: negative.x, y: negative.y, z: negative.z,
                                duration: 0.095, ease: "power2.inOut"
                            });
                        }
                    });
                }

                simulatePhysics(deltaTime);
                checkCollisions();
                gameLogic();
            }
            
            controls.update();
            
            // Get current client dimensions to prevent scrollbars
            const clientWidth = document.documentElement.clientWidth;
            const clientHeight = document.documentElement.clientHeight;
            
            renderer.setScissorTest(true);
            
            if (isLandscape) {
                // Landscape layout: 2x2 grid with fixed dimensions
                const halfWidth = Math.floor(clientWidth / 2);
                const halfHeight = Math.floor(clientHeight / 2);
                
                renderer.setViewport(0, 0, halfWidth, halfHeight);
                renderer.setScissor(0, 0, halfWidth, halfHeight);
                renderer.render(scene, cameraP2);

                renderer.setViewport(halfWidth, 0, halfWidth, halfHeight);
                renderer.setScissor(halfWidth, 0, halfWidth, halfHeight);
                renderer.render(scene, cameraP1);

                renderer.setViewport(0, halfHeight, halfWidth, halfHeight);
                renderer.setScissor(0, halfHeight, halfWidth, halfHeight);
                renderer.render(scene, cameraP3);

                renderer.setViewport(halfWidth, halfHeight, halfWidth, halfHeight);
                renderer.setScissor(halfWidth, halfHeight, halfWidth, halfHeight);
                renderer.render(scene, cameraP4);
            } else {
                // Portrait layout: stacked 4 rows with fixed dimensions
                const rowHeight = Math.floor(clientHeight / 4);
                const fullWidth = clientWidth;
                
                renderer.setViewport(0, 0, fullWidth, rowHeight);
                renderer.setScissor(0, 0, fullWidth, rowHeight);
                renderer.render(scene, cameraP1);
                
                renderer.setViewport(0, rowHeight, fullWidth, rowHeight);
                renderer.setScissor(0, rowHeight, fullWidth, rowHeight);
                renderer.render(scene, cameraP2);
                
                renderer.setViewport(0, rowHeight * 2, fullWidth, rowHeight);
                renderer.setScissor(0, rowHeight * 2, fullWidth, rowHeight);
                renderer.render(scene, cameraP3);
                
                renderer.setViewport(0, rowHeight * 3, fullWidth, rowHeight);
                renderer.setScissor(0, rowHeight * 3, fullWidth, rowHeight);
                renderer.render(scene, cameraP4);
            }

            requestAnimationFrame(animate);
            renderer.setScissorTest(false);

            // Set up bounding boxes
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

    // Handle touch controls for a player
    const handleTouchControl = (player, direction, isPressed) => {
        setTouchControls(prev => ({
            ...prev,
            [player]: {
                ...prev[player],
                [direction]: isPressed
            }
        }));
    };
    
    // Toggle game start/pause
    const toggleGame = () => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        window.dispatchEvent(event);
    };

    return (
        <div className="relative w-full h-full overflow-hidden">
            <canvas ref={canvasRef} className="webgl absolute top-0 left-0 w-full h-full" />
            
            {/* Updated Score and team display with unified UI styling */}
            <div className={`
                fixed z-10 flex items-center justify-between 
                ${isMobile ? 'top-2 left-1/2 transform -translate-x-1/2 w-11/12 px-3 py-2' : 'top-4 left-1/2 transform -translate-x-1/2 w-4/5 max-w-5xl px-4 py-2'} 
                bg-gray-800/80 backdrop-blur-sm rounded-full
                border-2 border-gradient-to-r from-cyan-400 to-rose-400 shadow-lg
            `}>
                {/* Red Team */}
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                    {teams.red.map((player, index) => (
                        <div key={`red-${index}`} className="flex items-center gap-1 sm:gap-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-rose-400">
                                {player.image && (
                                    <img 
                                        src={player.image} 
                                        alt={player.nickname}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <span className="text-rose-400 text-xs sm:text-sm">{player.nickname}</span>
                        </div>
                    ))}
                </div>
                
                {/* Score Display */}
                <div className="flex flex-col items-center mx-1 sm:mx-4">
                    <div className="text-white text-base sm:text-2xl font-bold">
                        {scores.player} - {scores.ai}
                    </div>
                    <div className="text-gray-400 text-xs sm:text-base">
                        Round {matches.player + matches.ai + 1}
                    </div>
                </div>
                
                {/* Blue Team */}
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                    {teams.blue.map((player, index) => (
                        <div key={`blue-${index}`} className="flex items-center gap-1 sm:gap-2">
                            <span className="text-cyan-400 text-xs sm:text-sm">{player.nickname}</span>
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-cyan-400">
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
            
            {/* Start/Pause button - updated to match unified UI style */}
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
            
            {/* Quadra Mode Indicator */}
            <div className="fixed z-10 bottom-28 left-1/2 transform -translate-x-1/2 bg-gray-900/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-2">
                <Swords className="w-4 h-4 text-yellow-400" />
                <span className="text-white text-xs">Quadra Mode • 2v2</span>
            </div>
            
            {/* Touch controls for mobile */}
            {isMobile && (
                <div className="fixed z-10 inset-0 pointer-events-none">
                    {isLandscape ? (
                        // Landscape layout
                        <>
                            {/* Four corners with controls */}
                            <PlayerTouchControls 
                                player="player1"
                                position="top-right"
                                color="rose"
                                playerName={teams.red[0].nickname}
                                onControlChange={handleTouchControl}
                            />
                            
                            <PlayerTouchControls 
                                player="player2"
                                position="top-left"
                                color="cyan"
                                playerName={teams.blue[0].nickname}
                                onControlChange={handleTouchControl}
                            />
                            
                            <PlayerTouchControls 
                                player="player3"
                                position="bottom-left"
                                color="cyan"
                                playerName={teams.blue[1].nickname}
                                onControlChange={handleTouchControl}
                            />
                            
                            <PlayerTouchControls 
                                player="player4"
                                position="bottom-right"
                                color="rose"
                                playerName={teams.red[1].nickname}
                                onControlChange={handleTouchControl}
                            />
                        </>
                    ) : (
                        // Portrait layout - controls on sides
                        <>
                            <div className="absolute right-2 inset-y-0 flex flex-col justify-around items-center w-16">
                                <PlayerTouchControls 
                                    player="player1"
                                    position="compact"
                                    color="rose"
                                    playerName={teams.red[0].nickname}
                                    onControlChange={handleTouchControl}
                                />
                                
                                <PlayerTouchControls 
                                    player="player4"
                                    position="compact"
                                    color="rose"
                                    playerName={teams.red[1].nickname}
                                    onControlChange={handleTouchControl}
                                />
                            </div>
                            
                            <div className="absolute left-2 inset-y-0 flex flex-col justify-around items-center w-16">
                                <PlayerTouchControls 
                                    player="player2"
                                    position="compact"
                                    color="cyan"
                                    playerName={teams.blue[0].nickname}
                                    onControlChange={handleTouchControl}
                                />
                                
                                <PlayerTouchControls 
                                    player="player3"
                                    position="compact"
                                    color="cyan"
                                    playerName={teams.blue[1].nickname}
                                    onControlChange={handleTouchControl}
                                />
                            </div>
                        </>
                    )}
                </div>
            )}
            
            {/* Desktop control instructions - updated to match unified UI style */}
            {!isMobile && (
                <div className="fixed z-10 bottom-16 left-1/2 transform -translate-x-1/2 
                              bg-black/50 backdrop-blur-sm rounded-lg p-2
                              w-auto max-w-lg grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                    <div className="text-rose-400">{teams.red[0].nickname}: Arrow Keys</div>
                    <div className="text-cyan-400">{teams.blue[0].nickname}: WASD</div>
                    <div className="text-rose-400">{teams.red[1].nickname}: Numpad 8456</div>
                    <div className="text-cyan-400">{teams.blue[1].nickname}: IJKL</div>
                </div>
            )}
            
            {/* Game over screen - updated to match unified UI style */}
            {gameOver && (
                <div className="fixed inset-0 z-20 bg-black/80 flex items-center justify-center">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 rounded-lg text-center border-2 border-gradient-to-r from-cyan-400 to-rose-400 max-w-xs sm:max-w-md">
                        <Swords className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${winner === 'red' ? 'text-rose-400' : 'text-cyan-400'} animate-pulse`} />
                        <div className={`text-xl sm:text-2xl font-bold ${winner === 'red' ? 'text-rose-400' : 'text-cyan-400'} animate-pulse mb-4`}>
                            {winner.toUpperCase()} Team Wins!
                        </div>
                        <div className="text-white/70 text-sm mb-4">
                            Final Score: {winner === 'red' ? scores.player : scores.ai} - {winner === 'red' ? scores.ai : scores.player}
                        </div>
                        <button
                            onClick={() => navigate('/game-lobby/quadra-register')}
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

// Touch controls component for each player - updated with unified styling
const PlayerTouchControls = ({ player, position, color, playerName, onControlChange }) => {
    if (position === "compact") {
        return (
            <div className="relative pointer-events-auto w-16 h-16">
                <button 
                    className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-${color}-500/30 rounded-full flex items-center justify-center`}
                    onTouchStart={() => onControlChange(player, 'up', true)}
                    onTouchEnd={() => onControlChange(player, 'up', false)}
                >
                    <span className="text-white text-xs">↑</span>
                </button>
                
                <button 
                    className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-${color}-500/30 rounded-full flex items-center justify-center`}
                    onTouchStart={() => onControlChange(player, 'down', true)}
                    onTouchEnd={() => onControlChange(player, 'down', false)}
                >
                    <span className="text-white text-xs">↓</span>
                </button>
                
                <button 
                    className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-${color}-500/30 rounded-full flex items-center justify-center`}
                    onTouchStart={() => onControlChange(player, 'left', true)}
                    onTouchEnd={() => onControlChange(player, 'left', false)}
                >
                    <span className="text-white text-xs">←</span>
                </button>
                
                <button 
                    className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-${color}-500/30 rounded-full flex items-center justify-center`}
                    onTouchStart={() => onControlChange(player, 'right', true)}
                    onTouchEnd={() => onControlChange(player, 'right', false)}
                >
                    <span className="text-white text-xs">→</span>
                </button>
                
                <div className={`absolute -bottom-5 w-full text-center text-${color}-400 text-xs`}>
                    {playerName}
                </div>
            </div>
        );
    }
    
    // Position mapping
    const positions = {
        "top-left": "left-4 top-20",
        "top-right": "right-4 top-20",
        "bottom-left": "left-4 bottom-20",
        "bottom-right": "right-4 bottom-20",
    };
    
    return (
        <div className={`absolute ${positions[position]} pointer-events-auto w-20 h-20`}>
            <div className="relative w-full h-full">
                <button 
                    className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-${color}-500/30 rounded-full flex items-center justify-center`}
                    onTouchStart={() => onControlChange(player, 'up', true)}
                    onTouchEnd={() => onControlChange(player, 'up', false)}
                >
                    <span className="text-white text-xs">↑</span>
                </button>
                
                <button 
                    className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-${color}-500/30 rounded-full flex items-center justify-center`}
                    onTouchStart={() => onControlChange(player, 'down', true)}
                    onTouchEnd={() => onControlChange(player, 'down', false)}
                >
                    <span className="text-white text-xs">↓</span>
                </button>
                
                <button 
                    className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-${color}-500/30 rounded-full flex items-center justify-center`}
                    onTouchStart={() => onControlChange(player, 'left', true)}
                    onTouchEnd={() => onControlChange(player, 'left', false)}
                >
                    <span className="text-white text-xs">←</span>
                </button>
                
                <button 
                    className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-${color}-500/30 rounded-full flex items-center justify-center`}
                    onTouchStart={() => onControlChange(player, 'right', true)}
                    onTouchEnd={() => onControlChange(player, 'right', false)}
                >
                    <span className="text-white text-xs">→</span>
                </button>
                
                <div className={`absolute -bottom-6 w-full text-center text-${color}-400 text-xs`}>
                    {playerName}
                </div>
            </div>
        </div>
    );
};

export default QuadraMode;