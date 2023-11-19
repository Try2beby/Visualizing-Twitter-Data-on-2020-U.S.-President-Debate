const analyse = require('./analyse.js');
const { dataName, dataDir, cacheDir, day, processData } = require('./analyse.js');
const fs = require('fs');
const path = require('path');

// processData(day[0]);

for (let i = 1; i < day.length; i++) {
    processData(day[i]);
}


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


// add tooltip by tippy
// node.nodes().forEach(function (node) {
//     let tooltipContent;
//     let theme;
//     const d = node.__data__;
//     switch (d.type) {
//         case "tweet":
//             tooltipContent = `
//             <div class="post">
//             <div class="post-header">
//               <span>${d.username}</span>
//               <span>${d.date.substring(5)} ${d.time}</span>
//             </div>
//             <div class="post-content">${d.tweet}</div>
//             <div class="post-footer">
//             <span class="reply-count">💬 ${d.replies_count}&nbsp;&nbsp;&nbsp;</span>
//             <span class="retweet-count">🔁 ${d.retweets_count}&nbsp;&nbsp;&nbsp;</span>
//             <span class="like-count">❤️ ${d.likes_count}</span>
//             </div>
//             `;
//             theme = "transparent";
//             break;
//         case "conversation":
//             tooltipContent = `
//                 <table style="text-align: left; font-size: 10px;">
//                     <tr>
//                         <th>Conversation</th>
//                     </tr>
//                 </table>
//             `;
//             theme = "light";
//             break;
//         default:
//             break;
//     }
//     tippy(node, {
//         content: tooltipContent,
//         theme: theme,
//         allowHTML: true,
//         // hide arrow
//         arrow: false,
//     });
// });












// var Graph = graphology.Graph;
// var graph = new Graph();
// groupedData.forEach(obj => {
//     graph.addNode(obj.user_id, { type: "user", replies_count: obj.replies_count, retweets_count: obj.retweets_count, likes_count: obj.likes_count });
// });
// groupedData.forEach(obj => {
//     obj.mentions.forEach(mention => {
//         try { graph.addEdge(obj.user_id, parseInt(mention.id, 10), { type: "mention" }); }
//         catch (err) {
//             // console.log(err);
//         }
//     });
//     obj.reply_to.forEach(reply => {
//         try { graph.addEdge(obj.user_id, parseInt(reply.id, 10), { type: "reply" }); }
//         catch (err) {
//             // console.log(err);
//         }
//     });
//     obj.quote.forEach(quote => {
//         let quoteObj = data.find(item => item.id === quote);
//         if (quoteObj) {
//             try { graph.addEdge(obj.user_id, quoteObj.user_id, { type: "quote" }); }
//             catch (err) {
//                 // console.log(err);
//             }
//         }
//     });
// });
