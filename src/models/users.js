const db = require('../config/db_config');

function get_all() {
  return db('users');
}

function get_by_id(user_id) {
  return db('users')
    .where({ user_id })
    .first();
}

async function unpicky_get_user(user_identifier) {
  let user;
  user = await db('users')
    .where({ user_id: user_identifier })
    .first();
  if (user) {
    return db('users')
      .where({ user_id: user_identifier })
      .first();
  }
  user = await db('users')
    .where({ username: user_identifier })
    .first();
  if (user) {
    return db('users')
      .where({ username: user_identifier })
      .first();
  }
  user = await db('users')
    .where({ discriminator: user_identifier })
    .first();
  if (user) {
    return db('users')
      .where({ discriminator: user_identifier })
      .first();
  }
  user = await db('users')
    .where({ display_name: user_identifier })
    .first();
  if (user) {
    return db('users')
      .where({ display_name: user_identifier })
      .first();
  }
  return db('users')
    .where({ full_username: user_identifier })
    .first();
}

function add(users) {
  return db('users')
    .insert(users);
}

function update(user_id,user) {
  return db('users')
    .where({ user_id })
    .update(user);
}

function remove_by_id(user_id) {
  return db('users')
    .where({ user_id })
    .del();
}

module.exports = {
  get_all,
  get_by_id,
  add,
  update,
  unpicky_get_user,
  remove_by_id
};
