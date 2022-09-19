const db = require('../config/db_config');
const { date_to_epoch_ms } = require('../utils/basic_utils');

function get_all() {
  return db('elections');
}

function get_live() {
  return db('elections')
    .then(all => {
      return all.filter(x => {
        let now_date = new Date();
        now = date_to_epoch_ms(now_date);
        if (now >= x.start_datetime) {
          return true;
        } else {
          return false;
        }
    });
  });
}

function get_dead() {
  return db('elections')
    .then(all => {
      return all.filter(x => {
        let now_date = new Date();
        now = date_to_epoch_ms(now_date); 
        if (now >= x.end_datetime) {
          return true;
        } else {
          return false;
        }
      })
    });
}

function insert(election) {
  return db('elections')
    .insert(election);
}

function update(election_id, election) {
  return db('elections')
    .where({ id: election_id })
    .update(election);
}

function remove_by_id(election_id) {
  return db('elections')
    .where({ id: election_id })
    .del();
}

module.exports = {
  get_all,
  get_live,
  get_dead,
  insert,
  update,
  remove_by_id
};
