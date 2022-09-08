exports.up = function(knex) {
  return knex.schema.createTable('welcome_config', tbl => {
    tbl.varchar('welcome_channel');
    tbl.varchar('welcome_message');
  })
  .createTable('commands', tbl => {
    tbl.varchar('command_name')
      .primary();
    tbl.integer('enabled')
      .notNullable()
      .defaultTo(1);
  })
  .createTable('roles', tbl => {
    tbl.varchar('role_name')
      .primary();
    tbl.integer('admin_enabled')
      .defaultTo(0);
  })
  .createTable('users', tbl => {
    tbl.varchar('user_id')
      .primary()
      .notNullable();
    tbl.varchar('username')
      .notNullable();
    tbl.varchar('discriminator')
      .notNullable();
    tbl.varchar('full_username')
      .notNullable();
    tbl.integer('dms_enabled')
      .notNullable()
      .defaultTo(1);
    tbl.integer('utc_offset');
    tbl.integer('admin');
    tbl.integer('reputation')
      .defaultTo(0);
  })
  .createTable('remindmes', tbl => {
    tbl.increments();
    tbl.integer('date')
      .notNullable();
    tbl.varchar('message')
      .notNullable();
    tbl.varchar('user_id')
      .notNullable()
      .references('user_id')
      .inTable('users');
  })
  .createTable('elections', tbl => {
    tbl.increments();
    tbl.varchar('role_name')
      .notNullable();
    tbl.varchar('how_many_of_these_are_we_electing')
      .notNullable();
    tbl.integer('start_datetime')
      .notNullable();
    tbl.integer('end_datetime')
      .notNullable();
  })
  .createTable('candidates', tbl => {
    tbl.varchar('candidate_name'); // the same candidate may be up for multiple elections
    tbl.integer('election_id')
      .references('id')
      .inTable('elections');
  })
  .createTable('votes', tbl => {
    tbl.varchar('election')
      .references('id')
      .inTable('elections');
    tbl.integer('choice')
      .notNullable();
  })
  .createTable('has_voted', tbl => {
    tbl.integer('user_id');
    tbl.integer('election_id')
      .references('id')
      .inTable('elections');
    tbl.integer('has_voted')
      .notNullable()
      .defaultTo(0);
    tbl.primary(['user_id', 'election_id']);
  })
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('votes')
    .dropTableIfExists('elections')
    .dropTableIfExists('remindmes')
    .dropTableIfExists('users')
    .dropTableIfExists('roles')
    .dropTableIfExists('commands')
    .dropTableIfExists('welcome_config');
};
