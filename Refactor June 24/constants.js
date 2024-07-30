const conditions = {
    Stunned : new condition("Stunned", skipturn, skipturn, 1, true),
    StunnedExtra : new condition("Stunned", skipturn, skipturn, 1, false),
    Surprised : new condition ("Surprised", skipturnandyelp, skipturn, 1, true),
    Prone : new condition("Prone", losemove, losemove, 1, false),
    Poisoned : new condition("Poisoned", ()=>{} , takedamage(1), 5, false),
    Unconscious : new condition("Unconscious", skipturn, 1, false),
    Confident : new condition("Confident", damagebonus(2), null, 2, false, damagebonus(-2)),
    Blind : new condition("Blinded", null,null,1,false,null,null),
    Burning : new condition("Burning", burn, null, 0, false, null,),
    OnFire : new condition("On Fire", burn, burn, 3, false, null),
    Overwatch : new condition("Overwatch", null, null, 0, false, null)
}

const triggers = {
    // SeeHostile : new trigger(true,true,hostilecheck),
    // BrightLight : new trigger(true,true,lightcheck),
}

const keybindings = {
    Aim : "a - aim attack",
    Dash : "d - dash",
    Standground : "s - stand ground",
    Overwatch : "o - overwatch",
    SwitchWeapons : "x - switch weapons",
    Space : " ",
    Zoom : "< > - zoom in and out",
    Pan : "arrow keys - pan",
    Space2 : " ",
    Reset : "r - reset game",
}

const traits = {
    Cooperative : new trait("Cooperative", hostileallycheck, becomehostile, true, true),
    Surprisable : new trait("Surprisable", hostilecheck, addcondition(conditions.Surprised,true), true, true),
    Aware : new trait("Aware", hostilecheck, becomehostile, true, true),
    LightSensitive : new trait("Light Sensitive", lightcheck(true, 2),addcondition(conditions.Stunned,true),true,true),
    LightSensitiveExtra : new trait("Light Sensitive", lightcheck(true, 2),addcondition(conditions.StunnedExtra,true),true,true),
    // AOO : new trait("Attack of Opportunity", ()=>true, attackofop, true, true),
    Overwatch : new trait("Overwatch", function () {
        if(lackscondition(conditions.Overwatch, this.character) === false){
            return true
            }
        }, overwatch, true, true),
    PackTactics : new trait("Pack Tactics", friendlyadjacent,addcondition(conditions.Confident,false),true,false),
    Sighted : new trait("Sighted", lightcheck(false, 50), addcondition(conditions.Blind),true,true),
}

let procgendebug = false;
let characterindex = 0;

const syncturns = false;
let autodash = false;
let cornershadows = false;

const dontcaredistance = 50;
let weight = 0.02;

const mapsizex = 500; //size of map in x direction
const mapsizey = 500; //size of map in y direction

let viewportsizex = 48; //size of viewport in x direction
let viewportsizey = 24; //size of viewport in y direction
let fontsize = 26;

// const viewportsizex = 100; //size of viewport in x direction
// const viewportsizey = 60; //size of viewport in y direction

const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],  
    [-1, -1],  
    [1, -1],   
    [1, 1],  
    [-1, 1],
];


//materials and the amount of light that re-emit of each RGB color
//0 means no light is re-emited. 1 means all light is re-emited
const materials = {
    "metal" : [0.5,0.5,0.5],
    "water" :[0.1,0.25,0.35], 
    "stone" : [0.6,0.6,0.6], 
    "dirt" : [0.7,0.5,0.4], 
    "abyss" : [0,0,0], 
    "crystal" : [3,3,3], 
    "brick" : [1,1,1],
    "moss" : [0.3,0.6,0.2],
    "wood" : [0.5,0.25,0.2],
    "fire" : [1, 0.25, 0.1],
    "marble" : [1,1,1],
    "bone" : [1,1,1],
};

const lights = {

}

const tilenames = ["Water","Dirt","Stone","Cavern Wall","Moss", "Rough Hewn Stone", "Rough Hewn Wall"]
const tiletypes = {
    Water : ["Water",materials.water, "~", true, 2, 1],
    DirtFloor : ["Dirt Floor", materials.dirt, "&#183", true, 1, 1],
    StoneFloor : ["Stone Floor", materials.stone, "&#183", true, 1, 1],
    CavernWall : ["Cavern Wall", materials.stone, "#", false, null, 0],
    MossFloor : ["Moss Floor", materials.moss, "&#148", true, 1, 1],
    RoughStoneFloor : ["Rough Stone Floor", materials.stone, "&#183", true, 1, 1],
    RoughStoneWall : ["Rough Stone Wall", materials.stone, "=", false, null, 0],
    SmoothstoneFloor : ["Smooth Stone Floor", materials.marble, "&#180", true, 1, 1],
    MossyWall : ["Mossy Wall", materials.moss, "#", false, null, 0],
}

const tiletypesarr = [
    tiletypes.Water,
    tiletypes.DirtFloor,
    tiletypes.StoneFloor,
    tiletypes.CavernWall,
    tiletypes.MossFloor,
    tiletypes.RoughStoneFloor,
    tiletypes.RoughStoneWall
]

// constructor(absorbtionBase, symbolBase, traversable, moveCost, pos, transparancy){

const actions = {
    SwitchWeapon : ["Switch Weapon", switchweapon, [0,0,0],],
    HalfAttack : ["Attack", attackfunc, [0,0.5,0]],
    Attack : ["Attack", attackfunc, [0,1,0]],
    // ProneAttack : ["Attack", conditionattack(conditions.Prone), [0,1,0]],
    // StunAttack : ["Attack", conditionattack(conditions.Stunned), [0,1,0]],
    // SneakAttack : ["Attack", sneakattackfunc, [0,1,0]],
    CleaveAttack : ["Cleave", cleaveattack, [0,1,0]],
    GrenadeAttack : ["Grenade", grenadeattack, [0,1,0]],
    Open : ["Open", open, [0,0,0], 1.9],
    Dash : ["Dash", dashfunc, [0,1,0]],
    // GenericMelee : ["Attack", attackfunc, [0,1], 1.9],
    // PoisonMelee : ["Poison Attack", conditionattack(conditions.Poisoned), [0,1], 1.9],
    // GenericRanged : ["Ranged Attack", attackfunc, [0,1], 6.9],
}

const items = {

    MagicSword : ["Magic Sword", "/", materials.marble, actions.Attack, 1.9, 2, 6],
    Grenade : ["Grenade", "%", [0,0,0], actions.GrenadeAttack, 5.9, 0, 0],
    Longsword : ["Longsword", "/", materials.metal, actions.Attack, 1.9, 0, 6, 0, null, soundeffects.sworddraw, soundeffects.swordhit, soundeffects.swordswing],
    BattleAxe : ["Battle Axe", "/", materials.metal, actions.CleaveAttack, 1.9, 0, 6],
    Warhammer : ["Warhammer", "T", materials.metal, actions.ProneAttack, 1.9, 0, 4, 0, null, null, soundeffects.clubhit, soundeffects.clubswing],
    Javelin : ["Javelin" , "|", materials.wood, actions.Attack, 3.5, 0, 4, 0, null, soundeffects.tap, soundeffects.arrowflight],
    Longbow : ["Longbow", ")", materials.wood, actions.Attack, 6.9, 0, 6, 1,1.9, soundeffects.bowdraw, soundeffects.arrowflight],
    Shortsword : ["Shortsword", "/", materials.metal, actions.Attack, 1.9, 0, 4, 1, null, soundeffects.shortsworddraw],
    ThrowingDagger : ["Throwing Dagger", "&#x2020", materials.metal, actions.Attack, 3.5, 0, 2, 1, null, soundeffects.daggerdraw, soundeffects.arrowflight],
    Dagger : ["Dagger", "&#x2020", materials.metal, actions.Attack, 1.9, 0, 4, 1, null, soundeffects.daggerdraw, soundeffects.puncture],
    Shiv : ["Shiv", "&#x2020", materials.metal, actions.Attack, 1.9, 0, 2, 1, null, soundeffects.daggerdraw],
    Shortbow : ["Shortbow", ")", materials.wood, actions.Attack, 6.9, 0, 4, 1, 1.9, soundeffects.bowdraw],
    ToxicDart : ["Toxic Dart", "-", [0,0,0], actions.ProneAttack, 6.9, 0, 2],
    Net : ["Net", "#", [0,0,0], actions.Attack, 3.9, 0, 1, 1]
}

const statblocks = {
    Deserter : [3, 0, 2],
    Exile : [1,2,0],
    Wanderer : [1,2,0],
    Goblin : [0,0,0],
}

const enemies = {
    Goblin_Dagger : ["Goblin", statblocks.Goblin, 4, [5,1,1], false, "g", [150,125,0], 8, [traits.LightSensitive],[new Weapon(...items.Dagger)],[spot, attackofop], darkattackpermute],
    Goblin_Shortbow : ["Goblin", statblocks.Goblin, 4, [5,1,1], false, "g", [100,150,0], 8, [traits.LightSensitive],[new Weapon(...items.Shortbow)],[spot, attackofop], darkattackpermute],
    Goblin_Net : ["Goblin", statblocks.Goblin, 4, [5,1,1], false, "g", [150,100,0], 8, [traits.LightSensitive],[new Weapon(...items.Net)],[spot, attackofop], function (input,input2){return(darkattackpermute(conditionattackpermute(conditions.Prone)(input,input2)))}],
    Ogre : ["Ogre", [3,0,4], 12, [3,1,1], false, "o", [150,125,0], 8, [], [new Weapon(...items.Warhammer)],[spot, attackofop],function (input,input2){return(darkattackpermute(conditionattackpermute(conditions.Prone)(input,input2)))}],
    Skulker : ["Skulker", [0,2,0], 5, [10,1,1], false, "s", [32,32,32], 12, [traits.LightSensitive], [new Weapon(...items.ToxicDart)],[spot, attackofop], function (input,input2){return(darkattackpermute(conditionattackpermute(conditions.Prone)(input,input2)))}]
    // Snake : ["Snake", 3, [7,1], false, "s", "idle", [100,150,0], 6, [traits.Aware],[actions.GenericMelee]],
    // Rat : ["Rat", 1, 1, false, "r", "idle", [32,32,32], 5, 0, 1, 0, []],
}

const objects = {
    TallGrass : ["Grass", "&#x222B", materials.moss, null, 0.75, true, 1, []],
    Campfire : ["Fire", "*", materials.fire, null, 0, true, 1, null, [objectburn]],
    Door : ["Door", "+", materials.wood, null, 1, false, null, actions.Open, []],
    Table : ["Table", "&#X20B8", materials.wood, null, 0.25, true, 2, []],
    Chair : ["Chair", "&#X043F", materials.wood, null, 0.25, true, 2, []],
    Bed : ["Bed", "0", materials.wood, null, 0.2, true, 2, []],
    Statue : ["Statue", "&#X03A9", materials.marble, null, 0.5, false, []],
    Skeleton : ["Skeleton", "@", materials.bone, null, 0, true, 0, null, []],
    Sarcophagus : ["Sarcophagus", "I", materials.stone, null, 0.5, false, []],
    Curtain : ["Curtain", "+", materials.wood, null, 1, true, null, []],
}

/*

&#149 : dot
&#147 : curly quote 1
&#148 : curly quote 2
&#180 : marble?
&#183 : square dot
043F : chair
20B8 : table
2020 : dagger

*/

let brightnessadjust = 1;
let viewportoffsety = 0;
let viewportoffsetx = 0;

const throttleRate = 10;
let lastCall = 0;

let enemyturnstart = 0;

let soundoffset = 2.5;
let Q = 5;

let frameticker = 0;
let timeticker = 0;
let noiseupdateticker = 0;
const screenupdatefraction = 10 //time delay between graphical updates of the screen expressed as a multiple of the noiseupdate frequency
const noiseupdaterate = 100; //time delay between updates of the noisemap in milliseconds
const noisethreshold = 0.5; //how likely a tile is to flicker. It is weighted by the light
const waterthreshhold = 0.6; //how likely water is to shimmer. It is weighted by the light
const noiseamount = 0.1; //maximum amount by which a flickering tile can change brightness
const lightflickerthreshhold = 0.8;
const floortiles = ["~", "&#183", "&#183", "#", "&#148", ",", "=", "+", "?"] //the symbols associated with tiles of different kinds
//the material of each of the above tiles in order
const tileabsorbs = [materials.water, 
    materials.dirt,
    materials.stone,
    materials.stone,
    materials.moss,
    materials.stone,
    materials.stone,
    materials.crystal,
    materials.abyss,
];

const diffgens = 3; //generations of diffusion
const cdiff = 1/20; //coefficient of diffusion
const colorbleed = 1; //ratio of color bleed to color-neutral diffusion

const gamma = 1.5;
const q = 1;

let ticktimer = 150;

const maxlightdist = 15;
const lightrenderdist = 10;

const roomrelation = [[1,2],[2],[1]];

const roomfuncs = {
    Test : function ([sy,sx]) {
        let room = [];
        return(room);
    }
}

const roomtypes = {
    TestRoom : new Roomtype("Test Room",roomfuncs.Test),
    Barracks : new Roomtype("Barracks",[[3,5],[5,8]],([sizey,sizex],[my,mx],[y,x],dir)=>{return 1}),
    Corridor : new Roomtype("Corridor", [[2,2],[2,2]],([sizey,sizex],[my,mx],[y,x],dir)=>{return 1}),
    CommonArea : new Roomtype("Common Area", [[10,15],[10,15]],([sizey,sizex],[my,mx],[y,x],dir)=>{
        if(dist([my,mx],[y,x]) <= Math.max(sizey,sizex))return 1}),
    Bedroom : new Roomtype("Bedroom", [[2,2],[2,2]] ,()=>1),
    Entrance : new Roomtype("Entrance", [[10,10],[10,10]], ()=>1),
    Chapel : new Roomtype("Chapel", [[12,12],[20,20]],([sizey,sizex],[my,mx],[y,x],dir)=>{if(dist([my,mx],[y,x]) <= Math.max(sizey,sizex))return 1}),
    ChapelAntichamber : new Roomtype ("Chapel Antichamber",[[1,1],[1,1]],()=>1),
    Tomb : new Roomtype ("Tomb",[[1,1],[1,1]],()=>1),
    Donut : new Roomtype("Donut", [[3,9],[3,9]],([sizey,sizex],[my,mx],[y,x],dir)=>{
        sizey = Math.max(sizey,sizex);
        sizex = Math.max(sizey,sizex);
        if(dist([my,mx],[y,x]) <= Math.min(sizey, sizex) && dist([my,mx],[y,x]) >= sizey/4)return 1}),
    Squonut : new Roomtype("Squonut", [[9,9],[9,9]],([sizey,sizex],[my,mx],[y,x],dir)=>{
        sizey = Math.max(sizey,sizex);
        sizex = Math.max(sizey,sizex);
        if(chebyshevDistance([my,mx],[y,x]) >= Math.max(sizey,sizex)/2)return 1}),
    
    Bossroom : new Roomtype("Bossroom", [[6,6],[6,6]], ([sizey,sizex],[my,mx],[y,x])=>{
        halfy = Math.floor(sizey/2);
        halfx = Math.floor(sizex/2);
        if(roomprefabs.Bossroom[y-(my-halfy-2)][x-(mx-halfx-2)] == 0){
            return (1);
        }
        if(roomprefabs.Bossroom[y-(my-halfy-2)][x-(mx-halfx-2)] == 2){
            return(2);
        }
        
    }, objects.TallGrass)
}
roomtypes.TestRoom.childrooms = []
roomtypes.Barracks.childrooms = [ roomtypes.Bedroom, roomtypes.Corridor];
roomtypes.Corridor.childrooms = [roomtypes.Bossroom, roomtypes.Barracks, roomtypes.CommonArea, roomtypes.Squonut, roomtypes.Donut];
roomtypes.CommonArea.childrooms = [roomtypes.ChapelAntichamber, roomtypes.Corridor];
roomtypes.Bedroom.childrooms = [];
roomtypes.Entrance.childrooms = [roomtypes.Corridor];
roomtypes.ChapelAntichamber.childrooms = [roomtypes.Chapel];
roomtypes.Chapel.childrooms = [roomtypes.Tomb];
roomtypes.Tomb.childrooms = [];
roomtypes.Donut.childrooms = [roomtypes.Barracks, roomtypes.CommonArea, roomtypes.Bossroom];
roomtypes.Squonut.childrooms = [roomtypes.Corridor];
roomtypes.Bossroom.childrooms = [roomtypes.Donut, roomtypes.Squonut, roomtypes.CommonArea];

roomprefabs = {
    Bossroom :
    [[0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0],
     [0,0,1,0,1,0,0],
     [0,0,0,2,0,0,0],
     [0,0,1,0,1,0,0],
     [0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0],]
}