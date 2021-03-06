let queryModification = false;

$(document).ready(function() {

  $('#generatedQuery').keyup(function() {
    if (!queryModification && $('#execute-query-container').is(":hidden")) {
      borderAnimation();
      queryModification = true;
    }
  });

  $('.execute-query').click(function() {
    if (queryModification) {
      queryModification = false;
      executeQuery($('#generatedQuery').text());
    }
  });
});

/* Run the generated MongoDB query and retrieve a subset of the results */
function executeQuery(queryValue) {

  if (queryValue !== '') {
    let url = sessionStorage.getItem('url');
    let username = sessionStorage.getItem('username');
    let password = sessionStorage.getItem('password');
    let database = sessionStorage.getItem('database');
    let collection = sessionStorage.getItem('collection');

    let generatedQuery = queryValue.substring(queryValue.indexOf('(') + 1, queryValue.indexOf(")"));
    let filterCollection = sessionStorage.getItem('filterCollection');

    const queryLimit = 5;

    return new Promise((resolve, reject) => {
      $.ajax({
        url: '../api/mongoDB/execute-query',
        type: 'get',
        data: {
          url: encodeURIComponent(url),
          username: username,
          password: password,
          database: database,
          collection: collection,
          query: generatedQuery,
          filterCollection: filterCollection,
          limit: queryLimit
        },
        dataType: 'json',
        success: function(response) {
          displayQueryResults(response);
        },
        error: function(err) {
          if (err.responseJSON.error !== undefined) {
            displayInvalidResults(err.responseJSON.error.message);
          } else {
            displayInvalidResults(err.responseJSON.errmsg);
          }
        }
      });
    });
  }
}

/* Output query results in the User interface */
function displayQueryResults(results) {

  if ($('#execute-query-container').is(":hidden")) {
    borderAnimation();
  }

  $('#execute-query-container').html('');

  results.forEach(function(record) {
    recordStr = JSON.stringify(record);
    if (results !== '') {
      $('#execute-query-container').append(`<li> ${recordStr} </li>`);
    }
  });
}

/* For invalid results display this in the UI */
function displayInvalidResults(results) {
  $('#execute-query-container').html('');
  $('#execute-query-container').append(`<li> ${results} </li>`);
}

function borderAnimation() {
  const rollingBorder = $('#execute-query').rollingBorder({
    padding: 0.5,
    color: "#4CA84A",
    width: 0.5,
    length: "100%",
  });
  
  setTimeout(function(){ rollingBorder.destroy() }, 500);
}
