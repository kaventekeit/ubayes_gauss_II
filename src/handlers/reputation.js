const Users = require('../models/users');
const Commands = require('../models/commands');

const {
	div,
	extract_info,
	to_standard_username
} = require('../utils');

const disabled_msg = 'That command is disabled.';

async function reputation_handler(client, message) {
  const { channel, user_identifier, command } = await extract_info(client, message);
  let command_data;


  const give_commands = ['thanks', 'give','givereputation','giverep'];
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
		let rep_to_add = 0;
    if (parseInt(command[2]) != command[2]) {
			rep_to_add = (give_commands.indexOf(command[0])!==-1)?1:-1;
    } else {
    	rep_to_add = (give_commands.indexOf(command[0])!==-1)?(parseInt(command[2])):(-parseInt(command[2]))
		}
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
    const user = await Users.get_by_id(user_to_search);
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

module.exports = { reputation_handler };
