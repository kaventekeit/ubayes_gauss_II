const Roles = require('../models/roles');
const Commands = require('../models/commands');

const {
	has_admin_permissions
} = require('../utils/interface_utils');

const {
	extract_info,
	confused_msg
} = require('../utils');

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

module.exports = { admin_handler };
