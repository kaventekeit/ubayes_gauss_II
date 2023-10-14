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

const { election_handler } = require('./election');
const { send_handler } = require('./send');
const { remindme_handler } = require('./remindme');
const { admin_handler } = require('./admin');
const { reputation_handler } = require('./reputation');
const { time_handler } = require('./time');
const { misc_handler } = require('./misc');

module.exports = {
  election_handler,
  send_handler,
  remindme_handler,
  admin_handler,
  reputation_handler,
  time_handler,
  misc_handler
};
