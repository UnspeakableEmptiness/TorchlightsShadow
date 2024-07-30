gameText = document.getElementById("game-text");
document.getElementById('mobileKeyboardInput').focus();


//#region Event Listeners
document.addEventListener('keydown', function(event) {
    const char = activecharacternonindex;
    if (event.code === 'Space' || event.key === ' ') {
      if(controllock == false){
          playerendturn();
      }
    }
    if(event.key == 'o'){
        if(uilock) uilock = false;
        if(controllock == false && uilock == false){
            if(char.tc[1] >= 1){
                char.actionqueue = [];
                char.actionqueue.push(new action("Overwatch", startoverwatch,[0,1,0], 0, char.pos, char, char.pos));
                move(char);
            }
        }
    }
    if (event.key === 'd') {
        if(controllock == false){
            if(char.tc[1] >= 1){
                char.actionqueue.push(new action("Dash",dashfunc,[0,1,0],0,char.pos,char,char.pos));
                playertick(char);
            }
        }
    }
    if (event.key === 's'){
        if(controllock == false){
            if(char.tc[0] >= char.tcmax[0]){
                char.actionqueue.push(new action("Stand Ground", standgroundfunc, [char.tcmax[0],0,0], 0, char.pos, char,char.pos));
                playertick(char);
            }
        }
    }
    if (event.key === '<' && fontsize > 26){
        viewportsizex += 4;
        viewportsizey += 2;
        fontsize = Math.round(1248/viewportsizex);
    }
    if (event.key === '>' && fontsize < 52){
        viewportsizex -= 4;
        viewportsizey -= 2;
        fontsize = Math.round(1248/viewportsizex);
    }
    if (event.key === 'ArrowLeft' && viewportoffsetx > -5){
        viewportoffsetx --;
        viewportpos[1] --;
    }
    if (event.key === 'ArrowRight' && viewportoffsetx < 5){
        viewportoffsetx ++;
        viewportpos[1] ++;
    }
    if (event.key === 'ArrowUp' && viewportoffsety > -5){
        viewportoffsety --;
        viewportpos[0] --;
    }
    if (event.key === 'ArrowDown' && viewportoffsety  < 5){
        viewportoffsety ++;
        viewportpos[0] ++;
    }
    // if (event.key === 'Alt'){
    //     showdetails = true;
    // }
    
    // if (event.key === 'D') {
    //     if(controllock == false){
    //         if(autodash == true){
    //             autodash = false;
    //         }
    //         else{
    //             autodash = true;
    //         }
    //     }
    // }

    if (event.key === 'a') {

        if(controllock == false){
            const char = playercs[activecharacter];
            if(char.tc[1] >= 1){
                if(uilock == false){
                    uilock = true;
                }
                else{
                    uilock = false;
                }
            }
        }
    }
    if (event.key === 'r'){
        gridinit();
    }
    if (event.key === 'x'){
        if(controllock === false){
            const char = playercs[activecharacter];
            const act = new action (...actions.SwitchWeapon, 0, char.pos, char, char.pos);
            char.actionqueue.push(act);
            playertick();
        }
    }
    if (event.key === 'g'){
        if(controllock === false && uilock === false){
            const char = playercs[activecharacter];
            if(newgrid[char.pos[0]][char.pos[1]].items.length > 0){
                const droppeditem = char.equipment.shift();
                const pickedupitem = newgrid[char.pos[0]][char.pos[1]].items.shift();
                char.equipment.unshift(pickedupitem);
                newgrid[char.pos[0]][char.pos[1]].items.push(droppeditem);
                char.equipupdate();
                // console.log(char.equipment);
            }
        }
    }
    if(event.key === '+' && brightnessadjust < 2.1){
        brightnessadjust += 0.1;
    }
    if(event.key === '-' && brightnessadjust > 0.4){
        brightnessadjust -= 0.1;
    }
    if(event.key === '?'){
        keyglossary = !keyglossary;
    }
    else{
        keyglossary = false;
    }

    // if(event.key === '+'){
    //     viewportsizex -= 4;
    //     viewportsizey -= 2;
    // }
    // if(event.key === '-'){
    //     viewportsizex += 4;
    //     viewportsizey += 2;
    // }
});

document.addEventListener('wheel', function(event) {
    if (event.deltaY < 0 && fontsize > 26){
        viewportsizex += 4;
        viewportsizey += 2;
        fontsize = Math.round(1248/viewportsizex);
        
    }
    else if (event.deltaY > 0 && fontsize < 52){
        viewportsizex -= 4;
        viewportsizey -= 2;
        fontsize = Math.round(1248/viewportsizex);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('contextmenu', function(event) {
        event.preventDefault(); // Prevent the default context menu
    });
});

gameText.addEventListener('mouseover', event => {
    if (event.target.classList.contains('clickable')){
        if (controllock == false || true) {

            const clickedx = event.target.getAttribute("x");
            const clickedy = event.target.getAttribute("y");
            const clickedpos = [parseInt(clickedy),parseInt(clickedx)];
            if((cursorpos[0] != clickedy || cursorpos[1] != clickedx)){
                showdetails = false;
                cursorpos[0] = clickedpos[0];
                cursorpos[1] = clickedpos[1];
            }
        }
    }
    else{
        cursorpos = [0,0];
    }
});

gameText.addEventListener('mousedown', event => {
    keyglossary = false;
    if(event.target.classList.contains('clickable') && event.button == 0){
        if(controllock == false && uilock == false){
            moveplayer();
        }
        if(controllock == false && uilock == true){
            let char = playercs[activecharacter];
            let attackaction = actions.Attack;
            char.actionqueue.push(new Attack(...attackaction,char.getrange(),cursorpos,char,char.pos));
            if(canAffordAction(char.actionqueue[0], char)){
                playertick(char);
            }
            uilock = false;
        }
    }

    if (event.target.classList.contains('clickable') && event.button == 2) {
        const clickedx = event.target.getAttribute("x");
        const clickedy = event.target.getAttribute("y");
        const clickedpos = [parseInt(clickedy),parseInt(clickedx)];
        if(controllock == false){
            showdetails = true;
        }
        // newgrid[clickedpos[0]][clickedpos[1]] = new Tile(...tiletypes.DirtFloor,clickedpos);
        // grid[clickedpos[0]][clickedpos[1]] = 1;
    }
});
//#endregion

//#region variables
let viewportpos = [50,50];

let gamelog = ["","","","","","","","","","","","","","","","",""];
let cursorlog = "this is the cursor log";

let cursorpos = [0,0];
let keyglossary = false;

let score = 0;

let itemmap = [];
let grid = [];
let newgrid = [];
// let displaygrid = new Array(mapsizey).fill(null).map(() => new Array(mapsizex).fill(""));
// let sightmap = new Array(mapsizey).fill(null).map(() => new Array(mapsizex).fill(false));
// let lightmap = new Array(mapsizey).fill(null).map(() => new Array(mapsizex).fill(null).map(() => new Array(3).fill(0)));
let noisemap = new Array(mapsizey).fill(null).map(() => new Array(mapsizex).fill(1));

let uielements = [];
let animationelements = {};

let characters = [];
let charactershere = [];
let nonpcshere = [];
let objectshere = [];
let playercs = [];
let nonpcs = [];
let turncounter = 0;
let activecharacter = 0;
let activecharacternonindex = null;
let tickcounter = 0;

let controllock = false;
let uilock = false;
let showdetails = false;

let lightsources = [];

let messageQueue = [];
let isProcessing = false;

//#endregion

// nonpcs.push(new character([45,45], ...enemies.Goblin));
// nonpcs.push(new character([45,46], ...enemies.Goblin_Ranged));



// lightsources.push(new lightsource([0,0],[256,256,256],[5,3,2]));
// lightsources.push(new lightsource([55,50],[128,128,128],[0.5,0.5,0.5]))
// lightsources.push(new lightsource([55,50],[128,128,128],[0.5,0.5,0.5]))


gridinit();
noiseupdate();

function gridinit(){
    score = 0;
    generate();
    updatecharacters();
    
    for(let y = 0; y < mapsizey; y++){
        newgrid[y] = [];
        for(let x = 0; x < mapsizex; x++){
            // let traversable = true;
            // let transparancy = 1;
            // if(grid[y][x] == 3 || grid[y][x] == 6){
            //     traversable = false;
            //     transparancy = 0;
            // }
            // let movecost = 1;
            // if(grid[y][x] == 0){
            //     movecost = 2;
            // }
            newgrid[y][x] = new Tile(...tiletypesarr[grid[y][x]], [y,x]);
        }
    }

    generatemonsters();
    // generateObjects();
    // console.log(newgrid);
    updatelighting();
    updateGrid();
    updatecharactershere();
    updateGrid();
    drawGrid(true);
    nonpcs.forEach(function (enemy) {spot(enemy)});

    // setTimeout(() => {
    //     playsoundeffect();
    // }, 3000);


    // setTimeout(() => {
    //     playambientsound(soundeffects.caveambience);
    // }, 1000);

    // setTimeout(()=>playsoundeffect(Soundfx.Ambience, true), 3000);
    // setTimeout(()=>playnoise(whitenoise, 100),1000);

    // addToLog("The torch begins to flicker, and the way out has long faded from memory.");
    // addToLog("The sounds from the dark have only gotten louder.");
    // addToLog("They fear the firelight, but it dwindles by the moment."
}


function alinedraw (points, length, char){
    if(!points || points.length == 0){
        return;
    }
    const aq = translateAStoAQ(points, char);
    let hypotheticaltc = char.tc.slice();
    let currentpos = char.pos;
    for(let i = 0; i < aq.length; i++){
        const [y,x] = aq[i].target;
        if(i > 0){
            currentpos = aq[i-1].target;
        }
        if(hypotheticaltc[0] >= aq[i].cost[0] && hypotheticaltc[1] >= aq[i].cost[1]){  
            if(aq[i].name == "Move"){
                cost = aq[i].cost[0];
                newgrid[y][x].uiElements.push(new uielement("", [0.25*(cost**2),0.25,0.25], [y,x]));
            }
            if(aq[i].name == "Attack"){
                const hypotheticalattack = aq[i].func(true);
                // console.log(aq[i].func(true).modbreakdown);
                // adduilabel("Attack!", [y,x], [128,0,0], -1, false, false);
                const path = bresenhamLine(currentpos, aq[i].target);
                let symbol = linecharacter(currentpos, aq[i].target);
                for(let r = 1; r < path.length; r++){
                    const[a,b] = path[r];
                    // if(newgrid[a][b].readOpacity() > 0) symbol = "e";
                    if(r == path.length-1) symbol = "x";
                    newgrid[a][b].uiElements.push(new uielement(symbol, [1,1,1], [a,b]));
                }
            }
            if(aq[i].warnings.length !== 0)adduilabel("x",aq[i].pos,[128,0,0],0,false,false);
            hypotheticaltc = hypotheticaltc.map((element,index) => element-aq[i].cost[index]);
        }
        else{
            return(hypotheticaltc);
        }
        if(i == aq.length-1){
            return(hypotheticaltc);
        }
    }

    // for(let i = 0; i < points.length; i++){
    //     if(i >= length){
    //         break;
    //     }
    //     let symbol = "&#149";
    //     const [y,x] = char.pos;
    //     if(i < char.tc[0]){
    //         uielements.push(new uielement("",[0,0.5,0],[points[i][0]+y,points[i][1]+x]));
    //     }
    //     else if(i < char.tc[0]+char.tcmax[0]*char.tc[1]){
    //         uielements.push(new uielement("",[0.1,0.1,0.1],[points[i][0]+y,points[i][1]+x]));
    //     }
    // }

    // for(let i = 0; i < points.length; i++){
    //     if(i >= length){
    //         break;
    //     }
    //     let symbol = "&#149";
    //     const [y,x] = char.pos;
    //     const [a,b] = points[i].map((element,index) => element + char.pos[index])
    //     if(i < char.tc[0]){
    //         newgrid[a][b].uiElements.push(new uielement("", [0.25,0.25,0.25], [a,b]));
    //         // uielements.push(new uielement("",[0,0.5,0],[points[i][0]+y,points[i][1]+x]));
    //     }
    //     else if(i < char.tc[0]+char.tcmax[0]*char.tc[1]){
    //         newgrid[a][b].uiElements.push(new uielement("", [0.1,0.1,0.1], [a,b]));

    //         uielements.push(new uielement("",[0.1,0.1,0.1],[points[i][0]+y,points[i][1]+x]));
    //     }
    // }
}

function addanimation (arr,symbols,color, time = 1, animation = true, ui = false){
    let animationkeys = [];
    let length = arr.length;
    for(let i = 0; i < length; i++){
        animationkeys.push(`${arr[i][0]},${arr[i][1]},${performance.now()},${performance.now()+time*6*ticktimer}`);
        let symbol = symbols[i%symbols.length];
        animationelements[animationkeys[i]] = new uielement(symbol,color,arr[i], animation, ui);
    }
    setTimeout(function (){
        for(let i = 0; i < length; i++){
            delete animationelements[animationkeys[i]];
        }
    }, ticktimer*6*time);
}

updateGrid();

function noiseupdate(){
    noiseupdateticker++;
    if(noiseupdateticker == screenupdatefraction){
        noiseupdateticker = 0;
        let startx = viewportpos[1] - (Math.floor(viewportsizex/2));
        let starty = viewportpos[0] - (Math.floor(viewportsizey/2));
        let endx = viewportpos[1] + (Math.floor(viewportsizex/2));
        let endy = viewportpos[0] + (Math.floor(viewportsizey/2));
        if(starty < 0){
            starty = 0;
            endy = viewportsizey;
        }
        if(endy > mapsizey){
            endy = mapsizey;
            starty = mapsizey-viewportsizey;
        }
        if(startx < 0){
            startx = 0;
            endx = viewportsizex;
        }
        if(endx > mapsizex){
            endx = mapsizex;
            startx = mapsizex-viewportsizex;
        }
        for(let y = starty; y < endy; y++){
            for(let x = startx; x < endx; x++){
                if(newgrid[y][x].visible !== false && takeav(newgrid[y][x].light)>1){
                let avlighthere = takeav(newgrid[y][x].light)/256;
                    if((Math.random()) > noisethreshold+((avlighthere**0.05)*0.5) || ((grid[y][x] == 0)&&(Math.random()+avlighthere)/2>waterthreshhold) ||(newgrid[y][x].readLightsource() !== undefined && Math.random() > lightflickerthreshhold)){
                        let result = 1-(noiseamount) + Math.random()*noiseamount*2;
                        noisemap[y][x] = result;
                    }
                }
            }
        }
        drawGrid(true);
        setTimeout(noiseupdate,noiseupdaterate/screenupdatefraction);
        updateambientsound();
    }
    else{
        drawGrid(false);
        setTimeout(noiseupdate,noiseupdaterate/screenupdatefraction);
        updateambientsound();
    }
}

function updateGrid(){
    let partypos = getpartypos();
    if(partypos && dist(partypos, viewportpos) > 2){
        viewportpos[0] = partypos[0];
        viewportpos[1] = partypos[1];
    }
    function getpartypos(){
        let returnpos = [];
        let yvalues = [];
        let xvalues = [];
    
        // for(let i = 0; i < playercs.length; i++){
        //     if(playercs[i].dead == false){
        //         yvalues.push(playercs[i].pos[0]);
        //         xvalues.push(playercs[i].pos[1]);
        //     }
        // }
        for(let i = 0; i < 1; i++){
            if(playercs[i].dead == false){
                yvalues.push(playercs[i].pos[0]);
                xvalues.push(playercs[i].pos[1]);
            }
        }
        if(yvalues.length == 0){
            gridinit();
            return;
        }
        returnpos = [Math.round(takeav(yvalues)),Math.round(takeav(xvalues))];
        return(returnpos);
    }
}

//#region traits and conditions

function updateconditions(char) {
    for (let i = char.conditions.length - 1; i >= 0; i--) {
        char.conditions[i].duration--;
        if (char.conditions[i].duration <= -1) {
            if (char.conditions[i].endeffect != null) {
                char.conditions[i].endeffect();
            }
            char.conditions.splice(i, 1);
        }
        else{
            char.conditions[i].turneffect();
        }
    }
}

function updatetraitspassive (){
    for(let c = 0; c < nonpcshere.length; c++){
        const char = nonpcshere[c];
        if(char.dead === true){
            continue;
        }
        else{
            for(let t = 0; t < char.traits.length; t++){
                const trt = char.traits[t];
                if(trt.passive == true){
                    if(trt.trigger() == true){
                        trt.effect();
                    }
                }
            }
        }
    }
    for(let c = 0; c < playercs.length; c++){
        const char = playercs[c];
        if(char.dead == true){
            continue;
        }
        else{
            for(let t = 0; t < char.traits.length; t++){
                const trt = char.traits[t];
                if(trt.passive == true){
                    if(trt.trigger() == true){
                        trt.effect();
                    }
                }
            }
        }
    }
    for(let o = 0; o < objectshere.length; o++){
        const obj = objectshere[o];
        for(let ef = 0; ef < obj.effects.length; ef++){
            const effect = obj.effects[ef];
            effect(obj);
        }
    }
    // for(let c = 0; c < characters.length; c++){
    //     const char = characters[c];
    //     if(manhattanDistance(char.pos[0],viewportpos[0]) > dontcaredistance || char.dead == true){
    //         continue;
    //     }
    //     if(c.dead != true){
    //         for(let t = 0; t < char.traits.length; t++){
    //             const trt = char.traits[t];
    //             if(trt.passive == true){
    //                 if(trt.trigger() == true){
    //                     trt.effect();
    //                 }
    //             }
    //         }
    //     }
    // }
}

function updatetraitsactive (char){
    for(let t = 0; t < char.traits.length; t++){
        const trt = char.traits[t];
        if(trt.active == true && trt.trigger() == true){
            trt.effect();
        }
    }
}
//#endregion

//#region Turn Handling
function playerturn(){
    if(activecharacter == 0){
        turncounter++;
        // console.log(`the time is ${performance.now()-enemyturnstart} and there are ${nonpcshere.length} enemies. That means each enemy took ${(performance.now()-enemyturnstart)/nonpcshere.length}`);

    }
    pc = playercs[activecharacter];
    if(pc.dead == true){
        playerendturn();
    }
    pc.tc = pc.tcmax.slice();
    updateconditions(pc);
    updatetraitsactive(pc);
    // viewportpos[0] = pc.pos[0]
    // viewportpos[1] = pc.pos[1];
    controllock = false;
    activecharacternonindex = playercs[activecharacter];
}

function playertick (){
    controllock = true;
    let pc = playercs[activecharacter];
    if(pc.hp <= 0){
        pc.dead = true;
    }
    if(pc.dead == true){
        playerendturn();
        return;
    }
    if(pc.tc[0] <= 0 && pc.tc[1] <= 0){
        // pc.actionqueue = [];
        // setTimeout(playerendturn(),ticktimer)
        // return;
    }
    if(pc.actionqueue.length > 0){
        let delay = 1;
        if(canAffordAction(pc.actionqueue[0],pc)){
            if(pc.actionqueue[0].cost[1] > 0){
                // console.log("We spent an action");
                delay = 10;
            }
            move(pc);
            drawGrid(true);
        }
        else{
            pc.actionqueue = [];
        }
        setTimeout(playertick,ticktimer*delay);
        updateGrid();
        return;
    }
    else{
        playercs[activecharacter].actionqueue = [];
    }
    if(playercs[activecharacter].actionqueue.length == 0){
        controllock = false;
    }
}

function playerendturn (){
    updatetraitspassive();
    updatecharactershere();
    nonpcshere = shuffle(nonpcshere);
    uilock = false;
    activecharacter++;
    if(activecharacter < playercs.length){
        if(playercs[activecharacter].dead == true){
            playerendturn();
            return;
        }
        playerturn();
        return;
    }
    activecharacter = 0;
    controllock = true;
    setTimeout(enemyturn,ticktimer);
}

function enemyturn(){
    if(activecharacter == 0)enemyturnstart = performance.now();
    if(activecharacter >= nonpcshere.length){
        activecharacter = 0;
        playerturn();
        return;
    }
    let enemy = nonpcshere[activecharacter];
    activecharacternonindex = enemy;
    activecharacter++;
    if(manhattanDistance(enemy.pos, viewportpos) < dontcaredistance && enemy.dead == false){
        enemy.tc = enemy.tcmax.slice();
        if(enemy.state == "idle"){
            // enemy.tc[1] = 0;
        }
        tickcounter = 0;
        updateconditions(enemy);
        updatetraitsactive(enemy);
        // setTimeout(()=>enemytick(enemy),ticktimer);
        enemytick(enemy);
        if(syncturns){
            setTimeout(enemyturn,0.1*ticktimer*Math.random());
        }
        return;
    }
    enemyturn();

    function enemytick (enemy){
        // if(activecharacter == 1)console.log(performance.now());
        let delay = 1;
        tickcounter++;
        if(tickcounter > 20){
            enemy.actionqueue = [];
            enemyturn();
            return;
        }
        if(enemy.hp <= 0) enemy.dead = true;
        if(enemy.dead == true){
            enemyturn();
            return;
        }
        if(enemy.tc[0] > 0 || enemy.tc[1] > 0){
            if(enemy.actionqueue.length > 0){
                if(canAffordAction(enemy.actionqueue[0],enemy)){
                    if(enemy.actionqueue[0].cost[1] > 0){
                        delay = 10;
                    }
                    const [y,x] = enemy.actionqueue[0].target;
                    if(newgrid[enemy.pos[0]][enemy.pos[1]].visible !== true && newgrid[y][x].visible !== true){
                        delay = 0;
                    }
                    move(enemy);
                }
                else{
                    enemy.actionqueue = [];
                    enemyturn();
                    return;
                }
            }
            else{
                let potentialaq = planturn(enemy);
                if(potentialaq.length > 0){
                    enemy.actionqueue = potentialaq.slice();
                    enemy.actionqueue.push(new action("End Turn", endturnfunc, [0,0,0], 0, enemy.pos, enemy, enemy.pos));
                    if(enemy.actionqueue.length < 1){
                        enemyturn();
                        return;
                    }
                }
                else{
                    enemy.actionqueue = [];
                    enemyturn();
                    return;
                }
            }
        }
        if(enemy.tc[0] > 0 || enemy.tc[1] > 0){
            if(newgrid[enemy.pos[0]][enemy.pos[1]].visible !== true){
                delay = 0;
            }
            if(delay*ticktimer == 0 && (!enemy.actionqueue[0] || !enemy.actionqueue[0].loudness || enemy.actionqueue[0].loudness < chebyshevDistance(viewportpos,enemy.pos))){
                enemytick(enemy);
            }
            else{
                setTimeout((
                    function (){
                        enemytick(enemy);
                        updateGrid()})
                    ,(ticktimer*delay));
            }
        }
        else{
            enemy.actionqueue = [];
            enemyturn();
        }
    }
}



//#endregion

function aStar(origin, destination, explorationmax = 50, closeenough = 0) {
    const numRows = grid.length;
    const numCols = grid[0].length;

    // Define possible directions (up, down, left, right).
    let directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],  
        [-1, -1],  
        [1, -1],   
        [1, 1],  
        [-1, 1],
    ];
    // directions = shuffle(directions);

    // Helper function to check if a cell is valid (within grid boundaries and not a wall).
    function isValidCell(row, col) {
        let nocharhere = true;
        if(newgrid[row][col].character !== null){
            if(row !== origin[0] || col!== origin[1]){
                if(row !== destination[0] || col !== destination[1]){
                    nocharhere = false;
                }
            }
        }
        return row >= 0 && col >= 0 && row < numRows && col < numCols && newgrid[row][col].traversable === true && nocharhere == true;
    }

    // Create a priority queue (min-heap) to store open nodes.
    const open = new PriorityQueue((a, b) => a.f - b.f);

    // Create a 2D array to store the cost to reach each cell from the origin.
    const cost = new Array(numRows).fill(null).map(() => new Array(numCols).fill(Infinity));

    // Initialize the origin node.
    const [y, x] = origin;
    cost[y][x] = 0;
    open.enqueue({ x, y, f: 0 });

    let Bline = bresenhamLine(origin, destination);
    let index = 1;
    let tilesexplored = 0;
    while (!open.isEmpty()) {
        const current = open.dequeue();

        if ((current.x === destination[1] && current.y === destination[0]) || dist([current.y, current.x],destination) <= closeenough) {
            // We've reached the destination, backtrack to find the path.
            const path = [];
            let node = current;
            while (node) {
                path.push([node.y - origin[0], node.x - origin[1]]);
                node = node.parent;
            }
            path.pop();
            return path.reverse();
        }
        if(Bline.length >= index-1){
            if(current.y != Bline[index-1][0] || current.x != Bline[index-1][1]){
                Bline = bresenhamLine([current.y,current.x],destination);
                index = 1;
            }
        }
        if(tilesexplored > explorationmax){
            break;
        }
        // Explore neighbors.
        for (const [dx, dy] of directions) {
            const newRow = current.y + dy;
            const newCol = current.x + dx;

            if (isValidCell(newRow, newCol)) {
                let tentativeCost = cost[current.y][current.x] + newgrid[current.y][current.x].moveCost;
                // if(grid[current.y][current.x] == 0){
                //     tentativeCost += 1;
                // }
            
                if (tentativeCost < cost[newRow][newCol]) {
                    cost[newRow][newCol] = tentativeCost;
            
                    const dx = Math.abs(newRow - destination[0]);
                    const dy = Math.abs(newCol - destination[1]);
            
                    let h;
                    if (dx > dy) {
                        h = dx + 0.9 * dy;
                    } else {
                        h = dy + 0.9 * dx;
                    }
                    if(Bline.length > index){
                        if(newRow == Bline[index][0] && newCol == Bline[index][1]){
                            h = -0.1;
                        }
                    }
            
                    const f = tentativeCost + h;
                    open.enqueue({ x: newCol, y: newRow, f, parent: current });
                }
            }
        }
        index++;
        tilesexplored++;
    }

    // No path found.
    return null;
} 

//#region gamelog handling
function processQueue() {
    if (messageQueue.length === 0) {
        isProcessing = false;
        // controllock = false;
        return;
    }

    isProcessing = true;
    let message = messageQueue.shift();
    updategamelog(message);
}

function updategamelog(str, i = 0) {
    // controllock = true;

    // Split the string into words
    let words = str.split(' ');

    if(i == 0) {
        gamelog.unshift(words[i]);
    } else {
        gamelog[0] += ' ' + words[i];
    }
    i++;

    if(i < words.length) {
        setTimeout(() => updategamelog(str, i), 10);
    } else {
        processQueue();  // Process the next message in queue
    }

    drawGrid(false);
}

function addToLog(message) {
    messageQueue.push(message);
    if (!isProcessing) {
        processQueue();
    }
}
//#endregion

function translateAStoAQ (path,char,moveonly = false){
    let aqpath = [];
    let abspath = [];
    if(path){
        for(let i = 0; i < path.length; i++){
            abspath.push(path[i].map((element, index) => element+char.pos[index]));
            if(i == 0){
                aqpath.push(path[i]);
            }
            else{
                aqpath.push(path[i].map((element,index) => element-path[i-1][index]));
            }
        }
    }
    //initializing y and x
    let [y,x] = char.pos;
    
    if(abspath.length > 0){
        [y,x] = abspath[abspath.length-1];
    }
    const target = newgrid[y][x].character
    const obj = newgrid[cursorpos[0]][cursorpos[1]].objects[0];
    let attacking = false;
    let interacting = false;
    let hypotheticalaction;
    if(target !== null && target.pc !== char.pc && moveonly == false){
        attacking = true;
    }
    if(obj && obj.traversable == false && attacking == false && obj.action !== null){
        interacting = true;
        // hypotheticalaction = new action(...obj.action);
    }
    let aq = [];
    let currentpos = char.pos;
    let nextpos;
    if(interacting && dist(currentpos,obj.pos) <= obj.action[3]){
        aq.push(new action(...obj.action, obj.pos, char, currentpos));
    } 
    for(let i = 0; i < aqpath.length; i++){
        if(i>0){
            currentpos = abspath[i-1];
        }
        nextpos = abspath[i];
        // let potentialtarget = newgrid[abspath[i][0]][abspath[i][1]].character;
        // if(potentialtarget !== null && potentialtarget.pc != char.pc){
        //     let attackaction = char.actions[0];
        //     aq.push(new action(...attackaction,char.getrange(), abspath[i],char));
        // }
        if(attacking && dist(currentpos,target.pos) <= char.getrange() && drawline(currentpos,target.pos) !== false){
            // let attackaction = char.actions[0];
            let attackaction = actions.Attack;
            aq.push(new Attack(...attackaction,char.getrange(), target.pos, char, currentpos));
            break;
        }
        else{
            let cost = [newgrid[abspath[i][0]][abspath[i][1]].moveCost,0,0];
            aq.push(new Move("Move",movefunc,cost,1,abspath[i],char,currentpos));
        }
        if(interacting && dist(nextpos,obj.pos) <= obj.action[3]){
            aq.push(new action(...obj.action, obj.pos, char, currentpos));
            break;
        } 
    }
  
    return(aq);
}

function moveplayer () {
    const [y,x] = cursorpos;
    const clicktile = newgrid[y][x];
    if(clicktile.visible == false)return;
    let path = aStar(playercs[activecharacter].pos,cursorpos);
    if(clicktile.objects.length > 0){
        const obj = clicktile.objects[0];
        let interaction = null;
        if(obj.traversable == false && obj.action !== null){
            path = aStar(playercs[activecharacter].pos,cursorpos,50,1.9);
            interaction = obj.action;
        }
        
    }

    if(!path){
        return;
    }

    playercs[activecharacter].actionqueue = translateAStoAQ(path, playercs[activecharacter]).slice();

    //get the total move cost of the action queue, and if it's more than the move we have left, shift a dash action
    if(autodash == true){
        let totalmovecost = 0;
        for(let i = 0; i < playercs[activecharacter].actionqueue.length; i++){
            totalmovecost += playercs[activecharacter].actionqueue[i].cost[0];
        }
        if(totalmovecost > playercs[activecharacter].tc[0]){
            if(playercs[activecharacter].tc[1] >= 1){
                playercs[activecharacter].actionqueue.unshift(new action("Dash",dashfunc,[0,1,0],null,null,playercs[activecharacter]));
            }
        }
    }

    if(playercs[activecharacter].actionqueue.length > 0){
        playertick();
    }
}

function move (char) {
    if(char.dead == true)return;
    const [y,x] = char.pos;
    const move = char.actionqueue.shift();
    const [ty,tx] = move.target;

    //if the character actually has a move to do and they can afford it, keep going
    if(!move) return;
    // if(!canAffordAction(move, char)) return;
    const oldtc = char.tc.slice();
    if(char.tc[2] < move.cost [2]) return;
    char.tc[2] -= move.cost[2];

    //subtract the cost of the action, remembering what the original turn counter was in case we need to revert

    //see if just initiating the move provokes a reaction from anybody
    reactioncheck(newgrid[y][x], char, move);

    if(char.tc[0] < move.cost[0] || char.tc[1] < move.cost[1])return;

    char.tc[0] -= move.cost[0];
    char.tc[1] -= move.cost[1];

    //if the move can be completed (IE it is a valid move, not trying to walk into a wall or shoot at nothing)
    //this call of move.func() also actually performs the move. This is not particularly clean code :/
    if(move.func() !== false){
        //check to see if finishing the move provokes any reactions
        reactioncheck(newgrid[y][x], char, move);
        //if the move has a loudness, play a sound
        if(move.loudness) {
            let thissound = new Sound([ty,tx], move.loudness, char, move.name);
            if(move.soundcontent){
                thissound.content = move.soundcontent;
            }
            if(move.soundeffect){
                thissound.soundeffect = move.soundeffect;
            }
            hear(thissound);
        }
    }

    //if the action failed, revert the turn counter
    else{
        char.tc = oldtc.slice();
    }

    //update traits that have passive triggers (IE can trigger as a reaction)
    updatetraitspassive();

    function reactioncheck (tile, triggerer, action) {
        let reactingcharacters = {};
        let tiles = [tile,newgrid[action.target[0]][action.target[1]]];
        tiles.forEach(
            function (tile) {
                tile.charactersinview.forEach(
                    function(character){
                        if(character.pc == true || character.dead == true){
                        }
                        else{
                            reactingcharacters[character.index] = character;
                        }
                    }
                )
                if(tile.visible == true){
                    playercs.forEach(
                        function (char) {
                            if(char.dead == false)reactingcharacters[char.index] = char;
                        }
                    )
                }
            }
        );
        Object.values(reactingcharacters).forEach(
            function (character) {
                character.reactions.forEach(
                    function (reaction) {
                        reaction(character, triggerer, action);
                    }
                )
            }
        )
        triggerer.reactions.forEach(
            function (reaction) {
                reaction(triggerer, null, null);
            }
        )
    }
}

function addcharlabel (pos, char) {
    name = char.name;
    const [y,x] = pos;

    if(uilock == true){
        // adduilabel("Attack!", char.pos, [256,0,0], 1);
    }
    else{
        adduilabel(name, pos, char.color,2);
        const hp = char.hp;
        let hpstring = hp.toString();
        let maxhpstring = char.maxhp
        for(let i = 0; i < char.conditions.length; i++){
            if(showdetails)adduilabel(char.conditions[i].name, pos, char.color, i+3);
        }
        adduilabel(hpstring + "/" + maxhpstring, pos, char.color,1);
    }
}

function adduilabel (str, pos, color, yoffset, animation = false, log = false, ignoreoffset = false, ui, time = 1){
    const [y,x] = pos;
    if(chebyshevDistance(viewportpos,pos) > (viewportsizex/2)+2){
        return;
    }
    if(newgrid[y][x].visible === true || ui){
        let offset = Math.ceil(str.length/2-1);
        if(ignoreoffset) offset = 0;
        if(log == true){
            offset = 0;
        }
        if(animation == false){
            // while(true){
            //     let blocked = false;
            //     for(let i = 0; i < str.length; i++){
            //         newgrid[y-yoffset][x-offset+1].uiElements.forEach(
            //             function (uielement) {
            //                 if(uielement.animation !== true){
            //                     blocked = true;
            //                 }
            //             }
            //         );
            //     }
            //     if(blocked == false){
            //         break;
            //     }
            //     yoffset++;
            // }
            for(let i = 0; i < str.length; i++){
                newgrid[y-yoffset][x-offset+i].uiElements.push(new uielement(str.charAt(i),color,[y-1,x-offset+i]));
            }
        }
        else{
            line = [];
            for(let i = 0; i < str.length; i++){
                line.push([y-yoffset,x-offset+i]);
            }
            addanimation(line, str, color, time, animation, ui);
        }
    }
}

function drawGrid(lighting = false){
    const now = Date.now();
    adduilabel("x",cursorpos,[128,128,128],0,false, false, false, true);
    if(keyglossary){
        Object.values(keybindings).forEach(
            function (keybinding, index) {
                adduilabel(keybinding, [viewportpos[0],viewportpos[1]-(viewportsizex/2)], [128,128,128], -(viewportsizey/2)+index+3, false, false, true, true);
            }
        )
    }


    if (now - lastCall < throttleRate && lighting == false) {
      return;
    }
    lastCall = now;

    // Cursorlog handler

    // cursorlog = tilenames[grid[cursorpos[0]][cursorpos[1]]];
    // if(sightmap[cursorpos[0]][cursorpos[1]] !== true){
    //     cursorlog = "Darkness"
    // }

    // if(ischarhere(...cursorpos)!==false){
    //     cursorlog = characters[ischarhere(...cursorpos)].name;
    //     // cursorlog += characters[ischarhere(...cursorpos)].hp;
    //     cursorlog += repeatchar(`<span style = "color : rgb(192,0,0);" >&#149</span>`,characters[ischarhere(...cursorpos)].hp);
    //     cursorlog += repeatchar(`<span style = "color : rgb(64,64,64);" >&#149</span>`,characters[ischarhere(...cursorpos)].maxhp - characters[ischarhere(...cursorpos)].hp);
    //     characters[ischarhere(...cursorpos)].conditions.forEach(function(element){cursorlog+= " "+element.name});
    //     // cursorlog += 
    // }

    // Record the start time
    const startTime = performance.now();

    if(lighting){
        updatelightmap();
    }
    
    let startx = viewportpos[1] - (Math.floor(viewportsizex/2));
    let starty = viewportpos[0] - (Math.floor(viewportsizey/2));
    let endx = viewportpos[1] + (Math.floor(viewportsizex/2));
    let endy = viewportpos[0] + (Math.floor(viewportsizey/2));

    if(starty < 0){
        starty = 0;
        endy = viewportsizey;
    }
    if(endy > mapsizey){
        endy = mapsizey;
        starty = mapsizey-viewportsizey;
    }
    if(startx < 0){
        startx = 0;
        endx = viewportsizex;
    }
    if(endx > mapsizex){
        endx = mapsizex;
        startx = mapsizex-viewportsizex;
    }

    // drawgamelog();

    // for(let i = 0; i < animationelements.length; i++){
    //     // uielements.push(animationelements[i]);
    //     const element = animationelements[i];
    //     const [y,x] = element.pos;
    //     newgrid[y][x].uiElements.push(element);
    // }

    Object.values(animationelements).forEach(
        function (element) {
            const[y,x] = element.pos;
            newgrid[y][x].uiElements.push(element);
        }
    )

    if(controllock == false && newgrid[cursorpos[0]][cursorpos[1]].visible == true && uilock == false){
        let hypotc = alinedraw(aStar(playercs[activecharacter].pos,cursorpos), playercs[activecharacter].tc, playercs[activecharacter]);
        newgrid[cursorpos[0]][cursorpos[1]].cursorread();
        renderactionui(hypotc);
    }
    else if(uilock == true){
        let connects = false;
        let activechar = playercs[activecharacter];
        if(activechar.tc[1] < 1){
            uilock = false;
        }
        // console.log(activechar);
        let hypotheticalattack = new Attack(...actions.Attack,activechar.getrange(), cursorpos, activechar, activechar.pos);
        let realrange = hypotheticalattack.range;
        let range = Math.ceil(hypotheticalattack.range);
        const minrange = activechar.equipment[0].minrange;
        for(let localy = activechar.pos[0]-range; localy <= activechar.pos[0]+range; localy++){
            for(let localx = activechar.pos[1]-range; localx <= activechar.pos[1]+range; localx++){
                if(dist(activechar.pos,[localy,localx]) <= realrange){
                    // uielements.push(new uielement("",[1,1,1],[localy,localx]));
                    newgrid[localy][localx].uiElements.push(new uielement("",[0.2,0.2,0.1],[localy][localx]));
                    let attackline = bresenhamLine(activechar.pos,cursorpos);
                    const symbol = linecharacter([attackline[0][0],attackline[0][1]],[attackline[attackline.length-1][0],attackline[attackline.length-1][1]]);
                    if(dist(activechar.pos,cursorpos) <= realrange && dist(activechar.pos, cursorpos) > minrange){
                        attackline.shift();
                        for(let i = 0; i < attackline.length; i++){
                            const [y,x] = attackline[i];
                            let color = [0,0,0];
                            if(newgrid[y][x].readOpacity()>0)color = [128,0,0];
                            newgrid[y][x].uiElements.push(new uielement(symbol,color,[0,0]));
                        }
                    }
                    if(newgrid[cursorpos[0]][cursorpos[1]].character){
                        hypoattack = hypotheticalattack.func(true)
                        if(hypoattack.errors.length > 0){
                            for(let i = 0; i < hypoattack.errors.length; i++){
                                // adduilabel(hypoattack.errors[i],cursorpos,[128,128,128],[i+1],false,false);
                            }
                        }
                        else{
                            connects = true;
                            const damagerangestring = (hypoattack.damagerange[0].toString() + "-" + hypoattack.damagerange[1].toString());
                            const tohitstring = (Math.round(hypoattack.percenthitchance).toString() + "%");
                            adduilabel(tohitstring, cursorpos, [(1-(hypoattack.percenthitchance/100))*128,(hypoattack.percenthitchance/100)*128,0], 2, false, false);
                            adduilabel(damagerangestring, cursorpos, [128,0,0], 1, false, false);
                            renderactionui(activechar.tc.map((element,index)=>element-hypotheticalattack.cost[index]));
                            
                            for(let i = 0; i < hypoattack.modbreakdown.length; i ++){
                                adduilabel(hypoattack.modbreakdown[i],cursorpos,[128,128,128],[i+3],false,false);
                            }
                        }
                    }
                }
            }
        }
        if(connects == false){
            renderactionui();
        }
    }
    else{
        if(activecharacternonindex && activecharacternonindex.pc == true){
            renderactionui();
        }
    }
    if(controllock == false){
        const char = playercs[activecharacter];
        newgrid[char.pos[0]][char.pos[1]].uiElements.push(new uielement("",[0,0.25,0],playercs[activecharacter].pos));
        // const [y,x] = [viewportpos[0]+Math.floor(viewportsizey/2)-1,viewportpos[1]-Math.floor(viewportsizex/2)];
        // adduilabel(playercs[activecharacter].equipment[0].name,[y,x],[256,256,256],0,false,true);
    }
    


    let output = `<span style ="line-height: 1"></span>`;

    //This is for drawing from the newgrid
    for(let y = starty; y < endy; y++){
        for(let x = startx; x < endx; x++){
                output += newgrid[y][x].read();
                if(x == endx-1){
                    output+= `<br><span style ="line-height: 1; font-size: ${fontsize}px;"></span>`;
                }
        }
    }
    
    render(output);
    uielements = [];

    // Record the end time
    const endTime = performance.now();

    // Calculate the duration
    const duration = endTime - startTime;

    // Log the duration to the console
    // console.log(`drawGrid took ${duration} milliseconds to run.`);

    // if(Math.floor(performance.now()/1000) > timeticker){
    //     timeticker = Math.floor(performance.now()/1000)
    //     // if(frameticker < 30)screenupdatefraction++;
    //     // if(frameticker > 35)screenupdatefraction--;
    //     console.log(frameticker);
    //     frameticker = 0;
    // }
    // frameticker++;

    function renderactionui (hypotc = activecharacternonindex.tc) {
        // if(!activecharacternonindex || activecharacternonindex.pc == false)return;
        let char = activecharacternonindex;
        let tc = char.tc.slice();
        let actions = "";
        let move = "";
        let conditions = "";
        for(let i = 0; i < tc[0]; i++){
            if(i < hypotc[0]){
                move += "o";
            }
            else{
                move += "x";
            }
        }
        for(let i = tc[0]; i < char.tcmax[0]; i++){
            move += ".";
        }
        for(let i = 0; i < tc[1]; i++){
            if(i < hypotc[1]){
                actions += "o";
            }
            else{
                actions += "x";
            }
        }
        for(let i = tc[1]; i < char.tcmax[1]; i++){
            actions += ".";
        }
        for(let i = 0; i < char.conditions.length; i++){
            conditions += char.conditions[i].name;
        }
        let xoffset = (viewportsizex/2);
        let yoffset = (viewportsizey/2)-1;
        adduilabel(actions,[viewportpos[0]+yoffset,viewportpos[1]-xoffset],[128,0,0],1,false, false, true, true);
        adduilabel(move,[viewportpos[0]+yoffset,viewportpos[1]-xoffset],[0,128,0],0,false, false, true, true);
        adduilabel(conditions,[viewportpos[0]+yoffset,viewportpos[1]-xoffset],[128,0,0],2,false, false, true, true);
    
    }
    function render(output) {
        requestAnimationFrame(() => {
            gameText.innerHTML = output;
        });
    }
}

function drawgamelog (){
    for(let i = 0; i < gamelog.length && i < 5; i++){
        adduilabel(gamelog[i], [viewportpos[0]+Math.floor(viewportsizey/2)-1,viewportpos[1]-Math.floor(viewportsizex/2)],[256,256,256],i,false, true);
    }
}

function drawline (pointA, pointB){
    const [y1, x1] = pointA;
    const [y2, x2] = pointB;

    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;

    let error = dx - dy;
    let x = x1;
    let y = y1;
    
    let opacity = 0;

    while (true) {
        // Check if the current grid cell is obstructed
        // If we reached the end point, there's a clear line of sight
        if (x === x2 && y === y2) {
            return opacity; // No obstruction found
        }
        if(x != x1 || y != y1){
            opacity += newgrid[y][x].readOpacity();
        }
        if (opacity >= 1) {
            return false; // Obstruction found
        }

        const e2 = 2 * error;
        if (e2 > -dy) {
            error -= dy;
            x += sx;
        }
        if (e2 < dx) {
            error += dx;
            y += sy;
        }
        // if(e2 > -dy && e2 < dx){
        //     if(cornershadows){
        //         if(newgrid[y][x-sx].readOpacity() == 1){
        //             opacity+=0.5;
        //         }
        //         if(newgrid[y-sy][x].readOpacity() == 1){
        //             opacity+=0.5;
        //         }
        //     }
        //     // Math.floor(opacity+= newgrid[y][x-sx].readOpacity())*0.25;
        //     // Math.floor(opacity+= newgrid[y-sy][x].readOpacity())*0.25;
        // }
    }
}

// addToLog("&#128 &#129 &#130 &#131 &#132 &#133 &#134 &#135 &#136 &#137 &#138 &#139 &#140 &#141 &#142 &#143 &#144 &#145 &#146 &#147 &#148 &#149 &#150 &#151 &#152 &#153 &#154 &#155 &#156 &#157 &#158 &#159 &#160 &#161 &#162 &#163 &#164 &#165 &#166 &#167 &#168 &#169 &#170 &#171 &#172 &#173 &#174 &#175 &#176 &#177 &#178 &#179 &#180 &#181 &#182 &#183 &#184 &#185 &#186 &#187 &#188 &#189 &#190 &#191 &#192 &#193 &#194 &#195 &#196 &#197 &#198 &#199 &#200 &#201 &#202 &#203 &#204 &#205 &#206 &#207 &#208 &#209 &#210 &#211 &#212 &#213 &#214 &#215 &#216 &#217 &#218 &#219 &#220 &#221 &#222 &#223 &#224 &#225 &#226 &#227 &#228 &#229 &#230 &#231 &#232 &#233 &#234 &#235 &#236 &#237 &#238 &#239 &#240 &#241 &#242 &#243 &#244 &#245 &#246 &#247 &#248 &#249 &#250 &#251 &#252 &#253 &#254 &#255 &#256");
