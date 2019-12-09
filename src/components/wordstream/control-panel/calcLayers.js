import * as d3 from 'd3';

export default function calcLayers(props) {
    let {data, screenDimensions} = props;
    let dates = [];
        data.forEach((row) => {
            dates.push(row.date);
        });
    let fields = Object.keys(data[0].words),
        boxWidth = screenDimensions[0]/data.length,
        streamSizeScale = generateStreamSizeScale(),
        stackedLayers = generateStackedLayers(),
        boxes = generateBoxes();

    function generateStreamSizeScale() {
        let totalFrequenciesPerPeriod = calculateTotalFrequenciesPerPeriod();
        let frequencyVals = d3.nest().key(function(d) {
            return d.date;
            })
            .rollup(function(leaves) {
            return d3.sum(leaves, (d) => {
                let perPeriodSum = 0;
                fields.forEach(field=>perPeriodSum+=d[field]);
                return perPeriodSum;
            });
            }).entries(totalFrequenciesPerPeriod)
            .map(function(d) {
            return {
                date: d.key,
                totalValue: d.value
            };
            });
        let maxPeriodFreq = d3.max(frequencyVals, d=>d.totalValue);
        return d3.scaleLinear().domain([-maxPeriodFreq, maxPeriodFreq]).range([0, screenDimensions[1]]).nice();
    }

    function calculateTotalFrequenciesPerPeriod(){
        let arr = [];
        data.forEach(item=>{
            let obj = {};
            obj['date']=item.date;
            fields.forEach(field=>{
                obj[field] = d3.sum(item.words[field],d=>parseInt(d.sudden));
            });
            arr.push(obj);
        });
        return arr;
    }

    function generateStackedLayers() {
        let totalFrequencies = calculateTotalFrequenciesPerPeriod();
        totalFrequencies.unshift(totalFrequencies[0]);
        let stackedLayers = d3.stack().offset(d3.stackOffsetSilhouette).keys(fields)(totalFrequencies);
        return stackedLayers;
    }

    function generateBoxes() {
        let boxes = {};
        fields.forEach((field, i)=>{
            boxes[field] = [];
            stackedLayers[i].forEach(stackLayer=>{
                boxes[field].push({
                    x: stackLayer.data.date,
                    y: streamSizeScale(stackLayer[0]),
                    width: boxWidth,
                    height: streamSizeScale(stackLayer[1]) - streamSizeScale(stackLayer[0])
                });
            });
        });
        return boxes;
    }

    return {
        streamSizeScale: streamSizeScale,
        stackedLayers: stackedLayers,
        boxes: boxes,
        boxWidth: boxWidth,
        fields: fields,
        dates: dates
    };
}   
