/**
 * ###############################################################################################
 *  ____                                        _     _____              _             _
 * |  _ \  (_)  ___    ___    ___    _ __    __| |   |_   _| (_)   ___  | | __   ___  | |_   ___
 * | | | | | | / __|  / __|  / _ \  | '__|  / _` |     | |   | |  / __| | |/ /  / _ \ | __| / __|
 * | |_| | | | \__ \ | (__  | (_) | | |    | (_| |     | |   | | | (__  |   <  |  __/ | |_  \__ \
 * |____/  |_| |___/  \___|  \___/  |_|     \__,_|     |_|   |_|  \___| |_|\_\  \___|  \__| |___/
 *
 * ---------------------
 *      Quick Start
 * ---------------------
 *
 * 	> For detailed instructions, visit the GitHub repository and read the documentation:
 * 	https://github.com/eartharoid/DiscordTickets/wiki
 *
 * 	> IMPORTANT: Also edit the TOKEN in 'user/.env'
 *
 * ---------------------
 *       Support
 * ---------------------
 *
 * 	> Information: https://github.com/eartharoid/DiscordTickets/#readme
 * 	> Discord Support Server: https://go.eartharoid.me/discord
 * 	> Wiki: https://github.com/eartharoid/DiscordTickets/wiki
 *
 * ###############################################################################################
 */

module.exports = {
	prefix: '-',
	name: 'DiscordTickets',
	presences: [
		{
			activity: '%snew',
			type: 'PLAYING'
		},
		{
			activity: 'met tickets',
			type: 'PLAYING'
		},
		{
			activity: 'voor nieuwe tickets',
			type: 'WATCHING'
		}
	],
	append_presence: ' | %shelp',
	colour: '#009999',
	err_colour: 'RED',
	cooldown: 3,
	guild: '804684861063299073', // ID of your guild (REQUIRED)
	staff_role: '804742213942116422', // ID of your Support Team role (REQUIRED)

	tickets: {
		category: '804717995569446942', // ID of your tickets category (REQUIRED)
		send_img: true,
		ping: 'here',
		text: `Hello there, {{ tag }}!
		Een medewerker zal u binnenkort helpen.
		Beschrijf ondertussen uw probleem zo gedetailleerd mogelijk!​`,
		pin: false,
		max: 3,
		default_topic: {
			command: 'Geen topic gegeven',
			panel: 'Gemaakt via paneel'
		}
	},

	commands: {
		close: {
			confirmation: true,
			send_transcripts: true
		},
		delete: {
			confirmation: true
		},
		new: {
			enabled: true
		},
		closeall: {
			enabled: true,
		},
	},

	transcripts: {
		text: {
			enabled: true,
			keep_for: 90,
		},
		web: {
			enabled: false,
			server: 'https://tickets.example.com',
		},
		channel: '804722821695406130' // ID of your archives channel
	},

	panel: {
		title: 'Support Tickets',
		description: 'Hulp nodig? Geen probleem! Reageer op dit panel om een ​​nieuw supportticket aan te maken, zodat ons supportteam u kan helpen.',
		reaction: '🧾'
	},

	storage: {
		type: 'sqlite'
	},

	logs: {
		files: {
			enabled: true,
			keep_for: 7
		},
		discord: {
			enabled: false,
			channel: '804722821695406130' // ID of your log channel
		}
	},

	debug: false,
	updater: true
};
