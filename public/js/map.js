window.onload = function() {

	var map = d3.select("#map")
		.append("svg")
		.attr("width", 960)
		.attr("height", 500); 

	path = d3.geoPath().projection(projection);

	var projection = d3
			.geoMercator()
			.scale(160)	
			.rotate([-0.25, 0.25, 0])
			.center([139.0032936, 36.3219088]); 

	//var test = [{"type":"Feature","geometry":{"coordinates":[-73.856077,40.848447],"type":"Point"},"properties":{"_id":"55cba2476c522cafdb053add","location":{"coordinates":[-73.856077,40.848447],"type":"Point"},"name":"Morris Park Bake Shop"}}];

	d3.json("http://localhost:3000/api/map")
	  .then(function(data){
			map.selectAll("path")
				.data(data.features)
				.enter()
				.append("path")
				.attr("d", path) 
				.attr("fill", "green")
				.attr("fill-opacity", 0.5)
				.attr("stroke", "#222");    
	});
}

/*
svg.selectAll(".pin")
  .data(places)
  .enter().append("circle", ".pin")
  .attr("r", 5)
  .attr("transform", function(d) {
    return "translate(" + projection([
      d.location.longitude,
      d.location.latitude
    ]) + ")";
  });
*/