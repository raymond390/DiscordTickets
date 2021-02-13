/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'transfer',
	description: 'Draag het eigendom van een ticketkanaal over',
	usage: '<@member>',
	aliases: ['none'],
	example: 'transfer @user',
	args: true,
	async execute(client, message, args, { config, Ticket }) {
		const guild = client.guilds.cache.get(config.guild);

		let ticket = await Ticket.findOne({
			where: {
				channel: message.channel.id
			}
		});

		if (!ticket) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Dit is geen ticketkanaal**')
					.setDescription('Gebruik deze opdracht in het ticketkanaal waarvan u de eigenaar wilt wijzigen.')
					.addField('Gebruik', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Help', `Typ \`${config.prefix}help ${this.name}\` Voor meer informatie`)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		if (!message.member.roles.cache.has(config.staff_role))
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Geen rechten**')
					.setDescription('Je hebt geen toestemming om het eigendom van dit kanaal te veranderen, aangezien je geen staff bent.')
					.addField('Usage', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Help', `Type \`${config.prefix}help ${this.name}\` for more information`)
					.setFooter(guild.name, guild.iconURL())
			);

		let member = guild.member(message.mentions.users.first() || guild.members.cache.get(args[0]));

		if (!member) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Onbekende gebruiker**')
					.setDescription('Vermeld een geldig lid.')
					.addField('Gebruik', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Help', `Type \`${config.prefix}help ${this.name}\`Voor meer informatie`)
					.setFooter(guild.name, guild.iconURL())
			);
		}


		message.channel.setTopic(`${member} | ${ticket.topic}`);

		Ticket.update({
			creator: member.user.id
		}, {
			where: {
				channel: message.channel.id
			}
		});

		message.channel.send(
			new MessageEmbed()
				.setColor(config.colour)
				.setAuthor(message.author.username, message.author.displayAvatarURL())
				.setTitle('✅ **Ticket transferred**')
				.setDescription(`Ownership of this ticket has been transferred to ${member}.`)
				.setFooter(client.user.username, client.user.displayAvatarURL())
		);
	}
};
