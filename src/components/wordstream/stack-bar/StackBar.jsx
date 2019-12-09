import React from 'react';
import * as d3 from 'd3';

export default class StackBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            nameOfPerson: null
        }
    }
    

    componentDidUpdate(prevProps) {
        if(this.props.stackBarData!==prevProps.stackBarData) {
            let columns = null;
            let keepKeys = null;
            let stackData = null;
            this.setState({
                nameOfPerson: this.props.stackBarData[0].text
            })
            switch(this.props.activeGraph) {
                case 'olympic_sport':
                case 'olympic':
                    columns = ['Gold', 'Bronze', 'Silver', 'NA'];
                    keepKeys = ['Gold', 'Bronze', 'Silver', 'NA', 'year'];
                    stackData = [];
                    this.props.stackBarData.forEach(item=>{
                        let obj = {};
                        Object.entries(item).forEach(([key, value])=>{
                            if(keepKeys.includes(key)){
                                obj[key] = value;
                            }
                        });
                        stackData.push(obj);
                    });
                    break;
                case 'youtube':
                    columns = ['likes', 'dislikes'];
                    keepKeys = ['likes', 'dislikes', 'year'];
                    stackData = [];
                    console.log(this.props.stackBarData);
                    this.props.stackBarData.forEach(item=>{
                        let obj = {};
                        Object.entries(item).forEach(([key, value])=>{
                            if(keepKeys.includes(key)){
                                obj[key] = value;
                            }
                        });
                        stackData.push(obj);
                    });
                    break;
                    // d3.select('#stackBar').selectAll('*').remove();
                    // this.draw(stackData, columns);
            }
            console.log(stackData, columns);
            d3.select('#stackBar').selectAll('*').remove();
            this.draw(stackData, columns);
        }
    }

    draw(data, columns) {
        let self = this;
        var svg = d3.select("#stackBar"),
        margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // set x scale
        var x = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.05)
        .align(0.1);

        // set y scale
        var y = d3.scaleLinear()
        .rangeRound([height, 0]);

        // set the colors
        let colors = this.props.activeGraph === 'youtube'? d3.schemePaired : ["#d4af37", "#cd7f32", "#aaa9ad", "#6b486b"];
        var z = d3.scaleOrdinal()
        .range(colors);
        data.forEach(item=>{
        let total = 0;
        columns.forEach(key=>{
        total += parseInt(item[key]);
        });
        item['total'] = total;
        });
        var keys = columns;
        let maxTotal = d3.max(data, function(d) { return d.total; });
        data.sort(function(a, b) { return b.total - a.total; });
        let xRangeScale = d3.scaleLinear().domain([0, 8]).range([100, 340]);
        let xRange = xRangeScale(data.length);
        x.domain(data.map(function(d) { return d.year; })).range([0, xRange]);
        y.domain([0, d3.max(data, function(d) { return d.total; })]).range([height, 0]).nice();
        z.domain(keys);

        g.append("g")
        .selectAll("g")
        .data(d3.stack().keys(keys)(data))

        .enter().append("g")
        .attr("fill", function(d) { return z(d.key); })
        .selectAll("rect")
        .data(function(d) { return d; })
        .enter().append("rect")
        .attr("x", function(d) { return x(d.data.year); })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return (y(d[0]) - y(d[1])); })
        .attr("width", x.bandwidth())
        .on("mouseover", function() { tooltip.style("display", null); })
        .on("mouseout", function() { tooltip.style("display", "none"); })
        .on("mousemove", function(d) {
        var xPosition = d3.mouse(this)[0] - 5;
        var yPosition = d3.mouse(this)[1] - 5;
        tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
        tooltip.select("text").text(d[1]-d[0]);
        });
        
        maxTotal = self.props.activeGraph==='youtube'?10:maxTotal;

        g.append("g")
        .attr("class", "stackAxis")
        .attr('id', 'stackXAxis')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

        g.append("g")
        .attr("class", "stackAxis")
        .call(d3.axisLeft(y).ticks(maxTotal).tickFormat(d3.format("d")))
        .append("text")
        .attr("x", 2)
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start");

        var legend = g.append("g")
        .attr("id", "stackLegend")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys.slice().reverse())
        .enter().append("g")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        legend.append("rect")
        .attr("x", width)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", z);

        legend.append("text")
        .attr("x", width - 5)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(function(d) { return d; });

        var tooltip = svg.append("g")
        .attr("class", "tooltip")
        .style("display", "none");
        
        tooltip.append("rect")
        .attr("width", 60)
        .attr("height", 20)
        .attr("fill", "white")
        .style("opacity", 0.5);

        tooltip.append("text")
        .attr("x", 30)
        .attr("dy", "1.2em")
        .style("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");
    }

    render(){
        return(
            <div>
                <h3> 
                    {this.state.nameOfPerson}
                </h3> 
                <h6> 
                    {this.props.activeGraph === 'youtube' ? 'Likes and dislikes over months ' : 'Medals won over the years'} 
                </h6>
                <svg viewBox="0 0 400 500" height="500" width="400" id="stackBar"></svg>
            </div>
        )
    }
}