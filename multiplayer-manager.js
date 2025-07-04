
import { database, ref, set, get, onValue, remove, push, serverTimestamp } from './firebase-config.js';

class MultiplayerManager {
    constructor() {
        this.playerId = this.generatePlayerId();
        this.playerNumber = null;
        this.currentRoom = null;
        this.players = {};
        this.isHost = false;
        this.gameStarted = false;
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    async joinLobby() {
        try {
            console.log('🎮 Uniéndose automáticamente al multijugador...');
            
            // Crear o unirse a una sala global
            const roomRef = ref(database, 'game/activeRoom');
            const snapshot = await get(roomRef);
            
            if (!snapshot.exists()) {
                // Crear nueva sala
                await set(roomRef, {
                    created: serverTimestamp(),
                    status: 'active',
                    gameMode: 'red-light-green-light'
                });
                this.isHost = true;
                console.log('🏠 Creando nueva sala multijugador');
            } else {
                console.log('🔗 Uniéndose a sala existente');
            }

            // Obtener el siguiente número de jugador disponible
            const playersRef = ref(database, 'game/activeRoom/players');
            const playersSnapshot = await get(playersRef);
            const existingPlayers = playersSnapshot.val() || {};
            
            // Encontrar el número más bajo disponible (1-456)
            const usedNumbers = Object.values(existingPlayers).map(p => p.number);
            this.playerNumber = this.findAvailableNumber(usedNumbers);

            // Añadir jugador a la sala
            const playerRef = ref(database, `game/activeRoom/players/${this.playerId}`);
            await set(playerRef, {
                id: this.playerId,
                number: this.playerNumber,
                name: `Jugador ${this.playerNumber.toString().padStart(3, '0')}`,
                position: { x: (Math.random() - 0.5) * 10, z: 40 }, // Posición inicial aleatoria
                status: 'alive',
                connected: true,
                joinedAt: serverTimestamp()
            });

            this.currentRoom = 'activeRoom';
            this.setupPlayerListeners();
            
            console.log(`✅ Conectado como Jugador ${this.playerNumber}`);
            return this.playerNumber;
        } catch (error) {
            console.error('❌ Error al unirse al lobby:', error);
            // Generar número aleatorio como fallback
            return Math.floor(Math.random() * 456) + 1;
        }
    }

    findAvailableNumber(usedNumbers) {
        for (let i = 1; i <= 456; i++) {
            if (!usedNumbers.includes(i)) {
                return i;
            }
        }
        return Math.floor(Math.random() * 456) + 1; // Fallback
    }

    setupPlayerListeners() {
        // Escuchar cambios en los jugadores
        const playersRef = ref(database, `game/${this.currentRoom}/players`);
        onValue(playersRef, (snapshot) => {
            const playersData = snapshot.val();
            if (playersData) {
                this.players = playersData;
                this.updatePlayersDisplay();
            }
        });

        // Escuchar estado del juego
        const gameStateRef = ref(database, `game/${this.currentRoom}/gameState`);
        onValue(gameStateRef, (snapshot) => {
            const gameState = snapshot.val();
            if (gameState && gameState.status === 'started' && !this.gameStarted) {
                this.gameStarted = true;
                this.startGame();
            }
        });
    }

    async startCountdown() {
        let countdown = 30;
        const countdownRef = ref(database, `lobby/${this.currentRoom}/countdown`);
        
        const countdownInterval = setInterval(async () => {
            countdown--;
            await set(countdownRef, countdown);

            if (countdown <= 0) {
                clearInterval(countdownInterval);
                await this.startGameForAll();
            }
        }, 1000);
    }

    async startGameForAll() {
        const gameStateRef = ref(database, `lobby/${this.currentRoom}/gameState`);
        await set(gameStateRef, {
            status: 'started',
            startTime: serverTimestamp()
        });
    }

    async updatePlayerPosition(x, z) {
        if (this.currentRoom && this.playerId) {
            const positionRef = ref(database, `game/${this.currentRoom}/players/${this.playerId}/position`);
            await set(positionRef, { x, z });
        }
    }

    async updatePlayerStatus(status) {
        if (this.currentRoom && this.playerId) {
            const statusRef = ref(database, `game/${this.currentRoom}/players/${this.playerId}/status`);
            await set(statusRef, status);
        }
    }

    async eliminatePlayer() {
        await this.updatePlayerStatus('eliminated');
    }

    updatePlayersDisplay() {
        // Actualizar la visualización de jugadores
        if (window.squidGame && window.squidGame.updateMultiplayerPlayers) {
            window.squidGame.updateMultiplayerPlayers(this.players);
        }
    }

    updateCountdownDisplay(countdown) {
        // Ya no necesario para auto-start
        console.log('Countdown:', countdown);
    }

    startGame() {
        // Ya no necesario para auto-start
        console.log('Juego iniciado automáticamente');
    }

    async disconnect() {
        if (this.currentRoom && this.playerId) {
            const playerRef = ref(database, `game/${this.currentRoom}/players/${this.playerId}`);
            await remove(playerRef);
        }
    }
}

export default MultiplayerManager;
