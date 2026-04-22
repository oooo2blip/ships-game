class GameAudio {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isMuted = false;
        this.volume = 0.7;
        this.sounds = {};
        this.initialized = false;
        
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.initialized = false;
        }
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const soundToggle = document.getElementById('sound-toggle');
        const volumeSlider = document.getElementById('volume-slider');
        
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                this.toggleMute();
                this.updateSoundIcon();
            });
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(e.target.value / 100);
            });
        }
    }
    
    updateSoundIcon() {
        const soundIcon = document.querySelector('.sound-icon');
        if (soundIcon) {
            soundIcon.textContent = this.isMuted ? '🔇' : '🔊';
        }
    }
    
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain && !this.isMuted) {
            this.masterGain.gain.value = this.volume;
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
        }
    }
    
    createOscillatorSound(frequency, type, duration, volume = 0.3) {
        if (!this.initialized || this.isMuted) return;
        
        this.resumeContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    createNoiseBuffer() {
        if (!this.initialized) return null;
        
        const bufferSize = 2 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
    
    playCannon() {
        if (!this.initialized || this.isMuted) return;
        
        this.resumeContext();
        
        const explosionDuration = 0.3;
        const now = this.audioContext.currentTime;
        
        const noiseBuffer = this.createNoiseBuffer();
        if (!noiseBuffer) return;
        
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + explosionDuration);
        
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(500, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(100, now + explosionDuration);
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        noiseSource.start(now);
        noiseSource.stop(now + explosionDuration);
        
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(20, now + explosionDuration);
        
        const oscGain = this.audioContext.createGain();
        oscGain.gain.setValueAtTime(0.6, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + explosionDuration);
        
        oscillator.connect(oscGain);
        oscGain.connect(this.masterGain);
        
        oscillator.start(now);
        oscillator.stop(now + explosionDuration);
    }
    
    playHit() {
        if (!this.initialized || this.isMuted) return;
        
        this.resumeContext();
        
        const now = this.audioContext.currentTime;
        
        const noiseBuffer = this.createNoiseBuffer();
        if (!noiseBuffer) return;
        
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(300, now);
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        noiseSource.start(now);
        noiseSource.stop(now + 0.4);
        
        for (let i = 0; i < 5; i++) {
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200 + Math.random() * 300, now + i * 0.05);
            
            const oscGain = this.audioContext.createGain();
            oscGain.gain.setValueAtTime(0.2, now + i * 0.05);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.15);
            
            osc.connect(oscGain);
            oscGain.connect(this.masterGain);
            
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.15);
        }
    }
    
    playMiss() {
        if (!this.initialized || this.isMuted) return;
        
        this.resumeContext();
        
        const now = this.audioContext.currentTime;
        
        const noiseBuffer = this.createNoiseBuffer();
        if (!noiseBuffer) return;
        
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(800, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        noiseSource.start(now);
        noiseSource.stop(now + 0.3);
        
        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500 + Math.random() * 200, now + i * 0.08);
            
            const oscGain = this.audioContext.createGain();
            oscGain.gain.setValueAtTime(0.15, now + i * 0.08);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.1);
            
            osc.connect(oscGain);
            oscGain.connect(this.masterGain);
            
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.1);
        }
    }
    
    playSunk() {
        if (!this.initialized || this.isMuted) return;
        
        this.resumeContext();
        
        const now = this.audioContext.currentTime;
        
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 1.5);
        
        const oscGain = this.audioContext.createGain();
        oscGain.gain.setValueAtTime(0.4, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 1.5);
        
        const lfo = this.audioContext.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(5, now);
        
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.setValueAtTime(0.5, now);
        
        lfo.connect(lfoGain);
        lfoGain.connect(oscGain.gain);
        
        lfo.start(now);
        lfo.stop(now + 1.5);
    }
    
    playVictory() {
        if (!this.initialized || this.isMuted) return;
        
        this.resumeContext();
        
        const now = this.audioContext.currentTime;
        
        const notes = [
            { freq: 523.25, delay: 0 },
            { freq: 659.25, delay: 0.15 },
            { freq: 783.99, delay: 0.3 },
            { freq: 1046.50, delay: 0.45 },
            { freq: 783.99, delay: 0.75 },
            { freq: 1046.50, delay: 0.9 }
        ];
        
        notes.forEach(note => {
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, now + note.delay);
            
            const oscGain = this.audioContext.createGain();
            oscGain.gain.setValueAtTime(0.3, now + note.delay);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + 0.4);
            
            osc.connect(oscGain);
            oscGain.connect(this.masterGain);
            
            osc.start(now + note.delay);
            osc.stop(now + note.delay + 0.4);
        });
    }
    
    playDefeat() {
        if (!this.initialized || this.isMuted) return;
        
        this.resumeContext();
        
        const now = this.audioContext.currentTime;
        
        const notes = [
            { freq: 392.00, delay: 0 },
            { freq: 349.23, delay: 0.2 },
            { freq: 329.63, delay: 0.4 },
            { freq: 261.63, delay: 0.6 }
        ];
        
        notes.forEach(note => {
            const osc = this.audioContext.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(note.freq, now + note.delay);
            
            const oscGain = this.audioContext.createGain();
            oscGain.gain.setValueAtTime(0.2, now + note.delay);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + 0.5);
            
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(500, now + note.delay);
            
            osc.connect(filter);
            filter.connect(oscGain);
            oscGain.connect(this.masterGain);
            
            osc.start(now + note.delay);
            osc.stop(now + note.delay + 0.5);
        });
    }
    
    playAmbientOcean() {
        if (!this.initialized || this.isMuted) return;
        
        this.resumeContext();
        
        const now = this.audioContext.currentTime;
        
        const noiseBuffer = this.createNoiseBuffer();
        if (!noiseBuffer) return;
        
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.05, now);
        
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(200, now);
        
        const lfo = this.audioContext.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.2, now);
        
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.setValueAtTime(50, now);
        
        lfo.connect(lfoGain);
        lfoGain.connect(noiseFilter.frequency);
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        noiseSource.start(now);
        lfo.start(now);
        
        this.oceanSound = { noiseSource, lfo, noiseGain };
    }
    
    stopAmbientOcean() {
        if (this.oceanSound) {
            this.oceanSound.noiseSource.stop();
            this.oceanSound.lfo.stop();
            this.oceanSound = null;
        }
    }
    
    playUI() {
        if (!this.initialized || this.isMuted) return;
        
        this.resumeContext();
        
        const now = this.audioContext.currentTime;
        
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        
        const oscGain = this.audioContext.createGain();
        oscGain.gain.setValueAtTime(0.1, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }
    
    playCombo(comboCount) {
        if (!this.initialized || this.isMuted) return;
        
        this.resumeContext();
        
        const now = this.audioContext.currentTime;
        const baseFreq = 400 + (comboCount * 50);
        
        const osc = this.audioContext.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.2);
        
        const oscGain = this.audioContext.createGain();
        oscGain.gain.setValueAtTime(0.2, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }
}

const gameAudio = new GameAudio();
