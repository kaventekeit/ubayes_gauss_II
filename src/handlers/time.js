const chrono = require('chrono-node');
const { timezone_abbr_map } = require('../utils/timezone_abbr_map');

const {
	extract_info,
	confused_msg,
	get_offset_in_minutes
} = require('../utils');

const {
	date_to_epoch_ms
} = require('../utils/basic_utils');

const Commands = require('../models/commands');
const Users = require('../models/users');

const disabled_msg = 'That command is disabled.';
const date_format_explanation = "Please format dates like: 'YYYY-MM-DDTHH:MM:SS'.";

function ch_to_epoch(operand, tz) {
	if (tz) {
		let our_date = new Date(chrono.parseDate(operand, {timezone: tz}));
		return our_date.getTime();
	}
	let our_date = new Date(chrono.parseDate(operand));
	return our_date.getTime();
}

function ch_new_tz(channel, operand, tz_obj) {
	let offset_diff;
	let old_date;
	let res_date;
	if (!tz_obj.hasOwnProperty("user_tz")) {
		let timezone_calibration_date = new Date();
		let timezone_calibration_time = timezone_calibration_date.getTimezoneOffset();
		offset_diff = timezone_abbr_map[tz_obj.new_tz] - (- timezone_calibration_time); // chrono flips sign of this
		old_date = ch_to_epoch(operand, null);
		res_date = new Date(old_date + (offset_diff * 1000*60));
		return res_date;
	} else {
		offset_diff = timezone_abbr_map[tz_obj.new_tz] - timezone_addr_map[tz_obj.user_tz];
		old_date = ch_to_epoch(operand, tz_obj.user_tz);
		res_date = new Date(old_date + offset_diff);
		return res_date;
	}
}

async function time_handler(client, message) {
  const { channel, user_identifier, command } = await extract_info(client, message);
  let command_data;
	let time_command_words = ['time','convert','now','to'];
	const date_part_of_command = command.reduce((acc,x,idx) => {
		if (acc !== "") {
			if (idx !== command.length-1) {
				return acc+x+" ";
			} else {
				return acc+x;
			}
		} else if (time_command_words.indexOf(x) === -1) {
			if (idx !== command.length-1) {
				return acc+x+" ";
			} else {
				return acc+x;
			}
		} else {
			return acc;
		}
	},"");

	let timezone_part_of_command = command.slice(command.indexOf('to')+1).join('');

  if (command.length === 1 || command[1] === 'now') {
    command_data = await Commands.get_by_command_name('time_now');
    if (!command_data.enabled) {
      await channel.send(disabled_msg);
      return;
    }
    const now = new Date().toString();
    await channel.send(now);
    return;
  } else if (command[1] === 'convert') {
    command_data = await Commands.get_by_command_name('time_convert');
    if (!command_data.enabled) {
      await channel.send(disabled_msg);
      return;
    }

		const new_date = ch_new_tz(channel, date_part_of_command, { new_tz: timezone_part_of_command })
													.toString()
													.split(' ')
													.slice(0,5)
													.join(' ')+' '+timezone_part_of_command;

		await channel.send(new_date);
	
    return;
    
  } else if (command.length === 3 && command[1] === 'set') {
    command_data = await Commands.get_by_command_name('time_set');
    if (!command_data.enabled) {  
      await channel.send(disabled_msg);
      return;
    }
    const offset = get_offset_in_minutes(command[2]);
    if (!offset || typeof offset !== "Number") {
      await channel.send("sorry, i don't recognize that timezone.");
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
        const now = new Date(command[2]).toLocaleString('en-us', { timeZone: 'utc' });  // we don't wanna assume how they're specifiying tz in their dates lol
        await channel.send(now);
        return;
      } catch (err) {
        await channel.send(date_format_explanation);
        return;
      }
    } else {
      if (command.length === 5) { // converting from utc to some specified timezone
        const target_timezone = command.slice(command.indexOf('to')+1);
        const valid_timezone_tester = get_offset_in_minutes(target_timezone);
        if (!valid_timezone_tester) {
          await channel.send("sorry, i don't recognize that timezone.");
          return;
        }
        try {
          let date_to_convert = new Date(command[2]);
          date_to_convert = date_to_epoch_ms(date_to_convert);
          const new_date = new Date(date_to_convert).toLocaleString('en-us', { timeZone: target_timezone });  // remember, here we're assuming we're starting from utc, or at least a tz the user specified **within** their date so we have the correct ms info in our date object
          await channel.send(new_date); 
          return;
        } catch (err) {
          await channel.send(date_format_explanation);
          return;
        }
      } else if (command.length === 6) { // converting from base tz that's non-utc
        const base_timezone = command[3];
        let base_offset = get_offset_in_minutes(base_timezone);  // we need this because presumably the user isn't incorporating info about their desired 'from' timezone into the argument they're specifying to our date object constructor
        if (!base_offset) {
          await channel.send("sorry, i don't recognize that timezone.");
          return;
        }
        base_offset *= (60 * 1000);
        try {
          let date_to_convert = new Date(command[2]);
          date_to_convert = date_to_epoch_ms(date_to_convert);
          date_to_convert -= base_offset;                     // we make our ms info for our base date include info about the base timezone!
          const target_timezone = command[5];
          let valid_timezone_tester = get_offset_in_minutes(target_timezone);
          if (!valid_timezone_tester) {
            await channel.send("sorry, i don't recognize that timezone.");  
            return;
          }
          const converted_date = new Date(date_to_convert).toLocaleString('en-us', { timeZone: target_timezone });  // voilã€!
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

module.exports = { time_handler, ch_new_tz };
