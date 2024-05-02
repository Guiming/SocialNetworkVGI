// A function that builds the graph for a specific value of bin
function draw_scatter() {
    attr_x = $("#scatter_attr_x option:checked")[0].value;
    attr_y = $("#scatter_attr_y option:checked")[0].value;

    data = data_scatter;
    
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 60},
        width = 460 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;
    
    nBin = 50; //nBin=data.length
    data = data.slice(0, nBin);

	if(d3.select("#svg_scatter")[0]!=null){
		d3.select("#svg_scatter").remove();
		d3.select("#id_tooltipscatter").remove();
        //d3.select("#scattersvg").remove();
	}

    // append the svg object to the body of the page
    var svg = d3.select("#scattersvg")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("id", "svg_scatter")
			/*.call(d3.behavior.zoom().on("zoom", function () {
				svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
			  }))*/

              // A function that updates the chart when the user zoom and thus new boundaries are available
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

        var scatter = d3.select("svg").selectAll("circle")
        
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
         .scaleExtent([1, 5])  // This control how much you can unzoom (x0.5) and zoom (x20)
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
	
	// A function that change this tooltip when the user hover a point.
	// Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
	var mouseover = function(d) {
		tooltip
		.transition()
		.duration(100)
		.style('display', 'block');
		tooltip
		.html(attr_x + ": " + d[attr_x] + "<br>" + attr_y + ": " + d[attr_y])
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
		
		d3.select(this).attr("style", "fill: #69b3a2; stroke: white; opacity: 0.5;");
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
            .style("opacity", 0.5)
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
		.text(attr_x);

    innerSpace.append("text")
		.attr("class", "y label")
		.attr("text-anchor", "end")
		.attr("y", 6)
		.attr("dy", ".75em")
		.attr("transform", "rotate(-90)")
		.text(attr_y);

    
    
        // This add an invisible rect on top of the chart area. This rect can recover pointer events: necessary to understand when the user zoom


    // now the user can zoom and it will trigger the function called updateChart


  
}