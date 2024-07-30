iterationsarr = [];
class character {
    constructor(pos, name, stats, maxhp, tcmax, pc, symbol, color, ac, traits, equipment, specialattack){
        this.pos = [];
        this.pos = pos.slice();
        this.name = name;
        this.stats = stats || [0,0,0];
        this.maxhp = maxhp;
        this.hp = maxhp;
        this.tcmax = tcmax.slice();
        this.tc = this.tcmax.slice();
        this.pc = pc;
        this.symbol = symbol;
        this.dead = false;
        this.actionqueue = [];
        this.target = pos.slice();
        this.color = color.slice();
        this.ac = ac;
        this.traits = traits.map(traitData => new trait(traitData.name, traitData.trigger, traitData.effect, traitData.active, traitData.passive, this));
        this.conditions = [];
        this.condresists = [];
        newgrid[this.pos[0]][this.pos[1]].character = this;
        this.equipment = equipment.slice() || [];
        this.specialattack = specialattack || null;
        // this.actions = actions.slice() || [];
        this.lightsources = [];
        // if(this.equipment.length > 0){
        //     this.actions.push(this.equipment[0].action);
        // }
        this.index = characterindex;
        characterindex++;
        this.visibletiles = [];
        // this.getvisibletiles();
        this.reactions = [attackofop, overwatch];
    }

    damage(dam){
        adduilabel(dam.toString(),this.pos,[128,0,0],1,true);
        addToLog(`${this.symbol} hit for ${dam}`);
        this.hp -= dam;
        if(this.hp <= 0){
            this.die();
        }
    }

    die(){
        this.actionqueue = [];
        let deathsound = null;
        if(this.deathsound) deathsound = this.deathsound;
        this.actionqueue.push(new action("Die", (i) => i, [0,0,0], 0, this.pos, this, this.pos, [], deathsound, 6));
        move(this);
        this.dead = true;
        adduilabel("x",this.pos,[128,0,0],0,true);
        this.color[1] *= 0.5;
        this.color[2] *= 0.5;
        this.color[0] *= 0.5;
        newgrid[this.pos[0]][this.pos[1]].addObject(
            new object("Corpse", this.symbol, convertColortoAbs(this.color).map((element) => element/2),[0.5,0.1,0.1], 0, true, 0));
        // newgrid[this.pos[0]][this.pos[1]].items.push(this.equipment[0]);
    }

    equipupdate(){
        // this.actions = [];
        // this.actions.push(this.equipment[0].action);
    }

    getatkbonus(weapon = this.equipment[0]){
        const bonus = weapon.bonus + this.stats[weapon.stat];
        return(bonus);
    }

    getdamage(){
        const weapon = this.equipment[0];
        const bonus = weapon.bonus+this.stats[weapon.stat];
        const damage = roll(weapon.damagedie,bonus);
        return(damage);
    }

    getavdamage(weapon = this.equipment[0]){
        const bonus = weapon.bonus+this.stats[weapon.stat];
        const damagerange = [1+bonus,weapon.damagedie+bonus];
        return(damagerange);
    }

    getrange(weapon = this.equipment[0]){
        return(weapon.range);
    }

    getvisibletiles() {
        const [y, x] = this.pos;
        const thischar = this;
        let visibletiles = [];
        let candidatetiles = [];
        let exploredtiles = new Set();
        candidatetiles.push(newgrid[y][x]);
        let iterations = 0;
    
        // Remove visible character references
        if (this.visibletiles.length > 0) {
            this.visibletiles.forEach(tile => tile.removevisiblecharacter(thischar));
        }
            
        while (candidatetiles.length > 0 && iterations < 10000) {
            iterations++;
            const thistile = candidatetiles.shift();
            const [thisy, thisx] = thistile.pos;
    
            if (drawline([y, x], [thisy, thisx]) !== false) {
                visibletiles.push(thistile);
                thistile.addvisiblecharacter(thischar);
                const tilekey = `${thistile.pos[0]},${thistile.pos[1]}`;
                thischar.knowntiles[tilekey] = turncounter;
    
                for (let localy = thisy - 1; localy <= thisy + 1; localy++) {
                    for (let localx = thisx - 1; localx <= thisx + 1; localx++) {
                        const tileKey = `${localy},${localx}`;
                        if (!exploredtiles.has(tileKey)) {
                            exploredtiles.add(tileKey);
                            candidatetiles.push(newgrid[localy][localx]);
                        }
                    }
                }
            }
        }
        
        this.visibletiles = visibletiles;
    }

    getplayerviewold () {
        const [y,x] = this.pos
        const origin = [y,x];
        let visibletiles = [];
        let exploredtiles = {};
        let tilequeue = [];
        tilequeue.push(newgrid[y][x]);
        let iterations = 0;

        class IntervalNode {
            constructor(min, max, distance) {
                this.min = min;
                this.max = max;
                this.distance = distance;
                this.left = null;
                this.right = null;
            }
        }
        
        class IntervalTree {
            constructor() {
                this.root = null;
            }
        
            insert(min, max, distance) {
                const newNode = new IntervalNode(min, max, distance);
                if (this.root === null) {
                    this.root = newNode;
                } else {
                    this.root = this._insert(this.root, newNode);
                }
            }
        
            _insert(node, newNode) {
                if (newNode.min < node.min) {
                    if (node.left === null) {
                        node.left = newNode;
                    } else {
                        node.left = this._insert(node.left, newNode);
                    }
                } else {
                    if (node.right === null) {
                        node.right = newNode;
                    } else {
                        node.right = this._insert(node.right, newNode);
                    }
                }
                return node;
            }
        
            find(angle) {
                return this._find(this.root, angle);
            }
        
            _find(node, angle) {
                if (node === null) {
                    return null;
                }
                if (angle >= node.min && angle <= node.max) {
                    return node.distance;
                }
                if (angle < node.min) {
                    return this._find(node.left, angle);
                } else {
                    return this._find(node.right, angle);
                }
            }

                    // Public method to find the maximum distance within a range of angles
            findMaxDistanceInRange(minAngle, maxAngle) {
                return this._findMaxDistanceInRange(this.root, minAngle, maxAngle);
            }

            // Internal method for recursive range query
            _findMaxDistanceInRange(node, minAngle, maxAngle) {
                if (node === null) {
                    return -99;
                }

                // If the node's interval is completely outside the range
                if (node.max < minAngle || node.min > maxAngle) {
                    return -99;
                }

                // If the node's interval is completely within the range
                if (node.min >= minAngle && node.max <= maxAngle) {
                    return node.maxDistance;
                }

                // If the node's interval partially overlaps the range
                let maxDistance = -99;
                if (node.min <= maxAngle && node.max >= minAngle) {
                    maxDistance = node.distance;
                }

                // Check both subtrees
                maxDistance = Math.max(maxDistance,
                    this._findMaxDistanceInRange(node.left, minAngle, maxAngle),
                    this._findMaxDistanceInRange(node.right, minAngle, maxAngle));
                return maxDistance;
            }
        }

        // let fov = new IntervalTree();
        let fov = new Array(360).fill(99);

        function fovarc(A, B) {
            // Coordinates of A and B
            let [ay, ax] = A;
            let [by, bx] = B;
        
            // Corners of the wall tile at B (with B as center)
            let corners = [
                [by - 0.5, bx - 0.5],
                [by + 0.5, bx - 0.5],
                [by - 0.5, bx + 0.5],
                [by + 0.5, bx + 0.5]
            ];
        
            // Calculate angles to each corner
            let angles = corners.map(([y, x]) => {
                let angleRad = Math.atan2(x - ax, y - ay); // Calculate angle in radians
                let angleDeg = angleRad * (180 / Math.PI); // Convert radians to degrees
                angleDeg = (angleDeg + 360) % 360; // Ensure angle is within 0-360 degrees
                return Math.round(angleDeg); // Round to the nearest degree
            });

            // Find the min and max angles
            let minAngle = Math.min(...angles);
            let maxAngle = Math.max(...angles);

            if(Math.abs(minAngle - maxAngle) > 270){
                return([minAngle, minAngle, chebyshevDistance(A,B)]);
            }

            return([minAngle, maxAngle, chebyshevDistance(A,B)]);
        
            // Calculate the arc of the field of view
            // let arc = maxAngle - minAngle;
        
            // return arc;
        }

        function checkfov (tile){
            const [thisy,thisx] = tile.pos;
            const arc = fovarc(origin, tile.pos);
            console.log(fov);
            // console.log(fov.findMaxDistanceInRange(arc[0],arc[1]));
            const query = fov.findMaxDistanceInRange(arc[0],arc[1]);
            // console.log(query);
            if(query >= arc[2] || query === -99){
                // visibletiles.push(tile);
                return true;
            }
            // if(!fov.find(takeav([arc[0],arc[1]]))){
            //     return true;
            // }
            // if(fov.find(takeav([arc[0],arc[1]])) >= arc[2]){
            //     return true;
            // }
            return false;
        }
        
        function fovcheck (tile) {
            const arc = fovarc(origin, tile.pos);
            for(let i = arc[0]; i <= arc[1]; i++){
                if(arc[2] <= fov[i]){
                    // console.log(fov[i]);
                    return true;
                }
            }
            return false;
        }

        while(tilequeue.length > 0 && iterations < 5000){
            let thistile = tilequeue.shift();
            const [thisy,thisx] = thistile.pos;
            iterations ++;
            visibletiles.push(thistile);
            newgrid[thisy][thisx].symbolBase = "q";
            if(fovcheck(thistile) == false){
                continue;
            }
            newgrid[thisy][thisx].symbolBase = "e";
            if(thistile.readOpacity() < 1){
                for(let localy = thisy-1; localy <= thisy+1; localy++){
                    for(let localx = thisx-1; localx <= thisx+1; localx++){
                        if(!exploredtiles[localy]) exploredtiles[localy] = {};
                        if(!exploredtiles[localy][localx]){
                            exploredtiles[localy][localx] = 1;
                            tilequeue.push(newgrid[localy][localx]);
                        }
                    }
                }
            }
            if(thistile.readOpacity() >= 1){
                let arc = fovarc(origin,thistile.pos);

                for(let i = arc[0]; i <= arc[1]; i++){
                    // newgrid[thisy][thisx].symbolBase = "q";
                    fov[i] = Math.min(fov[i],arc[2]);
                }

                // fov.insert(...arc);

                // console.log(arc);
                //we hit a wall
                //record the two angles that describe the arc of our FOV that this tile takes up
                //record the chebyshev distance to this tile
                //update our FOV to reflect this
                //add floor tiles that satisfy the criteria here?

            }
        }

        // function gettile ([y,x]){
        //     const [ry,rx] = [Math.round(y),Math.round(x)];
        //     if(newgrid[ry]&&newgrid[ry][rx])return(newgrid[ry][rx]);
        // }

        // function signnumber (num){
        //     if(num > 0){
        //         return(1);
        //     }
        //     if(num < 0){
        //         return(-1);
        //     }
        //     if(num == 0){
        //         return(0);
        //     }
        // }
        // function dumbmatrix ([y,x]){
        //     return([-x,y]);
        // }

        // let rayqueue = [];
        // let surfacequeue = [];
        // rayqueue.push([0,1]);
        // let iterations = 0;
        // while(rayqueue.length > 0 && iterations < 5000){
        //     iterations++;
        //     surfacequeue.push(castray(rayqueue.shift()));
        //     while(surfacequeue.length > 0 && iterations < 500){
        //         iterations++
        //         const [tile,face] = surfacequeue.shift();
        //         //the point we start with is a fractional point
        //         //the tile's position is the whole number part,
        //         //but the face is fractionally removed
        //         //we want to cast another ray clockwise from where we just hit
        //         const [ty,tx] = tile.pos;
        //         if(!exploredtiles[ty])exploredtiles[ty] = {};
        //         if(!exploredtiles[ty][tx])exploredtiles[ty][tx] = 1;
        //         // else{break};
        //         const next = dumbmatrix(face);
        //         console.log(next);
        //         let newpoint = tile.pos.map((element,index) => element+(next[index]*length));
        //         let dy = newpoint[0]-y;
        //         let dx = newpoint[1]-x;
        //         let slopeconversion = Math.sqrt(dy**2 + dx**2);
        //         let convertedslope = [dy/slopeconversion,dx/slopeconversion];
        //         let possiblenextnode = castray(convertedslope);
        //         surfacequeue.push(possiblenextnode);

        //         // console.log(castray(convertedslope));
                
        //         //we are at the point [ty+face[0]/2,tx+face[1]/2]
        //         //we want to find the next point on the surface going clockwise
        //     }
        //     function castray(dir){
        //         let [ry,rx] = [y,x];
        //         while(true){

        //             ry+=dir[0]*length;
        //             rx+=dir[1]*length;
        //             const tile = gettile([ry,rx]);
        //             visibletiles.push(tile);
        //             if(tile.readOpacity() >= 1){
        //                 //we hit a wall here


        //                 //let's figure out which surface we hit`
        //                 const dy = ry-y;
        //                 const dx = rx-x;
        //                 let face = [0,0];
        //                 if(Math.abs(dy)>1*Math.abs(dx)) face = [signnumber(dy),0];
        //                 if(1*Math.abs(dy)<Math.abs(dx)) face = [0,signnumber(dx)];
        //                 else{face = [signnumber(dy),signnumber(dx)];}
        //                 // if(Math.abs(dy)==Math.abs(dx)) face = [signnumber(dy),signnumber(dx)];
        //                 return([tile,face]);
        //             }
        //         }
        //     }
        // }
        visibletiles.forEach(
            function (tile) {
                // tile.symbolBase = "e";
            }
        )
        // console.log(fov);
        return(visibletiles);
    }

    getplayerview () {
        const [y,x] = this.pos
        const origin = [y,x];
        let visibletiles = [];
        let exploredtiles = {};
        let tilequeue = [];
        tilequeue.push(newgrid[y][x]);
        let iterations = 0;
        let fov = new Array(360).fill(99);
        

        function fovarc(A, B) {
            // Coordinates of A and B
            let [ay, ax] = A;
            let [by, bx] = B;
        
            // Corners of the wall tile at B (with B as center)
            let corners = [
                [by - 0.5, bx - 0.5],
                [by + 0.5, bx - 0.5],
                [by - 0.5, bx + 0.5],
                [by + 0.5, bx + 0.5]
            ];
        
            // Calculate angles to each corner
            let angles = corners.map(([y, x]) => {
                let angleRad = Math.atan2(x - ax, y - ay); // Calculate angle in radians
                let angleDeg = angleRad * (180 / Math.PI); // Convert radians to degrees
                angleDeg = (angleDeg + 360) % 360; // Ensure angle is within 0-360 degrees
                return Math.round(angleDeg); // Round to the nearest degree
            });

            // Find the min and max angles
            let minAngle = Math.min(...angles);
            let maxAngle = Math.max(...angles);

            if(Math.abs(minAngle - maxAngle) > 270){
                return([minAngle, minAngle, chebyshevDistance(A,B)]);
            }

            return([minAngle, maxAngle, chebyshevDistance(A,B)]);
        
            // Calculate the arc of the field of view
            // let arc = maxAngle - minAngle;
        
            // return arc;
        }

        function fovcheck (tile) {
            const arc = fovarc(origin, tile.pos);
            for(let i = arc[0]; i <= arc[1]; i++){
                if(arc[2] <= fov[i]){
                    return true;
                }
            }
            return false;
        }

        
        while(tilequeue.length > 0 && iterations < 500){
            let thistile = tilequeue.shift();
            const [thisy,thisx] = thistile.pos;
            iterations ++;
            visibletiles.push(thistile);
            if(fovcheck(thistile) == false){
                continue;
            }
            if(thistile.readOpacity() < 1){
                for(let localy = thisy-1; localy <= thisy+1; localy++){
                    for(let localx = thisx-1; localx <= thisx+1; localx++){
                        if(!exploredtiles[localy]) exploredtiles[localy] = {};
                        if(!exploredtiles[localy][localx]){
                            exploredtiles[localy][localx] = 1;
                            tilequeue.push(newgrid[localy][localx]);
                        }
                    }
                }
            }
            if(thistile.readOpacity() >= 1){
                let arc = fovarc(origin,thistile.pos);

                for(let i = arc[0]; i <= arc[1]; i++){
                    fov[i] = Math.min(fov[i],arc[2]);
                }
            }
        }

        console.log(iterations);

        return(visibletiles);
    }

    hear (sound, volume) {
        if(this.dead)return;
        if(sound.heard === true)return;
        const thischar = this;
        const [y,x] = sound.pos;
        sound.heard = true;
        let audio = [];
        if(sound.soundeffect) audio = sound.soundeffect.slice();
        // let audio = Soundfx.Footstep;
        // if(sound.content == "Attack" && sound.origin.equipment[0].attacksound) audio = sound.origin.equipment[0].attacksound.slice();
        // if(sound.content == "Miss") audio = soundeffects.swordswing.slice();
        // if(sound.content == "Move") audio = soundeffects.footstep.slice();
        // // if(sound.content == "Switch Weapon" && sound.origin.equipment[0].name == "Longbow") audio = soundeffects.bowdraw.slice();
        // // if(sound.content == "Switch Weapon" && sound.origin.equipment[0].name == "Longsword") audio = soundeffects.sworddraw.slice();
        // // if(sound.content == "Switch Weapon" && (sound.origin.equipment[0].name == "Dagger" || sound.origin.equipment[0].name == "Throwing Dagger")) audio = soundeffects.daggerdraw.slice();
        // // if(sound.content == "Switch Weapon" && sound.origin.equipment[0].name == "Shortsword") audio = soundeffects.shortsworddraw.slice();
        // // if(sound.content == "Switch Weapon" && sound.origin.equipment[0].name == "Javelin") audio = soundeffects.tap.slice();
        // // // if(sound.content == "Miss") freq = 660;
        // if(sound.content == "Switch Weapon" && sound.origin.equipment[0].drawsound) audio = sound.origin.equipment[0].drawsound.slice();
        // if(sound.content == "Chat") audio = soundeffects.goblinchat.slice();
        // if(sound.content == "Alert") audio = soundeffects.goblinchat.slice();
        // if(sound.content == "Huh?") audio = soundeffects.goblinyelp.slice();

        let deepcopy = [];
        audio.forEach(
            function(soundeffect, index){
                deepcopy[index] = [];
                deepcopy[index] = soundeffect.slice();
                if(deepcopy[index][6] === undefined) deepcopy[index][6] = 1;
                if(deepcopy[index][6] !== 0) deepcopy[index][6]*= Math.min((volume/sound.volume),1);
            }
        )
        if(sound.origin.pc == true){
            // setTimeout(() => playsound(freq), Math.random()*10);
            // setTimeout(() => playsoundeffect(audio), 1);
            playsoundeffect(deepcopy);
            return;
        }
        if(newgrid[y][x].visible == false){
            setTimeout(() => {
                // adduilabel("x", sound.pos, [256*volume/9,256*volume/9,256*volume/9], 0, true, false, false, true, 1);
                adduilabel("^", sound.pos, thischar.color, 0, true, false, false, true, 1);
                playsoundeffect(deepcopy);
            }, (sound.volume - volume) * 50);
            return;
            // if(sound.content)adduilabel(sound.content, sound.pos, [256*volume/9,256*volume/9,256*volume/9], 1, true, false, false, true, 1);
        }
        // setTimeout(() => playsoundeffect(audio), 1);
        playsoundeffect(deepcopy);
    }
}

class enemy extends character {
    constructor(pos,name,stats,maxhp,tcmax,pc,symbol,color,ac,traits,equipment,reactions,specialattack){
        super(pos,name,stats,maxhp,tcmax,pc,symbol,color,ac,traits,equipment,specialattack)
        this.startingpos = pos.slice();
        // this.states = states;
        // this.tilesofinterest = {};
        this.knowntiles = {};
        this.tasks = [];
        this.knownenemies = [];
        this.activetask;
        this.huntmap;
        this.huntedcharacters = {};
        this.knowncharacters = {};
        this.visiblecharacters = {};
        this.utilityfunctions = [];
        this.actions = [];
        this.reactions = reactions || [];
        this.hp += (Math.round(Math.random()*4));
        this.maxhp = this.hp;
        this.actions = [moveusecase,attackusecase,dashusecase,chatusecase,standgroundusecase,alertusecase];
        // if(this.name == "Ogre") this.actions = this.actions = [stompusecase,attackusecase,dashusecase,chatusecase];
        this.states = [
            new State("idle", defaultidle, null, [0,3]),
            new State("hostile", defaulthostile, defaulttemperment, [0,1,2]), 
            new State("hunting", defaulthunting, null, [0,2]), 
            new State("fleeing", defaultfleeing, null, [0,1,2,5])
        ];
        this.updatestate();
        this.deathsound = soundeffects.goblindeath;
        // spot(this);
    }
    damage(dam){
        adduilabel(dam.toString(),this.pos,[128,0,0],1,true);
        addToLog(`${this.symbol} hit for ${dam}`);
        this.hp -= dam;
        if(this.hp <= 0){
            this.die();
        }
        else if(this.hp <= Math.ceil(this.maxhp/4)){
            this.state = this.states[3];
        }
    }
    updatestate () {
        const thischar = this;
        if(!this.state){
            this.state = this.states[0];
        }

        let enemyhere = false;
        let enemyknown = false;

        Object.values(this.visiblecharacters).forEach(
            function (memory) {
                const char = memory.character;
                if(char.pc !== thischar.pc){
                    enemyhere = true;
                }
            }
        );

        if(!enemyhere){
            Object.values(this.knowncharacters).forEach(
                function (memory) {
                    const char = memory.character;
                    if(char.pc !== thischar.pc){
                        enemyknown = true;
                    }
                }
            );
        }
        if(this.state.name == this.states[0].name && enemyhere == true){
            addconditiondynamic(conditions.Surprised, true, this)();
            this.state = this.states[1];
            this.actionqueue = [];
        }

        if(this.state.name == this.states[1].name && enemyknown == false){
            this.huntmap = null;
            this.state = this.states[2];
            this.actionqueue = [];
        }

        if(this.state.name == this.states[2].name && enemyhere == true){
            this.state = this.states[1];
            this.actionqueue = [];
        }

    }
    updatecharactersofinterest () {

    }
    hear (sound, volume){
        const thischar = this;
        if(sound.origin == thischar)return;
        // console.log(sound.content);

        if(sound.origin.pc == true){
            this.visiblecharacters[sound.origin.index] = new CharacterMemory(sound.origin, sound.origin.pos.slice());
            this.knowncharacters[sound.origin.index] = new CharacterMemory(sound.origin, sound.origin.pos.slice());
            this.updatestate();
        }
        else if(sound.content == "Attack" || sound.content == "Miss"){
            const [y,x] = sound.pos;
            let attackee;
            if(newgrid[y][x].character && newgrid[y][x].character.pc !== this.pc) attackee = newgrid[y][x].character;
            this.visiblecharacters[attackee.index] = new CharacterMemory(attackee, attackee.pos.slice());
            this.knowncharacters[attackee.index] = new CharacterMemory(attackee, attackee.pos.slice());
            this.updatestate();
        }
        else if(sound.content == "Alert" || (sound.content == "Huh?")){
            if(sound.origin.knowncharacters){
                Object.values(sound.origin.knowncharacters).forEach(
                    function (memory) {
                        const adversary = memory.character;
                        const pos = memory.lastseen;
                        if(!thischar.visiblecharacters[adversary.index] || thischar.visiblecharacters[adversary.index].time < memory.time){
                            const sharedmemory = new CharacterMemory(adversary,pos);
                            thischar.visiblecharacters[adversary.index] = sharedmemory;
                            thischar.updatestate();
                        }
                    }
                )
            }
            else{
                console.log("trying to alert, but don't know any enemies");
            }
        }
    }
}

class Task {
    constructor(tile,func){
        this.tile = tile.slice();
        this.func = func;
    }
}

class State {
    constructor(name, utilityfunction, temperment, actions){
        this.name = name;
        this.utilityfunction = utilityfunction;
        this.temperment = temperment || function () {return(0)};
        this.actions = [];
        if(actions)this.actions = actions.slice();
    }
}

class CharacterMemory {
    constructor(character, lastseen){
        this.character = character;
        this.lastseen = lastseen.slice();
        this.time = turncounter;
    }
    getage(){
        return(turncounter-this.time);
    }
}

class Statblock {
    constructor(strength, dexterity, constitution){
        this.strength = strength;
        this.dexterity = dexterity;
        this.constitution = constitution;
    }
}

class lightsource {
    constructor(pos,lightcolor,lightpref, radiance){
        this.pos = pos;
        this.color = lightcolor;
        this.lightpref = lightpref;
        this.radiance = radiance || 2;
    }
}

class uielement {
    constructor(symbol, color, pos, animation, ui){
        this.symbol = symbol || "";
        this.color = color;
        this.pos = pos;
        this.animation = animation || false;
        if(!this.symbol){
            this.symbol = "$";
        }
        this.ui = ui || false;
    }
}

class PriorityQueue {
    constructor(comparator = (a, b) => a - b) {
      this.array = [];
      this.comparator = comparator;
    }
  
    enqueue(element) {
      this.array.push(element);
      this.array.sort(this.comparator);
    }
  
    dequeue() {
      return this.array.shift();
    }
  
    isEmpty() {
      return this.array.length === 0;
    }
}

class condition {
    constructor (name, starteffect, turneffect, duration, resistance, endeffect, character) {
        this.name = name;
        this.starteffect = starteffect || (() => {});
        this.turneffect = turneffect || (() => {});
        this.duration = duration;
        // this.currentduration = duration;
        this.resistance = resistance;
        this.character = character || null;
        this.endeffect = endeffect;
    }
}

class trait {
    constructor (name, trigger,effect,passive,active,character) {
        this.name = name;
        this.trigger = trigger;
        this.effect = effect;
        this.character = character || null;
        this.passive = passive || false;
        this.active = active || false;
    }
}

class trigger {
    constructor(isactive, ispassive, cb){
        this.isactive = isactive;
        this.ispassive = ispassive;
        this.cb = cb;
    }
}

class action {
    constructor(name, func, cost, range, target, character, pos, warnings, soundeffect, loudness){
        this.name = name;
        this.target = target.slice();
        this.func = func;
        this.character = character;
        this.cost = cost;
        this.range = range || 1.9;
        this.pos = pos || null;
        this.warnings = [];
        if(warnings) this.warnings = warnings.slice();
        this.soundeffect = soundeffect;
        this.loudness = loudness || 1;
    }
}

class Move extends action{
    constructor(name, func, cost, range, target, character, pos, warnings){
        super(name, func, cost, range, target, character, pos, warnings);
        const [y,x] = this.target;
        this.cost[0] = newgrid[y][x].moveCost;
        if(this.pos && this.character && this.target){
            if(checkforaoomove(this.pos,this.target,this.character)){
                this.warnings.push("Attack of Opportunity");
            }
        }
        this.loudness = 6;
        this.soundeffect = soundeffects.footstep;
        if(newgrid[y][x].name == "Smooth Stone Floor") this.soundeffect = soundeffects.footsteptap;
        if(character.name == "Ogre"){
            this.soundeffect = soundeffects.deepthud;
            this.loudness = 12;
        }
        
    }
}

class Attack extends action{
    constructor(name, func, cost, range, target, character, pos, warnings){
        super(name, func, cost, range, target, character, pos, warnings);
        const [y,x] = this.target;
        if(this.pos && this.character && this.target){
            if(checkforaooattack(this.pos,this.target,this.character)){
                this.warnings.push("Attack of Opportunity");
            }
        }
        this.loudness = 9;
    }
}

class Tile {
    constructor(name,absorbtionBase, symbolBase, traversable, moveCost, transparancy, pos){
        this.name = name;
        this.absorbtionBase = absorbtionBase;
        this.symbolBase = symbolBase;
        this.visible = false;
        this.light = [0,0,0];
        this.lightlevel = 0;
        this.objects = [];
        this.items = [];
        this.character = null;
        this.uiElements = [];
        this.traversable = traversable;
        this.moveCost = moveCost;
        this.baseMoveCost = moveCost;
        this.pos = pos;
        this.transparancy = transparancy;
        this.specularity = 0; //not in use yet
        this.charactersinview = [];
    }

    read(){
        // this.visible = true;
        const [y,x] = this.pos;
        let light = this.light.slice();
        if(this.readOpacity() >= 1 && this.character == null){
            //find the brightest neighbor who is in the sightmap and set our brightness to theirs
             let brightestneighbor = [0,0,0];
            for(let localy = y-1; localy <= y+1; localy++){
                for(let localx = x-1; localx <= x+1; localx++){
                    if(newgrid[localy][localx].visible !== false && newgrid[localy][localx].readOpacity() < 1){
                        const brightnesshere = newgrid[localy][localx].light.slice();
                        brightestneighbor = brightestneighbor.map(function(element, index){
                            if(brightnesshere[index] > element){
                                return(brightnesshere[index]);
                            }
                            return(element);
                        })
                    }
                }
            }
            light = brightestneighbor.slice();
        }
        // light = light.map((element) => element*brightnessadjust);
        //initialize a return value that is empty space with a black background and foreground
        let fgOutputColor = [0,0,0];
        let bgOutputColor = [0,0,0];
        let outputSymbol = "&nbsp";

        if(procgendebug == true && takeav(light) < 128){
            light = [128,128,128];
        }

        //if visible, change the return values to the tile's base fg and bg colors based on light here
        if(this.visible !== false){
            light = light.map((element) => element)
            fgOutputColor = light.map((element, index) => element*this.absorbtionBase[index]);
            if(this.readOpacity() >= 1){
                fgOutputColor = fgOutputColor.map((element) => element/2);
            }
            else{
                // fgOutputColor = [0,0,0];
            }
            fgOutputColor = fgOutputColor.map((element) => Math.max(0,element));
            fgOutputColor = fgOutputColor.map((element) => element*noisemap[y][x]);
            fgOutputColor = fgOutputColor.map((element) => 256*((element/256)**(1/gamma)));
            bgOutputColor = fgOutputColor.map((element) => element/2);
            outputSymbol = this.symbolBase;
        }

        //if there is an object here, adjust return values
        if(this.objects.length > 0 && this.visible !== false){
            const obj = this.objects[0];
            outputSymbol = obj.symbol;
            fgOutputColor = light.map((element,index) => element*obj.absorbtion[index]);
            fgOutputColor = fgOutputColor.map((element) => Math.max(0,element));
            fgOutputColor = fgOutputColor.map((element) => 256*((element/256)**(1/gamma)));
            if(obj.bgabsorbtion !== null){
                bgOutputColor = light.map((element,index) => element*obj.bgabsorbtion[index]*0.5)
            }
            
        }
        
        //if there is an item here, adjust return values
        if(this.items.length > 0 && this.visible !== false){
            const item = this.items[0];
            outputSymbol = item.symbol;
            fgOutputColor = light.map((element,index) => element*item.absorbtion[index]);
            fgOutputColor = fgOutputColor.map((element) => Math.max(0,element));
            fgOutputColor = fgOutputColor.map((element) => 256*((element/256)**(1/gamma)));
        }
        
        //if there is a character here, adjust return values
        if(this.character !== null && this.visible !== false){
            if(this.character.dead == true){
                this.character = null;
            }
            else{
                const char = this.character;
                if(char !== false){
                    let avlighthere = takeav(newgrid[y][x].light)/256;
                    fgOutputColor = char.color.map((element) => Math.max(element/2,avlighthere*element));
                    bgOutputColor = bgOutputColor.map((element) => element*0.75);
                    outputSymbol = char.symbol;
                }
            }
            //adjust based on character
        }

        if(this.charactersinview.length > 0){
            // outputSymbol = this.charactersinview[0].symbol;
        }
        if(takeav(light) == 16 && this.lightlevel == 0){
            // bgOutputColor = [0,0,0];
            // fgOutputColor = fgOutputColor.map((element) => takeav(fgOutputColor));
        }

        //if there is a UI element here, adjust the return values
        if(this.uiElements.length > 0){
            for(let i = 0; i < this.uiElements.length; i++){
                const uiElement = this.uiElements[i];
                // if(uiElement.animation === true && this.visible === false) continue;
                if(uiElement.symbol != "$"){
                    if(uiElement.symbol != " "){
                        if(uiElement.symbol == "^"){
                            uiElement.symbol = "&#183";
                        }
                        outputSymbol = uiElement.symbol;
                        fgOutputColor = fgOutputColor.map((element, index) => uiElement.color[index]);
                    }
                }
                else{
                    fgOutputColor = fgOutputColor.map((element, index) => element+uiElement.color[index]*256);
                    bgOutputColor = bgOutputColor.map((element, index) => element+uiElement.color[index]*128);
                }
            }
            this.uiElements = [];
        }

        fgOutputColor = fgOutputColor.map((element) => element*brightnessadjust)
        bgOutputColor = bgOutputColor.map((element) => element*brightnessadjust)
                
        const outputstring = `<span 
            class = "clickable"; 
            y = ${y}
            x = ${x} 
            style="
                color: rgb(${fgOutputColor});
                background-color: rgb(${bgOutputColor});
                font-size: ${fontsize}px;"
            >${outputSymbol}</span>`;

        return(outputstring);
    }

    cursorread(){
        if(this.character !== null){
            addcharlabel(this.pos, this.character);
        }
        else if(this.items.length > 0){
            const item = this.items[0];
            adduilabel(item.name, this.pos, [64,64,64], 1);
        }
        else if(this.objects.length > 0){
            const obj = this.objects[0];
            adduilabel(obj.name, this.pos, [64,64,64], 1);
        }
    }

    readOpacity(){
        let transparancy = this.transparancy;
        if(this.character !== null){
            // transparancy -= 0.25;
            // transparancy *= 0.75;
            transparancy = 0.75;
        }
        else if(this.objects.length > 0){
            // transparancy -= this.objects[0].opacity;
            // transparancy *= (1-this.objects[0].opacity);
            transparancy = 1-this.objects[0].opacity;

        }
        let opacity = (1-transparancy);
        return(opacity);
    }

    addItem(){

    }

    addObject(obj){
        obj.pos = this.pos.slice();
        this.objects.push(obj);
        this.updateObjects();
        // console.log(obj);
    }

    updateObjects(){
        this.traversable = true;
        this.moveCost = this.baseMoveCost;
        if(this.objects.length > 0){
            const obj = this.objects[0];
            if(obj.traversable == false){
                this.traversable = false;
            }
            this.moveCost += obj.movecost;
            obj.pos = this.pos.slice();
        }
    }

    readLightsource(){
        if(this.character !== null){
            if(this.character.lightsources.length > 0){
                return(this.character.lightsources[0]);
            }
        }
        if(this.objects.length > 0){
            if(this.objects[0].lightsources.length > 0){
                return(this.objects[0].lightsources[0]);
            }
        }
    }

    addvisiblecharacter(char){
        let duplicate = false;
        this.charactersinview.forEach(
            function (element) {
                if(element.index == char.index){
                    duplicate = true;
                }
            }
        )
        if(duplicate == false) this.charactersinview.push(char);
    }

    removevisiblecharacter(char){
        for(let i = 0; i < this.charactersinview.length; i++){
            if(this.charactersinview[i].index == char.index){
                this.charactersinview.splice(i,1);
                break;
            }
        }
    }
}

class Item {
    constructor(itemname, symbol, absorbtion){
        this.name = itemname;
        this.symbol = symbol;
        this.absorbtion = absorbtion || [1,1,1];
        this.action = action || actions.GenericMelee;
    }
}

class Weapon extends Item {
    constructor(itemname, symbol, absorbtion, action, range, bonus, damagedie, stat, minrange, drawsound, hitsound, misssound){
        super(itemname, symbol, absorbtion);
        // this.action = action;
        this.absorbtion = absorbtion;
        this.range = range || 1;
        this.bonus = bonus || 0;
        this.damagedie = damagedie;
        this.stat = stat || 0;
        this.minrange = minrange || 0;
        this.drawsound = drawsound || soundeffects.daggerdraw;
        this.hitsound = hitsound || soundeffects.swordhit;
        this.misssound = misssound || soundeffects.swordswing;
    }
}

class object {
    constructor(objectname, symbol, absorbtion, bgabsorbtion, opacity, traversable, movecost, action, effects, lightsources, pos){
        this.name = objectname; 
        this.symbol = symbol;
        this.absorbtion = absorbtion;
        this.bgabsorbtion = bgabsorbtion || null;
        this.opacity = opacity || 0;
        this.traversable = traversable;
        this.movecost = movecost || 0;
        this.action = action || null;
        this.effects = effects || [];
        this.lightsources = lightsources || [];
        this.pos = [];
        this.ac = 0;
        this.pc = false;
    }

    damage(){
        console.log(this.pos);
        newgrid[this.pos[0]][this.pos[1]].objects.shift();
        newgrid[this.pos[0]][this.pos[1]].updateObjects();
    }
}

class Roomtype {
    constructor (roomname, roomsize, roomshape, objects, enemies) {
        this.roomname = roomname;
        this.roomsize = roomsize;
        this.roomshape = roomshape;
        this.objects = objects;
        this.enemies = enemies;
    }
}

class AttackRoll {
    constructor(percenthitchance, damagerange, avdamageac10, intrinsmod, extrinsmod, targetac, modbreakdown, errors, onhiteffects, onmisseffects){
        this.percenthitchance = percenthitchance || null;
        if(damagerange)this.damagerange = damagerange.slice();
        else this.damagerange = [0,0];
        this.avdamageac10 = avdamageac10 || null;
        this.intrinsmod = intrinsmod || null;
        this.extrinsmod = extrinsmod || null;
        this.targetac = targetac || null;
        if(modbreakdown)this.modbreakdown = modbreakdown.slice();
        else this.modbreakdown = [];
        if(errors) this.errors = errors.slice();
        else this.errors = [];
        if(onhiteffects)this.onhiteffects = onhiteffects.slice();
        else this.onhiteffects = [];
        if(onmisseffects)this.onmisseffects = onmisseffects.slice();
        else this.onmisseffects = [];
    }
}

class Sound {
    constructor(pos,volume,origin,content,soundeffect){
        this.pos = pos;
        this.volume = volume;
        this.origin = origin;
        this.content = content || null;
        this.soundeffect = soundeffect;
    }
}