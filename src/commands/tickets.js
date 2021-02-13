/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const { join } = require('path');

module.exports = {
	name: 'tickets',
	description: 'Maak een lijst van uw recente tickets om toegang te krijgen tot transcripties / archieven.',
	usage: '[@member]',
	aliases: ['list'],
	args: false,
	async execute(client, message, args, {config, Ticket}) {
		const guild = client.guilds.cache.get(config.guild);

		const supportRole = guild.roles.cache.get(config.staff_role);
		if (!supportRole) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setTitle('❌ **Error**')
					.setDescription(`${config.name} is niet correct ingesteld. Kan geen rol 'Support team' vinden met de id \`${config.staff_role}\``)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		let context = 'self';
		let user = message.mentions.users.first() || guild.members.cache.get(args[0]);

		if (user) {
			if (!message.member.roles.cache.has(config.staff_role)) {
				return message.channel.send(
					new MessageEmbed()
						.setColor(config.err_colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle('❌ **Geen toestemming**')
						.setDescription('U heeft geen toestemming om tickets van anderen te vermelden, aangezien u geen personeel bent.')
						.addField('Usage', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
						.addField('Help', `Typ \`${config.prefix}help ${this.name}\` Voor meer informatie`)
						.setFooter(guild.name, guild.iconURL())
				);
			}

			context = 'staff';
		} else user = message.author;

		let openTickets = await Ticket.findAndCountAll({
			where: {
				creator: user.id,
				open: true
			}
		});

		let closedTickets = await Ticket.findAndCountAll({
			where: {
				creator: user.id,
				open: false
			}
		});

		closedTickets.rows = closedTickets.rows.slice(-10); // get most recent 10

		let embed = new MessageEmbed()
			.setColor(config.colour)
			.setAuthor(user.username, user.displayAvatarURL())
			.setTitle(`${context === 'self' ? 'jouwn' : user.username + '\'s'} tickets`)
			.setFooter(guild.name + ' | Dit bericht wordt binnen 60 seconden verwijderd', guild.iconURL());

		/* if (config.transcripts.web.enabled) {
			embed.setDescription(`You can access all of your ticket archives on the [web portal](${config.transcripts.web.server}/${user.id}).`);
		} */

		let open = [],
			closed = [];

		for (let t in openTickets.rows)  {
			let desc = openTickets.rows[t].Onderwerp.substring(0, 30);
			open.push(`> <#${openTickets.rows[t].channel}>: \`${desc}${desc.length > 20 ? '...' : ''}\``);
		}

		for (let t in closedTickets.rows)  {
			let desc = closedTickets.rows[t].Onderwerp.substring(0, 30);
			let transcript = '';
			let c = closedTickets.rows[t].channel;
			if (config.transcripts.web.enabled || fs.existsSync(join(__dirname, `../../user/transcripts/text/${c}.txt`))) {
				transcript = `\n> Typ \`${config.prefix}transcript ${closedTickets.rows[t].id}\` om te bekijken.`;
			}

			closed.push(`> **#${closedTickets.rows[t].id}**: \`${desc}${desc.length > 20 ? '...' : ''}\`${transcript}`);

		}

		let pre = context === 'self' ? 'Jij hebt' : user.username + ' has';
		embed.addField('Open tickets', openTickets.count === 0 ? `${pre} geen open tickets.` : open.join('\n\n'), false);
		embed.addField('Gesloten tickets', closedTickets.count === 0 ? `${pre} geen ouwe tickets` : closed.join('\n\n'), false);

		message.delete({timeout: 15000});

		let channel;
		try {
			channel = message.author.dmChannel || await message.author.createDM();
			message.channel.send('Sent to DM').then(msg => msg.delete({timeout: 15000}));
		} catch (e) {
			channel = message.channel;
		}

		let m = await channel.send(embed);
		m.delete({timeout: 60000});
	},
};