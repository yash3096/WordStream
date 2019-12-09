import * as d3 from 'd3';

export default function calcWords(props) {
    let {data, maxFontSize, minFontSize, streamSizeScale, screenDimensions, stackedLayers, boxes, boxWidth, fields} = props;
    let fontSizeScale = generateFontSizeScale(),
        cw = 1 << 14,
        ch = 1 << 11,
        font = "Arial",
        cloudRadians = Math.PI / 180,
        spiral = achemedeanSpiral;
    getImageData();
    
    for(var tc = 0; tc< fields.length; tc++){
        var field = fields[tc];
        var board = buildBoard(boxes, field);
        var innerBoxes = boxes[field];
        //Place
        for(var bc = 0; bc < data.length; bc++){
            var words = data[bc].words[field];
            var n = words.length;
            var innerBox = boxes[field][bc];
            board.boxWidth = innerBox.width;
            board.boxHeight = innerBox.height;
            board.boxX = innerBox.x;
            board.boxY = innerBox.y;
            for(var i = 0; i < n; i++){
                place(words[i], board, bc);
            }
        }
    }

    function generateFontSizeScale() {
        let max = 0, min = Math.pow(10, 1000);
        data.forEach(box=>{
            fields.forEach(field=>{
                let i = 0, j = Math.pow(10, 1000);
                box.words[field].forEach(word=>{
                    if(word.sudden>i) i = word.sudden;
                    if(word.sudden<j) j = word.sudden;
                });
                if(i>max) max = i;
                if(j<min) min = j;
            });
        });
        return d3.scaleLinear().domain([min, max]).range([minFontSize, maxFontSize]).nice();
    }

    function getImageData(){
        var av = 0;
        var flow = 0;
        // var data = boxes.data;
        var c = getContext(document.createElement("canvas"));
        c.clearRect(0, 0, cw, ch);
        var x = 0,
            y = 0,
            maxh = 0;
        for(var i = 0; i < data.length; i++){
            fields.forEach(field =>{
                var words = data[i].words[field];
                var n = words.length;
                var di=-1;
                var d = {};
                while (++di < n) {
                    d = words[di];
                    c.save();
                    d.fontSize = fontSizeScale(d.sudden);
                    d.rotate = (~~(Math.random() * 4) - 2) * av - flow;
                    c.font = ~~(d.fontSize + 1) + "px " + font;
                    var w = ~~(c.measureText(d.text).width),
                        h = d.fontSize;
                    if (h > maxh) maxh = h;
                    if (x + w >= cw) {
                        x = 0;
                        y += maxh;
                        maxh = 0;
                    }
                    if (y + h >= ch) break;
                    c.translate((x + (w >> 1)) , (y + (h >> 1)));
                    if (d.rotate) c.rotate(d.rotate * cloudRadians);
                    c.fillText(d.text, 0, 0);
                    if (d.padding) {
                        c.lineWidth = (2 * d.padding, c.strokeText(d.text, 0, 0))
                    };
                    c.restore();

                    d.width = w;
                    d.height = h;
                    d.x = x;
                    d.y = y;
                    d.x1 = w>>1;
                    d.y1 = h>>1;
                    d.x0 = -d.x1;
                    d.y0 = -d.y1;
                    d.timeStep = i;
                    d.streamHeight = streamSizeScale(d.frequency);
                    x += w;
                }
            });
        }
    
        for(var bc = 0; bc < data.length; bc++){
            fields.forEach(field=>{
                var words = data[bc].words[field];
                var n = words.length;
                var di=-1;
                var d = {};
                while (++di < n) {
                    d = words[di];
                    var pixels = c.getImageData(d.x, d.y, d.width, d.height).data;
                    d.sprite = Array();
                    for(var i = 0; i<<2 < pixels.length; i++){
                        d.sprite.push(pixels[i<<2]);
                    }
                }
            });
        }
    }

    function getContext(canvas) {
        canvas.width = cw;
        canvas.height = ch;
        var context = canvas.getContext("2d");
        context.fillStyle = context.strokeStyle = "red";
        context.textAlign = "center";
        context.textBaseline = "middle";
        return context;
    }

    function buildSvg(boxes, field){
        let streamPath1 = Array(),
            streamPath2 = Array();
        var width = screenDimensions[0],
            height = screenDimensions[1];
        var svg = d3.select(document.createElement('svg'));
        svg
        .attr('width', width)
        .attr('height', height);
        var graphGroup = svg.append('g');

        var catIndex = fields.indexOf(field);

        var area1 = d3.area()
            .curve(d3.curveLinear)
            .x(function(d, i){return (i)*boxWidth})
            .y0(0)
            .y1(function(d){return streamSizeScale(d[0]); });

        var area2 = d3.area()
            .curve(d3.curveLinear)
            .x(function(d, i){return (i)*boxWidth })
            .y0(function(d){return (streamSizeScale(d[1])); })
            .y1(height);
        graphGroup.append('path').datum(stackedLayers[catIndex])
            .attr('d', area1)
            .attr('stroke', 'red')
            .attr('stroke-width', 2)
            .attr('fill', 'red')
            .attr('id', 'path1');
        graphGroup.append('path').datum(stackedLayers[catIndex])
            .attr('d', area2)
            .attr('stroke', 'red')
            .attr('stroke-width', 2)
            .attr('fill', 'red')
            .attr('id', 'path2');
        return svg;
    }

    function buildCanvas(boxes, field){
        var svg = buildSvg(boxes, field);
        var path1 = svg.select("#path1").attr('d');
        var p2d1 = new Path2D(path1);
        var path2 = svg.select("#path2").attr('d');
        var p2d2 = new Path2D(path2);
        var canvas = document.createElement("canvas");
        // document.querySelector('body').appendChild(canvas);
        canvas.width = screenDimensions[0];
        canvas.height = screenDimensions[1];
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.fill(p2d1);
        ctx.fill(p2d2);
        return canvas;
    }

    function buildBoard(boxes, field){
        var canvas = buildCanvas(boxes,field);
        var width = canvas.width,
            height = canvas.height;
        var board = {};
        board.x = 0;
        board.y = 0;
        board.width = width;
        board.height = height;
        var sprite = [];
        //initialization
        for(var i=0; i< width*height; i++) sprite[i] = 0;
        var c = canvas.getContext('2d');
        var pixels = c.getImageData(0, 0, width, height).data;
        let res = 0;
        for(var i=0; i< width*height; i++){
            res++;
            sprite[i] = pixels[i<<2];
        }
        board.sprite = sprite;
        return board;
    }
    
    function place(word, board, bc){
        var bw = board.width,
            bh = board.height,
            maxDelta = ~~Math.sqrt((board.boxWidth*board.boxWidth) + (board.boxHeight*board.boxHeight)),
            startX = (bc+1)*board.boxWidth,
            // startX =  ~~(board.boxX + (board.boxWidth*( Math.random() + .5) >> 1)),
            startY =  ~~(board.boxY + (board.boxHeight*( Math.random() + .5) >> 1)),
            s = spiral([board.boxWidth, board.boxHeight]),
            dt = Math.random() < .5 ? 1 : -1,
            t = -dt,
            dxdy, dx, dy;
        word.x = startX;
        word.y = startY;
        word.placed = false;
        while (dxdy = s(t += dt)) {

            dx = ~~dxdy[0];
            dy = ~~dxdy[1];

            if (Math.max(Math.abs(dx), Math.abs(dy)) >= (maxDelta))
                break;

            word.x = startX + dx;
            word.y = startY + dy;

            if (word.x + word.x0 < 0 || word.y + word.y0 < 0 || word.x + word.x1 > screenDimensions[0] || word.y + word.y1 > screenDimensions[1])
                continue;
            if(!cloudCollide(word, board)){
                placeWordToBoard(word, board);
                word.placed = true;
                break;
            }
        }
    }

    function cloudCollide(word, board) {
        var wh = word.height,
            ww = word.width,
            bw = board.width;
        //For each pixel in word
        for(var j = 0; j < wh; j++){
            for(var i = 0; i < ww; i++){
                var wsi = j*ww + i; //word sprite index;
                var wordPixel = word.sprite[wsi];

                var bsi = (j+word.y+word.y0)*bw + i+(word.x + word.x0);//board sprite index
                var boardPixel = board.sprite[bsi];

                if(boardPixel!=0 && wordPixel!=0){
                    return true;
                }
            }
        }
        return false;
    }

    function placeWordToBoard(word, board){
        //Add the sprite
        var y0 = word.y + word.y0,
            x0 = word.x + word.x0,
            bw = board.width,
            ww = word.width,
            wh = word.height;
        for(var j=0; j< wh; j++){
            for(var i = 0; i< ww; i++){
                var wsi = j*ww + i;
                var bsi = (j+y0)*bw + i + x0;
                if(word.sprite[wsi]!=0) board.sprite[bsi] = word.sprite[wsi];
            }
        }
    }

    function achemedeanSpiral(size){
        var e = size[0]/size[1];
        return function(t){
            return [e*(t *= .1)*Math.cos(t), t*Math.sin(t)];
        }
    };
    return data;
}