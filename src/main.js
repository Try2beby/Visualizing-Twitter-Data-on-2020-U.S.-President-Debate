const analyse = require('./analyse.js');
const { dataName, dataDir, cacheDir, day, processData } = require('./analyse.js');
const fs = require('fs');
const path = require('path');

// day.forEach((day) => { processData(day) });

const A = [123, 456];
const flag = A.includes(123);

// const filepath = path.join(dataDir, dataName(day[4]));
// const content = fs.readFileSync(filepath, "utf8");
// const jsonStrings = content.split("\n");
// // if the last line is empty, remove it
// if (jsonStrings[jsonStrings.length - 1] === "") {
//     jsonStrings.pop();
// }
// let data = jsonStrings.map((str) => JSON.parse(str));

// // filter data with quote_url
// let data1 = data.filter((obj) => obj.quote_url);

// let quote = data1.map((obj) => obj.quote_url.split("/").pop());

