/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const Logger = require('leekslazylogger');
const log = new Logger();
const {
	MessageEmbed
} = require('discord.js');
const fs = require('fs');
const { join } = require('path');

module.exports = {
	name: 'verwijder',
	description: 'Verwijder een ticket. Vergelijkbaar met het sluiten van een ticket, maar slaat geen transcriptie of archieven op.',
	usage: '[ticket]',
	aliases: ['ver'],
	example: 'verwijder #ticket-17',
	args: false,
	async execute(client, message, args, {
		config,
		Ticket
	}) {
		const guild = client.guilds.cache.get(config.guild);

		const notTicket = new MessageEmbed()
			.setColor(config.err_colour)
			.setAuthor(message.author.username, message.author.displayAvatarURL())
			.setTitle('❌ **dit is geen\' ticket kanaal**')
			.setDescription('Gebruik deze opdracht in het ticketkanaal dat u wilt verwijderen, of vermeld het kanaal.')
			.addField('Gebruik', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
			.addField('Help', `Typ \`${config.prefix}help ${this.name}\` Voor meer informatie`)
			.setFooter(guild.name, guild.iconURL());

		let ticket;
		let channel = message.mentions.channels.first();
		// || client.channels.resolve(await Ticket.findOne({ where: { id: args[0] } }).channel) // channels.fetch()

		if (!channel) {
			channel = message.channel;

			ticket = await Ticket.findOne({
				where: {
					channel: channel.id
				}
			});
			if (!ticket) return channel.send(notTicket);

		} else {
			ticket = await Ticket.findOne({
				where: {
					channel: channel.id
				}
			});
			if (!ticket) {
				notTicket
					.setTitle('❌ **Kanaal is geen ticket**')
					.setDescription(`${channel}is geen ticket kanaal.`);
				return message.channel.send(notTicket);
			}

		}
		if (message.author.id !== ticket.creator && !message.member.roles.cache.has(config.staff_role))
			return channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Geen premisie**')
					.setDescription(`U bent niet gemachtigd om te verwijderen ${channel} omdat het niet van jou is en je geen Staff bent.`)
					.addField('Gebruik', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Help', `Typ \`${config.prefix}help ${this.name}\` Voor meer informatie.`)
					.setFooter(guild.name, guild.iconURL())
			);

		
		if (config.commands.delete.confirmation) {
			let success;
			let confirm = await message.channel.send(
				new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❔ Are you sure?')
					.setDescription(
						`	: waarschuwing: Deze actie is ** onomkeerbaar **, het ticket wordt volledig uit de database verwijderd.
						Je kunt ** niet ** later een transcript / archief van het kanaal bekijken.
						gebruik \`close\`commando in plaats daarvan als u dit gedrag niet wilt.\n**reageer met ✅ om te bevestigen.**`)
					.setFooter(guild.name + ' | Expires in 15 seconds', guild.iconURL())
			);

			await confirm.react('✅');

			const collector = confirm.createReactionCollector(
				(r, u) => r.emoji.name === '✅' && u.id === message.author.id, {
					time: 15000
				});

			collector.on('collect', async () => {
				if (channel.id !== message.channel.id)
					channel.send(
						new MessageEmbed()
							.setColor(config.colour)
							.setAuthor(message.author.username, message.author.displayAvatarURL())
							.setTitle('**Ticket verwijdert**')
							.setDescription(`Ticket verwijdert door ${message.author}`)
							.setFooter(guild.name, guild.iconURL())
					);

				confirm.reactions.removeAll();
				confirm.edit(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle(`✅ **Ticket ${ticket.id} Verwijdert**`)
						.setDescription('Het kanaal wordt binnen enkele seconden automatisch verwijderd.')
						.setFooter(guild.name, guild.iconURL())
				);

				if (channel.id !== message.channel.id)
					message.delete({
						timeout: 5000
					}).then(() => confirm.delete());

				success = true;
				del();
			});

			collector.on('end', () => {
				if (!success) {
					confirm.reactions.removeAll();
					confirm.edit(
						new MessageEmbed()
							.setColor(config.err_colour)
							.setAuthor(message.author.username, message.author.displayAvatarURL())
							.setTitle('❌ **Verlopen**')
							.setDescription('Het duurde te lang tot reactie.')
							.setFooter(guild.name, guild.iconURL()));

					message.delete({
						timeout: 10000
					}).then(() => confirm.delete());
				}
			});
		} else {
			del();
		}


		async function del () {
			let txt = join(__dirname, `../../user/transcripts/text/${ticket.get('channel')}.txt`),
				raw = join(__dirname, `../../user/transcripts/raw/${ticket.get('channel')}.log`),
				json = join(__dirname, `../../user/transcripts/raw/entities/${ticket.get('channel')}.json`);

			if (fs.existsSync(txt)) fs.unlinkSync(txt);
			if (fs.existsSync(raw)) fs.unlinkSync(raw);
			if (fs.existsSync(json)) fs.unlinkSync(json);

			// update database
			ticket.destroy(); // remove ticket from database

			// channel
			channel.delete({
				timeout: 5000
			});


			log.info(`${message.author.tag} deleted a ticket (#ticket-${ticket.id})`);

			if (config.logs.discord.enabled) {
				client.channels.cache.get(config.logs.discord.channel).send(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle('Ticket verwijdert')
						.addField('Creator', `<@${ticket.creator}>`, true)
						.addField('Verwijdert door', message.author, true)
						.setFooter(guild.name, guild.iconURL())
						.setTimestamp()
				);
			}
		}
		
	}
};