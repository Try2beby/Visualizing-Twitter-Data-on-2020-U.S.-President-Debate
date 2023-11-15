const analyse = require('./analyse.js');
const { dataName, cacheDir, day, processData } = require('./analyse.js');
const fs = require('fs');
const path = require('path');

let temp = day.map(d => cacheDir + dataName(d));

// let params = {
//     Data: [],
// }

// async function loadAllData() {
//     let promises = day.map(loadData);
//     params.Data = await Promise.all(promises);
//     console.log("done");
// }

// async function loadData(day) {
//     const data = fs.readFileSync(path.join(cacheDir, dataName(day)), "utf8");
//     return data;
// }

// loadAllData();

