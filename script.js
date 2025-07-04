
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
        this.playerPosition = { x: 0, z: 45 };
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
        this.camera.position.set(0, 1.8, 47);
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
        const wallHeight = 8;
        const wallThickness = 0.5;

        // Wall material - sky color
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB });

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

        // Door
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const door = new THREE.Mesh(new THREE.BoxGeometry(20, wallHeight/2, wallThickness), doorMaterial);
        door.position.set(0, wallHeight/4, 50);
        this.scene.add(door);

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

    createLines() {
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

        // Start line
        const startLine = new THREE.Mesh(
            new THREE.BoxGeometry(50, 0.1, 0.5),
            lineMaterial
        );
        startLine.position.set(0, 0.05, 45);
        this.scene.add(startLine);

        // Finish line
        const finishLine = new THREE.Mesh(
            new THREE.BoxGeometry(50, 0.1, 0.5),
            lineMaterial
        );
        finishLine.position.set(0, 0.05, -45);
        this.scene.add(finishLine);
    }

    createTree() {
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(-15, 4, -40);
        trunk.castShadow = true;
        this.scene.add(trunk);

        // Tree branches (bare)
        for (let i = 0; i < 8; i++) {
            const branchGeometry = new THREE.CylinderGeometry(0.1, 0.2, 3);
            const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
            const angle = (i / 8) * Math.PI * 2;
            branch.position.set(
                -15 + Math.cos(angle) * 2,
                6 + Math.random() * 2,
                -40 + Math.sin(angle) * 2
            );
            branch.rotation.z = Math.random() * 0.5;
            branch.castShadow = true;
            this.scene.add(branch);
        }
    }

    createBackgroundMural() {
        const muralGeometry = new THREE.PlaneGeometry(60, 20);
        const muralCanvas = document.createElement('canvas');
        muralCanvas.width = 512;
        muralCanvas.height = 171;
        const ctx = muralCanvas.getContext('2d');

        // Sky
        const gradient = ctx.createLinearGradient(0, 0, 0, 171);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 171);

        // Simple hills
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.moveTo(0, 171);
        for (let x = 0; x <= 512; x += 50) {
            ctx.lineTo(x, 120 + Math.sin(x * 0.01) * 20);
        }
        ctx.lineTo(512, 171);
        ctx.closePath();
        ctx.fill();

        // Simple houses
        ctx.fillStyle = '#FF6347';
        ctx.fillRect(50, 90, 60, 40);
        ctx.fillRect(150, 100, 50, 30);
        ctx.fillRect(300, 85, 70, 45);

        // Roofs
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(40, 90);
        ctx.lineTo(80, 70);
        ctx.lineTo(120, 90);
        ctx.closePath();
        ctx.fill();

        const muralTexture = new THREE.CanvasTexture(muralCanvas);
        const muralMaterial = new THREE.MeshLambertMaterial({ map: muralTexture });
        const mural = new THREE.Mesh(muralGeometry, muralMaterial);
        mural.position.set(0, 10, -49.5);
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

        playerGroup.position.set(0, 0, 45);
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

        dollGroup.position.set(-15, 0, -35); // In front of the tree
        dollGroup.scale.set(1.2, 1.2, 1.2);
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

        // Create guards around the doll (in front of the tree)
        createGuard(-18, -35 - guardSpacing);
        createGuard(-18, -35 + guardSpacing);
        createGuard(-12, -35 - guardSpacing);
        createGuard(-12, -35 + guardSpacing);
    }

    setupControls() {
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });

        document.addEventListener('click', () => {
            if (!this.mouseLocked && this.gameState === 'playing') {
                document.body.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.mouseLocked = document.pointerLockElement === document.body;
        });

        document.addEventListener('mousemove', (event) => {
            if (this.mouseLocked && this.gameState === 'playing') {
                this.camera.rotation.y -= event.movementX * 0.002;
                this.camera.rotation.x -= event.movementY * 0.002;
                this.camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.camera.rotation.x));
            }
        });

        // UI Event Listeners
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.restartGame();
        });
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
        // Show visual announcement only
        if (showVisual) {
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
        
        // Initial game announcement
        setTimeout(() => {
            this.makeAnnouncement(`¡Bienvenidos al Squid Game, Nivel ${this.currentLevel}!`);
        }, 1000);
        
        setTimeout(() => {
            this.makeAnnouncement(`${this.gameTitle}. Tienen 2 minutos para cruzar la línea de meta.`);
        }, 4000);
        
        setTimeout(() => {
            this.makeAnnouncement("Cuando diga LUZ VERDE, pueden moverse. Cuando diga LUZ ROJA, deben detenerse completamente.");
        }, 8000);
        
        setTimeout(() => {
            this.makeAnnouncement("Si se mueven durante LUZ ROJA... serán eliminados.");
        }, 12000);
        
        setTimeout(() => {
            this.startCountdown();
        }, 16000);
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
        const rotationDiff = targetRotation - startRotation;
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

        // Movement
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.playerPosition.z -= speed * Math.cos(this.camera.rotation.y);
            this.playerPosition.x -= speed * Math.sin(this.camera.rotation.y);
            moved = true;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.playerPosition.z += speed * Math.cos(this.camera.rotation.y);
            this.playerPosition.x += speed * Math.sin(this.camera.rotation.y);
            moved = true;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.playerPosition.z -= speed * Math.sin(this.camera.rotation.y);
            this.playerPosition.x += speed * Math.cos(this.camera.rotation.y);
            moved = true;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.playerPosition.z += speed * Math.sin(this.camera.rotation.y);
            this.playerPosition.x -= speed * Math.cos(this.camera.rotation.y);
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
        this.playerPosition = { x: 0, z: 45 };

        // Reset UI
        document.getElementById('timer').textContent = this.gameTime;
        document.getElementById('players-alive').textContent = this.playersAlive;
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('victory-screen').classList.add('hidden');

        // Reset player position
        this.player.position.set(0, 0, 45);
        this.camera.position.set(0, 1.8, 47);
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

        this.updatePlayer();
        this.renderer.render(this.scene, this.camera);
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
