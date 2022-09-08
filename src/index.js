/* { SEND | PRIVACY | REPUTATION | REMINDME | MISC | ELECTION | TIME } */

const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { token } = require('./config/config.json');
const { election_handler,
        send_handler,
        misc_handler,
        remindme_handler,
        reputation_handler,
        admin_handler,
        time_handler } = require('./handlers');
const Users = require('./models/users');
const Commands = require('./models/commands');
const Welcome_Config = require('./models/welcome_config');
const Remindmes = require('./models/remindmes');


const client = new Client({ intents: [ GatewayIntentBits.Guilds, 
                                       GatewayIntentBits.GuildMessages, 
                                       GatewayIntentBits.MessageContent, 
                                       GatewayIntentBits.DirectMessages ] });

const { welcome_message } = require('./config/default_welcome_message');

const {
   user_id,
   channel,
   user_roles,
   all_guild_roles,
   all_guild_users,
   content,
   is_admin,
   has_admin_permissions,
   initial_db_fill
} = require('./utils/interface_utils');

let {
  schedule_checker
} = require('./utils');

const {
  confused_msg,
  reputation,
  misc,
  check_schedule,
  has_admin
} = require('./utils');

let initial_db_fill_done = 0;

client.once('ready', async () => {
  clearInterval(schedule_checker);
  schedule_checker = undefined;
	console.log(`We have logged in as ${client.user.username+'#'+client.user.discriminator}`);
  check_schedule(client);
});

client.on('messageCreate', async (message) => {
  if (!initial_db_fill_done) {
    await initial_db_fill(message); 
    initial_db_fill_done = 1;
  }
  if (message.author.id === client.user.id) {
    return;
  }
  const message_user_id = user_id(message);
  console.log(`message_user_id: ${message_user_id}`);
  const user = await Users.get_user(message_user_id);
  console.log('Found user:');
  console.log(user);
  const admin = is_admin(message);
  const channel = client.channels.cache.get(message.channel.id);
  const command = message.content.split(' ');
  const all_commands = await Commands.get_all();

  const welcome_regex = /mee{0,1}t Gauss/i;
  if (welcome_regex.test(message.content)) {
    await channel.send(welcome_message);
  }


/* 
  figure out how to implement this check later
  const enabled_commands = all_commands.filter(x => x.enabled === 1).map(x => x.command_name);
  if (enabled_commands.indexOf(command[0]) === -1) {
    return;
  }
*/

  if (command.length < 2 || command[0] !== '!g') {
    return;
  }
  if (command[1] == 'send') {
    await send_handler(client, message); 
    return;
  } else if (command[1] === 'remindme') {
    await remindme_handler(client, message);
    return;
  } else if (command[1] === 'time') {
    await time_handler(client, message);  
    return;
  } else if (command[1] === 'admin') {
    await admin_handler(client, message);
    return;
  } else if (reputation.indexOf(command[1]) !== -1) {
    await reputation_handler(client, message);
    return;
  } else if (command[1] === 'election') {
    await election_handler(client, message);
    return;
  } else if (misc.indexOf(command[1]) !== -1) {
    await misc_handler(client, message);
    return;
  } else if (command[1] === 'list') {
    const data_to_display = command[2];
    switch (data_to_display) {
      case 'users':
        const all_users = await Users.get_all();
        await channel.send(JSON.stringify(all_users));
        return;
      case 'remindmes':
        const all_remindmes = await Remindmes.get_all();
        await channel.send(JSON.stringify(all_remindmes));
        return;
      case 'commands':
        const all_commands = await Commands.get_all();
        await channel.send(JSON.stringify(all_commands));
        return;
      case 'roles':
        const all_roles = await Roles.get_all();
        await channel.send(JSON.stringify(all_roles));
        return;
      default:
        await channel.send(confused_msg);
        return;
    }
  }
  await channel.send(confused_msg);
  return;
});

client.login(token);
