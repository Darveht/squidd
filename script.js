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
        this.shootingHoles = [];

        // Sistema de video cinematográfico
        this.cinematicVideo = null;
        this.cinematicActive = false;
        this.audioSource = null;
        this.subtitles = [
            { text: "Bienvenidos, participantes.", start: 2, end: 5 },
            { text: "Han sido seleccionados para formar parte de esta competencia.", start: 6, end: 10 },
            { text: "A partir de este momento, sus acciones serán observadas con precisión.", start: 11, end: 16 },
            { text: "Cualquier incumplimiento de las normas resultará en una eliminación inmediata.", start: 17, end: 22 },
            { text: "Prepárense para iniciar el primer desafío.", start: 23, end: 27 },
            { text: "Recuerden: solo los que sigan las reglas podrán continuar.", start: 28, end: 33 },
            { text: "El juego comenzará en breve.", start: 34, end: 37 }
        ];
        this.currentSubtitleIndex = 0;

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
            this.startCinematicIntro();
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
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 120);
        // Crear un cielo azul realista como en el show
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

    createSpeakerNearDoll() {
        // Corneta profesional mejorada tipo estadio
        const speakerGroup = new THREE.Group();

        // Base de montaje robusta
        const mountBaseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.4);
        const mountBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
        const mountBase = new THREE.Mesh(mountBaseGeometry, mountBaseMaterial);
        mountBase.position.set(0, 0, 0);
        mountBase.rotation.x = Math.PI / 2;
        mountBase.castShadow = true;
        speakerGroup.add(mountBase);

        // Brazo articulado principal (más robusto)
        const mainArmGeometry = new THREE.BoxGeometry(0.4, 0.4, 3);
        const mainArmMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        const mainArm = new THREE.Mesh(mainArmGeometry, mainArmMaterial);
        mainArm.position.set(0, 0, 1.8);
        mainArm.castShadow = true;
        speakerGroup.add(mainArm);

        // Articulación intermedia
        const jointGeometry = new THREE.SphereGeometry(0.3);
        const jointMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
        const joint = new THREE.Mesh(jointGeometry, jointMaterial);
        joint.position.set(0, 0, 3.5);
        joint.castShadow = true;
        speakerGroup.add(joint);

        // Caja del altavoz principal (más imponente)
        const speakerBoxGeometry = new THREE.BoxGeometry(3.5, 4, 2);
        const speakerBoxMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x0A0A0A,
            roughness: 0.8,
            metalness: 0.2
        });
        const speakerBox = new THREE.Mesh(speakerBoxGeometry, speakerBoxMaterial);
        speakerBox.position.set(0, 0, 4.5);
        speakerBox.castShadow = true;
        speakerGroup.add(speakerBox);

        // Marco decorativo del altavoz
        const frameGeometry = new THREE.BoxGeometry(3.8, 4.3, 0.3);
        const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(0, 0, 5.6);
        speakerGroup.add(frame);

        // Woofer principal (altavoz grande)
        const wooferGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.4);
        const wooferMaterial = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
        const woofer = new THREE.Mesh(wooferGeometry, wooferMaterial);
        woofer.position.set(0, 0.5, 5.8);
        woofer.rotation.x = Math.PI / 2;
        speakerGroup.add(woofer);

        // Cono del woofer
        const coneGeometry = new THREE.ConeGeometry(1, 0.3, 32);
        const coneMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.set(0, 0.5, 5.9);
        cone.rotation.x = Math.PI / 2;
        speakerGroup.add(cone);

        // Rejilla protectora con patrón hexagonal
        for (let i = 0; i < 6; i++) {
            const hexGeometry = new THREE.RingGeometry(0.3 + i * 0.15, 0.32 + i * 0.15, 6);
            const hexMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x666666,
                transparent: true,
                opacity: 0.7
            });
            const hexRing = new THREE.Mesh(hexGeometry, hexMaterial);
            hexRing.position.set(0, 0.5, 5.95);
            hexRing.rotation.x = Math.PI / 2;
            speakerGroup.add(hexRing);
        }

        // Tweeter array (altavoces de agudos)
        for (let i = 0; i < 4; i++) {
            const tweeterGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.2);
            const tweeterMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
            const tweeter = new THREE.Mesh(tweeterGeometry, tweeterMaterial);
            
            const angle = (i / 4) * Math.PI * 2;
            tweeter.position.set(
                Math.cos(angle) * 0.8, 
                -1 + Math.sin(angle) * 0.3, 
                5.8
            );
            tweeter.rotation.x = Math.PI / 2;
            speakerGroup.add(tweeter);
        }

        // Puertos de graves (bass reflex)
        const bassPort1Geometry = new THREE.CylinderGeometry(0.2, 0.2, 1);
        const bassPortMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const bassPort1 = new THREE.Mesh(bassPort1Geometry, bassPortMaterial);
        bassPort1.position.set(-1, -1.2, 5.8);
        bassPort1.rotation.x = Math.PI / 2;
        speakerGroup.add(bassPort1);

        const bassPort2 = bassPort1.clone();
        bassPort2.position.set(1, -1.2, 5.8);
        speakerGroup.add(bassPort2);

        // Panel de control con LEDs
        const controlPanelGeometry = new THREE.BoxGeometry(2, 0.8, 0.2);
        const controlPanelMaterial = new THREE.MeshLambertMaterial({ color: 0x2C2C2C });
        const controlPanel = new THREE.Mesh(controlPanelGeometry, controlPanelMaterial);
        controlPanel.position.set(0, -1.6, 5.7);
        speakerGroup.add(controlPanel);

        // LEDs de estado mejorados
        const ledPositions = [
            { x: -0.6, y: -1.6, color: 0x00FF00, emissive: 0x004400 }, // Verde - Power
            { x: -0.2, y: -1.6, color: 0xFFFF00, emissive: 0x444400 }, // Amarillo - Signal
            { x: 0.2, y: -1.6, color: 0xFF4400, emissive: 0x442200 },  // Naranja - Peak
            { x: 0.6, y: -1.6, color: 0xFF0000, emissive: 0x440000 }   // Rojo - Clip
        ];

        ledPositions.forEach(ledInfo => {
            const ledGeometry = new THREE.SphereGeometry(0.08);
            const ledMaterial = new THREE.MeshBasicMaterial({ 
                color: ledInfo.color,
                emissive: ledInfo.emissive,
                emissiveIntensity: 0.6
            });
            const led = new THREE.Mesh(ledGeometry, ledMaterial);
            led.position.set(ledInfo.x, ledInfo.y, 5.8);
            speakerGroup.add(led);
        });

        // Logo/Marca del fabricante
        const logoGeometry = new THREE.PlaneGeometry(1.5, 0.3);
        const logoMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9
        });
        const logo = new THREE.Mesh(logoGeometry, logoMaterial);
        logo.position.set(0, 1.8, 5.75);
        speakerGroup.add(logo);

        // Sistema de cables mejorado
        const mainCableGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3);
        const cableMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        const powerCable = new THREE.Mesh(mainCableGeometry, cableMaterial);
        powerCable.position.set(0.8, -1.5, 2.5);
        powerCable.rotation.z = Math.PI / 8;
        speakerGroup.add(powerCable);

        const audioCable = new THREE.Mesh(mainCableGeometry, cableMaterial);
        audioCable.position.set(-0.8, -1.5, 2.5);
        audioCable.rotation.z = -Math.PI / 8;
        speakerGroup.add(audioCable);

        // Conectores XLR
        const xlrGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3);
        const xlrMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        const xlrConnector = new THREE.Mesh(xlrGeometry, xlrMaterial);
        xlrConnector.position.set(0, -1.6, 3.5);
        xlrConnector.rotation.x = Math.PI / 2;
        speakerGroup.add(xlrConnector);

        // Posicionar y orientar la corneta
        speakerGroup.position.set(-22, 10, -49.5);
        speakerGroup.rotation.y = Math.PI / 4;
        speakerGroup.rotation.x = -Math.PI / 16;
        speakerGroup.scale.set(0.8, 0.8, 0.8); // Escalar ligeramente para mejor proporción
        
        this.scene.add(speakerGroup);
        this.speakerNearDoll = speakerGroup;

        // Efecto de sonido visual mejorado
        this.createSoundWaves();
    }

    createShootingHoles() {
        // Crear 4 agujeros de disparo en cada esquina de las paredes
        const holePositions = [
            // Pared trasera (esquinas superiores)
            { x: -20, y: 8, z: -49.5, wall: 'back' },
            { x: 20, y: 8, z: -49.5, wall: 'back' },
            // Pared izquierda (esquinas superiores)
            { x: -24.5, y: 8, z: -20, wall: 'left' },
            { x: -24.5, y: 8, z: 20, wall: 'left' },
            // Pared derecha (esquinas superiores)
            { x: 24.5, y: 8, z: -20, wall: 'right' },
            { x: 24.5, y: 8, z: 20, wall: 'right' },
            // Pared frontal (esquinas superiores)
            { x: -15, y: 8, z: 49.5, wall: 'front' },
            { x: 15, y: 8, z: 49.5, wall: 'front' }
        ];

        holePositions.forEach((pos, index) => {
            const holeGroup = new THREE.Group();

            // Agujero principal (cilíndrico)
            const holeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6);
            const holeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
            const hole = new THREE.Mesh(holeGeometry, holeMaterial);

            // Orientar el agujero según la pared
            if (pos.wall === 'back' || pos.wall === 'front') {
                hole.rotation.x = Math.PI / 2;
            } else {
                hole.rotation.z = Math.PI / 2;
            }

            holeGroup.add(hole);

            // Marco metálico del agujero
            const frameGeometry = new THREE.TorusGeometry(0.35, 0.05, 8, 16);
            const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);

            if (pos.wall === 'back' || pos.wall === 'front') {
                frame.rotation.x = Math.PI / 2;
            } else {
                frame.rotation.z = Math.PI / 2;
            }

            holeGroup.add(frame);

            // Cañón del arma (apenas visible)
            const barrelGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.5);
            const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
            const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
            barrel.position.set(0, 0, -0.2);

            if (pos.wall === 'back' || pos.wall === 'front') {
                barrel.rotation.x = Math.PI / 2;
            } else {
                barrel.rotation.z = Math.PI / 2;
            }

            holeGroup.add(barrel);

            // LED indicador de estado
            const ledGeometry = new THREE.SphereGeometry(0.05);
            const ledMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00FF00,
                emissive: 0x002200,
                emissiveIntensity: 0.5
            });
            const led = new THREE.Mesh(ledGeometry, ledMaterial);
            led.position.set(0.4, 0.4, 0);
            holeGroup.add(led);

            holeGroup.position.set(pos.x, pos.y, pos.z);
            this.scene.add(holeGroup);

            this.shootingHoles.push({
                group: holeGroup,
                position: pos,
                led: led,
                barrel: barrel,
                active: false
            });
        });
    }

    createSoundWaves() {
        // Ondas de sonido visuales que emanan del altavoz
        for (let i = 0; i < 5; i++) {
            const waveGeometry = new THREE.RingGeometry(1 + i * 0.5, 1.2 + i * 0.5, 16);
            const waveMaterial = new THREE.MeshBasicMaterial({
                color: 0x00FFFF,
                transparent: true,
                opacity: 0.1 - i * 0.02,
                side: THREE.DoubleSide
            });
            const wave = new THREE.Mesh(waveGeometry, waveMaterial);
            wave.position.set(-22, 9, -47);
            wave.rotation.y = Math.PI / 4;

            // Animación de ondas expansivas
            const animate = () => {
                wave.scale.multiplyScalar(1.002);
                wave.material.opacity *= 0.999;
                if (wave.material.opacity > 0.01) {
                    requestAnimationFrame(animate);
                } else {
                    wave.scale.set(1, 1, 1);
                    wave.material.opacity = 0.1 - i * 0.02;
                    setTimeout(() => requestAnimationFrame(animate), i * 200);
                }
            };
            setTimeout(() => requestAnimationFrame(animate), i * 100);

            this.scene.add(wave);
        }
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

        // Estilo Roblox - Todo cuadrado/rectangular
        
        // Body (torso cuadrado más grande)
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1.4, 0.5);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.2;
        body.castShadow = true;
        playerGroup.add(body);

        // Head (cabeza completamente cuadrada)
        const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.2;
        head.castShadow = true;
        playerGroup.add(head);

        // Eyes (ojos cuadrados como Roblox)
        const eyeGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.02);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 2.3, 0.32);
        playerGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 2.3, 0.32);
        playerGroup.add(rightEye);

        // Mouth (boca rectangular pequeña)
        const mouthGeometry = new THREE.BoxGeometry(0.2, 0.04, 0.02);
        const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x8B0000 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 2.1, 0.32);
        playerGroup.add(mouth);

        // Arms (brazos completamente cuadrados)
        const armGeometry = new THREE.BoxGeometry(0.3, 1.0, 0.3);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.65, 1.2, 0);
        leftArm.castShadow = true;
        playerGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.65, 1.2, 0);
        rightArm.castShadow = true;
        playerGroup.add(rightArm);

        // Hands (manos cuadradas)
        const handGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
        const handMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });

        const leftHand = new THREE.Mesh(handGeometry, handMaterial);
        leftHand.position.set(-0.65, 0.6, 0);
        leftHand.castShadow = true;
        playerGroup.add(leftHand);

        const rightHand = new THREE.Mesh(handGeometry, handMaterial);
        rightHand.position.set(0.65, 0.6, 0);
        rightHand.castShadow = true;
        playerGroup.add(rightHand);

        // Legs (piernas completamente cuadradas)
        const legGeometry = new THREE.BoxGeometry(0.3, 1.0, 0.3);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x000080 });

        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.25, 0.4, 0);
        leftLeg.castShadow = true;
        playerGroup.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.25, 0.4, 0);
        rightLeg.castShadow = true;
        playerGroup.add(rightLeg);

        // Feet (zapatos cuadrados)
        const footGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.6);
        const footMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });

        const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
        leftFoot.position.set(-0.25, -0.1, 0.1);
        leftFoot.castShadow = true;
        playerGroup.add(leftFoot);

        const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
        rightFoot.position.set(0.25, -0.1, 0.1);
        rightFoot.castShadow = true;
        playerGroup.add(rightFoot);

        playerGroup.position.set(0, 0, 40);
        this.scene.add(playerGroup);
        this.player = playerGroup;
    }

    createDoll() {
        const dollGroup = new THREE.Group();

        // Cuerpo - vestido amarillo como Young-hee
        const bodyGeometry = new THREE.CylinderGeometry(1.8, 2.2, 4.5);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 }); // Amarillo dorado
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 2.5;
        body.castShadow = true;
        dollGroup.add(body);

        // Detalles del vestido - rayas rojas
        for (let i = 0; i < 3; i++) {
            const stripeGeometry = new THREE.CylinderGeometry(1.9, 2.3, 0.3);
            const stripeMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4500 }); // Rojo naranja
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.position.y = 1.5 + (i * 1.2);
            dollGroup.add(stripe);
        }

        // Cabeza - más redonda y realista
        const headGeometry = new THREE.SphereGeometry(1.4);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFE4B5 }); // Color piel más realista
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 5.8;
        head.castShadow = true;
        dollGroup.add(head);

        // Cabello - corte bob típico de Young-hee
        const hairGeometry = new THREE.SphereGeometry(1.3);
        const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x2F1B14 }); // Marrón oscuro
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 6.2;
        hair.scale.set(1, 0.8, 1); // Más plano arriba
        dollGroup.add(hair);

        // Flequillo
        const bangsGeometry = new THREE.BoxGeometry(2.2, 0.4, 1.2);
        const bangs = new THREE.Mesh(bangsGeometry, hairMaterial);
        bangs.position.set(0, 6.5, 0.8);
        dollGroup.add(bangs);

        // Ojos - más grandes y expresivos como en el show
        const eyeGeometry = new THREE.SphereGeometry(0.2);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.4, 5.9, 1.2);
        dollGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.4, 5.9, 1.2);
        dollGroup.add(rightEye);

        // Pupilas blancas brillantes
        const pupilGeometry = new THREE.SphereGeometry(0.05);
        const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(-0.38, 5.92, 1.25);
        dollGroup.add(leftPupil);

        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(0.38, 5.92, 1.25);
        dollGroup.add(rightPupil);

        // Nariz pequeña
        const noseGeometry = new THREE.SphereGeometry(0.08);
        const noseMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD7A5 });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, 5.7, 1.3);
        dollGroup.add(nose);

        // Boca - sonrisa característica
        const mouthGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.1);
        const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x8B0000 }); // Rojo oscuro
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 5.4, 1.25);
        dollGroup.add(mouth);

        // Mejillas rosadas
        const cheekGeometry = new THREE.SphereGeometry(0.15);
        const cheekMaterial = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 });

        const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
        leftCheek.position.set(-0.6, 5.5, 1.1);
        dollGroup.add(leftCheek);

        const rightCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
        rightCheek.position.set(0.6, 5.5, 1.1);
        dollGroup.add(rightCheek);

        // Brazos - más proporcionados
        const armGeometry = new THREE.CylinderGeometry(0.35, 0.4, 3);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFE4B5 });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-2.2, 3.5, 0);
        leftArm.rotation.z = Math.PI / 8;
        leftArm.castShadow = true;
        dollGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(2.2, 3.5, 0);
        rightArm.rotation.z = -Math.PI / 8;
        rightArm.castShadow = true;
        dollGroup.add(rightArm);

        // Manos
        const handGeometry = new THREE.SphereGeometry(0.3);
        const handMaterial = new THREE.MeshLambertMaterial({ color: 0xFFE4B5 });

        const leftHand = new THREE.Mesh(handGeometry, handMaterial);
        leftHand.position.set(-2.8, 2.2, 0);
        dollGroup.add(leftHand);

        const rightHand = new THREE.Mesh(handGeometry, handMaterial);
        rightHand.position.set(2.8, 2.2, 0);
        dollGroup.add(rightHand);

        // Piernas - más realistas
        const legGeometry = new THREE.CylinderGeometry(0.3, 0.35, 2);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0xFFE4B5 });

        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.8, 0.8, 0);
        leftLeg.castShadow = true;
        dollGroup.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.8, 0.8, 0);
        rightLeg.castShadow = true;
        dollGroup.add(rightLeg);

        // Zapatos - negros como en el show
        const shoeGeometry = new THREE.BoxGeometry(0.6, 0.3, 1);
        const shoeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });

        const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        leftShoe.position.set(-0.8, 0, 0.2);
        dollGroup.add(leftShoe);

        const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        rightShoe.position.set(0.8, 0, 0.2);
        dollGroup.add(rightShoe);

        dollGroup.position.set(0, 0, -38); // Centrado frente al árbol
        dollGroup.scale.set(1.5, 1.5, 1.5); // Más grande para ser imponente
        dollGroup.rotation.y = Math.PI; // Mirando hacia la línea de salida
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

        // Add corneta/speaker next to the doll
        this.createSpeakerNearDoll();

        // Create shooting holes in walls
        this.createShootingHoles();
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
            playersCount.style.display = this.settings.showPlayersCount ? 'block' : 'none';
        } else {
            topUI.style.display = 'none';
        }

        // El cronómetro se muestra independientemente si está activado
        timerContainer.style.display = this.settings.showTimer ? 'block' : 'none';
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

    startCinematicIntro() {
        // Ir directamente al juego sin pantalla cinematográfica
        this.startGame();
    }

    createCinematicOverlay() {
        const cinematicHTML = `
            <div id="cinematic-intro" class="cinematic-intro">
                <!-- Video oculto solo para audio -->
                <video id="cinematic-video" style="position: absolute; top: -9999px; left: -9999px; width: 1px; height: 1px;">
                    <source src="https://www.dropbox.com/scl/fi/mydf0veox1hc3mrudxfck/copy_D00D2D32-9E6E-45A6-8FD4-3563576E73CE.mov?rlkey=n3fjom9s21zgszd2n7c5vrvyz&st=b3hesihl&dl=1" type="video/mp4">
                </video>

                <div class="cinematic-overlay">
                    <div class="cinematic-title">
                        <h1>SQUID GAME</h1>
                        <h2>FIRST GAME</h2>
                    </div>

                    <div id="subtitle-container" class="subtitle-container">
                        <div id="subtitle-text" class="subtitle-text"></div>
                    </div>

                    <div class="cinematic-progress">
                        <div id="progress-bar" class="progress-bar"></div>
                    </div>

                    <button id="skip-intro-btn" class="skip-intro-btn">SALTAR INTRODUCCIÓN</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', cinematicHTML);

        // Event listener para saltar
        document.getElementById('skip-intro-btn').addEventListener('click', () => {
            this.skipCinematic();
        });
    }

    setupCinematicCamera() {
        // Posicionar cámara para vista cinematográfica del campo
        this.camera.position.set(15, 8, 0); // Vista lateral elevada
        this.camera.lookAt(0, 4, -38); // Mirando hacia la muñeca

        // Animación suave de cámara durante la cinemática
        this.cinematicCameraAnimation();
    }

    cinematicCameraAnimation() {
        let startTime = Date.now();
        const animationDuration = 40000; // 40 segundos para recorrer el campo

        const animateCamera = () => {
            if (!this.cinematicActive) return;

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / animationDuration, 1);

            // Movimiento circular lento alrededor del campo
            const angle = progress * Math.PI * 2;
            const radius = 25;
            const height = 8 + Math.sin(progress * Math.PI * 4) * 2;

            this.camera.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius - 10
            );

            this.camera.lookAt(0, 4, -38); // Siempre mirando hacia la muñeca

            if (progress < 1) {
                requestAnimationFrame(animateCamera);
            }
        };

        requestAnimationFrame(animateCamera);
    }

    startAnnouncementAudio() {
        console.log('🔊 INICIANDO VIDEO DESDE LA CORNETA');

        // Cambiar estado del juego para permitir movimiento
        this.gameState = 'playing';
        this.updateLightState('green');

        // Crear video directamente y reproducir
        this.createCornetaVideo();
        // Iniciar subtítulos al mismo tiempo
        this.startSubtitleSystem();

        // Iniciar el bucle del juego inmediatamente
        this.startGameLoop();

        // Finalizar después de 38 segundos
        setTimeout(() => {
            this.finishAnnouncement();
        }, 38000);
    }

    createCornetaVideo() {
        // Limpiar video anterior si existe
        if (this.cornetaVideo) {
            this.cornetaVideo.remove();
        }

        // Crear elemento de video
        this.cornetaVideo = document.createElement('video');
        this.cornetaVideo.style.position = 'absolute';
        this.cornetaVideo.style.top = '-9999px';
        this.cornetaVideo.style.left = '-9999px';
        this.cornetaVideo.style.width = '1px';
        this.cornetaVideo.style.height = '1px';
        this.cornetaVideo.style.opacity = '0';
        this.cornetaVideo.autoplay = true;
        this.cornetaVideo.controls = false;
        this.cornetaVideo.muted = false;
        this.cornetaVideo.volume = 1.0;
        this.cornetaVideo.preload = 'auto';

        // URL del video de Dropbox
        this.cornetaVideo.src = 'https://www.dropbox.com/scl/fi/mydf0veox1hc3mrudxfck/copy_D00D2D32-9E6E-45A6-8FD4-3563576E73CE.mov?rlkey=n3fjom9s21zgszd2n7c5vrvyz&st=yz2ze6h6&dl=1';

        // Agregar al DOM
        document.body.appendChild(this.cornetaVideo);

        // Eventos del video
        this.cornetaVideo.addEventListener('canplay', () => {
            console.log('✅ Video listo, reproduciendo desde corneta...');
            this.playCornetaVideo();
        });

        this.cornetaVideo.addEventListener('play', () => {
            console.log('🔊 ¡VIDEO SONANDO DESDE LA CORNETA!');
            this.activateSpeakerVisuals();
        });

        this.cornetaVideo.addEventListener('error', (e) => {
            console.error('❌ Error con video:', e);
        });

        this.cornetaVideo.addEventListener('ended', () => {
            console.log('🔇 Video terminado');
            this.cleanupCornetaVideo();
        });

        // Cargar video
        this.cornetaVideo.load();
    }

    playCornetaVideo() {
        if (!this.cornetaVideo) return;

        const playPromise = this.cornetaVideo.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('🎯 REPRODUCIENDO AUDIO ORIGINAL DEL VIDEO');
                })
                .catch((error) => {
                    console.log('Reintentando reproducción...', error);
                    // Retry con user interaction
                    setTimeout(() => {
                        this.cornetaVideo.muted = true;
                        this.cornetaVideo.play().then(() => {
                            this.cornetaVideo.muted = false;
                        });
                    }, 100);
                });
        }
    }

    activateSpeakerVisuals() {
        // Solo efectos visuales en la corneta, NO modificar el audio
        if (this.speakerNearDoll) {
            // Hacer que las luces LED parpadeen
            const children = this.speakerNearDoll.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.geometry && child.geometry.type === 'SphereGeometry' && child.position.y > 1) {
                    const blinkLED = () => {
                        if (this.gameState === 'waiting_for_announcement') {
                            child.material.emissive.setScalar(Math.random() * 0.8);
                            setTimeout(blinkLED, 150);
                        }
                    };
                    setTimeout(blinkLED, i * 50);
                }
            }

            // Pequeña vibración del altavoz
            const originalPos = this.speakerNearDoll.position.clone();
            const vibrateLoop = () => {
                if (this.gameState === 'waiting_for_announcement') {
                    this.speakerNearDoll.position.x = originalPos.x + (Math.random() - 0.5) * 0.05;
                    this.speakerNearDoll.position.y = originalPos.y + (Math.random() - 0.5) * 0.02;
                    setTimeout(vibrateLoop, 80);
                } else {
                    this.speakerNearDoll.position.copy(originalPos);
                }
            };
            vibrateLoop();
        }
    }

    cleanupCornetaVideo() {
        if (this.cornetaVideo) {
            this.cornetaVideo.pause();
            this.cornetaVideo.remove();
            this.cornetaVideo = null;
        }
    }

    cleanupAnnouncementVideo() {
        if (this.announcementVideo) {
            this.announcementVideo.pause();
            this.announcementVideo.currentTime = 0;
            if (this.announcementVideo.parentNode) {
                this.announcementVideo.remove();
            }
            this.announcementVideo = null;
        }

        // Limpiar fuente de audio
        if (this.audioSource) {
            try {
                this.audioSource.disconnect();
                this.audioSource = null;
            } catch (e) {
                console.log('Audio source ya desconectado');
            }
        }

        console.log('🔇 Audio de corneta detenido y limpiado');
    }

    createImpulseResponse(duration, decay, reverse) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const n = reverse ? length - i : i;
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
            }
        }
        return impulse;
    }

    finishAnnouncement() {
        this.makeAnnouncement("¡El anuncio ha terminado! Ya pueden cruzar la línea.");

        // Limpiar completamente el sistema de audio y subtítulos
        if (this.announcementAudio) {
            this.announcementAudio.pause();
            this.announcementAudio.currentTime = 0;
            this.announcementAudio = null;
        }

        // Limpiar video de anuncio
        this.cleanupAnnouncementVideo();

        // Limpiar subtítulos de forma segura
        this.cleanupSubtitles();

        // Limpiar cualquier animación pendiente
        if (this.typeWriterInterval) {
            clearInterval(this.typeWriterInterval);
            this.typeWriterInterval = null;
        }

        // Remover todos los contenedores de subtítulos
        const allSubtitleContainers = document.querySelectorAll('[id*="subtitle-container"]');
        allSubtitleContainers.forEach(container => {
            if (container.parentNode) {
                container.remove();
            }
        });
    }

    startSubtitleSystem() {
        console.log('Iniciando sistema de subtítulos...');

        // Limpiar cualquier subtítulo previo
        const existingContainer = document.getElementById('subtitle-container-game');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Crear contenedor de subtítulos mejorado
        const subtitleContainer = document.createElement('div');
        subtitleContainer.id = 'subtitle-container-game';
        subtitleContainer.className = 'subtitle-container';
        subtitleContainer.innerHTML = '<div id="subtitle-text-game" class="subtitle-text"></div>';
        document.getElementById('ui-overlay').appendChild(subtitleContainer);

        this.currentSubtitleIndex = 0;
        this.subtitleStartTime = Date.now();

        // Mostrar subtítulos uno por uno con timing correcto
        this.showSequentialSubtitles();
    }

    showSequentialSubtitles() {
        this.subtitles.forEach((subtitle, index) => {
            setTimeout(() => {
                if (this.gameState === 'waiting_for_announcement') {
                    this.displaySubtitle(subtitle.text);
                }
            }, subtitle.start * 1000);

            // Ocultar subtítulo al final de su tiempo
            setTimeout(() => {
                if (this.gameState === 'waiting_for_announcement') {
                    this.hideSubtitle();
                }
            }, subtitle.end * 1000);
        });
    }

    displaySubtitle(text) {
        const subtitleContainer = document.getElementById('subtitle-container-game');
        const subtitleText = document.getElementById('subtitle-text-game');

        if (!subtitleContainer || !subtitleText) return;

        console.log('Mostrando subtítulo:', text);

        subtitleText.textContent = text;
        subtitleContainer.classList.add('show-subtitle');
        subtitleContainer.style.display = 'block';

        // Efecto de aparición
        subtitleText.style.opacity = '0';
        subtitleText.style.transform = 'translateY(20px)';

        setTimeout(() => {
            if (subtitleText) {
                subtitleText.style.transition = 'all 0.5s ease';
                subtitleText.style.opacity = '1';
                subtitleText.style.transform = 'translateY(0)';
            }
        }, 100);
    }

    hideSubtitle() {
        const subtitleContainer = document.getElementById('subtitle-container-game');
        const subtitleText = document.getElementById('subtitle-text-game');

        if (!subtitleContainer || !subtitleText) return;

        subtitleText.style.transition = 'all 0.3s ease';
        subtitleText.style.opacity = '0';
        subtitleText.style.transform = 'translateY(-10px)';

        setTimeout(() => {
            if (subtitleContainer) {
                subtitleContainer.classList.remove('show-subtitle');
            }
        }, 300);
    }

    cleanupSubtitles() {
        console.log('Limpiando subtítulos...');

        if (this.subtitleInterval) {
            clearInterval(this.subtitleInterval);
            this.subtitleInterval = null;
        }

        const container = document.getElementById('subtitle-container-game');
        if (container) {
            container.style.transition = 'opacity 0.5s ease';
            container.style.opacity = '0';
            setTimeout(() => {
                if (container && container.parentNode) {
                    container.remove();
                }
            }, 500);
        }
        this.currentSubtitleIndex = 0;
    }

    // Método updateSubtitles removido - ahora se usa showSequentialSubtitles

    animateSubtitleText() {
        const subtitleText = document.getElementById('subtitle-text');
        if (!subtitleText) return;

        // Efecto de escritura tipo máquina
        const text = subtitleText.textContent;
        subtitleText.textContent = '';

        let i = 0;
        const typeWriter = setInterval(() => {
            if (i < text.length) {
                subtitleText.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeWriter);
            }
        }, 50);
    }

    skipCinematic() {
        this.cinematicActive = false;

        if (this.subtitleInterval) {
            clearInterval(this.subtitleInterval);
        }

        if (this.cinematicVideo) {
            this.cinematicVideo.pause();
            this.cinematicVideo.currentTime = 0;
        }

        // Restaurar posición de cámara del jugador
        this.camera.position.set(0, 1.8, 42);
        this.camera.rotation.set(0, 0, 0);

        const cinematicIntro = document.getElementById('cinematic-intro');
        if (cinematicIntro) {
            cinematicIntro.style.opacity = '0';
            setTimeout(() => {
                cinematicIntro.remove();
                this.startGame();
            }, 1000);
        } else {
            this.startGame();
        }
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
                this.makeAnnouncement("¡El juego ha comenzado! Puedes moverte.");
                this.gameState = 'playing';
                this.updateLightState('green');
                this.startGameLoop();
                this.startAnnouncementAudio(); // Solo para efectos de audio
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
        if (this.gameState !== 'playing' && this.gameState !== 'waiting_for_announcement') return;

        const speed = this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? 0.12 : 0.06;
        let moved = false;
        const previousPosition = { ...this.playerPosition };

        // Movimiento suave y directo sin zigzag
        let deltaX = 0;
        let deltaZ = 0;

        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            deltaZ -= speed;
            moved = true;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            deltaZ += speed;
            moved = true;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            deltaX -= speed;
            moved = true;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            deltaX += speed;
            moved = true;
        }

        // Aplicar movimiento suave
        this.playerPosition.x += deltaX;
        this.playerPosition.z += deltaZ;

        // Boundary checking
        this.playerPosition.x = Math.max(-24, Math.min(24, this.playerPosition.x));
        this.playerPosition.z = Math.max(-44, Math.min(45, this.playerPosition.z));

        // Restricción de línea durante el anuncio - no pueden cruzar la línea de salida
        if (this.cornetaVideo && !this.cornetaVideo.ended && this.playerPosition.z < 38) {
            this.playerPosition.z = 38;
            this.makeAnnouncement("¡Espera a que termine el anuncio antes de cruzar la línea!");
        }

        // Check for movement during red light (solo durante el juego activo)
        if (this.gameState === 'playing' && moved && this.lightState === 'red' && this.dollLookingBack) {
            this.triggerEliminationSequence();
            return;
        }

        // Check for victory (solo durante el juego activo)
        if (this.gameState === 'playing' && this.playerPosition.z <= -44) {
            this.endGame('victory');
            return;
        }

        // Update player and camera positions suavemente
        this.player.position.set(this.playerPosition.x, 0, this.playerPosition.z);
        this.camera.position.set(this.playerPosition.x, 1.8, this.playerPosition.z);

        // Simple walking animation
        if (moved) {
            const time = performance.now() * 0.008;
            this.player.children[3].rotation.x = Math.sin(time) * 0.2; // Left leg
            this.player.children[4].rotation.x = -Math.sin(time) * 0.2; // Right leg
            this.player.children[1].rotation.x = Math.sin(time) * 0.15; // Left arm
            this.player.children[2].rotation.x = -Math.sin(time) * 0.15; // Right arm
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

    triggerEliminationSequence() {
        this.gameState = 'eliminating';
        
        // Activar los agujeros de disparo
        this.activateShootingHoles();
        
        // Después de 1 segundo, disparar
        setTimeout(() => {
            this.executeShootingSequence();
        }, 1000);
    }

    activateShootingHoles() {
        console.log('🎯 Activando sistema de eliminación...');
        
        this.shootingHoles.forEach((hole, index) => {
            // Cambiar LED a rojo para indicar activación
            hole.led.material.color.setHex(0xFF0000);
            hole.led.material.emissive.setHex(0x440000);
            hole.led.material.emissiveIntensity = 0.8;
            
            // Sonido de carga del arma
            setTimeout(() => {
                if (this.audioContext) {
                    this.playSound(800 + index * 100, 0.3, 'sawtooth');
                }
                
                // Extender ligeramente el cañón
                hole.barrel.scale.z = 1.5;
                hole.active = true;
            }, index * 200);
        });
    }

    executeShootingSequence() {
        console.log('🔫 Ejecutando secuencia de disparo...');
        
        // Seleccionar 2-3 agujeros aleatorios para disparar
        const activeHoles = [...this.shootingHoles].sort(() => 0.5 - Math.random()).slice(0, 3);
        
        activeHoles.forEach((hole, index) => {
            setTimeout(() => {
                this.createBulletTrail(hole);
            }, index * 150);
        });
        
        // Después de los disparos, matar al jugador
        setTimeout(() => {
            this.killPlayer();
        }, 800);
    }

    createBulletTrail(hole) {
        // Crear rastro visual del disparo
        const bulletTrailGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1);
        const bulletTrailMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFF00,
            emissive: 0x444400,
            emissiveIntensity: 0.8
        });
        const bulletTrail = new THREE.Mesh(bulletTrailGeometry, bulletTrailMaterial);
        
        // Calcular dirección del disparo hacia el jugador
        const holePos = hole.group.position;
        const playerPos = this.player.position;
        
        const direction = new THREE.Vector3(
            playerPos.x - holePos.x,
            playerPos.y + 1 - holePos.y,
            playerPos.z - holePos.z
        ).normalize();
        
        // Posicionar el rastro
        bulletTrail.position.copy(holePos);
        bulletTrail.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
        
        this.scene.add(bulletTrail);
        
        // Flash del disparo
        const flashGeometry = new THREE.SphereGeometry(0.3);
        const flashMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFFFF,
            emissive: 0xFFFFFF,
            emissiveIntensity: 2
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(holePos);
        this.scene.add(flash);
        
        // Sonido del disparo
        if (this.audioContext) {
            this.playSound(1200, 0.2, 'square');
            setTimeout(() => this.playSound(300, 0.3, 'sawtooth'), 100);
        }
        
        // Animar el rastro del proyectil
        const startPos = holePos.clone();
        const endPos = new THREE.Vector3(playerPos.x, playerPos.y + 1, playerPos.z);
        const animationDuration = 200; // milisegundos
        const startTime = performance.now();
        
        const animateBullet = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / animationDuration, 1);
            
            // Interpolación lineal
            bulletTrail.position.lerpVectors(startPos, endPos, progress);
            bulletTrail.scale.z = 1 + progress * 5; // Alargar el rastro
            
            if (progress < 1) {
                requestAnimationFrame(animateBullet);
            } else {
                // Limpiar efectos
                this.scene.remove(bulletTrail);
                
                // Crear impacto en el jugador
                this.createBloodEffect(playerPos);
            }
        };
        
        requestAnimationFrame(animateBullet);
        
        // Limpiar flash
        setTimeout(() => {
            this.scene.remove(flash);
        }, 100);
        
        // Reset LED
        setTimeout(() => {
            hole.led.material.color.setHex(0x00FF00);
            hole.led.material.emissive.setHex(0x002200);
            hole.led.material.emissiveIntensity = 0.5;
            hole.barrel.scale.z = 1;
            hole.active = false;
        }, 2000);
    }

    createBloodEffect(position) {
        // Crear efecto de sangre
        for (let i = 0; i < 15; i++) {
            const bloodDropGeometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.03);
            const bloodDropMaterial = new THREE.MeshBasicMaterial({ color: 0x8B0000 });
            const bloodDrop = new THREE.Mesh(bloodDropGeometry, bloodDropMaterial);
            
            bloodDrop.position.set(
                position.x + (Math.random() - 0.5) * 0.5,
                position.y + Math.random() * 0.5,
                position.z + (Math.random() - 0.5) * 0.5
            );
            
            this.scene.add(bloodDrop);
            
            // Animar caída de sangre
            const fallSpeed = 0.02 + Math.random() * 0.03;
            const animateBloodDrop = () => {
                bloodDrop.position.y -= fallSpeed;
                if (bloodDrop.position.y > 0) {
                    requestAnimationFrame(animateBloodDrop);
                } else {
                    // Crear mancha en el suelo
                    this.createBloodStain(bloodDrop.position.x, bloodDrop.position.z);
                    this.scene.remove(bloodDrop);
                }
            };
            
            setTimeout(() => {
                requestAnimationFrame(animateBloodDrop);
            }, i * 50);
        }
    }

    createBloodStain(x, z) {
        const stainGeometry = new THREE.CircleGeometry(0.1 + Math.random() * 0.05);
        const stainMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x660000,
            transparent: true,
            opacity: 0.8
        });
        const stain = new THREE.Mesh(stainGeometry, stainMaterial);
        stain.position.set(x, 0.01, z);
        stain.rotation.x = -Math.PI / 2;
        this.scene.add(stain);
    }

    killPlayer() {
        console.log('💀 Eliminando jugador...');
        
        // Crear animación de muerte - caída al suelo
        const originalY = this.player.position.y;
        const fallDuration = 1500;
        const startTime = performance.now();
        
        const animateDeath = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / fallDuration, 1);
            
            // Caída con rotación
            this.player.position.y = originalY * (1 - progress);
            this.player.rotation.x = progress * Math.PI / 2; // Rotar hacia adelante
            this.player.rotation.z = (Math.random() - 0.5) * progress * 0.5; // Ligera rotación lateral
            
            // Hacer que las partes del cuerpo se separen ligeramente
            if (progress > 0.5) {
                this.player.children.forEach((part, index) => {
                    if (index > 0) { // No mover el torso principal
                        part.position.x += (Math.random() - 0.5) * 0.02;
                        part.position.z += (Math.random() - 0.5) * 0.02;
                    }
                });
            }
            
            if (progress < 1) {
                requestAnimationFrame(animateDeath);
            } else {
                // Terminar el juego después de la animación
                setTimeout(() => {
                    this.endGame('caught');
                }, 1000);
            }
        };
        
        // Sonido de muerte
        if (this.audioContext) {
            setTimeout(() => this.playSound(220, 1, 'sawtooth'), 300);
            setTimeout(() => this.playSound(110, 1.5, 'triangle'), 600);
        }
        
        requestAnimationFrame(animateDeath);
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