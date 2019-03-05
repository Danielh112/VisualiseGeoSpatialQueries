/* Specifies the tool mode, near, intersects, within */
let toolMode = '';
let currentDrawTool = '';

const near = {
  tool: '',
  markerDrawn: false,
  marker: '',
  nextShape: '',
  geo: {
    geometry: '',
  },
  distance: {
    maxDistShape: '',
    minDistShape: '',
    minDistance: 0,
    maxDistance: 0
  },
  nearsphere: false
}

const geoIntersects = {
  tool: '',
  polygonDrawn: false,
  shape: '',
  nextShape: '',
  polygonTool: '',
  selectedTool: '',
  geo: {
    geometry: ''
  }
}

const geoWithin = {
  tool: '',
  polygonDrawn: false,
  shape: '',
  nextShape: '',
  polygonTool: '',
  selectedTool: '',
  geo: {
    geometry: ''
  }
}

$(document).ready(function() {
  /* ---------------- Panel, tabs and navigation ----------------*/
  $(document).on('click', '.panel-heading', function() {
    togglePanel($(this));
  });

  $('#tabs li').click(function(event) {
    event.preventDefault();
    changeTab($(this));
  });

  $('.createQuery').click(function() {
    setToolMode($(this));
    fullPanelExpand($(this));
    nextTab($(this));
    restoreMapDrawings();
  });

  $('.next').click(function() {
    nextTab($(this));
  });

  $('.prev').click(function() {
    prevTab($(this));
  });

  $('.proceed').click(function() {
    closeModal();
    clearMapDrawings();
    if (toolMode === 'near') {
      redrawMarker();
    } else {
      polygonToolSelection(geoIntersects.selectedTool);
    }
  });

  $('.cancel').click(function() {
    closeModal();
  });

  /* ---------------- Near Panel: Changes and inputs ----------------*/

  /* Step 1: Draw Marker or find Existing point */

  $('.draw-marker').click(function() {
    drawMarker($(this));
  });

  $(".find-documents").autocomplete({
    source: function(request, response) {
      $.when(
        findDocuments($(this)[0].term)
      ).then(function(suggestions) {
        response(suggestions);
      })
    },
    minLength: 2,
    focus: function(event, ui) {
      ui.item.value = ui.item.label;
    },
    select: function(event, ui) {
      ui.item.value = ui.item.label;
      if (toolMode === 'near') {
        autoDrawMarker(ui.item);
      } else {
        autoDrawPolygon(ui.item);
      }
    }
  });

  /* Step 2: Draw surrounding max and min distance circles */

  $("#maximumDistInput").on("paste keyup", function() {
    maxDistCircle($(this).val());
  });

  $("#minimumDistInput").on("paste keyup", function() {
    minDistCircle($(this).val());
  });

  $('#nearSphereToggle').mousedown(function() {
    nearSphereToggle($(this));
  });


  /* ---------------- Intersection Panel: Changes and inputs ----------------*/
  /* Step 1: Draw polgon or find Existing shape */
  $('.intersect-icon').mousedown(function() {
    if (!polygonExists('manual')) {
      polygonToolSelection($(this));
    } else {
      $('#redraw-polygon-modal').modal('toggle');
      geoIntersects.selectedTool = $(this);
    }
  });

  /* On map drawn event */
  map.on('draw:created', function(element) {
    shapeDrawn(element);
  });
});

/* Expand and collapse panel */
function togglePanel(panel) {
  if (!panel.hasClass('panel-collapsed')) {
    fullPanelCollapse(panel);
    panel.closest('.panel').find('.panel-body').slideUp();
    panel.addClass('panel-collapsed');
    panel.find('i').removeClass('fa-minus').addClass('fa-plus');
  } else {
    panelBody = panel.closest('.panel').find('.panel-body')
    panelBody.slideDown();
    panelBody.css('display', 'flex');
    panel.removeClass('panel-collapsed');
    panel.find('i').removeClass('fa-plus').addClass('fa-minus');
  }
}

/* Change Tab (Tools/Filters) */
function changeTab(tab) {
  var t = $(tab).attr('id');
  if (!$(tab).hasClass('active')) {
    $('#tabs li').removeClass('active');
    $(tab).addClass('active');

    $('#' + t + '-container').removeClass('hidden');
    $('.side-panel').hide();
    $('#' + t + '-container').show();
  }
}

/* If the button is not disabled
   Hide current content
   Display next content
   Disable the next button in the next panel
*/
function prevTab(element) {
  if (!element.hasClass('btn-default-disabled')) {
    const panelBody = $(element).closest('.panel-body');
    const prevPanelBody = panelBody.prev();

    panelBody.addClass('hidden');
    prevPanelBody.removeClass('hidden');
    prevPanelBody.show();
  }
}

/* If the button is not disabled
   Hide current content
   Display next content
   Disable the next button in the next panel
   Collpase all children
*/
function nextTab(element) {
  if (!element.hasClass('btn-default-disabled')) {
    const panelBody = $(element).closest('.panel-body');
    const nextPanelBody = panelBody.next();

    panelBody.addClass('hidden');
    nextPanelBody.removeClass('hidden');
    nextPanelBody.show();
    nextPanelBody.find('.panel-body').hide();

    $(`#${toolMode}`).find('.next').addClass('btn-default-disabled');
  }
}

/* 1. Make panel Full Size
   2. Scroll to panel
   3. Lock panel in place */
function fullPanelExpand(element) {
  const panel = $(element).closest('.panel');
  panel.addClass('full-panel');
  const viewPanel = $(element).closest('.view-panel');
  viewPanel[0].scrollIntoView({
    behavior: 'smooth',
    block: 'start',
    inline: 'start'
  });
  const container = $(element).closest('#tools-tab-container');
  container.addClass('fixed-panel');
}

/* Collapse full panel (return to info panels)
   - Remove all layers on map
   - Look for any sub collapsable elements and collapse these elements
*/
function fullPanelCollapse(element) {
  const panel = $(element).closest('.panel');
  if (panel.hasClass('full-panel')) {
    panel.removeClass('full-panel');
    const viewPanel = $(element).closest('.view-panel');
    viewPanel[0].scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'start'
    });
    const container = $(element).closest('#tools-tab-container');
    container.removeClass('fixed-panel');
    firstTab(element);

    $(`#${toolMode}`).find('.next').addClass('btn-default-disabled');

    clearMapDrawings();
  }
}

/* Closure of tab restore map (remove all drawn shapes),
   Reset all near variables
   Reset marker drawn button and nearsphere toggle
*/

function clearMapDrawings() {
  if (toolMode === 'near' || toolMode === 'nearSphere') {
    if (near.marker !== '') map.removeLayer(near.marker);
    if (near.distance.maxDistShape !== '') map.removeLayer(near.distance.maxDistShape);
    if (near.distance.minDistShape !== '') map.removeLayer(near.distance.minDistShape);
  } else if (toolMode === 'geoIntersects') {
    if (geoIntersects.shape !== '') map.removeLayer(geoIntersects.shape);
  } else if (toolMode === 'geoWithin') {
    if (geoWithin.shape !== '') map.removeLayer(geoWithin.shape);
  }
}

/* If tab is reopened restore map */

function restoreMapDrawings() {
  if (toolMode === 'near' || toolMode === 'nearSphere') {
    if (near.marker !== '') {
      map.addLayer(near.marker);
      const generatedQuery = queryBuilder(near.geo.geometry, near.distance.maxDistance, near.distance.minDistance);
      queryOutput(generatedQuery);
    }

    if (near.distance.maxDistShape !== '') map.addLayer(near.distance.maxDistShape);
    if (near.distance.minDistShape !== '') map.addLayer(near.distance.minDistShape);
  } else if (toolMode === 'geoIntersects') {
    if (geoIntersects.shape !== '') {
      map.addLayer(geoIntersects.shape);
      const generatedQuery = queryBuilder(geoIntersects.geo.geometry);
      queryOutput(generatedQuery);
    }
  } else if (toolMode === 'geoWithin') {
    if (geoWithin.shape !== '') {
      map.addLayer(geoWithin.shape);
      const generatedQuery = queryBuilder(geoWithin.geo.geometry);
      queryOutput(generatedQuery);
    }
  }
}

function closeModal() {
  $('.modal').modal('hide');
}

/* Set the current mode we are in e.g. near, intersects, within */
function setToolMode(element) {
  toolMode = $(element).closest('.tool-section').attr('id');
}


/* Only if the panel is in full mode and is collapsed return to tools panel */
function firstTab(element) {
  const panel = $(element).closest('.panel');
  const panelBody = $(element).parents('.panel').find('.panel-body');
  const firstPanel = panelBody;
  panelBody.addClass('hidden');
  panelBody.parent().find('.panel-body:first').removeClass('hidden');
}

/* Map Tools - Near: Draw Marker
  1. Allow only one point to be drawn
  2. Set button colour to in use
  3. Use drawPoint tool
  */

function markerExists(mode) {
  near.tool = mode;

  if (near.markerDrawn) {
    $('#redraw-marker-modal').modal('toggle');
    return true;
  } else {
    return false;
  }
}

function drawMarker(button) {
  if (!markerExists('manual')) {
    button.addClass('btn-default-clicked');
    new L.Draw.Marker(map, drawControl.options.marker).enable();
  }
}

function autoDrawMarker(shape) {
  if (!markerExists('auto')) {
    geometry = [...shape.location.coordinates].reverse();
    shape = L.marker(geometry).addTo(map);
    near.markerDrawn = true;
    near.marker = shape;
    near.geo.geometry = shape.toGeoJSON();

    var latLngs = [ shape.getLatLng() ];
    var markerBounds = L.latLngBounds(latLngs);
    map.fitBounds(markerBounds);

  } else {
    near.nextShape = shape;
  }
}

function shapeDrawn(shape) {
  if (toolMode === 'near' || toolMode === 'nearSphere') {
    markerDrawn(shape);
  } else {
    polygonDrawn(shape);
  }

  const generatedQuery = queryBuilder(shape.layer.toGeoJSON());
  queryOutput(generatedQuery);
}

function markerDrawn(marker) {
  near.markerDrawn = true;
  near.marker = marker.layer;
  near.geo.geometry = marker.layer.toGeoJSON();
}

function polygonDrawn(polygon) {
  if (toolMode === 'geoIntersects') {
    geoIntersects.polygonDrawn = true;
    geoIntersects.shape = polygon.layer;
    geoIntersects.geo.geometry = polygon.layer.toGeoJSON();
  } else if (toolMode === 'geoWithin') {
    geoWithin.polygonDrawn = true;
    geoWithin.shape = polygon.layer;
    geoWithin.geo.geometry = polygon.layer.toGeoJSON();
  }
}

function autoDrawPolygon(shape) {
  if (!polygonExists('auto')) {
    geometry = [...shape.location.coordinates].reverse();
    shape = L.marker(geometry).addTo(map);

    if (toolMode === 'geoIntersects') {
      geoIntersects.polygonDrawn = true;
      geoIntersects.shape = shape;
      geoIntersects.geo.geometry = shape.toGeoJSON();
    } else if (toolMode === 'geoWithin') {
      geoWithin.polygonDrawn = true;
      geoWithin.shape = shape;
      geoWithin.geo.geometry = shape.toGeoJSON();
    }
  } else {
    if (toolMode === 'geoIntersects') {
      geoIntersects.nextShape = shape;
    } else if (toolMode === 'geoWithin') {
      geoWithin.nextShape = shape;
    }
  }
}

function redrawMarker() {
  near.markerDrawn = false;
  near.distance.maxDistance = '';
  near.distance.minDistance = '';
  near.distance.maxDistShape = '';
  near.distance.minDistShape = '';

  if (near.tool === 'manual') {
    drawMarker($('.draw-marker'));
  } else {
    autoDrawMarker(near.nextShape);
  }
}

function redrawPolygon() {

}

function polygonExists(mode) {

  if (toolMode === 'geoIntersects') {
    geoIntersects.tool = mode;
    if (geoIntersects.polygonDrawn) {
      $('#redraw-polygon-modal').show('toggle');
      return true;
    } else {
      return false;
    }
  } else if (toolMode === 'geoWithin') {
    geoWithin.tool = mode;
    if (geoWithin.polygonDrawn) {
      $('#redraw-polygon-modal').show('toggle');
      return true;
    } else {
      return false;
    }
  }
}

/* Draw near Maxdistance circle
   Note: mapbox plots lat and long in reverse so lat and long array is reversed
*/
function maxDistCircle(distance) {
  near.distance.maxDistance = distance;
  if (near.markerDrawn && distance !== '') {
    markerCoordinates = near.geo.geometry.geometry.coordinates;
    coordinates = [...markerCoordinates].reverse();

    const maxDistShape = near.distance.maxDistShape;

    if (maxDistShape !== '') {
      map.removeLayer(maxDistShape);
    }
    near.distance.maxDistShape = L.circle(coordinates, parseInt(distance * 1000, 10)).addTo(map);

    const generatedQuery = queryBuilder(near.geo.geometry, distance, near.distance.minDistance);
    queryOutput(generatedQuery);
  }
}

/* Draw near Mindistance circle
   Note: mapbox plots lat and long in reverse so lat and long array is reversed
*/

function minDistCircle(distance) {
  near.distance.minDistance = distance;

  if (near.markerDrawn && distance !== '') {
    markerCoordinates = near.geo.geometry.geometry.coordinates;
    coordinates = [...markerCoordinates].reverse();

    const minDistShape = near.distance.minDistShape;

    if (minDistShape !== '') {
      map.removeLayer(minDistShape);
    }

    near.distance.minDistShape = L.circle(coordinates, {
      radius: parseInt(distance * 1000, 10),
      color: '#ed8c7b',
      fillColor: '#ed8c7b',
      opacity: 1.0
    }).addTo(map);

    const generatedQuery = queryBuilder(near.geo.geometry, near.distance.maxDistance, distance);
    queryOutput(generatedQuery);
  }
}

function nearSphereToggle(toggle) {
  if (!toggle.is(':checked')) {
    toolMode = 'nearSphere';
  } else {
    toolMode = 'near';
  }
  const generatedQuery = queryBuilder(near.geo.geometry, near.distance.maxDistance,
    near.distance.minDistance);
  queryOutput(generatedQuery);
}

/* If a polygon has already been drawn validate if the user wants to redraw that shape */
/*
function polygonExists() {
  if (toolMode === 'geoIntersects' && geoIntersects.polygonDrawn === true) {
    return true;
  } else if (toolMode === 'geoWithin' && geoWithin.polygonDrawn === true) {
    return true;
  }
  return false;
}
*/


function polygonToolSelection(tool) {
  if (toolMode === 'geoIntersects') {
    if (geoIntersects.tool === 'auto') {
      autoDrawPolygon(geoIntersects.nextShape);
    } else if (geoIntersects.tool === 'manual') {
      manualToolSelection(tool);
    }
  } else if (toolMode === 'geoWithin') {
    if (geoWithin.tool === 'auto') {
      autoDrawPolygon(geoWithin.nextShape);
    } else if (geoWithin.tool === 'manual') {
      manualToolSelection(tool);
    }
  }
}

function manualToolSelection(tool) {
  toolId = tool[0].id;
  currentToolId = '';

  if (geoIntersects.polygonTool !== '') {
    currentToolId = geoIntersects.polygonTool[0].id;
  }

  if (currentToolId === '') {
    tool.addClass('btn-default-selected');
    geoIntersects.polygonTool = tool;
    drawPolygon(tool[0].id);
  } else if (currentToolId === toolId) {
    geoIntersects.polygonTool = tool;
    drawPolygon(tool[0].id);;
  } else {
    geoIntersects.polygonTool.removeClass('btn-default-selected');
    tool.addClass('btn-default-selected');
    geoIntersects.polygonTool = tool;
    drawPolygon(tool[0].id);
  }
}

/* Limit the amount of shapes that can be drawn to 1 and set tool */
function drawPolygon(shape) {

  if (currentDrawTool !== '') {
    currentDrawTool.disable();
  }

  if (shape === 'drawTool') currentDrawTool = new L.Draw.Polygon(map, drawControl.options.Polyline);
  if (shape === 'circleTool') currentDrawTool = new L.Draw.Circle(map, drawControl.options.Circle);
  if (shape === 'rectangleTool') currentDrawTool = new L.Draw.Rectangle(map, drawControl.options.Rectangle);

  currentDrawTool.enable();
}

function queryOutput(generateQuery) {
  generateQuery.then(function(query) {
    $('#generatedQuery').val(query.trim());
    $(`#${toolMode}`).find('.next').removeClass('btn-default-disabled');
  });
}

function findDocuments(searchParam) {
  let url = sessionStorage.getItem('url');
  let username = sessionStorage.getItem('username');
  let password = sessionStorage.getItem('password');
  let database = sessionStorage.getItem('database');
  let collection = sessionStorage.getItem('collection');

  return new Promise((resolve, reject) => {
    $.ajax({
      url: 'http://localhost:3000/api/mongoDB/findDocuments',
      type: 'get',
      data: {
        url: encodeURIComponent(url),
        username: username,
        password: password,
        database: database,
        collection: collection,
        searchParam: searchParam,
        toolMode: toolMode,
        limit: 3
      },
      success: function(response) {
        //Needs to be an array structure
        var suggestions = [];
        $.each(response, function(idx, document) {
          document.label = document.name;
          document.value = document._id;
          suggestions.push(document);
        });

        resolve(suggestions);
      },
      error: function(err) {
        //TODO display error in UI
        console.log(err);
        reject(err);
      }
    });
  });
}

function queryBuilder(geoJson, maxDistance, minDistance) {

  let collection = sessionStorage.getItem('collection');

  return new Promise((resolve, reject) => {
    $.ajax({
      url: 'http://localhost:3000/api/query',
      type: 'get',
      data: {
        collection: collection,
        queryType: toolMode,
        geometry: geoJson.geometry,
        maxDistance: maxDistance,
        minDistance: minDistance
      },
      dataType: 'json',
      success: function(response) {
        resolve(response.query);
      },
      error: function(err) {
        //TODO display error in UI
        console.log(err);
        reject(err);
      }
    });
  });
}
