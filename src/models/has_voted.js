const db = require('../config/db_config');

function get_all() {
  return db('has_voted');
}

function insert(votingness_havation) {
  return db('has_voted')
    .insert(votingness_havation);
}

function update(votingness_havation_id, votingness_havation) {
	return db('has_voted')
		.where({ id: votingness_havation_id })
		.update(votingness_havation);
}

function remove_by_id(votingness_havation_id) {
	return db('has_voted')
		.where({ id: votingness_havation_id })
		.del();
}

module.exports = {
  get_all,
  insert,
	update,
	remove_by_id
};
