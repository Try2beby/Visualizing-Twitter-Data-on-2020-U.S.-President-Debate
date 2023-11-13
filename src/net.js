
function betterForceGraph(graph) {
    // 设置画布大小-四周留间距
    let margin = { top: 10, right: 30, bottom: 30, left: 40 },
        width = 960 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    // 创建SVG元素并添加到map中
    let svg = d3.select("#forcegraph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

    // 定义颜色函数
    let color = d3.scaleOrdinal(d3.schemeCategory10);

    let tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // 创建一个力学模拟器
    let simulation = d3.forceSimulation(graph.nodes)
        // 连接力
        .force("link", d3.forceLink(graph.links)
            .id(d => d.id) 	// 每个节点的id的获取方式
            .strength(d => d.source.group === d.target.group ? 1 : 0.3)) // 
        // 万有引力
        .force("charge", d3.forceManyBody().strength(-8))
        // 
        // Q1 把力导图的力的中心移到平面中央
        // 
        .force("center", d3.forceCenter(width / 2, height / 2))


    // 计算凸壳集合的函数
    function convexHulls(nodes) {

        let offset = 15; // 可以控制区域边界大小
        let hulls = {};

        for (let k = 0; k < nodes.length; ++k) {
            let n = nodes[k];
            if (n.size) continue;
            let i = n.group, l = hulls[i] || (hulls[i] = []);

            // l 记录了一个点的正方形区域的四个顶点
            l.push([n.x - offset, n.y - offset]);
            l.push([n.x - offset, n.y + offset]);
            l.push([n.x + offset, n.y - offset]);
            l.push([n.x + offset, n.y + offset]);

        }

        // 创建凸壳集合
        let hullset = [];
        for (i in hulls) {
            // d3.polygonHull可以求多边形最外层的点，返回的顺序是顺时针
            hullset.push({ group: i, path: d3.polygonHull(hulls[i]) });
        }
        return hullset;
    }

    // d3.line.curve()方法用于绘制一条曲线
    let curve = d3.line().curve(d3.curveCardinalClosed.tension(0.01));

    // 分类绘制凸壳
    function drawCluster(d) {
        //返回曲线路径
        return curve(d.path);
    }

    //定义凸壳组件
    let hulls = svg.append("g")
        .selectAll("path.hull")
        .data(convexHulls(graph.nodes))
        .enter()
        .append("path")
        .attr("class", "hull")
        .attr("d", drawCluster)
        .style("fill", function (d) { return color(d.group); });

    // 定义人物节点之间连线的信息
    let link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line") // 用line元素来绘制
        .data(graph.links) // 绑定json文件中的links数据
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value)); // 连线粗细通过线的value计算

    // 定义人物节点信息
    let node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle") // 人物节点通过圆来绘制 
        .data(graph.nodes)// 为人物节点绑定nodes数据
        .join("circle")
        .attr("r", 5)// 设置节点半径
        .attr("fill", function (d) { return color(d.group); })  // 设置节点的填充色，通过节点的group属性来计算节点的填充颜色
        // .call(

        // 
        //  Q2: 增加拖拽事件，调用后面定义的三个阶段的监听函数 //
        //
        .call(
            d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
        )


        // )
        .on('mouseover', function (event, d) {

            // 
            //  Q3: 鼠标hover的时候圆圈放大效果
            // 

            d3.select(this).transition().attr("r", 10);

            tooltip.transition()
                .duration(250) // 设置transition效果的速度，默认为500ms
                .style("opacity", 1);

            tooltip.html(
                "<p> Name: " + d.id + "<br>" + 'Group: ' + d.group + "</p>"
            )
                // 设置tooltip距离鼠标的相对位置
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");

        })
        .on('mouseout', function (event, d) {

            // 
            //  Q3: 鼠标离开的时候圆圈还原
            // 
            d3.select(this).transition().attr("r", 5);

            tooltip.transition()
                .duration(250)
                .style("opacity", 0);

        });;

    // 添加tooltip的另一种方式
    // node.append("title").text(d => d.id);

    // 定义simulation内部计时器tick每次结束时的动作
    simulation.on("tick", () => {

        // 每次tick计时到时，连接线的响应动作
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        // 每次tick计时到时，节点的响应动作
        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        // 每次tick计时到时，凸壳的响应动作
        hulls
            .data(convexHulls(graph.nodes))
            .attr("d", drawCluster);
    });

    // 定义图例组件
    let legend = svg.append("g")
        .attr("id", "legend");

    // 定义图例中的色块（此处为圆形）
    legend.selectAll("mydots")
        .data(d3.range(1, 11))
        .enter()
        .append("circle")
        .attr("cx", 50)
        .attr("cy", function (d, i) { return 200 + i * 25 })
        .attr("r", 5)
        .style("fill", function (d) { return color(d) })
        .style("opacity", 0.8);

    // 在图例中添加文本标签
    legend.selectAll("mylabels")
        .data(d3.range(1, 11))
        .enter()
        .append("text")
        .attr("x", 70)
        .attr("y", function (d, i) { return 200 + i * 25 })
        .style("fill", function (d) { return color(d) })
        .style("opacity", 0.8)
        .text(function (d) { return "Group " + d })
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")


    // 定义开始拖拽节点时的动作，注意v6版本是通过event返回的函数参数来处理的 
    function dragstarted(event) {

        // 当开始拖动时，restart()方法重新启动模拟器的内部计时器并返回模拟器，
        // alpha将保持在0.3左右，使模拟不断移动
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    // 定义拖拽中的动作
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    // 定义拖拽结束的动作
    // 在拖动结束时，alphaTarget被设置回0，因此再次稳定下来，这就是阻力相互作用后力返回的原因
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
}

function DisjointForceDirectedGraph(data) {
    // Specify the dimensions of the chart.
    const width = 500;
    const height = 500;

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

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 5)
        .attr("fill", d => color(d.group));

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
    // if __data__.type == "tweet"
    node.nodes().forEach(function (node) {
        let tooltipContent;
        const d = node.__data__;
        switch (node.__data__.type) {
            case "tweet":
                tooltipContent = `
                <div class="post">
                <div class="post-header">
                  <span>${d.username}</span>
                  <span>${d.date.substring(5)} 22:42:30</span>
                </div>
                <div class="post-content">${d.tweet}</div>
                <div class="post-footer">
                <span class="reply-count">💬 ${d.replies_count}&nbsp;&nbsp;&nbsp;</span>
                <span class="retweet-count">🔁 ${d.retweets_count}&nbsp;&nbsp;&nbsp;</span>
                <span class="like-count">❤️ ${d.likes_count}</span>
                </div>
                `;
                break;
            case "conversation":
                tooltipContent = `
                    <table style="text-align: left; font-size: 10px;">
                        <tr>
                            <th>Conversation</th>
                        </tr>
                    </table>
                `;
                break;
            default:
                break;
        }
        tippy(node, {
            content: tooltipContent,
            theme: 'light',
            allowHTML: true,
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

// window.createForceGraph = ForceGraph;
// window.createForceGraph = betterForceGraph;
window.createForceGraph = DisjointForceDirectedGraph;
