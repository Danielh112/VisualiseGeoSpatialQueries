/* Selected Collection*/
let selectedRow;
let selectedCollection;

/* Selected Attribute*/
let selectedAttribute;
let selectedAttributeRow;

/* Transition in progress */
let animating = false;

/* Connection test in progress */
let retrievingCollectionList = false;
let connetionTest = false;

$(document).ready(function() {

  $('.prev').click(function() {
    prevTab($(this).closest('fieldset'));
  });

  $('.next').click(function() {
    nextTab($(this).closest('fieldset'));
  });

  $(document).on('keydown', '.form-input-empty', function(e) {
    $(this).removeClass('form-input-empty');
  });

  $('.test-connection').click(function() {
    testConnection();
  });

  $('.retrieveCollections').click(function() {
    displayModal('#conn-successful-modal');
    retrieveCollectionList();
  });

  $(document).on('hide.bs.modal', '#conn-successful-modal', function() {
    nextTab($(this).closest('fieldset'));
    retrieveCollectionList();
  });

  $('#no-geospatial-index').click(function() {
    sessionStorage.setItem('geospatialIndex', false);
    showMap();
  });

  $('#create-geospatial-index-btn').click(function() {
    createGeospatialIndexModal();
  });

  $('#create-geospatial-index').click(function() {
    if (!$(this).hasClass('btn-default-disabled')) {
      createGeospatialIndex();
    }
  });

  $('.display-map').click(function() {
    /* Only used in development environment,
    session storage not to be used in production */
    storeLoginCredentials();
    displayMap();
    sessionStorage.setItem('geospatialIndex', true);
  });

  /* Authentication: Set dropdown Text */
  $('.dropdown-menu a').click(function(event) {
    event.preventDefault();
    toggleAuthenticationSelection($(this).text());
  });

  /* Hightlight selected Collection */
  $('#collection-list').on('click', 'tbody tr', function() {
    const row = $(this).closest('tr');
    const collectionNames = row.find('td:nth-child(2)');
    toggleCollectionSelection(row, collectionNames);
  });

  /* Hightlight selected Collection */
  $('#attribute-list').on('click', 'tbody tr', function() {
    const row = $(this).closest('tr');
    const attributeNames = row.find('td:nth-child(2)');
    toggleAttributeSelection(row, attributeNames);
  });

  $('.close').click(function(event) {
    event.preventDefault();
    $(this).parent().addClass('hidden');
  });
});

/*
Navigate to the next fieldset
  - Locate current and next Fieldset
  - Animate Transition
      1. Scale current screen to 80%
      2. Bring new fieldset to view
      3. Set opacity of new screen to 1
*/

function prevTab(current_fs) {

  if (validateForm(current_fs) == true && !animating) {
    animating = true;

    prev_fs = current_fs.prev('fieldset');

    $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");

    //show the previous fieldset
    prev_fs.show();
    //hide the current fieldset with style
    current_fs.animate({
      opacity: 0
    }, {
      step: function(now, mx) {
        scale = 0.8 + (1 - now) * 0.2;
        left = ((1 - now) * 50) + "%";
        opacity = 1 - now;
        current_fs.css({
          'left': left,
        });
        prev_fs.css({
          'transform': 'scale(' + scale + ')',
          'opacity': opacity,
          'display': 'block',
        });

      },
      duration: 800,
      complete: function() {
        current_fs.hide();
        animating = false;
        prev_fs.css({
          'position': 'relative'
        });
      },
      //this comes from the custom easing plugin
      easing: 'easeInOutBack'
    });
  }
}


/*
Navigate to the next fieldset
  - Locate current and next Fieldset
  - Animate Transition
      1. Scale current screen to 80%
      2. Bring new fieldset to view
      3. Set opacity of new screen to 1
*/

function nextTab(current_fs) {

  if (validateForm(current_fs) == true && !animating) {
    animating = true;

    next_fs = current_fs.next('fieldset');
    next_fs.show();

    $('#progressbar li').eq($('fieldset').index(next_fs)).addClass('active');

    current_fs.animate({
      opacity: 0
    }, {
      step: function(now, mx) {
        scale = 1 - (1 - now) * 0.2;
        left = (now * 50) + '%';
        opacity = 1 - now;
        current_fs.css({
          'transform': 'scale(' + scale + ')',
          'position': 'absolute'
        });
        next_fs.css({
          'left': left,
          'opacity': opacity
        });
      },
      duration: 800,
      complete: function() {
        current_fs.hide();
        animating = false;
      },
      easing: 'easeInOutBack'
    });
  }
}

/* Validate fields are not empty */
function validateForm(fieldset) {
  let nextPage = true;
  $('#' + fieldset[0].id + ' input[type != button]').each(function(key, value) {
    if ($(this).val().length === 0 && $(this).is(':visible')) {
      $(this).addClass('form-input-empty');
      nextPage = false;
    }
  });
  return nextPage;
}

/*
Validate the MongoDB instance details are validateForm
*/
function testConnection() {

  if (!connetionTest) {
    connetionTest = true;

    showLoadingBtn('.test-connection');

    const url = $('#hostname').val() + ':' + $('#port ').val();
    const username = $('#username').val();
    const password = $('#password').val();
    const database = $('#database').val();

    $.ajax({
      url: '../api/mongoDB/test-connection',
      type: 'get',
      data: {
        url: encodeURIComponent(url),
        username: username,
        password: password,
        database: database
      },
      dataType: 'json',
      success: function(response) {
        displayModal('#conn-successful-modal');
        connetionTest = false;
        hideLoadingBtn('.test-connection', 'Test Connection');
      },
      error: function(err) {
        const errMsg = $.parseJSON(err.responseText);
        $('#conn-unsuccessful-content').html(errMsg['error']['message']);
        displayModal('#conn-unsuccessful-modal');
        connetionTest = false;
        hideLoadingBtn('.test-connection', 'Test Connection');
      }
    });
  }
}

/*
Retrieve users connection details and retrieve collections
associated with users DB
*/

function retrieveCollectionList() {
  if (!retrievingCollectionList) {
    retrievingCollectionList = true;
    const url = $('#hostname').val() + ':' + $('#port ').val();
    const username = $('#username').val();
    const password = $('#password').val();
    const database = $('#database').val();

    $.ajax({
      url: '../api/mongoDB/collection',
      type: 'get',
      data: {
        url: encodeURIComponent(url),
        username: username,
        password: password,
        database: database
      },
      dataType: 'json',
      success: function(response) {
        $.each(response, function(i, item) {
          $('#collection-list-items').append('<tr><td class="row-id">' + i + '</td><td class="row-collection-name">' + item.name + "</td></tr>");
        });
        retrievingCollectionList = false;
      },
      error: function(err) {
        console.log(err);
        retrievingCollectionList = false;
      }
    });
  }
}

function toggleAuthenticationSelection(selection) {
  $('#selected').text(selection);

  if (selection == 'None') {
    $('.authentication-details').slideUp(400);
  } else {
    $('.authentication-details').show();
  }
}

function toggleCollectionSelection(row, collectionNames) {
  $.each(collectionNames, function() {
    collectionName = $(this).text();
  });

  /* No Class selected */
  if (selectedCollection === undefined) {
    row.addClass('selected');
    selectedCollection = collectionName;
    selectedRow = row;
    $('#connect-to-collection').removeClass('btn-default-disabled');
    /* Class already selected */
  } else if (selectedCollection === collectionName) {
    row.removeClass('selected');
    selectedCollection = undefined;
    selectedRow = undefined;
    $('#connect-to-collection').addClass('btn-default-disabled');
    /* Selected New collection */
  } else {
    selectedRow.removeClass('selected');
    row.addClass('selected');
    selectedCollection = collectionName;
    selectedRow = row;
    $('#connect-to-collection').removeClass('btn-default-disabled');
  }
}

function toggleAttributeSelection(row, attributeNames) {
  attribute = row[0].innerText;

  /* No Class selected */
  if (selectedAttribute === undefined) {
    row.addClass('selected');
    selectedAttribute = attribute;
    selectedAttributeRow = row;
    $('#create-geospatial-index').removeClass('btn-default-disabled');
    /* Class already selected */
  } else if (selectedAttribute === attribute) {
    row.removeClass('selected');
    selectedAttribute = undefined;
    selectedAttributeRow = undefined;
    $('#create-geospatial-index').addClass('btn-default-disabled');
    /* Selected New collection */
  } else {
    selectedAttributeRow.removeClass('selected');
    row.addClass('selected');
    selectedAttribute = attribute;
    selectedAttributeRow = row;
    $('#create-geospatial-index').removeClass('btn-default-disabled');
  }
}

function displayModal(modalId) {
  $(modalId).modal('toggle');
}

/* Only used in development environment,
session storage should not to be used in production */
function storeLoginCredentials() {
  sessionStorage.setItem('url', $('#hostname').val() + ':' + $('#port ').val());
  sessionStorage.setItem('username', $('#username').val());
  sessionStorage.setItem('password', $('#password').val());
  sessionStorage.setItem('database', $('#database').val());
  sessionStorage.setItem('collection', selectedCollection);
  sessionStorage.removeItem('filterCollection');
}

function showLoadingBtn(cssClass) {
  $(cssClass).val('');
  $(cssClass).removeClass('btn-default-hover');
  $(cssClass).css('background-image', 'url(../images/loading.gif)');
}

function hideLoadingBtn(cssClass, val) {
  $(cssClass).val(val);
  $(cssClass).addClass('btn-default-hover');
  $(cssClass).css('background-image', '');
}

function showLoading(cssClass) {
  $(cssClass).css('background-image', 'url(../images/loading.gif)');
}

function hideLoading(cssClass, val) {
  $(cssClass).css('background-image', '');
}

function hideLoadingBtn(cssClass, val) {
  $(cssClass).val(val);
  $(cssClass).addClass('btn-default-hover');
  $(cssClass).css('background-image', '');
}

function validateGeospatialIndex() {
  let url = sessionStorage.getItem('url');
  let username = sessionStorage.getItem('username');
  let password = sessionStorage.getItem('password');
  let database = sessionStorage.getItem('database');
  let collection = sessionStorage.getItem('collection');

  return new Promise((resolve, reject) => {
    $.ajax({
      url: '../api/mongoDB/collection/index/geospatial',
      type: 'get',
      data: {
        url: encodeURIComponent(url),
        username: username,
        password: password,
        database: database,
        collection: collection
      },
      dataType: 'json',
      success: function(response) {
        resolve(response);
      },
      error: function(err) {
        //TODO display error in UI
        console.log(err);
        reject(err);
      }
    });
  });
}

async function createGeospatialIndexModal() {
  displayModal('#no-geospatial-index-modal');
  displayModal('#create-geospatial-index-modal');

  attributes = await populateAttributes();
}

function populateAttributes() {
  let url = sessionStorage.getItem('url');
  let username = sessionStorage.getItem('username');
  let password = sessionStorage.getItem('password');
  let database = sessionStorage.getItem('database');
  let collection = sessionStorage.getItem('collection');

  return new Promise((resolve, reject) => {
    $.ajax({
      url: '../api/mongoDB/collection/attributes',
      type: 'get',
      data: {
        url: encodeURIComponent(url),
        username: username,
        password: password,
        database: database,
        collection: collection
      },
      dataType: 'json',
      success: function(response) {
        $.each(response, function(i, item) {
          $('#collection-list-attributes').append('<tr><td class="row-id">' + item + '</td></tr>');
        });
      },
      error: function(err) {
        reject(err);
      }
    });
  });
}

function createGeospatialIndex() {
  let url = sessionStorage.getItem('url');
  let username = sessionStorage.getItem('username');
  let password = sessionStorage.getItem('password');
  let database = sessionStorage.getItem('database');
  let collection = sessionStorage.getItem('collection');

  return new Promise((resolve, reject) => {
    $.ajax({
      url: '../api/mongoDB/collection/index/geospatial',
      type: 'post',
      data: jQuery.param({
        url: encodeURIComponent(url),
        username: username,
        password: password,
        database: database,
        collection: collection,
        attribute: selectedAttribute,
      }),
      dataType: 'json',
      success: function(response) {
        showMap();
      },
      error: function(err) {
        $('#no-geospatial-data-modal > div').html(`<strong>Error</strong>: <br> ${err.responseJSON.error.message.slice(0,80)}...`);
        $('#no-geospatial-data-modal').removeClass('hidden');
        $('#no-geospatial-data-modal').show();
        $('#create-geospatial-index').addClass('btn-default-disabled');
      }
    });
  });
}

async function displayMap() {
  geospatialindex = await validateGeospatialIndex();
  if (geospatialindex['spatialIndex'] !== 'Not Found') {
    showMap();
  } else {
    displayModal('#no-geospatial-index-modal');
  }
}

function showMap() {
  //TODO Hard coded change
  window.location.href = 'map';
}
