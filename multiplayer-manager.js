
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
            // Crear o unirse a una sala
            const roomRef = ref(database, 'lobby/waitingRoom');
            const snapshot = await get(roomRef);
            
            if (!snapshot.exists()) {
                // Crear nueva sala
                await set(roomRef, {
                    created: serverTimestamp(),
                    status: 'waiting',
                    countdown: 30
                });
                this.isHost = true;
            }

            // Obtener el siguiente número de jugador disponible
            const playersRef = ref(database, 'lobby/waitingRoom/players');
            const playersSnapshot = await get(playersRef);
            const existingPlayers = playersSnapshot.val() || {};
            
            // Encontrar el número más bajo disponible (1-456)
            const usedNumbers = Object.values(existingPlayers).map(p => p.number);
            this.playerNumber = this.findAvailableNumber(usedNumbers);

            // Añadir jugador a la sala
            const playerRef = ref(database, `lobby/waitingRoom/players/${this.playerId}`);
            await set(playerRef, {
                id: this.playerId,
                number: this.playerNumber,
                name: `Jugador ${this.playerNumber.toString().padStart(3, '0')}`,
                position: { x: 0, z: 40 },
                status: 'alive',
                connected: true,
                joinedAt: serverTimestamp()
            });

            this.currentRoom = 'waitingRoom';
            this.setupPlayerListeners();
            
            if (this.isHost) {
                this.startCountdown();
            }

            return this.playerNumber;
        } catch (error) {
            console.error('Error al unirse al lobby:', error);
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
        const playersRef = ref(database, `lobby/${this.currentRoom}/players`);
        onValue(playersRef, (snapshot) => {
            const playersData = snapshot.val();
            if (playersData) {
                this.players = playersData;
                this.updatePlayersDisplay();
            }
        });

        // Escuchar estado del juego
        const gameStateRef = ref(database, `lobby/${this.currentRoom}/gameState`);
        onValue(gameStateRef, (snapshot) => {
            const gameState = snapshot.val();
            if (gameState && gameState.status === 'started' && !this.gameStarted) {
                this.gameStarted = true;
                this.startGame();
            }
        });

        // Escuchar countdown
        const countdownRef = ref(database, `lobby/${this.currentRoom}/countdown`);
        onValue(countdownRef, (snapshot) => {
            const countdown = snapshot.val();
            if (countdown !== null) {
                this.updateCountdownDisplay(countdown);
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
            const positionRef = ref(database, `lobby/${this.currentRoom}/players/${this.playerId}/position`);
            await set(positionRef, { x, z });
        }
    }

    async updatePlayerStatus(status) {
        if (this.currentRoom && this.playerId) {
            const statusRef = ref(database, `lobby/${this.currentRoom}/players/${this.playerId}/status`);
            await set(statusRef, status);
        }
    }

    async eliminatePlayer() {
        await this.updatePlayerStatus('eliminated');
    }

    updatePlayersDisplay() {
        // Actualizar la visualización de jugadores en el lobby
        if (window.game && window.game.updateMultiplayerPlayers) {
            window.game.updateMultiplayerPlayers(this.players);
        }
    }

    updateCountdownDisplay(countdown) {
        if (window.game && window.game.updateLobbyCountdown) {
            window.game.updateLobbyCountdown(countdown);
        }
    }

    startGame() {
        if (window.game && window.game.startMultiplayerGame) {
            window.game.startMultiplayerGame(this.players, this.playerNumber);
        }
    }

    async disconnect() {
        if (this.currentRoom && this.playerId) {
            const playerRef = ref(database, `lobby/${this.currentRoom}/players/${this.playerId}`);
            await remove(playerRef);
        }
    }
}

export default MultiplayerManager;
