function generate (){
    grid = new Array(mapsizey).fill(null).map(() => new Array(mapsizex).fill(3));
    // generatestartingarea();
    // differentiategrid(grid);
    // generatecavern(grid);

    roomaccretion();

    // roomaccretionwhole();

    // generatecavernfloor(grid);
    // locatedungeons(grid);
    // generatedungeons(grid);
    // modifiedFloodFill(grid,Math.floor(mapsizey/2),Math.floor(mapsizex/2));

    // generateitems();
    // drawpath([25,25],[mapsizey-1,mapsizex-1]);
    // generatedungeons(grid);
    // BSPandCA();
    // console.log(generateDungeon(mapsizex,mapsizey));
    // grid = (generateRooms(mapsizex,mapsizey,250,4));
    //generatecavern
    //generatecavernfloor
    //generatedungeon
    //generatedungeonfloor
}

let objectqueue = [];
let nodemap;
nodemap = new Array(mapsizey).fill(null).map(() => new Array(mapsizex).fill(null));

function roomaccretion () {
    nodemap = new Array(mapsizey).fill(null).map(() => new Array(mapsizex).fill(null));
    class Node {
        constructor(y,x,dir,roomtype){
            this.y = y;
            this.x = x;
            this.dir = dir;
            this.roomtype = roomtype;
        }
    }
    let startingpoint = new Node(Math.floor(mapsizey/2),Math.floor(mapsizex/2),[0,0],roomtypes.Entrance);
    let iterations = 0;
    let rooms = 0;
    let maxrooms = 100;
    let floorqueue = [];
    let wallqueue = [];
    floorqueue.push(startingpoint);
    let maxiterations = 10000;

    while((floorqueue.length > 0 || wallqueue.length > 0) && iterations < maxiterations && rooms < maxrooms){
        iterations ++;
        while(floorqueue.length > 0 && iterations<maxiterations){
            const thisnode = floorqueue.shift();
            const [y,x] = [thisnode.y,thisnode.x];
            // console.log(thisnode);

            // Skip if out of bounds
            if (x < 0 || y < 0 || x >= mapsizex || y >= mapsizey) continue;

            if(grid[y][x] == 3){
                if(Math.random()>0){
                    if(Math.random() > 0.5){
                        wallqueue.push(new Node(y, x, thisnode.dir, thisnode.roomtype));
                    }
                    else{
                        wallqueue.unshift(new Node(y, x, thisnode.dir, thisnode.roomtype));
                    }
                }
                else{
                    floorqueue.push(new Node(y, x, thisnode.dir, thisnode.roomtype));
                    grid[y][x] = 1;
                }
                continue;
            }
            if(grid[y][x] == 5)continue;
            if(grid[y][x]!== 4){
                grid[y][x] = 5;
            }
            else{
                floorqueue.push(new Node(y+thisnode.dir[0],x+thisnode.dir[1],thisnode.dir,thisnode.roomtype));
                continue;
            }
            nodemap[y][x] = thisnode;

            let possibledirections = [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
                // [1,1],
                // [-1,-1],
                // [1,-1],
                // [-1,1]
            ]
            possibledirections = shuffle(possibledirections);
            floorqueue.push(new Node(y+possibledirections[0][0], x+possibledirections[0][1], possibledirections[0], thisnode.roomtype));
            floorqueue.push(new Node(y+possibledirections[1][0], x+possibledirections[1][1], possibledirections[1], thisnode.roomtype));
            floorqueue.push(new Node(y+possibledirections[2][0], x+possibledirections[2][1], possibledirections[2], thisnode.roomtype));
            floorqueue.push(new Node(y+possibledirections[3][0], x+possibledirections[3][1], possibledirections[3], thisnode.roomtype));
        }
        // wallqueue = shuffle(wallqueue);
        // console.log(wallqueue.length);
        if(wallqueue.length > 0){
            const thiswall = wallqueue.pop();
            const [y,x] = [thiswall.y,thiswall.x];
            if(generateroomcalc(thiswall.dir, [y,x], thiswall.roomtype) !== false){
                rooms++;
            }
        }
        // console.log(iterations);
        // wallqueue = [];
    }
    console.log(rooms);
    //flood fill from starting point, finding all floor tiles, adding walls to a separate wall queue that includes a direction
    //once you run out of floor tiles, pick a wall tile from the wall queue and try to generate a room on the other side


    // while(iterations < 1){
        // iterations++
        // generateroom ([-1,0], startingpoint);
    // }
    
    function returnroomcal (dir, point, thisroom) {
        const buffer = 12;
        let roompoints = [];
        let roomedges = [];
        let roomobjects = [];
        let roomenemies = [];

        if(thisroom.childrooms.length == 0){
            return([null,null,null,false]);
        }
        let roomwillfit = true
        possiblerooms = thisroom.childrooms.slice();
        possiblerooms = shuffle(possiblerooms);
        roomtype = possiblerooms[0];
        let roomsizerange = roomtype.roomsize.slice();
        let roomsize = [randomint(...roomsizerange[0]),randomint(...roomsizerange[1])]
        roomsize = shuffle(roomsize);
        let [roomsizey, roomsizex] = roomsize;
        let halfy = Math.ceil(roomsizey/2);
        let halfx = Math.ceil(roomsizex/2);
        let [my,mx] = [halfy*dir[0] + point[0] + dir[0], halfx*dir[1] + point[1] + dir[1]];
        for(let y = my-halfy-1; y <= my + halfy+1; y++){
            for(let x = mx-halfx-1; x <= mx + halfx+1; x++){
                if(y-buffer < 0 || y+buffer >= mapsizey || x-buffer < 0 || x+buffer >= mapsizex){
                    roomwillfit = false;
                    break;
                }
                if((y > my-halfy-1 && y < my + halfy+1 && x > mx-halfx-1 && x < mx + halfx+1)){
                    if(roomtype.roomshape([halfy,halfx],[my,mx],[y,x],dir) === 1){
                        roompoints.push([y,x]);
                        roomedges.push([y,x]);
                    }
                    if(roomtype.roomshape([halfy,halfx],[my,mx],[y,x],dir) === 2){
                        roompoints.push([y,x]);
                        roomedges.push([y,x]);
                        let objecthere = (new object(...roomtype.objects));
                        objecthere.pos = [y,x];
                        roomobjects.push(objecthere);
                    }
                }
                else{
                    roomedges.push([y,x]);
                }
            }
        }
        return([roompoints,roomedges,roomtype,roomwillfit,roomobjects]);
    }

    function generateroomcalc (dir, point, roomtype) {
        const buffer = 12;
        let [roompoints,roomedges,newroomtype,roomwillfit,roomobjects,roomenemies] = returnroomcal(dir, point, roomtype);
        
        for(let i = 0; roomwillfit == true && i < roomedges.length; i++){
            const [y,x] = roomedges[i];
            if(y-buffer < 0 || y+buffer >= mapsizey || x-buffer < 0 || x+buffer >= mapsizex || nodemap[y][x] !== null){
                roomwillfit = false;
                break;
            }
        }

        if(roomwillfit){
            grid[point[0]][point[1]] = 4;
            for(let i = 0; i < roompoints.length; i++){
                const [y,x] = roompoints[i];
                grid[y][x] = 1;
            }
            for(let i = 0; roomobjects && i < roomobjects.length; i++){
                const obj = roomobjects[i];
                objectqueue.push(obj);
            }
            floorqueue.push(new Node(point[0]+dir[0],point[1]+dir[1],dir,newroomtype));
        }
        else{
            return(false);
        }
    }
}

function roomaccretionwhole () {
    for(let y = 0; y < mapsizey; y++){
        newgrid[y] = [];
        for(let x = 0; x < mapsizex; x++){
            newgrid[y][x] = new Tile(...tiletypesarr[3], [y,x]);
        }
    }
    nodemap = new Array(mapsizey).fill(null).map(() => new Array(mapsizex).fill(null));
    class Node {
        constructor(y,x,dir,roomtype){
            this.y = y;
            this.x = x;
            this.dir = dir;
            this.roomtype = roomtype;
        }
    }
    const [starty,startx] = [Math.floor(mapsizey/2),Math.floor(mapsizex/2)]
    let startingpoint = new Node(Math.floor(mapsizey/2),Math.floor(mapsizex/2),[0,0],roomtypes.Entrance);
    newgrid[starty][startx] = new Tile(...tiletypesarr[1], [starty,startx]);
    let iterations = 0;
    let rooms = 0;
    let maxrooms = 50;
    let floorqueue = [];
    let wallqueue = [];
    floorqueue.push(startingpoint);
    let maxiterations = 1000;
    while((floorqueue.length > 0 || wallqueue.length > 0) && iterations < maxiterations && rooms < maxrooms){
        iterations ++;  
        while(floorqueue.length > 0 && iterations<maxiterations){
            const thisnode = floorqueue.shift();
            const [y,x] = [thisnode.y,thisnode.x];
            // Skip if out of bounds
            if (x < 0 || y < 0 || x >= mapsizex || y >= mapsizey) continue;

            if(nodemap[y][x] !== null){
                continue;
            }
            
            if(newgrid[y][x].traversable == false || newgrid[y][x].objects.length > 0){
                // if(Math.random() > 0.5){
                //     floorqueue.push(new Node(y, x, thisnode.dir, thisnode.roomtype));
                //     newgrid[y][x] = new Tile(...tiletypesarr[1], [y,x]);
                // }
                // else{
                    wallqueue.push(new Node(y, x, thisnode.dir, thisnode.roomtype));
                    continue;
                // }
            }
            nodemap[y][x] = thisnode;
            let possibledirections = [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
                // [1,1],
                // [-1,-1],
                // [1,-1],
                // [-1,1]
            ]
            possibledirections = shuffle(possibledirections);
            floorqueue.push(new Node(y+possibledirections[0][0], x+possibledirections[0][1], possibledirections[0], thisnode.roomtype));
            floorqueue.push(new Node(y+possibledirections[1][0], x+possibledirections[1][1], possibledirections[1], thisnode.roomtype));
            floorqueue.push(new Node(y+possibledirections[2][0], x+possibledirections[2][1], possibledirections[2], thisnode.roomtype));
            floorqueue.push(new Node(y+possibledirections[3][0], x+possibledirections[3][1], possibledirections[3], thisnode.roomtype));
        }
        if(wallqueue.length > 0){
            if(Math.random() > 1){
                // wallqueue = shuffle(wallqueue);
            }
            const thiswall = wallqueue.pop();
            const [y,x] = [thiswall.y,thiswall.x];
            generateroom(thiswall);
        }
    }
    function generateroom (thiswall) {
        const [y,x] = [thiswall.y,thiswall.x];
        rooms++;
        floorqueue.push(new Node(y, x, thiswall.dir, thiswall.roomtype));
        newgrid[y][x] = new Tile(...tiletypesarr[1], [y,x]);


    }
    function returncavernroom () {

    }


}

function generateitems(){
    itemmap = new Array(mapsizey).fill(null).map(() => new Array(mapsizex).fill(0));
    for(let y = 0; y < mapsizey; y++){
        for(let x = 0; x < mapsizex; x++){
            // if(Math.random() > 0.95 && grid[y][x] == 5){
            //     itemmap[y][x] = 2;
            // }
            // if(Math.random() > 0.9 && grid[y][x] == 4){
            //     itemmap[y][x] = 1;
            // }
        } 
    }
}

function generatestartingarea(){
    let buffer = 5;
    let middle = [Math.floor(mapsizey/2), Math.floor(mapsizex/2)];
    for(let y = Math.floor(mapsizey/2)-buffer; y < Math.floor(mapsizey/2)+buffer; y++){
        for(let x = Math.floor(mapsizex/2)-buffer; x < Math.floor(mapsizex/2)+buffer; x++){
            // grid[y][x] = startarea[y-Math.floor(mapsizey/2)+5][x-Math.floor(mapsizex/2)+5];
            if(dist(middle,[y,x])<buffer){
                grid[y][x] = 1;
            }
        }
    }
}

function generatemonsters(){
    nonpcs = [];
    playercs = [];
    for(let i = 0; i < objectqueue.length; i++){
        const obj = objectqueue[i];
        const [y,x] = obj.pos;
        newgrid[y][x].addObject(obj);
    }
    for(let y = 0; y < mapsizey; y++){
        for(let x = 0; x < mapsizex; x++){
            if(grid[y][x] == 3 && Math.random() > 0.9){
                newgrid[y][x] = new Tile(...tiletypes.MossyWall, [y,x]);
            }
            if(grid[y][x] == 5 && Math.random() > 0.95){
                newgrid[y][x] = new Tile(...tiletypes.MossFloor, [y,x]);
                if(Math.random() > 0.5){
                    newgrid[y][x].addObject(new object(...objects.TallGrass));
                }
            }
            if(nodemap[y][x] && nodemap[y][x].roomtype.roomname == "Tomb" && Math.random() > 0.9){
                // newgrid[y][x].items.push(new Item(...items.MagicSword));
                newgrid[y][x].addObject(new object(...objects.Sarcophagus))
            }
            if(nodemap[y][x] && nodemap[y][x].roomtype.roomname == "Common Area" && Math.random() > 0.95){
                newgrid[y][x].addObject(new object(...objects.Table));
                for(localy = y-1; localy <= y+1; localy++){
                    for(localx = x-1; localx <= x+1; localx++){
                        if((y !== localy || x !== localx) && (localx == x || localy == y) && Math.random() > 0.5 && newgrid[localy][localx].traversable == true){
                            newgrid[localy][localx].addObject(new object(...objects.Chair));
                        }
                    }
                }
            }
            if(nodemap[y][x] && nodemap[y][x].roomtype.roomname == "Bedroom" && Math.random() > 0.9){
                newgrid[y][x].addObject(new object(...objects.Bed));
            }
            if(nodemap[y][x] && nodemap[y][x].roomtype.roomname == "Chapel"){
                // if(Math.random() > 0.5){
                    newgrid[y][x] = new Tile(...tiletypes.SmoothstoneFloor,[y,x]);
                // }
                // else if(Math.random () >0.5){
                //     newgrid[y][x] = new Tile(...tiletypes.Water, [y,x])
                //     if(Math.random () > 0.25){
                //         newgrid[y][x] = new Tile(...tiletypes.MossFloor, [y,x]);
                //     }
                // }
                if(Math.random() > 0.99){
                    // newgrid[y][x].addObject(new object(...objects.Chair));
                    newgrid[y][x].addObject(new object(...objects.Campfire, [new lightsource([y,x],[256,128,64],[1,0.5,0.25],1)]));
                }
                else if(Math.random() > 0.96){
                    newgrid[y][x].addObject(new object(...objects.Statue));
                }
            }
            if(grid[y][x] == 5 && Math.random()>0.95 && nodemap[y][x] && nodemap[y][x].roomtype.roomname !== "Chapel"){

                if(Math.random () > 0.6){
                    nonpcs.push(new enemy([y,x], ...enemies.Goblin_Dagger));
                    // nonpcs[nonpcs.length-1].lightsources.push(new lightsource([y,x],[256,256,256],[5,5,5]))
                }
                else if(Math.random() > 0.2){
                    nonpcs.push(new enemy([y,x], ...enemies.Goblin_Shortbow));
                }
                else if(Math.random () > 0.5){
                    nonpcs.push(new enemy([y,x], ...enemies.Ogre));
                }
                else{
                    nonpcs.push(new enemy([y,x], ...enemies.Skulker));
                }
                const enemywejustmade = nonpcs[nonpcs.length-1];
                // enemywejustmade.hp += (Math.round(Math.random()*4));
                // enemywejustmade.actions = [moveusecase,attackusecase,dashusecase];
                // enemywejustmade.states = [new State("idle", defaultidle), new State("hostile", defaulthostile, defaulttemperment), new State("hunting", defaulthunting)];
                // enemywejustmade.updatestate();

                // lightsources.push(new lightsource([y,x],[256,256,256],[5,5,5]))
            }
            else if(grid[y][x] == 4){
                newgrid[y][x] = new Tile (...tiletypes.RoughStoneFloor, [y,x]);
                if(Math.random() > 0.5)newgrid[y][x].addObject(new object(...objects.Curtain));
                // newgrid[y][x].addObject(new object(...objects.TallGrass));
                // newgrid[y][x].objects[0].lightsources.push(new lightsource(null,[256,64,32],[1,1,1]))
                // newgrid[y][x].items.push(new Item(...items.Longbow));
                // nonpcs.push(new character([y,x], ...enemies.Snake));
            }
            else if(Math.random()>0.999){
                // nonpcs.push(new character([y,x], ...enemies.Rat));
            }
        }
    }
    playercs.push(new character([Math.floor(mapsizey/2),Math.floor(mapsizex/2)], "Deserter", statblocks.Deserter, 10, [4,1,1], true, "@", [128,128,128], 16, [],[new Weapon (...items.Longsword), new Weapon(...items.Javelin)]));
    playercs[0].lightsources.push(new lightsource([0,0],[256,256,256],[5,3,2],2));
    // nonpcs.push(new enemy([Math.floor(mapsizey/2)+1,Math.floor(mapsizex/2)+1], ...enemies.Ogre));
    playercs.push(new character([Math.floor(mapsizey/2)+1,Math.floor(mapsizex/2)+1], "Fugitive", statblocks.Exile, 6, [4,1,1], true, "@", [0,32,0],14,[], [new Weapon(...items.Shortsword), new Weapon(...items.ThrowingDagger)], sneakattackpermute));
    playercs.push(new character([Math.floor(mapsizey/2)-1,Math.floor(mapsizex/2)-1], "Huntsman", statblocks.Wanderer, 5, [4,1,1], true, "@", [128,96,64],14,[],[new Weapon(...items.Longbow), new Weapon(...items.Dagger)]));
    updatecharacters();
    updatecharactershere();
    activecharacternonindex = playercs[activecharacter];
}

function differentiategrid (grid){
    seedgrid = gradientNoise(mapsizex,mapsizey, 1/10, Math.random());
    for(let y = 0; y < mapsizey; y++){
        for(let x = 0; x < mapsizex; x++){
            if(grid[y][x] !== 3) continue;
            wallratio = seedgrid[y][x];
            if(Math.random()-0.3 > bias(wallratio,30)){
                grid[y][x] = 1;
            }
            else{
                grid[y][x] = 3;
            }
        }
    }

}

function generatecavern (grid){
    for(let i = 0; i < 5; i++){
        let referencemap = deepCopy2D(grid);
        for(let y = 0; y < mapsizey; y++){
            for(let x = 0; x < mapsizex; x++){
                let wallshere = 0;
                for(let localy = y-1; localy <= y+1; localy++){
                    for(let localx = x-1; localx <= x+1; localx++){
                        if (localy === y && localx === x) continue;
                        if(localx < 0 || localx > mapsizex-1 || localy < 0 || localy > mapsizey-1){
                            wallshere++;
                            continue;
                        }
                        else if(referencemap[localy][localx] == 3){
                             wallshere ++;
                        }
                    }
                }
                if(wallshere > 3){
                    grid[y][x] = 3;
                }
                if(wallshere < 4){
                    grid[y][x] = 1;
                }
            }
        }
    }
}

function generatecavernfloor(grid){
    for(let y = 0; y < mapsizey; y++){
        for(let x = 0; x < mapsizex; x++){
            if(grid[y][x] == 1){
                let tileseed = Math.random();
                if(tileseed > 2/3){
                    grid[y][x] = 1;
                }
                else if(tileseed > 1/3){
                    grid[y][x] = 0;
                }
                else if(tileseed > 0){
                    grid[y][x] = 2;
                }
            }
        }
    }
    for(let i = 0; i < 2; i++){
        let referencemap = deepCopy2D(grid);
        for(let y = 0; y < mapsizey; y++){
            for(let x = 0; x < mapsizex; x++){
                if(grid[y][x] == 3){
                    continue;
                }
                let waterhere = 0;
                let stonehere = 0;
                let dirthere = 0;
                let mosshere = 0;
                for(let localy = y-1; localy <= y+1; localy++){
                    for(let localx = x-1; localx <= x+1; localx++){
                        if (localy === y && localx === x) continue;
                        if(localx < 0 || localx > mapsizex-1 || localy < 0 || localy > mapsizey-1){
                            continue;
                        }
                        else{
                            if(referencemap[localy][localx] == 0){
                                waterhere++;
                                continue;
                            }
                            if(referencemap[localy][localx] == 1){
                                dirthere++;
                                continue;
                            }
                            if(referencemap[localy][localx] == 2){
                                stonehere++;
                                continue;
                            }
                            if(referencemap[localy][localx] == 4){
                                mosshere++;
                                continue;
                            }
                        }
                    }
                }
                if(stonehere > 3){
                    grid[y][x] = 2
                }
                else if(waterhere+mosshere > 3){
                    if(Math.random() > 0.25){
                        grid[y][x] = 0;
                    }
                    else{
                        grid[y][x] = 4;
                    }
                }
                else if(dirthere > 3){
                    grid[y][x] = 1;
                }
            }
        }
    }
}

function generatedungeons (grid){
    // extendedCA(grid);
    // locatedungeons(grid);
    noiseCAdungeons(grid);
    // identifyentrances(grid);
    // let startingpoint = [Math.floor(mapsizey/2),Math.floor(mapsizex/2)];
    // let iterations = 0;

  
    // let buffer = 3;
    // let referencemap = deepCopy2D(grid)
    // for(let y = buffer; y < mapsizey-buffer; y++){
    //     for(let x = buffer; x < mapsizex-buffer; x++){
    //         let wallshere = 0;
    //         for(let localy = y-1; localy <= y+1; localy++){
    //             if(localy > 0 && localy < mapsizey){
    //                 for(let localx = x-1; localx <= x+1; localx++){
    //                     if(localx > 0 && localx < mapsizex && (localy != y || localx != x)){
    //                         if(referencemap[localy][localx] == 3){
    //                             wallshere ++;
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //         if(wallshere == 8){
    //             grid[y][x] = 7;
    //         }
    //         let buffer = 3
    //         if((x < buffer || x > mapsizex-buffer)||(y < buffer || y > mapsizey-buffer)){
    //             grid[y][x] = 3;
    //         }
    //     }
    // }
    // for(let y = buffer; y < mapsizey-buffer; y++){
    //     for(let x = buffer; x < mapsizex-buffer; x++){
    //         if(grid[y][x] == 7){
    //             if(Math.random()>0.5){
    //                 grid[y][x] = 6;
    //             }
    //             else{
    //                 grid[y][x] = 7;
    //             }
    //         }
    //     }
    // }
    // referencemap = deepCopy2D(grid)
    // for(let i = 0; i < 5; i++){
    //     for(let y = buffer; y < mapsizey-buffer; y++){
    //         for(let x = buffer; x < mapsizex-buffer; x++){
    //             let wallshere = 0;
    //             if(grid[y][x] != 6 && grid[y][x] != 7){
    //                 continue;
    //             }
    //             for(let localy = y-1; localy <= y+1; localy++){
    //                 for(let localx = x-1; localx <= x+1; localx++){
    //                     if (localy === y && localx === x) continue;
    //                     if(localx < 0 || localx > mapsizex-1 || localy < 0 || localy > mapsizey-1){
    //                         wallshere++;
    //                         continue;
    //                     }
    //                     // if(localx !== x && localy !== y){
    //                     //     continue;
    //                     // }
    //                     else{
    //                     if(referencemap[localy][localx] == 7){
    //                         wallshere ++;
    //                     }
    //                     }
    //                 }
    //             }
    //             if(wallshere > 4){
    //                 grid[y][x] = 7;
    //             }
    //             if(wallshere < 4){
    //                 grid[y][x] = 6;
    //             }
    //         }
    //     }
    // }

    //find a starting point
    //flood fill to create a region


    // for(let y = buffer; y < mapsizey-buffer; y++){
    //     for(let x = buffer; x < mapsizex-buffer; x++){
    //         if(grid[y][x] == 7){
    //             grid[y][x] = 1;
    //         }
    //         if(grid[y][x] == 6){
    //             grid[y][x] = 2;
    //         }
    //     }
    // }
    // floodfillcheck(grid);
}

function identifyentrances (grid){
    let entrancemap = [];
    for(let y = 0; y < mapsizey; y ++){
        entrancemap[y] = [];
        for(let x = 0; x < mapsizex; x++){
            entrancemap[y][x] = -1;
        }
    }
    for(let y = 0; y < mapsizey; y++){
        for(let x = 0; x < mapsizex; x++){
            if(grid[y][x] == 3){
                let innerneighbors = 0;
                let outerneighbors = 0;
                for(let localy = y-1; localy <= y+1; localy++){
                    for(let localx = x-1; localx <= x+1; localx++){
                        if (localy === y && localx === x) continue;
                        if(localx < 0 || localx > mapsizex-1 || localy < 0 || localy > mapsizey-1){
                            continue;
                        }
                        if(localx !== x && localy !== y){
                            continue;
                        }
                        if(grid[localy][localx] == 1 || grid[localy][localx] == 2){
                            outerneighbors ++;
                        }
                        if(grid[localy][localx] == 5){
                            innerneighbors ++;
                        }
                    }
                }
                if(innerneighbors > 0 && outerneighbors > 0){
                    entrancemap[y][x] = 0;
                }
            }
        }
    }
    return(entrancemap);
}

function locatedungeons(){
    for(let i = 0; i < 2; i++){
        let referencemap = deepCopy2D(grid);
        for(let y = 0; y < mapsizey; y++){
            for(let x = 0; x < mapsizex; x++){
                let wallshere = 0;
                for(let localy = y-1; localy <= y+1; localy++){
                    for(let localx = x-1; localx <= x+1; localx++){
                        if (localy === y && localx === x) continue;
                        if(localx < 0 || localx > mapsizex-1 || localy < 0 || localy > mapsizey-1){
                            wallshere++;
                            continue;
                        }
                        // if(localx !== x && localy !== y){
                        //     continue;
                        // }
                        else{
                            if(referencemap[localy][localx] == 3){
                                wallshere ++;
                            }
                        }
                    }
                }
                if(wallshere == 8){
                    grid[y][x] = 5;
                }
            }
        }
    }
}

function extendedCA (grid){
    seedgrid = gradientNoise(mapsizex,mapsizey, 1/5, Math.random());
    let wallratio = 0.50;
    for(let y = 0; y < mapsizey; y++){
        grid[y] = [];
        for(let x = 0; x < mapsizex; x++){
            wallratio = seedgrid[y][x];
            if(Math.random() > bias(wallratio,2)){
                grid[y][x] = 1;
            }
            else{
                grid[y][x] = 3;
            }
        }
    }

    for(let i = 0; i < 10; i++){
        let referencemap = deepCopy2D(grid);
        for(let y = 0; y < mapsizey; y++){
            for(let x = 0; x < mapsizex; x++){
                let wallshere = 0;
                let orthwallshere = 0;
                for(let localy = y-2; localy <= y+2; localy++){
                    for(let localx = x-2; localx <= x+2; localx++){
                        let diag = false;
                        if (localy === y && localx === x) continue;
                        if(localx < 0 || localx > mapsizex-1 || localy < 0 || localy > mapsizey-1){
                            wallshere++;
                            orthwallshere++;
                            continue;
                        }
                        if(localx !== x && localy !== y){
                            diag = true;
                        }
                        if(referencemap[localy][localx] == 3){
                            wallshere ++;
                            if(diag == false){
                                orthwallshere++;
                            }
                        }
                    }
                }
                if(i<10){
                    if(referencemap[y][x] == 3 && (orthwallshere > 99 || orthwallshere < 4)){
                        grid[y][x] = 1;
                    }
                }
                if(i<8){
                    if(referencemap[y][x] == 1 && (orthwallshere > 4 || wallshere > 99 || (orthwallshere < 2 && Math.random()>0.5))){
                        grid[y][x] = 3;
                    }
                }
            }
        }
    }
}

function noiseCAdungeons(grid){
    seedgrid = gradientNoise(mapsizex,mapsizey, 1/5, Math.random());
    let wallratio = 0.50;
    for(let y = 0; y < mapsizey; y++){
        for(let x = 0; x < mapsizex; x++){
            if(grid[y][x] == 5){
                wallratio = seedgrid[y][x];
                // if(Math.random()-0.5 < bias(Math.abs((seedgrid[y][x]-0.5)*2),2)){
                //     grid[y][x] = 1;
                // }
                if(Math.random()+0.1 > bias(seedgrid[y][x],1.5)){
                    grid[y][x] = 5;
                }
                else{
                    grid[y][x] = 6;
                }
            }
        }
    }
    for(let i = 0; i < 10; i++){
        let referencemap = deepCopy2D(grid);
        for(let y = 0; y < mapsizey; y++){
            for(let x = 0; x < mapsizex; x++){
                let wallshere = 0;
                let orthwallshere = 0;
                for(let localy = y-1; localy <= y+1; localy++){
                    for(let localx = x-1; localx <= x+1; localx++){
                        let diag = false;
                        if (localy === y && localx === x) continue;
                        if(localx < 0 || localx > mapsizex-1 || localy < 0 || localy > mapsizey-1){
                            wallshere++;
                            orthwallshere++;
                            continue;
                        }
                        if(localx !== x && localy !== y){
                            diag = true;
                        }
                        if(referencemap[localy][localx] == 6){
                            wallshere ++;
                            if(diag == false){
                                orthwallshere++;
                            }
                        }
                    }
                }
                if(i<10){
                    if(referencemap[y][x] == 6 && ((orthwallshere > 99 || orthwallshere < 2) || (orthwallshere < 3 && Math.random()>1))){
                        grid[y][x] = 5;
                    }
                }
                if(i<8){
                    if(referencemap[y][x] == 5 && (orthwallshere > 2 || wallshere > 8 || (orthwallshere < 1 && Math.random()>0.5))){
                        grid[y][x] = 6;
                    }
                }
            }
        }
    }
    // for(let y = 0; y < mapsizey; y++){
    //     for(let x = 0; x < mapsizex; x++){
    //         if(grid[y][x] == 5){
    //             grid[y][x] = 1;
    //         }
    //         if(grid[y][x] == 6){
    //             grid[y][x] = 3;
    //         }
    //     }
    // }
}

function BSPandCA () {
    grid = (generateRooms(mapsizex,mapsizey,8,4));
    for(let i = 0; i < 30; i++){
        let referencemap = deepCopy2D(grid);
        for(let y = 0; y < mapsizey; y++){
            for(let x = 0; x < mapsizex; x++){
                let wallshere = 0;
                let orthwallshere = 0;
                for(let localy = y-1; localy <= y+1; localy++){
                    for(let localx = x-1; localx <= x+1; localx++){
                        let diag = false;
                        if (localy === y && localx === x) continue;
                        if(localx < 0 || localx > mapsizex-1 || localy < 0 || localy > mapsizey-1){
                            wallshere++;
                            continue;
                        }
                        if(localx !== x && localy !== y){
                            diag = true;
                        }
                        if(referencemap[localy][localx] == 3){
                            wallshere ++;
                            if(diag == false){
                                orthwallshere++;
                            }
                        }
                    }
                }
                if(i<9999){
                    if(referencemap[y][x] == 3 && ((wallshere == 5 && orthwallshere == 3 && Math.random() >0.995)||(orthwallshere == 3 && wallshere == 7))){
                        grid[y][x] = 1;
                    }
                }
                if(i == 29){
                    if(referencemap[y][x] == 3 && (orthwallshere == 2 && wallshere == 4)){
                        grid[y][x] = 1;
                    }
                }
                if(i<0){
                    if(referencemap[y][x] == 1 && (orthwallshere > 2 || wallshere > 3 || (wallshere < 1 && Math.random()<0.30))){
                        grid[y][x] = 3;
                    }
                }
            }
        }
    }
}

function gradientNoise(width, height, frequency = 1 / 100, seed = 0) {
    // Initialize the 2D array
    const noise = new Array(height).fill().map(() => new Array(width).fill(0));
  
    // Define the gradients
    const gradients = {
      0: [1, 0],
      1: [0, 1],
      2: [-1, 0],
      3: [0, -1],
      4: [Math.sqrt(2)/2, Math.sqrt(2)/2],
      5: [-Math.sqrt(2)/2, Math.sqrt(2)/2],
      6: [-Math.sqrt(2)/2, -Math.sqrt(2)/2],
      7: [Math.sqrt(2)/2, -Math.sqrt(2)/2]
    };
  
    // Generate a random gradient for each grid point
    function randomGradient(x, y) {
      const random = 2920 * Math.sin(seed + x * 21942 + y * 171324 + 8912) * Math.cos(seed + x * 23157 * y * 217832 + 9758);
      return gradients[Math.floor(Math.abs(random) * 8) % 8];
    }
  
    // Calculate the dot product
    function dotGridGradient(ix, iy, x, y) {
      const gradient = randomGradient(ix, iy);
      const dx = x - ix;
      const dy = y - iy;
      return (dx * gradient[0] + dy * gradient[1]);
    }
  
    // Compute Perlin noise at coordinates x, y
    function perlin(x, y) {
      const x0 = Math.floor(x);
      const x1 = x0 + 1;
      const y0 = Math.floor(y);
      const y1 = y0 + 1;
  
      const sx = x - x0;
      const sy = y - y0;
  
      const n0 = dotGridGradient(x0, y0, x, y);
      const n1 = dotGridGradient(x1, y0, x, y);
      const ix0 = lerp(n0, n1, sx);
  
      const n2 = dotGridGradient(x0, y1, x, y);
      const n3 = dotGridGradient(x1, y1, x, y);
      const ix1 = lerp(n2, n3, sx);
  
      return lerp(ix0, ix1, sy);
    }
  
    // Generate the noise array
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        noise[y][x] = perlin(x * frequency, y * frequency) / 2 + 0.5;
      }
    }
  
    return noise;
}
  
function lerp(a, b, t) {
return (1 - t) * a + t * b;
}

function bias(value,exp) {
    // This function will stretch the values away from 0.5 and towards 0 and 1
    return value > 0.5 ? 1 - Math.pow(1 - value, exp) : Math.pow(value, exp);
}

class Node {
    constructor(boundary) {
      this.boundary = boundary; // { x, y, width, height }
      this.left = null;
      this.right = null;
      this.isLeaf = true;
      this.room = null; // { x, y, width, height }
    }
  }
  
class BSP {
constructor(width, height, minRoomSize) {
    this.root = new Node({ x: 0, y: 0, width: width, height: height });
    this.minRoomSize = minRoomSize;
}

split(node, depth) {
    if (depth === 0 || node.boundary.width < this.minRoomSize * 2 || node.boundary.height < this.minRoomSize * 2) {
      // create a room within this leaf
      const roomWidth = Math.floor(Math.random() * (node.boundary.width - this.minRoomSize) + this.minRoomSize);
      const roomHeight = Math.floor(Math.random() * (node.boundary.height - this.minRoomSize) + this.minRoomSize);
      const roomX = Math.floor(Math.random() * (node.boundary.width - roomWidth));
      const roomY = Math.floor(Math.random() * (node.boundary.height - roomHeight));
      node.room = { x: node.boundary.x + roomX, y: node.boundary.y + roomY, width: roomWidth, height: roomHeight };
      return;
    }
  
    const aspectRatio = node.boundary.width / node.boundary.height;
    let verticalSplit;
  
    if (aspectRatio > 1) {
        // The region is wider than it is tall, favor vertical splits
        verticalSplit = Math.random() < (aspectRatio / (aspectRatio + 1)) ** 0.5;
      } else {
        // The region is taller than it is wide, or square, favor horizontal splits
        verticalSplit = Math.random() > (1 / (aspectRatio + 1)) ** 0.5;
      }
  
      if (verticalSplit) {
        const minSplitX = this.minRoomSize;
        const maxSplitX = node.boundary.width - this.minRoomSize;
        const splitX = Math.floor(minSplitX + (maxSplitX - minSplitX) * bellCurveRandom());
        node.left = new Node({ x: node.boundary.x, y: node.boundary.y, width: splitX, height: node.boundary.height });
        node.right = new Node({ x: node.boundary.x + splitX, y: node.boundary.y, width: node.boundary.width - splitX, height: node.boundary.height });
      } else {
        const minSplitY = this.minRoomSize;
        const maxSplitY = node.boundary.height - this.minRoomSize;
        const splitY = Math.floor(minSplitY + (maxSplitY - minSplitY) * bellCurveRandom());
        node.left = new Node({ x: node.boundary.x, y: node.boundary.y, width: node.boundary.width, height: splitY });
        node.right = new Node({ x: node.boundary.x, y: node.boundary.y + splitY, width: node.boundary.width, height: node.boundary.height - splitY });
      }
      
  
    node.isLeaf = false;
    this.split(node.left, depth - 1);
    this.split(node.right, depth - 1);
  }
  

build(depth) {
    this.split(this.root, depth);
}

traverseLeaves(node, func) {
    if (node.isLeaf) {
    func(node);
    } else {
    if (node.left) this.traverseLeaves(node.left, func);
    if (node.right) this.traverseLeaves(node.right, func);
    }
}
}

function generateRooms(gridWidth, gridHeight, depth, minRoomSize) {
    const grid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(3));
    const bsp = new BSP(gridWidth, gridHeight, minRoomSize);
    bsp.build(depth);
  
    bsp.traverseLeaves(bsp.root, (leaf) => {
      if (leaf.room) {
        // Randomize room width and height
        const roomWidth = Math.floor(Math.random() * (leaf.room.width - minRoomSize + 1)) + minRoomSize;
        const roomHeight = Math.floor(Math.random() * (leaf.room.height - minRoomSize + 1)) + minRoomSize;
  
        // Randomize room position within the leaf
        const roomX = Math.floor(Math.random() * (leaf.room.width - roomWidth + 1));
        const roomY = Math.floor(Math.random() * (leaf.room.height - roomHeight + 1));
  
        for (let y = 0; y < roomHeight; y++) {
          for (let x = 0; x < roomWidth; x++) {
            grid[leaf.room.y + roomY + y][leaf.room.x + roomX + x] = 1;
          }
        }
      }
    });
  
    return grid;
  }
function bellCurveRandom() {
    const n = 5; // Number of random numbers to average
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += Math.random();
    }
    return sum / n;
  }
  
function drawpath (origin, destination){
    // path = modifiedAstar(origin, destination, 9999999);
    path = floodFill(grid, origin[0], origin[1])
    // path = floodFill(grid, 45,45)
    // for(let i = 0; i < path.length; i++){
    //     let [y,x] = path[i];
    //     if(grid[y][x] == 6 || grid[y][x] == 3){
    //         grid[y][x] = 7;
    //     }
    // }
}

function floodFill(grid, startY, startX) {  
    const queue = [[startY, startX]];
    const regionTiles = [];
  
    while (queue.length > 0) {
      const [y,x] = queue.shift();
  
      // Skip if out of bounds
      if (x < 0 || y < 0 || x >= mapsizex || y >= mapsizey) continue;
  
      // Skip if wall or already visited
      if (grid[y][x] == 7) continue;
      if(grid[y][x] == 3 || grid[y][x] == 6){
        grid[y][x] = 7;
        continue;
      }
  
      // Assign region and add coordinates to regionTiles
      regionTiles.push([y, x]);
      grid[y][x] = 7;
  
      // Add neighbors to queue
      queue.push([y + 1, x]);
      queue.push([y - 1, x]);
      queue.push([y, x + 1]);
      queue.push([y, x - 1]);
    }

    // while(regionTiles.length > 0){
    //     const [y,x] = regionTiles.shift();
    //     if (x < 0 || y < 0 || x >= mapsizex || y >= mapsizey) continue;
    //     if (grid[y][x] == 3 || grid[y][x] == 6) continue;
    //     if(grid[y][x] !== 7){
    //         grid[y][x] = 8;
    //         continue;
    //     }
    //     regionTiles.push([y + 3, x]);
    //     regionTiles.push([y - 3, x]);
    //     regionTiles.push([y, x + 3]);
    //     regionTiles.push([y, x - 3]);
    // }
  
    // return regionTiles;
}

function modifiedFloodFill(grid, startY, startX) {
    entrancemap = identifyentrances(grid);
    referencemap = deepCopy2D(grid);
    const floorqueue = [[startY, startX]];
    const entrancequeue = [];
    let totaltiles = 1;
    while(floorqueue.length > 0 || entrancequeue.length > 0){
        while (floorqueue.length > 0) {
            const [y,x] = floorqueue.shift();
        
            // Skip if out of bounds
            if (x < 0 || y < 0 || x >= mapsizex || y >= mapsizey) continue;

            if(entrancemap[y][x] > -1){
                entrancemap[y][x]++;
                entrancequeue.push([y,x]);
                continue;
            }
        
            // Skip if wall or already visited
            if (referencemap[y][x] == 7|| referencemap[y][x] == 3 || referencemap[y][x] == 6) continue;
        
            // Assign region and add coordinates to regionTiles
            referencemap[y][x] = 7;
            totaltiles++;
        
            // Add neighbors to queue
            floorqueue.push([y + 1, x]);
            floorqueue.push([y - 1, x]);
            floorqueue.push([y, x + 1]);
            floorqueue.push([y, x - 1]);
        }
        if(entrancequeue.length > 0){
            let nextentrance = entrancequeue.pop();
            if(entrancemap[nextentrance[0]][nextentrance[1]] < 2 || (Math.random()<0.05 && entrancemap[nextentrance[0]][nextentrance[1]] < 3)){
                grid[nextentrance[0]][nextentrance[1]] = 2;
                referencemap[nextentrance[0]][nextentrance[1]] = 1;
                entrancemap[nextentrance[0]][nextentrance[1]] = -1;
                floorqueue.push(nextentrance);
            }
        }
    }
    if(totaltiles < 0.5*mapsizex*mapsizey){
        console.log("too closed off");
        generate();
    }
}

function modifiedAstar(origin, destination, explorationmax = 50, closeenough = 0) {
    const numRows = grid.length;
    const numCols = grid[0].length;

    // Define possible directions (up, down, left, right).
    let directions = [
        [-1, 0],  // Up
        [1, 0],   // Down
        [0, -1],  // Left
        [0, 1],   // Right
    ];
    // directions = shuffle(directions);

    // Helper function to check if a cell is valid (within grid boundaries and not a wall).
    function isValidCell(row, col) {
        let nocharhere = true;
        if(ischarhere(row,col) !== false){
            if(row !== origin[0] || col!== origin[1]){
                if(row !== destination[0] || col !== destination[1]){
                    nocharhere = false;
                }
            }
        }
        return (row >= 0 && col >= 0 && row < numRows && col < numCols);
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
        if(tilesexplored > explorationmax){
            // break;
        }
        // Explore neighbors.
        for (const [dx, dy] of directions) {
            const newRow = current.y + dy;
            const newCol = current.x + dx;

            if (isValidCell(newRow, newCol)) {
                let tentativeCost = cost[current.y][current.x] + 1;
                if(grid[current.y][current.x] == 6){
                    tentativeCost += 999;
                }
                if(grid[current.y][current.x] == 3){
                    tentativeCost += 10;
                }
            
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