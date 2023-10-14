const Users = require('../models/users');
const Commands = require('../models/commands');

const {
	extract_info
} = require('../utils');

const disabled_msg = 'That command is disabled.';

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
    const user_settings = await Users.get_by_id(intended_user);
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

module.exports = { send_handler };
