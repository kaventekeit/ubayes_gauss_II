const db = require('../config/db_config');

function get_all() {
  return db('audit_log_entries');
}

function insert(audit_log_entry) {
  return db('audit_log_entries')
    .insert(audit_log_entry);
}

function remove_by_id(audit_log_entry_id) {
  return db('audit_log_entries')
    .where({ id: audit_log_entry_id })
    .del();
}

module.exports = {
  get_all,
  insert,
  remove_by_id
};
