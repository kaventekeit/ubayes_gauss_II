const db = require('../config/db_config');

function get_all() {
  return db('candidates');
}

function insert(candidate) {
  return db('candidates')
    .insert(candidate);
}

module.exports = {
  get_all,
  insert
};
