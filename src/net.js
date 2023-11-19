function DisjointForceDirectedGraph(data) {
    // Specify the dimensions of the chart.
    const width = params.width;
    const height = params.height;

    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.
    const links = data.links.map(d => ({ ...d }));
    const nodes = data.nodes.map(d => ({ ...d }));

    // Get the unique groups
    const groups = Array.from(new Set(nodes.map(d => d.group)));
    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, groups.length));

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
        .style("border", "2px solid #1b5e20")
        .style("border-right", "1px solid #1b5e20");


    // Add a line for each link, and a circle for each node.
    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", d => d.value)
        .attr("fill", d => color(d.group))
        .each(function (d) {
            d.clicked = false;  // Add a clicked state to each node
        })
        .on('mouseover', function (event, d) {
            d3.select(this).transition().attr("r", d.value * 1.5);
        })
        .on('mouseout', function (event, d) {

            d3.select(this).transition().attr("r", d.value);
        })
        .on('click', function (event, d) {
            // d.clicked = !d.clicked;  // Toggle the clicked state
            // set node with white color back to original color
            d3.selectAll("circle").filter(function (d) {
                return d.type === "user";
            }
            ).attr("fill", d => color(d.group));

            // find all nodes linked to this node, return a list of node ids
            // let linkedNodes = links
            //     .filter(link => link.source.id === d.id || link.target.id === d.id)
            //     .map(link => link.source.id === d.id ? link.target.id : link.source.id);
            let linkedNodes = [];
            linkedNodes.push(d.id);
            if (params.DataReady) {
                // set the color of linked nodes to white
                d3.selectAll("circle").filter(function (d) {
                    return linkedNodes.includes(d.id);
                }).attr("fill", "white");
                updateSentimentPlot(linkedNodes, d.group);
            }

            // d3.select(this)
            //     .transition().duration(200)
            //     .attr('fill', d.clicked ? 'white' : color(d.group));  // Change the color based on the clicked state
        });

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

    // Define the gradient
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "legendGradient");

    gradient.selectAll("stop")
        .data(d3.range(groups.length))
        .join("stop")
        .attr("offset", (d, i) => `${i / (groups.length - 1) * 100}%`)
        .attr("stop-color", d => color(d));

    // Define the legend data
    const legendData = ["url(#legendGradient)", "white"];

    // Create the legend
    const legend = svg.append("g")
        .attr("transform", `translate(${-width / 2 + 20}, ${-height / 2 + 20})`)
        .selectAll("g")
        .data(legendData)
        .join("g");

    // Add the legend shapes
    legend.each(function (d, i) {
        const g = d3.select(this);
        if (i === 0) {
            // Add a rectangle and two circles for the first legend item
            g.append("circle")
                .attr("cx", 5)
                .attr("cy", 5)
                .attr("r", 5)
                .attr("fill", d);

        } else {
            // Add a circle for the second legend item
            g.append("circle")
                .attr("cx", 5)
                .attr("cy", 5)
                .attr("r", 5)
                .attr("fill", d);
        }
    });

    // Add the legend text
    legend.append("text")
        .attr("x", 15)  // Move the first legend item's text to the right
        .attr("y", 10)
        .text((d, i) => i === 0 ? `group [1~${groups.length}]` : "selected");
    // Position the legend elements
    legend.attr("transform", (d, i) => `translate(0, ${i * 20})`);

    // add tooltip by tippy
    node.nodes().forEach(function (node) {
        const d = node.__data__;
        const tooltipContent = `
        <strong>${d.username}</strong><br>
        💬🔁❤️: ${d.total_count}
    `;
        tippy(node, {
            content: tooltipContent,
            allowHTML: true,
            // hide arrow
            // arrow: false,
        });
    });

    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
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

