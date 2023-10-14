const Commands = require('../../models/commands');
const Elections = require('../../models/elections');
const Candidates = require('../../models/candidates');
const Has_Voted = require('../../models/has_voted');
const Audit_Log_Entries = require('../../models/audit_log_entries');

const { createHash } = require('node:crypto');

/*

		NEXT:

			- SEND ELECTION CREATED MESSAGE WHEN WE CREATE THE ELECTION
			- ADD HASH OF THAT MESSAGE AS THE INITIAL HASH FOR THE ELECTION TABLE

			[ utils for getting JSON for the rest of the hash? in model or? ]

*/


const {
	extract_info,
	get_sha256_digest
} = require('../../utils');

const {
	date_to_epoch_ms
} = require('../../utils/basic_utils');

const disabled_msg = 'That command is disabled.';

const date_format_explanation = "Please format dates like: 'YYYY-MM-DDTHH:MM:SS'.";
const election_create_command_usage_explanation = `election create command usage: 
      election create <title_name> <how_many_of_these_are_we_electing> <start_datetime> <end_datetime> <candidate_names . . . >
      `; 

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
    /* This should create an election with the specified title, start and end dates, and list of candidates 
        [keyed by a foreign key to the role_name] in the database and return the role_name
        we should have running processes in main that check to see
        [A] whether any existing elections' END dates are passed, and, if so, have Gauss DM everyone notifying them that 
        the election is closed, and remove the election, *and* all [ - candidates ], and [ - has_voted ]s *associated* with the election 
        [B] whether any elections' START dates have been passed which are not BEGUN yet, and if there are such elections, 
        have Gauss initiate dialogues with all server members about them over DM set the election as BEGUN,
        create an entry for the *user* in the 'has_voted' table that is set to 0
    */

    const role_name = command[2];
    let start_datetime = new Date(command[4]);  
    const end_datetime = new Date(command[5]);

    if (start_datetime.toString() === 'Invalid Date'
        || end_datetime.toString() === 'Invalid Date') {
      await channel.send(election_create_command_usage_explanation);
      await channel.send(date_format_explanation);  
      return;
    }
    const how_many_of_these_are_we_electing = Number(command[3]);
    if (how_many_of_these_are_we_electing === NaN) {
      await channel.send(election_create_command_usage_explanation);
      await channel.send(date_format_explanation);
      return;
    }

		const election_created_msg = `Created election ${role_name}, scheduled to start on ${start_datetime} and end on ${end_datetime}.`;
		const initial_hash = get_sha256_digest(election_created_msg);

    const new_election = {
      role_name,
      how_many_of_these_are_we_electing,
      start_datetime: date_to_epoch_ms(start_datetime),
      end_datetime: date_to_epoch_ms(end_datetime),
      begun: 0,
			hash: initial_hash
    };

		console.log('NEW ELECTION:');
		console.log(new_election);

    const role_name_array = await Elections.insert(new_election);

    const candidates_list = command.slice(6);
    for (let i = 0; i < candidates_list.length; i++) {
      await Candidates.insert({ role_name, candidate_name: candidates_list[i] });
    }

		await Audit_Log_Entries.insert({ election_id: role_name,
																		 new_hash: initial_hash });	
																			

    await channel.send(election_created_msg);
    return;

  } else if (command[1] === 'vote') {	
    command_data = await Commands.get_by_command_name('election_vote');
    if (!command_data.enabled) {
      await channel.send(disabled_msg);
      return;
    }
    /* expected structure of `election vote` command: */
    /* `election vote <role_name> <candidate_names . . .>`
    FIRST the member votes.
    THEN Gauss is supposed to relay the users' votes in detail and ask them to confirm their choice by clicking a checkmark reaction. 
    Once the user confirms their vote we need to:
      [ - grab a hash of the CURRENT [ candidates ] table for the election ]
      [ - update the [ candidates ] table with the user's anonymous vote, which will be an ORDERED STRING of the
          candidates' IDs from the candidates table ]
      [ - grab a hash of the UPDATED [ candidates ] table ]
      [ - mark the user as 'has_voted' in the has_voted table ]
      [ - send the user the confirmation hashes for security [? how will this be checked ?] ]
    */

		const user = message.author.id;

		const previous_voters = await Has_Voted.get_all();
		for (voter of previous_voters) {
			if (voter.user_id === parseInt(user)) {
				await channel.send(`You have already voted for ${command[2]}.`);
				return;
			}
		}

		const live_election = await Elections.get_live();
		let live_elections = [...live_election];
		let live_election_titles = live_elections.reduce((acc,x) => {
				if (x.begun === 1) {
					acc.push(x);
					return acc;
				} else {
					return acc;
				}
			},[])
		live_election_titles = live_election_titles.map(x => x.role_name);
		if (live_election_titles.indexOf(command[2]) === -1) {
			await channel.send('No such live election');
			return;
		}


		let our_candidates = await Candidates.get_all_of_election(command[2]);
		console.log(our_candidates);
		our_candidates = our_candidates.map(x => x.candidate_name);
		console.log(our_candidates);

		for (candidate of command.slice(3)) {
			if (our_candidates.indexOf(candidate) === -1) {
				await channel.send(`at least one of those candidates are not up for ${command[2]}. possible candidates are ${our_candidates.map((x,idx) => {
					if (idx === 0) {
						return `${x}`;
					} else if (idx === our_candidates.length-1) {
						return ` and ${x}`;
					} else {
						return ` ${x}`;
					}
				})}.`);
				return;
			}
		}

		let voted_for_candidates = command.slice(3);

		message.author.send(`You have selected to vote for ${voted_for_candidates.map((x,idx) => {
					if (idx === 0) {
						return `${x}`;
					} else if (idx === voted_for_candidates.length-1) {
						return ` and ${x}`;
					} else {
						return ` ${x}`;
					}
				})} as ${command[2]}. React with the checkmark to confirm and vote.`)
			.then(msg => {
				const white_check_mark = String.fromCodePoint(0x2705);
				msg.react(white_check_mark)
					.then(rxn => {
							const check_mark_filter = (reaction, user) => reaction.emoji.name === String.fromCodePoint(0x2705);

							const collector = msg.createReactionCollector({ filter: check_mark_filter, time: 15000 });

							collector.on('collect', async (reaction, user) => {

								
								let curr_candidate;
								let curr_votes;

								for (candidate of voted_for_candidates) {

									curr_candidate_array = await Candidates.get_by_specs(command[2],candidate);
									curr_votes = curr_candidate_array[0].votes;

									await Candidates.update(command[2],candidate,{ votes: curr_votes+1 });

								}

								const all_candidates = await Candidates.get_all_of_election(command[2]);

								const new_hash = get_sha256_digest(JSON.stringify(all_candidates));			
	
							  const old_election_arr = await Elections.get_by_role_name(command[2]);
								const old_hash = old_election_arr[0].hash;

	
								await user.send(`Old hash: ${old_hash} | New hash: ${new_hash}`);

								await Audit_Log_Entries.insert({ election_id: command[2],
																								 previous_hash: old_hash,
																								 new_hash });

								await Has_Voted.insert({ user_id: parseInt(user.id),	
																				 election_id: command[2],
																				 has_voted: 1 });
							
								await Elections.update(command[2],{ hash: new_hash });
								

								console.log('VOTING NOW');
								user.send('VOTING NOW');
							});
					});
			})

    return;
  }
}


module.exports = {
	election_handler
};
