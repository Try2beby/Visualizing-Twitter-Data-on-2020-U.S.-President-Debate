const analyse = require('./analyse.js');

analyse.processData(analyse.day[0]);



// function getFileList(dir) {
//     return fs.readdirSync(dir).map((file) => {
//         const filePath = path.join(dir, file);
//         const stats = fs.statSync(filePath);
//         if (stats.isDirectory()) {
//             return getFileList(filePath);
//         } else if (stats.isFile()) {
//             return filePath;
//         }
//     });
// }