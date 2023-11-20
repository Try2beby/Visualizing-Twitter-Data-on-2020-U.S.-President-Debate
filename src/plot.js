async function loadAllData() {
    const worker = new Worker("worker.js");
    worker.postMessage(day.map(d => cacheDir + dataName(d)));
    worker.onmessage = function (e) {
        alert("Data loading done.");
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

async function buildGraph(data) {
    // build graph from data
    // if user2 in user1.mentions, add edge from user1 to user2
    // if user2 in user1.reply_to, add edge from user1 to user2

    let nodes = [];
    const links = [];
    data.forEach(obj => {
        // for all tweets in obj.tweets
        let total_count = 0;
        let cleaned_tweet = "";
        obj.tweets.forEach(tweet => {
            total_count += tweet.replies_count + tweet.retweets_count + tweet.likes_count;
            cleaned_tweet += " " + tweet.cleaned_tweet;
        });
        obj.total_count = total_count;
        obj.cleaned_tweet = cleaned_tweet.split(/\s+/);
    });
    // filter data with total_count > countThreshold
    data = data.filter(obj => obj.total_count > params.countThreshold);

    updateWordCloud(data);

    data.forEach(obj => {
        nodes.push({
            id: obj.user_id, type: "user",
            total_count: obj.total_count,
            username: obj.username,
            cleaned_tweet: obj.cleaned_tweet
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

    const graph = { nodes: nodes, links: links };
    return graph;
}

async function updateWordCloud(data) {
    let wordElement = document.getElementById("wordcloud");
    wordElement.innerHTML = "";
    const wordFreq = await processWord(data);
    createWordCloud(wordFreq);
}

function initSentimentPlot() {
    // Set the dimensions and margins of the graph
    const margin = { top: 30, right: 30, bottom: 40, left: 50 },
        width = params.width - margin.left - margin.right,
        height = params.height / 2 - 7 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    const svg = d3.select("#sentimentplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("border", "2px solid #1b5e20")
        .style("border-left", "1px solid #1b5e20")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("text-decoration", "underline")
        .text("Sentiment Score Change");

    // Define color scale
    const color = d3.scaleOrdinal()
        .domain([0, 1, 2, 3])
        .range(["white", "blue", "red", "black"]);  // Change these colors as needed

    // Define the labels for each tag
    const labels = ["Neither", "Biden(Joe)", "Trump", "Both"];

    // Add the legend
    const legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

    // Replace the rectangles with circles
    legend.append("circle")
        .attr("cx", width - 9) // center the circle
        .attr("r", 5) // radius of the circle
        .style("fill", color)
        .style("fill-opacity", 0.5);  // Set opacity to 0.5

    // Adjust the labels
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 0) // adjust the y position to align with the circle
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .style("font-size", "10px") // reduce the font size
        .text(function (d) { return labels[d]; });
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
initSentimentPlot();
loadAllData();
