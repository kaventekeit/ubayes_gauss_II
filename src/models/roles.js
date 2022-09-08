const db = require('../config/db_config');

function get_all() {
  return db('roles');
}

function get_by_role_name(role_name) {
  return db('roles')
    .where({ role_name })
    .first();
}

function get_all_admin_enabled() {
  return db('roles')
    .where('admin_enabled',1);
}

function get_all_admin_disabled() {
  return db('roles')
    .where('admin_enabled',0);
}

function add(role) {
  return db('roles')
    .insert(role);
}

function update(role_name,role) {
  return db('roles')
    .where({ role_name })
    .update(role);
}

module.exports = {
  get_all,
  get_by_role_name,
  get_all_admin_disabled,
  get_all_admin_enabled,
  add,
  update
}
