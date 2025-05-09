class Game {
    constructor() {
        this.player = document.getElementById('player');
        this.road = document.getElementById('road');
        this.gameContainer = document.querySelector('.game');
        this.score = 0;
        this.speed = 5;
        this.isPlaying = false;
        this.playerX = 175;
        this.obstacles = [];
        this.roadLines = [];
        this.keys = {};
        this.animationId = null;
        this.lastObstacleTime = 0;
        this.obstacleInterval = 1500;
        this.lives = 3;
        this.powerUps = [];
        this.isInvincible = false;
        this.level = 1;
        this.pointsToNextLevel = 100;
        this.highScore = localStorage.getItem('highScore') || 0;
        this.powerUpTypes = ['shield', 'points', 'life'];
        this.doublePoints = false;
        this.powerUpDuration = 5000;
        this.weatherTypes = ['rain', 'snow', 'sun', 'wind'];
        this.currentWeather = 'sun';
        this.weatherContainer = document.querySelector('.weather-container');
        this.weatherInterval = null;
        this.lastTrailTime = 0;
        this.trailInterval = 100;
        this.selectedCar = 'sport';
        this.carColor = '#3498db';
        this.coins = [];
        this.coinSpawnRate = 0.03; // Taxa de spawn de moedas
        this.coinValue = 10; // Valor de cada moeda
        this.totalCoins = parseInt(localStorage.getItem('coins')) || 0;
        this.currentGameCoins = 0;
        this.inventory = JSON.parse(localStorage.getItem('inventory')) || {
            nitro: 0,
            shield: 0,
            magnet: 0
        };
        this.unlockedCars = JSON.parse(localStorage.getItem('unlockedCars')) || ['sport', 'classic', 'future'];

        this.carStats = {
            supercar: {
                maxSpeed: 20,
                acceleration: 1.5
            },
            monster: {
                collision: true,
                speed: 5
            },
            hover: {
                coinMagnetRange: 150,
                speed: 5
            }
        };


        this.sounds = {
            collision: document.getElementById('collisionSound'),
            powerUp: document.getElementById('powerUpSound'),
            point: document.getElementById('pointSound'),
            gameOver: document.getElementById('gameOverSound'),
            levelUp: document.getElementById('levelUpSound'),
            coin: document.getElementById('coinSound'), // Adicionado som da moeda
            combo: document.getElementById('comboSound'),
            ability: document.getElementById('abilitySound'),
            buy: document.getElementById('buySound')
        };

        this.isSoundMuted = false;
        this.isMusicMuted = false;
        this.backgroundMusic = document.getElementById('backgroundMusic');

        this.init();
        this.setupSoundControls();
        this.setupCarSelection();
        this.updateInventory();
        this.setupShop();
        this.updateIngameInventory();
        this.setupMenuTabs();
    }

    setupMenuTabs() {
        const tabs = document.querySelectorAll('.menu-tab');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active de todas as abas
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                // Ativa a aba clicada
                tab.classList.add('active');
                const contentId = `${tab.dataset.tab}-content`;
                const content = document.getElementById(contentId);
                if (content) {
                    content.classList.add('active');
                }
            });
        });
    }

    updateIngameInventory() {
        const ingameInventory = document.getElementById('ingameInventory');
        ingameInventory.innerHTML = '';

        const items = {
            nitro: { icon: '🚀', name: 'Nitro' },
            shield: { icon: '🛡️', name: 'Shield' },
            magnet: { icon: '🧲', name: 'Magnet' }
        };

        for (const [itemType, count] of Object.entries(this.inventory)) {
            if (count > 0) {
                const itemElement = document.createElement('div');
                itemElement.className = 'ingame-item';
                itemElement.innerHTML = `
                    <div class="item-icon">${items[itemType].icon}</div>
                    <div class="item-count">x${count}</div>
                `;
                itemElement.addEventListener('click', () => this.useItem(itemType, itemElement));
                ingameInventory.appendChild(itemElement);
            }
        }
    }

    setupShop() {
    const buyButtons = document.querySelectorAll('.buy-button');
    buyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const item = button.parentElement.dataset.item;
            const price = parseInt(button.dataset.price);

            if (this.totalCoins >= price) {
                if (['supercar', 'monster', 'hover'].includes(item)) {
                    // Lógica para comprar carros premium
                    if (!this.unlockedCars.includes(item)) {
                        this.unlockedCars.push(item);
                        localStorage.setItem('unlockedCars', JSON.stringify(this.unlockedCars));
                        this.totalCoins -= price;
                        localStorage.setItem('coins', this.totalCoins);
                        document.getElementById('coinsText').textContent = this.totalCoins;
                        this.updateInventory();

                        // Efeito visual de sucesso
                        button.style.animation = 'none';
                        button.offsetHeight;
                        button.style.animation = 'buySuccess 0.5s';

                        if (this.sounds.buy) {
                            this.sounds.buy.play().catch(() => {});
                        }
                    }
                } else {
                    // Lógica para itens consumíveis (nitro, shield, magnet)
                    this.totalCoins -= price;
                    localStorage.setItem('coins', this.totalCoins);
                    document.getElementById('coinsText').textContent = this.totalCoins;
                    
                    this.inventory[item]++;
                    localStorage.setItem('inventory', JSON.stringify(this.inventory));
                    
                    // Atualiza inventário e interface
                    this.updateInventory();
                    this.updateIngameInventory();

                    // Efeito visual de sucesso
                    button.style.animation = 'none';
                    button.offsetHeight;
                    button.style.animation = 'buySuccess 0.5s';

                    if (this.sounds.buy) {
                        this.sounds.buy.currentTime = 0;
                        this.sounds.buy.play().catch(() => {});
                    }
                }
            } else {
                // Efeito visual de erro quando não tem moedas suficientes
                button.style.animation = 'none';
                button.offsetHeight;
                button.style.animation = 'buyError 0.5s';
            }
        });
    });
}

    addItemToInventory(item) {
        const inventory = document.getElementById('playerInventory');
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item';

        let icon, name;
        switch (item) {
            case 'nitro':
                icon = '🚀';
                name = 'Nitro Boost';
                break;
            case 'shield':
                icon = '🛡️';
                name = 'Super Shield';
                break;
            case 'magnet':
                icon = '🧲';
                name = 'Coin Magnet';
                break;
        }

        itemElement.innerHTML = `
            <div class="item-icon">${icon}</div>
            <p>${name}</p>
        `;

        // Adicionar evento de uso do item
        itemElement.addEventListener('click', () => this.useItem(item, itemElement));

        inventory.appendChild(itemElement);
    }

    useItem(item, element) {
        if (this.inventory[item] > 0) {
            this.inventory[item]--;
            localStorage.setItem('inventory', JSON.stringify(this.inventory));

            switch (item) {
                case 'nitro':
                    this.speed *= 1.5;
                    setTimeout(() => this.speed /= 1.5, 10000);
                    break;
                case 'shield':
                    this.isInvincible = true;
                    setTimeout(() => this.isInvincible = false, 20000);
                    break;
                case 'magnet':
                    this.coinMagnet = true;
                    setTimeout(() => this.coinMagnet = false, 30000);
                    break;
            }

            if (this.sounds.ability) {
                this.sounds.ability.play().catch(() => { });
            }

            this.updateInventory();
            this.updateIngameInventory();
        }
    }

    updateInventory() {
        const inventory = document.getElementById('playerInventory');
        inventory.innerHTML = '';

        // Mostra carros premium desbloqueados
        this.unlockedCars.forEach(car => {
            if (['supercar', 'monster', 'hover'].includes(car)) {
                const carElement = document.createElement('div');
                carElement.className = 'inventory-item car-item';
                carElement.innerHTML = `
                <div class="car-preview">
                    <img src="images/${car}.png" alt="${car}" class="car-image">
                </div>
                <p>${car}</p>
                <button class="select-car-btn">Usar</button>
            `;

                // Adiciona evento de clique para selecionar o carro
                carElement.querySelector('.select-car-btn').addEventListener('click', () => {
                    this.selectedCar = car;
                    this.updatePlayerAppearance();
                    document.querySelectorAll('.car-item').forEach(item =>
                        item.classList.remove('selected'));
                    carElement.classList.add('selected');
                });

                if (this.selectedCar === car) {
                    carElement.classList.add('selected');
                }

                inventory.appendChild(carElement);
            }
        });

        // Adicionar contador de moedas
        const coinsDisplay = document.createElement('div');
        coinsDisplay.className = 'inventory-item coins-display';
        coinsDisplay.innerHTML = `
            <div class="item-icon">💰</div>
            <p>Suas Moedas</p>
            <p class="item-count">${this.totalCoins}</p>
        `;
        inventory.appendChild(coinsDisplay);

        // Adicionar itens do inventário
        const items = {
            nitro: { icon: '🚀', name: 'Nitro Boost' },
            shield: { icon: '🛡️', name: 'Super Shield' },
            magnet: { icon: '🧲', name: 'Coin Magnet' }
        };

        for (const [itemType, count] of Object.entries(this.inventory)) {
            if (count > 0) {
                const itemElement = document.createElement('div');
                itemElement.className = 'inventory-item';
                itemElement.innerHTML = `
                    <div class="item-icon">${items[itemType].icon}</div>
                    <p>${items[itemType].name}</p>
                    <p class="item-count">x${count}</p>
                `;
                itemElement.addEventListener('click', () => this.useItem(itemType, itemElement));
                inventory.appendChild(itemElement);
            }
        }
    }

    setupCarSelection() {
        const carOptions = document.querySelectorAll('.car-option');
        const colorPicker = document.getElementById('carColor');

        carOptions.forEach(option => {
            option.addEventListener('click', () => {
                document.querySelector('.car-option.selected')?.classList.remove('selected');
                option.classList.add('selected');
                this.selectedCar = option.dataset.car;
                this.updatePlayerAppearance();
            });
        });

        colorPicker.addEventListener('input', (e) => {
            this.carColor = e.target.value;
            this.updatePlayerAppearance();
        });

        document.querySelector('[data-car="sport"]').classList.add('selected');
    }

   updatePlayerAppearance() {
    const player = document.getElementById('player');
    
    // Complete reset of all styles and attributes
    player.innerHTML = '';
    player.style = '';
    player.removeAttribute('class');
    player.removeAttribute('style');
    
    // Reset ALL possible styles that could show windows/effects
    player.style.cssText = `
        background: none !important;
        clip-path: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        border: none !important;
        outline: none !important;
        transform: none !important;
    `;

    // Reset special abilities
    this.coinMagnetRange = 50;
    this.maxGameSpeed = 15;
    this.monsterMode = false;

    // Carros premium
    if (['supercar', 'monster', 'hover'].includes(this.selectedCar)) {
        const carImage = document.createElement('img');
        carImage.src = `images/${this.selectedCar}.png`;
        carImage.alt = this.selectedCar;
        carImage.className = 'car-image';
        carImage.style.width = '100%';
        carImage.style.height = '100%';
        carImage.style.objectFit = 'contain';
        carImage.style.display = 'block'; // Force block display
        player.appendChild(carImage);
        
        // Apply special abilities
        switch (this.selectedCar) {
            case 'supercar':
                this.maxGameSpeed = this.carStats.supercar.maxSpeed;
                this.acceleration = this.carStats.supercar.acceleration;
                break;
            case 'monster':
                this.monsterMode = true;
                this.speed = this.carStats.monster.speed;
                break;
            case 'hover':
                this.coinMagnetRange = this.carStats.hover.coinMagnetRange;
                this.speed = this.carStats.hover.speed;
                break;
        }
    } 
    // Carros básicos
    else {
        player.className = 'car';
        player.classList.add(this.selectedCar);
        
        switch (this.selectedCar) {
            case 'sport':
                player.style.clipPath = 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 100%, 0% 100%, 0% 20%)';
                break;
            case 'classic':
                player.style.borderRadius = '15px 15px 5px 5px';
                break;
            case 'future':
                player.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 100%, 0% 100%, 0% 25%)';
                break;
        }
        
        player.style.background = `linear-gradient(${this.carColor}, ${this.adjustColor(this.carColor, -20)})`;
    }
}

    adjustColor(color, amount) {
        return '#' + color.replace(/^#/, '').replace(/../g, color =>
            ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).slice(-2));
    }

    setupSoundControls() {
        const toggleSound = document.getElementById('toggleSound');
        const toggleMusic = document.getElementById('toggleMusic');

        toggleSound.addEventListener('click', () => {
            this.isSoundMuted = !this.isSoundMuted;
            toggleSound.textContent = this.isSoundMuted ? '🔇' : '🔊';
            toggleSound.classList.toggle('muted', this.isSoundMuted);

            Object.values(this.sounds).forEach(sound => {
                if (sound) sound.muted = this.isSoundMuted;
            });
        });

        toggleMusic.addEventListener('click', () => {
            this.isMusicMuted = !this.isMusicMuted;
            toggleMusic.textContent = this.isMusicMuted ? '🎵' : '🎵';
            toggleMusic.classList.toggle('muted', this.isMusicMuted);

            if (this.backgroundMusic) {
                if (this.isMusicMuted) {
                    this.backgroundMusic.pause();
                } else if (this.isPlaying) {
                    this.backgroundMusic.play().catch(() => { });
                }
            }
        });
    }

    init() {
        document.addEventListener('keydown', (e) => {
            e.preventDefault();
            this.keys[e.key] = true;
        });

        document.addEventListener('keyup', (e) => {
            e.preventDefault();
            this.keys[e.key] = false;
        });

        this.gameContainer.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const containerRect = this.gameContainer.getBoundingClientRect();
            if (touch.clientX - containerRect.left < containerRect.width / 2) {
                this.keys['ArrowLeft'] = true;
                this.keys['ArrowRight'] = false;
            } else {
                this.keys['ArrowLeft'] = false;
                this.keys['ArrowRight'] = true;
            }
        });

        this.gameContainer.addEventListener('touchend', () => {
            this.keys['ArrowLeft'] = false;
            this.keys['ArrowRight'] = false;
        });

        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.startGame());

        this.createRoadLines();
        document.getElementById('gameStart').style.display = 'block';
        document.getElementById('livesText').textContent = this.lives;
        document.getElementById('levelText').textContent = this.level;
        document.getElementById('highScoreText').textContent = this.highScore;

        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

        document.getElementById('restartButton').addEventListener('click', () => this.startGame());
        document.getElementById('menuButton').addEventListener('click', () => {
            document.getElementById('gameOver').style.display = 'none';
            document.getElementById('gameStart').style.display = 'block';
            this.resetGame();
        });
    }

    handleTouchStart(e) {
        this.touchX = e.touches[0].clientX;
    }

    handleTouchMove(e) {
        if (!this.touchX) return;

        const diffX = e.touches[0].clientX - this.touchX;
        this.touchX = e.touches[0].clientX;

        this.playerX = Math.max(0, Math.min(350, this.playerX + diffX));
        this.player.style.left = this.playerX + 'px';
    }

    handleTouchEnd() {
        this.touchX = null;
    }


    startGame() {
        this.resetGame();
        this.isPlaying = true;
        document.getElementById('gameStart').style.display = 'none';
        document.getElementById('gameOver').style.display = 'none';

        if (!this.isMusicMuted && this.backgroundMusic) {
            this.backgroundMusic.currentTime = 0;
            this.backgroundMusic.play().catch(() => { });
        }

        this.updateInventory();
        this.gameLoop();
        this.updateIngameInventory();
    }

    resetGame() {
        this.score = 0;
        this.speed = 5;
        this.playerX = 175;
        this.lives = 3;
        this.level = 1;
        this.pointsToNextLevel = 100;
        this.isInvincible = false;
        this.doublePoints = false;
        this.lastObstacleTime = 0;
        this.obstacleInterval = 1500;
        this.currentGameCoins = 0;

        this.obstacles.forEach(obstacle => obstacle.remove());
        this.obstacles = [];
        this.powerUps.forEach(powerUp => powerUp.remove());
        this.powerUps = [];
        this.coins.forEach(coin => coin.remove());
        this.coins = [];

        if (this.weatherInterval) {
            clearInterval(this.weatherInterval);
            this.weatherInterval = null;
        }

        this.weatherContainer.innerHTML = '';

        document.getElementById('scoreText').textContent = '0';
        document.getElementById('livesText').textContent = this.lives;
        document.getElementById('levelText').textContent = this.level;

        this.clearGameObjects();
        this.updatePlayerAppearance();
        this.updateIngameInventory();

        this.player.style.left = this.playerX + 'px';

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    clearGameObjects() {
        this.obstacles.forEach(obstacle => {
            if (obstacle && obstacle.parentNode) {
                obstacle.remove();
            }
        });
        this.obstacles = [];

        this.powerUps.forEach(powerUp => {
            if (powerUp && powerUp.parentNode) {
                powerUp.remove();
            }
        });
        this.powerUps = [];
    }

    createRoadLines() {
        this.road.innerHTML = '';
        for (let i = 0; i < 15; i++) {
            const line = document.createElement('div');
            line.className = 'road-line';
            line.style.top = (i * 80) + 'px';
            this.roadLines.push(line);
            this.road.appendChild(line);
        }
    }

    moveRoadLines() {
        this.roadLines.forEach(line => {
            let top = parseInt(line.style.top);
            top += this.speed;
            if (top > 600) top = -40;
            line.style.top = top + 'px';
        });
    }

    createParticles(x, y, color) {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.backgroundColor = color;
            particle.style.transform = `rotate(${Math.random() * 360}deg)`;
            fragment.appendChild(particle);
        }
        this.gameContainer.appendChild(fragment);
        setTimeout(() => {
            const particles = this.gameContainer.getElementsByClassName('particle');
            while (particles.length > 0) {
                particles[0].remove();
            }
        }, 800);
    }

    createPlayerTrail() {
        const now = Date.now();
        if (now - this.lastTrailTime > this.trailInterval) {
            const trail = document.createElement('div');
            trail.className = 'player-trail';
            trail.style.left = this.player.style.left;
            trail.style.bottom = '40px';
            trail.style.background = `rgba(${this.hexToRgb(this.carColor)}, 0.2)`;
            this.gameContainer.appendChild(trail);
            setTimeout(() => trail.remove(), 300);
            this.lastTrailTime = now;
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ?
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
            '52, 152, 219';
    }

    createSpeedLines() {
        if (Math.random() < 0.1) {
            const line = document.createElement('div');
            line.className = 'speed-line';
            line.style.left = Math.random() * 400 + 'px';
            this.gameContainer.appendChild(line);
            setTimeout(() => line.remove(), 300);
        }
    }

    updateWeather() {
        if (!this.weatherInterval) {
            // Limpar efeitos antigos antes de criar novos
            this.weatherContainer.innerHTML = '';

            this.weatherInterval = setInterval(() => {
                this.currentWeather = this.weatherTypes[Math.floor(Math.random() * this.weatherTypes.length)];
                this.weatherContainer.innerHTML = '';
                this.createWeatherEffect();
            }, 15000);
        }
    }

    createWeatherEffect() {
        switch (this.currentWeather) {
            case 'rain':
                for (let i = 0; i < 50; i++) {
                    const drop = document.createElement('div');
                    drop.className = 'rain-drop';
                    drop.style.left = Math.random() * 400 + 'px';
                    drop.style.animationDelay = Math.random() * 0.7 + 's';
                    this.weatherContainer.appendChild(drop);
                }
                break;
            case 'snow':
                for (let i = 0; i < 30; i++) {
                    const flake = document.createElement('div');
                    flake.className = 'snow-flake';
                    flake.style.left = Math.random() * 400 + 'px';
                    flake.style.animationDelay = Math.random() * 3 + 's';
                    this.weatherContainer.appendChild(flake);
                }
                break;
            case 'sun':
                const ray = document.createElement('div');
                ray.className = 'sun-ray';
                this.weatherContainer.appendChild(ray);
                break;
            case 'wind':
                for (let i = 0; i < 20; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'wind-particle';
                    particle.style.top = Math.random() * 600 + 'px';
                    particle.style.animationDelay = Math.random() + 's';
                    this.weatherContainer.appendChild(particle);
                }
                break;
        }
    }

    createPowerUp() {
        if (Math.random() < 0.005) {
            const powerUp = document.createElement('div');
            const type = this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)];
            powerUp.className = `power-up power-up-${type}`;
            powerUp.dataset.type = type;

            const minX = 10;
            const maxX = 330;
            powerUp.style.left = Math.floor(Math.random() * (maxX - minX) + minX) + 'px';
            powerUp.style.top = '-30px';
            this.powerUps.push(powerUp);
            this.gameContainer.appendChild(powerUp);
        }
    }

    movePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            let top = parseInt(powerUp.style.top);
            top += this.speed;

            if (top > 600) {
                powerUp.remove();
                this.powerUps.splice(i, 1);
            } else {
                powerUp.style.top = top + 'px';
                if (this.checkPowerUpCollision(powerUp)) {
                    this.collectPowerUp(powerUp, i);
                }
            }
        }
    }

    createObstacle() {
        const now = Date.now();
        if (now - this.lastObstacleTime > this.obstacleInterval) {
            const obstacle = document.createElement('div');
            obstacle.className = 'obstacle';
            const minX = 10;
            const maxX = 330;
            obstacle.style.left = Math.floor(Math.random() * (maxX - minX) + minX) + 'px';
            obstacle.style.top = '-60px';
            this.obstacles.push(obstacle);
            this.gameContainer.appendChild(obstacle);

            this.lastObstacleTime = now;
            this.obstacleInterval = Math.max(800, 1500 - (this.score / 100) * 50);
        }
    }

    moveObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            let top = parseInt(obstacle.style.top);
            top += this.speed;

            if (top > 600) {
                obstacle.remove();
                this.obstacles.splice(i, 1);
                const basePoints = 10;
                const points = this.doublePoints ? basePoints * 2 : basePoints;
                this.score += points;

                if (this.sounds.point) {
                    this.sounds.point.play().catch(() => { });
                }
                document.getElementById('scoreText').textContent = this.score;
                this.checkLevel();
            } else {
                obstacle.style.top = top + 'px';
                if (this.checkCollision(obstacle)) {
                    return true;
                }
            }
        }
        return false;
    }

    checkLevel() {
        if (this.score >= this.pointsToNextLevel) {
            this.level++;
            this.pointsToNextLevel += this.level * 100;

            // Ajuste de velocidade considerando o carro selecionado
            const speedIncrease = this.selectedCar === 'supercar' ? 0.8 : 0.5;
            this.speed = Math.min(this.maxGameSpeed, this.speed + speedIncrease);

            // Ajuste na velocidade do jogo
            const currentGameSpeed = this.speed;
            this.speed = Math.min(15, currentGameSpeed + 0.5);

            // Garantir que a velocidade seja sempre positiva
            if (this.speed <= 0) this.speed = currentGameSpeed;

            document.getElementById('levelText').textContent = this.level;
            this.showLevelUp();
            if (this.sounds.levelUp) {
                this.sounds.levelUp.play().catch(() => { });
            }
        }
    }

    showLevelUp() {
        const levelUp = document.createElement('div');
        levelUp.className = 'level-up';
        levelUp.textContent = `Nível ${this.level}!`;
        this.gameContainer.appendChild(levelUp);

        setTimeout(() => levelUp.remove(), 2000);
    }

    showPowerUpIndicator(text, color) {
        const indicator = document.createElement('div');
        indicator.className = 'level-up';
        indicator.textContent = text;
        indicator.style.color = color;
        indicator.style.textShadow = `0 0 20px ${color}`;
        this.gameContainer.appendChild(indicator);
        setTimeout(() => indicator.remove(), 1500);
    }

    checkCollision(obstacle) {
        if (this.isInvincible) return false;

        const playerRect = this.player.getBoundingClientRect();
        const obstacleRect = obstacle.getBoundingClientRect();
        const margin = 5;

        const collision = !(
            playerRect.right - margin < obstacleRect.left + margin ||
            playerRect.left + margin > obstacleRect.right - margin ||
            playerRect.bottom - margin < obstacleRect.top + margin ||
            playerRect.top + margin > obstacleRect.bottom - margin
        );

        if (collision) {
            this.handleCollision();
            return true;
        }
        return false;

        // if (collision) {
        //     if (this.monsterMode) {
        //         // Monster Truck pode ignorar uma colisão
        //         this.monsterMode = false;
        //         obstacle.remove();
        //         return false;
        //     }
        //     return true;
        // }
        // return false;
    }

    handleCollision() {
        if (this.isInvincible) return;

        this.lives--;
        document.getElementById('livesText').textContent = this.lives;

        if (this.lives <= 0) {
            this.gameOver();
            return;
        }

        if (this.sounds.collision) {
            this.sounds.collision.currentTime = 0;
            this.sounds.collision.play().catch(() => { });
        }

        this.isInvincible = true;
        this.player.style.opacity = '0.5';
        setTimeout(() => {
            this.isInvincible = false;
            this.player.style.opacity = '1';
        }, 2000);

        this.showExplosion();
    }

    checkPowerUpCollision(powerUp) {
        const playerRect = this.player.getBoundingClientRect();
        const powerUpRect = powerUp.getBoundingClientRect();

        return !(
            playerRect.left >= powerUpRect.right ||
            playerRect.right <= powerUpRect.left ||
            playerRect.top >= powerUpRect.bottom ||
            playerRect.bottom <= powerUpRect.top
        );
    }

    spawnCoins() {
        if (Math.random() < this.coinSpawnRate) {
            const coin = document.createElement('div');
            coin.className = 'coin';
            coin.style.left = Math.random() * (this.gameContainer.offsetWidth - 20) + 'px';
            coin.style.top = '-20px';
            this.gameContainer.appendChild(coin);
            this.coins.push(coin);
        }
    }

    moveCoins() {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            let top = parseFloat(coin.style.top);
            let left = parseFloat(coin.style.left);

            if (this.selectedCar === 'hover') {
                const playerLeft = this.playerX;
                const dx = playerLeft - left;
                const dy = 550 - top;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.coinMagnetRange) {
                    const magnetSpeed = 10;
                    left += (dx / distance) * magnetSpeed;
                    top += (dy / distance) * magnetSpeed;
                }
            }

            if (this.coinMagnet) {
                // Calculate direction to player
                const playerLeft = this.playerX;
                const dx = playerLeft - left;
                const dy = 550 - top;

                // Move coin towards player when magnet is active
                const magnetSpeed = 15;  // Renomeado de speed para magnetSpeed
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0) {
                    left += (dx / distance) * magnetSpeed;
                    top += (dy / distance) * magnetSpeed;
                }
            } else {
                // Normal coin movement
                const coinFallSpeed = Math.max(this.speed, 1);  // Renomeado para coinFallSpeed
                top += coinFallSpeed;
            }

            if (top > this.gameContainer.offsetHeight) {
                coin.remove();
                this.coins.splice(i, 1);
            } else {
                coin.style.top = top + 'px';
                coin.style.left = left + 'px';
            }
        }
    }

    checkCoinCollisions() {
        const playerRect = this.player.getBoundingClientRect();

        this.coins.forEach((coin, index) => {
            const coinRect = coin.getBoundingClientRect();
            if (this.isColliding(playerRect, coinRect)) {
                this.collectCoin(coin, index);
            }
        });
    }

    isColliding(rect1, rect2) {
        return !(
            rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.top > rect2.bottom ||
            rect1.bottom < rect2.top
        );
    }

    collectCoin(coin, index) {
        this.currentGameCoins += this.coinValue;
        this.totalCoins += this.coinValue;
        localStorage.setItem('coins', this.totalCoins);
        document.getElementById('coinsText').textContent = this.currentGameCoins;

        // Efeito visual
        const collectEffect = document.createElement('div');
        collectEffect.className = 'coin-collect';
        collectEffect.textContent = '+' + this.coinValue;
        collectEffect.style.left = coin.style.left;
        collectEffect.style.top = coin.style.top;
        this.gameContainer.appendChild(collectEffect);

        // Som
        if (this.sounds.coin) {
            this.sounds.coin.currentTime = 0;
            this.sounds.coin.play().catch(() => { });
        }

        coin.remove();
        this.coins.splice(index, 1);
        setTimeout(() => collectEffect.remove(), 500);
        this.updateInventory();
    }


    collectPowerUp(powerUp, index) {
        const type = powerUp.dataset.type;
        const rect = powerUp.getBoundingClientRect();
        const x = rect.left;
        const y = rect.top;

        if (this.sounds.powerUp) {
            this.sounds.powerUp.play().catch(() => { });
        }

        let color;
        switch (type) {
            case 'shield':
                color = '#3498db';
                this.isInvincible = true;
                this.player.style.setProperty('--power-color', color);
                this.player.classList.add('powered');
                this.showPowerUpIndicator('Shield!', color);
                setTimeout(() => {
                    this.isInvincible = false;
                    this.player.classList.remove('powered');
                }, this.powerUpDuration);
                break;

            case 'points':
                color = '#f1c40f';
                this.doublePoints = true;
                this.player.style.setProperty('--power-color', color);
                this.player.classList.add('powered');
                this.showPowerUpIndicator('2x Points!', color);
                setTimeout(() => {
                    this.doublePoints = false;
                    this.player.classList.remove('powered');
                }, this.powerUpDuration);
                break;

            case 'life':
                color = '#e74c3c';
                this.lives = Math.min(5, this.lives + 1);
                document.getElementById('livesText').textContent = this.lives;
                this.player.style.setProperty('--power-color', color);
                this.player.classList.add('powered');
                this.showPowerUpIndicator('+1 Life!', color);
                setTimeout(() => {
                    this.player.classList.remove('powered');
                }, 1000);
                break;
        }

        this.createParticles(x, y, color);
        powerUp.remove();
        this.powerUps.splice(index, 1);
    }

    movePlayer() {
        const moveSpeed = 10;
        if (this.keys['ArrowLeft']) {
            this.playerX = Math.max(0, this.playerX - moveSpeed);
        }
        if (this.keys['ArrowRight']) {
            this.playerX = Math.min(350, this.playerX + moveSpeed);
        }
        this.player.style.left = this.playerX + 'px';
    }

    showExplosion() {
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.style.left = this.player.style.left;
        explosion.style.top = this.player.style.top;
        this.gameContainer.appendChild(explosion);

        setTimeout(() => explosion.remove(), 500);
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
            document.getElementById('highScoreText').textContent = this.highScore;
        }
    }

    gameOver() {
        if (this.isInvincible) return false;

        this.lives--;
        document.getElementById('livesText').textContent = this.lives;

        if (this.lives <= 0) {
            this.isPlaying = false;
            if (this.backgroundMusic) {
                this.backgroundMusic.pause();
                this.backgroundMusic.currentTime = 0;
            }
            this.updateHighScore();
            if (this.sounds.gameOver) {
                this.sounds.gameOver.play().catch(() => { });
            }
            document.getElementById('gameOver').style.display = 'block';
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('finalCoins').textContent = this.currentGameCoins; // Moedas da partida atual
            document.getElementById('totalCoinsCollected').textContent = localStorage.getItem('coins') || 0;
            return true;
        }

        this.isInvincible = true;
        this.player.style.opacity = '0.5';
        setTimeout(() => {
            this.isInvincible = false;
            this.player.style.opacity = '1';
        }, 2000);

        if (this.sounds.collision) {
            this.sounds.collision.play().catch(() => { });
        }
        this.showExplosion();
        return false;
    }

    gameLoop() {
        if (!this.isPlaying) return;

        this.movePlayer();
        this.moveRoadLines();
        this.createObstacle();
        this.moveObstacles();
        this.createPowerUp();
        this.movePowerUps();
        this.spawnCoins();
        this.moveCoins();
        this.checkCoinCollisions();
        this.createPlayerTrail();
        this.createSpeedLines();
        this.updateWeather();

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});