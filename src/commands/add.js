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
	name: 'add',
	description: 'voeg iemand toe aan een ticket',
	usage: '<@member> [... #channel]',
	aliases: ['none'],
	example: 'add @member to #ticket-23',
	args: true,
	async execute(client, message, args, {config, Ticket}) {
		const guild = client.guilds.cache.get(config.guild);

		const notTicket = new MessageEmbed()
			.setColor(config.err_colour)
			.setAuthor(message.author.username, message.author.displayAvatarURL())
			.setTitle('❌ **Dit is\'geen ticket channel**')
			.setDescription('Gebruik deze commando voor het toevoegen van een persoon in een tic')
			.addField('Usage', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
			.addField('Help', `Typ \`${config.prefix}help ${this.name}\` Voor meer informatie`)
			.setFooter(guild.name, guild.iconURL());

		let ticket;

		let channel = message.mentions.channels.first();

		if (!channel) {
			channel = message.channel;
			ticket = await Ticket.findOne({ where: { channel: message.channel.id } });
			if (!ticket) return message.channel.send(notTicket);

		} else {
			ticket = await Ticket.findOne({ where: { channel: channel.id } });
			if (!ticket) {
				notTicket
					.setTitle('❌ **Deze channel is geen ticket**')
					.setDescription(`${channel} is geen ticket.`);
				return message.channel.send(notTicket);
			}
		}

		if (message.author.id !== ticket.creator && !message.member.roles.cache.has(config.staff_role)) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Geen premisie**')
					.setDescription(`U heeft geen toestemming om te wijzigen ${channel} omdat het niet van jou is en je geen personeel bent.`)
					.addField('Gebruik', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Help', `Type \`${config.prefix}help ${this.name}\` voor meer informatie`)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		let member = guild.member(message.mentions.users.first() || guild.members.cache.get(args[0]));

		if (!member) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Onbekende gebruiker**')
					.setDescription('Vermeld een geldig lid.')
					.addField('gebruik', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Help', `Typ \`${config.prefix}help ${this.name}\` Voor meer informatie`)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		try {
			channel.updateOverwrite(member.user, {
				VIEW_CHANNEL: true,
				SEND_MESSAGES: true,
				ATTACH_FILES: true,
				READ_MESSAGE_HISTORY: true
			});

			if (channel.id !== message.channel.id) {
				channel.send(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(member.user.username, member.user.displayAvatarURL())
						.setTitle('**gebruiker toegevoegt**')
						.setDescription(`${member} is toegevoegt aan ${message.author}`)
						.setFooter(guild.name, guild.iconURL())
				);
			}

			message.channel.send(
				new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(member.user.username, member.user.displayAvatarURL())
					.setTitle('✅ **Lid toegevoegd**')
					.setDescription(`${member} is toegevoegd aan <#${ticket.channel}>`)
					.setFooter(guild.name, guild.iconURL())
			);

			log.info(`${message.author.tag} gebruiker toegevoegd aan ticket (#${message.channel.id})`);
		} catch (error) {
			log.error(error);
		}
		// command ends here
	},
};
