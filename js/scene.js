class OceanScene {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.ocean = null;
        this.ships = [];
        this.projectiles = [];
        this.particles = [];
        this.isAnimating = false;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const width = rect.width || 800;
        const height = rect.height || 200;
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a2e2a);
        this.scene.fog = new THREE.Fog(0x0a2e2a, 50, 200);
        
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.set(0, 15, 25);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.setupLights();
        this.createOcean();
        this.createShipModels();
        
        this.animate();
        
        window.addEventListener('resize', () => this.onResize());
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;
        this.scene.add(directionalLight);
        
        const rimLight = new THREE.DirectionalLight(0x3498db, 0.3);
        rimLight.position.set(-10, 10, -10);
        this.scene.add(rimLight);
        
        const warmLight = new THREE.PointLight(0xd4af37, 0.5, 50);
        warmLight.position.set(0, 5, 0);
        this.scene.add(warmLight);
    }
    
    createOcean() {
        const oceanGeometry = new THREE.PlaneGeometry(100, 100, 64, 64);
        oceanGeometry.rotateX(-Math.PI / 2);
        
        const oceanMaterial = new THREE.MeshPhongMaterial({
            color: 0x0a1a18,
            transparent: true,
            opacity: 0.9,
            shininess: 100,
            specular: 0x1a4a44
        });
        
        this.ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
        this.ocean.receiveShadow = true;
        this.scene.add(this.ocean);
        
        this.waterTime = 0;
        this.originalPositions = oceanGeometry.attributes.position.array.slice();
    }
    
    createShipModels() {
        const shipTypes = [
            { name: 'aircraftCarrier', length: 5, scale: 0.8 },
            { name: 'battleship', length: 4, scale: 0.7 },
            { name: 'cruiser', length: 3, scale: 0.6 },
            { name: 'submarine', length: 3, scale: 0.55 },
            { name: 'destroyer', length: 2, scale: 0.5 }
        ];
        
        shipTypes.forEach((ship, index) => {
            const shipModel = this.createLowPolyShip(ship.length, ship.scale);
            shipModel.position.x = -20 + index * 10;
            shipModel.position.y = -10;
            shipModel.visible = false;
            this.scene.add(shipModel);
            this.ships.push({
                model: shipModel,
                type: ship.name,
                originalY: -10
            });
        });
    }
    
    createLowPolyShip(length, scale) {
        const group = new THREE.Group();
        
        const woodColor = 0x8B7355;
        const woodDark = 0x6B5344;
        const woodLight = 0xA0896C;
        const goldColor = 0xD4AF37;
        
        const hullGeometry = new THREE.BoxGeometry(length * 1.2, 0.8, 2.5);
        const hullMaterial = new THREE.MeshPhongMaterial({
            color: woodColor,
            shininess: 20,
            specular: 0x333333
        });
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.y = 0.4;
        hull.castShadow = true;
        hull.receiveShadow = true;
        group.add(hull);
        
        const deckGeometry = new THREE.BoxGeometry(length * 1.0, 0.2, 2.2);
        const deckMaterial = new THREE.MeshPhongMaterial({
            color: woodLight,
            shininess: 10
        });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        deck.position.y = 0.9;
        deck.castShadow = true;
        group.add(deck);
        
        const bowGeometry = new THREE.ConeGeometry(1.2, 1.5, 4);
        const bowMaterial = new THREE.MeshPhongMaterial({
            color: woodDark,
            shininess: 15
        });
        const bow = new THREE.Mesh(bowGeometry, bowMaterial);
        bow.position.set(length * 0.6 + 0.5, 0.75, 0);
        bow.rotation.z = -Math.PI / 2;
        bow.castShadow = true;
        group.add(bow);
        
        const mastGeometry = new THREE.CylinderGeometry(0.1, 0.15, 3, 6);
        const mastMaterial = new THREE.MeshPhongMaterial({
            color: woodDark,
            shininess: 10
        });
        
        const mastCount = Math.min(length, 3);
        for (let i = 0; i < mastCount; i++) {
            const mast = new THREE.Mesh(mastGeometry, mastMaterial);
            const xPos = -length * 0.3 + i * (length * 0.3);
            mast.position.set(xPos, 2.5, 0);
            mast.castShadow = true;
            group.add(mast);
            
            const sailGeometry = new THREE.PlaneGeometry(1.5, 2);
            const sailMaterial = new THREE.MeshPhongMaterial({
                color: 0xf5f5dc,
                side: THREE.DoubleSide,
                shininess: 5
            });
            const sail = new THREE.Mesh(sailGeometry, sailMaterial);
            sail.position.set(xPos, 3.5, 0);
            sail.rotation.y = Math.PI / 4;
            group.add(sail);
        }
        
        const cannonGeometry = new THREE.CylinderGeometry(0.15, 0.1, 0.6, 8);
        const cannonMaterial = new THREE.MeshPhongMaterial({
            color: 0x2c2c2c,
            shininess: 50,
            specular: goldColor
        });
        
        const cannonCount = Math.floor(length * 1.5);
        for (let i = 0; i < cannonCount; i++) {
            const angle = (i % 2 === 0 ? 1 : -1) * (Math.PI / 6);
            const cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
            const xPos = -length * 0.4 + (i * (length * 0.4 / cannonCount));
            cannon.position.set(xPos, 0.8, i % 2 === 0 ? 1.3 : -1.3);
            cannon.rotation.x = Math.PI / 2;
            cannon.rotation.z = angle;
            cannon.castShadow = true;
            group.add(cannon);
        }
        
        const goldTrimGeometry = new THREE.TorusGeometry(0.3, 0.05, 8, 16);
        const goldMaterial = new THREE.MeshPhongMaterial({
            color: goldColor,
            shininess: 100,
            specular: 0xffffff
        });
        
        for (let i = 0; i < 2; i++) {
            const goldTrim = new THREE.Mesh(goldTrimGeometry, goldMaterial);
            goldTrim.position.set(-length * 0.4 + i * length * 0.8, 0.5, 0);
            goldTrim.rotation.x = Math.PI / 2;
            group.add(goldTrim);
        }
        
        group.scale.set(scale, scale, scale);
        
        return group;
    }
    
    showShips() {
        this.ships.forEach((ship, index) => {
            ship.model.visible = true;
            ship.model.position.y = ship.originalY;
            
            gsap.to(ship.model.position, {
                y: 0.5,
                duration: 1.5,
                delay: index * 0.2,
                ease: 'elastic.out(1, 0.5)'
            });
            
            gsap.to(ship.model.rotation, {
                y: 0.1,
                duration: 2,
                delay: index * 0.2,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
        });
    }
    
    hideShips() {
        this.ships.forEach((ship, index) => {
            gsap.to(ship.model.position, {
                y: ship.originalY,
                duration: 1,
                delay: index * 0.1,
                ease: 'back.in(1.5)',
                onComplete: () => {
                    ship.model.visible = false;
                }
            });
        });
    }
    
    createProjectile(fromPosition, toPosition, isPlayerAttack) {
        return new Promise((resolve) => {
            const projectileGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const projectileMaterial = new THREE.MeshPhongMaterial({
                color: 0x333333,
                emissive: 0xff6600,
                emissiveIntensity: 0.5
            });
            
            const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
            projectile.position.copy(fromPosition);
            this.scene.add(projectile);
            
            const trailGeometry = new THREE.CylinderGeometry(0.02, 0.08, 0.5, 6);
            const trailMaterial = new THREE.MeshPhongMaterial({
                color: 0xff9900,
                transparent: true,
                opacity: 0.8
            });
            const trail = new THREE.Mesh(trailGeometry, trailMaterial);
            projectile.add(trail);
            trail.rotation.x = Math.PI / 2;
            trail.position.z = 0.3;
            
            const midY = Math.max(fromPosition.y, toPosition.y) + 8;
            const midX = (fromPosition.x + toPosition.x) / 2;
            const midZ = (fromPosition.z + toPosition.z) / 2;
            
            const duration = 1.2;
            
            gsap.timeline()
                .to(projectile.position, {
                    duration: duration / 2,
                    x: midX,
                    y: midY,
                    z: midZ,
                    ease: 'power2.out',
                    onUpdate: () => {
                        const direction = new THREE.Vector3()
                            .subVectors(toPosition, projectile.position)
                            .normalize();
                        projectile.lookAt(projectile.position.clone().add(direction));
                    }
                })
                .to(projectile.position, {
                    duration: duration / 2,
                    x: toPosition.x,
                    y: toPosition.y,
                    z: toPosition.z,
                    ease: 'power2.in',
                    onUpdate: () => {
                        const direction = new THREE.Vector3()
                            .subVectors(toPosition, projectile.position)
                            .normalize();
                        projectile.lookAt(projectile.position.clone().add(direction));
                    }
                })
                .call(() => {
                    this.scene.remove(projectile);
                    resolve(toPosition);
                });
            
            this.createMuzzleFlash(fromPosition);
        });
    }
    
    createMuzzleFlash(position) {
        const flashGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 1
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        this.scene.add(flash);
        
        gsap.timeline()
            .to(flash.scale, {
                duration: 0.1,
                x: 2,
                y: 2,
                z: 2,
                ease: 'power2.out'
            })
            .to(flashMaterial, {
                duration: 0.2,
                opacity: 0,
                ease: 'power2.out',
                onComplete: () => {
                    this.scene.remove(flash);
                }
            }, 0);
    }
    
    createExplosion(position, isHit) {
        return new Promise((resolve) => {
            const particleCount = isHit ? 30 : 15;
            const particles = [];
            
            const baseColor = isHit ? 0xff4400 : 0x4488ff;
            
            for (let i = 0; i < particleCount; i++) {
                const particleGeometry = new THREE.SphereGeometry(
                    Math.random() * 0.15 + 0.05,
                    6,
                    6
                );
                const particleMaterial = new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(
                        isHit ? 0.05 + Math.random() * 0.1 : 0.6 + Math.random() * 0.1,
                        0.8,
                        0.5 + Math.random() * 0.3
                    ),
                    transparent: true,
                    opacity: 1
                });
                
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                particle.position.copy(position);
                this.scene.add(particle);
                
                const angle = Math.random() * Math.PI * 2;
                const speed = isHit ? Math.random() * 3 + 1 : Math.random() * 2 + 0.5;
                const targetX = position.x + Math.cos(angle) * speed;
                const targetY = position.y + Math.random() * (isHit ? 4 : 2);
                const targetZ = position.z + Math.sin(angle) * speed;
                
                particles.push({
                    mesh: particle,
                    targetX,
                    targetY,
                    targetZ
                });
            }
            
            const timeline = gsap.timeline({
                onComplete: () => {
                    particles.forEach(p => this.scene.remove(p.mesh));
                    resolve();
                }
            });
            
            particles.forEach((p, index) => {
                timeline.add(
                    gsap.timeline()
                        .to(p.mesh.position, {
                            duration: isHit ? 0.8 : 0.6,
                            x: p.targetX,
                            y: p.targetY,
                            z: p.targetZ,
                            ease: 'power2.out'
                        })
                        .to(p.mesh.material, {
                            duration: isHit ? 0.8 : 0.6,
                            opacity: 0,
                            ease: 'power2.out'
                        }, 0)
                        .to(p.mesh.scale, {
                            duration: isHit ? 0.8 : 0.6,
                            x: 0,
                            y: 0,
                            z: 0,
                            ease: 'power2.in'
                        }, 0.2),
                    index * 0.02
                );
            });
            
            if (isHit) {
                const fireGeometry = new THREE.SphereGeometry(0.8, 8, 8);
                const fireMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff4400,
                    transparent: true,
                    opacity: 0.9
                });
                const fire = new THREE.Mesh(fireGeometry, fireMaterial);
                fire.position.copy(position);
                this.scene.add(fire);
                
                gsap.timeline()
                    .to(fire.scale, {
                        duration: 0.3,
                        x: 2,
                        y: 2,
                        z: 2,
                        ease: 'power2.out'
                    })
                    .to(fireMaterial, {
                        duration: 0.3,
                        opacity: 0,
                        ease: 'power2.out',
                        onComplete: () => {
                            this.scene.remove(fire);
                        }
                    }, 0);
            }
        });
    }
    
    createWaterSplash(position) {
        return new Promise((resolve) => {
            const splashCount = 8;
            const splashes = [];
            
            for (let i = 0; i < splashCount; i++) {
                const splashGeometry = new THREE.CylinderGeometry(
                    0.02,
                    0.08,
                    Math.random() * 0.5 + 0.3,
                    6
                );
                const splashMaterial = new THREE.MeshPhongMaterial({
                    color: 0x88ccff,
                    transparent: true,
                    opacity: 0.8
                });
                
                const splash = new THREE.Mesh(splashGeometry, splashMaterial);
                splash.position.copy(position);
                this.scene.add(splash);
                
                splashes.push(splash);
            }
            
            const timeline = gsap.timeline({
                onComplete: () => {
                    splashes.forEach(s => this.scene.remove(s));
                    resolve();
                }
            });
            
            splashes.forEach((splash, index) => {
                const angle = (index / splashCount) * Math.PI * 2;
                const distance = Math.random() * 1.5 + 0.5;
                const height = Math.random() * 2 + 1;
                
                timeline.add(
                    gsap.timeline()
                        .to(splash.position, {
                            duration: 0.6,
                            x: position.x + Math.cos(angle) * distance,
                            y: position.y + height,
                            z: position.z + Math.sin(angle) * distance,
                            ease: 'power2.out'
                        })
                        .to(splash.position, {
                            duration: 0.4,
                            y: position.y - 0.5,
                            ease: 'power2.in'
                        }, 0.3)
                        .to(splash.material, {
                            duration: 0.5,
                            opacity: 0,
                            ease: 'power2.out'
                        }, 0.4),
                    index * 0.05
                );
            });
            
            const rippleGeometry = new THREE.RingGeometry(0.1, 0.3, 16);
            const rippleMaterial = new THREE.MeshBasicMaterial({
                color: 0x6699cc,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
            ripple.rotation.x = -Math.PI / 2;
            ripple.position.copy(position);
            ripple.position.y = 0.1;
            this.scene.add(ripple);
            
            gsap.timeline()
                .to(ripple.scale, {
                    duration: 1,
                    x: 4,
                    y: 4,
                    z: 4,
                    ease: 'power2.out'
                })
                .to(rippleMaterial, {
                    duration: 1,
                    opacity: 0,
                    ease: 'power2.out',
                    onComplete: () => {
                        this.scene.remove(ripple);
                    }
                }, 0);
        });
    }
    
    sinkShip(shipType) {
        return new Promise((resolve) => {
            const ship = this.ships.find(s => s.type === shipType);
            if (!ship) {
                resolve();
                return;
            }
            
            gsap.timeline()
                .to(ship.model.rotation, {
                    duration: 1,
                    z: Math.random() > 0.5 ? 0.8 : -0.8,
                    ease: 'power2.in'
                })
                .to(ship.model.position, {
                    duration: 2,
                    y: ship.originalY - 5,
                    ease: 'power2.in',
                    onComplete: () => {
                        ship.model.visible = false;
                        resolve();
                    }
                }, 0.5)
                .to(ship.model.rotation, {
                    duration: 2,
                    x: Math.PI,
                    ease: 'power2.in'
                }, 0.5);
        });
    }
    
    updateOcean() {
        if (!this.ocean) return;
        
        this.waterTime += 0.01;
        const positions = this.ocean.geometry.attributes.position;
        
        for (let i = 0; i < positions.count; i++) {
            const x = this.originalPositions[i * 3];
            const z = this.originalPositions[i * 3 + 2];
            
            const wave1 = Math.sin(x * 0.1 + this.waterTime) * 0.2;
            const wave2 = Math.sin(z * 0.15 + this.waterTime * 0.7) * 0.15;
            const wave3 = Math.sin((x + z) * 0.08 + this.waterTime * 1.2) * 0.1;
            
            positions.setY(i, wave1 + wave2 + wave3);
        }
        
        positions.needsUpdate = true;
        this.ocean.geometry.computeVertexNormals();
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        this.updateOcean();
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onResize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const width = rect.width || 800;
        const height = rect.height || 200;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

const oceanScene = new OceanScene('three-scene');
