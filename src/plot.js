async function loadAllData() {
    const worker = new Worker("worker.js");
    worker.postMessage(day.map(d => cacheDir + dataName(d)));
    worker.onmessage = function (e) {
        alert("Data loading done.");
        params.Data = e.data;
        params.DataReady = true;
        initSentimentPlot();
    }
}

async function loadData(day) {
    if (params.DataReady) {
        return params.Data[day];
    }
    const data = await d3.json(cacheDir + dataName(day));
    return data;
}

async function buildGraph(data) {
    // build graph from data
    // if user2 in user1.mentions, add edge from user1 to user2
    // if user2 in user1.reply_to, add edge from user1 to user2

    let nodes = [];
    const links = [];
    data.forEach(obj => {
        // for all tweets in obj.tweets
        let total_count = 0;
        obj.tweets.forEach(tweet => {
            total_count += tweet.replies_count + tweet.retweets_count + tweet.likes_count;
        });
        obj.total_count = total_count;
    });
    // filter data with total_count > countThreshold
    data = data.filter(obj => obj.total_count > params.countThreshold);

    data.forEach(obj => {
        nodes.push({
            id: obj.user_id, type: "user",
            total_count: obj.total_count,
            username: obj.username,
        });
    });

    data.forEach(user_obj => {
        user_obj.tweets.forEach(obj => {
            obj.mentions.forEach(mention => {
                let target = nodes.find(node => node.id === parseInt(mention.id, 10));
                if (target) {
                    links.push({ source: user_obj.user_id, target: target.id, type: "mention" });
                }
            });
            obj.reply_to.forEach(reply => {
                let target = nodes.find(node => node.id === parseInt(reply.id, 10));
                if (target) {
                    links.push({ source: user_obj.user_id, target: target.id, type: "reply" });
                }
            });
            if (obj.quote) {
                let quoteItem = null;

                for (let obj of data) {
                    quoteItem = obj.tweets.find(tweet => tweet.tweet_id === obj.quote);
                    if (quoteItem) {
                        {
                            links.push({ source: user_obj.user_id, target: quoteItem.user_id, type: "quote" });
                            break;
                        }
                    }
                }

            }
        });
    });

    // filter nodes with degree > 0
    let nodeIds = links.flatMap(link => [link.source, link.target]);
    nodeIds = [...new Set(nodeIds)];
    nodes = nodes.filter(node => nodeIds.includes(node.id));

    // Initialize group id
    let groupId = 0;

    // Initialize visited set
    let visited = new Set();

    // For each node in the graph
    for (let node of nodes) {
        // If the node has not been visited
        if (!visited.has(node.id)) {
            // Start a new group
            groupId++;

            // Start DFS
            let stack = [node.id];
            while (stack.length > 0) {
                let nodeId = stack.pop();
                visited.add(nodeId);

                // Assign the node to the current group
                let node = nodes.find(n => n.id === nodeId);
                node.group = groupId;

                // Add all unvisited neighbors to the stack
                let neighbors = links
                    .filter(link => link.source === nodeId || link.target === nodeId)
                    .map(link => link.source === nodeId ? link.target : link.source)
                    .filter(id => !visited.has(id));
                stack.push(...neighbors);
            }
        }
    }

    // find nodes with the most total_count and assign them to group 0
    const maxCount = Math.max(...nodes.map(node => node.total_count));
    const minCount = Math.min(...nodes.map(node => node.total_count));
    nodes.forEach(node => {
        node.value = (node.total_count - minCount) / (maxCount - minCount) * 6 + 4;
    });

    params.links = links;
    const graph = { nodes: nodes, links: links };
    return graph;
}

function initSentimentPlot() {
    // d3.selectAll("circle").filter(function (d) {
    //     // choose a random node
    //     if (Math.random() < 0.4) {
    //         // find all nodes linked to this node, return a list of node ids
    //         let linkedNodes = params.links
    //             .filter(link => link.source.id === d.id || link.target.id === d.id)
    //             .map(link => link.source.id === d.id ? link.target.id : link.source.id);
    //         updateSentimentPlot(linkedNodes, d.group);
    //     }
    // })
}


function updateSentimentPlot(userID, group) {
    // update sentiment plot
    let element = document.getElementById("sentimentplot");
    element.innerHTML = "";
    sentimentPlot(userID, group);
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
    const graph = await buildGraph(data);
    let graphElement = document.getElementById("forcegraph");
    graphElement.innerHTML = "";
    let forceGraph = DisjointForceDirectedGraph(graph);
    document.getElementById("forcegraph").appendChild(forceGraph);
}

addDayOption();
// addTopInput();
// addConvThresholdInput();
addCountThresholdInput();
// addIntervalInput();
plot();
loadAllData();
