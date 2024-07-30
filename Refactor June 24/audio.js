const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const referencefrequency = 2000; //frequency in hz used to calculate gain added to lower frequencies to equalize perceived volume


class Envelope {
    constructor (func, grainsize, duration){
        this.func = func;
        this.grainsize = grainsize; // grain size in seconds
        this.duration = duration; // duration in seconds
    }
}

class SoundManager {
    constructor (context, sourcenumber) {
        this.context = context;
        this.masterGainNode = context.createGain();
        this.masterGainNode.gain.value = 0.1;
        this.masterAmbientGainNode = context.createGain();
        this.masterAmbientGainNode.gain.value = 0.1;
        this.limiter = context.createDynamicsCompressor();
        this.masterGainNode.connect(this.limiter);
        this.masterAmbientGainNode.connect(this.limiter);
        this.limiter.connect(this.context.destination);
        this.sources = new Array(sourcenumber);
        this.ambientsources = new Array(sourcenumber);
        this.oldestsource = 0;
        this.nextsource = 0;
        this.oldestambientsource = 0;
        this.nextambientsource = 0;
        for(let index = 0; index < this.sources.length; index++){
            this.sources[index] = new SoundSource(this.context, this);
        }
        for(let index = 0; index < this.ambientsources.length; index++){
            this.ambientsources[index] = new SoundSource(this.context, this);
        }

        // initialize limiter
        this.limiter.threshold.value = -20; // Threshold in dB
        this.limiter.knee.value = 0;        // Hard knee
        this.limiter.ratio.value = 10;      // High ratio for limiting
        this.limiter.attack.value = 0.003;  // Fast attack
        this.limiter.release.value = 0.25;  // Release time
    }
    requestSource(){
        const returnsource = this.sources[this.oldestsource];
        if(returnsource.soundmaker){
            returnsource.output.disconnect();
            returnsource.soundmaker.stop();
        }
        // this.sources[this.oldestsource] = new SoundSource(this.context, this, 'sine', 50, new Envelope((i) => 1, 0.01,1),1,[]);
        // returnsource = this.sources[this.oldestsource];
        this.nextsource = returnsource;
        this.oldestsource ++;
        if(this.oldestsource >= this.sources.length){
            this.oldestsource = 0;
        }
        return(returnsource);
    }

    addEffect (effect) {
        if(!this.effectschain) this.effectschain = [];
        this.effectschain.push(effect);
        this.updateRouting();
    }

    updateRouting(){
        let lastnode = this.masterGainNode;
        this.effectschain.forEach(
            function (effectnode) {
                // effectnode.disconnect();
                lastnode.connect(effectnode);
                lastnode = effectnode;
            }
        );
        lastnode.connect(this.limiter);
    }

    requestAmbientSource(){
        const returnsource = this.ambientsources[this.oldestambientsource];
        if(returnsource.soundmaker){
            returnsource.output.disconnect();
            returnsource.soundmaker.stop();
        }
        this.nextambientsource = returnsource;
        this.oldestambientsource ++;
        if(this.oldestambientsource >= this.ambientsources.length){
            this.oldestambientsource = 0;
        }
        return(returnsource);
    }
    playSound () {
        this.soundmaker = this.nextsource;
        this.soundmaker.start();
        this.soundmaker.output.connect(this.masterGainNode);
    }
    playAmbientSound () {
        this.ambientsoundmaker = this.nextambientsource;
        this.ambientsoundmaker.start();
        this.ambientsoundmaker.output.connect(this.masterAmbientGainNode)
    }

}

class SoundSource {
    constructor (context, soundManager, type, freq, env, vol, fx, overtones, freqmod){
        this.context = context;
        this.soundManager = soundManager;
        this.type = type;
        this.freq = freq;
        this.env = env;
        this.vol = vol || 1;
        this.fx = [];
        this.fxnodes = [];
        if(fx) this.fx = fx.slice();
        this.overtones = [];
        if(overtones) this.overtones = overtones.slice();
        this.overtonenoisemakers = [];
        this.overtonesoundmakers = [];
        this.freqmod = [];
        if(freqmod) this.freqmod = freqmod.slice();

        this.gainNode = context.createGain();

        this.limiter = this.context.createDynamicsCompressor();

        this.masterGainNode = context.createGain();
        // this.gainNode.connect(this.masterGainNode);

        // this.masterGainNode.connect(this.limiter);
        
        this.output = this.masterGainNode;

        // this.output = this.masterGainNode;

        // Configure the limiter
        this.limiter.threshold.value = -10; // Threshold in dB
        this.limiter.knee.value = 0;        // Hard knee
        this.limiter.ratio.value = 10;      // High ratio for limiting
        this.limiter.attack.value = 0.003;  // Fast attack
        this.limiter.release.value = 0.25;  // Release time
    }
    start () {
        this.masterGainNode.gain.value = this.vol;
        const thisnode = this;
        this.output.disconnect();
        this.gainNode.disconnect();
        if(this.soundmaker)this.soundmaker.disconnect();
        let lastnode = this.gainNode;
        this.gainNode.gain.value = 0;
        this.gainNode.gain.setValueAtTime(0,this.context.currentTime);

        this.fxnodes.forEach(
            function (effectsnode) {
                effectsnode.disconnect();
            }
        );

        this.fxnodes = [];

        if(this.fx.length > 0){
            this.fx.forEach(
                function (effect, index) {
                    thisnode.fxnodes.push(effect());
                    lastnode.connect(thisnode.fxnodes[index]);
                    lastnode = thisnode.fxnodes[index];
                }
            )
        }

        lastnode.connect(this.masterGainNode);

        if (this.type === 'noise' || this.type === 'lowpass-noise' || this.type === 'lowpass-noise-white') {
            const highsamplerate = this.context.sampleRate*10
            const bufferSize = this.context.sampleRate * this.env.duration;
            const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
            const data = buffer.getChannelData(0);

            if(this.type === 'lowpass-noise-white'){
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1; // Generate white noise
                }            
            }
            else{
                let lastOut = 0.0;
                const windowSize = 50; // Size of the averaging window, larger values for deeper noise
                let windowSum = 0.0;
                const window = Array(windowSize).fill(0);

                for (let i = 0; i < bufferSize; i++) {
                    let white = Math.random() * 2 - 1; // Generate white noise

                    // Update the moving average window
                    windowSum -= window[i % windowSize];
                    window[i % windowSize] = white;
                    windowSum += white;

                    // Calculate the average and apply the brown noise formula
                    let averageWhite = windowSum / windowSize;
                    let weight = 0.02
                    data[i] = (lastOut + (weight * averageWhite)) / (1+weight);
                    lastOut = data[i];

                    // Scale to keep it within bounds (-1 to 1)
                    data[i] *= 3.5;
                }
            }

            this.noise = this.context.createBufferSource();
            this.noise.buffer = buffer;
            this.noise.loop = true;
            this.soundmaker = this.noise;
      
            if (this.type === 'lowpass-noise' || this.type === 'lowpass-noise-white') {
                const filter = this.context.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = this.freq;
        
                this.lowpassFilter = filter;
                this.soundmaker.connect(this.lowpassFilter);
                this.lowpassFilter.connect(this.gainNode);
                // this.masterGainNode.gain.setValueAtTime(5, this.context.currentTime);
                // this.masterGainNode.gain.value = calculateGain(this.lowpassFilter,this.context.sampleRate,this.env.duration);
                // this.masterGainNode.gain.value = (referencefrequency/this.freq)
            }           
            else{
                this.soundmaker.connect(this.gainNode);
            }


            // this.soundmaker.playbackRate.value = 1/10;
            // this.masterGainNode.gain.setValueAtTime(1,this.context.currentTime);
            

        }
        else{
            this.soundmaker = this.context.createOscillator(this.type,this.freq);
            this.soundmaker.type = this.type;
            this.soundmaker.frequency.value = this.freq;
            // this.masterGainNode.gain.value = (referencefrequency/this.freq)
            this.soundmaker.connect(this.gainNode);
        }

        // this.soundmaker.connect(this.gainNode);
        this.soundmaker.start();
        if(this.env){
            this.gainNode.gain.value = 0;
            modulateparam(this.env, this.gainNode.gain, this.context, 1);
            this.gainNode.gain.linearRampToValueAtTime(0,this.context.currentTime+this.env.duration);
            // const {grainsize, duration} = this.env;
            // for(let t = grainsize; t < duration; t+=grainsize){
            //     // this.gainNode.gain.setValueAtTime(this.env.func(t),this.context.currentTime + t);
            //     this.gainNode.gain.linearRampToValueAtTime(this.env.func(t),this.context.currentTime + t);
            // }
        }
        else{ console.log("error this sound played with no envelope")}
        if(this.freqmod){
            if(this.type !== 'lowpass-noise' && this.type !== 'noise' && this.type !== 'lowpass-noise-white'){
                modulateparam(this.freqmod, this.soundmaker.frequency, this.context, this.freq);
            }
            if(this.type == 'lowpass-noise' || this.type == 'lowpass-noise-white'){
                modulateparam(this.freqmod, this.lowpassFilter.frequency, this.context, this.freq);
            }
        }
        this.overtonenoisemakers.forEach(
            function(noisemaker){
                noisemaker.disconnect();
                noisemaker.stop();
            }
        )
        this.overtonesoundmakers.forEach(
            function(soundmaker){
                if(soundmaker instanceof OscillatorNode){
                    soundmaker.stop();
                }
                soundmaker.disconnect();
            }
        )
        this.overtonenoisemakers = [];
        this.overtonesoundmakers = [];
        if(this.overtones){
            for(let i = 0; i < this.overtones.length; i ++){
                if(this.type !== 'noise' && this.type !== 'lowpass-noise' && this.type !== 'lowpass-noise-white'){
                    this.overtonesoundmakers.push(this.context.createOscillator(this.type));
                    this.overtonesoundmakers[i].start();
                }
                else if(this.type == 'lowpass-noise' || this.type == 'lowpass-noise-white'){
                    this.overtonenoisemakers.push(this.context.createBufferSource());
                    this.overtonenoisemakers[i].buffer = this.noise.buffer;
                    this.overtonenoisemakers[i].loop = true;
                    this.overtonesoundmakers.push(this.context.createBiquadFilter());
                    this.overtonenoisemakers[i].connect(this.overtonesoundmakers[i]);
                    this.overtonenoisemakers[i].start();
                }
                this.overtonesoundmakers[i].frequency.setValueAtTime(this.freq*this.overtones[i],this.context.currentTime);
                this.overtonesoundmakers[i].connect(this.gainNode);
                if(this.freqmod){
                    this.overtonesoundmakers[i].frequency.value = this.freq*this.overtones[i];
                    modulateparam(this.freqmod,this.overtonesoundmakers[i].frequency, this.context, this.freq*this.overtones[i]);
                }
            }
        }
        // this.output.connect(this.soundManager.masterGainNode);
    }
}

function modulateparam (env, parameter, context, constant, random = true){
    const {grainsize, duration, func} = env;
    parameter.cancelScheduledValues(context.currentTime);
    for(let t = 0; t < duration; t+=grainsize*((Math.random()*0.5)+(0.5))){
        parameter.linearRampToValueAtTime(func(t)*constant,context.currentTime + t);
    }
}

const soundManager = new SoundManager (audioContext, 20);
// soundManager.addEffect(createDelay(audioContext,0.5,0.5)());
// soundManager.effectschain = [createDelay(audioContext,0.5,0.75)(),createLowpassFilter(audioContext,500)(),createReverb(audioContext,0.5)()]
let verb = createReverb(audioContext,1)();
let lowpass = createLowpassFilter(audioContext,100000)()
let delaychain = createDelayChain(audioContext, 0.25, 0.9,[lowpass,verb])()
soundManager.effectschain = [delaychain]
soundManager.updateRouting();

const envelopes = {
    random1sec : new Envelope((i) => Math.random(), 0.01, 1),
    crack : new Envelope((i) => 1, 0.01, 0.2),
    stab : new Envelope((i) => 1, 0.01, 0.1),
    boom : new Envelope((i) => 1, 0.1, 0.5),
    oldcrack : new Envelope( adsrconvert([0.01,0.05,1,0.02],0.01), 0.01, 0.3),
    rainfall : new Envelope((i) => Math.random(), 0.1, 20),
    fire : new Envelope((i) => adsrconvert([3,0.05,1,0.02],90)(i)*((Math.random()/2)+0.5), 0.03, 6),

    randomboom : new Envelope((i) => 1*Math.random(), 0.1, 1),
    randomstab : new Envelope((t) => Math.random()*Math.min(1,t*10), 0.1, 0.2),

    linearfall : new Envelope ((t) => Math.max(1-(t),0.1), 0.2,1),
    linearfallhalf : new Envelope ((i) => Math.max(1-(4*i),0), 0.01,0.5),
    negabsval : new Envelope (linearspike(1), 0.1, 1),
}

let sounds = {
    caveambience : [100, 'lowpass-noise', envelopes.fire,[createReverb(audioContext,5)], new Envelope((i) => (Math.random()*0.5)+0.5, 0.1, 1), [2,4,8], 0.25],
    deepspookybong : [100, 'sine', new Envelope((t) => (linearspike(1)(t)*Math.random()), 0.01, 1), [createReverb(audioContext,10)], new Envelope ((t) => Math.random()*0.1 +0.95,0.1,1), [2.1], 0.1],
    highshrillbing : [1000, 'sine', new Envelope(linearspike(1), 0.01, 1), [createReverb(audioContext,10)], new Envelope ((t) => Math.random()*0.1 +0.95,0.1,1), [2.1], 0.1],

    footstep2 : [100, 'sine', envelopes.oldcrack,[createReverb(audioContext,0.5)], null,[1/2]],
    footstep : [500, 'lowpass-noise-white', new Envelope((t) => Math.max(linearspike(0.1)(t)**(0.3)*Math.random()**2, linearspike(0.1)(Math.max(t-0.15,0))**(0.3)*Math.random()**2), 0.015, 0.3) ,[], null, [], 0.25],
    footstepverb : [500, 'lowpass-noise-white', new Envelope((t) => Math.max(linearspike(0.1)(t)**(0.3)*Math.random()**2, linearspike(0.1)(Math.max(t-0.15,0))**(0.3)*Math.random()**2), 0.015, 0.3) ,[createReverb(audioContext,0.5)], null, [], 0.25],
    weirdtone : [440, 'sine', envelopes.random1sec,[],envelopes.randomboom, [2,4]],
    weirdnoise : [500, 'lowpass-noise', envelopes.random1sec,[]],

    footsteptap : [100, 'lowpass-noise-white', new Envelope((t) => Math.max(linearspike(0.1)(t)**(15), linearspike(0.1)(Math.max(t-0.15,0))**(15)*Math.random()/2), 0.005, 0.3) ,[], null, [1.1,1.2,1.3,2], 0.25],
    footsteptapverb : [200, 'lowpass-noise-white', new Envelope((t) => Math.max(linearspike(0.1)(t)**(15), linearspike(0.1)(Math.max(t-0.15,0))**(15)*Math.random()/2), 0.005, 0.3) ,[createReverb(audioContext,0.5)], null, [1.1,1.2,1.3,2], 0.25],


    frogribbit : [1000, 'sine', new Envelope((t) => Math.max(linearspike(0.1)(t)**(25), linearspike(0.1)(Math.max(t-0.15,0))**(25)), 0.01, 0.3) ,[], null, [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2], 1],


    softsine : [400, 'sine', envelopes.negabsval, []],

    arrowwhoosh : [400, 'lowpass-noise-white', new Envelope (linearspike(0.8), 0.01, 0.3), [], new Envelope ((t) => Math.max(1-(t*4),0.5), 0.2, 0.5), [2]],
    arrowwhistle : [200, 'sine', new Envelope ((t) => linearspike(0.8)(t)*Math.random(), 0.1, 0.3), [createReverb(audioContext,0.2), createLowpassFilter(audioContext,200)], new Envelope ((t) => Math.max(1-(t*4),0.8), 0.2, 0.5), [0.9,0.95,1.05,1.1]],
    
    arrowthudnoise : [150, 'lowpass-noise', new Envelope((t) => t**(0.01)*Math.max(1-(t*10),0),0.01,0.2), [createPause(audioContext, 0.2)], null, [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2], 0.1],
    arrowthudtone : [150, 'sine', new Envelope((t) => Math.max(1-(t*10),0),0.01,0.2), [createReverb(audioContext,0.2), createPause(audioContext, 0.2)], new Envelope((t) => Math.random()*2, 0.005, 0.2), [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2], 0.1],
    
    clubwhoosh : [400, 'lowpass-noise-white', new Envelope (linearspike(0.8), 0.01, 0.3), [], new Envelope ((t) => Math.max(1-(t*4),0.5), 0.2, 0.5), [2]],
    clubwhoom : [200, 'sine', new Envelope ((t) => linearspike(0.8)(t)*Math.random(), 0.1, 0.3), [createReverb(audioContext,0.2), createLowpassFilter(audioContext,200)], new Envelope ((t) => Math.max(1-(t*4),0.8), 0.2, 0.5), [0.9,0.95,1.05,1.1]],
    
    clubhitnoise : [100, 'lowpass-noise', new Envelope((t) => t**(0.01)*Math.max(1-(t*5),0),0.01,0.4), [createPause(audioContext,0.2)], null, [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2], 0.5],
    clubhittone : [50, 'sine', new Envelope((t) => Math.max(1-(t*5),0),0.01,0.4), [createReverb(audioContext,0.2),createPause(audioContext,0.2)], new Envelope((t) => Math.random()*2, 0.005, 0.1), [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2], 0.5],
    clubhitcrack :[100, 'lowpass-noise', new Envelope((t) => t**(0.01)*Math.max(1-(t*2.5),0)*(Math.random()**10),0.005,0.2), [createPause(audioContext,0.2)], new Envelope ((t) => 1+(t*(100)*Math.random()), 0.01, 0.2), [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2,4,8,16,32,64,128], 0.1],

    swordswingbig : [200, 'lowpass-noise-white', new Envelope (linearspike(0.4), 0.1, 0.4), [], new Envelope ((t) => Math.max(1-(t*6),0.5)), []],
    swordswingsmall : [400, 'lowpass-noise-white', new Envelope (linearspike(0.2), 0.1, 0.2), [], new Envelope ((t) => Math.max(1-(t*12),0.25)), []],
    swordswingxs : [600, 'lowpass-noise-white', new Envelope (linearspike(0.15), 0.1, 0.15), [], new Envelope ((t) => Math.max(1-(t*18),0.2)), []],

    swordswingsmallverb : [400, 'lowpass-noise-white', new Envelope (linearspike(0.2), 0.1, 0.2), [createReverb(audioContext,0.5)], new Envelope ((t) => Math.max(1-(t*12),0.25)), []],


    deepthudnoise : [25, 'lowpass-noise', new Envelope((t) => t**(0.01)*Math.max(1-(t*5),0),0.01,0.4), [], null, [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2], 1],
    deepthudtone : [25, 'sine', new Envelope((t) => Math.max(1-(t*5),0),0.01,0.4), [createReverb(audioContext,0.4)], new Envelope((t) => Math.random()*2, 0.005, 0.1), [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2], 1],

    medthudnoise : [50, 'lowpass-noise', new Envelope((t) => t**(0.01)*Math.max(1-(t*10),0),0.01,0.2), [], null, [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2], 0.1],
    medthudtone : [50, 'sine', new Envelope((t) => Math.max(1-(t*10),0),0.01,0.2), [createReverb(audioContext,0.2)], new Envelope((t) => Math.random()*2, 0.005, 0.1), [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2], 0.1],

    drumtemplate : [50, 'sine', new Envelope((t) => Math.max(1-(t*10),0),0.01,0.1), [createReverb(audioContext,1)], new Envelope((t) => Math.random()*2, 0.005, 0.1), [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2], 1],
    stringplucktemplate : [600, 'sine', new Envelope((t) => Math.max(1-(t*3),0),0.01,0.5), [createReverb(audioContext,0.2)], new Envelope((t) => Math.max((1-(t*4)),0.25), 0.005, 0.5), [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2], 0.5],

    stringsine : [440, 'sine', new Envelope(linearspike(1), 0.01, 1), [createReverb(audioContext, 0.2)], new Envelope((t) => 0.95 + (Math.random()*0.025), 0.1, 1), [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2]],

    highthudnoise : [150, 'lowpass-noise', new Envelope((t) => t**(0.01)*Math.max(1-(t*10),0),0.01,0.2), [], null, [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2], 0.1],
    highthudtone : [150, 'sine', new Envelope((t) => Math.max(1-(t*10),0),0.01,0.2), [createReverb(audioContext,0.2)], new Envelope((t) => Math.random()*2, 0.005, 0.2), [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2], 0.1],

    bassdrum : [100, 'sine', new Envelope((t) => linearspike(0.08)(t)*Math.random(),0.01,0.1), [createReverb(audioContext,2)], null,[1.1,1.2,1/2], 2],
    snaredrum : [200, 'lowpass-noise-white', new Envelope((t) => linearspike(0.04)(t)*Math.random(),0.01,0.1), [], null,[1.1,1.2,1/2], 2],



    whee : [2000, 'lowpass-noise', new Envelope(linearspike(0.5), 0.01, 0.5), [], new Envelope(linearspike(0.5), 0.01, 0.5), []],

    goblinchat : [400, 'sine', new Envelope((t) => (linearspike(1)(t)**(0.01))*Math.random()**2, 0.05, 1), [], new Envelope((t) => (Math.random()**2)*2, 0.0005,1), [1.1,1.2,0.9,0.8,0.4,0.3,2.2,3.3],0.01],
    goblinchatverb : [400, 'sine', new Envelope((t) => (linearspike(1)(t)**(0.01))*Math.random()**2, 0.05, 1), [createReverb(audioContext,0.1)], new Envelope((t) => (Math.random()**2)*2, 0.0005,1), [1.1,1.2,0.9,0.8,0.4,0.3,2.2,3.3], 0.01],
    goblinchat2 : [400, 'sine', new Envelope((t) => (linearspike(1)(t)**(0.01))*Math.random()**2, 0.05, 1), [], new Envelope((t) => (Math.random()**2)*2, 0.002,1), [1.1,1.2,0.9,0.8,0.4,0.3,2.2,3.3],0.02],


    goblinchat2old : [400, 'sine', new Envelope((t) => (linearspike(1.5)(t)**(0.01))*Math.random()**2, 0.05, 1.5), [createReverb(audioContext,0.1)], new Envelope((t) => (Math.random()**2)*2, 0.002,1.6), [1.1,1.2,0.9,0.8,0.4,0.3,2.2,3.3]],
    goblinchat3old : [600, 'sine', new Envelope((t) => (linearspike(1.5)(t)**(0.01))*Math.random()**2, 0.05, 1.5), [createReverb(audioContext,0.1)], new Envelope((t) => (Math.random()**2)*2, 0.003,1.6), [1.1,1.2,0.9,0.8,0.4,0.3,2.2,3.3]],

    something : [2, 'noise', new Envelope((t) => (linearspike(1.5)(t)**(0.01))*Math.random(), 0.00005, 1.5), [createReverb(audioContext,0.1)], new Envelope ((t) => Math.random()*5, 0.01,1.5)],

    goblinchatnoise : [800, 'lowpass-noise-white', new Envelope((t) => (linearspike(1.5)(t)**(0.01))*Math.random()**4, 0.05, 1.5), [], new Envelope((t) => (Math.random()**2)*2, 0.0025,1.6), [1.1,1.2,0.9,0.8,0.4,0.3,2.2,3.3]],

    goblinscream : [400, 'sine', new Envelope((t) => (linearspike(1.5)(t)**(0.01)), 0.05, 1.5), [], new Envelope((t) => (Math.random()**2)*2, 0.0025,1.5), [1.5,1.6,0.5,0.6,0.4,0.3],0.05],

    goblinyelpold : [800, 'sine', new Envelope((t) => (linearspike(0.25)(t)**(0.01)), 0.005, 0.25), [], new Envelope((t) => (Math.random()**2)*2, 0.0005,0.5), [1.5,1.6,0.5,0.6,0.4,0.3],0.01],

    goblindeath : [800, 'sine', new Envelope((t) => (t**0.2)*(1-t)*(Math.random()**0.5), 0.01, 1), [createDistortion(audioContext,1)], new Envelope((t) => (t**0.2)*(Math.random()**0.5)*2*(1-(t/4))*Math.random()*2, 0.005,5), [1.5,1.6,0.5,0.6,0.4,0.3],0.05],

    goblinyelp : [800, 'sine', new Envelope((t) => (linearspike(0.25)(t)**(0.01)), 0.005, 0.25), [], new Envelope((t) => (Math.random()**2)*2, 0.005,0.5), [1.5,1.6,0.5,0.6,0.4,0.3],0.01],

    rustle : [500, 'lowpass-noise-white', envelopes.randomstab,[]],
    rustleverb : [500, 'lowpass-noise-white', envelopes.randomstab,[createReverb(audioContext,0.5)]],

    eeesound : [125, 'sawtooth',  new Envelope((t) => (linearspike(0.25)(t)**0.25)*(0.5 + Math.random()/2),0.005,3), [createReverb(audioContext, 0.25), createBandpassFilter(audioContext,300)], null, [1/2,2,3,4,5,6,7,8,9,10,12]],
    eeesound2 : [125, 'sawtooth',  new Envelope((t) => (linearspike(0.25)(t)**0.25)*(0.5 + Math.random()/2),0.005,3), [createReverb(audioContext, 0.25), createBandpassFilter(audioContext,2200)], null, [1/2,2,3,4,5,6,7,8,9,10,12]],
    eeesound3 : [125, 'sawtooth', new Envelope((t) => (linearspike(0.25)(t)**0.25)*(0.5 + Math.random()/2),0.005,3), [createReverb(audioContext, 0.25), createBandpassFilter(audioContext,3000)], null, [1/2,2,3,4,5,6,7,8,9,10,12]],

    aaasound : [125, 'sawtooth', new Envelope((t) => (linearspike(0.25)(t)**0.25)*(0.5 + Math.random()/2),0.005,3), [createReverb(audioContext, 0.25), createBandpassFilter(audioContext,1000)], null, [1/2,2,3,4,5,6,7,8,9,10,12]],
    aaasound2 : [125, 'sawtooth', new Envelope((t) => (linearspike(0.25)(t)**0.25)*(0.5 + Math.random()/2),0.005,3), [createReverb(audioContext, 0.25), createBandpassFilter(audioContext,1300)], null, [1/2,2,3,4,5,6,7,8,9,10,12]],
    aaasound3 : [125, 'sawtooth', new Envelope((t) => (linearspike(0.25)(t)**0.25)*(0.5 + Math.random()/2),0.005,3), [createReverb(audioContext, 0.25), createBandpassFilter(audioContext,2400)], null, [1/2,2,3,4,5,6,7,8,9,10,12]],

    sine : [75, 'sine' , new Envelope((t) => linearspike(0.08)(t)*Math.random(),0.01,0.1), [ createDistortion(audioContext, 25)]],

    bowstring : [100, 'lowpass-noise-white', new Envelope((t) => linearspike(1)(t)*(Math.random()**10), 0.0005, 1), [], new Envelope((t) => Math.min(Math.max((t*10)**2, 0), 25), 0.1,1), [],0.1],
    
    treecreakinginthewind : [100, 'lowpass-noise-white', new Envelope((t) => (linearspike(5)(t)**4)*Math.random()**0.5, 0.00015, 5)],

    tap : [100, 'lowpass-noise-white', new Envelope((t) => (linearspike(0.5)(t)**4)*Math.random()**0.5, 0.0002, 0.5)],

    sworddraw : [25 , 'lowpass-noise-white', new Envelope((t)=> linearspike(0.5)(t)*Math.random()**0.2,0.01,1), [], new Envelope((t) => Math.min(200*(t+1), 75), 0.01,1), [1/2,1/4], 0.05],
    swordring : [800, 'sine', new Envelope((t)=>linearspike(1)(t)*Math.random(), 0.03, 1), [createReverb(audioContext,0.5)], new Envelope((t) => Math.min(t*10, 1), 0.01, 1), [] , 0.01],
    swordring2 : [800/3, 'sine', new Envelope((t)=>linearspike(1)(t)*Math.random(), 0.03, 1), [createReverb(audioContext,0.75)], new Envelope((t) => Math.min(t*10, 1), 0.01, 1), [], 0.1],
    swordring3 : [200, 'sine', new Envelope((t)=>linearspike(1)(t)*Math.random(), 0.03, 1), [createReverb(audioContext,0.5)], new Envelope((t) => Math.min(t*10, 1), 0.01, 1), [], 0.025],

    shortsworddraw : [25 , 'lowpass-noise-white', new Envelope((t)=> linearspike(0.35)(t)*Math.random()**0.2,0.01,0.5), [], new Envelope((t) => Math.min(300*(t+1), 100), 0.01,0.5), [], 0.05],

    daggerdraw : [25 , 'lowpass-noise-white', new Envelope((t)=> linearspike(0.25)(t)*Math.random()**0.4,0.01,0.5), [], new Envelope((t) => Math.min(400*(t+1), 100), 0.01,0.5), [], 0.05],

    puncture : [2500 , 'lowpass-noise-white', new Envelope((t)=> linearspike(0.25)(t)*Math.random()**0.3,0.01,0.5), [], new Envelope((t) => 1-(t*2), 0.01, 0.5), [], 0.1],
    spurt1 : [50, 'lowpass-noise-white', new Envelope((t) => (linearspike(0.2)(t)**2)*(Math.random()**2), 0.001, 1), [createPause(audioContext, 0.1)], new Envelope((t) => Math.max(((t+1)*2)*(Math.random()**2)*4, 1), 0.01, 0.5), [1.1,1.2,1.3,2,4,8], 0.1],
    spurt2 : [50, 'lowpass-noise-white', new Envelope((t) => (linearspike(0.2)(t)**2)*(Math.random()**2), 0.001, 1), [createPause(audioContext, 0.1)], new Envelope((t) => Math.max(((t+1)*2)*(Math.random()**2)*4, 1), 0.01, 0.5), [6,12], 0.1],
    spurt1verb : [50, 'lowpass-noise-white', new Envelope((t) => (linearspike(0.2)(t)**4)*(Math.random()**2), 0.001, 1), [createReverb(audioContext,0.2), createPause(audioContext, 0.1)], new Envelope((t) => Math.max(((t+1)*2)*(Math.random()**2)*4, 1), 0.01, 0.5), [1.1,1.2,1.3,2,4,8], 0.5],
    spurt2verb : [50, 'lowpass-noise-white', new Envelope((t) => (linearspike(0.2)(t)**4)*(Math.random()**2), 0.001, 1), [createReverb(audioContext,0.2), createPause(audioContext, 0.1)], new Envelope((t) => Math.max(((t+1)*2)*(Math.random()**2)*4, 1), 0.01, 0.5), [6,12], 0.5],

}

function linearspike (d) {
    return (
        function (t) {
            if(t == 0) return 0;
            if(t > d) return 0;
            if(t <= d/2){
                return(t/(d/2));
            }
            else{
                return(1-((t-d/2)/(d/2)));
            }
        }
    )
}

const soundeffects = {
    footstep : [sounds.footstep, sounds.footsteptap],
    footsteptap : [sounds.footsteptap, sounds.footsteptapverb],
    
    arrowflight : [sounds.arrowthudnoise, sounds.arrowthudtone, sounds.swordswingsmall, sounds.swordswingsmallverb],
    swordswing : [ sounds.swordswingsmall, sounds.swordswingsmallverb],
    swordhit : [sounds.swordswingsmall, sounds.swordswingsmallverb,sounds.medthudtone, sounds.medthudnoise],

    clubswing : [sounds.clubwhoom, sounds.clubwhoosh],
    clubhit : [sounds.clubhitcrack, sounds.clubhittone, sounds.clubhitcrack, sounds.clubwhoom, sounds.clubwhoosh],
    // clubhit : [sounds.clubhitcrack],

    caveambience : [sounds.caveambience],
    deepspookybong : [sounds.deepspookybong],
    highshrillbing : [sounds.highshrillbing],

    highthud : [sounds.highthudtone, sounds.highthudnoise],
    medthud : [sounds.medthudtone, sounds.medthudnoise],
    deepthud : [sounds.deepthudtone, sounds.deepthudnoise],

    goblinchat : [sounds.goblinchat, sounds.goblinchatverb, sounds.goblinchat2],

    goblinyelp : [sounds.goblinyelp],
    
    goblindeath : [sounds.goblindeath],

    goblinscream : [sounds.goblinscream],

    aaasound : [sounds.aaasound, sounds.aaasound2, sounds.aaasound3],

    eeesound : [sounds.eeesound, sounds.eeesound2, sounds.eeesound3],  
    
    sworddraw : [sounds.sworddraw, sounds.swordring, sounds.swordring2, sounds.swordring3],

    bowdraw : [sounds.bowstring],

    shortsworddraw : [sounds.shortsworddraw],

    daggerdraw : [sounds.daggerdraw],

    tap : [sounds.tap],

    puncture : [sounds.puncture, sounds.spurt1, sounds.spurt2, sounds.spurt1verb, sounds.spurt2verb],
}

function playsoundeffect (soundfx) {
    soundfx.forEach(
        function([freq,type,env,fx,freqmod,overtones, vol]){
            const source = soundManager.requestSource();
            source.freqmod = null;
            source.overtones = [];
            if(freqmod) source.freqmod = freqmod;
            if(overtones) source.overtones = overtones.slice();

            source.vol = 1;
            if(vol !== undefined) source.vol = vol;

            source.freq = null;
            source.freq = freq;

            source.type = null;
            source.type = type;

            source.env = null;
            source.env = env;

            source.fx = [];
            if(fx) source.fx = fx.slice();

            soundManager.playSound();
        }
    );
}

function playambientsound (soundfx) {
    soundfx.forEach(
        function([freq,type,env,fx,freqmod,overtones,vol]){
            const source = soundManager.requestAmbientSource();
            source.freqmod = null;
            source.overtones = [];
            if(freqmod) source.freqmod = freqmod;
            if(overtones) source.overtones = overtones.slice();
            source.vol = 0.2;
            if(vol) source.vol = vol/5;

            source.freq = null;
            source.freq = freq;

            source.type = null;
            source.type = type;

            source.env = null;
            source.env = env;

            source.fx = [];
            if(fx) source.fx = fx.slice();

            soundManager.playAmbientSound();
        }
    );
}

function adsrconvert([a, d, s, r], duration) {
    const sustainduration = duration - (a + d + r);
    return function (t) {
        if (t < 0) return 0; // Handle negative time
        if (t >= 0 && t <= a) return t / a; // Attack phase
        if (t > a && t <= a + d) return 1 - ((t - a) / d) * (1 - s); // Decay phase
        if (t > a + d && t <= a + d + sustainduration) return s; // Sustain phase
        if (t > a + d + sustainduration && t <= a + d + sustainduration + r) return s * (1 - (t - (a + d + sustainduration)) / r); // Release phase
        return 0; // After release
    }
}

function calculateGain(filter, sampleRate, noiseDuration) {
    const frequencyBins = 1024;
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / frequencyBins;
    const frequencies = new Float32Array(frequencyBins);
    const magnitudes = new Float32Array(frequencyBins);
    const phases = new Float32Array(frequencyBins);

    for (let i = 0; i < frequencyBins; i++) {
        frequencies[i] = i * binWidth;
    }

    filter.getFrequencyResponse(frequencies, magnitudes, phases);

    let originalEnergy = 0;
    let filteredEnergy = 0;

    for (let i = 0; i < frequencyBins; i++) {
        originalEnergy += 1; // White noise has constant energy per frequency bin
        filteredEnergy += magnitudes[i];
    }

    // Total energy is the sum over all bins
    const totalOriginalEnergy = originalEnergy * binWidth * noiseDuration;
    const totalFilteredEnergy = filteredEnergy * binWidth * noiseDuration;

    // Gain to match energies
    const gain = Math.sqrt(totalOriginalEnergy / totalFilteredEnergy);
    return gain;
}

function createReverb(context, duration = 2) {
    return function () {
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
}

function createDistortion (context, amount) {
    return function () {
        const distortnode = context.createWaveShaper();
        distortnode.curve = makeSoftClippingCurve(amount);
        return(distortnode);
    }
}

function makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; ++i) {
        const x = (i * 2) / samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

function makeSoftClippingCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; ++i) {
        const x = (i * 2) / samples - 1;
        curve[i] = x / (1 + k * Math.abs(x));
    }
    return curve;
}

function makeExponentialDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const samples = 44100;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; ++i) {
        const x = (i * 2) / samples - 1;
        curve[i] = (1 - Math.exp(-k * Math.abs(x))) * (x < 0 ? -1 : 1);
    }
    return curve;
}

function createDelay (context, time = 1, feedback = 0.5){
    return function () {
        const delayNode = context.createDelay();
        const feedbackNode = context.createGain();
        feedbackNode.gain.value = feedback;
        delayNode.connect(feedbackNode);
        feedbackNode.connect(delayNode);
        delayNode.delayTime.value = time;
        return(feedbackNode);
    }
}

function createPause (context, time = 1, feedback = 0){
    return function () {
        const delayNode = context.createDelay();
        const feedbackNode = context.createGain();
        feedbackNode.gain.value = feedback;
        delayNode.connect(feedbackNode);
        feedbackNode.connect(delayNode);
        delayNode.delayTime.value = time;
        return(delayNode);
    }
}

function createDelayChain (context, time = 1, feedback = 0.5, fx){
    return function () {
        const delayNode = context.createDelay();
        const feedbackNode = context.createGain();
        feedbackNode.gain.value = feedback;
        delayNode.connect(feedbackNode);
        let lastNode = feedbackNode;
        fx.forEach(
            function (effectnode) {
                lastNode.connect(effectnode);
                lastNode = effectnode;
            }
        )
        lastNode.connect(delayNode);
        delayNode.delayTime.value = time;
        return(feedbackNode);
    }
}

function createLowpassFilter (context, freq) {
    return function () {
        const filter = context.createBiquadFilter();
        filter.frequency.setValueAtTime(freq,context.currentTime);
        filter.type = 'lowpass';
        return(filter);
    }
}

function createBandpassFilter (context, freq) {
    return function () {
        const filter = context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = freq;
        filter.Q.value = 1;
        return(filter);
    }
}

// function createParrallelFilters (context, freqs){
//     return function () {
//         let lastnode;
//         freqs.forEach(
//             function (filterfreq) {
//                 const filter = context.createBiquadFilter();
//                 filter.type = 'bandpass';
//                 filter.frequency = filterfreq;
                
//             }
//         )
//     }
// }

class ambientSound {
    constructor (sound, mincadence, maxcadence) {
        this.sound = sound;
        this.mincadence = mincadence;
        this.maxcadence = maxcadence;
        this.lastplayed = 0;
        this.thiscadence = mincadence + Math.random()*(maxcadence-mincadence);
        this.randomize = true;
    }
}

let ambientsounds = [new ambientSound(soundeffects.caveambience,5000,7000), new ambientSound(soundeffects.deepspookybong, 5000, 15000), new ambientSound([sounds.bassdrum],1500,1500)];
ambientsounds[2].randomize = false;


function updateambientsound () {
    ambientsounds.forEach(
        function (ambientsound) {
            if(performance.now()-ambientsound.lastplayed > ambientsound.thiscadence){
                if(ambientsound.randomize == true)ambientsound.sound[0][0] = Math.random()*1000;
                playambientsound(ambientsound.sound);
                ambientsound.lastplayed = performance.now();
                ambientsound.thiscadence = ambientsound.mincadence + Math.random()*(ambientsound.maxcadence-ambientsound.mincadence);
            }
        }
    )
}