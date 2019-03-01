var config = {};

config.defaultMapConnection = {
  url: 'mongodb://172.17.0.2:27017/',
  db: 'services',
  collection: 'geodb'
}
config.mapLimit = 1000;

module.exports = config;
