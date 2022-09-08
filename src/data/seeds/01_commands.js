exports.seed = function(knex) { return knex('commands')
    .truncate()
    .then(function() {
      return knex('commands')
        .insert([
          { command_name: "send_channel", enabled: 1 },
          { command_name: "send_dm", enabled: 1 },
          { command_name: "remindme", enabled: 1 },
          { command_name: "election_create", enabled: 1 },
          { command_name: "election_vote", enabled: 1 },
          { command_name: "give", enabled: 1 },
          { command_name: "take", enabled: 1 },
          { command_name: "time_now", enabled: 1 },
          { command_name: "time_set", enabled: 1 },
          { command_name: "time_convert", enabled: 1 },
          { command_name: "giverep", enabled: 1 },
          { command_name: "getrep", enabled: 1 },
          { command_name: "leaderboard", enabled: 1 },
        ])
    });
};
