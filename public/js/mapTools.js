/* Specifies the tool mode, near, intersects, within */
let tool = {
  mode: '',
};

const near = {
  markerDrawn: false,
  marker: '',
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

const within = {
  polygonDrawn: false
}

const intersects = {
  polygonDrawn: false
}

$(document).ready(function() {
  $(document).on('click', '.panel-heading', function() {
    togglePanel($(this));
  })

  $('#tabs li').click(function(event) {
    event.preventDefault();
    changeTab($(this));
  });

  $('.createQuery').click(function() {
    fullPanelExpand($(this));
    nextTab($(this));
    setToolMode($(this));
    restorePanel();
  });

  $('.draw-marker').click(function() {
    drawMarker($(this));
  });

  $('.next').click(function() {
    nextTab($(this));
  });

  $('.prev').click(function() {
    prevTab($(this));
  });

  $("#maximumDistInput").on("change paste keyup", function() {
    maxDistCircle($(this).val());
  });

  $("#minimumDistInput").on("change paste keyup", function() {
    minDistCircle($(this).val());
  });

  $('#nearSphereToggle').mousedown(function() {
    nearSphereToggle($(this));
  });

  /* Marker Drawn */
  map.on('draw:created', function(element) {
    markerDrawn(element);
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

    $(`#${tool.mode}`).find('.next').addClass('btn-default-disabled');

    resetPanel();
  }
}

/* Reset map (remove all drawn shapes),
   Reset all near variables
   Reset marker drawn button and nearsphere toggle
*/

function resetPanel() {
  if (tool.mode === 'near' || tool.mode === 'nearSphere') {
    if (near.marker !== '') {
      map.removeLayer(near.marker);
    }
    if (near.distance.maxDistShape !== '') {
      map.removeLayer(near.distance.maxDistShape);
    }
    if (near.distance.minDistShape !== '') {
      map.removeLayer(near.distance.minDistShape);
    }
  }
}

function restorePanel() {
  if (tool.mode === 'near' || tool.mode === 'nearSphere') {
    if (near.marker !== '') {
      map.addLayer(near.marker);
    }
    if (near.distance.maxDistShape !== '') {
      map.addLayer(near.distance.maxDistShape);
    }
    if (near.distance.minDistShape !== '') {
      map.addLayer(near.distance.minDistShape);
    }
    if(near.marker !== '') {
      const generatedQuery = queryBuilder(near.geo.geometry, near.distance.maxDistance, near.distance.minDistance);
      queryOutput(generatedQuery);
    }
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

    $(`#${tool.mode}`).find('.next').addClass('btn-default-disabled');
  }
}

/* Set the current mode we are in e.g. near, intersects, within */
function setToolMode(element) {
  tool.mode = $(element).closest('.tool-section').attr('id');
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
function drawMarker(button) {
  if (!near.markerDrawn) {
    button.addClass('btn-default-clicked');
    new L.Draw.Marker(map, drawControl.options.marker).enable();
    near.markerDrawn = true;
  }
}

function markerDrawn(marker) {
  near.marker = marker.layer;
  near.geo.geometry = marker.layer.toGeoJSON();
  const generatedQuery = queryBuilder(near.geo.geometry);
  queryOutput(generatedQuery);

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
    near.distance.maxDistShape = L.circle(coordinates, parseInt(distance, 10)).addTo(map);

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
      radius: parseInt(distance, 10),
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
    tool.mode = 'nearSphere';
  } else {
    tool.mode = 'near';
  }
  const generatedQuery = queryBuilder(near.geo.geometry, near.distance.maxDistance,
    near.distance.minDistance);
  queryOutput(generatedQuery);
}

function queryOutput(generateQuery) {
  generateQuery.then(function(query) {
    $('#generatedQuery').val(query);
    $(`#${tool.mode}`).find('.next').removeClass('btn-default-disabled');
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
        queryType: tool.mode,
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
