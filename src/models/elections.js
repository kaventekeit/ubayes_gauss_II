const db = require('../config/db_config');
const { date_to_epoch_ms } = require('../utils/basic_utils');

function get_all() {
  return db('elections');
}

function get_outstanding() {
  return db('elections')
    .then(all => {
      return all.filter(x => {
        let now_date = new Date();
        now = date_to_epoch_ms(now_date);
        if (now >= x.date) {
          return true;
        } else {
          return false;
        }
    });
  });
}

function insert(election) {
  return db('elections')
    .insert(election);
}

function remove_by_id(election_id) {
  return db('elections')
    .where({ id: election_id })
    .del();
}

module.exports = {
  get_all,
  get_outstanding,
  insert,
  remove_by_id
};
