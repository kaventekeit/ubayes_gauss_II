const { PermissionsBitField } = require('discord.js');
const Users = require('../models/users');
const Roles = require('../models/roles');
const Remindmes = require('../models/remindmes');
const Elections = require('../models/elections');
const Audit_Log_Entries = require('../models/audit_log_entries');

const { createHash } = require('node:crypto');

const { date_to_epoch_ms } = require('./basic_utils');

const {
   username,
   channel,
   user_roles,
   all_guild_roles,
   all_guild_users,
   content,
   has_admin_permissions,
   initial_db_fill,
   get_user
} = require('./interface_utils');

const div = '------------------------------------------------------------------------------';

const confused_msg = "I'm sorry, what did you say?";

const reputation = ['giverep',
                    'givereputation',
                    'takerep',
                    'takereputation',
                    'give',
                    'take',
										'thanks',
                    'leaderboard',
                    'getrep',
                    'get'];

const misc = ['docs',
              'help',
              'privacy'];

async function has_admin(member) {
  const { roles } = user_info(member);
  for (let y of roles) {
    const role_name = message.guild.roles.cache.find(a => a.id === y).name;
    const all_admin_roles = await Roles.get_all_admin_enabled();  
    if (all_admin_roles.filter(z => z.role_name === role_name).length > 0) {
      return 1;
    }        
  };
  return 0;
}

async function churn_through_remindmes(client) { 
  const outstanding_remindmes = await Remindmes.get_outstanding();
  console.log('V OUTSTANDING REMINDMES V');
  console.log(outstanding_remindmes);
  let user;
  for (let remindme of outstanding_remindmes) {
    user = client.users.cache.get(remindme.user_id);
    try {
      await user.send(`Reminder: [ ${remindme.message} ]`);
      await Remindmes.remove_by_id(remindme.id);
    } catch (err) {
      console.error(err);
    }
  }
  return;
}

async function churn_through_elections(client, guild) {


	const audit_log_channel = guild.channels.cache.get('713750633055780924');

	console.log('****************************');
  console.log(`AUDIT_LOG_CHANNEL`);
	console.log(audit_log_channel);
	console.log('****************************');

  let outstanding_live_elections = await Elections.get_live();
  outstanding_live_elections = outstanding_live_elections.filter(election => election.begun === 0);

  console.log('V OUTSTANDING LIVE ELECTIONS V');
  console.log(outstanding_live_elections);

  for (let election of outstanding_live_elections) {
    await Elections.update(election.role_name, { ...election, begun: 1 });
  }

  const outstanding_dead_elections = await Elections.get_dead();
  console.log('V OUTSTANDING DEAD ELECTIONS V');
  console.log(outstanding_dead_elections);

  for (let election of outstanding_dead_elections) {

		const audit_log_entries = await Audit_Log_Entries.get_all();

		await audit_log_channel.send(JSON.stringify(audit_log_entries));

    await Elections.remove_by_role_name(election.role_name);   
  }
}

async function refresh_users_and_roles(client, guild) {

  /* for roles all we need to do is add new roles and remove old ones */

  let existing = await Roles.get_all();
  const roles = await guild.roles.fetch();

  for (let i = 0; i < existing.length; i++) {
    if (roles.filter(x => x.name.replace(/\s/g, '_').replace(/@/g, '') === existing[i].role_name).length === 0) {
      await Roles.remove_by_role_name(existing[i].role_name);
    }
  }

  roles.each(async (x) => {
    const existing = await Roles.get_all();
    if (existing.filter(y => y.role_name === x.name.replace(/\s/g, '_').replace(/@/g, '')).length === 0) {
      return Roles.add({ role_name: x.name.replace(/\s/g, '_').replace(/@/g, ''), admin_enabled: 0 });
    }
  })

  console.log(`All roles updated!`);

  const members = await guild.members.fetch();

  /* 
  
   but for members, we have to: 
    [1] remove members from our db who have left the server
    [2] go through each existing member ID and:
      - add it if we haven't
      - update everything associated with the ID to make sure the db reflects the ID's current attributes in the server
  */

  existing = await Users.get_all();

  for (let i = 0; i < existing.length; i++) {
    if (members.filter(x => x.user_id === existing[i].id).length === 0) {
      await Users.remove_by_id(existing[i].id);
    }
  }

  members.each(async (x) => {
    const existing = await Users.get_all();
    if (existing.filter(y => y.user_id === x.id).length == 0) {
      return Users.add({ user_id: x.id,
                        username: x.user.username.replace(/\s/g, '_'),
                        discrmiminator: x.user.discriminator,
                        full_username: x.user.username.replace(/\s/g, '_')+'#'+x.user.discriminator,
                        display_name: x.displayName.replace(/\s/g, '_'),
                        admin: x.user.username==='Multiaxial'?1:0 }); // giving myself admin permissions for testing purposes! - Multiaxial      
    } else {
      return Users.update(x.id,{  username: x.user.username.replace(/\s/g, '_'),
                                  discriminator: x.user.discriminator,
                                  full_username: x.user.username.replace(/\s/g, '_')+'#'+x.user.discriminator,
                                  display_name: x.displayName.replace(/\s/g, '_'),
      });
    }
  });

  console.log(`All members updated!`); 
  
}

async function run_background_routine(client, guild) {
  refresh_users_and_roles(client, guild);
  churn_through_elections(client, guild);
  churn_through_remindmes(client);
}


let schedule_checker;
function check_schedule(client, guild) {
  if (!schedule_checker) {
    schedule_checker = setInterval(() => run_background_routine(client, guild), 5000);
  }
}

async function get_channel(client, message) {
  const channel = client.channels.cache.get(message.channel.id);
  return channel;
}

async function extract_info(client, message) {
  const channel = await get_channel(client, message);
  return {  channel,
            user_identifier: String(message.author.username)+'#'+String(message.author.discriminator),
            command: message.content.split(' ').slice(1) };
}
function to_standard_username(client,user_string) {
  let standard_username = user_string;
  if (user_string.split('#').length !== 2) {
    const possible_user = client.users.cache.find(x => x.tag.split('#')[0].toLowerCase() === user_string.toLowerCase());
    if (possible_user) {
      standard_username = possible_user.tag;
    }
  }
  return standard_username;
}

function get_offset_in_minutes(timeZone) {
  const date = new Date();
  const utc_date = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  try {
    const tz_date = new Date(date.toLocaleString('en-US', { timeZone }));
    return (tz_date.getTime() - utc_date.getTime()) / 60000;
  } catch (error) {
    return "Invalid timezone!";
  }
}

/* to be used with remindme and time convert */

const unit_regex = /^((seconds?)|(minutes?)|(hours?)|(days?)|(weeks?)|(months?)|(years?))$/i;


function to_date_and_msg(time_command) {
  const months = ["january","february","march","april","may","june",
                  "july","august","september","october","november","december",
                  "jan","jan.","feb","feb.","mar","mar.","apr","apr.",
                  "jun","jun.","jul","jul.","aug","aug.","sep","sep.",
                  "oct","oct.","nov","nov.","dec","dec."];
  const date_regex = /^((\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.{0,1}\d{0,4})|(\d{4}-\d{2}-\d{2})|(\d{2}:\d{2}:\d{2}))$/;
  let date = date_regex.exec(time_command[0]);
  if (date) {
    let subject = '';
    switch (date[1]) {
      case date[2]:
        subject = time_command[0];        /* need to configure this to users' local timezones */
      case date[3]:
        subject = time_command[0] + 'T12:00:00.000Z';
      case date[4]:
        subject = '0000-00-00T'+time_command[0]+'000Z';
    }
    return {  date: new Date(subject),
              message: time_command.slice(1).join(' ') };
  } else {
    let unit_regex = /^((second?s)|(minute?s)|(hour?s)|(day?s)|(week?s)|(month?s)|(year?s))$/i;
    let unit = unit_regex.exec(time_command[1]);
    if (!unit) {
      return false;
    }
    switch (unit[1]) {
      case unit[2]:
      case unit[3]:
      case unit[4]:
      case unit[5]:
      case unit[6]:
      case unit[7]:
    }
  }
}

const get_sha256_digest = operon => {
	const hash = createHash('sha256');
	hash.update(operon);
	return hash.digest('hex');
}

module.exports = {
  unit_regex,
  confused_msg,
  reputation,
  misc,
  schedule_checker,
  check_schedule,
  get_channel,
  extract_info,
  to_standard_username,
  get_offset_in_minutes,
  to_date_and_msg,
	get_sha256_digest
};
