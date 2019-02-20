$(document).ready(function() {
  $(document).on('click', '.panel-heading', function() {
    togglePanel($(this));
  })

  $('#tabs li').click(function(event) {
    event.preventDefault();
    changeTab($(this));
  });

  $('#createNearQuery').click(function() {
    //Show tab
  });

  $('#createIntersectsQuery').click(function() {
    //Show tab
  });

  $('#createNearQuery').click(function() {
    //Show tab
  });
});

/* Expand and collapse panel */
function togglePanel(panel) {
  if (!panel.hasClass('panel-collapsed')) {
    panel.parents('.panel').find('.panel-body').slideUp();
    panel.addClass('panel-collapsed');
    panel.find('i').removeClass('fa-minus').addClass('fa-plus');
  } else {
    panel.parents('.panel').find('.panel-body').slideDown();
    panel.removeClass('panel-collapsed');
    panel.find('i').removeClass('fa-plus').addClass('fa-minus');
  }
}


/* Change Tab (Tools/Filters) */
function changeTab(tab) {
  var t = $(tab).attr('id');
  if(!$(tab).hasClass('active')) {
    $('#tabs li').removeClass('active');
    $(tab).addClass('active');

    $('#'+ t + '-container').removeClass('hidden');
    $('.side-panel').hide();
    $('#'+ t + '-container').show();
 }
}
