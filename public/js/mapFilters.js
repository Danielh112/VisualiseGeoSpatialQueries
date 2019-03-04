const filtersList = {};

$(document).ready(function() {
  populateAttributes();

  $(document).on('click', '#apply-filters', function() {
    applyFilters();
  });
});

/* - Get inputted filters by user
   - Store filters
   - Redraw map based on filters
*/
async function applyFilters() {
  $('.filter-input').each(function() {
    if ($(this).val()) {
      filtersList[$(this).attr('id')] = $(this).val();
    }
  });
  // TODO Display Modal with what filters are going to be applied
  sessionStorage.setItem('filterCollection', JSON.stringify(filtersList));
  redrawMap();
}

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
    $('#collection-list-items').append(
      `<tr>
        <td class="row-collection-name no-padding">
          <div class="panel filter-section transparent-panel no-margin">
            <div class="panel-heading clickable panel-collapsed">
              <div class="panel-title"> ${attribute}
                <span class="pull-right"><i class="fas fa-plus"></i></span>
              </div>
            </div>
            <div class="panel-body">
              <input type="text" id="${attribute}" class="form-control form-input filter-input" placeholder="Filter on..." value="">
            </div>
          </td></tr>`);
  });
}
