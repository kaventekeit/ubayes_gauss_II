/* ***********************************************************************************************************************************************

 TODO:
 
   - [ TEST admin handler - addrole and removerole they appear to work but need to be for-sure tested
        ** for multiple non-admin users ** ]
   - [ Election handler ]
   - [ FIX time handler - time conversion 
        currently there's a bug where it sends
        empty messages and in general it's
        really unintuitive ]
   - [ add background processes to add new roles, users, etc to dbs? ]


 *********************************************************************************************************************************************** */

const Users = require('../models/users');
const Remindmes = require('../models/remindmes');
const Roles = require('../models/roles');
const Commands = require('../models/commands');

const {
   user_id,
   channel,
   user_roles,
   all_guild_roles,
   all_guild_users,
   content,
   is_admin,
   has_admin_permissions,
   initial_db_fill,
   user_id_from_full_username
} = require('../utils/interface_utils');

const {
  div,
  get_channel,
  user_info,
  extract_info,
  to_standard_username,
  confused_msg,
  get_offset_in_minutes,
  unit_regex,
  to_date_and_msg
} = require('../utils');

const { to_epoch_ms } = require('../utils/basic_utils');

const disabled_msg = 'That command is disabled.';
const date_format_explanation = "Please format dates like: 'YYYY-MM-DDTHH:MM:SS'.";

async function election_handler(client, message) {
  const { channel, command } = await extract_info(client, message); 
  let command_data;
  if (command[1] === 'create') {
    command_data = await Commands.get_by_command_name('election_create');
    if (!command_data.enabled) {
      await channel.send(disabled_msg);
      return;
    }
    /* expected structure of `election create` command: */
    /* `election create <title_name> <how_many_of_these_are_we_electing> <start_date> <end_date> <candidate_names . . . >` */
    /* This should create an election with the specified title, start and end dates, [BEGUN] status, and list of candidates 
        [keyed by a foreign key to the election_id] in the database and return the election_id 
        we should have running processes in main that check to see
        [A] whether any existing elections' END dates are passed, and, if so, have Gauss DM everyone notifying them that 
        the election is closed, and remove the election, *and* all [ - candidates ], [ - votes ], and [ - has_voted ]s *associated* with the election 
        [B] whether any elections' START dates have been passed which are not BEGUN yet, and if there are such elections, 
        have Gauss initiate dialogues with all server members about them over DM set the election as BEGUN,
        create an entry for the *user* in the 'has_voted' table that is set to 0
    */
    const role_name = command[2];
    let start_date = new Date(command[4]).toString();  
    const end_date = new Date(command[5]).toString();
    if (start_date === 'Invalid Date'
        || end_date === 'Invalid Date') {
      await channel.send(date_format_explanation);  
      return;
    }
    return;
  } else if (command[1] === 'vote') {
    command_data = await Commands.get_by_command_name('election_vote');
    if (!command_data.enabled) {
      await channel.send(disabled_msg);
      return;
    }
    /* expected structure of `election vote` command: */
    /* `election vote <election_id> <candidate_names . . .>`
    FIRST the member votes.
    THEN Gauss is supposed to relay the users' votes in detail and ask them to confirm their choice by clicking a checkmark reaction. 
    Once the user confirms their vote we need to:
      [ - grab a hash of the CURRENT [ votes ] table ]
      [ - update the [ votes ] table with the user's anonymous vote, which will be an ORDERED STRING of the
          candidates' IDs from the candidates table ]
      [ - grab a hash of the UPDATED [ votes ] table ]
      [ - mark the user as 'has_voted' in the has_voted table ]
      [ - send the user the confirmation hashes for security [? how will this be checked ?] ]
    */
    return;
  }

  await channel.send(confused_msg);

  return;
}

async function send_handler(client, message) {
  const { channel, command } = await extract_info(client, message);
  let command_data;
  if (command[1] === 'channel') {
    command_data = await Commands.get_by_command_name('send_channel');
    if (!command_data.enabled) {
      await channel.send(disabled_msg);
      return;
    }
    let intended_channel_name = command[2];
    let intended_message = command.slice(3).join(' ');
    const all_channels = await message.guild.channels.fetch();
    console.log('all channels:');
    console.log(Array.from(all_channels));
    try {
      const intended_channel = Array.from(all_channels).filter(x => x[1].name === intended_channel_name)[0][1];
      await intended_channel.send(intended_message);
      return;
    } catch (err) {
      await channel.send('That channel does not exist.');
      return;
    }
  } else if (command.length >= 2) {
    command_data = await Commands.get_by_command_name('send_dm');
    if (!command_data.enabled) {
      await channel.send(disabled_msg);
      return;
    }
    let intended_user = '';
    let intended_message = '';
    if (command[1] === 'message'
        || command[1] === 'dm') {
      intended_user = await Users.unpicky_get_user(command[2]);
      try {
        intended_user = intended_user.user_id;
      } catch (err) {
        await channel.send('That user does not exist.');
        return;
      }
      console.log(`INTENDED USER: ${intended_user}`);
      intended_message = command.slice(3).join(' ');
    } else {
      intended_user = await Users.unpicky_get_user(command[1]);
      try {
        intended_user = intended_user.user_id;
      } catch (err) {
        await channel.send('That user does not exist.');  
        return;
      }
      console.log(`INTENDED USER: ${intended_user}`);
      intended_message = command.slice(2).join(' ');
    }
    const user_settings = await Users.get_user(intended_user);
    if (!user_settings) {
      await channel.send("That user does not exist.");
      return;
    }
    if (user_settings.dms_enabled === 1) {
      const user = client.users.cache.get(intended_user);
      await user.send(intended_message);
      return;
    } else {
      await channel.send('Sorry, that user does not have DMs from me enabled.');
      return;
    }
  }
  return;
}

async function remindme_handler(client, message) {
  async function insert_and_announce(ms, message, message_text, channel) {
    const user_id = message.author.id;
    const date_str = new Date(ms).toString();
    await Remindmes.insert({ date: ms, message: message_text, user_id: user_id });
    await message.author.send(`Reminder set for ${date_str}: [ " ${message_text} " ]`);
    return;
  }

  const { channel, command } = await extract_info(client, message);
  let command_data = await Commands.get_by_command_name('remindme');
  if (!command_data.enabled) {
    await channel.send(disabled_msg);
    return;
  }

  /* unit regex has this format: */
  /* let unit_regex = /^((second?s)|(minute?s)|(hour?s)|(day?s)|(week?s)|(month?s)|(year?s))$/i; */

  /* our date object to ms-since-epoch utility: */
  /* to_epoch_ms(date_obj) => # ms */

  const base_date = new Date();
  let target_date;
  const base_ms = to_epoch_ms(base_date);
  let target_ms = base_ms;

  const unit = unit_regex.exec(command[2]);
  console.log(unit);
  if (!unit) {
    const when_str = command[1];
    try {
      const when = new Date(when_str);
      await insert_and_announce(to_epoch_ms(when), message, command.slice(2).join(' '), channel);
      return;
    } catch (err) {
      await channel.send('Sorry, I could not parse that date.');
      return;
    }
  }
  
  if (!parseInt(command[1])) {
    await channel.send('Please provide amount of time as a number.');
    return;
  }

  switch (unit[1]) {
    case unit[2]: // seconds
      target_ms += parseInt(command[1]) * 1000;
      await insert_and_announce(target_ms, message, command.slice(3).join(' '), channel);
      return;
    case unit[3]: // minutes
      target_ms += parseInt(command[1]) * 60 * 1000;
      await insert_and_announce(target_ms, message, command.slice(3).join(' '), channel);  
      return;
    case unit[4]: // hours
      target_ms += parseInt(command[1]) * 60 * 60 * 1000;
      await insert_and_announce(target_ms, message, command.slice(3).join(' '), channel);
      return;
    case unit[5]: // days
      target_ms += parseInt(command[1]) * 24 * 60 * 60 * 1000;
      await insert_and_announce(target_ms, message, command.slice(3).join(' '), channel);
      return;
    case unit[6]: // weeks
      target_ms += parseInt(command[1]) * 7 * 24 * 60 * 60 * 1000;
      await insert_and_announce(target_ms, message, command.slice(3).join(' '), channel);
      return;
    case unit[7]: // months
      target_ms += parseInt(command[1]) * 30 * 24 * 60 * 60 * 1000;
      await insert_and_announce(target_ms, message, command.slice(3).join(' '), channel);
      return;
    default:
      await channel.send('I do not recognize that unit of time!');
      return;
  }

  await channel.send(confused_msg);
  return;
}

async function admin_handler(client, message) {
  const { channel, command } = await extract_info(client, message); 

  const admin = await has_admin_permissions(message);
  console.log(admin);

  if (!admin) {
    await channel.send(`Sorry, you do not have permission to execute admin commands.`);
    return;
  }

  if (command[1] === 'test') {
    await channel.send(`You have permission to execute admin commands.`);
    return;
  } else if (command.length === 3 && command[1] === 'addrole') {
    const is_existing = await Roles.get_by_role_name(command[2]);
    if (!is_existing) {
      await channel.send("Sorry, I couldn't find that role.");
      return;
    }
    await Roles.update(command[2],{ admin_enabled: 1 });
    await channel.send(`Role ${command[2]} updated to receive admin command permissions!`);
    return;
  } else if (command.length === 3 && command[1] === 'removerole') {
    const is_existing = await Roles.get_by_role_name(command[2]);
    if (!is_existing) {
      await channel.slend("Sorry, I couldn't find that role.");
      return;
    }
    await Roles.update(command[2], { admin_enabled: 0 });
    await channel.send(`Role ${command[2]} updated to lose admin command permisisons.`);
    return;
  } else if (command.length === 2 && command[1] === 'listdisabled') {
    const disabled_commands = await Commands.get_all_disabled();
    console.log(`DISABLED COMMANDS:`);
    console.log(disabled_commands);
    await channel.send(JSON.stringify(disabled_commands));
    return;
  } else if (command.length === 3 && command[1] === 'disable') {
    const is_existing = await Commands.get_by_command_name(command[2]);
    if (!is_existing) {
      await channel.send(`That command does not exist.`);
      return;
    }
    await Commands.update(command[2], { enabled: 0 });
    await channel.send(`Command ${command[2]} disabled.`);
    return;
  } else if (command.length === 3 && command[1] === 'enable') {
    const is_existing = await Commands.get_by_command_name(command[2]);
    if (!is_existing) {
      await channel.send(`That command does not exist.`);
      return;
    }
    await Commands.update(command[2], { enabled: 1 });
    await channel.send(`Command ${command[2]} enabled!`);
    return;
  }
  await channel.send(confused_msg);
  return;
}

async function reputation_handler(client, message) {
  const { channel, user_identifier, command } = await extract_info(client, message);
  let command_data;


  const give_commands = ['give','givereputation','giverep'];
  const take_commands = ['take','takereputation','takerep'];
  const give_and_take = give_commands.concat(take_commands);

  if (give_and_take.indexOf(command[0]) !== -1) {

    if (take_commands.indexOf(command[0]) !== -1) {
      command_data = await Commands.get_by_command_name('getrep'); 
      if (!command_data.enabled) {
        await channel.send(disabled_msg);
        return;
      }
    }
    if (give_commands.indexOf(command[0]) !== -1) {
      command_data = await Commands.get_by_command_name('giverep');
      if (!command_data.enabled) {
        await channel.send(disabled_msg);
        return;
      }
    }


    const user_to_search = to_standard_username(client,command[1]);
    const user = await Users.unpicky_get_user(user_to_search);
    if (!user) {
      await channel.send(`Sorry, I couldn't find that user.`);
      return;
    }
    if (parseInt(command[2]) != command[2]) {
      await channel.send(`Reputation must be a number.`);
      return;
    }
    let rep_to_add = (give_commands.indexOf(command[0])!==-1)?(parseInt(command[2])):(-parseInt(command[2]))
    await Users.update(user.user_id,{ reputation: user.reputation + rep_to_add });
    await channel.send(`Gave ${rep_to_add} reputation to ${user.username}.`);
    return;
  } else if (command[0] === 'getrep'
            || command[0] === 'get') {
    command_data = await Commands.get_by_command_name('getrep');
    if (!command_data.enabled) {
      await channel.send(disabled_msg);
      return;
    }
    const user_to_search = to_standard_username(client,command[1]);
    const user = await Users.get_user(user_to_search);
    if (!user) {
      await channel.send(`Sorry, I couldn't find that user.`);
      return;
    }
    await channel.send(`[ ${user.username} : ${user.reputation} ]`);
    return;
  } else if (command[0] === 'leaderboard') {
    command_data = await Commands.get_by_command_name('leaderboard');
    if (!command_data.enabled) {
      await channel.send(disabled_msg);
      return;
    }
    const unformatted_leaderboard = await Users.get_all();
    const leaderboard = unformatted_leaderboard.sort((a,b) => a.reputation-b.reputation).map(x => `${x.username} | ${x.reputation}`);
    await channel.send(div+'\n'
                        +leaderboard.join('\n')+'\n'
                        +div);
    return;
  }
  return;
}

async function time_handler(client, message) {
  const { channel, user_identifier, command } = await extract_info(client, message);
  let command_data;

  if (command.length === 1 || command[1] === 'now') {
    command_data = await Commands.get_by_command_name('time_now');
    if (!command_data.enabled) {
      await channel.send(disabled_msg);
      return;
    }
    const now = new Date().toString();
    await channel.send(now);
    return;
  } else if ((command.length === 2 && get_offset_in_minutes(command[1]) !== 'Invalid timezone!')
            || (command.length === 3 && command[1] === 'now' && get_offset_in_minutes(command[2]) !== 'Invalid timezone!')) {
    command_data = await Commands.get_by_command_name('time_convert');
    if (!command_data.enabled) {
      await channel.send(disabled_msg);
      return;
    }
    const offset_in_ms = get_offset_in_minutes(command.length===2?command[1]:command[2]) * 60 * 1000;
    const now_date = new Date();
    const utc_mils = to_epoch_ms(now_date);
    const offset_mils = utc_mils + offset_in_ms;
    const offset_date = new Date(offset_mils).toString();
    await channel.send(offset_date);
    return;
    
  } else if (command.length === 3 && command[1] === 'set') {
    command_data = await Commands.get_by_command_name('time_set');
    if (!command_data.enabled) {  
      await channel.send(disabled_msg);
      return;
    }
    const offset = get_offset_in_minutes(command[2]);
    if (typeof offset === "string") {
      await channel.send("Sorry, I don't recognize that timezone.");
      return;
    }
    await Users.update(user_identifier,{ utc_offset: offset });
    return;
  } else if (command[1] === 'convert') {
    /* if we just have 'convert' [time] we want to convert to utc */
    /* otherwise we want to convert to the timezone after 'to' */

    command_data = await Commands.get_by_command_name('time_convert');
    if (!command_data.enabled) {
      await channel.send(disabled_msg);
      return;
    }
    if (command.indexOf('to') === -1) {
      try {
        const now = new Date(command[2]).toLocaleString('en-US', { timeZone: 'UTC' });  // we don't wanna assume how they're specifiying TZ in their dates lol
        await channel.send(now);
        return;
      } catch (err) {
        await channel.send(date_format_explanation);
        return;
      }
    } else {
      if (command.length === 5) { // converting FROM UTC to some specified timezone
        const target_timezone = command.slice(command.indexOf('to')+1);
        const valid_timezone_tester = get_offset_in_minutes(target_timezone);
        if (!offset) {
          await channel.send("Sorry, I don't recognize that timezone.");
          return;
        }
        try {
          let date_to_convert = new Date(command[2]);
          date_to_convert = to_epoch_ms(date_to_convert);
          const new_date = new Date(date_to_convert).toLocaleString('en-US', { timeZone: target_timezone });  // remember, here we're assuming we're STARTING from UTC, or at least a TZ the user specified **within** their date so we have the correct ms info in our Date object
          await channel.send(new_date); 
          return;
        } catch (err) {
          await channel.send(date_format_explanation);
          return;
        }
      } else if (command.length === 6) { // converting FROM base tz that's NON-UTC
        const base_timezone = command[3];
        let base_offset = get_offset_in_minutes(base_timezone);  // we need this because presumably the user ISN'T incorporating info about their desired 'FROM' timezone into the argument they're specifying to our Date object constructor
        if (!base_offset) {
          await channel.send("Sorry, I don't recognize that timezone.");
          return;
        }
        base_offset *= (60 * 1000);
        try {
          let date_to_convert = new Date(command[2]);
          date_to_convert = to_epoch_ms(date_to_convert);
          date_to_convert -= base_offset;                     // we make our ms info for our base date include info about the base timezone!
          const target_timezone = command[5];
          let valid_timezone_tester = get_offset_in_minutes(target_timezone);
          if (!valid_timezone_tester) {
            await channel.send("Sorry, I don't recognize that timezone.");  
            return;
          }
          const converted_date = new Date(date_to_convert).toLocaleString('en-US', { timeZone: target_timezone });  // VOILÀ!
          await channel.send(converted_date);
          return;
        } catch (err) {
          await channel.send(date_format_explanation);
          return;
        }
      } else {
        await channel.send(confused_msg); 
        return;
      }
    }
  } else {
    await channel.send(confused_msg);
  }
  return;
}

async function misc_handler(client, message) {
  const { channel, command } = await extract_info(client, message);
  if (command[0] === 'help'
      || command[0] === 'docs') {
    await chanel.send('You can view the docs for this project at [LINK]');
    return;
  } else if (command[0] === 'privacy') {
    await channel.send('This bot stores some information about server users.'
                      +'\n'
                      +'You can view the user privacy information for this project at [LINK]');
    return;
  }
  await channel.send(confused_msg); 
  return;
}

module.exports = {
  election_handler,
  send_handler,
  remindme_handler,
  admin_handler,
  reputation_handler,
  time_handler,
  misc_handler
};
