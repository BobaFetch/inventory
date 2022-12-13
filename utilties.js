
function convertLocation(loc) {
    const trimLoc = loc.toLowerCase().trim();

    if (trimLoc.length <= 4) {
        return trimLoc.toUpperCase();
    } else if (trimLoc.slice(0, 5) === 'm top') {
        const boxNum = trimLoc.split('').pop()
        return `MTB${boxNum}`
    } else if (trimLoc.slice(0, 5) === 'tumbl' || trimLoc.slice(0, 5) === 'above') {
        return 'TMBL'
    } else if (trimLoc == 'c-1 shelf') {
        return 'C-1S'
    } else if (trimLoc.slice(0, 5) == 'cubby') {
        const locNum = trimLoc.slice(6, 8)
        return `CB${locNum}`
    } else if (trimLoc.slice(0, 3) === 'arr') {
        return trimLoc.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    } else if (trimLoc === 'tfloor') {
        return `TFLR`
    } else if (trimLoc.length == 5) {
        return stripBox(trimLoc).toUpperCase();
    } else {
        return `needs work ${trimLoc}`
    }
}

function getCost(priceStr) {
    const tempPriceStr = priceStr.replace(/[^0-9\.]/, '');
    const base = parseFloat(tempPriceStr);
    
    return base - (base * .2);
}

function stripHyphen(strIn) {
    return strIn.replace(/(?<=[a-zA-Z0-9])-(?=[a-zA-Z0-9])/g, '');
}

function stripBox(boxLoc) {
    let locSplice = boxLoc.split('');

    for (let i = 1; i < locSplice.length; i++) {
        if (locSplice[i].toLowerCase() === 'b') {
            locSplice.splice(i, 1);
        }
    }

    return locSplice.join('');
}

async function partExists(pool, partRef) {
    const res = await pool.query(`SELECT COUNT(PARTREF) AS COUNT FROM PartTable WHERE PARTREF='${partRef}'`)
    
    if (res.recordset[0].COUNT === 1) {
        return true
    }
    return false
}

module.exports = {
    convertLocation,
    getCost,
    stripHyphen,
    partExists
}