class BattleshipAI {
    constructor(difficulty = 'normal') {
        this.difficulty = difficulty;
        this.boardSize = 10;
        this.lastHits = [];
        this.potentialTargets = [];
        this.shotHistory = new Set();
        this.huntMode = false;
        this.huntStart = null;
        this.huntDirection = null;
        this.shipOrientation = null;
        this.sunkShips = [];
        this.knownShips = [];
        
        this.setupProbabilityMap();
    }
    
    setupProbabilityMap() {
        this.probabilityMap = [];
        for (let i = 0; i < this.boardSize; i++) {
            this.probabilityMap[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.probabilityMap[i][j] = this.calculateInitialProbability(i, j);
            }
        }
    }
    
    calculateInitialProbability(row, col) {
        const centerX = 4.5;
        const centerY = 4.5;
        const distanceToCenter = Math.sqrt(
            Math.pow(row - centerX, 2) + 
            Math.pow(col - centerY, 2)
        );
        
        let edgeMultiplier = 1;
        if (row === 0 || row === 9 || col === 0 || col === 9) {
            edgeMultiplier = 0.5;
        }
        
        const centerBonus = (9 - distanceToCenter) / 9 + 0.5;
        
        return centerBonus * edgeMultiplier;
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.reset();
    }
    
    reset() {
        this.lastHits = [];
        this.potentialTargets = [];
        this.shotHistory.clear();
        this.huntMode = false;
        this.huntStart = null;
        this.huntDirection = null;
        this.shipOrientation = null;
        this.sunkShips = [];
        this.knownShips = [];
        this.setupProbabilityMap();
    }
    
    getNextMove(enemyBoard) {
        switch (this.difficulty) {
            case 'easy':
                return this.getEasyMove();
            case 'normal':
                return this.getNormalMove(enemyBoard);
            case 'hard':
                return this.getHardMove(enemyBoard);
            default:
                return this.getNormalMove(enemyBoard);
        }
    }
    
    getEasyMove() {
        const availableMoves = [];
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const key = `${i},${j}`;
                if (!this.shotHistory.has(key)) {
                    availableMoves.push({ row: i, col: j });
                }
            }
        }
        
        if (availableMoves.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        const move = availableMoves[randomIndex];
        this.shotHistory.add(`${move.row},${move.col}`);
        return move;
    }
    
    getNormalMove(enemyBoard) {
        if (this.huntMode && this.lastHits.length > 0) {
            const huntMove = this.getHuntMove(enemyBoard);
            if (huntMove) {
                this.shotHistory.add(`${huntMove.row},${huntMove.col}`);
                return huntMove;
            }
        }
        
        if (this.potentialTargets.length > 0) {
            for (let i = this.potentialTargets.length - 1; i >= 0; i--) {
                const target = this.potentialTargets[i];
                const key = `${target.row},${target.col}`;
                if (!this.shotHistory.has(key) && 
                    enemyBoard.canFire(target.row, target.col)) {
                    this.shotHistory.add(key);
                    this.potentialTargets.splice(i, 1);
                    return target;
                }
            }
            this.potentialTargets = [];
        }
        
        return this.getProbabilityBasedMove(enemyBoard);
    }
    
    getHardMove(enemyBoard) {
        if (this.huntMode && this.lastHits.length > 0) {
            const huntMove = this.getAdvancedHuntMove(enemyBoard);
            if (huntMove) {
                this.shotHistory.add(`${huntMove.row},${huntMove.col}`);
                return huntMove;
            }
        }
        
        this.updateProbabilityMap(enemyBoard);
        
        const availableMoves = [];
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const key = `${i},${j}`;
                if (!this.shotHistory.has(key) && enemyBoard.canFire(i, j)) {
                    availableMoves.push({
                        row: i,
                        col: j,
                        probability: this.probabilityMap[i][j]
                    });
                }
            }
        }
        
        if (availableMoves.length === 0) return null;
        
        availableMoves.sort((a, b) => b.probability - a.probability);
        
        const topMoves = availableMoves.slice(0, Math.max(1, Math.floor(availableMoves.length * 0.1)));
        const randomIndex = Math.floor(Math.random() * Math.min(3, topMoves.length));
        const move = topMoves[randomIndex];
        
        this.shotHistory.add(`${move.row},${move.col}`);
        return { row: move.row, col: move.col };
    }
    
    updateProbabilityMap(enemyBoard) {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const key = `${i},${j}`;
                if (this.shotHistory.has(key)) {
                    this.probabilityMap[i][j] = 0;
                } else {
                    this.probabilityMap[i][j] = this.calculateCellProbability(i, j, enemyBoard);
                }
            }
        }
    }
    
    calculateCellProbability(row, col, enemyBoard) {
        let probability = this.calculateInitialProbability(row, col);
        
        const unsunkShips = SHIP_TYPES.filter(ship => 
            !this.sunkShips.includes(ship.name)
        );
        
        for (const ship of unsunkShips) {
            probability += this.checkShipPlacement(row, col, ship, true, enemyBoard);
            probability += this.checkShipPlacement(row, col, ship, false, enemyBoard);
        }
        
        probability += this.getNeighborHitBonus(row, col, enemyBoard);
        
        return probability;
    }
    
    checkShipPlacement(row, col, ship, isHorizontal, enemyBoard) {
        let count = 0;
        const length = ship.length;
        
        for (let startOffset = 0; startOffset < length; startOffset++) {
            let valid = true;
            
            for (let i = 0; i < length; i++) {
                let checkRow = row;
                let checkCol = col;
                
                if (isHorizontal) {
                    checkCol = col - startOffset + i;
                } else {
                    checkRow = row - startOffset + i;
                }
                
                if (checkRow < 0 || checkRow >= this.boardSize || 
                    checkCol < 0 || checkCol >= this.boardSize) {
                    valid = false;
                    break;
                }
                
                const key = `${checkRow},${checkCol}`;
                if (this.shotHistory.has(key)) {
                    const cell = enemyBoard.grid[checkRow][checkCol];
                    if (cell.isMiss) {
                        valid = false;
                        break;
                    }
                }
            }
            
            if (valid) {
                count += 0.5;
            }
        }
        
        return count;
    }
    
    getNeighborHitBonus(row, col, enemyBoard) {
        let bonus = 0;
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
            const checkRow = row + dr;
            const checkCol = col + dc;
            
            if (checkRow >= 0 && checkRow < this.boardSize && 
                checkCol >= 0 && checkCol < this.boardSize) {
                const cell = enemyBoard.grid[checkRow][checkCol];
                if (cell.isHit && !cell.ship?.isSunk) {
                    bonus += 3;
                }
            }
        }
        
        return bonus;
    }
    
    getHuntMove(enemyBoard) {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        if (this.lastHits.length >= 2) {
            const firstHit = this.lastHits[0];
            const secondHit = this.lastHits[1];
            
            const dx = secondHit.col - firstHit.col;
            const dy = secondHit.row - firstHit.row;
            
            let isHorizontal = Math.abs(dx) > Math.abs(dy);
            
            for (let i = this.lastHits.length - 1; i >= 0; i--) {
                const hit = this.lastHits[i];
                
                if (isHorizontal) {
                    const leftMove = { row: hit.row, col: hit.col - 1 };
                    const rightMove = { row: hit.row, col: hit.col + 1 };
                    
                    for (const move of [rightMove, leftMove]) {
                        const key = `${move.row},${move.col}`;
                        if (!this.shotHistory.has(key) && 
                            enemyBoard.canFire(move.row, move.col)) {
                            return move;
                        }
                    }
                } else {
                    const upMove = { row: hit.row - 1, col: hit.col };
                    const downMove = { row: hit.row + 1, col: hit.col };
                    
                    for (const move of [downMove, upMove]) {
                        const key = `${move.row},${move.col}`;
                        if (!this.shotHistory.has(key) && 
                            enemyBoard.canFire(move.row, move.col)) {
                            return move;
                        }
                    }
                }
            }
        }
        
        if (this.lastHits.length > 0) {
            const lastHit = this.lastHits[this.lastHits.length - 1];
            
            for (const [dr, dc] of directions) {
                const move = { row: lastHit.row + dr, col: lastHit.col + dc };
                const key = `${move.row},${move.col}`;
                
                if (!this.shotHistory.has(key) && enemyBoard.canFire(move.row, move.col)) {
                    return move;
                }
            }
        }
        
        this.huntMode = false;
        this.lastHits = [];
        return null;
    }
    
    getAdvancedHuntMove(enemyBoard) {
        if (this.lastHits.length >= 2 && !this.shipOrientation) {
            const firstHit = this.lastHits[0];
            const secondHit = this.lastHits[1];
            
            const dx = secondHit.col - firstHit.col;
            const dy = secondHit.row - firstHit.row;
            
            this.shipOrientation = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
        }
        
        if (this.shipOrientation && this.lastHits.length > 0) {
            const sortedHits = [...this.lastHits].sort((a, b) => {
                if (this.shipOrientation === 'horizontal') {
                    return a.col - b.col;
                }
                return a.row - b.row;
            });
            
            const firstHit = sortedHits[0];
            const lastHit = sortedHits[sortedHits.length - 1];
            
            let forwardMove, backwardMove;
            
            if (this.shipOrientation === 'horizontal') {
                forwardMove = { row: lastHit.row, col: lastHit.col + 1 };
                backwardMove = { row: firstHit.row, col: firstHit.col - 1 };
            } else {
                forwardMove = { row: lastHit.row + 1, col: lastHit.col };
                backwardMove = { row: firstHit.row - 1, col: firstHit.col };
            }
            
            for (const move of [forwardMove, backwardMove]) {
                const key = `${move.row},${move.col}`;
                if (!this.shotHistory.has(key) && enemyBoard.canFire(move.row, move.col)) {
                    return move;
                }
            }
            
            this.shipOrientation = null;
        }
        
        return this.getHuntMove(enemyBoard);
    }
    
    recordResult(result, row, col, shipName = null) {
        if (result === 'HIT') {
            this.lastHits.push({ row, col });
            this.huntMode = true;
            
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const key = `${newRow},${newCol}`;
                
                if (newRow >= 0 && newRow < this.boardSize && 
                    newCol >= 0 && newCol < this.boardSize && 
                    !this.shotHistory.has(key)) {
                    const exists = this.potentialTargets.some(
                        t => t.row === newRow && t.col === newCol
                    );
                    if (!exists) {
                        this.potentialTargets.unshift({ row: newRow, col: newCol });
                    }
                }
            }
        } else if (result === 'SUNK') {
            this.sunkShips.push(shipName);
            this.lastHits = [];
            this.potentialTargets = [];
            this.huntMode = false;
            this.shipOrientation = null;
            
            for (let i = 0; i < this.boardSize; i++) {
                for (let j = 0; j < this.boardSize; j++) {
                    this.probabilityMap[i][j] = 0;
                }
            }
        }
    }
}
