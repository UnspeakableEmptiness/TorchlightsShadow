const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let oscillator;
let noise;
let gainNode = audioContext.createGain();
let lowpass = audioContext.createBiquadFilter();
let highpass = audioContext.createBiquadFilter();

lowpass.type = "lowpass";
highpass.type = "highpass";

document.getElementById('play').addEventListener('click', () => {
    
    const waveform = document.getElementById('waveform').value;
    const frequency = document.getElementById('frequency').value;
    const attack = document.getElementById('attack').value;
    const decay = document.getElementById('decay').value;
    const sustain = document.getElementById('sustain').value;
    const release = document.getElementById('release').value;
    const lowpassFreq = document.getElementById('lowpass').value;
    const highpassFreq = document.getElementById('highpass').value;

    lowpass.frequency.setValueAtTime(lowpassFreq, audioContext.currentTime);
    highpass.frequency.setValueAtTime(highpassFreq, audioContext.currentTime);

    if (waveform === 'noise') {
        noise = audioContext.createBufferSource();
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;
        noise.loop = true;
        noise.connect(gainNode);
        noise.start();
    } else {
        oscillator = audioContext.createOscillator();
        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.connect(gainNode);
        oscillator.start();
    }

    gainNode.gain.cancelScheduledValues(audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + parseFloat(attack));
    gainNode.gain.linearRampToValueAtTime(sustain, audioContext.currentTime + parseFloat(attack) + parseFloat(decay));

    gainNode.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(audioContext.destination);
});

document.getElementById('stop').addEventListener('click', () => {
    const release = document.getElementById('release').value;
    gainNode.gain.cancelScheduledValues(audioContext.currentTime);
    gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + parseFloat(release));

    if (oscillator) {
        oscillator.stop(audioContext.currentTime + parseFloat(release));
    }

    if (noise) {
        noise.stop(audioContext.currentTime + parseFloat(release));
    }
});

document.getElementById('frequency').addEventListener('input', (event) => {
    document.getElementById('freqValue').innerText = `${event.target.value} Hz`;
});
