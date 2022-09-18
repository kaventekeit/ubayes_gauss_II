const db = require('../config/db_config');
const { date_to_epoch_ms } = require('../utils/basic_utils');

function get_all() {
  return db('remindmes');
}

function get_outstanding() {
  return db('remindmes')
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

function insert(remindme) {
  return db('remindmes')
    .insert(remindme);
}

function remove_by_id(remindme_id) {
  return db('remindmes')
    .where({ id: remindme_id })
    .del();
}

module.exports = {
  get_all,
  get_outstanding,
  insert,
  remove_by_id
}
