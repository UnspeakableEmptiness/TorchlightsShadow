class SoundSource {
  constructor(context, soundManager, type, frequency, adsr, fx, mastervolume) {
    this.context = context;
    this.soundManager = soundManager;
    this.type = type;
    this.frequency = frequency;
    this.oscillator = null;
    this.output = null; // The node to connect to the next node in the chain
    this.adsr = adsr; // ADSR envelope parameters
    this.gainNode = this.context.createGain(); // Gain node for ADSR envelope
    this.fx = [];
    if(fx)this.fx = fx.slice();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.setValueAtTime(mastervolume, this.context.currentTime);
    this.output = this.masterGain;
  }

  start() {
    let lastnode = this.gainNode;
    if(this.fx.length > 0){
      this.fx.forEach(
        function (effect) {
          lastnode.connect(effect);
          lastnode = effect;
        }
      )
    }
    lastnode.connect(this.masterGain);

    if (this.type === 'noise' || this.type === 'bandpass-noise') {
      const bufferSize = this.context.sampleRate * 2; // 2 seconds of noise
      const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // Generate white noise
      }

      this.noiseBufferSource = this.context.createBufferSource();
      this.noiseBufferSource.buffer = buffer;
      this.noiseBufferSource.loop = true; // Loop the noise buffer

      if (this.type === 'bandpass-noise') {
        const filter = this.context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(this.frequency, this.context.currentTime);

        this.bandpassFilter = filter;
        this.noiseBufferSource.connect(this.bandpassFilter);
        this.bandpassFilter.connect(this.gainNode);
      }
      else {
        this.noiseBufferSource.connect(this.gainNode);
      }
      // this.output = this.gainNode; // Set output to gainNode for connecting to the next node in the chain

      this.noiseBufferSource.start();

      this.applyADSR();

    }
    else {
    this.oscillator = this.context.createOscillator();
    this.oscillator.type = this.type;
    this.oscillator.frequency.setValueAtTime(this.frequency, this.context.currentTime);

    this.oscillator.connect(this.gainNode);
    // this.output = this.gainNode; // Set output to gainNode for connecting to the next node in the chain

    this.oscillator.start();

    this.applyADSR();

    }
  }

  stop() {
  }

  setFrequency(frequency) {
    if (this.oscillator) {
      this.oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    }
  }

  connect(node) {
    if (this.output) {
      this.output.connect(node);
    }
  }

  disconnect() {
    if (this.output) {
      this.output.disconnect();
    }
  }

  applyADSR() {
    const thisnode = this;
    const now = this.context.currentTime;
    const { attack, decay, sustain, release, duration } = this.adsr;

    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(0, now);
    this.gainNode.gain.linearRampToValueAtTime(1, now + attack); // Attack phase
    this.gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay); // Decay to sustain level

    if(duration == Infinity){
      return;
    }
    // Sustain phase: Hold the sustain level
    const sustainEndTime = now + attack + decay + duration;
    this.gainNode.gain.setValueAtTime(sustain, sustainEndTime);

    // Release phase: Ramp from sustain level to 0
    this.gainNode.gain.linearRampToValueAtTime(0, sustainEndTime + release);
    if(this.oscillator)this.oscillator.stop(sustainEndTime + release);
    else this.noiseBufferSource.stop(sustainEndTime + release);
    setTimeout(() => {
      thisnode.disconnect();
      // this.soundManager.removeSource(thisnode);
    }, 10000);
  }
}
  
class SoundManager {
  constructor(context) {
    this.context = context;
    this.sources = [];
    this.effectsChain = [];
    this.masterGain = this.context.createGain();
    this.compressor = this.context.createDynamicsCompressor();
    this.masterGain.connect(this.compressor);
    this.setMasterVolume(1);
    this.compressor.connect(this.context.destination);
    // this.masterGain.connect(this.context.destination);
  }

  addSource(source) {
    this.sources.push(source);
    source.start();
    this.updateRouting();
  }

  removeSource(source) {
    source.stop();
    this.sources = this.sources.filter(s => s !== source);
    // setTimeout(() => {
    //   source.disconnect();
    // }, 5000);
    this.updateRouting();
  }

  // addEffect(effect, drywet) {
  //   this.effectsChain.push([effect, drywet]);
  //   this.updateRouting();
  // }

  // removeEffect(effect) {
  //   this.effectsChain = this.effectsChain.filter(e => e !== effect);
  //   this.updateRouting();
  // }

  updateRouting() {
    this.sources.forEach(source => {
      source.disconnect(); // Disconnect previous routing
  
      let lastNode = source.output; // Start with the source output
  
      // this.effectsChain.forEach(([effect, drywet]) => {
      //   let dryGain = new GainNode(this.context);
      //   let wetGain = new GainNode(this.context);
      //   // const effectNode = effect; // Assuming effect is already a node
      //   const effectNode = createReverb(this.context, 2);

      //   // Set gain values based on dry/wet mix
      //   dryGain.gain.value = 1 - drywet;
      //   wetGain.gain.value = drywet;
  
      //   // Connect the source to both dry and wet gain nodes
      //   lastNode.connect(dryGain);
      //   lastNode.connect(effectNode);
  
      //   // Connect effect node to wet gain
      //   effectNode.connect(wetGain);
        
      //   // Connect wet gain to master output
      //   wetGain.connect(this.masterGain);
  
      //   // Update lastNode to the dry gain for next effect
      //   lastNode = dryGain;
      // });
  
      // Connect the final dry gain to the master output
      
      lastNode.connect(this.masterGain);
    });
  }

  setMasterVolume(volume) {
    this.masterGain.gain.setValueAtTime(volume, this.context.currentTime);
  }
}

class SoundEffect {
  constructor (tones, fx){

  }
}
  
const audioContext = new (window.AudioContext || window.webkitAudioContext)();;
const soundManager = new SoundManager(audioContext);

const defaultadsr = {
  attack: 0.01,  // Attack time in seconds
  decay: 0.2,   // Decay time in seconds
  sustain: 1, // Sustain level (0 to 1)
  release: 0.5,  // Release time in seconds
};

const envelopes = {
  punch: { attack: 0.01, decay: 0.1, sustain: 1, release: 0.1, duration : 0.01},
  rustle: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.2, duration : 0.1},
  stab: { attack: 0.01, decay: 0.05, sustain: 0.1, release: 0.05, duration : 0.01},
  boom: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.5, duration : 0.3},
  brush: { attack: 0.2, decay: 0.4, sustain: 0.2, release: 0.5, duration : 0.1},
  crack: { attack: 0.01, decay: 0.05, sustain: 0.1, release: 0.02, duration : 0.01},
  ambience : { attack : 5, decay : 0, sustain: 1, release : 0, duration : Infinity}

}

const Sounds = {
  noise : ['noise', 440, envelopes.punch, 1],
  softsine : ['sine', 100, envelopes.crack, 0.3],
  lowsine : ['sine', 100, envelopes.crack, 1],
  doublesine : ['sine', 440, envelopes.punch, 1],
  bandnoise : ['bandpass-noise', 100, envelopes.punch, 0.1],
  bandnoise2 : ['bandpass-noise', 50, envelopes.punch, 0.1],
  lowtriangle : ['triangle', 50, envelopes.attack, 1],
  bandnoise3 : ['bandpass-noise', 50, envelopes.stab, 1],
  bandnoise4 : ['bandpass-noise', 50, envelopes.boom, 1],
  bandnoise5 : ['bandpass-noise', 50, envelopes.crack, 1],

  bandnoise6 : ['bandpass-noise', 100, envelopes.punch, 1],
  bandnoise7 : ['noise', 400, envelopes.brush, 1],

  heartbeat : ['sine', 100, envelopes.crack, 1],
  lowwhoosh : ['bandpass-noise', 50, envelopes.ambience, 1, [ createReverb(audioContext,3), createDelay(audioContext,3)]],
  lowwhoosh2 : ['sine', 50, envelopes.ambience, 1, [ createReverb(audioContext,3), createDelay(audioContext,3)]],
}

const Soundfx = {
  Footstep1 : [Sounds.lowsine, Sounds.doublesine, Sounds.noise],
  Footstep : [Sounds.bandnoise, Sounds.bandnoise2],
  Attack : [Sounds.bandnoise3],
  SwordDraw : [Sounds.heartbeat],
  Ambience : [Sounds.lowwhoosh, Sounds.lowwhoosh2],
}

function createReverb(context, duration = 2) {
  const reverbNode = context.createConvolver();

  // Create the impulse response
  const sampleRate = context.sampleRate;
  const length = sampleRate * duration;
  const impulse = context.createBuffer(2, length, sampleRate);
  const impulseL = impulse.getChannelData(0);
  const impulseR = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
  }

  reverbNode.buffer = impulse;
  reverbNode.normalize = true;

  return reverbNode;
}

function createDelay (context, length = 1) {
  const delay = context.createDelay();
  const feedback = context.createGain();
  delay.delayTime.value = length;
  feedback.gain.value = 0.5;
  delay.connect(feedback);
  feedback.connect(delay);
  return(feedback);
}

function generatefootstep () {
  //how big is the creature 
    //larger means lower frequency of the bandpass filter on the noise generator
    //larger also means louder and more resonant
  //what is the ground here?
    //dirt is a crunch
    //stone has a click
    //grass is a rustle
}

function areasound ([y,x]) {
 //what is the area like?
    //Big room means lots of resonance
    //Dirt means lowpass filter and reverb
    //Stone means no filter and echoes
}

function playsoundeffect (soundeffect){

  soundeffect.forEach(
    function ([type,freq,env,vol,fx]){
      Object.values(env).forEach(
        function (value) {
          // value *= 1+((Math.random()*0.02)-0.01);
        }
      )
      // freq *= 0.8+(Math.random()*0.2)
      const source = new SoundSource(audioContext, soundManager, type, freq, env, [createDelay(audioContext,1),createReverb(audioContext,2)], vol);
      const source2 = new SoundSource(audioContext, soundManager, type, freq, env, fx, vol);

      soundManager.addSource(source);
      soundManager.addSource(source2);
    });

}

playambience();

function playambience () {
  const freq1 = 80 + Math.random()*40;
  const freq2 = 80 + Math.random()*40;

  const ambientpangsine = ['sine', freq1, envelopes.crack, Math.random(), [createReverb(audioContext,1), createDelay(audioContext,3)]];
  const ambientpangnoise = ['bandpass-noise', freq2, envelopes.crack, Math.random(), [createReverb(audioContext,1), createDelay(audioContext,3)]]
  const ambientpang = [ambientpangnoise, ambientpangsine];
  playsoundeffect(ambientpang);
  setTimeout(() => {
    playambience();
  }, 1000 + Math.random()*1000);
}