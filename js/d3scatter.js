function extract_attributes(data, attr){
    var arr = [];
    for(var i in data){
        if(data[i][attr]){
            arr.push(+data[i][attr]);
        }/*else{
            arr.push(0);
        }*/
    }
    return arr;
}

// A function that builds the graph for a specific value of bin
function draw_scatter() {
    attr_x = $("#attr_scatter_x option:checked")[0].value;
    attr_y = $("#attr_scatter_y option:checked")[0].value;
    
    attr_x_text = $("#attr_scatter_x option:checked")[0].text;
    attr_y_text = $("#attr_scatter_y option:checked")[0].text;

    binX = $("#binningxcb")[0].checked;    
    nBinX = +$("#nBin_scatter").val();

    if($("#node_scatter")[0].checked){
        data = fg_dataset.nodes;
    }else{
        data = fg_dataset.links;
    }

    nBin=data.length; //nBin = 50; //
    data = data.filter(function(d,i){return i<nBin && d[attr_x] && d[attr_y]})

    if(binX){
        var histogram = d3.layout.histogram()
            .value(function(d) { return d[attr_x]; })
            .range([d3.min(data, function(d) { return +d[attr_x] }), d3.max(data, function(d) { return +d[attr_x] })])
            .bins(nBinX); // then the numbers of bins //x.ticks(nBin)

        // And apply this function to data to get the bins
        var bins = histogram(data);

        var dataBin = [];
        // compute meanX and meanY in each bin
        for(var i in bins){
            var medianX = bins[i].x + bins[i].dx/2; //d3.mean(bins[i], function(d){ return d[attr_x]});
            //medianX = medianX==undefined?0:medianX;
            var medianY = d3.mean(bins[i], function(d){ return d[attr_y]});
            //medianY = medianY==undefined?0:medianY;
            dataBin.push({
                [attr_x]: medianX,
                [attr_y]: medianY
            })
        }
        data = dataBin.filter(function(d,i){return d[attr_x] && d[attr_y]});
        console.log(data)
    }

    // computing correlation coefficient using jstat.js //https://github.com/jstat/jstat
    x = extract_attributes(data, attr_x);
    y = extract_attributes(data, attr_y);
    var r = jStat.corrcoeff(x, y);
    //var r = jStat.spearmancoeff(x, y);
    const n = x.length;
    const t = r * Math.sqrt((n - 2) / (1 - r * r));

    // Calculate the p-value using the t-distribution
    var pValue = jStat.ttest(t, n - 2);
    console.log("Pearson's correlation coefficient: ", r)
    console.log("P value: ", pValue)

    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 60},
        width = 460 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;
     
  
	if(d3.select("#svg_scatter")[0]!=null){
		d3.select("#svg_scatter").remove();
		d3.select("#id_tooltipscatter").remove();
        d3.select("#id_statsscatter").remove();
	}

    // append the svg object to the body of the page
    var svg = d3.select("#scattersvg")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("id", "svg_scatter")

    // X axis: scale and draw:
    var x = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return +d[attr_x] })])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
        .range([0, width]);

    // Y axis: initialization
    var y = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return +d[attr_y] })])
        .range([height, 0]);

    var xAxis = d3.svg.axis().orient("bottom").ticks(5).scale(x);
    var yAxis = d3.svg.axis().orient("left").ticks(5).scale(y);

    function updateScatter() {

        var scatter = d3.select("#scattersvg").selectAll("circle")
        
        // update axes with these new boundaries
        innerSpace.select(".x.axis").call(xAxis)
        innerSpace.select(".y.axis").call(yAxis)

        // update circle position
        scatter
            .attr('cx', function(d) {return x(d[attr_x])})
            .attr('cy', function(d) {return y(d[attr_y])})
    }

    // Set the zoom and Pan features: how much you can zoom, on which part, and what to do when there is a zoom
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])  // This control how much you can unzoom (x0.5) and zoom (x20)
        .x(x)
        .y(y)
        .on("zoom", updateScatter);


    var innerSpace = svg.append("g")
        .attr("class", "inner_space")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoom);

    innerSpace.append("g").attr("class", "hidden rectangle")
        .append("rect")
        .attr("class","background")
        .attr("x", function(d,i){return x(0);})
        .attr("y", function(d,i){return y(d3.max(data, function(d) { return +d[attr_y] }));})
        .attr("width", function(d,i){return x(d3.max(data, function(d) { return +d[attr_x] }));})
        .attr("height", function(d,i){return y(0);})
        .style("fill","white")
        .style("opacity","0")

    innerSpace.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "x axis axis_scatter")
        .call(xAxis); //

    innerSpace.append("g")
        .transition()
        .duration(1000)
        .attr("class", "y axis axis_scatter")
        .call(yAxis); //

    ///////

    // Add a tooltip div. Here I define the general feature of the tooltip: stuff that do not depend on the data point.
    // Its opacity is set to 0: we don't see it by default.
    var tooltip = d3.select("#scattersvg")
        .append("div")
        .attr("class", "tooltipscatter")
        .attr("id", "id_tooltipscatter")

    var statspanel = d3.select("#scattersvg")
        .append("div")
        .attr("class", "statsscatter")
        .attr("id", "id_statsscatter");
        
        statspanel.transition()
        .duration(100)
        .style("right", "80px")
        .style("top", "150px")
        .style('display', 'block');
    
        statspanel.html("Correlation coefficient: " + r.toFixed(3) + " (p-value: " + pValue.toFixed(3) + ")");
        

    // A function that change this tooltip when the user hover a point.
    // Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
    var mouseover = function(d) {
        tooltip
        .transition()
        .duration(100)
        .style('display', 'block');
        tooltip
        .html(attr_x_text + ": " + (Number.isInteger(+d[attr_x]) ? d[attr_x] : (+d[attr_x]).toFixed(3)) + "<br>" + attr_y_text + ": " + (Number.isInteger(+d[attr_y]) ? d[attr_y] : (+d[attr_y]).toFixed(3)))
        .style("left", (d3.event.layerX + 10) + "px")
        .style("top", (d3.event.layerY + 10) + "px");

        d3.select(this).attr("style", "fill: orange;");
    }
    var mousemove = function(d) {
        tooltip
        .style("left", (d3.event.layerX + 10) + "px")
        .style("top", (d3.event.layerY + 10) + "px");
    }
    // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
    var mouseout = function(d) {
    
        d3.select(this).attr("style", "fill: #69b3a2; stroke: white; opacity: 0.8;");
        //d3.select(this).style("fill", "#69b3a2;");
        //d3.select(this).attr("style", "stroke: white;");
        //d3.select(this).attr("style", "opacity: 0.3;");

        tooltip
        .transition()
        .duration(100)
        .style("display", "none");

    
    }

    // Add dots
    var scatter = innerSpace.selectAll("circle")
        .data(data) // the .filter part is just to keep a few dots on the chart, not all of them
        .enter()
        .append("circle")
            .attr("cx", function (d) { return x(d[attr_x]); } )
            .attr("cy", function (d) { return y(d[attr_y]); } )
            .attr("r", 6)
            .style("fill", "#69b3a2")
            .style("opacity", 0.8)
            .style("stroke", "white")
        .on("mouseover", mouseover )
        .on("mousemove", mousemove )
        .on("mouseout", mouseout )
        .transition() // and apply changes to all of them
        .duration(1000)

    innerSpace.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text(attr_x_text);

    innerSpace.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text(attr_y_text);



    // This add an invisible rect on top of the chart area. This rect can recover pointer events: necessary to understand when the user zoom


    // now the user can zoom and it will trigger the function called updateChart



    }