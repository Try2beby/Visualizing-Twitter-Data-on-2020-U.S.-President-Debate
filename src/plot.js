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
    // Count the frequency of each conversation_id
    let conversationCounts = new Map();
    data.forEach(obj => conversationCounts.set(obj.conversation_id, (conversationCounts.get(obj.conversation_id) || 0) + 1));
    // keep conversation_id with frequency > 100
    let conversation_id = Array.from(conversationCounts, ([id, count]) => ({ id: id, count: count }));
    conversation_id = conversation_id.filter(d => d.count > params.conversationThreshold);
    // Keep objects with conversation_id in conversation_id
    data = data.filter(obj => conversation_id.map(d => d.id).includes(obj.conversation_id));
    // Keep objects with replies_count+retweets_count+likes_count > 10
    data = data.filter(obj => obj.replies_count + obj.retweets_count + obj.likes_count > params.countThreshold);

    updateWordCloud(data);
    // bulid graph from data.id,data.conversation_id
    // data.replies_count, data.retweets_count, data.likes_count
    // each node is a tweet, if two tweets have the same conversation_id, they link to same conversation
    // the size of the node is a function of replies_count, retweets_count, likes_count 
    let nodes = [];
    let links = [];
    // create nodes for each tweet
    data.forEach(obj => {
        let node = {};
        node.id = obj.id;
        node.group = obj.conversation_id;
        node.conversation_id = obj.conversation_id;
        node.replies_count = obj.replies_count;
        node.retweets_count = obj.retweets_count;
        node.likes_count = obj.likes_count;
        node.tweet = obj.tweet;
        node.cleaned_tweet = obj.cleaned_tweet;
        node.username = obj.username;
        node.date = obj.date;
        node.time = obj.time;
        node.type = "tweet"
        nodes.push(node);
    });
    nodes.forEach(node => {
        let link = {};
        link.source = node.id;
        link.target = node.conversation_id;
        link.value = (node.replies_count + node.retweets_count + node.likes_count) / 20 + 1;
        links.push(link);
    });
    // create nodes for each conversation
    conversation_id.forEach(obj => {
        let node = {};
        node.id = obj.id;
        node.group = obj.id;
        node.type = "conversation";
        nodes.push(node);
    });
    let graph = {};
    graph.nodes = nodes;
    graph.links = links;
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
loadAllData();
