let filtersList = {};
let totalFilters = 0;

$(document).ready(function() {
  initaliseFilters();

  $(document).on('click', '#apply-filters', function() {
    applyFilters();
  });
});

/* Load in set map filters */
async function initaliseFilters() {
  loadFilters();
  attributes = await populateAttributes();
  displayAttributes(attributes);
  displayFilterCount();
  const generatedQuery = queryBuilderMode();
  nlpQueryBuilder();
  queryOutput(generatedQuery);
}

/* Display a list of attributes which the user can filter on */
async function getFilterList() {
  filtersList = {};
  for (let filter of $('.filter-input')) {
    if (filter.value != '') {
      let attrType = await getAttributeType(filter.id);
      filtersList[filter.id] = filter.value;

      /*
        Future Work here Validating filter type

        if (attrType.attributeType === 'string') {
          filtersList[filter.id] = filter.value;
        }
      */
    }
  }
}

/* - Get inputted filters by user
   - Store filters
   - Redraw map based on filters
*/
async function applyFilters() {

  await getFilterList();
  //$('#filter-applied').toggle();
  storeFilters();
  displayFilterCount();
  redrawMap(true);
  const generatedQuery = queryBuilderMode();
  queryOutput(generatedQuery);
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
        resolve(response);
      },
      error: function(err) {
        console.log(err);
        reject(err);
      }
    });
  });
}

/* Retrieve the MongoDB document attribute data type */
function getAttributeType(attribute) {
  let url = sessionStorage.getItem('url');
  let username = sessionStorage.getItem('username');
  let password = sessionStorage.getItem('password');
  let database = sessionStorage.getItem('database');
  let collection = sessionStorage.getItem('collection');

  return new Promise((resolve, reject) => {
    $.ajax({
      url: '../api/mongoDB/collection/attribute/type',
      type: 'get',
      data: {
        url: encodeURIComponent(url),
        username: username,
        password: password,
        database: database,
        collection: collection,
        attribute: attribute
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


/* Function used to display a list of attributes which can be used to filter in the UI */
function displayAttributes(attributes) {
  attributes.forEach(function(attribute) {
    if (filtersList !== null) {
      attrValue = filtersList[attribute] || '';
    } else {
      attrValue = '';
    }

    if (attrValue !== '') {
      $('#collection-attribute-items').append(
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
      $('#collection-attribute-items').append(
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


    $('#collection-attribute-items').find('input[type=text]:last').autocomplete({
      source: function(request, response) {
        $.when(
          findDocuments({
            [`${$(this.element).prop('id')}`]: `${$(this)[0].term}`
          }, 'filters')
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
