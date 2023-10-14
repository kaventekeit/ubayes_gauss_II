
const {
	extract_info,
	confused_msg
} = require('../utils');

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

module.exports = { misc_handler };
