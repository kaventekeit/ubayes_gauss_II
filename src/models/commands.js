const db = require('../config/db_config');

function get_all() {
  return db('commands');
}

function get_by_command_name(command_name) {
  return db('commands')
    .where({ command_name })
    .first();
}

function get_all_disabled() {
  return db('commands')
    .where({ enabled: 0 });
}

function add(commands) {
  return db('commands')
    .insert(commands);
}

function update(command_name,command) {
  return db('commands')
    .where({ command_name })
    .update(command);
}

module.exports = {
  get_all,
  get_by_command_name,
  get_all_disabled,
  add,
  update
}
