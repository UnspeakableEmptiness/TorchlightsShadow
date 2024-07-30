class Audio {
    constructor() {
        this.oscillators = [];
        this.envelopes = [];
        this.effectsChain = [];
        this.volume = 1.0;
        this.sampleRate = 44100; // Default sample rate, update as necessary    
    }
  
    addOscillator(waveform, frequency) {
        const oscillator = new Oscillator(waveform, frequency);
        this.oscillators.push(oscillator);
    }
  
    addEnvelope(attack, decay, sustain, release) {
        const envelope = new Envelope(attack, decay, sustain, release);
        this.envelopes.push(envelope);
    }
  
    addEffect(type, settings) {
        const effect = new Effect(type, settings);
        this.effectsChain.push(effect);
    }
    setVolume(volume) {
        this.volume = volume;
    }
  
    // Method to generate audio data based on current settings
    generateAudioData(context, duration) {
        const sampleRate = context.sampleRate;
        const buffer = context.createBuffer(1, sampleRate * duration, sampleRate);
        const output = buffer.getChannelData(0);

        // Combine oscillators, envelopes, and effects to generate audio data
        for (let i = 0; i < output.length; i++) {
            let sample = 0;
            const time = i / sampleRate;

            // Process each oscillator
            this.oscillators.forEach(osc => {
                sample += this.generateOscillatorSample(osc, time);
            });

            // Apply envelope
            this.envelopes.forEach(env => {
                sample *= this.applyEnvelope(env, time);
            });

            // Apply effects (if any)
            sample = this.applyEffects(sample, time);

            // Apply volume control
            sample *= this.volume;

            output[i] = sample;
        }
  
      return buffer;
    }
  
    generateOscillatorSample(oscillator, time) {
      // Generate waveform sample based on oscillator settings
        switch (oscillator.waveform) {
            case 'sine':
            return Math.sin(2 * Math.PI * oscillator.frequency * time);
            case 'square':
            return Math.sign(Math.sin(2 * Math.PI * oscillator.frequency * time));
            case 'triangle':
            return 2 * Math.abs(2 * ((time * oscillator.frequency) % 1) - 1) - 1;
            case 'sawtooth':
            return 2 * ((time * oscillator.frequency) % 1) - 1;
            case 'noise':
            return Math.random() * 2 - 1;
            default:
            return 0;
        }
    }
  
    applyEnvelope(envelope, time) {
        // Apply ADSR envelope to the sample based on time
        if (time < envelope.attack) {
            // If attack time is zero, skip to the sustain level immediately
            return envelope.attack === 0 ? 1 : time / envelope.attack;
        } else if (time < envelope.attack + envelope.decay) {
            return 1 - ((time - envelope.attack) / envelope.decay) * (1 - envelope.sustain);
        } else {
            return envelope.sustain;
        }
    }
  
    applyEffects(sample, time) {
        // Apply effects to the sample
        this.effectsChain.forEach(effect => {
          switch (effect.type) {
            case 'filter':
              sample = this.applyFilterEffect(sample, effect.settings);
              break;
            case 'reverb':
              // Implement reverb effect logic
              break;
            case 'delay':
              // Implement delay effect logic
              break;
            case 'distortion':
              // Implement distortion effect logic
              break;
            default:
              break;
          }
        });
        return sample;
      }
      
      applyFilterEffect(sample, settings) {
        const { type, frequency, Q } = settings;
      
        // Example: Implementing a simple low-pass filter
        if (type === 'lowpass') {
            const rc = 1.0 / (2 * Math.PI * frequency);
            const dt = 1.0 / this.sampleRate;
            const alpha = dt / (rc + dt);
            
            // Implementing a basic filter
            if (!this.prevSample) {
                this.prevSample = 0;
            }
            const filteredSample = this.prevSample + alpha * (sample - this.prevSample);
            this.prevSample = filteredSample;
            return filteredSample;
        }
      
        // If no filter type matches, return the original sample
        return sample;
      }
} 

class Oscillator {
    constructor(waveform, frequency) {
        this.waveform = waveform; // e.g., 'sine', 'square', 'triangle', 'sawtooth', 'noise'
        this.frequency = frequency;
    }
}

class Envelope {
    constructor(attack, decay, sustain, release) {
        this.attack = attack;
        this.decay = decay;
        this.sustain = sustain;
        this.release = release;
    }
}

class Effect {
    constructor(type, settings) {
        this.type = type; // e.g., 'filter', 'reverb', 'delay', 'distortion'
        this.settings = settings; // Specific settings for the effect type
    }
}

const audioContext = new (window.AudioContext || window.webkitAudioContext)({
    latencyHint: 'interactive' // Reduce latency for real-time applications
});

const footstep = new Audio();
    
// Add oscillators
footstep.addOscillator('sine', 120);
footstep.addOscillator('sine', 240);
footstep.addOscillator('noise', 240);

// footstep.addOscillator('square', 220);

// Add envelope
footstep.addEnvelope(0.1, 0.2, 0.7, 0.5); // Attack is 0 seconds

// Add effects
footstep.addEffect('filter', { type: 'lowpass', frequency: 500 });

footstep.setVolume(0.1);


function playsound (sound, duration) {
    
    
    // Generate audio data for 5 seconds
    const audioData = sound.generateAudioData(audioContext, duration);
    const source = audioContext.createBufferSource();
    source.buffer = audioData;
    source.connect(audioContext.destination);
    source.start(audioContext.currentTime);
}

const whitenoise = new Audio();
    
// Add oscillators
whitenoise.addOscillator('noise', 240);
whitenoise.addOscillator('sine', 100);
// footstep.addOscillator('square', 220);

// Add envelope
whitenoise.addEnvelope(0, 0.2, 0.7, 0.5); // Attack is 0 seconds

// Add effects
whitenoise.addEffect('filter', { type: 'lowpass', frequency: 500, Q : 1 });

whitenoise.setVolume(0.1);

function playnoise (sound, duration) {
    const audioData = sound.generateAudioData(audioContext, duration);
    const source = audioContext.createBufferSource();
    source.buffer = audioData;
    source.connect(audioContext.destination);
    source.start(audioContext.currentTime);
    setTimeout(() => playnoise(sound, duration), duration*1000);
}