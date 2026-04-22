class GameBoard {
    constructor(size = 10) {
        this.size = size;
        this.grid = this.createEmptyGrid();
        this.ships = [];
        this.shots = [];
        this.hits = [];
        this.misses = [];
        this.sunkShips = [];
    }
    
    createEmptyGrid() {
        const grid = [];
        for (let i = 0; i < this.size; i++) {
            grid[i] = [];
            for (let j = 0; j < this.size; j++) {
                grid[i][j] = {
                    ship: null,
                    isHit: false,
                    isMiss: false
                };
            }
        }
        return grid;
    }
    
    placeShip(ship, startRow, startCol, isHorizontal) {
        const positions = [];
        const length = ship.length;
        
        for (let i = 0; i < length; i++) {
            let row = startRow;
            let col = startCol;
            
            if (isHorizontal) {
                col += i;
            } else {
                row += i;
            }
            
            if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
                return false;
            }
            
            if (this.grid[row][col].ship !== null) {
                return false;
            }
            
            if (!this.checkSurrounding(row, col)) {
                return false;
            }
            
            positions.push({ row, col });
        }
        
        positions.forEach(pos => {
            this.grid[pos.row][pos.col].ship = {
                ...ship,
                positions,
                hits: 0
            };
        });
        
        this.ships.push({
            ...ship,
            positions,
            hits: 0,
            isSunk: false
        });
        
        return true;
    }
    
    checkSurrounding(row, col) {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],          [0, 1],
            [1, -1],  [1, 0], [1, 1]
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < this.size && 
                newCol >= 0 && newCol < this.size) {
                if (this.grid[newRow][newCol].ship !== null) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    fire(row, col) {
        const cell = this.grid[row][col];
        
        if (cell.isHit || cell.isMiss) {
            return {
                success: false,
                error: 'ALREADY_FIRED'
            };
        }
        
        this.shots.push({ row, col });
        
        if (cell.ship !== null) {
            cell.isHit = true;
            this.hits.push({ row, col });
            
            const ship = cell.ship;
            ship.hits++;
            
            const shipInList = this.ships.find(s => s.name === ship.name);
            if (shipInList) {
                shipInList.hits++;
            }
            
            if (ship.hits >= ship.length) {
                ship.isSunk = true;
                if (shipInList) {
                    shipInList.isSunk = true;
                }
                this.sunkShips.push(ship.name);
                
                return {
                    success: true,
                    result: 'SUNK',
                    ship: ship.name,
                    row,
                    col
                };
            }
            
            return {
                success: true,
                result: 'HIT',
                ship: ship.name,
                row,
                col
            };
        } else {
            cell.isMiss = true;
            this.misses.push({ row, col });
            
            return {
                success: true,
                result: 'MISS',
                row,
                col
            };
        }
    }
    
    canFire(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return false;
        }
        const cell = this.grid[row][col];
        return !cell.isHit && !cell.isMiss;
    }
    
    isAllShipsSunk() {
        return this.ships.every(ship => ship.isSunk);
    }
    
    getShipStatus() {
        return this.ships.map(ship => ({
            name: ship.name,
            displayName: ship.displayName,
            length: ship.length,
            hits: ship.hits,
            isSunk: ship.isSunk
        }));
    }
    
    getAvailablePositions(ship, isHorizontal) {
        const positions = [];
        const length = ship.length;
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                let valid = true;
                
                for (let i = 0; i < length; i++) {
                    let checkRow = row;
                    let checkCol = col;
                    
                    if (isHorizontal) {
                        checkCol += i;
                    } else {
                        checkRow += i;
                    }
                    
                    if (checkRow < 0 || checkRow >= this.size || 
                        checkCol < 0 || checkCol >= this.size) {
                        valid = false;
                        break;
                    }
                    
                    if (this.grid[checkRow][checkCol].ship !== null) {
                        valid = false;
                        break;
                    }
                    
                    if (!this.checkSurrounding(checkRow, checkCol)) {
                        valid = false;
                        break;
                    }
                }
                
                if (valid) {
                    positions.push({ row, col });
                }
            }
        }
        
        return positions;
    }
    
    clear() {
        this.grid = this.createEmptyGrid();
        this.ships = [];
        this.shots = [];
        this.hits = [];
        this.misses = [];
        this.sunkShips = [];
    }
}

const SHIP_TYPES = [
    { name: 'aircraftCarrier', displayName: '航母', length: 5 },
    { name: 'battleship', displayName: '战列舰', length: 4 },
    { name: 'cruiser', displayName: '巡洋舰', length: 3 },
    { name: 'submarine', displayName: '潜艇', length: 3 },
    { name: 'destroyer', displayName: '驱逐舰', length: 2 }
];
