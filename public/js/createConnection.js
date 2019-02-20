/* Selected Collection*/
let selectedRow;
let selectedCollection;

/* Transition in progress */
let animating = false;

/* Connection test in progress */
let connetionTest = false;

window.onload = function() {

  $('.next').click(function() {
    nextTab($(this).closest('fieldset'));
  });

  $(document).on('keydown', '.form-input-empty', function (e) {
    $(this).removeClass('form-input-empty');
  });

  $('.test-connection').click(function() {
    testConnection();
  });

  $('.retrieveCollections').click(function() {
    retrieveCollectionList();
  });

  $('.displayMap').click(function() {
    /* Only used in development environment,
    session storage not to be used in production */
    storeLoginCredentials();

    displayMap();
  });

  /* Authentication: Set dropdown Text */
  $('.dropdown-menu a').click(function(event) {
    event.preventDefault();
    toggleAuthenticationSelection($(this).text());
  });

  /* Hightlight selected Collection */
  $('#collection-list').on('click', 'tbody tr', function() {
    const row = $(this).closest('tr');
    const collectionnames = row.find('td:nth-child(2)');
    toggleCollectionSelection(row, collectionnames);
  });
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

    $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");

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

    showLoading('.test-connection');

    const url = $('#hostname').val() + ':' + $('#port ').val();
    const username = $('#username').val();
    const password = $('#password').val();
    const database = $('#database').val();

    $.ajax({
      url: 'http://localhost:3000/api/mongoDB/testConnection',
      type: 'get',
      data: {
        url: encodeURIComponent(url),
        username: username,
        password: password,
      },
      dataType: 'json',
      success: function(response) {
        $('#conn-successful-modal').modal('toggle');
        connetionTest = false;
        hideLoading('.test-connection', 'Test Connection');
      },
      error: function(err) {
        const errMsg = $.parseJSON(err.responseText);
        $('#conn-unsuccessful-content').append(errMsg['error']['message']);
        $('#conn-unsuccessful-modal').modal('toggle');
        connetionTest = false;
        hideLoading('.test-connection', 'Test Connection');
      }
    });
  }
}

/*
Retrieve users connection details and retrieve collections
associated with users DB
*/

function retrieveCollectionList() {

  const url = $('#hostname').val() + ':' + $('#port ').val();
  const username = $('#username').val();
  const password = $('#password').val();
  const database = $('#database').val();

  $.ajax({
    url: 'http://localhost:3000/api/mongoDB/collection',
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
        $('#collection-list-items').append('<tr><td class="row-id">' + i + '</td><td class="row-collection-name">' + item.name + '</td></tr>');
      });
    },
    error: function(err) {
      console.log(err);
    }
  });
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
    /* Class already selected */
  } else if (selectedCollection === collectionName) {
    row.removeClass('selected');
    selectedCollection = undefined;
    selectedRow = undefined;
    /* Selected New collection */
  } else {
    selectedRow.removeClass('selected');
    row.addClass('selected');
    selectedCollection = collectionName;
    selectedRow = row;
  }
}

/* Only used in development environment,
session storage should not to be used in production */
function storeLoginCredentials() {
  sessionStorage.setItem('url', $('#hostname').val() + ':' + $('#port ').val());
  sessionStorage.setItem('username', $('#username').val());
  sessionStorage.setItem('password', $('#password').val());
  sessionStorage.setItem('database', $('#database').val());
  sessionStorage.setItem('collection', selectedCollection);
}

function showLoading(cssClass) {
  $(cssClass).val('');
  $(cssClass).removeClass('btn-default-hover');
  $(cssClass).css('background-image', 'url(../images/loading.gif)');
}

function hideLoading(cssClass, val) {
  $(cssClass).val(val);
  $(cssClass).addClass('btn-default-hover');
  $(cssClass).css('background-image', '');
}

function displayMap() {
  //TODO Hard coded change
  window.location.href = "http://localhost:3000/map";
}
