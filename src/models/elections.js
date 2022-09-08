const db = require('../config/db_config');

function get_all() {
  return db('elections');
}

module.exports = {
  get_all,
};
