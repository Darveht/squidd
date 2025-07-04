class SquidGameSimulator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.doll = null;
        this.gameState = 'loading';
        this.gameTime = 120;
        this.playersAlive = 456;
        this.dollLookingBack = false;
        this.lightState = 'green';
        this.playerPosition = { x: 0, z: 40 };
        this.playerVelocity = { x: 0, z: 0 };
        this.keys = {};
        this.mouseLocked = false;
        this.dollRotation = 0;
        this.lastMoveTime = 0;
        this.eliminationSounds = [];
        this.guards = [];
        this.speechSynth = window.speechSynthesis;
        this.selectedVoice = null;
        this.currentLevel = 1;
        this.gameTitle = "LUZ ROJA, LUZ VERDE";
        this.countdownActive = false;
        this.countdownTime = 5;
        this.eliminatedPlayers = [];
        this.playerProfiles = this.generatePlayerProfiles();

        // Configuraciones del usuario
        this.settings = {
            announcements: false,
            visualAnnouncements: false,
            eliminationEffects: true,
            showUI: false,
            showLevelIndicator: false,
            showTimer: false,
            showPlayersCount: false
        };



        // Load voices when available
        if (this.speechSynth) {
            if (this.speechSynth.getVoices().length === 0) {
                this.speechSynth.addEventListener('voiceschanged', () => {
                    this.setupVoiceAnnouncements();
                });
            }
        }

        this.init();
    }

    init() {
        this.showLoadingScreen();
        setTimeout(() => {
            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            this.setupLighting();
            this.createEnvironment();
            this.createPlayer();
            this.createDoll();
            this.createGuards();
            this.setupControls();
            this.setupSettingsMenu();
            this.setupAudio();
            this.hideLoadingScreen();
            this.startGame();
            this.animate();
        }, 3000);
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.display = 'flex';
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const gameContainer = document.getElementById('game-container');

        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            gameContainer.style.display = 'block';
        }, 500);
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 30, 100);
        this.scene.background = new THREE.Color(0x87CEEB);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.8, 42);
        this.camera.rotation.order = 'YXZ';
    }

    setupRenderer() {
        const canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-10, 10, -10);
        this.scene.add(fillLight);
    }

    createEnvironment() {
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundTexture = this.createGroundTexture();
        const groundMaterial = new THREE.MeshLambertMaterial({ map: groundTexture });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Walls
        this.createWalls();

        // Start and finish lines
        this.createLines();

        // Tree
        this.createTree();

        // Background mural
        this.createBackgroundMural();
    }

    createGroundTexture() {
        // Create Squid Game style ground texture (more realistic dirt/sand)
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Base dirt color - more muted and realistic
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, '#8B7355'); // Dark khaki
        gradient.addColorStop(0.5, '#A0826D'); // Rosy brown
        gradient.addColorStop(1, '#967117'); // Dark goldenrod
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        // Add realistic dirt patterns
        for (let i = 0; i < 12000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = Math.random() * 2 + 0.5;
            const opacity = Math.random() * 0.4 + 0.1;

            ctx.fillStyle = `rgba(${101 + Math.random() * 50}, ${83 + Math.random() * 40}, ${45 + Math.random() * 30}, ${opacity})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add weathered lines and cracks
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const length = Math.random() * 80 + 30;
            const angle = Math.random() * Math.PI * 2;

            ctx.strokeStyle = `rgba(70, 60, 40, ${Math.random() * 0.5 + 0.2})`;
            ctx.lineWidth = Math.random() * 3 + 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            ctx.stroke();
        }

        // Add footprint tracks like in the show
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;

            ctx.fillStyle = `rgba(60, 50, 30, ${Math.random() * 0.4 + 0.2})`;
            ctx.beginPath();
            ctx.ellipse(x, y, 10, 15, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(6, 6);
        return texture;
    }

    createWalls() {
        const wallHeight = 12; // Taller walls
        const wallThickness = 0.5;

        // Wall material - beige/off-white color
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC }); // Beige

        // Left wall
        const leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 100);
        const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        leftWall.position.set(-25, wallHeight/2, 0);
        leftWall.castShadow = true;
        this.scene.add(leftWall);

        // Right wall
        const rightWall = leftWall.clone();
        rightWall.position.set(25, wallHeight/2, 0);
        this.scene.add(rightWall);

        // Back wall
        const backWallGeometry = new THREE.BoxGeometry(50, wallHeight, wallThickness);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(0, wallHeight/2, -50);
        backWall.castShadow = true;
        this.scene.add(backWall);

        // Front wall with door
        const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(15, wallHeight, wallThickness), wallMaterial);
        frontWallLeft.position.set(-17.5, wallHeight/2, 50);
        this.scene.add(frontWallLeft);

        const frontWallRight = frontWallLeft.clone();
        frontWallRight.position.set(17.5, wallHeight/2, 50);
        this.scene.add(frontWallRight);

        const frontWallTop = new THREE.Mesh(new THREE.BoxGeometry(20, wallHeight/2, wallThickness), wallMaterial);
        frontWallTop.position.set(0, wallHeight*0.75, 50);
        this.scene.add(frontWallTop);

        // Entrance door (black metal)
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
        const door = new THREE.Mesh(new THREE.BoxGeometry(8, wallHeight*0.6, wallThickness*1.2), doorMaterial);
        door.position.set(-15, wallHeight*0.3, 50);
        this.scene.add(door);

        // Door handle
        const handleGeometry = new THREE.SphereGeometry(0.2);
        const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(-12, wallHeight*0.3, 50.1);
        this.scene.add(handle);

        // Add desert grass in corners
        this.createDesertGrass();
    }

    createDesertGrass() {
        // Create desert grass in the corners of the walls
        const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x9ACD32 }); // Yellow green
        const dryGrassMaterial = new THREE.MeshLambertMaterial({ color: 0x8FBC8F }); // Dark sea green

        // Function to create a grass patch
        const createGrassPatch = (x, z, material) => {
            for (let i = 0; i < 15; i++) {
                const grassBlade = new THREE.CylinderGeometry(0.02, 0.01, 0.3 + Math.random() * 0.4);
                const grass = new THREE.Mesh(grassBlade, material);

                // Random position within the patch area
                grass.position.set(
                    x + (Math.random() - 0.5) * 4,
                    0.2,
                    z + (Math.random() - 0.5) * 4
                );

                // Random rotation
                grass.rotation.x = (Math.random() - 0.5) * 0.3;
                grass.rotation.z = (Math.random() - 0.5) * 0.3;

                this.scene.add(grass);
            }
        };

        // Add grass patches in corners and along walls
        createGrassPatch(-22, -47, grassMaterial); // Back left corner
        createGrassPatch(22, -47, dryGrassMaterial); // Back right corner
        createGrassPatch(-22, 47, grassMaterial); // Front left corner
        createGrassPatch(22, 47, dryGrassMaterial); // Front right corner

        // Add some patches along the walls
        createGrassPatch(-20, -20, dryGrassMaterial);
        createGrassPatch(20, -20, grassMaterial);
        createGrassPatch(-20, 20, grassMaterial);
        createGrassPatch(20, 20, dryGrassMaterial);
    }

    createSpeaker() {
        // Hidden speaker on the wall
        const speakerGeometry = new THREE.BoxGeometry(2, 1, 0.3);
        const speakerMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        const speaker = new THREE.Mesh(speakerGeometry, speakerMaterial);
        speaker.position.set(0, 10, -49.5);
        this.scene.add(speaker);

        // Speaker grille
        const grilleGeometry = new THREE.PlaneGeometry(1.5, 0.8);
        const grilleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const grille = new THREE.Mesh(grilleGeometry, grilleMaterial);
        grille.position.set(0, 10, -49.3);
        this.scene.add(grille);
    }

    createLines() {
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

        // Start line (thicker and more visible)
        const startLine = new THREE.Mesh(
            new THREE.BoxGeometry(50, 0.15, 0.8),
            lineMaterial
        );
        startLine.position.set(0, 0.08, 40);
        this.scene.add(startLine);

        // Player position markers on start line
        for (let i = -20; i <= 20; i += 4) {
            const marker = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.1, 2),
                lineMaterial
            );
            marker.position.set(i, 0.05, 39);
            this.scene.add(marker);
        }

        // Finish line
        const finishLine = new THREE.Mesh(
            new THREE.BoxGeometry(50, 0.15, 0.8),
            lineMaterial
        );
        finishLine.position.set(0, 0.08, -44);
        this.scene.add(finishLine);
    }

    createTree() {
        // Tree trunk - centered and larger for dead tree look
        const trunkGeometry = new THREE.CylinderGeometry(0.8, 1.2, 10);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 }); // Darker brown
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(0, 5, -42); // Centered on field, slightly in front of back wall
        trunk.castShadow = true;
        this.scene.add(trunk);

        // Dead/bare branches extending outward
        for (let i = 0; i < 12; i++) {
            const branchGeometry = new THREE.CylinderGeometry(0.05, 0.15, 2 + Math.random() * 2);
            const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
            const angle = (i / 12) * Math.PI * 2;
            const height = 7 + Math.random() * 3;
            
            branch.position.set(
                Math.cos(angle) * (1 + Math.random() * 0.5),
                height,
                -42 + Math.sin(angle) * 0.3
            );
            
            // Make branches point outward and upward
            branch.rotation.z = Math.cos(angle) * 0.8 + (Math.random() - 0.5) * 0.4;
            branch.rotation.x = Math.sin(angle) * 0.8 + (Math.random() - 0.5) * 0.4;
            branch.castShadow = true;
            this.scene.add(branch);
        }

        // Add some smaller twigs
        for (let i = 0; i < 20; i++) {
            const twigGeometry = new THREE.CylinderGeometry(0.02, 0.05, 0.5 + Math.random() * 1);
            const twig = new THREE.Mesh(twigGeometry, trunkMaterial);
            const angle = Math.random() * Math.PI * 2;
            
            twig.position.set(
                Math.cos(angle) * (1.5 + Math.random() * 1),
                8 + Math.random() * 2,
                -42 + Math.sin(angle) * 0.5
            );
            
            twig.rotation.z = (Math.random() - 0.5) * Math.PI;
            twig.rotation.x = (Math.random() - 0.5) * Math.PI;
            this.scene.add(twig);
        }
    }

    createBackgroundMural() {
        const muralGeometry = new THREE.PlaneGeometry(50, 25);
        const muralCanvas = document.createElement('canvas');
        muralCanvas.width = 512;
        muralCanvas.height = 256;
        const ctx = muralCanvas.getContext('2d');

        // Clear blue sky
        const skyGradient = ctx.createLinearGradient(0, 0, 0, 120);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#B0E0E6');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, 512, 120);

        // Rolling hills in background
        ctx.fillStyle = '#90EE90';
        ctx.beginPath();
        ctx.moveTo(0, 256);
        for (let x = 0; x <= 512; x += 30) {
            ctx.lineTo(x, 140 + Math.sin(x * 0.02) * 15);
        }
        ctx.lineTo(512, 256);
        ctx.closePath();
        ctx.fill();

        // Green fields with wheat
        ctx.fillStyle = '#9ACD32';
        ctx.fillRect(0, 180, 512, 76);

        // Add wheat pattern
        ctx.fillStyle = '#DAA520';
        for (let x = 20; x < 512; x += 40) {
            for (let y = 190; y < 240; y += 20) {
                ctx.fillRect(x, y, 2, 8);
                ctx.fillRect(x + 10, y + 5, 2, 8);
                ctx.fillRect(x + 20, y + 2, 2, 8);
            }
        }

        // Korean style house with red roof
        ctx.fillStyle = '#CD853F'; // Tan walls
        ctx.fillRect(200, 120, 100, 60);
        
        // Red curved roof
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        ctx.moveTo(190, 120);
        ctx.quadraticCurveTo(250, 100, 310, 120);
        ctx.lineTo(300, 125);
        ctx.quadraticCurveTo(250, 105, 200, 125);
        ctx.closePath();
        ctx.fill();

        // House details
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(225, 140, 20, 25); // Door
        ctx.fillStyle = '#4682B4';
        ctx.fillRect(210, 135, 12, 12); // Window
        ctx.fillRect(280, 135, 12, 12); // Window

        // Small flowers scattered
        ctx.fillStyle = '#FF69B4';
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * 512;
            const y = 200 + Math.random() * 40;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Additional small house
        ctx.fillStyle = '#F4A460';
        ctx.fillRect(350, 135, 60, 45);
        ctx.fillStyle = '#B22222';
        ctx.beginPath();
        ctx.moveTo(345, 135);
        ctx.lineTo(380, 115);
        ctx.lineTo(415, 135);
        ctx.closePath();
        ctx.fill();

        const muralTexture = new THREE.CanvasTexture(muralCanvas);
        const muralMaterial = new THREE.MeshLambertMaterial({ map: muralTexture });
        const mural = new THREE.Mesh(muralGeometry, muralMaterial);
        mural.position.set(0, 12.5, -49.8); // Positioned behind tree and doll
        this.scene.add(mural);
    }

    createPlayer() {
        const playerGroup = new THREE.Group();

        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.3);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.2;
        body.castShadow = true;
        playerGroup.add(body);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.3);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2;
        head.castShadow = true;
        playerGroup.add(head);

        // Arms
        const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.5, 1.2, 0);
        leftArm.castShadow = true;
        playerGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.5, 1.2, 0);
        rightArm.castShadow = true;
        playerGroup.add(rightArm);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x000080 });

        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.2, 0.4, 0);
        leftLeg.castShadow = true;
        playerGroup.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.2, 0.4, 0);
        rightLeg.castShadow = true;
        playerGroup.add(rightLeg);

        playerGroup.position.set(0, 0, 40);
        this.scene.add(playerGroup);
        this.player = playerGroup;
    }

    createDoll() {
        const dollGroup = new THREE.Group();

        // Doll body
        const bodyGeometry = new THREE.CylinderGeometry(1.5, 2, 4);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFA500 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 2;
        body.castShadow = true;
        dollGroup.add(body);

        // Doll head
        const headGeometry = new THREE.SphereGeometry(1.2);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 5;
        head.castShadow = true;
        dollGroup.add(head);

        // Hair (pigtails)
        const hairGeometry = new THREE.SphereGeometry(0.3);
        const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

        const leftPigtail = new THREE.Mesh(hairGeometry, hairMaterial);
        leftPigtail.position.set(-1, 5.5, 0);
        dollGroup.add(leftPigtail);

        const rightPigtail = new THREE.Mesh(hairGeometry, hairMaterial);
        rightPigtail.position.set(1, 5.5, 0);
        dollGroup.add(rightPigtail);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.1);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.3, 5.2, 1);
        dollGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.3, 5.2, 1);
        dollGroup.add(rightEye);

        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2.5);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-2, 3, 0);
        leftArm.rotation.z = Math.PI / 6;
        dollGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(2, 3, 0);
        rightArm.rotation.z = -Math.PI / 6;
        dollGroup.add(rightArm);

        dollGroup.position.set(0, 0, -38); // Centered, directly in front of the tree
        dollGroup.scale.set(1.2, 1.2, 1.2);
        dollGroup.rotation.y = Math.PI; // Face towards the starting line
        this.scene.add(dollGroup);
        this.doll = dollGroup;
    }

    createGuards() {
        // Define guard properties
        const guardColor = 0xFF0000; // Red
        const guardHeight = 2;
        const guardSpacing = 3;

        // Create guard material
        const guardMaterial = new THREE.MeshLambertMaterial({ color: guardColor });

        // Function to create a single guard
        const createGuard = (x, z) => {
            const guardGeometry = new THREE.BoxGeometry(0.6, guardHeight, 0.3);
            const guard = new THREE.Mesh(guardGeometry, guardMaterial);
            guard.position.set(x, guardHeight / 2, z);
            guard.castShadow = true;
            this.scene.add(guard);
            this.guards.push(guard);
        };

        // Create guards around the centered area
        createGuard(-8, -35);
        createGuard(8, -35);
        createGuard(-15, -30);
        createGuard(15, -30);

        // Add speaker on the wall
        this.createSpeaker();
    }

    setupControls() {
        // Variables para controles suaves
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetRotationX = 0;
        this.targetRotationY = 0;
        this.cameraSensitivity = 0.002;
        this.cameraSmoothing = 0.1;

        // Variables para touch controls - detección mejorada para iPhone
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchRotating = false;

        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });

        // Mouse controls mejorados
        document.addEventListener('click', (event) => {
            if (!this.mouseLocked && this.gameState === 'playing' && !event.target.closest('.settings-menu') && !event.target.closest('.settings-button')) {
                document.body.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.mouseLocked = document.pointerLockElement === document.body;
        });

        document.addEventListener('mousemove', (event) => {
            if (this.mouseLocked && this.gameState === 'playing') {
                this.targetRotationY -= event.movementX * this.cameraSensitivity;
                this.targetRotationX -= event.movementY * this.cameraSensitivity;
                this.targetRotationX = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.targetRotationX));
            }
        });

        // Touch controls para móvil - forzar en dispositivos táctiles
        if (this.isTouchDevice) {
            this.setupTouchControls();
            // Forzar mostrar controles en dispositivos móviles
            setTimeout(() => {
                const joystick = document.getElementById('virtual-joystick');
                const runButton = document.getElementById('run-button');
                if (joystick) joystick.style.display = 'flex';
                if (runButton) runButton.style.display = 'flex';
            }, 100);
        }

        // UI Event Listeners
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.restartGame();
        });
    }

    setupTouchControls() {
        // Crear joystick virtual para movimiento
        this.createVirtualJoystick();

        // Área de rotación de cámara (toda la pantalla menos el joystick)
        document.addEventListener('touchstart', (e) => {
            if (this.gameState !== 'playing') return;

            const touch = e.touches[0];
            const joystickArea = document.getElementById('virtual-joystick');

            if (!joystickArea.contains(e.target)) {
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
                this.touchRotating = true;
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (this.gameState !== 'playing' || !this.touchRotating) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;

            this.targetRotationY -= deltaX * this.cameraSensitivity * 2;
            this.targetRotationX -= deltaY * this.cameraSensitivity * 2;
            this.targetRotationX = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.targetRotationX));

            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;

            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', () => {
            this.touchRotating = false;
        });
    }

    createVirtualJoystick() {
        const joystickHTML = `
            <div id="virtual-joystick" class="virtual-joystick" style="display: flex;">
                <div class="joystick-directions">
                    <div class="direction-indicator up">↑</div>
                    <div class="direction-indicator left">←</div>
                    <div class="direction-indicator right">→</div>
                    <div class="direction-indicator down">↓</div>
                </div>
                <div id="joystick-knob" class="joystick-knob"></div>
            </div>
            <div id="run-button" class="run-button" style="display: flex;">🏃‍♂️</div>
        `;

        document.body.insertAdjacentHTML('beforeend', joystickHTML);

        const joystick = document.getElementById('virtual-joystick');
        const knob = document.getElementById('joystick-knob');
        const runButton = document.getElementById('run-button');

        let joystickActive = false;
        let joystickCenterX = 0;
        let joystickCenterY = 0;

        // Joystick touch events
        joystick.addEventListener('touchstart', (e) => {
            if (this.gameState !== 'playing') return;

            joystickActive = true;
            const rect = joystick.getBoundingClientRect();
            joystickCenterX = rect.left + rect.width / 2;
            joystickCenterY = rect.top + rect.height / 2;
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!joystickActive || this.gameState !== 'playing') return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - joystickCenterX;
            const deltaY = touch.clientY - joystickCenterY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = 40;

            if (distance <= maxDistance) {
                knob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            } else {
                const angle = Math.atan2(deltaY, deltaX);
                const x = Math.cos(angle) * maxDistance;
                const y = Math.sin(angle) * maxDistance;
                knob.style.transform = `translate(${x}px, ${y}px)`;
            }

            // Convertir a movimiento del jugador
            const normalizedX = Math.max(-1, Math.min(1, deltaX / maxDistance));
            const normalizedY = Math.max(-1, Math.min(1, deltaY / maxDistance));

            // Simular teclas presionadas con mayor sensibilidad
            this.keys['KeyW'] = normalizedY < -0.1; // Adelante (hacia arriba en joystick)
            this.keys['KeyS'] = normalizedY > 0.1;  // Atrás (hacia abajo en joystick) 
            this.keys['KeyA'] = normalizedX < -0.1; // Izquierda
            this.keys['KeyD'] = normalizedX > 0.1;  // Derecha

            e.preventDefault();
        }, { passive: false });

        joystick.addEventListener('touchend', () => {
            joystickActive = false;
            knob.style.transform = 'translate(0px, 0px)';
            this.keys['KeyW'] = false;
            this.keys['KeyS'] = false;
            this.keys['KeyA'] = false;
            this.keys['KeyD'] = false;
        });

        // Run button
        runButton.addEventListener('touchstart', (e) => {
            this.keys['ShiftLeft'] = true;
            runButton.style.background = 'rgba(255, 107, 107, 0.8)';
            e.preventDefault();
        }, { passive: false });

        runButton.addEventListener('touchend', () => {
            this.keys['ShiftLeft'] = false;
            runButton.style.background = 'rgba(0, 0, 0, 0.6)';
        });
    }

    setupSettingsMenu() {
        const settingsButton = document.getElementById('settings-button');
        const settingsMenu = document.getElementById('settings-menu');
        const closeSettings = document.getElementById('close-settings');

        // Cargar configuraciones guardadas
        this.loadSettings();

        // Botón de configuración con toggle
        settingsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsMenu.classList.toggle('hidden');
        });

        // Cerrar configuración
        closeSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsMenu.classList.add('hidden');
        });

        // Cerrar al hacer clic fuera del menú
        document.addEventListener('click', (e) => {
            if (!settingsMenu.contains(e.target) && !settingsButton.contains(e.target)) {
                settingsMenu.classList.add('hidden');
            }
        });

        // Prevenir que clicks dentro del menú lo cierren
        settingsMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Controles de configuración con guardado automático
        document.getElementById('toggle-announcements').addEventListener('change', (e) => {
            this.settings.announcements = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('toggle-visual-announcements').addEventListener('change', (e) => {
            this.settings.visualAnnouncements = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('toggle-elimination-effects').addEventListener('change', (e) => {
            this.settings.eliminationEffects = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('toggle-ui').addEventListener('change', (e) => {
            this.settings.showUI = e.target.checked;
            this.updateUIVisibility();
            this.saveSettings();
        });

        document.getElementById('toggle-level-indicator').addEventListener('change', (e) => {
            this.settings.showLevelIndicator = e.target.checked;
            this.updateUIVisibility();
            this.saveSettings();
        });

        document.getElementById('toggle-timer').addEventListener('change', (e) => {
            this.settings.showTimer = e.target.checked;
            this.updateUIVisibility();
            this.saveSettings();
        });

        document.getElementById('toggle-players-count').addEventListener('change', (e) => {
            this.settings.showPlayersCount = e.target.checked;
            this.updateUIVisibility();
            this.saveSettings();
        });
    }

    loadSettings() {
        const saved = localStorage.getItem('squidGameSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }

        // Aplicar configuraciones a los checkboxes
        document.getElementById('toggle-announcements').checked = this.settings.announcements;
        document.getElementById('toggle-visual-announcements').checked = this.settings.visualAnnouncements;
        document.getElementById('toggle-elimination-effects').checked = this.settings.eliminationEffects;
        document.getElementById('toggle-ui').checked = this.settings.showUI;
        document.getElementById('toggle-level-indicator').checked = this.settings.showLevelIndicator;
        document.getElementById('toggle-timer').checked = this.settings.showTimer;
        document.getElementById('toggle-players-count').checked = this.settings.showPlayersCount;

        // Aplicar visibilidad inicial
        this.updateUIVisibility();
    }

    saveSettings() {
        localStorage.setItem('squidGameSettings', JSON.stringify(this.settings));
    }

    updateUIVisibility() {
        const topUI = document.querySelector('.top-ui');
        const levelIndicator = document.querySelector('.level-indicator');
        const timerContainer = document.querySelector('.timer-container');
        const playersCount = document.querySelector('.players-count');

        if (this.settings.showUI) {
            topUI.style.display = 'flex';
            levelIndicator.style.display = this.settings.showLevelIndicator ? 'block' : 'none';
            timerContainer.style.display = this.settings.showTimer ? 'block' : 'none';
            playersCount.style.display = this.settings.showPlayersCount ? 'block' : 'none';
        } else {
            topUI.style.display = 'none';
        }
    }

    generatePlayerProfiles() {
        const profiles = [];
        for (let i = 1; i <= 456; i++) {
            profiles.push({
                id: i,
                name: `Jugador ${i.toString().padStart(3, '0')}`,
                eliminated: false,
                avatar: this.generateAvatar(i)
            });
        }
        return profiles;
    }

    generateAvatar(id) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        return colors[id % colors.length];
    }

    setupAudio() {
        // Create audio context and sounds
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Setup YouTube audio
        this.setupYouTubeAudio();

        // Setup speech synthesis
        this.setupVoiceAnnouncements();
    }

    setupYouTubeAudio() {
        // Create hidden YouTube player for background music
        const youtubeContainer = document.createElement('div');
        youtubeContainer.style.position = 'absolute';
        youtubeContainer.style.top = '-9999px';
        youtubeContainer.style.left = '-9999px';
        document.body.appendChild(youtubeContainer);

        // YouTube audio iframe
        const iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube.com/embed/I1lK-MT7KTY?autoplay=1&loop=1&playlist=I1lK-MT7KTY&controls=0&mute=0&start=0&enablejsapi=1';
        iframe.width = '0';
        iframe.height = '0';
        iframe.style.border = 'none';
        iframe.allow = 'autoplay; encrypted-media';
        youtubeContainer.appendChild(iframe);

        this.youtubePlayer = iframe;
    }

    setupVoiceAnnouncements() {
        // Voice synthesis disabled - only visual announcements
    }



    makeAnnouncement(text, showVisual = true) {
        // Verificar configuraciones antes de mostrar anuncios
        if (!this.settings.announcements) return;

        // Show visual announcement only
        if (showVisual && this.settings.visualAnnouncements) {
            this.showAnnouncementText(text);
        }
        // Removed excessive sound effects
    }

    showAnnouncementText(text) {
        const container = document.getElementById('announcement-container');
        const textElement = document.getElementById('announcement-text');

        textElement.textContent = text;
        container.classList.add('show');

        // Hide after 4 seconds
        setTimeout(() => {
            container.classList.remove('show');
        }, 4000);
    }

    playSound(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    startGame() {
        this.gameState = 'preparing';

        // Solo un anuncio inicial
        this.makeAnnouncement(`¡Luz Roja, Luz Verde! Cruza la línea en 2 minutos.`);

        // Iniciar cuenta regresiva directamente después de 3 segundos
        setTimeout(() => {
            this.startCountdown();
        }, 3000);
    }

    startCountdown() {
        this.countdownActive = true;
        this.countdownTime = 5;

        const countdownInterval = setInterval(() => {
            if (this.countdownTime > 0) {
                this.makeAnnouncement(`¡El juego comienza en ${this.countdownTime}!`);
                this.playCountdownSound();
                this.countdownTime--;
            } else {
                clearInterval(countdownInterval);
                this.countdownActive = false;
                this.makeAnnouncement("¡COMIENZA AHORA!");
                this.gameState = 'playing';
                this.updateLightState('green');
                this.startGameLoop();
            }
        }, 1000);
    }

    playCountdownSound() {
        if (!this.audioContext) return;
        this.playSound(800, 0.2, 'square');
    }

    startGameLoop() {
        this.gameLoop = setInterval(() => {
            if (this.gameState !== 'playing') return;

            this.gameTime--;
            document.getElementById('timer').textContent = this.gameTime;

            if (this.gameTime <= 0) {
                this.endGame('timeout');
                return;
            }

            // Random light changes
            if (Math.random() < 0.05) { // 5% chance per second
                this.changeLightState();
            }

            // Update players count (simulate other players getting eliminated)
            if (Math.random() < 0.02 && this.playersAlive > 1) {
                this.playersAlive--;
                document.getElementById('players-alive').textContent = this.playersAlive;
                // Removed elimination sound effect
            }

        }, 1000);
    }

    changeLightState() {
        if (this.lightState === 'green') {
            this.updateLightState('red');
            this.dollLookingBack = true;
            this.animateDollTurn(Math.PI);

            setTimeout(() => {
                if (this.gameState === 'playing') {
                    this.updateLightState('green');
                    this.dollLookingBack = false;
                    this.animateDollTurn(0);
                }
            }, 2000 + Math.random() * 3000);
        }
    }

    updateLightState(state) {
        this.lightState = state;
        const lightIndicator = document.querySelector('.light');
        const lightText = document.querySelector('.light-text');

        if (state === 'green') {
            lightIndicator.className = 'light green';
            lightText.textContent = 'LUZ VERDE';
        } else {
            lightIndicator.className = 'light red';
            lightText.textContent = 'LUZ ROJA';
        }
    }

    playGreenLightSound() {
        // Recreate the Korean song "Mugunghwa kkoci pieot seumnida" melody
        if (!this.audioContext) return;

        const notes = [
            { freq: 523, time: 0, duration: 0.4 },    // C5 - Mu
            { freq: 587, time: 0.4, duration: 0.4 },  // D5 - gun
            { freq: 659, time: 0.8, duration: 0.4 },  // E5 - ghwa
            { freq: 698, time: 1.2, duration: 0.6 },  // F5 - kko
            { freq: 659, time: 1.8, duration: 0.4 },  // E5 - ci
            { freq: 587, time: 2.2, duration: 0.4 },  // D5 - pie
            { freq: 523, time: 2.6, duration: 0.8 },  // C5 - ot
            { freq: 587, time: 3.4, duration: 0.4 },  // D5 - seum
            { freq: 659, time: 3.8, duration: 0.4 },  // E5 - ni
            { freq: 523, time: 4.2, duration: 1.0 }   // C5 - da
        ];

        notes.forEach(note => {
            setTimeout(() => {
                this.createMelodyNote(note.freq, note.duration);
            }, note.time * 1000);
        });
    }

    createMelodyNote(frequency, duration) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();

        // Chain: oscillator -> filter -> gain -> destination
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Configure oscillator
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Configure filter for more musical sound
        filterNode.type = 'lowpass';
        filterNode.frequency.value = frequency * 2;
        filterNode.Q.value = 1;

        // Configure gain envelope
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.1, now + duration * 0.7); // Sustain
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    animateDollTurn(targetRotation) {
        const startRotation = this.doll.rotation.y;
        // Adjust target rotation since doll now faces opposite direction initially
        const adjustedTarget = targetRotation === 0 ? Math.PI : 0;
        const rotationDiff = adjustedTarget - startRotation;
        const duration = 500; // milliseconds
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            this.doll.rotation.y = startRotation + rotationDiff * easeProgress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    updatePlayer() {
        if (this.gameState !== 'playing') return;

        const speed = this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? 0.15 : 0.08;
        let moved = false;
        const previousPosition = { ...this.playerPosition };

        // Movimiento simple y directo - igual para móvil y escritorio
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            // Adelante = hacia la muñeca (reducir Z)
            this.playerPosition.z -= speed;
            moved = true;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            // Atrás = alejarse de la muñeca (aumentar Z)
            this.playerPosition.z += speed;
            moved = true;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            // Izquierda = reducir X
            this.playerPosition.x -= speed;
            moved = true;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            // Derecha = aumentar X
            this.playerPosition.x += speed;
            moved = true;
        }

        // Boundary checking
        this.playerPosition.x = Math.max(-24, Math.min(24, this.playerPosition.x));
        this.playerPosition.z = Math.max(-44, Math.min(45, this.playerPosition.z));

        // Check for movement during red light
        if (moved && this.lightState === 'red' && this.dollLookingBack) {
            this.endGame('caught');
            return;
        }

        // Check for victory
        if (this.playerPosition.z <= -44) {
            this.endGame('victory');
            return;
        }

        // Update player and camera positions
        this.player.position.set(this.playerPosition.x, 0, this.playerPosition.z);
        this.camera.position.set(this.playerPosition.x, 1.8, this.playerPosition.z);

        // Simple walking animation
        if (moved) {
            const time = performance.now() * 0.01;
            this.player.children[3].rotation.x = Math.sin(time) * 0.3; // Left leg
            this.player.children[4].rotation.x = -Math.sin(time) * 0.3; // Right leg
            this.player.children[1].rotation.x = Math.sin(time) * 0.2; // Left arm
            this.player.children[2].rotation.x = -Math.sin(time) * 0.2; // Right arm
        }
    }

    endGame(reason) {
        this.gameState = 'ended';
        clearInterval(this.gameLoop);

        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

        if (reason === 'victory') {
            this.showVictoryScreen();
        } else {
            this.createEliminationEffect();
            this.eliminateRandomPlayers();
            setTimeout(() => {
                this.showGameOverScreen(reason);
            }, 2000);
        }
    }

    createEliminationEffect() {
        // Solo mostrar efectos si está habilitado en configuración
        if (!this.settings.eliminationEffects) return;

        // Create diamond shatter effect
        const effectContainer = document.createElement('div');
        effectContainer.className = 'elimination-effect';
        effectContainer.innerHTML = `
            <div class="diamond-shatter">
                <div class="diamond-piece"></div>
                <div class="diamond-piece"></div>
                <div class="diamond-piece"></div>
                <div class="diamond-piece"></div>
                <div class="diamond-piece"></div>
            </div>
            <div class="elimination-text">ELIMINADO</div>
        `;
        document.body.appendChild(effectContainer);

        // Play elimination sound
        this.playEliminationSound();

        // Remove effect after animation
        setTimeout(() => {
            effectContainer.remove();
        }, 3000);
    }

    eliminateRandomPlayers() {
        // Simulate other players getting eliminated
        const playersToEliminate = Math.floor(Math.random() * 20) + 5;
        for (let i = 0; i < playersToEliminate; i++) {
            const randomPlayer = this.playerProfiles.find(p => !p.eliminated);
            if (randomPlayer) {
                randomPlayer.eliminated = true;
                this.eliminatedPlayers.push(randomPlayer);
                this.playersAlive--;
            }
        }
        this.showEliminatedPlayers();
    }

    showEliminatedPlayers() {
        const eliminatedContainer = document.createElement('div');
        eliminatedContainer.className = 'eliminated-players-container';

        this.eliminatedPlayers.slice(-5).forEach((player, index) => {
            const playerCard = document.createElement('div');
            playerCard.className = 'eliminated-player-card';
            playerCard.innerHTML = `
                <div class="player-diamond" style="background: ${player.avatar}">
                    <span>${player.id}</span>
                </div>
                <div class="player-name">${player.name}</div>
            `;
            playerCard.style.animationDelay = `${index * 0.2}s`;
            eliminatedContainer.appendChild(playerCard);
        });

        document.body.appendChild(eliminatedContainer);

        setTimeout(() => {
            eliminatedContainer.remove();
        }, 5000);
    }

    playEliminationSound() {
        if (!this.audioContext) return;

        // Create dramatic elimination sound
        const frequencies = [440, 330, 277, 220];
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playSound(freq, 0.5, 'sawtooth');
            }, index * 200);
        });
    }

    showGameOverScreen(reason) {
        const gameOverScreen = document.getElementById('game-over-screen');
        const gameMessage = document.getElementById('game-message');

        let message = '';
        let announcement = '';
        switch (reason) {
            case 'caught':
                message = 'Te moviste durante luz roja';
                announcement = 'Jugador eliminado. Se movió durante luz roja.';
                break;
            case 'timeout':
                message = 'Se acabó el tiempo';
                announcement = 'Tiempo agotado. Jugador eliminado.';
                break;
            default:
                message = 'Juego terminado';
                announcement = 'Jugador eliminado.';
        }

        gameMessage.textContent = message;
        gameOverScreen.classList.remove('hidden');

        // Death announcement
        this.makeAnnouncement(announcement);
        // Removed game over sound
    }

    showVictoryScreen() {
        const victoryScreen = document.getElementById('victory-screen');
        const timeUsed = document.getElementById('time-used');
        const survivors = document.getElementById('survivors');

        timeUsed.textContent = `${120 - this.gameTime}s`;
        survivors.textContent = this.playersAlive;

        victoryScreen.classList.remove('hidden');

        // Victory announcement
        this.makeAnnouncement(`¡Felicitaciones! Has completado el Nivel ${this.currentLevel}. Pasas al siguiente juego.`);
        // Removed victory sound
    }

    restartGame() {
        // Reset game state
        this.gameState = 'preparing';
        this.gameTime = 120;
        this.playersAlive = 456;
        this.lightState = 'green';
        this.dollLookingBack = false;
        this.playerPosition = { x: 0, z: 40 };

        // Reset UI
        document.getElementById('timer').textContent = this.gameTime;
        document.getElementById('players-alive').textContent = this.playersAlive;
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('victory-screen').classList.add('hidden');

        // Reset player position
        this.player.position.set(0, 0, 40);
        this.camera.position.set(0, 1.8, 42);
        this.camera.rotation.set(0, 0, 0);

        // Reset doll
        this.doll.rotation.y = 0;
        this.updateLightState('green');

        // Restart announcement
        this.makeAnnouncement("Nuevo intento iniciando...");
        setTimeout(() => {
            this.startGame();
        }, 3000);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.updateCameraSmoothing();
        this.updatePlayer();
        this.renderer.render(this.scene, this.camera);
    }

    updateCameraSmoothing() {
        if (this.gameState === 'playing') {
            // Aplicar suavizado a la rotación de la cámara
            this.camera.rotation.y += (this.targetRotationY - this.camera.rotation.y) * this.cameraSmoothing;
            this.camera.rotation.x += (this.targetRotationX - this.camera.rotation.x) * this.cameraSmoothing;
        }
    }

    handleResize() {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
}

// Initialize the game when page loads
window.addEventListener('load', () => {
    const game = new SquidGameSimulator();

    window.addEventListener('resize', () => {
        game.handleResize();
    });
});