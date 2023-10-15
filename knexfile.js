// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'sqlite3',
    useNullAsDefault: true,
    migrations: {
      directory: '/home/ubuntu/ubayes_gauss_II/src/data/migrations',
    },
    seeds: {
      directory: '/home/ubuntu/ubayes_gauss_II/src/data/seeds',
    },
    pool: {
      afterCreate: (conn, done) => {
        conn.run('PRAGMA foreign_keys = ON', done);
      },
    },
    connection: {
      filename: '/home/ubuntu/ubayes_gauss_II/src/data/index.db'
    }
  },


};
