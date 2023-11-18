async function loadAllData() {
    const worker = new Worker("worker.js");
    worker.postMessage(day.map(d => cacheDir + dataName(d)));
    worker.onmessage = function (e) {
        console.log("done");
        params.Data = e.data;
        params.DataReady = true;
    }
}

async function loadData(day) {
    if (params.DataReady) {
        return params.Data[day];
    }
    const data = await d3.json(cacheDir + dataName(day));
    return data;
}

async function filterWords(words) {
    let stopwords = await d3.json("../utils/stopwords-en.json");
    // drop words in stopwords or additonal stopwords
    // define addStopwords as ["","-"]
    const addStopwords = ["", "-", "i’m", "/", 'don’t', "'s", ":", "\"", "“", "”"];
    stopwords = stopwords.concat(addStopwords);
    // change words to lowercase when comparing
    let fwords = words.filter(d => !stopwords.includes(d.toLowerCase()));
    return fwords;
}

async function processWord(data) {
    // use first 1000 objects for testing
    // data = data.slice(0, 1000);
    // Split the tweets into words
    let words = data.flatMap(obj => obj.cleaned_tweet.split(/\s+/));
    let fWords = await filterWords(words);
    // Count the frequency of each word
    let wordCounts = new Map();
    fWords.forEach(word => wordCounts.set(word, (wordCounts.get(word) || 0) + 1));
    // calculate the frequency percentage
    let wordFreq = Array.from(wordCounts, ([word, count]) => ({ word: word, frequency: count / fWords.length, count: count }));
    // keep word with frequency > 0.001
    wordFreq = wordFreq.filter(d => d.frequency > 0.001);
    // sort the words by frequency
    wordFreq.sort((a, b) => b.frequency - a.frequency);
    // keep the top 30 words
    wordFreq = wordFreq.slice(0, params.top);
    return wordFreq;
}

async function buildGraph(data) {
    // // Count the frequency of each conversation_id
    // let conversationCounts = new Map();
    // data.forEach(obj => conversationCounts.set(obj.conversation_id, (conversationCounts.get(obj.conversation_id) || 0) + 1));
    // // keep conversation_id with frequency > 100
    // let conversation_id = Array.from(conversationCounts, ([id, count]) => ({ id: id, count: count }));
    // conversation_id = conversation_id.filter(d => d.count > params.conversationThreshold);
    // // Keep objects with conversation_id in conversation_id
    // data = data.filter(obj => conversation_id.map(d => d.id).includes(obj.conversation_id));
    // // Keep objects with replies_count+retweets_count+likes_count > 10
    // data = data.filter(obj => obj.replies_count + obj.retweets_count + obj.likes_count > params.countThreshold);

    let groupedData = data.reduce((acc, obj) => {
        let group = acc.find(item => item.user_id === obj.user_id);

        if (!group) {
            group = {
                user_id: obj.user_id,
                cleaned_tweets: [],
                tweets: [],
                tweets_id: [],
                replies_count: 0,
                retweets_count: 0,
                likes_count: 0,
                mentions: [],
                reply_to: [],
                quote: []
            };
            acc.push(group);
        }

        group.tweets.push(obj.tweet);
        group.cleaned_tweets.push(obj.cleaned_tweet);
        group.tweets_id.push(obj.id);
        group.replies_count += obj.replies_count;
        group.retweets_count += obj.retweets_count;
        group.likes_count += obj.likes_count;
        group.mentions = group.mentions.concat(obj.mentions);
        group.reply_to = group.reply_to.concat(obj.reply_to);
        if (obj.quote) {
            group.quote.push(parseInt(obj.quote, 10));
        }
        return acc;
    }, []);

    // keep obj with replies_count+retweets_count+likes_count > countThreshold
    groupedData = groupedData.filter(obj => obj.replies_count + obj.retweets_count + obj.likes_count > params.countThreshold);

    // build graph from groupedData
    // if user2 in user1.mentions, add edge from user1 to user2
    // if user2 in user1.reply_to, add edge from user1 to user2

    const nodes = [];
    const links = [];
    groupedData.forEach(obj => {
        nodes.push({ user_id: obj.user_id, type: "user", replies_count: obj.replies_count, retweets_count: obj.retweets_count, likes_count: obj.likes_count });
    });
    groupedData.forEach(obj => {
        obj.mentions.forEach(mention => {
            let target = nodes.find(node => node.id === parseInt(mention.id, 10));
            if (target) {
                links.push({ source: obj.user_id, target: target.id, type: "mention" });
            }
        });
        obj.reply_to.forEach(reply => {
            let target = nodes.find(node => node.id === parseInt(reply.id, 10));
            if (target) {
                links.push({ source: obj.user_id, target: target.id, type: "reply" });
            }
        });
        obj.quote.forEach(quote => {
            let target = groupedData.find(node => node.tweets_id.includes(quote));
            if (target) {
                links.push({ source: obj.user_id, target: target.user_id, type: "quote" });
            }
        });
    });

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


    updateWordCloud(data);

    return graph;
}

async function updateWordCloud(data) {
    // update wordcloud
    let wordFreq = await processWord(data);
    let element = document.getElementById("wordcloud");
    element.innerHTML = "";
    createWordCloud(wordFreq, update = true);
}

function updateGraph(word, flag) {
    if (flag) {
        d3.selectAll("circle").filter(function (d) {
            return d.type === "tweet" && d.cleaned_tweet.includes(word);
        }).transition().attr("r", 8);
    }
    else {
        d3.selectAll("circle").filter(function (d) {
            return d.type === "tweet" && d.cleaned_tweet.includes(word);
        }).transition().attr("r", 5);
    }
    return !flag;
}


async function plotGraphWithoutReload(flag = true) {
    if (flag) {
        let graph = await buildGraph(params.data);
        let graphElement = document.getElementById("forcegraph");
        graphElement.innerHTML = "";
        let forceGraph = DisjointForceDirectedGraph(graph);
        document.getElementById("forcegraph").appendChild(forceGraph);
    }
    else {
        if (params.DataReady) {
            if (params.fromDate === false || params.fromTime === false || params.toDate === false || params.toTime === false) {
                return;
            }
            let fromDate = new Date(params.fromDate + " " + params.fromTime);
            let toDate = new Date(params.toDate + " " + params.toTime);
            if (fromDate > toDate) {
                alert("Please select a valid time interval!");
                return;
            }
            const fromDay = fromDate.getDate() - 20;
            const toDay = toDate.getDate() - 20;
            const fromTime = fromDate.getHours() * 60 + fromDate.getMinutes();
            const toTime = toDate.getHours() * 60 + toDate.getMinutes();

            let data = [];
            for (let i = fromDay; i <= toDay; i++) {
                if (i === fromDay && i === toDay) {
                    data = data.concat(params.Data[i].filter(obj => Date.parse(obj.date + " " + obj.time) >= fromTime && Date.parse(obj.date + " " + obj.time) <= toTime));
                }
                else {
                    data = data.concat(params.Data[i]);
                }
            }
            params.data = data;
            plotGraphWithoutReload(true);
        }
    }
}

async function plot() {
    let data = await loadData(params.day);
    params.data = data;
    // const wordFreq = await processWord(data);
    // createWordCloud(wordFreq);
    const graph = await buildGraph(data);
    let graphElement = document.getElementById("forcegraph");
    graphElement.innerHTML = "";
    let forceGraph = DisjointForceDirectedGraph(graph);
    document.getElementById("forcegraph").appendChild(forceGraph);
}

addDayOption();
addTopInput();
addConvThresholdInput();
addCountThresholdInput();
addIntervalInput();
plot();
// loadAllData();
