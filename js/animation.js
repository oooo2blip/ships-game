class GameAnimation {
    constructor() {
        this.board3DWrapper = null;
        this.isAnimating = false;
    }
    
    init() {
        this.board3DWrapper = document.querySelectorAll('.board-3d-wrapper');
    }
    
    async playShotAnimation(fromBoard, toBoard, row, col, isHit) {
        this.isAnimating = true;
        
        const fromWrapper = fromBoard === 'player' ? 
            document.querySelector('.player-wrapper .board-3d-wrapper') :
            document.querySelector('.enemy-wrapper .board-3d-wrapper');
        
        const toWrapper = toBoard === 'player' ? 
            document.querySelector('.player-wrapper .board-3d-wrapper') :
            document.querySelector('.enemy-wrapper .board-3d-wrapper');
        
        const cell = toBoard === 'player' ? 
            document.querySelector(`#player-board .board-cell[data-row="${row}"][data-col="${col}"]`) :
            document.querySelector(`#enemy-board .board-cell[data-row="${row}"][data-col="${col}"]`);
        
        if (fromWrapper) {
            gsap.to(fromWrapper, {
                duration: 0.2,
                rotationX: '5deg',
                rotationZ: '2deg',
                scale: 1.02,
                ease: 'power2.out'
            });
        }
        
        if (toWrapper) {
            gsap.to(toWrapper, {
                duration: 0.2,
                rotationX: '3deg',
                rotationZ: '-2deg',
                scale: 1.02,
                ease: 'power2.out'
            });
        }
        
        await this.sleep(200);
        
        if (isHit) {
            await this.playHitAnimation(cell, row, col, toBoard);
        } else {
            await this.playMissAnimation(cell, row, col, toBoard);
        }
        
        if (fromWrapper) {
            gsap.to(fromWrapper, {
                duration: 0.3,
                rotationX: '0deg',
                rotationZ: '0deg',
                scale: 1,
                ease: 'power2.out'
            });
        }
        
        if (toWrapper) {
            gsap.to(toWrapper, {
                duration: 0.3,
                rotationX: '0deg',
                rotationZ: '0deg',
                scale: 1,
                ease: 'power2.out'
            });
        }
        
        this.isAnimating = false;
    }
    
    async playHitAnimation(cell, row, col, board) {
        if (!cell) return;
        
        gsap.to(cell, {
            duration: 0.1,
            scale: 1.1,
            backgroundColor: 'rgba(231, 76, 60, 0.6)',
            ease: 'power2.out'
        });
        
        this.createExplosionEffect(cell);
        
        await this.sleep(150);
        
        gsap.to(cell, {
            duration: 0.2,
            scale: 1,
            ease: 'elastic.out(1, 0.5)'
        });
        
        const hitMarker = document.createElement('div');
        hitMarker.className = 'hit-marker';
        hitMarker.innerHTML = '💥';
        hitMarker.style.animation = 'explosion 0.5s ease-out';
        cell.appendChild(hitMarker);
        
        gsap.to(hitMarker, {
            duration: 0.5,
            opacity: 0,
            scale: 2,
            ease: 'power2.out',
            onComplete: () => {
                hitMarker.remove();
            }
        });
        
        cell.classList.add('hit');
        
        await this.sleep(300);
    }
    
    async playMissAnimation(cell, row, col, board) {
        if (!cell) return;
        
        gsap.to(cell, {
            duration: 0.1,
            scale: 0.95,
            backgroundColor: 'rgba(52, 152, 219, 0.3)',
            ease: 'power2.out'
        });
        
        await this.sleep(100);
        
        gsap.to(cell, {
            duration: 0.2,
            scale: 1,
            ease: 'elastic.out(1, 0.5)'
        });
        
        const splash1 = document.createElement('div');
        const splash2 = document.createElement('div');
        const splash3 = document.createElement('div');
        
        [splash1, splash2, splash3].forEach((splash, index) => {
            splash.style.cssText = `
                position: absolute;
                width: ${8 - index * 2}px;
                height: ${12 - index * 3}px;
                background: linear-gradient(to top, rgba(52, 152, 219, 0.8), rgba(100, 180, 255, 0.6));
                border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
                bottom: 50%;
                left: ${40 + (index - 1) * 15}%;
                transform-origin: bottom center;
                animation: splash 0.5s ease-out ${index * 0.05}s;
                pointer-events: none;
            `;
            cell.appendChild(splash);
        });
        
        const missMarker = document.createElement('div');
        missMarker.className = 'miss-marker';
        cell.appendChild(missMarker);
        
        gsap.to(missMarker, {
            duration: 0.5,
            scale: 1.2,
            opacity: 0.7,
            ease: 'elastic.out(1, 0.5)'
        });
        
        cell.classList.add('miss');
        
        setTimeout(() => {
            splash1.remove();
            splash2.remove();
            splash3.remove();
        }, 600);
        
        await this.sleep(300);
    }
    
    createExplosionEffect(cell) {
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = Math.random() * 30 + 20;
            const size = Math.random() * 6 + 3;
            
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, #ff6600, #ff3300);
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                z-index: 10;
            `;
            
            cell.appendChild(particle);
            
            gsap.timeline()
                .to(particle, {
                    duration: 0.4,
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed,
                    scale: 0,
                    opacity: 0,
                    ease: 'power2.out',
                    onComplete: () => particle.remove()
                });
        }
        
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255, 150, 0, 0.8), transparent);
            top: 0;
            left: 0;
            border-radius: 4px;
            pointer-events: none;
            z-index: 5;
        `;
        cell.appendChild(flash);
        
        gsap.timeline()
            .to(flash, {
                duration: 0.3,
                opacity: 0,
                scale: 1.5,
                ease: 'power2.out',
                onComplete: () => flash.remove()
            });
    }
    
    async playShipSunkAnimation(shipName, board) {
        const shipStatus = board === 'player' ?
            document.querySelector(`#player-fleet-status .ship-status[data-ship="${shipName}"]`) :
            document.querySelector(`#enemy-fleet-status .ship-status[data-ship="${shipName}"]`);
        
        if (shipStatus) {
            gsap.to(shipStatus, {
                duration: 0.3,
                backgroundColor: 'rgba(231, 76, 60, 0.3)',
                scale: 1.1,
                ease: 'elastic.out(1, 0.5)'
            });
            
            await this.sleep(300);
            
            gsap.to(shipStatus, {
                duration: 0.5,
                backgroundColor: 'transparent',
                scale: 1,
                ease: 'power2.out'
            });
            
            shipStatus.classList.add('sunk');
        }
    }
    
    async playComboAnimation(comboCount) {
        const comboCounter = document.getElementById('combo-counter');
        
        if (comboCount > 0) {
            comboCounter.classList.remove('hidden');
            
            const countElement = comboCounter.querySelector('.combo-count');
            countElement.textContent = comboCount;
            
            gsap.fromTo(comboCounter,
                { scale: 0.5, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.5)' }
            );
            
            gsap.to(countElement, {
                duration: 0.2,
                scale: 1.5,
                color: '#F4CF57',
                yoyo: true,
                repeat: 1,
                ease: 'power2.out'
            });
        } else {
            gsap.to(comboCounter, {
                duration: 0.3,
                scale: 0.5,
                opacity: 0,
                ease: 'back.in(1.5)',
                onComplete: () => {
                    comboCounter.classList.add('hidden');
                }
            });
        }
    }
    
    async playTurnTransition(fromPlayer, toPlayer) {
        const turnPlayer = document.querySelector('.turn-player');
        
        gsap.to(turnPlayer, {
            duration: 0.3,
            opacity: 0,
            scale: 0.8,
            ease: 'power2.in',
            onComplete: () => {
                turnPlayer.textContent = toPlayer ? '玩家' : '电脑';
                turnPlayer.style.color = toPlayer ? '#D4AF37' : '#e74c3c';
                
                gsap.to(turnPlayer, {
                    duration: 0.3,
                    opacity: 1,
                    scale: 1,
                    ease: 'back.out(1.5)'
                });
            }
        });
        
        const fromSection = fromPlayer ? 
            document.querySelector('.player-wrapper') :
            document.querySelector('.enemy-wrapper');
        
        const toSection = toPlayer ?
            document.querySelector('.player-wrapper') :
            document.querySelector('.enemy-wrapper');
        
        if (fromSection) {
            gsap.to(fromSection, {
                duration: 0.3,
                opacity: 0.6,
                ease: 'power2.out'
            });
        }
        
        if (toSection) {
            gsap.to(toSection, {
                duration: 0.3,
                opacity: 1,
                ease: 'power2.out'
            });
        }
        
        await this.sleep(500);
    }
    
    async playVictoryAnimation(isPlayerWin) {
        const modal = document.getElementById('game-over-modal');
        const resultTitle = document.getElementById('result-title');
        
        resultTitle.textContent = isPlayerWin ? '胜利！' : '失败';
        resultTitle.style.color = isPlayerWin ? '#D4AF37' : '#e74c3c';
        
        modal.classList.remove('hidden');
        
        gsap.fromTo(modal.querySelector('.modal-content'),
            { scale: 0.5, opacity: 0, y: 50 },
            { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)' }
        );
        
        if (isPlayerWin) {
            this.createConfetti();
        }
    }
    
    createConfetti() {
        const colors = ['#D4AF37', '#8B7355', '#1a4a44', '#e74c3c', '#3498db'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            const size = Math.random() * 10 + 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            confetti.style.cssText = `
                position: fixed;
                width: ${size}px;
                height: ${size * (Math.random() > 0.5 ? 1 : 2)}px;
                background: ${color};
                top: -20px;
                left: ${Math.random() * 100}%;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                pointer-events: none;
                z-index: 2000;
                transform: rotate(${Math.random() * 360}deg);
            `;
            
            document.body.appendChild(confetti);
            
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 1;
            
            gsap.timeline()
                .to(confetti, {
                    duration: duration,
                    delay: delay,
                    y: window.innerHeight + 100,
                    x: (Math.random() - 0.5) * 200,
                    rotation: Math.random() * 720 - 360,
                    ease: 'power2.in',
                    onComplete: () => confetti.remove()
                });
        }
    }
    
    updatePredictionLine(startX, startY, endX, endY) {
        const predictionLine = document.querySelector('.prediction-line');
        const predictionTarget = document.querySelector('.prediction-target');
        
        if (!predictionLine || !predictionTarget) return;
        
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        predictionLine.style.width = `${distance}px`;
        predictionLine.style.left = `${startX}px`;
        predictionLine.style.top = `${startY}px`;
        predictionLine.style.transform = `rotate(${angle}deg)`;
        predictionLine.style.opacity = '0.8';
        
        predictionTarget.style.left = `${endX - 10}px`;
        predictionTarget.style.top = `${endY - 10}px`;
        predictionTarget.style.opacity = '1';
    }
    
    hidePredictionLine() {
        const predictionLine = document.querySelector('.prediction-line');
        const predictionTarget = document.querySelector('.prediction-target');
        
        if (predictionLine) predictionLine.style.opacity = '0';
        if (predictionTarget) predictionTarget.style.opacity = '0';
    }
    
    async playShipPlacementAnimation(cell) {
        if (!cell) return;
        
        gsap.fromTo(cell,
            { scale: 0.5, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.5)' }
        );
        
        await this.sleep(200);
    }
    
    showMessage(message, duration = 2000) {
        const messageContent = document.getElementById('message-content');
        messageContent.textContent = message;
        
        gsap.fromTo(messageContent,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
        );
        
        if (duration > 0) {
            setTimeout(() => {
                gsap.to(messageContent, {
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.in'
                });
            }, duration);
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const gameAnimation = new GameAnimation();
