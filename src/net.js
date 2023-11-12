// Copyright 2021-2023 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/force-directed-graph
function ForceGraph({
    nodes, // an iterable of node objects (typically [{id}, …])
    links // an iterable of link objects (typically [{source, target}, …])
}, {
    nodeId = d => d.id, // given d in nodes, returns a unique identifier (string)
    nodeGroup, // given d in nodes, returns an (ordinal) value for color
    nodeGroups, // an array of ordinal values representing the node groups
    nodeTitle, // given d in nodes, a title string
    nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
    nodeStroke = "#fff", // node stroke color
    nodeStrokeWidth = 1.5, // node stroke width, in pixels
    nodeStrokeOpacity = 1, // node stroke opacity
    nodeRadius = 5, // node radius, in pixels
    nodeStrength,
    linkSource = ({ source }) => source, // given d in links, returns a node identifier string
    linkTarget = ({ target }) => target, // given d in links, returns a node identifier string
    linkStroke = "#999", // link stroke color
    linkStrokeOpacity = 0.6, // link stroke opacity
    linkStrokeWidth = 1.5, // given d in links, returns a stroke width in pixels
    linkStrokeLinecap = "round", // link stroke linecap
    linkStrength,
    colors = d3.schemeTableau10, // an array of color strings, for the node groups
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    invalidation // when this promise resolves, stop the simulation
} = {}) {
    // Compute values.
    const N = d3.map(nodes, nodeId).map(intern);
    const LS = d3.map(links, linkSource).map(intern);
    const LT = d3.map(links, linkTarget).map(intern);
    if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
    const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
    const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
    const W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, linkStrokeWidth);
    const L = typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);

    // Replace the input nodes and links with mutable objects for the simulation.
    nodes = d3.map(nodes, (_, i) => ({ id: N[i] }));
    links = d3.map(links, (_, i) => ({ source: LS[i], target: LT[i] }));

    // Compute default domains.
    if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

    // Construct the scales.
    const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

    // Construct the forces.
    const forceNode = d3.forceManyBody().strength(-5);
    const forceLink = d3.forceLink(links).id(({ index: i }) => N[i]);
    if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
    if (linkStrength !== undefined) forceLink.strength(linkStrength);

    const simulation = d3.forceSimulation(nodes)
        .force("link", forceLink)
        .force("charge", forceNode)
        .force("center", d3.forceCenter())
        .on("tick", ticked);

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
        .style("border", "1px solid lightgrey");

    const link = svg.append("g")
        .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
        .attr("stroke-opacity", linkStrokeOpacity)
        .attr("stroke-width", typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
        .attr("stroke-linecap", linkStrokeLinecap)
        .selectAll("line")
        .data(links)
        .join("line");

    const node = svg.append("g")
        .attr("fill", nodeFill)
        .attr("stroke", nodeStroke)
        .attr("stroke-opacity", nodeStrokeOpacity)
        .attr("stroke-width", nodeStrokeWidth)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", nodeRadius)
        .call(drag(simulation));

    if (W) link.attr("stroke-width", ({ index: i }) => W[i]);
    if (L) link.attr("stroke", ({ index: i }) => L[i]);
    if (G) node.attr("fill", ({ index: i }) => color(G[i]));
    if (T) node.append("title").text(({ index: i }) => T[i]);
    if (invalidation != null) invalidation.then(() => simulation.stop());

    function intern(value) {
        return value !== null && typeof value === "object" ? value.valueOf() : value;
    }

    function ticked() {
        link
            .attr("x1", d => Math.max(nodeRadius, Math.min(width - nodeRadius, d.source.x)))
            .attr("y1", d => Math.max(nodeRadius, Math.min(height - nodeRadius, d.source.y)))
            .attr("x2", d => Math.max(nodeRadius, Math.min(width - nodeRadius, d.target.x)))
            .attr("y2", d => Math.max(nodeRadius, Math.min(height - nodeRadius, d.target.y)));

        node
            .attr("cx", d => Math.max(nodeRadius, Math.min(width - nodeRadius, d.x)))
            .attr("cy", d => Math.max(nodeRadius, Math.min(height - nodeRadius, d.y)));
    }

    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    return Object.assign(svg.node(), { scales: { color } });
}

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
        .force("charge", d3.forceManyBody().strength(-1))
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

// window.createForceGraph = ForceGraph;
window.betterForceGraph = betterForceGraph;
