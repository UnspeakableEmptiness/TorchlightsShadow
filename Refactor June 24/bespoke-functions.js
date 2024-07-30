function updatecharacters () {
    characters = [...playercs,...nonpcs]
}

function updatecharactershere () {
    nonpcshere = [];
    objectshere = [];
    for(let y = viewportpos[0]-dontcaredistance; y <= viewportpos[0]+dontcaredistance; y++){
        for(let x = viewportpos[1]-dontcaredistance; x <= viewportpos[1]+dontcaredistance; x++){
            if(y < 0 || y >= mapsizey || x < 0 || x >= mapsizex) continue;
            if(newgrid[y][x].character !== null && newgrid[y][x].character.pc === false){
                nonpcshere.push(newgrid[y][x].character);
            }
            const objects = newgrid[y][x].objects;
            for(let o = 0; o < objects.length; o++){
                const obj = objects[o];
                objectshere.push(obj);
            }
        }
    }
}

function lightcheck (invert, threshold) {
    return function (){
        const [y,x] = this.character.pos;
        if(invert == true){
            if(newgrid[y][x].lightlevel >= threshold){
                return(true);
            }
            return(false);
        }
        else{
            if(newgrid[y][x].lightlevel <= threshold){
                return(true);
            }
            return(false);
        }
    }
}

function hostileallycheck () {
    const [y,x] = this.character.pos;
    for(let i = 0; i < nonpcshere.length; i ++){
        const npc = nonpcshere[i];
        if(npc.state !== "idle" && drawline([y,x],npc.pos) !== false && (y !== npc.pos[0] || x !== npc.pos[1])){
            this.character.target = npc.target;
            console.log(`${this.character.target} is the new target of this character, it should be the same as ${npc.target}`);
            return(true);
        }
    }
}

function hostilecheck () {
    // const [y,x] = this.character.pos;
    // for(let i = 0; i < playercs.length; i++){
    //     if(drawline([y,x],playercs[i].pos) !== false){
    //         return(true);
    //     }
    // }
    // return(false);
}

function friendlyadjacent () {
    [y,x] = this.character.pos;
    for(let localy = y-1; localy <= y+1; localy++){
        for(let localx = x-1; localx <= x+1; localx++){
            if(newgrid[localy][localx].character !== null && (localy != y || localx != x)){
                if(newgrid[localy][localx].name == this.character.name){
                    return(true);
                }
            }
        }
    }
    return(false);
}

function addcondition(cond, public) {
    return function () {
        let newcondition = new condition(cond.name,cond.starteffect,cond.turneffect,cond.duration,cond.resistance, cond.endeffect, this.character);
        if(lacksresistance(newcondition,this.character) == true && lackscondition(newcondition, this.character) == true){
            this.character.conditions.push(newcondition);
            this.character.conditions[this.character.conditions.length-1].starteffect();
            if(public)adduilabel(newcondition.name,newcondition.character.pos,[128,128,0],1,true);
            // if(public)addToLog(`the ${this.character.name} has become ${cond.name}`);
            if(newcondition.resistance == true){
                this.character.condresists.push(newcondition.name);
            }
            updateGrid();
        }
    }
}

function addconditiondynamic(cond, public, target){
    return function() {
        let newcondition = new condition(cond.name,cond.starteffect,cond.turneffect,cond.duration,cond.resistance, cond.endeffect, target);
        if(lacksresistance(newcondition,target) == true && lackscondition(newcondition, target) == true){
            target.conditions.push(newcondition);
            target.conditions[target.conditions.length-1].starteffect();
            if(public)adduilabel(newcondition.name,newcondition.character.pos,newcondition.character.color,1,true,false,false);
            // if(public)addToLog(`the ${target.name} has become ${newcondition.name}`);
            if(newcondition.resistance == true){
                target.condresists.push(newcondition.name);
            }
        }
    }
}

function lacksresistance(cond, char) {
    for (const element of char.condresists) {
      if (element == cond.name) {
        return false;
      }
    }
    return true;
}

function lackscondition (cond, char){
    if(!char.conditions){
        return(true);
    }
    for (const element of char.conditions) {
        if (element.name == cond.name) {
            return false;
        }
    }
    return(true);
}

function skipturn () {
    const [y,x] = this.character.pos;
    adduilabel("!",[y,x],[128,128,0],0,true,false,false);
    this.character.tc = [0,0,0];
}

function skipturnandyelp () {
    const [y,x] = this.character.pos;
    adduilabel("!",[y,x],[128,128,0],0,true,false,false);
    if(this.character.pc !== true){
        const chataction = new action ("Huh?", chatfunc, [0,0,1], 0, this.character.pos, this.character, this.character.pos, null, soundeffects.goblinyelp);
        chataction.loudness = 15;
        this.character.actionqueue.push(chataction);
        move(this.character);
    }
    this.character.tc = [0,0,0];
}

function losemove () {
    const [y,x] = this.character.pos;
    adduilabel("+",[y,x],[128,128,0],0,true,false,false);
    this.character.tc[0] = 0;
    this.character.tc[2] = 0;
    this.character.actionqueue = [];
}

function takedamage(amount = 1){
    return function(){
        this.character.hp-=amount;
    }
}

function damagebonus (bonus) {
    return function () {
        this.character.damagebonus += bonus;
        console.log(`damage bonus of ${this.character.damagebonus}`);
    }
}

function tohitbonus (bonus) {
    return function () {
        this.character.tohitbonus += bonus;
    }
}

function becomehostile () {
    let targetcharacter = null;
    for(let i = 0; i < playercs.length; i++){
        if(drawline(this.character.pos,playercs[i].pos) !== false && playercs[i].dead == false){
            if(targetcharacter == null){
                targetcharacter = playercs[i];
            }
            else if(dist(this.character.pos,playercs[i].pos) < dist(this.character.pos,targetcharacter.pos)){
                targetcharacter = playercs[i];
            }
        }
    }
    if(targetcharacter == null){
        return;
    }
    this.character.target = targetcharacter.pos.slice();
    if(this.character.state == "idle"){
        // addToLog(`the ${this.character.name} has become aggressive`);
    }
    if(this.character.state != "agro"){
        // this.character.state = "agro";
    }
}

function becomehostilelowesthp () {
    let targetcharacter = null;
    for(let i = 0; i < playercs.length; i++){
        if(drawline(this.character.pos,playercs[i].pos) !== false && playercs[i].dead == false){
            if(targetcharacter == null){
                targetcharacter = playercs[i];
            }
            else if(playercs[i].hp < targetcharacter.hp){
                targetcharacter = playercs[i];
            }
        }
    }
    if(targetcharacter == null){
        return;
    }
    this.character.target = targetcharacter.pos.slice();
    if(this.character.state == "idle"){
        // addToLog(`the ${this.character.name} has become aggressive`);
    }
    if(this.character.state != "agro"){
        this.character.state = "agro";
    }
}

//called from the scope of the action
function movefunc () {
    let char = this.character;
    const [y,x] = this.target;
    if(newgrid[y][x].traversable !== false && newgrid[y][x].character == null){
        newgrid[char.pos[0]][char.pos[1]].character = null;
        char.pos = [y,x];
        newgrid[y][x].character = this.character;
        removecondition(char,"Prone");
    }
    else{
        char.actionqueue = [];
        return(false);
    }
    // playsound();
}

function endturnfunc () {
    this.character.tc[0] = 0;
    this.character.tc[1] = 0;
    // adduilabel("end turn", this.character.pos, [256,256,256], 1, true, false, false, true);
}

function chatfunc () {
}

function switchweapon () {
    char = this.character;
    char.equipment.reverse();
    char.equipupdate();
    adduilabel(char.equipment[0].name, char.pos, char.color,1,true,false);
    if(char.equipment[0].drawsound) this.soundeffect = char.equipment[0].drawsound;
    this.loudness = 1;
    // return false;
}


function atkroll (char, target, pos, weapon) {
    if(!weapon){
        weapon = char.equipment[0]
    }
    const [y,x] = target;
    let extrinsmod = 0;
    let intrinsmod = char.getatkbonus(weapon);
    let modbreakdown = [];
    let errors = [];
    let defender = newgrid[y][x].character;
    let objecttarget = false;
    if(defender == null){
        defender = newgrid[y][x].objects[0];
        objecttarget = true;
    }
    //check for errors
    if(defender == null || defender.pc == char.pc){
        errors.push("No Target");
    } 
    if(weapon.range < dist(pos, target) ){
        errors.push("Out of range");
    }
    if(drawline(pos, target) === false){
        errors.push("Something in the way")
    }

    if(errors.length === 0){
        //check flanking
        const flanksquare = [y,x].map((element, index) => element-(pos[index]-element));
        const flanktile = newgrid[flanksquare[0]][flanksquare[1]];
        if(weapon.range < 2 && flanktile && flanktile.character && flanktile.character.pc == char.pc && (flanktile.character!==char)){
            modbreakdown.push("Flanked+10");
            extrinsmod+=2;
        }

        if(defender.pc == false && (!defender.visiblecharacters || !defender.visiblecharacters[char.index])){
            modbreakdown.push("Unaware+50");
            extrinsmod+=10;
        }
        if(defender.pc == true && (newgrid[pos[0]][pos[1]].visible == false)){
            modbreakdown.push("Unaware+50");
            extrinsmod+=10;
        }

        //check cover
        cover = drawline(pos,target);
        if(weapon.range > 1.9 && cover > 0){
            if(cover >= 0.5){
                modbreakdown.push("Three Quarters Cover-25");
                extrinsmod -=5;
            }
            else{
                modbreakdown.push("Half Cover-10");
                extrinsmod -=2;
            }
        }

        //check dim light
        if(newgrid[y][x].lightlevel < 2){
            modbreakdown.push("Dim Light-10");
            extrinsmod-=2;
        }

        //check min range
        if(dist(pos, target) < weapon.minrange){
            modbreakdown.push("Too Close-25");
            extrinsmod-=5;
        }   

        //check stunned
        if(lackscondition(conditions.Stunned,defender) == false){
            modbreakdown.push("Stunned+25");
            extrinsmod+=5;
        }

        //check prone
        if(lackscondition(conditions.Prone,defender) == false){
            modbreakdown.push("Prone+25");
            extrinsmod+=5;
        }

        //check surprised
        if(lackscondition(conditions.Surprised,defender) == false){
            modbreakdown.push("Surprised+10");
            extrinsmod+=2;
        }
    }

    let defenderac;
    if(defender) defenderac = defender.ac;
    const percenthitchance = Math.min((1-(((defenderac-(intrinsmod+extrinsmod))/20)))*100,100);
    const damagerange = char.getavdamage(weapon);
    const avdamageac10 = (takeav(damagerange)*(10+(intrinsmod+extrinsmod))/20);
    const atk = new AttackRoll(percenthitchance,damagerange,avdamageac10, intrinsmod, extrinsmod, defenderac, modbreakdown, errors);
    return(atk);
}

function darkattackpermute (attackroll) {
    let newattackroll = attackroll;
    for(let i = 0; i < attackroll.modbreakdown.length; i ++){
        if(attackroll.modbreakdown[i] == "Dim Light-10"){ 
            newattackroll.extrinsmod += 4;
            newattackroll.percenthitchance += 20;
            attackroll.modbreakdown[i] = "Dim Light+10";
            newattackroll.avdamageac10 = takeav(newattackroll.damagerange)*((10+(newattackroll.intrinsmod+newattackroll.extrinsmod))/20);
        }
    }
    return(newattackroll);
}

//called from the scope of the action
function attackfunc (hypothetical = false, weapon = null) {
    if(!weapon){
        weapon = this.character.equipment[0];
    }
    let func = (input) => input;
    if(this.character.specialattack != null)func=this.character.specialattack;
    let attack = func(atkroll(this.character, this.target, this.pos, weapon), this.target);
    if(hypothetical == true){
        return(attack);
    }
    const [y,x] = this.target;
    let defender = newgrid[y][x].character;
    if(!defender){
        defender = newgrid[y][x].objects[0];
    }
    if(attack.errors.length !== 0 && hypothetical == false){
        for(let i = 0; i < attack.errors.length; i ++){
            adduilabel(attack.errors[i], this.character.pos, [128,128,128], i+1, true, false, false, false);
        }
        // adduilabel(attack.errors[0], this.character.pos, [128,128,128], 1, true, false);
        this.character.actionqueue = [];
        return false;
    }
    if(attack.errors.length === 0 && hypothetical == false){
        rangedanimate(this.character.pos,defender.pos,convertAbstoColor(weapon.absorbtion));
        // this.character.tc = this.character.tc.map((element,index) => element-this.cost[index]);
        if(Math.random()*100 < attack.percenthitchance){
            for(let i = 0; i < attack.onhiteffects.length; i++){
                attack.onhiteffects[i]();
            }
            defender.damage(damage = randomNumber(attack.damagerange[1],attack.damagerange[0]));
            if(weapon.hitsound)this.soundeffect = weapon.hitsound;
        }
        else{
            adduilabel("Miss", this.target, [128,128,128], 1, true, false);
            this.soundcontent = "Miss";
            if(weapon.misssound)this.soundeffect = weapon.misssound;
        }
        if(attack.modbreakdown.length){
            for(let i = 0; i < attack.modbreakdown.length; i++){
                const mod = attack.modbreakdown[i];
                let textcolor = [128,128,128];
                for(let symboli = 0; symboli < mod.length; symboli++){
                    if(mod.charAt(symboli) == "+")textcolor = [0,64,0];
                    if(mod.charAt(symboli) == "-")textcolor = [64,0,0];
                }
                adduilabel(mod, [y,x], textcolor, i+2, true, false);
            }
        }
    }
}

function sneakattackpermute (attackroll) {
    attackroll.damagerange = attackroll.damagerange.map((element)=>element+Math.max(0,attackroll.extrinsmod));
    if(attackroll.extrinsmod > 0){
        attackroll.modbreakdown.push(`Sneak Attack+${attackroll.extrinsmod}dmg`);
    }
    return(attackroll);
}


function rangedanimate([starty,startx], [endy,endx], color){
    const symbol = linecharacter([starty,startx],[endy,endx]);
    let path = bresenhamLine([starty,startx],[endy,endx]);
    path.shift();
    addanimation(path, [symbol], color);
}

function linecharacter ([starty,startx], [endy,endx]){
    const difx = Math.abs(startx-endx);
    const dify = Math.abs(starty-endy);
    if(difx > 2*dify){
        symbol = "-";
    }
    else if(dify > 2*difx){
        symbol = "|";
    }
    else if(Math.sign(startx-endx) == Math.sign(starty-endy)){
        symbol = "\\";
    }
    else{
        symbol = "/";
    }
    return(symbol);
}

function conditionattackpermute (cond){
    return function (attackroll, [y,x]) {
        target = newgrid[y][x].character;
        if(target){
            attackroll.onhiteffects.push(addconditiondynamic(cond,true,target));
        }
        return(attackroll);
    }
}

function cleaveattack () {
    
}

function grenadeattack () {
    const [y,x] = this.target;
    const range = 1;
    const roundedrange = Math.floor(range);
    for(let localy = y-roundedrange; localy <= y+roundedrange; localy++){
        for(let localx = x-roundedrange; localx <= x+roundedrange; localx++){
            if(newgrid[localy][localx].character !== null && newgrid[localy][localx].character.pc !== this.character.pc){
                newgrid[localy][localx].character.damage(10);
            }
        }
    }
}

//called from the scope of the action
function dashfunc () {
    let char = this.character;
    // char.tc = char.tc.map((element,index) => element-this.cost[index]) 
    char.tc[0] += char.tcmax[0];
    const [y,x] = char.pos;
    adduilabel("Dash", char.pos, char.color,1,true);
}

function standgroundfunc () {
    let char = this.character;
    // char.tc = char.tc.map((element,index) => element-this.cost[index]) 
    char.tc[1] += char.tcmax[1];
    const [y,x] = char.pos;
    adduilabel("Stand Ground", char.pos, char.color,1,true);
}

//called from the scope of the trait
function oldattackofop(){
    const char = this.character;
    const [y,x] = char.pos;
    for(let localy = y-1; localy <= y+1; localy++){
        for(let localx = x-1; localx <= x+1; localx++){
            if(!newgrid[y] || !newgrid[y][x])continue;
            const charhere = newgrid[localy][localx].character;
            if(charhere !== null && charhere.actionqueue[0] && charhere.actionqueue[0].name == "Move" && charhere.pc !== char.pc){
                if(dist(char.pos,charhere.actionqueue[0].target)>1.8){
                    // adduilabel("Opportunity Attack", char.pos, [128,128,128], 1, true, false);
                    const attackfunction = actions.Attack;
                    let thisattack = (new Attack(...attackfunction, char.getrange(), charhere.pos,char, char.pos));
                    thisattack.cost = [0,0,1];
                    if(canAffordAction(thisattack, char)){
                        char.actionqueue.push(thisattack);
                        // move(char);
                        char.actionqueue.shift().func();
                        // char.tc = char.tc.map((element, index) => element-thisattack.cost[index]);
                    }
                }
            }
            else if(charhere && charhere.actionqueue[0] && charhere.actionqueue[0].name == "Attack" && charhere.pc !== char.pc){
                if(dist(charhere.pos,charhere.actionqueue[0].target)>1.8){
                    // adduilabel("Opportunity Attack", char.pos, [128,128,128], 1, true, false);
                    const attackfunction = actions.Attack;
                    let thisattack = (new Attack(...attackfunction, char.getrange(), charhere.pos,char, char.pos));
                    thisattack.cost = [0,0,1];
                    if(canAffordAction(thisattack, char)){
                        char.actionqueue.push(thisattack);
                        move(char);
                        // char.actionqueue.shift().func();
                        // char.tc = char.tc.map((element, index) => element-thisattack.cost[index]);
                    }
                }
            }
        }
    }
}

function checkforaoomove ([y,x], [ty,tx], char){
    for(let localy = y-1; localy <= y+1; localy++){
        for(let localx = x-1; localx <= x+1; localx++){
            if(newgrid[localy][localx] && newgrid[localy][localx].character && newgrid[localy][localx].character.pc !== char.pc){
                if(dist([ty,tx], [localy,localx]) > 1.8){
                    if(newgrid[localy][localx].character.tc[2]>0){
                        return(true);
                    }
                }
            }
        }
    }
    return(false);
}

function checkforaooattack ([y,x], [ty,tx], char){
    for(let localy = y-1; localy <= y+1; localy++){
        for(let localx = x-1; localx <= x+1; localx++){
            if(newgrid[localy][localx] && newgrid[localy][localx].character && newgrid[localy][localx].character.pc !== char.pc){
                if(dist([y,x], [ty,tx]) > 1.8){
                    if(newgrid[localy][localx].character.tc[2]>0){
                        return(true);
                    }
                }
            }
        }
    }
    return(false);
}

//called from the scope of the action
function startoverwatch () {
    const char = this.character;
    if(char.tc[2] < 1) return false;
    addconditiondynamic(conditions.Overwatch,true,char)();
    this.soundeffect = this.character.equipment[0].drawsound;
    if(char.pc == true){
        playerendturn();
    }
}

//called from the scope of the trait
function oldoverwatch () {
    const char = this.character;
    const [y,x] = char.pos;
    const range = char.getrange();
    const roundedrange = Math.floor(range);
    for(let localy = y-roundedrange; localy <= y+roundedrange; localy++){
        if(localy < 0 || localy >= mapsizey)continue;
        for(let localx = x-roundedrange; localx <= x+roundedrange; localx++){
            if(localx < 0 || localx >= mapsizex)continue;
            const charhere = newgrid[localy][localx].character;
            if(charhere !== null && charhere.pc !== char.pc && dist(char.pos, charhere.pos) <= range && drawline(char.pos, charhere.pos) !== false && (char.pc == false || newgrid[localy][localx].visible == true)){
                const attackfunction = actions.Attack;
                let thisattack = (new Attack(...attackfunction, char.getrange(), charhere.pos, char, char.pos));
                thisattack.cost = [0,0,1];
                if(canAffordAction(thisattack, char)){
                    char.actionqueue.push(thisattack);
                    move(char);
                }
                removecondition(char, "Overwatch");
            }
        }
    }
}

//called as a reaction
function overwatch (character, triggerer, trigger, hypothetical = false) {
    if(lackscondition(conditions.Overwatch,character)) return;
    if(activecharacternonindex.pc == character.pc) return;
    const char = character;
    const [y,x] = char.pos;
    const range = char.getrange();
    const roundedrange = Math.floor(range);
    for(let localy = y-roundedrange; localy <= y+roundedrange; localy++){
        if(localy < 0 || localy >= mapsizey)continue;
        for(let localx = x-roundedrange; localx <= x+roundedrange; localx++){
            if(localx < 0 || localx >= mapsizex)continue;
            const charhere = newgrid[localy][localx].character;
            if(charhere !== null && charhere.pc !== char.pc && dist(char.pos, charhere.pos) <= range && drawline(char.pos, charhere.pos) !== false && (char.pc == false || newgrid[localy][localx].visible == true)){
                if(hypothetical)return(false);
                const attackfunction = actions.Attack;
                let thisattack = (new Attack(...attackfunction, char.getrange(), charhere.pos, char, char.pos));
                thisattack.cost = [0,0,1];
                if(canAffordAction(thisattack, char)){
                    char.actionqueue.push(thisattack);
                    move(char);
                }
                removecondition(char, "Overwatch");
            }
        }
    }
}

function removecondition (char, condname) {
    for (let i = char.conditions.length - 1; i >= 0; i--) {
        if(char.conditions[i].name == condname){
            char.conditions.splice(i,1);
        }
    }
}

function damageoncontact () {

}

function open () {
    adduilabel("Open", this.character.pos, [1,1,1], 1, true, false);
    newgrid[this.target[0]][this.target[1]].objects = [];
    newgrid[this.target[0]][this.target[1]].updateObjects();
}

function canAffordAction(action, char) {
    return !char.tc.some((element, index) => element < action.cost[index]);
}

function burn () {
    const char = this.character;
    char.damage(1);
}

function objectburn (obj){
    const[y,x] = obj.pos;
    const char = newgrid[y][x].character;
    if(char !== null){
        addconditiondynamic(conditions.Burning, true, char)();
    }
}

function generatehuntmap(origin,enemy,range = 5){
    class mapnode{
        constructor(pos,parent,utility){
            this.pos = pos.slice();
            this.parent = parent;
            this.utility = utility;
        }
    }

    const [y,x] = origin;
    let nodequeue = new PriorityQueue((a,b) => b.utility - a.utility);
    nodequeue.enqueue(new mapnode([y,x],null,10));
    let nodemap = {};
    let thisdist = 0;
    let iterations = 0;
    while(!nodequeue.isEmpty() && iterations < 5000){
        iterations++;
        const thisnode = nodequeue.dequeue();
        thisdist = Math.abs(thisnode.utility-10);
        const thispos = thisnode.pos;
        const [thisy,thisx] = thispos;
        if(!nodemap[thisy]) nodemap[thisy] = {};
        if(!nodemap[thisy][thisx]){
            nodemap[thisy][thisx] = thisnode.utility;
            // newgrid[thisy][thisx].absorbtionBase = newgrid[thisy][thisx].absorbtionBase.map((element) => element*2);
            
        }
        else continue;
        directions.forEach(
            function (direction){
                const nextpos = thispos.map((element,index) => element+direction[index]);
                if(newgrid[nextpos[0]] && newgrid[nextpos[0]][nextpos[1]]){
                    const nexttile = newgrid[nextpos[0]][nextpos[1]];
                    let cost = nexttile.moveCost;
                    if(enemy.knowntiles[`${nextpos[0]},${nextpos[1]}`]){
                        const whenwesawtile = enemy.knowntiles[`${nextpos[0]},${nextpos[1]}`];
                        const rightnow = turncounter;
                        const howmuchwecare = 50;
                        const howlongago = rightnow-whenwesawtile;
                        if(chebyshevDistance(nextpos,origin) > 1)cost += 100;
                    }
                    // if(enemy.knowntiles[`${nextpos[0]},${nextpos[1]}`])cost+=10;
                    if(nexttile.traversable == true){
                        nodequeue.enqueue(new 
                            mapnode(
                                nexttile.pos,
                                thisnode,
                                thisnode.utility-cost
                            )
                        );
                    }
                    else{
                        if(!nodemap[nextpos[0]]) nodemap[nextpos[0]] = {};
                        if(!nodemap[nextpos[0]][nextpos[1]]){
                            nodemap[nextpos[0]][nextpos[1]] = -100;
                        }
                    }
                }
                else{
                    if(!nodemap[nextpos[0]]) nodemap[nextpos[0]] = {};
                    if(!nodemap[nextpos[0]][nextpos[1]]){
                        nodemap[nextpos[0]][nextpos[1]] = -100;
                    }
                }
            }
        )
    }
    // console.log(iterations);
    // Object.values(nodemap).forEach(
    //     function (node) {
    //         console.log(node);
    //         const [y,x] = node.pos;
    //         newgrid[y,x].absorbtionBase = [256-(node.utility*10),256-(node.utility*10),256-(node.utility*10)];
    //     }
    // )
    return(nodemap);
}

function generatefleemap(origins,enemy, range){
    class mapnode{
        constructor(pos,parent,distance){
            this.pos = pos.slice();
            this.parent = parent;
            this.distance = distance;
        }
    }
    let nodequeue = new PriorityQueue((a,b) => a.distance - b.distance);
    Object.values(origins).forEach(
        function (adversary) {
            const nodehere = new mapnode(adversary.lastseen, null, 0);
            nodequeue.enqueue(nodehere);
        }
    );
    let nodemap = {};
    while(!nodequeue.isEmpty()){
        thisnode = nodequeue.dequeue();
        if(thisnode.distance > range) break;
        const thispos = thisnode.pos;
        const [thisy,thisx] = thispos;
        if(nodemap[`${thisy},${thisx}`] === undefined){
            directions.forEach(
                function (dir){
                    const nextpos = thispos.map((element,index) => element+dir[index]);
                    if(newgrid[nextpos[0]]&&newgrid[nextpos[0]][nextpos[1]]){
                        const nexttile = newgrid[nextpos[0]][nextpos[1]];
                        if(nexttile.traversable == true && nodemap[`${nextpos[0]},${nextpos[1]}`] === undefined){
                            nodequeue.enqueue(new mapnode(nextpos,thisnode,(thisnode.distance+nexttile.moveCost)));
                        }
                    }
                }
            )
            nodemap[`${thisy},${thisx}`] = thisnode.distance;
        }
    }
    return(nodemap);
}

//#region Usecases

function moveusecase (thisnode, enemy, thisutility) {
    let move = thisnode.tc[0]
    let actions = thisnode.tc[1]
    let returnnodes = [];
    const [y,x] = thisnode.pos;
    if(move > 0){
        for(let localy = y-1; localy <= y+1; localy++){
            if(!newgrid[localy])continue;
            for(let localx = x-1; localx <= x+1; localx++){
                if(!newgrid[localy][localx] || newgrid[localy][localx].traversable !== true || newgrid[localy][localx].character !== null) continue;
                if(localx == x && localy == y) continue;
                const thisaction = new Move("Move", movefunc, [1,0,0], null, [localy,localx], enemy, thisnode.pos);
                const hypotc = subtractcost(thisaction,thisnode.tc);
                const hazards = thisaction.warnings.length;
                if(hypotc.some((element) => element < 0, hypotc)){
                    continue;
                } 
                returnnodes.push(new ActionNode([localy,localx], 
                    thisaction,
                    hypotc,
                    thisnode.hazards+hazards,
                    thisnode.damagepotential,
                    thisnode,
                    thisutility));
            }
        }
    }
    return(returnnodes);
}

function stompusecase (thisnode, enemy, thisutility) {
    let move = thisnode.tc[0]
    let actions = thisnode.tc[1]
    let returnnodes = [];
    const [y,x] = thisnode.pos;
    if(move > 0){
        for(let localy = y-1; localy <= y+1; localy++){
            if(!newgrid[localy])continue;
            for(let localx = x-1; localx <= x+1; localx++){
                if(!newgrid[localy][localx] || newgrid[localy][localx].traversable !== true || newgrid[localy][localx].character !== null) continue;
                if(localx == x && localy == y) continue;
                const thisaction = new Move("Move", movefunc, [1,0,0], null, [localy,localx], enemy, thisnode.pos);
                thisaction.loudness = 20;
                const hypotc = subtractcost(thisaction,thisnode.tc);
                const hazards = thisaction.warnings.length;
                if(hypotc.some((element) => element < 0, hypotc)){
                    continue;
                } 
                returnnodes.push(new ActionNode([localy,localx], 
                    thisaction,
                    hypotc,
                    thisnode.hazards+hazards,
                    thisnode.damagepotential,
                    thisnode,
                    thisutility));
            }
        }
    }
    return(returnnodes);
}

function alertusecase (thisnode, enemy, thisutility){
    let move = thisnode.tc[0]
    let actions = thisnode.tc[1]
    let returnnodes = [];
    const [y,x] = thisnode.pos;
    let alertaction = new action("Alert", chatfunc, [0,1,0], 0, thisnode.pos, enemy, thisnode.pos, []);
    alertaction.loudness = 20;
    let alertnode = new ActionNode(thisnode.pos, alertaction, subtractcost(alertaction,thisnode.tc), thisnode.hazards, thisnode.damagepotential, thisnode, thisutility);
    if(actions >= 1) returnnodes.push(alertnode);
    return(returnnodes);
}

function chatusecase (thisnode, enemy, thisutility){
    let move = thisnode.tc[0]
    let actions = thisnode.tc[1]
    let returnnodes = [];
    const [y,x] = thisnode.pos;
    let chataction = new action("Chat", chatfunc, [0,1,0], 0, thisnode.pos, enemy, thisnode.pos, [], soundeffects.goblinchat);
    chataction.loudness = 20;
    let chatnode = new ActionNode(thisnode.pos, chataction, subtractcost(chataction,thisnode.tc), thisnode.hazards, thisnode.damagepotential, thisnode, thisutility);
    if(actions >= 1) returnnodes.push(chatnode);
    return(returnnodes);
}

function attackusecase (thisnode, enemy, thisutility) {
    let move = thisnode.tc[0]
    let actions = thisnode.tc[1]
    let returnnodes = [];
    const [y,x] = thisnode.pos;
    if(actions < 1 || !enemy.knownenemies || enemy.knownenemies.length == 0)return(returnnodes);
    
    enemy.knownenemies.forEach(
        function (memory) {
            const adversary = memory.character;
            const pos = memory.lastseen;
            if(drawline(thisnode.pos, pos) !== false && adversary.dead == false && dist(thisnode.pos, pos) < enemy.getrange()){
                const hypotheticalattack = new Attack ("Attack", attackfunc, [0,1,0], enemy.getrange(), pos, enemy, thisnode.pos);
                const hypotheticalattackroll = hypotheticalattack.func(true, thisnode.activeweapon);
                const hypotc = subtractcost(hypotheticalattack, thisnode.tc);
                const hazards = hypotheticalattack.warnings.length;
                if(hypotheticalattackroll.errors.length > 0){
                }
                // console.log(hypotheticalattackroll.errors);
                // if(hypotheticalattackroll.errors.length == 0){
                    returnnodes.push(new ActionNode(
                        thisnode.pos,
                        hypotheticalattack, 
                        hypotc, 
                        thisnode.hazards+hazards, 
                        thisnode.damagepotential+hypotheticalattackroll.avdamageac10, 
                        thisnode,
                        thisutility))
                // }
            }
        }
    );
    // if(enemy.equipment.length > 1){
    //     const switchaction = new action ("Switch Weapon", switchweapon, [0,0,0], 0, thisnode.pos, enemy, thisnode.pos);
    //     const switchweap = new ActionNode(thisnode.pos, switchaction, thisnode.tc.slice(), thisnode.hazards, thisnode.damagepotential, thisnode, thisnode.parentutility, enemy.equipment[1]);

    // for(let i = 0; i < playercs.length; i ++){
    //         if(drawline(thisnode.pos,playercs[i].pos) !== false && playercs[i].dead == false && dist(thisnode.pos,playercs[i].pos)<=enemy.getrange(enemy.equipment[1])){
    //             const hypotheticalattack = new Attack ("Attack", attackfunc, [0,1,0], enemy.getrange(enemy.equipment[1]), playercs[i].pos, enemy, thisnode.pos);
    //             const hypotheticalattackroll = hypotheticalattack.func(true, enemy.equipment[1]);
    //             const hypotc = subtractcost(hypotheticalattack, thisnode.tc);
    //             const hazards = hypotheticalattack.warnings.length;
    //             if(hypotheticalattackroll.errors.length == 0){
    //                 returnnodes.push(new ActionNode(
    //                     thisnode.pos,
    //                     hypotheticalattack, 
    //                     hypotc, 
    //                     thisnode.hazards+hazards, 
    //                     thisnode.damagepotential+hypotheticalattackroll.avdamageac10, 
    //                     switchweap,
    //                     thisutility))
    //             }
    //         }
    //     }
    // }
    return(returnnodes);
}

function dashusecase (thisnode, enemy, thisutility) {
    let move = thisnode.tc[0]
    let actions = thisnode.tc[1]
    let returnnodes = [];
    const [y,x] = thisnode.pos;
    if(actions > 0 && move <= 0){
            let thisaction = new action("Dash", dashfunc, [0,enemy.tcmax[1],0], 0, enemy.pos, enemy, thisnode.pos)
            let hypotc = subtractcost(thisaction,thisnode.tc);
            hypotc[0] += enemy.tcmax[0];
            let newnode = new ActionNode(thisnode.pos,
                thisaction, 
                hypotc, 
                thisnode.hazards,
                thisnode.damagepotential, 
                thisnode, 
                thisutility)
            returnnodes.push(newnode);
        }
    return(returnnodes);

}

function standgroundusecase (thisnode, enemy, thisutility){
    let move = thisnode.tc[0]
    let actions = thisnode.tc[1]
    let returnnodes = [];
    const [y,x] = thisnode.pos;
    if(actions == 0 && move == enemy.tcmax[0]){
        let thisaction = new action("Stand Ground", standgroundfunc, [enemy.tcmax[0],0,0], 0, enemy.pos, enemy, thisnode.pos)
        let hypotc = subtractcost(thisaction,thisnode.tc);
        hypotc[1] += enemy.tcmax[1];
        // console.log(hypotc);
        let newnode = new ActionNode(thisnode.pos, 
            thisaction, 
            hypotc, 
            thisnode.hazards, 
            thisnode.damagepotential, 
            thisnode,
            thisutility)
        returnnodes.push(newnode);
    }
    return(returnnodes);
}

//#endregion

//#region Utility funcs
function defaultidle (thisnode, enemy) {
    let utility = 0;
    //this function gets handed a node from the turn planner
    //this function's purpose is to tell the turn planner how we feel about that possible action
    //the possible actions the turn planner tries are plucked from the state
    //in the idle state enemies consider the move action and the chat action
    //right now the enemytick function doesn't consider our turn done until we've used all our move and all our action
    //if I'm not going to change that right now, I should just make the idle utility function operate like the hostile one
    //it should use all move and all actions
    // if(thisnode.action && thisnode.action.name == "Chat"){
    //     return(1000);
    // }
    if(Math.random() > 0.99){
        return(1000);
    }
    // if(thisnode.tc[0] == 0 && thisnode.tc[1] == 0){
    //     return(1000);
    // }
    return(utility);
}

function defaulthostile (thisnode, enemy){
    if(thisnode.parentnode == null){
        enemy.knownenemies = [];
        Object.values(enemy.visiblecharacters).forEach(
            function (adversary) {
                if(adversary.character.pc !== enemy.pc){
                    enemy.knownenemies.push(adversary);
                    // adduilabel("x",adversary.lastseen,[256,0,0],0,true,false,false,true);
                }
            }
        );
    }
    let utility = 0;

    //hazards is a positive number representing number of times we will be subject to damage
    const hazards = thisnode.hazards;

    //damage potential is a positive number representating the av damage we will do this round (assuming ac10 of all targets)
    const damagepotential = thisnode.damagepotential;

    //temperment factor is a negative number representing the distance from where we want to be
    const tempermentfactor = defaulttemperment(thisnode, enemy);

    utility -= hazards*100;
    utility += damagepotential*10;
    utility += tempermentfactor;
    // console.log(`hazards:${hazards} damagepotential:${damagepotential} tempermentfactor:${tempermentfactor}`);
    return(utility);
    
}

function defaulthunting (thisnode, enemy){
    const [y,x] = thisnode.pos;
    let parentutility = 0;
    if(thisnode.parentnode!== null){parentutility = thisnode.parentutility};
    // const [ty,tx] = thisnode.action.target;
    if(thisnode.parentnode == null && !enemy.huntmap){
        //we are starting our turn
        //we don't see anybody
        //we want to hunt down the last enemies we saw
        let closest = 99;
        let target;
        Object.values(enemy.huntedcharacters).forEach(
            function (memory) {
                const pos = memory.lastseen;
                const char = memory.character;
                const maxdist = chebyshevDistance(thisnode.pos,pos) + memory.getage()*4;
                if(maxdist < closest) {
                    closest = maxdist;
                    target = memory;
                }
            }
        );
        if(target){
            enemy.hunted = target;
            enemy.huntmap = generatehuntmap(target.lastseen,enemy,20);
            // console.log(enemy.huntmap);
        }
        return(0);
    }
    if(enemy.huntmap && enemy.huntmap[y] && enemy.huntmap[y][x]){
        return(chebyshevDistance([y,x],enemy.pos)*10);
    }
    else{
        return(chebyshevDistance([y,x],enemy.pos) + Math.random()*3);
    }
    // return(chebyshevDistance(thisnode.pos,enemy.pos));
    //call a function that creates a djikstra map from the location that the character was last seen.
    //treat tiles you are looking at now as non-traversable walls for the purposes of that Djikstra map
    //for depth first, just create a utility function that wants to get as far along the Djikstra map as possible
    //for breadth first... let's just start with depth first lmao
}

function defaultfleeing (thisnode, enemy){
    const [y,x] = thisnode.pos;
    let utility = 0;
    if(thisnode.parentnode == null){
        enemy.knownenemies = [];
        Object.values(enemy.visiblecharacters).forEach(
            function (adversary) {
                if(adversary.character.pc !== enemy.pc){
                    enemy.knownenemies.push(adversary);
                }
            }
        );
        enemy.fleemap = generatefleemap(enemy.knownenemies,enemy, 20);
    }
    if(enemy.fleemap && enemy.fleemap[`${y},${x}`]){
        utility += enemy.fleemap[`${y},${x}`];
    }
    else{
        return(1000);
    }
    if(thisnode.hazards > 0){
        utility -= thisnode.hazards*5;
    }
    if(thisnode.damagepotential > 0){
        utility+=thisnode.damagepotential;
    }
    if(utility > 10 && thisnode.action && thisnode.action.name == "Alert"){
        utility += 20;
    }
    return(utility);
}

//#endregion

//#region Temperments
function defaulttemperment (thisnode, enemy) {
    const weapon = thisnode.activeweapon;
    const [y,x] = thisnode.pos;
    let closest = 9999;
    let range = Math.floor(weapon.range);
    enemy.knownenemies.forEach(
        function (memory){
            const adversary = memory.character;
            const pos = memory.lastseen;
            const thisdist = Math.floor(dist(pos,[y,x]));
            if(thisdist < closest){
                closest = thisdist;
            }
        }
    );
    // for(let i = 0; i < playercs.length; i++){
    //     if(playercs[i].dead == true) continue;
    //     const thisdist = Math.floor(dist(playercs[i].pos,[y,x]));
    //     if(thisdist < closest){
    //         closest = thisdist;
    //     }
    // }
    let error = Math.abs(closest - range);
    if(closest <= weapon.minrange) error = 50;
    return(-error);
}

function fleeingtemperment (thisnode, enemy) {
    const [y,x] = thisnode.pos;
    let closest = 9999;
    enemy.knownenemies.forEach(
        function (memory){
            const adversary = memory.character;
            const pos = memory.lastseen;
            const thisdist = Math.floor(dist(pos,[y,x]));
            if(thisdist < closest){
                closest = thisdist;
            }
        }
    );
    return(-closest);
}
//#endregion

//#region enemy reactions
function spot (enemy, triggerer, action) {
    
    if(triggerer && triggerer.index == enemy.index)return;
    if(triggerer && triggerer.pc == enemy.pc)return;

    enemy.getvisibletiles();

    enemy.visiblecharacters = {};

    enemy.visibletiles.forEach(
        function (tile) {
            const [y,x] = tile.pos;
            if(tile.character !== null && !tile.character.dead){
                const char = tile.character;
                let pos = char.pos.slice();
                if(triggerer && char.index == triggerer.index && action.name == "Move"){
                    pos = action.target;
                }
                // adduilabel("s",pos,[256,256,256],0,true,false,false,true);

                enemy.visiblecharacters[char.index] = new CharacterMemory(char, pos.slice());
                if(char.pc == true && enemy.knowncharacters[char.index]){
                    if(enemy.knowncharacters[char.index].lastseen[0] != enemy.visiblecharacters[char.index].lastseen[0] || enemy.knowncharacters[char.index].lastseen[1] != enemy.visiblecharacters[char.index].lastseen[1]){
                        // console.log("Somebody moved");
                        // adduilabel("You moved", enemy.pos, [256,256,256], 2, true, false, false, true);
                        enemy.actionqueue = [];
                    }
                }
                if(!enemy.knowncharacters[char.index] && char.pc == true){
                    // adduilabel("You're new ", enemy.pos, [256,256,256], 2, true, false, false, true);
                    enemy.actionqueue = [];

                }
                enemy.knowncharacters[char.index] = new CharacterMemory(char, pos.slice());
            }
            if(enemy.state.name == enemy.states[2].name){
                if(enemy.huntmap && enemy.huntmap[y] && enemy.huntmap[y][x]){
                    delete enemy.huntmap[y][x];
                }
            }
        }
    );

    Object.keys(enemy.knowncharacters).forEach(
        function (element) {
            if(!enemy.visiblecharacters[element] && enemy.knowncharacters[element].character.pc == true){
                if(drawline(enemy.pos,enemy.knowncharacters[element].lastseen) === false){
                    // console.log("still haven't seen them yet. Assume they haven't moved");
                    let char = enemy.knowncharacters[element].character;
                    let lastseen = enemy.knowncharacters[element].lastseen;
                    enemy.visiblecharacters[element] = new CharacterMemory(char,lastseen);
                }
                else{
                    const char = enemy.knowncharacters[element].character;
                    const pos = enemy.knowncharacters[element].lastseen;
                    enemy.huntedcharacters[element] = new CharacterMemory(char, pos);
                    delete enemy.knowncharacters[element];
                    // adduilabel("You're not here", enemy.pos, [256,256,256], 2, true, false, false, true);
                    enemy.actionqueue = [];
                }
                // if(enemy.knowncharacters[element].character.pc !== enemy.pc){
                    // enemy.tasks.push(new Task(enemy.knowncharacters[element].lastseen));
                // }
                // console.log(`we know of ${enemy.knowncharacters[element].character.name}, but we can't see them. we last saw them at ${enemy.knowncharacters[element].lastseen}`);
            }
            if(enemy.knowncharacters[element] && enemy.knowncharacters[element].character.pc == true){
                enemyknown = true;
            }
        }
    );
    enemy.updatestate();
}

function attackofop (enemy, triggerer, trigger) {
    if(!triggerer || triggerer.pc == enemy.pc)return;
    if(chebyshevDistance(triggerer.pos,enemy.pos) == 1 && trigger.name == "Move" && chebyshevDistance(trigger.target, enemy.pos) > 1){
        let reactattack = new Attack("Attack", attackfunc, [0,0,1], enemy.getrange(), triggerer.pos, enemy, enemy.pos);
        if(enemy.actionqueue.length > 0){
            console.log(`this enemy is making a reaction, and their action queue wasn't empty`);
            console.log(enemy);
            enemy.aq = [];
        }
        if(canAffordAction(reactattack,enemy)){
            enemy.actionqueue.push(reactattack);
            move(enemy);
        }
    }
    else if(chebyshevDistance(triggerer.pos,enemy.pos) == 1 && trigger.name == "Attack" && chebyshevDistance(trigger.target, triggerer.pos) > 1){
        let reactattack = new Attack("Attack", attackfunc, [0,0,1], enemy.getrange(), triggerer.pos, enemy, enemy.pos);
        if(enemy.actionqueue.length > 0){
            console.log(`this enemy is making a reaction, and their action queue wasn't empty`);
            console.log(enemy);
            enemy.aq = [];
        }
        if(canAffordAction(reactattack,enemy)){
            enemy.actionqueue.push(reactattack);
            move(enemy);
        }
    }
}

function spot2 ([y,x]) {
    const tile = newgrid[y][x];
    let candidatetiles = [];
    candidatetiles.push(tile);
    let exploredtiles = {};
    visiblecharacters = [];
    let iterations = 0;
    
    while(candidatetiles.length > 0 && iterations < 400){
        iterations++;
        const thistile = candidatetiles.shift();
        const [thisy,thisx] = thistile.pos;
        if(drawline([thisy,thisx],[y,x]) !== false){
            if(thistile.character !== null && (thisy!==y || thisx!==x))(visiblecharacters.push(thistile.character));
            for(let localy = thisy-1; localy <= thisy+1; localy++){
                for(let localx = thisx-1; localx <= thisx+1; localx++){
                    if(!exploredtiles[localy]) exploredtiles[localy] = {};
                    if(!exploredtiles[localy][localx]){
                        exploredtiles[localy][localx] = 1;
                        candidatetiles.push(newgrid[localy][localx]);
                    }
                }
            }
        }
    }
    return(visiblecharacters);
}

function hear(sound, permute = true, extradelay = 0) {
    let start = performance.now();
    if (chebyshevDistance(sound.pos, viewportpos) > sound.volume + 20) {
        return [];
    }

    class MapNode {
        constructor(pos, volume) {
            this.pos = pos;
            this.volume = volume;
        }
    }
    const [oy, ox] = sound.pos;

    let audibleCharacters = [];
    const originNode = new MapNode(sound.pos, sound.volume);
    let candidateNodes = new PriorityQueue((a, b) => b.volume - a.volume);
    candidateNodes.enqueue(originNode);
    let exploredTiles = new Set();
    let iterations = 0;
    let audible = false;
    if(sound.origin.pc == true) audible = true;
    let animationtiles = [];
    extradelay = 0;

    while (!candidateNodes.isEmpty() && iterations < 900) {
        iterations++;
        const thisNode = candidateNodes.dequeue();
        const [y, x] = thisNode.pos;
        const thisTile = newgrid[y][x];
        const char = thisTile.character;

        const tileKey = `${y},${x}`;
        if (exploredTiles.has(tileKey)) continue;
        exploredTiles.add(tileKey);

        if (thisTile.traversable && (sound.origin.pc || true)) {
            animationtiles.push([y,x,thisNode.volume]);
        //     setTimeout(() => {
        //         adduilabel("$", [y, x], [thisNode.volume / 50, thisNode.volume / 50, thisNode.volume / 50], 0, true, false, false, true, 0.2);
        //     }, (sound.volume - thisNode.volume) * 50);
        }

        if (thisNode.volume >= 1) {
            // if (char !== null && (y !== oy || x !== ox)) {
            if (char !== null) {
                if(char.pc == true){ 
                    audible = true;
                    if(extradelay == 0) extradelay = (sound.volume - thisNode.volume) * 50;
                }
                audibleCharacters.push(char);
                if (permute) char.hear(sound, thisNode.volume);
            }

            for (const dir of directions) {
                const [localY, localX] = thisNode.pos.map((element, index) => element + dir[index]);
                const localTileKey = `${localY},${localX}`;
                if (!exploredTiles.has(localTileKey)) {
                    let cost = 1;
                    if (newgrid[localY][localX].traversable == false) {
                        cost = 10;
                    }
                    if (Math.abs(localY - y) !== 0 && Math.abs(localX - x) !== 0) {
                        cost *= 1.4;
                    }
                    candidateNodes.enqueue(new MapNode([localY, localX], thisNode.volume - cost));
                }
            }
        }
    }
    if(newgrid[oy][ox].visible == true)extradelay = 0;
    if(audible == true){
        animationtiles.forEach(
            function (tile){
                const [y,x,volume] = tile;
                if(newgrid[y][x].visible == true){
                    setTimeout(() => {
                        adduilabel("$", [y, x], [volume / 100, volume / 100, volume / 100], 0, true, false, false, false, 0.2);
                    }, (((sound.volume - volume) * 50) + extradelay));
                }
            }
        )
    }
    let end = performance.now();
    // console.log(`hear took ${end-start} time to run`);
    return audibleCharacters;
}
//#endregion reactions