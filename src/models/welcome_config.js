const db = require('../config/db_config');

function get() {
  return db('welcome_config');
}

function change(new_config) {
  return db('welcome_config')
    .del()                      /* should delete all rows in table */
    .then(feedback => {
      return db('welcome_config')
        .insert(new_config);
    })
}

module.exports = {
  get,
  change
}
