class BattleShipGame {
    constructor() {
        this.playerBoard = new GameBoard(10);
        this.enemyBoard = new GameBoard(10);
        this.ai = new BattleshipAI('normal');
        
        this.currentPhase = 'SETUP';
        this.currentTurn = 'PLAYER';
        this.combo = 0;
        this.selectedShip = null;
        this.isShipHorizontal = true;
        this.placedShips = [];
        this.selectedTarget = null;
        this.isAnimating = false;
        
        this.stats = {
            totalShots: 0,
            hits: 0,
            maxCombo: 0
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createBoards();
        this.createShipSelector();
        this.updateUI();
        gameAnimation.init();
    }
    
    setupEventListeners() {
        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');
        const playAgainBtn = document.getElementById('play-again-btn');
        const difficultySelect = document.getElementById('difficulty');
        const rotateBtn = document.getElementById('rotate-btn');
        const randomPlacementBtn = document.getElementById('random-placement-btn');
        const confirmPlacementBtn = document.getElementById('confirm-placement-btn');
        const fireBtn = document.getElementById('fire-btn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartGame());
        }
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                document.getElementById('game-over-modal').classList.add('hidden');
                this.restartGame();
            });
        }
        
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.ai.setDifficulty(e.target.value);
                gameAudio.playUI();
            });
        }
        
        if (rotateBtn) {
            rotateBtn.addEventListener('click', () => {
                this.isShipHorizontal = !this.isShipHorizontal;
                gameAudio.playUI();
                this.showPreview();
            });
        }
        
        if (randomPlacementBtn) {
            randomPlacementBtn.addEventListener('click', () => {
                this.randomPlacement();
                gameAudio.playUI();
            });
        }
        
        if (confirmPlacementBtn) {
            confirmPlacementBtn.addEventListener('click', () => {
                this.confirmPlacement();
            });
        }
        
        if (fireBtn) {
            fireBtn.addEventListener('click', () => {
                this.fireAtTarget();
            });
        }
    }
    
    createBoards() {
        this.createBoard('player');
        this.createBoard('enemy');
    }
    
    createBoard(type) {
        const boardElement = type === 'player' ? 
            document.getElementById('player-board') : 
            document.getElementById('enemy-board');
        
        if (!boardElement) return;
        
        boardElement.innerHTML = '';
        
        for (let row = 0; row <= 10; row++) {
            for (let col = 0; col <= 10; col++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                
                if (row === 0 || col === 0) {
                    cell.classList.add('coord-label');
                    
                    if (row === 0 && col > 0) {
                        cell.textContent = String.fromCharCode(64 + col);
                    } else if (col === 0 && row > 0) {
                        cell.textContent = row;
                    }
                } else {
                    const actualRow = row - 1;
                    const actualCol = col - 1;
                    
                    cell.dataset.row = actualRow;
                    cell.dataset.col = actualCol;
                    cell.dataset.type = type;
                    
                    cell.addEventListener('click', (e) => {
                        if (this.isAnimating) return;
                        
                        if (type === 'player' && this.currentPhase === 'SETUP') {
                            this.handlePlayerBoardClick(actualRow, actualCol);
                        } else if (type === 'enemy' && this.currentPhase === 'PLAYING' && this.currentTurn === 'PLAYER') {
                            this.handleEnemyBoardClick(actualRow, actualCol);
                        }
                    });
                    
                    cell.addEventListener('mouseenter', (e) => {
                        if (this.isAnimating) return;
                        
                        if (type === 'player' && this.currentPhase === 'SETUP') {
                            this.handlePlayerBoardHover(actualRow, actualCol);
                        } else if (type === 'enemy' && this.currentPhase === 'PLAYING' && this.currentTurn === 'PLAYER') {
                            this.handleEnemyBoardHover(actualRow, actualCol);
                        }
                    });
                    
                    cell.addEventListener('mouseleave', (e) => {
                        this.clearPreview();
                    });
                }
                
                boardElement.appendChild(cell);
            }
        }
    }
    
    createShipSelector() {
        const selector = document.getElementById('ship-selector');
        if (!selector) return;
        
        selector.innerHTML = '';
        
        SHIP_TYPES.forEach(ship => {
            const option = document.createElement('div');
            option.className = 'ship-option';
            option.dataset.ship = ship.name;
            
            const preview = document.createElement('div');
            preview.className = 'ship-preview';
            
            for (let i = 0; i < ship.length; i++) {
                const cell = document.createElement('div');
                cell.className = 'ship-preview-cell';
                preview.appendChild(cell);
            }
            
            const name = document.createElement('span');
            name.className = 'ship-name';
            name.textContent = ship.displayName;
            
            option.appendChild(preview);
            option.appendChild(name);
            
            option.addEventListener('click', () => {
                if (this.placedShips.includes(ship.name)) return;
                this.selectShip(ship);
            });
            
            selector.appendChild(option);
        });
    }
    
    selectShip(ship) {
        this.selectedShip = ship;
        
        document.querySelectorAll('.ship-option').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.dataset.ship === ship.name) {
                opt.classList.add('selected');
            }
        });
        
        this.clearPreview();
    }
    
    handlePlayerBoardClick(row, col) {
        if (!this.selectedShip) return;
        if (this.placedShips.includes(this.selectedShip.name)) return;
        
        const success = this.playerBoard.placeShip(
            this.selectedShip,
            row,
            col,
            this.isShipHorizontal
        );
        
        if (success) {
            this.placedShips.push(this.selectedShip.name);
            gameAudio.playUI();
            
            const options = document.querySelectorAll('.ship-option');
            options.forEach(opt => {
                if (opt.dataset.ship === this.selectedShip.name) {
                    opt.classList.add('placed');
                    opt.classList.remove('selected');
                }
            });
            
            this.updateBoardDisplay('player');
            this.updateShipStatus('player');
            this.selectedShip = null;
            this.clearPreview();
        }
    }
    
    handlePlayerBoardHover(row, col) {
        if (!this.selectedShip) return;
        
        this.showPlacementPreview(row, col);
    }
    
    showPlacementPreview(row, col) {
        this.clearPreview();
        
        const length = this.selectedShip.length;
        const positions = [];
        
        for (let i = 0; i < length; i++) {
            let r = row;
            let c = col;
            
            if (this.isShipHorizontal) {
                c += i;
            } else {
                r += i;
            }
            
            positions.push({ row: r, col: c });
        }
        
        let isValid = true;
        positions.forEach(pos => {
            if (pos.row < 0 || pos.row >= 10 || pos.col < 0 || pos.col >= 10) {
                isValid = false;
                return;
            }
            
            const cell = this.playerBoard.grid[pos.row][pos.col];
            if (cell.ship !== null) {
                isValid = false;
            }
        });
        
        positions.forEach(pos => {
            const cellElement = document.querySelector(
                `#player-board .board-cell[data-row="${pos.row}"][data-col="${pos.col}"]`
            );
            if (cellElement) {
                cellElement.classList.add(isValid ? 'selected' : '');
                if (isValid) {
                    cellElement.style.backgroundColor = 'rgba(212, 175, 55, 0.4)';
                }
            }
        });
    }
    
    clearPreview() {
        document.querySelectorAll('.board-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
            cell.style.backgroundColor = '';
        });
    }
    
    handleEnemyBoardClick(row, col) {
        if (!this.enemyBoard.canFire(row, col)) return;
        
        this.selectedTarget = { row, col };
        this.highlightTarget(row, col);
        this.updateTargetDisplay(row, col);
        
        const fireBtn = document.getElementById('fire-btn');
        if (fireBtn) {
            fireBtn.disabled = false;
        }
    }
    
    handleEnemyBoardHover(row, col) {
        if (!this.enemyBoard.canFire(row, col)) return;
        
        const cell = document.querySelector(
            `#enemy-board .board-cell[data-row="${row}"][data-col="${col}"]`
        );
        if (cell && !cell.classList.contains('hit') && !cell.classList.contains('miss')) {
            cell.classList.add('selected');
        }
        
        this.updatePredictionLine(row, col);
    }
    
    highlightTarget(row, col) {
        document.querySelectorAll('#enemy-board .board-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        const cell = document.querySelector(
            `#enemy-board .board-cell[data-row="${row}"][data-col="${col}"]`
        );
        if (cell) {
            cell.classList.add('selected');
        }
    }
    
    updateTargetDisplay(row, col) {
        const targetCoord = document.getElementById('target-coord');
        if (targetCoord) {
            const colLetter = String.fromCharCode(65 + col);
            targetCoord.textContent = `${colLetter}${row + 1}`;
        }
    }
    
    updatePredictionLine(row, col) {
        const sceneContainer = document.querySelector('.scene-container');
        if (!sceneContainer) return;
        
        const rect = sceneContainer.getBoundingClientRect();
        const startX = rect.left + 50;
        const startY = rect.bottom - 50;
        const endX = rect.left + (col + 0.5) * (rect.width / 10);
        const endY = rect.top + (row + 0.5) * (rect.height / 10);
        
        gameAnimation.updatePredictionLine(startX, startY, endX, endY);
    }
    
    async fireAtTarget() {
        if (!this.selectedTarget) return;
        if (this.isAnimating) return;
        if (this.currentTurn !== 'PLAYER') return;
        
        this.isAnimating = true;
        
        const { row, col } = this.selectedTarget;
        
        if (oceanScene) {
            const fromPos = new THREE.Vector3(-25, 2, 0);
            const toPos = new THREE.Vector3(
                (col - 4.5) * 2,
                0,
                (row - 4.5) * 2
            );
            
            gameAudio.playCannon();
            await oceanScene.createProjectile(fromPos, toPos, true);
        }
        
        const result = this.enemyBoard.fire(row, col);
        this.stats.totalShots++;
        
        if (result.success) {
            if (result.result === 'HIT' || result.result === 'SUNK') {
                this.stats.hits++;
                this.combo++;
                if (this.combo > this.stats.maxCombo) {
                    this.stats.maxCombo = this.combo;
                }
                
                gameAudio.playHit();
                
                if (oceanScene) {
                    const pos = new THREE.Vector3(
                        (col - 4.5) * 2,
                        0.5,
                        (row - 4.5) * 2
                    );
                    await oceanScene.createExplosion(pos, true);
                }
                
                await gameAnimation.playShotAnimation('player', 'enemy', row, col, true);
                await gameAnimation.playComboAnimation(this.combo);
                gameAudio.playCombo(this.combo);
                
                if (result.result === 'SUNK') {
                    gameAudio.playSunk();
                    await gameAnimation.playShipSunkAnimation(result.ship, 'enemy');
                    this.updateShipStatus('enemy');
                    
                    if (oceanScene) {
                        await oceanScene.sinkShip(result.ship);
                    }
                }
                
                this.updateBoardDisplay('enemy');
                
                if (this.enemyBoard.isAllShipsSunk()) {
                    await this.endGame(true);
                    return;
                }
                
                gameAnimation.showMessage('命中！继续攻击！');
                
            } else {
                gameAudio.playMiss();
                
                if (oceanScene) {
                    const pos = new THREE.Vector3(
                        (col - 4.5) * 2,
                        0.5,
                        (row - 4.5) * 2
                    );
                    await oceanScene.createExplosion(pos, false);
                    await oceanScene.createWaterSplash(pos);
                }
                
                await gameAnimation.playShotAnimation('player', 'enemy', row, col, false);
                this.updateBoardDisplay('enemy');
                
                if (this.combo > 0) {
                    await gameAnimation.playComboAnimation(0);
                }
                this.combo = 0;
                
                gameAnimation.showMessage('未命中。敌方回合...');
                
                await this.sleep(500);
                this.switchTurn();
            }
        }
        
        this.selectedTarget = null;
        const fireBtn = document.getElementById('fire-btn');
        if (fireBtn) {
            fireBtn.disabled = true;
        }
        
        this.isAnimating = false;
        gameAnimation.hidePredictionLine();
    }
    
    switchTurn() {
        if (this.currentTurn === 'PLAYER') {
            this.currentTurn = 'ENEMY';
            gameAnimation.playTurnTransition(true, false);
            this.executeAITurn();
        } else {
            this.currentTurn = 'PLAYER';
            gameAnimation.playTurnTransition(false, true);
        }
        this.updateUI();
    }
    
    async executeAITurn() {
        await this.sleep(800);
        
        while (this.currentTurn === 'ENEMY' && !this.playerBoard.isAllShipsSunk()) {
            this.isAnimating = true;
            
            const move = this.ai.getNextMove(this.playerBoard);
            if (!move) break;
            
            gameAnimation.showMessage(`敌方正在瞄准...`);
            await this.sleep(600);
            
            if (oceanScene) {
                const fromPos = new THREE.Vector3(25, 2, 0);
                const toPos = new THREE.Vector3(
                    (move.col - 4.5) * 2,
                    0,
                    (move.row - 4.5) * 2
                );
                
                gameAudio.playCannon();
                await oceanScene.createProjectile(fromPos, toPos, false);
            }
            
            const result = this.playerBoard.fire(move.row, move.col);
            
            if (result.success) {
                this.ai.recordResult(result.result, move.row, move.col, result.ship);
                
                if (result.result === 'HIT' || result.result === 'SUNK') {
                    gameAudio.playHit();
                    
                    if (oceanScene) {
                        const pos = new THREE.Vector3(
                            (move.col - 4.5) * 2,
                            0.5,
                            (move.row - 4.5) * 2
                        );
                        await oceanScene.createExplosion(pos, true);
                    }
                    
                    await gameAnimation.playShotAnimation('enemy', 'player', move.row, move.col, true);
                    
                    if (result.result === 'SUNK') {
                        gameAudio.playSunk();
                        await gameAnimation.playShipSunkAnimation(result.ship, 'player');
                        this.updateShipStatus('player');
                        
                        if (oceanScene) {
                            await oceanScene.sinkShip(result.ship);
                        }
                        
                        gameAnimation.showMessage(`我方${SHIP_TYPES.find(s => s.name === result.ship)?.displayName}被击沉！`);
                    } else {
                        gameAnimation.showMessage('我方舰船被击中！');
                    }
                    
                    this.updateBoardDisplay('player');
                    
                    if (this.playerBoard.isAllShipsSunk()) {
                        await this.endGame(false);
                        return;
                    }
                    
                    await this.sleep(400);
                    
                } else {
                    gameAudio.playMiss();
                    
                    if (oceanScene) {
                        const pos = new THREE.Vector3(
                            (move.col - 4.5) * 2,
                            0.5,
                            (move.row - 4.5) * 2
                        );
                        await oceanScene.createExplosion(pos, false);
                        await oceanScene.createWaterSplash(pos);
                    }
                    
                    await gameAnimation.playShotAnimation('enemy', 'player', move.row, move.col, false);
                    this.updateBoardDisplay('player');
                    
                    gameAnimation.showMessage('敌方未命中。你的回合！');
                    
                    await this.sleep(500);
                    this.switchTurn();
                    break;
                }
            }
            
            this.isAnimating = false;
        }
        
        this.isAnimating = false;
    }
    
    randomPlacement() {
        this.playerBoard.clear();
        this.placedShips = [];
        
        document.querySelectorAll('.ship-option').forEach(opt => {
            opt.classList.remove('placed', 'selected');
        });
        
        SHIP_TYPES.forEach(ship => {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                const isHorizontal = Math.random() > 0.5;
                
                placed = this.playerBoard.placeShip(ship, row, col, isHorizontal);
                attempts++;
            }
            
            if (placed) {
                this.placedShips.push(ship.name);
                
                const options = document.querySelectorAll('.ship-option');
                options.forEach(opt => {
                    if (opt.dataset.ship === ship.name) {
                        opt.classList.add('placed');
                    }
                });
            }
        });
        
        this.updateBoardDisplay('player');
        this.updateShipStatus('player');
    }
    
    confirmPlacement() {
        if (this.placedShips.length < SHIP_TYPES.length) {
            gameAnimation.showMessage('请先部署所有舰船！');
            return;
        }
        
        gameAudio.playUI();
        
        this.deployEnemyShips();
        
        this.currentPhase = 'PLAYING';
        this.currentTurn = 'PLAYER';
        
        this.updateUI();
        this.updateShipStatus('enemy');
        
        gameAnimation.showMessage('战斗开始！选择目标坐标发射！');
        
        if (oceanScene) {
            oceanScene.showShips();
        }
    }
    
    deployEnemyShips() {
        SHIP_TYPES.forEach(ship => {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                const isHorizontal = Math.random() > 0.5;
                
                placed = this.enemyBoard.placeShip(ship, row, col, isHorizontal);
                attempts++;
            }
        });
    }
    
    startGame() {
        gameAudio.playUI();
        
        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');
        const difficultySelect = document.getElementById('difficulty');
        const shipPlacement = document.getElementById('ship-placement');
        
        if (startBtn) startBtn.classList.add('hidden');
        if (restartBtn) restartBtn.classList.remove('hidden');
        if (difficultySelect) difficultySelect.disabled = true;
        if (shipPlacement) shipPlacement.classList.remove('hidden');
        
        this.currentPhase = 'SETUP';
        this.updateUI();
        
        gameAnimation.showMessage('选择舰船并在棋盘上点击部署');
    }
    
    restartGame() {
        this.playerBoard.clear();
        this.enemyBoard.clear();
        this.ai.reset();
        
        this.currentPhase = 'SETUP';
        this.currentTurn = 'PLAYER';
        this.combo = 0;
        this.selectedShip = null;
        this.isShipHorizontal = true;
        this.placedShips = [];
        this.selectedTarget = null;
        this.isAnimating = false;
        
        this.stats = {
            totalShots: 0,
            hits: 0,
            maxCombo: 0
        };
        
        this.createBoards();
        this.createShipSelector();
        
        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');
        const difficultySelect = document.getElementById('difficulty');
        const shipPlacement = document.getElementById('ship-placement');
        const attackControls = document.getElementById('attack-controls');
        
        if (startBtn) startBtn.classList.add('hidden');
        if (restartBtn) restartBtn.classList.remove('hidden');
        if (difficultySelect) difficultySelect.disabled = true;
        if (shipPlacement) shipPlacement.classList.remove('hidden');
        if (attackControls) attackControls.classList.add('hidden');
        
        this.updateUI();
        this.updateShipStatus('player');
        this.updateShipStatus('enemy');
        
        if (oceanScene) {
            oceanScene.hideShips();
        }
        
        gameAnimation.showMessage('重新部署你的舰队！');
    }
    
    async endGame(isPlayerWin) {
        this.isAnimating = true;
        
        await this.sleep(500);
        
        if (isPlayerWin) {
            gameAudio.playVictory();
        } else {
            gameAudio.playDefeat();
        }
        
        const resultMessage = document.getElementById('result-message');
        const totalShots = document.getElementById('total-shots');
        const hitRate = document.getElementById('hit-rate');
        const maxCombo = document.getElementById('max-combo');
        
        if (resultMessage) {
            resultMessage.textContent = isPlayerWin ? 
                '恭喜！你击沉了所有敌方舰艇！' : 
                '遗憾！你的舰队已全部被击沉。';
        }
        
        if (totalShots) {
            totalShots.textContent = this.stats.totalShots;
        }
        
        if (hitRate) {
            const rate = this.stats.totalShots > 0 ? 
                Math.round((this.stats.hits / this.stats.totalShots) * 100) : 0;
            hitRate.textContent = `${rate}%`;
        }
        
        if (maxCombo) {
            maxCombo.textContent = this.stats.maxCombo;
        }
        
        await gameAnimation.playVictoryAnimation(isPlayerWin);
        
        this.isAnimating = false;
    }
    
    updateBoardDisplay(type) {
        const board = type === 'player' ? this.playerBoard : this.enemyBoard;
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = board.grid[row][col];
                const cellElement = document.querySelector(
                    `#${type}-board .board-cell[data-row="${row}"][data-col="${col}"]`
                );
                
                if (!cellElement) continue;
                
                cellElement.classList.remove('ship', 'hit', 'miss');
                
                if (type === 'player' && cell.ship) {
                    cellElement.classList.add('ship');
                }
                
                if (cell.isHit) {
                    cellElement.classList.add('hit');
                    
                    if (!cellElement.querySelector('.hit-marker')) {
                        const marker = document.createElement('div');
                        marker.className = 'hit-marker';
                        marker.innerHTML = '💥';
                        cellElement.appendChild(marker);
                    }
                } else if (cell.isMiss) {
                    cellElement.classList.add('miss');
                    
                    if (!cellElement.querySelector('.miss-marker')) {
                        const marker = document.createElement('div');
                        marker.className = 'miss-marker';
                        cellElement.appendChild(marker);
                    }
                }
            }
        }
    }
    
    updateShipStatus(type) {
        const board = type === 'player' ? this.playerBoard : this.enemyBoard;
        const statusContainer = document.getElementById(`${type}-fleet-status`);
        
        if (!statusContainer) return;
        
        statusContainer.innerHTML = '';
        
        board.ships.forEach(ship => {
            const status = document.createElement('div');
            status.className = `ship-status ${ship.isSunk ? 'sunk' : ''}`;
            status.dataset.ship = ship.name;
            
            const name = document.createElement('span');
            name.className = 'ship-name';
            name.textContent = ship.displayName;
            
            const indicator = document.createElement('div');
            indicator.className = 'ship-indicator';
            
            for (let i = 0; i < ship.length; i++) {
                const cell = document.createElement('div');
                cell.className = `ship-cell ${i < ship.hits ? 'hit' : ''}`;
                indicator.appendChild(cell);
            }
            
            status.appendChild(name);
            status.appendChild(indicator);
            statusContainer.appendChild(status);
        });
    }
    
    updateUI() {
        const turnPlayer = document.querySelector('.turn-player');
        const attackControls = document.getElementById('attack-controls');
        const shipPlacement = document.getElementById('ship-placement');
        
        if (turnPlayer) {
            turnPlayer.textContent = this.currentTurn === 'PLAYER' ? '玩家' : '电脑';
            turnPlayer.style.color = this.currentTurn === 'PLAYER' ? '#D4AF37' : '#e74c3c';
        }
        
        if (this.currentPhase === 'PLAYING') {
            if (attackControls) attackControls.classList.remove('hidden');
            if (shipPlacement) shipPlacement.classList.add('hidden');
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new BattleShipGame();
});
