import React from 'react';
import olympicSportForceData from '../data/force_graph/force_directed_Sport.json';
import olympicSportNodeGroupMap from '../data/force_graph/node_to_group.json';
import olympicGroupIdToCategoryMap from '../data/force_graph/group_to_topicSport.json';
import youtubeForceData from '../data/force_graph/force_directed_youtube.json';
import youtubeNodeGroupMap from '../data/force_graph/bode_to_group_youtube.json';
import youtubeGroupIdToCategoryMap from '../data/force_graph/topic_to_group_youtube.json';
import olympicCountryForceData from '../data/force_graph/force_directed_NOC.json';
import olympicCountryNodeGroupMap from '../data/force_graph/node_to_group_NOC.json';
import olympicCountryGroupIdToCategoryMap from '../data/force_graph/topic_to_group_NOC.json'; 
import * as $ from 'jquery';
import * as d3 from 'd3';
import './Force.css';

export default class ForceDirectedGraph extends React.Component {
    constructor(props) {
        super(props);
        this.legendSvg = null;
        let longColors = [...d3.schemeDark2, ...d3.schemeSet3];
        this.colorScheme = d3.scaleOrdinal(longColors);
        this.state = {
            currentForceData: null
        }
    }

    componentDidMount() {
        let forceData = null;
        let activeFields = null;
        let groupNodeMap = null;
        switch(this.props.activeGraph) {
            case 'olympic_sport':
                activeFields = this.props.fields.map(field=>parseInt(olympicGroupIdToCategoryMap[field]));
                groupNodeMap = olympicGroupIdToCategoryMap;
                forceData = this.processForceData(olympicSportForceData[this.props.selectedYear], olympicSportNodeGroupMap, activeFields);
                break;
            case 'youtube':
                activeFields = this.props.fields.map(field=>parseInt(youtubeGroupIdToCategoryMap[field]));
                groupNodeMap = youtubeGroupIdToCategoryMap;
                forceData = this.processForceData(youtubeForceData[this.props.selectedYear], youtubeNodeGroupMap, activeFields);
                break;
            case 'olympic':
                activeFields = this.props.fields.map(field=>parseInt(olympicCountryGroupIdToCategoryMap[field]));
                groupNodeMap = olympicCountryGroupIdToCategoryMap;
                forceData = this.processForceData(olympicCountryForceData[this.props.selectedYear], olympicCountryNodeGroupMap, activeFields);
        }
        this.drawForceGraph(forceData);
        d3.select('#forceLegendSvg').selectAll('*').remove();
        this.legendSvg = d3.select('#forceSvg').append('g').attr('id', 'forceLegendSvg');
        this.drawLegends(activeFields, groupNodeMap);
    }

    drawLegends(activeFields, groupNodeMap) {
        let inverseMap = {};
        Object.entries(groupNodeMap).forEach(([key, value])=>{
            inverseMap[value] = key;
        });
        let self = this;
        this.legendSvg.attr('transform', 'translate(' + 20 + ',' + (30) + ')');
        var legendNodes = this.legendSvg.selectAll('g').data(activeFields).enter().append('g')
            .attr('transform', function (d, i) {
                return 'translate(' + 10 + ',' + ( (i * 10)) + ')';
        });
        legendNodes.append('circle')
        .attr('r', 5)
        .attr('cy', (d, i)=>(i)*2)
        .attr('fill', function (d, i) {
            return self.colorScheme(d);
        })
        .attr('fill-opacity', 1)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.5);


        legendNodes.append('text').text(function (d) {
            return inverseMap[d];
        })
        .attr('y', (d, i)=>(i+1)*2)
        .attr('font-size', 10)
        .attr('alignment-baseling', 'middle')
        .attr('dx', 8);
    }

    getRandomSubarray(arr, size) {
        var shuffled = arr.slice(0), i = arr.length, temp, index;
        while (i--) {
            index = Math.floor((i + 1) * Math.random());
            temp = shuffled[index];
            shuffled[index] = shuffled[i];
            shuffled[i] = temp;
        }
        return shuffled.slice(0, size);
    }

    keepRelevantGroups(data, nameMap, keepGroups) {
        let sampleData = $.extend(true, [], data);
        let links = sampleData.links;
        let i = links.length;
        while(i--) {
            let sourceGrp = parseInt(nameMap[links[i].source]);
            let targetGrp = parseInt(nameMap[links[i].target]);
            if(!keepGroups.includes(sourceGrp) || !keepGroups.includes(targetGrp)) {
                links.splice(i,1);
            }
        }
        return sampleData;
    }
    
    processForceData(data, nodeGroupMap, activeFields) {
        let linkScale = d3.scaleLinear();
        switch(this.props.activeGraph) {
            case 'youtube':
                linkScale.domain([0, 10]).range([0, 200]);
                break;
            case 'olympic_sport':
                linkScale.domain([0, 13]).range([0, 150]);
                break;
            case 'olympic':
                linkScale.domain([0, 10]).range([0, 100]);
                break;
        }
        data = this.keepRelevantGroups(data, nodeGroupMap, activeFields);
        let randomLinkSubset = this.getRandomSubarray(data.links, linkScale(activeFields.length));
        let uniqueNodes = [];
        let forceData = {
            links: randomLinkSubset,
            nodes: []
        }
        randomLinkSubset.forEach(link=>{
            if(!uniqueNodes.includes(link['source'])) {
                uniqueNodes.push(link['source']);
            }
            if(!uniqueNodes.includes(link['target'])) {
                uniqueNodes.push(link['target']);
            }
        });
        uniqueNodes.forEach(node=>{
            forceData.nodes.push({
                id: node,
                group: nodeGroupMap[node]
            });
        }); 
        return forceData;
    }

    drawForceGraph(graph) {
        d3.select('#forceSvg').selectAll('*').remove();
        var radius = 15; 
        // var width = 960,
            // height = 500;
        var svg = d3.select("#forceSvg"),
            width = +svg.attr("width"),
            height = +svg.attr("height");
            console.log(width, height);

            var color = this.colorScheme;

            var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function(d) { return d.id; }))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2));

            var link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(graph.links)
            .enter().append("line")
            .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

            var node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(graph.nodes)
            .enter().append("g")

            var circles = node.append("circle")
            .attr("r", 5)
            .attr("fill", function(d) { return color(d.group); })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

            var lables = node.append("text")
            .text(function(d) {
                return d.id;
            })
            .attr('class', 'forceText')
            .attr('x', 6)
            .attr('y', 3);

            node.append("title")
            .text(function(d) { return d.id; });

            simulation
            .nodes(graph.nodes)
            .on("tick", ticked);

            simulation.force("link")
            .links(graph.links);

            function ticked() {
            node
                .attr("transform", function(d) {
                    let xPos = Math.max(radius, Math.min(width - radius, d.x));
                    let yPos = Math.max(radius, Math.min(height - radius, d.y));
                    return "translate(" + xPos + "," + yPos + ")";
                })
                // .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
                // .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });

            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
            // node
            //     .attr("transform", function(d) {
            //     return "translate(" + d.x + "," + d.y + ")";
            //     })
            }

            function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
            }

            function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
            }

            function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
            }
    }

    render() {
        return(
            <svg id="forceSvg" 
                width="1200"
                height="600"
                // viewBox="-500 -300 1200 500"
                >
            </svg> 
        )
    }
}