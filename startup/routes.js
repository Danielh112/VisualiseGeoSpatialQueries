const express = require('express');
const index = require('../routes/index');
const map = require('../routes/map');
 var path = require('path');
//const error = require('../middleware/error');

module.exports = function(app) {
  app.use(express.static(path.join(__dirname, '../public')));
  app.use('/', index);
  app.use('/api/map', map);
  app.set('view engine', 'ejs');
  app.get('/', function (req, res) {
	res.render('index');
  })
  //app.use(error);
}