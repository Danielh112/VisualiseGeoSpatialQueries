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
  });
});

/* Expand and collapse panel */
function togglePanel(panel) {
  if (!panel.hasClass('panel-collapsed')) {
    panel.parents('.panel').find('.panel-body').slideUp();
    panel.addClass('panel-collapsed');
    panel.find('i').removeClass('fa-minus').addClass('fa-plus');
    fullPanelCollapse(panel);
    firstTab(panel);
  } else {
    panel.parents('.panel').find('.panel-body').slideDown();
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
  }
}

/* Hide info content
   Display new query content */
function nextTab(element) {
  const panelBody = $(element).closest('.panel-body');
  const nextPanelBody = panelBody.next();

  panelBody.addClass('hidden');
  nextPanelBody.removeClass('hidden');

}

function firstTab(element) {
  const panelBody = $(element).parents('.panel').find('.panel-body')
  const firstPanel = panelBody.first();
  panelBody.addClass('hidden');
  //firstPanel.parent().parent().find('.panel-body:first').removeClass('hidden');
}
