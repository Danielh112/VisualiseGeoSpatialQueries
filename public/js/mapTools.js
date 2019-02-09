$.getScript("js/map.js", function(){
  $('.geowithin').click(function() {
    geoWithin();
  });
  $('.geoIntersects').click(function() {
    geoIntersects();
  });
  $('.near').click(function() {
    near();
  });

function geoWithin() {
  var selection = map.append("path")
    .attr("class", "selection")
    .attr("visibility", "hidden");
}

function geoIntersects() {

}

function near() {

}

function rect(x, y, w, h) {
  return "M"+[x,y]+" l"+[w,0]+" l"+[0,h]+" l"+[-w,0]+"z";
}

var startSelection = function(start) {
    selection.attr("d", rect(start[0], start[0], 0, 0))
      .attr("visibility", "visible");
};

var moveSelection = function(start, moved) {
    selection.attr("d", rect(start[0], start[1], moved[0]-start[0], moved[1]-start[1]));
};

var endSelection = function(start, end) {
  selection.attr("visibility", "hidden");
};

map.on("mousedown", function() {
  var subject = d3.select(window), parent = this.parentNode,
      start = d3.mouse(parent);
    startSelection(start);
    subject
      .on("mousemove.selection", function() {
        moveSelection(start, d3.mouse(parent));
      }).on("mouseup.selection", function() {
        endSelection(start, d3.mouse(parent));
        subject.on("mousemove.selection", null).on("mouseup.selection", null);
      });
});

map.on("touchstart", function() {
  var subject = d3.select(this), parent = this.parentNode,
      id = d3.event.changedTouches[0].identifier,
      start = d3.touch(parent, id), pos;
    startSelection(start);
    subject
      .on("touchmove."+id, function() {
        if (pos = d3.touch(parent, id)) {
          moveSelection(start, pos);
        }
      }).on("touchend."+id, function() {
        if (pos = d3.touch(parent, id)) {
          endSelection(start, pos);
          subject.on("touchmove."+id, null).on("touchend."+id, null);
        }
      });
});
});
