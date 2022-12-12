
// done
async function addNewPart(pool, part) {
    await pool.query(`
      INSERT INTO PartTable 
      (PARTREF, PARTNUM, PALEVEL, PAMAKEBUY, PAPRODCODE, PACLASS, PALOCATION, PAONDOCK, PALOTTRACK, PAAVGCOST, PAUNITS, PAPUNITS, PAPURCONV)
      VALUES
      ('${part.paRef}', '${part.paNumber}', '${part.paLevel}', 'M', '${part.paCode}', '${part.paClass}', '${part.paLocation}', 0, 1, ${part.paCost}, 'EA', 'EA', 1.0000);
    `);

    // await addInventory(pool, part);
}

async function addInventory(pool, part) {
    const dateRef = new Date(Date.now());
    const lotNumber = createLotNumber(dateRef)
    const lotUser = 'AR';
    
    try {
        await updateLohdTable(pool, part, lotNumber, dateRef)
            // .then(await updateLoitTable(pool, part, lotNumber, dateRef))
            // .then(await updateInvaTable(pool, part, lotNumber, dateRef));
        await updateLoitTable(pool, part, lotNumber, dateRef);
        await updateInvaTable(pool, part, lotNumber, dateRef)
    } catch (err) {
        console.log(err.message);
    }
}

async function updateLohdTable(pool, part, lotRef, dateRef) {
        console.log('lohd')
        await pool.query(`
        INSERT INTO LohdTable
        (LOTNUMBER, LOTUSERLOTID, LOTUNITCOST, LOTPARTREF, LOTCOMMENTS, LOTPDATE, LOTORIGINALQTY, LOTREMAININGQTY, LOTLOCATION, LOTMAINTCOSTED, LOTUSER, LOTTOTLABOR)
        VALUES 
        ('${lotRef}', '${part.paPB}', '${part.paCost}', '${part.paRef}', 'NEEDS REVIEW', CAST('${dateRef.toLocaleDateString()}' AS smalldatetime), ${part.paQty}, ${part.paQty}, '${part.paLocation}', 0, 'AR', ${part.paQty * part.paCost})
        `)
}

async function updateLoitTable(pool, part, lotRef, dateRef) {
    console.log('loit')
    // const lotNum = await pool.query('SELECT TOP 1 LOIACTIVITY FROM LoitTable ORDER BY LOIACTIVITY DESC')
    //     .then((res) => res.recordset[0].LOIACTIVITY)

    await pool.query(`
        INSERT INTO LoitTable
        (LOINUMBER, LOIRECORD, LOITYPE, LOIPARTREF, LOIADATE, LOIPDATE, LOIQUANTITY, LOICOMMENT, LOIACTIVITY)
        VALUES 
        ('${lotRef}', 1, 19, '${part.paRef}', CAST('${dateRef.toLocaleDateString()}' AS smalldatetime ), CAST('${dateRef.toLocaleDateString()}' AS smalldatetime), ${part.paQty}, 'Manual Inventory Adjustment', ${part.inNumber})
    `).catch((err) => console.log(err.message))
}

async function updateInvaTable(pool, part, lotRef, dateRef) {
    console.log('inva')
    // const inNum = await pool.query('SELECT TOP 1 INNUMBER FROM InvaTable ORDER BY INNUMBER DESC')
    //   .then((res) => res.recordset[0].INNUMBER);

    await pool.query(`
        INSERT INTO InvaTable 
        (INTYPE, INPART, INREF1, INREF2, INPDATE, INADATE, INAQTY, INAMT, INCREDITACCT, INDEBITACCT, INMOPART, INMORUN, INTOTMATL, INTOTLABOR, INTOTEXP, INTOTOH, INTOTHRS, INWIPLABACCT, INWIPMATACCT, INWIPOHDACCT, INWIPEXPACCT, INNUMBER, INLOTNUMBER, INUSER)
        VALUES
        (19, '${part.paRef}', 'Manual Adjustment', 'NEEDS REVIEW', CAST('${dateRef.toLocaleDateString()}' AS smalldatetime), CAST('${dateRef.toLocaleDateString()}' AS smalldatetime), ${part.paQty}, ${part.paCost}, 1200, 4000, '', 0, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, '', '', '', '', ${part.inNumber}, '${lotRef}', 'AR')
    `)
}

function createLotNumber(dateRef) {
    const epoch = dateRef.getTime().toString().split('');
    
    epoch.splice(5, 0, '-');
    epoch.splice(12, 0, '-');

    return epoch.join('');
}
