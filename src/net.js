function DisjointForceDirectedGraph(data) {
    // Specify the dimensions of the chart.
    const width = params.width;
    const height = params.height;

    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.
    const links = data.links.map(d => ({ ...d }));
    const nodes = data.nodes.map(d => ({ ...d }));

    // Create a simulation with several forces.
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("x", d3.forceX())
        .force("y", d3.forceY());

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto;")
        .style("border", "1px solid lightgrey");


    // Add a line for each link, and a circle for each node.
    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    let brush = d3.brush()
        .extent([[0 - width / 2, 0 - height / 2], [width, height]])
        .on("end", brushed);

    svg.append("g")
        .attr("class", "brush")
        .call(brush);

    addDayOption(svg, width, height);
    addConvThresholdInput(svg, width, height);
    addCountThresholdInput(svg, width, height);

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 5)
        .attr("fill", d => d.type === "tweet" ? color(d.group) : "white")
        .on('mouseover', function (event, d) {
            d3.select(this).transition().attr("r", 8);
        })
        .on('mouseout', function (event, d) {

            d3.select(this).transition().attr("r", 5);
        });;


    // node.append("title")
    //     .text(d => d.id);

    // Add a drag behavior.
    node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Set the position attributes of links and nodes each time the simulation ticks.
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });

    // add tooltip by tippy
    node.nodes().forEach(function (node) {
        let tooltipContent;
        let theme;
        const d = node.__data__;
        switch (d.type) {
            case "tweet":
                tooltipContent = `
                <div class="post">
                <div class="post-header">
                  <span>${d.username}</span>
                  <span>${d.date.substring(5)} ${d.time}</span>
                </div>
                <div class="post-content">${d.tweet}</div>
                <div class="post-footer">
                <span class="reply-count">💬 ${d.replies_count}&nbsp;&nbsp;&nbsp;</span>
                <span class="retweet-count">🔁 ${d.retweets_count}&nbsp;&nbsp;&nbsp;</span>
                <span class="like-count">❤️ ${d.likes_count}</span>
                </div>
                `;
                theme = "transparent";
                break;
            case "conversation":
                tooltipContent = `
                    <table style="text-align: left; font-size: 10px;">
                        <tr>
                            <th>Conversation</th>
                        </tr>
                    </table>
                `;
                theme = "light";
                break;
            default:
                break;
        }
        tippy(node, {
            content: tooltipContent,
            theme: theme,
            allowHTML: true,
            // hide arrow
            arrow: false,
        });
    });

    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    // Define the brushed function
    function brushed(event) {
        if (!event.selection) return; // If no areas are selected, return

        // Get the bounds of the selection
        let [[x0, y0], [x1, y1]] = event.selection;

        // Check which nodes are within the bounds
        node.classed("selected", function (d) {
            return x0 <= d.x && d.x <= x1 && y0 <= d.y && d.y <= y1 && d.type === "conversation";
        });

        // Get the selected nodes
        let selectedNodes = node.filter(".selected").data();

        // find all the nodes that are connected to the selected nodes
        let connectedNodes = [];
        selectedNodes.forEach(node => {
            links.forEach(link => {
                if (link.target.id === node.id) {
                    connectedNodes.push(link.source);
                }
            });
        });

        // Update the word cloud based on the selected nodes
        updateWordCloud(connectedNodes);
    }

    // Update the subject (dragged node) position during drag.
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    // When this cell is re-run, stop the previous simulation. (This doesn’t
    // really matter since the target alpha is zero and the simulation will
    // stop naturally, but it’s a good practice.)
    // invalidation.then(() => simulation.stop());

    return svg.node();
}

