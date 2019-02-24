$(document).ready(function() {
  populateAttributes();
});

function populateAttributes() {
  let url = sessionStorage.getItem('url');
  let username = sessionStorage.getItem('username');
  let password = sessionStorage.getItem('password');
  let database = sessionStorage.getItem('database');
  let collection = sessionStorage.getItem('collection');

  return new Promise((resolve, reject) => {
    $.ajax({
      url: 'http://localhost:3000/api/mongoDB/collection/attributes',
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
        displayAttributes(response);
      },
      error: function(err) {
        //TODO display error in UI
        console.log(err);
        reject(err);
      }
    });
  });
}

function displayAttributes(attributes) {
  attributes.forEach(function(attribute) {
    $('#collectionAttributes').append(
      `<div class="panel tool-section filter-section">
        <div class="panel-heading clickable panel-collapsed">
          <h3 class="panel-title"> ${attribute}
            <span class="pull-right"><i class="fas fa-plus"></i></span>
          </h3>
        </div>
        <div class="panel-body">
          <input type="text" class="form-control form-input" placeholder="Filter on..." value="">
        </div>
      </div>`);
  });
}
