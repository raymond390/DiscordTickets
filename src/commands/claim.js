/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');
const Logger = require('leekslazylogger');
const log = new Logger();

module.exports = {
	name: 'claim',
	description: 'een ticket claimen',
	usage: '<@member> [... #channel]',
	aliases: ['none'],
	example: 'claim',
	args: true,
	async execute(client, message, args, {config, Ticket}) {

       

    }
}