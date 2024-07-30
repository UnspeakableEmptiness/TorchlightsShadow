gameText = document.getElementById("game-text");

document.addEventListener('keydown', 
    function(event) {
        if(event.key == 'Space' || event.key == ' '){
            playsoundeffect(soundeffects.puncture);
        }
        if(event.key == 'c'){
            playambientsound(soundeffects.caveambience);
        }
        if(event.key == 'a'){
            playsoundeffect(soundeffects.arrowflight);
        }
        if(event.key == 's'){
            playsoundeffect(soundeffects.swordswing);
        }
        if(event.key == 't'){
            playsoundeffect(soundeffects.clubhit);
        }
        if(event.key == 'g'){
            playsoundeffect(soundeffects.goblinyelp);
        }
        if(event.key == 'v'){
            playsoundeffect(soundeffects.aaasound);
        }
        if(event.key == 'e'){
            playsoundeffect(soundeffects.eeesound)
        }
        if(event.key == 'b'){
            playsoundeffect(soundeffects.bowdraw)
        }
    }   
)

// generateambience();

function generateambience () {
    updateambientsound();
    setTimeout(() => {
        generateambience();
    }, 1000);
}