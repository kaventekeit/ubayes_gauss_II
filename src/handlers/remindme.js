const Remindmes = require('../models/remindmes');
const Commands = require('../models/commands');

const {
	extract_info,
	confused_msg,
	unit_regex,
} = require('../utils');

const { date_to_epoch_ms } = require('../utils/basic_utils');

const disabled_msg = 'That command is disabled.';

async function remindme_handler(client, message) {
  async function insert_and_announce(ms, message, message_text, channel) {
    const user_id = message.author.id;
    const date_str = new Date(ms).toString();
    await Remindmes.insert({ date: ms, message: message_text, user_id: user_id });
    await channel.send(`Reminder set for ${date_str}: [ ${message_text} ]`);
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
  /* date_to_epoch_ms(date_obj) => # ms */

  const base_date = new Date();
  let target_date;
  const base_ms = date_to_epoch_ms(base_date);
  let target_ms = base_ms;

  const unit = unit_regex.exec(command[2]);
  console.log(unit);
  if (!unit) {
    const when_str = command[1];
    try {
      const when = new Date(when_str);
      await insert_and_announce(date_to_epoch_ms(when), message, command.slice(2).join(' '), channel);
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

module.exports = { remindme_handler };
