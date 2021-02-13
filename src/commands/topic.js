/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'topic',
	description: 'verander de ticket topic',
	usage: '<topic>',
	aliases: ['edit'],
	example: 'topic heeft hulp nodig',
	args: true,
	async execute(client, message, args, {config, Ticket}) {
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
					.setDescription('Gebruik deze opdracht in het ticketkanaal dat je wilt sluiten, of noem het kanaal.')
					.addField('gebruik', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Help', `Typ \`${config.prefix}help ${this.name}\` Voor meer informatie`)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		let topic = args.join(' ');
		if (topic.length > 256) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Beschrijving te lang**')
					.setDescription('Beperk uw ticketonderwerp tot minder dan 256 tekens. Een korte zin is voldoende.')
					.setFooter(guild.name, guild.iconURL())
			);
		}

		message.channel.setTopic(`<@${ticket.creator}> | ` + topic);

		Ticket.update({
			topic: topic
		}, {
			where: {
				channel: message.channel.id
			}
		});

		message.channel.send(
			new MessageEmbed()
				.setColor(config.colour)
				.setAuthor(message.author.username, message.author.displayAvatarURL())
				.setTitle('✅ **Ticket bijgewerkt**')
				.setDescription('Het onderwerp is gewijzigd.')
				.setFooter(client.user.username, client.user.displayAvatarURL())
		);
	}
};