const db = require('../config/db_config');

function get_all() {
  return db('candidates');
}

function get_by_specs(role_name,candidate_name) {
	return db('candidates')
		.where({ role_name,
						 candidate_name }); 
}

function get_all_of_election(role_name) {
	return db('candidates')
		.where({ role_name });
}

function insert(candidate) {
  return db('candidates')
    .insert(candidate);
}

function update(role_name, candidate_name, candidate) {
	return db('candidates')
		.where({ role_name,
						 candidate_name })
		.update(candidate);
}

function remove_by_id(candidate_id) {
	return db('candidates')
		.where({ id: candidate_id })
		.del();
}

module.exports = {
  get_all,
	get_all_of_election,
	get_by_specs,
  insert,
	update,
	remove_by_id
};
