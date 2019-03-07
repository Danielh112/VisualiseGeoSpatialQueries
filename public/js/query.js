$(function() {
  $('.execute-query').click(function(event) {
    executeQuery();
  });
});


function executeQuery() {
  let url = sessionStorage.getItem('url');
  let username = sessionStorage.getItem('username');
  let password = sessionStorage.getItem('password');
  let database = sessionStorage.getItem('database');
  let collection = sessionStorage.getItem('collection');

  let queryValue = $('#generatedQuery').text();
  let generatedQuery = queryValue.substring(queryValue.indexOf('(')+1,queryValue.indexOf(")"));
  let filterCollection = sessionStorage.getItem('filterCollection');

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
        limit: 5
      },
      dataType: 'json',
      success: function(response) {
        displayQueryResults(response);
      },
      error: function(err) {
        //TODO display error in UI
        console.log(err);
        reject(err);
      }
    });
  });
}


function displayQueryResults(results) {
  $('#execute-query-container').html('');

  results.forEach(function(record) {
    recordStr = JSON.stringify(record);
    if (results !== '') {
      $('#execute-query-container').append(`<li> ${recordStr} </li>`);
    }
  });
}
