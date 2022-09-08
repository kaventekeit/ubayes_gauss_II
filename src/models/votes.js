const db = require('../config/db_config');

function get_all() {
  return db('votes');
}

module.exports = {
  get_all,
}
