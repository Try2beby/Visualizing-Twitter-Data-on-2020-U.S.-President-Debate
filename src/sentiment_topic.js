function sentimentPlot(userID, group) {
    // Filter Data with user_id
    let tweets = [];
    day.forEach(day => {
        const data = params.Data[day];
        const temp = data.filter(obj => userID.includes(obj.user_id));
        temp.forEach(obj => {
            // add username for each tweet
            obj.tweets.forEach(tweet => {
                tweet.username = obj.username;
                tweet.user_id = obj.user_id;
            });
            tweets = tweets.concat(obj.tweets);
        });
    });
    // Prepare the data
    let data = tweets.map(tweet => ({
        date: new Date(tweet.date + ' ' + tweet.time),
        score: tweet.sentiment.score,
        comparative: tweet.sentiment.comparative,
        tweet: tweet.tweet,
        positive: tweet.sentiment.positive,
        negative: tweet.sentiment.negative,
        replies_count: tweet.replies_count,
        retweets_count: tweet.retweets_count,
        likes_count: tweet.likes_count,
        username: tweet.username,
        _date: tweet.date,
        _time: tweet.time,
    }));
    // sort data by date
    data.sort((a, b) => a.date - b.date);

    // Set the dimensions and margins of the graph
    const margin = { top: 30, right: 30, bottom: 40, left: 50 },
        width = params.width - margin.left - margin.right,
        height = params.height - margin.top - margin.bottom;

    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Append the svg object to the body of the page
    const svg = d3.select("#sentimentplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("border", "2px solid #1b5e20")
        .style("border-left", "1px solid #1b5e20")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    const x = d3.scaleTime()
        // .domain(new Date(2020, 10, 20), new Date(2020, 10, 27))
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(d3.timeDay.every(1)));  // Set tick interval to one day

    // Add Y axis for score
    const y1 = d3.scaleLinear()
        .domain([d3.min(data, d => d.score), d3.max(data, d => d.score)])
        .range([height, 0]);

    // Add the score line
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .attr("stroke", "rgb(12, 12, 12)")
        .attr("opacity", 0.5)
        .attr("d", d3.line()
            .x(d => x(d.date))
            .y(d => y1(d.score))
        ).transition()
        .duration(1000);

    svg.append("g")
        .call(d3.axisLeft(y1))
        .call(g => g.append("text")
            .attr("x", -margin.left + 20)
            .attr("y", -margin.top / 2)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("Score"));

    // Add the data points
    const points = svg.selectAll(".point")
        .data(data)
        .join("circle")
        .attr("class", "point")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y1(d.score))
        .attr("r", 2)
        .attr("fill", "rgb(5, 5, 5)");

    // add tooltip 
    points.nodes().forEach(function (node) {
        const theme = "transparent";
        const d = node.__data__;
        const tooltipContent = `
            <div class="post">
                <div class="post-header">
                    <span>${d.username}</span>
                    <span>${d._date.substring(5)} ${d._time}</span>
                </div>
                <div class="post-content">
                    ${d.tweet}<br>
                    <strong>Positive words:</strong> ${d.positive.join(' ')}<br>
                    <strong>Negative words:</strong> ${d.negative.join(' ')}
                </div>
                <div class="post-footer">
                    <span class="reply-count">💬 ${d.replies_count}&nbsp;&nbsp;&nbsp;</span>
                    <span class="retweet-count">🔁 ${d.retweets_count}&nbsp;&nbsp;&nbsp;</span>
                    <span class="like-count">❤️ ${d.likes_count}</span>
                </div>
            `;

        tippy(node, {
            content: tooltipContent,
            theme: theme,
            allowHTML: true,
            // hide arrow
            arrow: false,
        });
    });

}