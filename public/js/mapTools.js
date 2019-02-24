/* Specifies the tool mode, near, intersects, within */
let toolMode;

const near = {
  markerDrawn: false
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

  map.on('draw:created', function(element) {
      const geometry = element.layer.toGeoJSON();
      const generateQuery = queryBuilder(geometry);
      generateQuery.then(function(query) {
        $('#generatedQuery').val(query);
        $(`#${toolMode}`).find('.next').removeClass('btn-default-disabled');
      });
  });
});

/* Expand and collapse panel */
function togglePanel(panel) {
  if (!panel.hasClass('panel-collapsed')) {
    fullPanelCollapse(panel);
    panel.closest('.panel').find('.panel-body').slideUp(); // TODO :first
    panel.addClass('panel-collapsed');
    panel.find('i').removeClass('fa-minus').addClass('fa-plus');
  } else {
    panel.closest('.panel').find('.panel-body').slideDown();
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

/* Collapse full panel (return to info panels) */
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
  }
}

/* Return to the previous page maintaining values*/
function prevTab(element) {

}

/* Hide info content
   Display new query content
   Disable the next button in the next panel */
function nextTab(element) {
  const panelBody = $(element).closest('.panel-body');
  const nextPanelBody = panelBody.next();

  panelBody.addClass('hidden');
  nextPanelBody.removeClass('hidden');

  $(`#${toolMode}`).find('.next').addClass('btn-default-disabled');

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
function drawMarker(button) {
  if (!near.markerDrawn) {
    button.addClass('btn-default-clicked');
    new L.Draw.Marker(map, drawControl.options.marker).enable();
    near.markerDrawn = true;
  }
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
