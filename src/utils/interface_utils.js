/* interfaces I need to deal with: message */
/* that's it, just: message */
/* it has message.guild */
/* it has message.author */
/* it has message.member */

/* things I need to be able to get:
    - a list of roles in the guild
    - a list of a user's roles
    - an initial list of user tags from the guild ?
    - find out if a member has the Admin bit flag OR has otherwise admin permissions

*/

const { PermissionsBitField } = require('discord.js');
const Roles = require('../models/roles');
const Users = require('../models/users');
const Welcome_Config = require('../models/welcome_config');
const { welcome_message } = require('../config/default_welcome_message');

/* these should honestly all just take a single argument: 
  a discord.js message object 
  [EDIT: Unless they need the client!]
*/

function user_id(message) {
  console.log(`message.author.id: ${message.author.id}`);
  return message.author.id;
}

function user_id_from_full_username(full_username,message) {
  for (let member of Array.from(message.guild.members.cache)) {
    if (member.user.username == full_username.split('#')[0]) {
      return member.id;
    }
  }
  return -1;
}

function channel(client, message) {
  return message.channels.cache.get(message.channel.id);
}

function user_roles(message) {
  return message.member.roles.member._roles;
}


function all_guild_roles(message) {
}

function all_guild_users(message) {
}

function content(message) {
  return message.content;
}

async function is_admin(message) {
  if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    console.log(message.member.permissions);
    console.log(PermissionsBitField.Flags.Administrator);
    return 1;
  }
  const me = await Users.get_user(message.member.id);
  if (me.admin) {
    return 1;
  }
  return 0;
}

async function has_admin_permissions(message) {

  const i_am_admin = await is_admin(message);
  if (i_am_admin) {
    return 1;
  }
  const roles = user_roles(message);
  for (let role_x of roles) {
    const role_name = message.guild.roles.cache.find(x => x.id === role_x).name;
    const all_admin_roles = await Roles.get_all_admin_enabled();
    if (all_admin_roles.filter(x => x.role_name === role_name).length > 0) {
      return 1;
    }
  }
  return 0;
}

/* OK actually I *have* to do this one because I iterate through the members sometimes */

function member_info(member) {
  return { username: String(member.user.username)+'#'+String(member.user.discriminator),
           roles: member.roles.member._roles,
           admin: member.permissions.has(PermissionsBitField.Flags.Administrator)?1:0 };
}

/* this one has a little more complicated access to discord.js's innards so I'll
  keep it in here too */

async function initial_db_fill(message) {

  const initial_channel = message.guild.channels.cache.first().name;
  await Welcome_Config.change({ welcome_channel: initial_channel, welcome_message });

  await message.guild.roles.cache.each(async (x) => {
    const existing = await Roles.get_all();
    if (existing.filter(y => y.role_name === x.name.replace(/\s/g, '_')).length === 0) {
      console.log(`adding role ${x.name}`);
      return Roles.add({ role_name: x.name.replace(/\s/g,'_'), admin_enabled: 0 });
    }
  });

  const members = await message.guild.members.fetch();
  members.each(async (x) => {
    const existing = await Users.get_all();
    if (existing.filter(y => y.user_id === x.id).length === 0) {
      return Users.add({  user_id: x.id, 
                          username: x.user.username, 
                          discriminator: x.user.discriminator, 
                          full_username: x.user.username+'#'+x.user.discriminator,
                          admin: x.user.username==='Multiaxial'?1:0 }); // giving myself admin permissions for testing purposes! - Multiaxial
    }
  });
 
}

function get_user(username, client) {
}

module.exports = {
  user_id,
  channel,
  user_id_from_full_username,
  user_roles,
  all_guild_roles,
  all_guild_users,
  content,
  is_admin,
  has_admin_permissions,
  initial_db_fill,
  get_user
};
