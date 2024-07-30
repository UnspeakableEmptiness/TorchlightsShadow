function dist (coords1, coords2){
    let xdist = Math.abs(coords1[0]-coords2[0]);
    let ydist = Math.abs(coords1[1]-coords2[1]);
    let dist = Math.sqrt((xdist**2)+(ydist**2));
    return(dist);
}

function repeatchar (character, repetitions) {
    let string = "";
    for(let i = 0; i < repetitions; i++){
        string += character;
    }
    return(string);
}

function addLineBreaks(str, interval) {
    let result = '';
    for(let i = 0; i < str.length; i++) {
        result += str[i];
        if ((i + 1) % interval === 0 && i !== str.length - 1) {
            result += '<br>';  // Add a line break
        }
    }
    return result;
}

function roll (die,modifier) {
    return(randomNumber(die,1)+modifier)
}

function randomNumber(max, min = 0) {
    return Math.floor(Math.random() * (max - min) + min);
}

function bresenhamLine([x0, y0], [x1, y1]) {
    let points = [];
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        points.push([x0, y0]);

        if (x0 === x1 && y0 === y1) break;

        let e2 = 2 * err;
        if (e2 > -dy) { 
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) { 
            err += dx;
            y0 += sy;
        }
    }

    return points;
}

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex > 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
}

function deepCopy3D(arr) {
    return arr.map(row => 
        row.map(cell => 
            cell.map(value => value)
        )
    );
}

function deepCopySubArray3D(arr, startx, starty, endx, endy) {
    let newarr = [];
    for(let y = starty; y <= endy; y++){
        newarr[y-starty] = []
        for(let x = startx; x <= endx; x++){
            newarr[y-starty][x-startx] = [];
            for(let z = 0; z < arr[0][0].length; z++){
                newarr[y-starty][x-startx][z] = arr[y][x][z];
            }
        }
    }
    return(newarr);
}

function deepCopySubArray2D(arr, startx, starty, endx, endy){
    let newarr = [];
    for(let y = starty; y <= endy; y++){
        newarr[y-starty] = []
        for(let x = startx; x <= endx; x++){
            newarr[y-starty][x-startx] = arr[y][x];
        }
    }
}

function deepCopy2D (arr) {
    let newarr = [];
    for(let y = 0; y < arr.length; y++){
        newarr[y] = [];
        for(let x = 0; x < arr[0].length; x++){
            newarr[y][x] = arr[y][x];
        }
    }
    return(newarr);
}

function partialFill(arr, element, startx, starty, endx, endy){
    for(let x = startx; x < endx; x++){
        for(let y = starty; y < endy; y++){
            arr[y][x] = element;
        }
    }
}

function shadowslope ([y1,x1],[y2,x2]) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const slope = dy/dx;
    const perpslope = -dx/dy;
    const distance = chebyshevDistance([y1,x1],[y2,x2]);
    let point = [y2+perpslope/Math.sqrt(1+perpslope**2),x2+(1/Math.sqrt(1+perpslope**2))];
    
    const newdx = Math.abs(point[1] - x1);
    const newdy = Math.abs(point[0] - y1);
    let doubleslope = newdy/newdx;
    let realslope = doubleslope/2;
    let slopeadjust = Math.abs(slope-realslope);

    return;
}

function takeav (arr){
    return(arr.reduce((prev,curr) => prev+curr)/arr.length);
}

function manhattanDistance(pos1, pos2) {
    return Math.abs(pos1[0] - pos2[0]) + Math.abs(pos1[1] - pos2[1]);
}

function convertColortoAbs (color){
    const abs = color.map((element) => (element)/256);
    return(abs);
}

function convertAbstoColor (abs){
    const color = abs.map((element) => (element)*256);
    return(color)
}

function randomint(min, max) {
    if (min > max) {
        // Swap values if min is greater than max
        [min, max] = [max, min];
    }
    // The Math.random() function returns a floating-point, pseudo-random number in the range 0 to less than 1
    // Multiply by (max - min + 1) to get a number in the desired range and add min to shift to the correct range
    // Math.floor() is used to round the number down to the nearest whole number
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chebyshevDistance(point1, point2) {
    // Extracting coordinates from the points
    const [x1, y1] = point1;
    const [x2, y2] = point2;

    // Calculating the maximum absolute difference along any coordinate
    return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
}

function combineFunctions(func1, func2) {
    // Bind both functions to the current 'this' context
    const boundFunc1 = func1.bind(this);
    const boundFunc2 = func2.bind(this);

    // Return a new function that calls both functions in sequence
    return () => {
        boundFunc1();
        boundFunc2();
    };
}