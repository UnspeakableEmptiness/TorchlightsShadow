function updatelightmap(){
    let buffer = 4;
    let startx = viewportpos[1] - (viewportsizex/2)-buffer;
    let starty = viewportpos[0] - (viewportsizey/2)-buffer;
    let endx = viewportpos[1] + (viewportsizex/2)+buffer;
    let endy = viewportpos[0] + (viewportsizey/2)+buffer;
    if(starty < 0){
        starty = 0;
        endy = viewportsizey+buffer;
    }
    if(endy > mapsizey){
        endy = mapsizey;
        starty = mapsizey - (viewportsizey+buffer);
    }
    if(startx < 0){
        startx = 0;
        endx = viewportsizex+buffer;
    }
    if(endx > mapsizex){
        endx = mapsizex;
        startx = mapsizex - (viewportsizex+buffer);
    }
    updatesightmap(startx,starty,endx,endy);
    updatelighting(startx,starty,endx,endy);
    updatediffusion(startx,starty,endx,endy);    
    prunesightmap(startx,starty,endx,endy);
}

function updatelightlevelsmaybe() {
    let buffer = 4;
    let startx = viewportpos[1] - (viewportsizex/2)-buffer;
    let starty = viewportpos[0] - (viewportsizey/2)-buffer;
    let endx = viewportpos[1] + (viewportsizex/2)+buffer;
    let endy = viewportpos[0] + (viewportsizey/2)+buffer;
    if(starty < 0){
        starty = 0;
        endy = viewportsizey+buffer;
    }
    if(endy > mapsizey){
        endy = mapsizey;
        starty = mapsizey - (viewportsizey+buffer);
    }
    if(startx < 0){
        startx = 0;
        endx = viewportsizex+buffer;
    }
    if(endx > mapsizex){
        endx = mapsizex;
        startx = mapsizex - (viewportsizex+buffer);
    }
    updatelighting(startx,starty,endx,endy);
}

function updatesightmap (startx,starty,endx,endy){
    for(let y = starty; y < endy; y++){
        for(let x = startx; x < endx; x++){
            if(!procgendebug){
                newgrid[y][x].visible = false;
            }
            else{
                newgrid[y][x].visible = true;
            }
        }
    }
    for(let y = starty; y < endy; y++){
        for(let x = startx; x < endx; x++){
            for(let i = 0; i <playercs.length; i++){
                if(drawline(playercs[i].pos,[y,x]) < 0.9 && drawline(playercs[i].pos,[y,x]) !== false && playercs[i].dead !== true){
                    // newgrid[y][x].visible = Math.max(1 - drawline(playercs[i].pos,[y,x]), newgrid[y][x].visible);
                    newgrid[y][x].visible = true;
                    if(newgrid[y][x].readOpacity() < 0.9){
                        for(let localy = y-1; localy <= y+1; localy++){
                            if(localy > 0 && localy < mapsizey){
                                for(let localx = x-1; localx <= x+1; localx++){
                                    if(localx > 0 && localx < mapsizex){
                                        // newgrid[localy][localx].visible = Math.max(drawline(playercs[i].pos,[y,x]),drawline(playercs[i].pos,[localy,localx]),newgrid[localy][localx].visible);
                                        newgrid[localy][localx].visible = true;
                                        // if(newgrid[localy][localx].visible < 0.5 || newgrid[localy][localx].visible == false){
                                        //     newgrid[localy][localx].visible = 0.5;
                                        // }

                                    }
                                }
                            }
                        }
                    }

                }
            }
        }
    }
}

function prunesightmap (startx,starty,endx,endy){
    for(let y = starty; y < endy; y++){
        for(let x = startx; x < endx; x++){
            // if(takeav(newgrid[y][x].light) < 1){
            //     if(!procgendebug){
            //         newgrid[y][x].visible = false;
            //     }
            // }
            if(newgrid[y][x].lightlevel < 1 && newgrid[y][x].visible !== false){
                if(!procgendebug){
                    newgrid[y][x].visible = false;
                }
                for(let localy = y-2; localy <= y+2; localy++){
                    if(localy > 0 && localy < mapsizey){
                        for(let localx = x-2; localx <= x+2; localx++){
                            if(localx > 0 && localx < mapsizex){
                                if(newgrid[localy][localx].lightlevel > 0 && newgrid[localy][localx].readOpacity() < 0.9 && drawline([y,x],[localy,localx]) < 0.9 && drawline([y,x],[localy,localx]) !== false){
                                    newgrid[y][x].visible = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            if(newgrid[y][x].visible == false || takeav (newgrid[y][x].light) < 16){
                for(let i = 0; i <playercs.length; i++){
                    if(dist([y,x],playercs[i].pos) < 1.5 && drawline(playercs[i].pos,[y,x]) !== false){
                        newgrid[y][x].visible = true;
                        newgrid[y][x].light = newgrid[y][x].light.map((element) => 16);
                        break;
                    }
                }
            }
        }
    }
}

function updatelighting (startx,starty,endx,endy){
    let nearbyls = [];
    for(let y = starty; y < endy; y++){
        for(let x = startx; x < endx; x++){
            const light = newgrid[y][x].readLightsource();
            if(light != null){
                light.pos = [y,x].slice();
                nearbyls.push(light);
            }
        }
    }
    for(let y = starty; y < endy; y++){
        for(let x = startx; x < endx; x++){
            newgrid[y][x].light = [0,0,0];
            newgrid[y][x].lightlevel = 0;
            if(newgrid[y][x].visible !== false && newgrid[y][x].readOpacity() < 1){
                for(let i = 0; i < nearbyls.length; i++){
                    let {newcolor, lightlevel} = getlighting(y,x,nearbyls[i]);
                    lightlevel = Math.max(lightlevel,newgrid[y][x].lightlevel);
                    newgrid[y][x].lightlevel = lightlevel;
                    newgrid[y][x].light = newgrid[y][x].light.map((element, index) => element + newcolor[index]);
                }
            }
        }
    }
}

function updatediffusion (startx,starty,endx,endy){
    let walls = [];
    for(let i = 0; i < diffgens ; i++){
        let referencemap = [];
        for(let y = starty; y < endy; y++){
            referencemap[y-starty] = [];
            for(let x = startx; x < endx; x++){
                referencemap[y-starty][x-startx] = newgrid[y][x].light.slice();
            }
        }

        // let referencemap = deepCopySubArray3D(lightmap,startx,starty,endx-1,endy-1);
        for(let y = starty; y < endy; y++){
            for(let x = startx; x < endx; x++){
                // newgrid[y][x].visible = true;
                let newcolor = [0,0,0];
                if(newgrid[y][x].visible == true){
                    for(let localy = y-1; localy <= y+1; localy++){
                        if(localy > 0 && localy < mapsizey && localy-starty > 0 && localy-starty < referencemap.length){
                            for(let localx = x-1; localx <= x+1; localx++){
                                if(localx > 0 && localx < mapsizex && localx-startx > 0 && localx-startx < referencemap[0].length && (localy != y || localx != x)){
                                    if(newgrid[localy][localx].readOpacity() < 1){
                                        let tempnewcolor = [0,0,0];
                                        tempnewcolor = tempnewcolor.map((element,index) => cdiff*referencemap[localy-starty][localx-startx][index]*tileabsorbs[grid[y][x]][0]);
                                        let avbrightness = takeav(tempnewcolor);
                                        tempnewcolor = tempnewcolor.map((element,index) => (colorbleed*tempnewcolor[index]+avbrightness)/(colorbleed+1));
                                        newgrid[localy][localx].light = newgrid[localy][localx].light.map((element, index) => element - avbrightness);
                                        newcolor = newcolor.map((element, index) => element + tempnewcolor[index]*(1-newgrid[localy][localx].readOpacity()));
                                    }
                                }
                            }
                        }
                    }
                }
                newgrid[y][x].light = newgrid[y][x].light.map((element, index) => element + newcolor[index]);
            }
        }
    }
}

function getlighting (y,x,source){
    let lightcolor = source.color.slice();
    lightcolor = lightcolor.map((element, index) => element*noisemap[source.pos[0]][source.pos[1]]);
    let lightpref = source.lightpref;
    let lightpos = source.pos;
    let distance = dist([y,x], lightpos);
    let lightlevel = Math.min(Math.round((source.radiance +0.25) - (distance-1)/4), source.radiance);
    if (distance > maxlightdist || lightlevel <= 0){
        return { newcolor: [0, 0, 0], lightlevel: 0 };
    }
    
    const opacity = drawline(source.pos,[y,x]);
    if(opacity === false){
        return { newcolor: [0, 0, 0], lightlevel: 0 };
    }

    lightlevel = Math.round(lightlevel*(1-opacity));
    // lightlevel = Math.min(Math.round((source.radiance +0.25) - ((distance-1)*(1+opacity))/4), source.radiance);

    const intensity = lightcolor.map((value,index) => (1/(((distance/lightpref[index])**2)+1))*(1-opacity));
    const returncolor = lightcolor.map((value, index) => value*intensity[index]);
    return { newcolor: returncolor, lightlevel: lightlevel };
}