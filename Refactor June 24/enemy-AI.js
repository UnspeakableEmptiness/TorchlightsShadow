function planturn(enemy) {
    const start = performance.now()
    spot(enemy);
    // console.log(enemy.state);
    let nodemap = new Map();
    const utilityfunction = enemy.state.utilityfunction;
    const startnode = new ActionNode(enemy.pos, null, enemy.tc, 0, 0, null, -9999, enemy.equipment[0]);
    const candidatenodes = new PriorityQueue((a, b) => b.utility - a.utility);
    candidatenodes.enqueue(startnode);

    let bestnode = startnode;
    let startutility = utilityfunction(startnode, enemy);
    let bestutility = startutility;
    
    let iterations = 0;
    let comparisons = 0;

    while (!candidatenodes.isEmpty() && iterations < 5000) {
        iterations++;
        let thisnode = candidatenodes.dequeue();
        let [y, x] = thisnode.pos;
        let { tc, utility: thisutility, damagepotential, hazards } = thisnode;
        let [move, actions] = tc;
        let skipthisnode = false;
        
        if (actions < 0 || move < 0) continue;
        if (thisutility > 100) {
            bestnode = thisnode;
            break;
        }

        if ((actions < 1 && thisutility < bestutility) || thisutility < -100) skipthisnode;

        const nodeKey = `${y},${x}`;
        if (!nodemap.has(nodeKey)) {
            nodemap.set(nodeKey, []);
        }

        let nodeList = nodemap.get(nodeKey);
        for (let compnode of nodeList) {
            comparisons++;
            if (actions <= compnode.tc[1] && move <= compnode.tc[0] &&
                damagepotential <= compnode.damagepotential &&
                hazards >= compnode.hazards && thisutility <= compnode.utility) {
                skipthisnode = true;
                break;
            }
        }

        if (skipthisnode) continue;
        
        nodeList.push(thisnode);
        if (thisutility > bestutility) {
            bestnode = thisnode;
            bestutility = thisutility;
        }

        let possibleactions = enemy.state.actions.map(action => enemy.actions[action]);
        possibleactions.forEach(actionFunc => {
            let newnodes = actionFunc(thisnode, enemy, thisutility);
            if (newnodes.length > 0) {
                newnodes.forEach(newNode => {
                    newNode.utility = utilityfunction(newNode, enemy);
                    candidatenodes.enqueue(newNode);
                });
            }
        });
    }
    const end = performance.now();
    // console.log(`planturn took ${end-start} time to run`);
    if(enemy.state.name == enemy.states[0].name){
        // console.log(bestnode);
    }
    // console.log(`enemy number ${enemy.index} is ${enemy.state.name} and took ${iterations} iterations`);
    // console.log(turnnodeintoaq(bestnode));
    return turnnodeintoaq(bestnode);

    function turnnodeintoaq(node) {
        let aq = [];
        while (node.action != null) {
            aq.unshift(node.action);
            node = node.parentnode;
        }
        return aq;
    }
}

function subtractcost (action,tc){
    const returnvalue = (tc.map((element, index) => element-action.cost[index]));
    return(returnvalue);
}

class ActionNode{
    constructor (pos ,action, tc, hazards, damagepotential, parentnode, parentutility, activeweapon) {
        this.pos = pos;
        this.action = action;
        if(tc)this.tc = tc.slice();
        else this.tc = [];
        this.hazards = hazards;
        this.damagepotential = damagepotential;
        this.parentnode = parentnode;
        this.parentutility = parentutility;
        this.activeweapon = activeweapon || this.parentnode.activeweapon;
    }
}