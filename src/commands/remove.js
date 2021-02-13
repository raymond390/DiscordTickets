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
	name: 'remove',
	description: 'Verwijder een persoon uit een ticket',
	usage: '<@member> [... #channel]',
	aliases: ['none'],
	example: 'remove @member from #ticket-23',
	args: true,
	async execute(client, message, args, {config, Ticket}) {
		const guild = client.guilds.cache.get(config.guild);

		const notTicket = new MessageEmbed()
			.setColor(config.err_colour)
			.setAuthor(message.author.username, message.author.displayAvatarURL())
			.setTitle('❌ **Dit is geen ticket kanaal**')
			.setDescription('Gebruik deze opdracht in het ticketkanaal waarvan u een gebruiker wilt verwijderen, of vermeld het kanaal.')
			.addField('Gebruik', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
			.addField('Help', `Typ \`${config.prefix}help ${this.name}\` Voor meer informatie`)
			.setFooter(guild.name, guild.iconURL());

		let ticket;

		let channel = message.mentions.channels.first();

		if (!channel) {

			channel = message.channel;
			ticket = await Ticket.findOne({ where: { channel: message.channel.id } });
			if (!ticket)
				return message.channel.send(notTicket);

		} else {

			ticket = await Ticket.findOne({ where: { channel: channel.id } });
			if (!ticket) {
				notTicket
					.setTitle('❌ **Kanaal is geen ticket**')
					.setDescription(`${channel} Is geen ticket kanaal.`);
				return message.channel.send(notTicket);
			}
		}

		if (message.author.id !== ticket.creator && !message.member.roles.cache.has(config.staff_role)) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Geen premissies**')
					.setDescription(`U heeft geen toestemming om te wijzigen ${channel} omdat het niet van jou is en je geen personeel bent.`)
					.addField('Gebruik', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Help', `Type\`${config.prefix}help ${this.name}\`Voor meer informatie`)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		let member = guild.member(message.mentions.users.first() || guild.members.cache.get(args[0]));

		if (!member || member.id === message.author.id || member.id === guild.me.id)
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Onbekende gebruiker**')
					.setDescription('Vermeld een geldig lid.')
					.addField('Gebruik', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Help', `typ \`${config.prefix}help ${this.name}\` Voor meer informatie`)
					.setFooter(guild.name, guild.iconURL())
			);

		try {
			channel.updateOverwrite(member.user, {
				VIEW_CHANNEL: false,
				SEND_MESSAGES: false,
				ATTACH_FILES: false,
				READ_MESSAGE_HISTORY: false
			});

			if (channel.id !== message.channel.id) {
				channel.send(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(member.user.username, member.user.displayAvatarURL())
						.setTitle('**Gebruiker verwijdert**')
						.setDescription(`${member} is verwijdert door ${message.author}`)
						.setFooter(guild.name, guild.iconURL())
				);
			}

			message.channel.send(
				new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(member.user.username, member.user.displayAvatarURL())
					.setTitle('✅ **Gebruiker verwijdert**')
					.setDescription(`${member} is verwijderd uit <#${ticket.channel}>`)
					.setFooter(guild.name, guild.iconURL())
			);

			log.info(`${message.author.tag} heeft een gebruiker verwijderd van een ticket (#${message.channel.id})`);
		} catch (error) {
			log.error(error);
		}
	},
};
