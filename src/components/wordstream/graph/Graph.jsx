import React from 'react';
import * as d3 from 'd3';
import './Graph.css';
import ForceModal from '../ForceModal/ForceModal.jsx';

export default class Graph extends React.Component {
    constructor(props) {
        super(props);
        this.layersSvg = null;
        this.wordstreamSvg = null;
        this.axisSvg = null;
        this.gridLinesSvg = null;
        this.legendSvg = null;
        let longColors = [...d3.schemeDark2, ...d3.schemeSet3];
        this.colorScheme = d3.scaleOrdinal(longColors);
        this.streamSizeScale = null;
        this.boxWidth = null;
        this.stackedLayers = null;
        this.boxes = null;
        this.fields = null;
        this.dates = null;
        this.wordsData = null;
        this.drawWordStream = this.drawWordStream.bind(this);
        this.drawLayers = this.drawLayers.bind(this);
        this.drawBoxes = this.drawBoxes.bind(this);
        this.addInteractions = this.addInteractions.bind(this);
        this.streamHeightScale = d3.scaleLinear().domain([400, 800]);
        this.setModalOpen = this.setModalOpen.bind(this);
        this.area = d3.area()
                    .curve(d3.curveCardinal)
                    .x((d, i)=>{return ((i)*this.boxWidth);})
                    .y0((d, i)=>{return this.streamSizeScale(d[0]);})
                    .y1((d, i)=>{return this.streamSizeScale(d[1]);});
        this.state = {
            selectedYear: null,
            modalOpen: false
        }
    }

    setModalOpen(bool) {
        this.setState({
            modalOpen: bool
        })
    }

    
    componentDidMount() {
        this.layersSvg = d3.select("#parentSvg").append('g').attr('id', 'layersSvg');
        this.gridLinesSvg = d3.select("#parentSvg").append('g').attr('id', 'gridLinesSvg');
        this.wordstreamSvg = d3.select("#parentSvg").append('g').attr('id', 'wordstreamSvg');
        this.wordstreamSvg.attr('transform', 'translate(0, 50)');
        this.axisSvg =  d3.select("#parentSvg").append('g').attr('id', 'axisSvg');
        this.legendSvg = d3.select('#parentSvg').append('g').attr('id', 'legendSvg');
    }

    componentDidUpdate(prevProps) {
        if(this.props.layersData!==prevProps.layersData) {
            this.streamSizeScale = this.props.layersData.streamSizeScale;
            this.boxWidth = this.props.layersData.boxWidth;
            this.stackedLayers = this.props.layersData.stackedLayers;
            this.boxes = this.props.layersData.boxes;
            this.fields = this.props.layersData.fields;
            this.dates = this.props.layersData.dates;
            // this.drawBoxes();
        }
        if(this.props.wordsData!==prevProps.wordsData) {
            this.wordsData = this.props.wordsData;
            let topics = {};
            this.wordsData.forEach(word=>{
                topics[word.topic] = null;
            });
            d3.select('#wordstreamSvg').selectAll('*').remove();
            d3.select('#legendSvg').selectAll('*').remove();
            d3.select('#axisSvg').selectAll('*').remove();
            this.drawLayers();
            this.drawWordStream();
            this.drawLegends();
            this.drawAxis();
            this.props.setLoading(false);
            let streamRange = this.props.activeGraph === 'youtube' ? [60, 120] : [60, 120];
            this.streamHeightScale.range(streamRange);
        }
    }

    drawAxis() {
        let self = this;
        let xAxisScale = d3.scaleBand().domain(this.dates).range([0, 1190]);
        let gridScale = d3.scaleLinear().domain([0, this.dates.length]).range([0, 1195]);
        var xAxis = d3.axisBottom(xAxisScale);
        let legendHeight = d3.select('#legendSvg').node().getBBox().height
        this.axisSvg.attr('transform', `translate(0, ${700})`).attr('class', 'x-axis');
        let axisNodes = this.axisSvg.call(xAxis);

        axisNodes.selectAll('.tick text')
        .attr('font-size', 11)
        .style('font-weight', 'bold');

        function make_x_gridlines() {		
            return d3.axisBottom(gridScale).ticks(self.dates.length+1);
        }
        this.gridLinesSvg.attr('transform', `translate(${0},${800})`)
          .call(make_x_gridlines()
          .tickSize(-1200)
          .tickFormat("")
        );

        d3.select('#axisSvg')
        .selectAll('.tick')
        .on('mouseover', function() {
            let text = d3.select(this);
            text.style('cursor', 'pointer');
            text.style('filter', 'brightness(80%)')
        })
        .on('click',(year) => {
            this.setState({
                selectedYear: year
            }, ()=>{
                this.setModalOpen(true);
            });
        });
    }

    drawLegends() {
        let self = this;
        this.legendSvg.attr('transform', 'translate(' + 20 + ',' + (200) + ')');
        var legendNodes = this.legendSvg.selectAll('g').data(this.fields).enter().append('g')
            .attr('transform', function (d, i) {
                return 'translate(' + 10 + ',' + ( (i * 10)) + ')';
        });
        legendNodes.append('circle')
        .attr('r', 5)
        .attr('cy', (d, i)=>(i)*2)
        .attr('fill', function (d, i) {
            return self.colorScheme(i);
        })
        .attr('fill-opacity', 1)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.5);


        legendNodes.append('text').text(function (d) {
            return d;
        })
        .attr('y', (d, i)=>(i+1)*2)
        .attr('font-size', 10)
        .attr('alignment-baseling', 'middle')
        .attr('dx', 8);
    }

    drawWordStream() {
        // var self = this;
        // var prevColor;
        var texts = this.wordstreamSvg.selectAll('.word').data(this.wordsData, d => d.id);

        texts.exit().remove();

        var textEnter = texts.enter().append('g')
            .attr('transform', function (d, i) {
                return 'translate(' + (d.x) + ', ' + d.y + ')rotate(' + d.rotate + ')';
            })
            .attr("class", "word")
            .append('text')
            .attr('class', 'textData');

        textEnter
            .transition().duration(400)
            .text(function (d) {
                return d.text;
            })
            .attr('id', d=>d.id)
            // .attr('class', 'textData')
            .attr('font-family', 'Arial')
            .attr('font-size', d=>d.fontSize)
            .attr('fill', (d)=>{return this.colorScheme(this.fields.indexOf(d.topic))})
            .attr('fill-opacity', 1)
            .attr('text-anchor', 'middle')
            .attr('topic', d=>d.topic)
            .attr('visibility', d=>d.placed?'visible':'hidden');

        texts
            .transition().duration(400)
            .attr('transform', function (d) {
                return 'translate(' + d.x + ', ' + d.y + ')rotate(' + d.rotate + ')';
            })
            .select("text")
            .attr('topic', d=>d.topic)
            .attr('fill', (d)=>{return this.colorScheme(this.fields.indexOf(d.topic))})
            .attr('font-size', function (d) {
                return d.fontSize;
            })
            .attr('visibility', function (d) {
                return d.placed ? "visible" : "hidden";
            });
            this.addInteractions();
    }

    addInteractions() {
        var wordStreamG = this.wordstreamSvg.append('g').attr("id", "wordStreamG");
        let prevColor;
        let self = this;
        this.wordstreamSvg.selectAll('.textData').on('mouseenter', function () {
            var thisText = d3.select(this);
            thisText.style('cursor', 'pointer');
            prevColor = thisText.attr('fill');
            var text = thisText.text();
            var topic = thisText.attr('topic');
            var allTexts = self.wordstreamSvg.selectAll('.textData').filter(t => {
                return t && t.text === text && t.topic === topic;
            });
            allTexts.attr('stroke', prevColor).attr('stroke-width', 1);
        });
        this.wordstreamSvg.selectAll('.textData').on('mouseout', function () {
            var thisText = d3.select(this);
            thisText.style('cursor', 'default');
            var text = thisText.text();
            var topic = thisText.attr('topic');
            var allTexts = self.wordstreamSvg.selectAll('.textData').filter(t => {
                return t && !t.cloned && t.text === text && t.topic === topic;
            });
            allTexts.attr('stroke', 'none').attr('stroke-width', 0);
        });
        this.wordstreamSvg.selectAll('.textData').on('click', function () {
                // console.log('clicked');
                self.props.setShowSideGraph(true);
                var thisText = d3.select(this);
                var text = thisText.text();
                var topic = thisText.attr('topic');
                var allTexts = self.wordstreamSvg.selectAll('.textData').filter(t => {
                    return t && t.text === text && t.topic === topic;
                });
                let stackData = allTexts._groups[0].map(item=>{
                    return item.__data__; 
                });
                self.props.setStackBarData(stackData);
                //Select the data for the stream layers
                var streamLayer = d3.select("path[topic='" + topic + "']")._groups[0][0].__data__;
                var points = [];
                streamLayer.forEach((elm, i) => {
                    points.push([elm[1], (elm[1]+1), i*self.boxWidth]);
                });
                // points.unshift(points[0]);
                for(const i in allTexts._groups[0]){
                    let t = allTexts._groups[0][i];
                    var data = t.__data__;
                    var fontSize = data.fontSize;
                    var thePoint = points[data.timeStep + 1];
                    thePoint[1] = (thePoint[0]-self.streamHeightScale(data.streamHeight));
                    var clonedNode = t.cloneNode(true);
                    d3.select(clonedNode)
                    .attr('visibility', 'visible')
                    .attr('stroke', 'none')
                    .attr('stroke-size', 0);

                    var clonedParentNode = t.parentNode.cloneNode(false);
                    clonedParentNode.appendChild(clonedNode);
    
                    t.parentNode.parentNode.appendChild(clonedParentNode);
                    d3.select(clonedParentNode)
                    .attr('cloned', true)
                    .attr('topic', topic)
                    .transition()
                    .duration(300)
                    .attr('transform', function (d, i) {
                        if(thePoint[2]>=1200) thePoint[2] = 1170;
                        return 'translate(' + (thePoint[2]) + ',' + (self.streamSizeScale(thePoint[1])-5) + ')';
                    });
                    wordStreamG.append('path')
                    .datum(points)
                    .attr('d', self.area)
                    .style('fill', prevColor)
                    .attr('fill-opacity', prevColor)
                    .attr('stroke', prevColor)
                    .attr('stroke-width', 0.3)
                    .attr('topic', topic)
                    .attr('wordStream', true);
                    var allOtherTexts = self.wordstreamSvg.selectAll('.textData').filter(t => {
                        return t && !t.cloned;
                        // return t && !t.cloned && t.topic === topic;
                    });
                    allOtherTexts.attr('visibility', 'hidden');
                }
            });
            self.fields.forEach(topic => {
                d3.select("path[topic='" + topic + "']").on('click', function () {
                    self.props.setShowSideGraph(false);
                    self.wordstreamSvg.selectAll('.textData').filter(t => {
                        return t && !t.cloned && t.placed;
                    })
                    .attr('visibility', 'visible');
          
                    document.querySelectorAll("g[cloned='true']").forEach(node => {
                        node.parentNode.removeChild(node);
                    });

                    document.querySelectorAll("path[wordStream='true']").forEach(node => {
                        node.parentNode.removeChild(node);
                    });
                });
    
            });
    }

    drawLayers() {
        let pathSelection = this.layersSvg.selectAll('.curve').data(this.stackedLayers);
        pathSelection.exit().remove();

        pathSelection
            .transition().duration(400)
            .attr('d', this.area)
            .attr('class', 'curve')
            .attr('fill-opacity', 0)
            .attr('stroke-width', 0)
            .attr('stroke', 'black')
            .attr('topic', (d,i)=>this.fields[i])
            .style('fill', (d,i)=>this.colorScheme(i));

        pathSelection
            .enter()
            .append('path')
            .attr('class', 'curve')
            .attr('d', this.area)
            .attr('fill-opacity', 0)
            .attr('stroke-width', 0)
            .attr('stroke', 'black')
            .attr('topic', (d,i)=>this.fields[i])
            .style('fill', (d,i)=>this.colorScheme(i));
    }

    drawBoxes() {
            this.fields.forEach(topic=>{
                let fieldGroup = this.wordstreamSvg.append('g');
                fieldGroup.selectAll('g').data(this.boxes[topic]).enter()
                .append('g')
                .append('rect')
                .attr('transform', (d, i)=>'translate('+((i)*this.boxWidth)+', '+((d.y))+')')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', this.boxWidth)
                .attr('height',  (d, i)=> (d.height))
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .attr('stroke-size', 10)
                .attr('opacity', 1)
            });
    }

    render() {
        return(
            <div id="graphDiv">
                <svg 
                    preserveAspectRatio="xMidYMin slice"
                    viewBox={`0 180 ${1200} ${650}`} 
                    id="parentSvg" 
                    transform="translate(0, 0)"> 
                </svg>
                <ForceModal fields={this.fields} isOpen={this.state.modalOpen} selectedYear={this.state.selectedYear} setModalOpen={this.setModalOpen} activeGraph={this.props.activeGraph}/>
            </div> 
        )
    }
}