const analyse = require('./analyse.js');
const { dataName, dataDir, day, processData } = require('./analyse.js');

day.forEach(d => { processData(d); });
