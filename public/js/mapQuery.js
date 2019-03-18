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
        url: 'http://localhost:3000/api/mongoDB/executeQuery',
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
          displayQueryResults(err.responseJSON.errmsg);
        }
      });
    });
  }
}


function displayQueryResults(results) {
  $('#execute-query-container').html('');

  if (typeof results !== 'string') {
    results.forEach(function(record) {
      recordStr = JSON.stringify(record);
      if (results !== '') {
        $('#execute-query-container').append(`<li> ${recordStr} </li>`);
      }
    });
  } else {
    $('#execute-query-container').append(`<li> ${results} </li>`);
  }
}
