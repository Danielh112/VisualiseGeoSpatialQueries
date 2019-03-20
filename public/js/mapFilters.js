let filtersList = {};
let totalFilters = 0;

$(document).ready(function() {
  initaliseFilters();

  $(document).on('click', '#apply-filters', function() {
    applyFilters();
  });
});

async function initaliseFilters() {
  loadFilters();
  attributes = await populateAttributes();
  displayAttributes(attributes);
  displayFilterCount();
}

/* - Get inputted filters by user
   - Store filters
   - Redraw map based on filters
*/
async function applyFilters() {
  filtersList = {};
  $('.filter-input').each(function() {
    if ($(this).val()) {
      filtersList[$(this).attr('id')] = $(this).val();
    }
  });
  //$('#filter-applied').toggle();
  storeFilters(filtersList);
  displayFilterCount();
  redrawMap(true);
}

function storeFilters() {
  sessionStorage.setItem('filterCollection', JSON.stringify(filtersList));
  totalFilters = Object.keys(filtersList).length;
}

function loadFilters() {
  filtersList = JSON.parse(sessionStorage.getItem('filterCollection'));
  if (filtersList !== null) {
    totalFilters = Object.keys(filtersList).length;
  }
}

function displayFilterCount() {
  $('#filters-indicator').show().text(totalFilters);
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

function displayAttributes(attributes) {
  attributes.forEach(function(attribute) {
    if (filtersList !== null) {
      attrValue = filtersList[attribute] || '';
    } else {
      attrValue = '';
    }

    if (attrValue !== '') {
      $('#collection-list-items').append(
        `<tr>
          <td class="row-collection-name no-padding">
            <div class="panel transparent-panel no-margin">
              <div class="panel-heading clickable">
                <div class="panel-title"> ${attribute}
                  <span class="pull-right"><i class="fas fa-minus"></i></span>
                </div>
              </div>
              <div class="panel-body">
                <input type="text" id="${attribute}" class="find-documents form-control form-input filter-input" placeholder="Filter on..." value="${attrValue}">
              </div>
            </td></tr>`);
    } else {
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
                <input type="text" id="${attribute}" class="find-documents form-control form-input filter-input" placeholder="Filter on..." value="${attrValue}">
              </div>
            </td></tr>`);
    }


    $('#collection-list-items').find('input[type=text]:last').autocomplete({
      source: function(request, response) {
        $.when(
          findDocuments({[`${$(this.element).prop('id')}`]: `${$(this)[0].term}`}, 'filters')
        ).then(function(suggestions) {
          response(suggestions);
        })
      },
      minLength: 0,
      focus: function(event, ui) {
        ui.item.value = ui.item.label;
      },
      select: function(event, ui) {
        ui.item.value = ui.item.label;
      }
    });
  });
}
