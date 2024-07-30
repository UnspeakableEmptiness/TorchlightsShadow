// Create an AudioContext if it doesn't already exist
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

document.addEventListener('DOMContentLoaded', () => {
    const waveTypeSelect = document.getElementById('waveType');
    const frequencySlider = document.getElementById('frequency');
    const durationSlider = document.getElementById('duration');
    const volumeSlider = document.getElementById('volume');
    const numOvertonesSlider = document.getElementById('numOvertones');
    const reverbSlider = document.getElementById('reverb');
    const overtoneControls = document.getElementById('overtoneControls');
    const playButton = document.getElementById('playSound');
    const output = document.getElementById('output');

    // Update display values
    frequencySlider.addEventListener('input', () => {
        document.getElementById('frequencyValue').textContent = frequencySlider.value;
    });

    durationSlider.addEventListener('input', () => {
        document.getElementById('durationValue').textContent = durationSlider.value;
    });

    volumeSlider.addEventListener('input', () => {
        document.getElementById('volumeValue').textContent = volumeSlider.value;
    });

    reverbSlider.addEventListener('input', () => {
        document.getElementById('reverbValue').textContent = reverbSlider.value;
    });

    numOvertonesSlider.addEventListener('input', () => {
        document.getElementById('numOvertonesValue').textContent = numOvertonesSlider.value;
        updateOvertoneControls(numOvertonesSlider.value);
    });

    // Function to update overtone controls
    function updateOvertoneControls(numOvertones) {
        overtoneControls.innerHTML = '';
        for (let i = 0; i < numOvertones; i++) {
            const overtoneDiv = document.createElement('div');
            overtoneDiv.className = 'overtone';
            overtoneDiv.innerHTML = `
                <div class="control">
                    <label for="overtoneFrequency${i}">Overtone ${i + 1} Frequency Multiplier: <span id="overtoneFrequencyValue${i}">1</span></label>
                    <input type="range" id="overtoneFrequency${i}" min="0.5" max="5" step="0.1" value="1">
                </div>
                <div class="control">
                    <label for="overtoneVolume${i}">Overtone ${i + 1} Volume: <span id="overtoneVolumeValue${i}">0.1</span></label>
                    <input type="range" id="overtoneVolume${i}" min="0.01" max="1" step="0.01" value="0.1">
                </div>
            `;
            overtoneControls.appendChild(overtoneDiv);

            document.getElementById(`overtoneFrequency${i}`).addEventListener('input', () => {
                document.getElementById(`overtoneFrequencyValue${i}`).textContent = document.getElementById(`overtoneFrequency${i}`).value;
            });

            document.getElementById(`overtoneVolume${i}`).addEventListener('input', () => {
                document.getElementById(`overtoneVolumeValue${i}`).textContent = document.getElementById(`overtoneVolume${i}`).value;
            });
        }
    }
    const attackTime = 0.01;
    const decayTime = 0.1;
    const sustainLevel = 0.7 * Number(volumeSlider.value);
    const releaseTime = 0.2;

    // Function to play the sound based on current settings
    function playSound() {
        const baseFrequency = Number(frequencySlider.value);

        // ADSR envelope parameters


        // Calculate the minimum duration needed to accommodate ADSR envelope
        const minDuration = attackTime + decayTime + releaseTime;

        // Ensure duration is at least as long as the minimum duration
        const duration = Math.max(Number(durationSlider.value), minDuration);

        if (waveTypeSelect.value === 'noise') {
            playNoise(duration, Number(volumeSlider.value));
        } else {
            createOscillator(baseFrequency, Number(volumeSlider.value), duration);
            for (let i = 0; i < numOvertonesSlider.value; i++) {
                const overtoneFrequencyMultiplier = Number(document.getElementById(`overtoneFrequency${i}`).value);
                const overtoneVolume = Number(document.getElementById(`overtoneVolume${i}`).value);
                createOscillator(baseFrequency * overtoneFrequencyMultiplier, overtoneVolume, duration);
            }
        }
    }

    function createOscillator(frequency, volume, duration) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const reverbNode = createReverb();

        oscillator.type = waveTypeSelect.value;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);

        // ADSR envelope
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + attackTime); // Attack
        gainNode.gain.linearRampToValueAtTime(sustainLevel, audioContext.currentTime + attackTime + decayTime); // Decay
        gainNode.gain.setValueAtTime(sustainLevel, audioContext.currentTime + attackTime + decayTime + (duration - attackTime - decayTime - releaseTime)); // Sustain
        gainNode.gain.linearRampToValueAtTime(0.001, audioContext.currentTime + duration); // Release

        oscillator.connect(gainNode);
        gainNode.connect(reverbNode);
        reverbNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    }

    function playNoise(duration, volume) {
        const bufferSize = audioContext.sampleRate * duration;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioContext.createBufferSource();
        noise.buffer = buffer;

        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);

        const reverbNode = createReverb();

        noise.connect(gainNode);
        gainNode.connect(reverbNode);
        reverbNode.connect(audioContext.destination);

        // ADSR envelope
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + attackTime); // Attack
        gainNode.gain.linearRampToValueAtTime(sustainLevel, audioContext.currentTime + attackTime + decayTime); // Decay
        gainNode.gain.setValueAtTime(sustainLevel, audioContext.currentTime + attackTime + decayTime + (duration - attackTime - decayTime - releaseTime)); // Sustain
        gainNode.gain.linearRampToValueAtTime(0.001, audioContext.currentTime + duration); // Release

        noise.start();
        noise.stop(audioContext.currentTime + duration);
    }

    // Function to create a simple reverb effect
    function createReverb() {
        const reverbNode = audioContext.createConvolver();

        // Get the reverb amount from the slider
        const reverbAmount = Number(reverbSlider.value);

        // Create the impulse response
        const duration = 2 * reverbAmount; // Adjust the duration based on the reverb slider
        const sampleRate = audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = audioContext.createBuffer(2, length, sampleRate);
        const impulseL = impulse.getChannelData(0);
        const impulseR = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
        }

        reverbNode.buffer = impulse;
        return reverbNode;
    }
    
    // Function to output the current sound settings
    function outputSettings() {
        const settings = {
            waveType: waveTypeSelect.value,
            frequency: frequencySlider.value,
            duration: durationSlider.value,
            volume: volumeSlider.value,
            reverb: reverbSlider.value,
            overtones: []
        };
        for (let i = 0; i < numOvertonesSlider.value; i++) {
            settings.overtones.push({
                frequencyMultiplier: document.getElementById(`overtoneFrequency${i}`).value,
                volume: document.getElementById(`overtoneVolume${i}`).value
            });
        }
        output.textContent = JSON.stringify(settings, null, 2);
    }

    // Play sound on button click and display settings
    playButton.addEventListener('click', () => {
        playSound();
        outputSettings();
    });

    // Initialize the overtone controls
    updateOvertoneControls(numOvertonesSlider.value);
});
