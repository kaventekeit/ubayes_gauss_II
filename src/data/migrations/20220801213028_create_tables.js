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
    tbl.varchar('display_name')
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
      .inTable('users')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
  })
  .createTable('elections', tbl => {
    tbl.varchar('role_name')
			.primary();
    tbl.varchar('how_many_of_these_are_we_electing')
      .notNullable();
    tbl.integer('start_datetime')
      .notNullable();
    tbl.integer('end_datetime')
      .notNullable();
    tbl.integer('begun') // FOR STARTING ONLY ONCE [ WHAT DID YOU MEAN PAST SELF ]
      .notNullable();
		tbl.integer('hash')
			.notNullable();
  })
  .createTable('candidates', tbl => {
		tbl.increments();
    tbl.varchar('role_name')
      .references('role_name')
      .inTable('elections')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    tbl.varchar('candidate_name'); // the same candidate may be up for multiple elections
		tbl.integer('votes')
			.notNullable()
			.defaultTo(0);
  })
  .createTable('has_voted', tbl => {
    tbl.integer('user_id');
    tbl.varchar('election_id')
      .references('role_name')
      .inTable('elections')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    tbl.integer('has_voted')
      .notNullable()
      .defaultTo(0);
    tbl.primary(['user_id', 'election_id']);
  })
	.createTable('audit_log_entries', tbl => {
		tbl.increments();
		tbl.varchar('election_id')
			.references('role_name')
			.inTable('elections')
			.onUpdate('CASCADE')
			.onDelete('CASCADE');
		tbl.integer('previous_hash');
		tbl.varchar('plaintext');
		tbl.integer('new_hash')
			.notNullable();
	})
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('audit_log_entries')
		.dropTableIfExists('has_voted')
    .dropTableIfExists('candidates')
    .dropTableIfExists('elections')
    .dropTableIfExists('remindmes')
    .dropTableIfExists('users')
    .dropTableIfExists('roles')
    .dropTableIfExists('commands')
    .dropTableIfExists('welcome_config');
};
