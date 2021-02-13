/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const Logger = require('leekslazylogger');
const log = new Logger();
const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const { join } = require('path');
const archive = require('../modules/archive');

module.exports = {
	name: 'close',
	description: 'Sluit een ticket; ofwel een gespecificeerd (genoemd) kanaal, of het kanaal waarin de opdracht wordt gebruikt.',
	usage: '[ticket]',
	aliases: ['none'],
	example: 'close #ticket-17',
	args: false,
	async execute(client, message, args, { config, Ticket }) {
		const guild = client.guilds.cache.get(config.guild);

		const notTicket = new MessageEmbed()
			.setColor(config.err_colour)
			.setAuthor(message.author.username, message.author.displayAvatarURL())
			.setTitle('❌ **Dit is geen\'ticket channel**')
			.setDescription('Gebruik deze opdracht in het ticketkanaal dat je wilt sluiten, of noem het kanaal.')
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
			if (!ticket) return message.channel.send(notTicket);
		} else {
			ticket = await Ticket.findOne({
				where: {
					channel: channel.id
				}
			});
			if (!ticket) {
				notTicket
					.setTitle('❌ **Kanaal is geen ticket**')
					.setDescription(`${channel} is geen ticket.`);
				return message.channel.send(notTicket);
			}

		}

		let paths = {
			text: join(__dirname, `../../user/transcripts/text/${ticket.get('channel')}.txt`),
			log: join(__dirname, `../../user/transcripts/raw/${ticket.get('channel')}.log`),
			json: join(__dirname, `../../user/transcripts/raw/entities/${ticket.get('channel')}.json`)
		};

		if (message.author.id !== ticket.creator && !message.member.roles.cache.has(config.staff_role))
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Geen premisies**')
					.setDescription(`Je hebt niet de premisie om ${channel} tesluiten omdat je geen staff bent`)
					.addField('gebruik', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Help', `Typ \`${config.prefix}help ${this.name}\` Voor meer informatie.`)
					.setFooter(guild.name, guild.iconURL())
			);

		
		if (config.commands.close.confirmation) {
			let success;
			let pre = fs.existsSync(paths.text) || fs.existsSync(paths.log)
				? `U kunt later een gearchiveerde versie bekijken met \`${config.prefix}transcript ${ticket.id}\``
				: '';
				
			let confirm = await message.channel.send(
				new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❔ Weet je het zeker?')
					.setDescription(`${pre}\n**Reageer met ✅ om te bevestigen**`)
					.setFooter(guild.name + ' | verloopt in 15 seconden', guild.iconURL())
			);

			await confirm.react('✅');

			const collector = confirm.createReactionCollector(
				(r, u) => r.emoji.name === '✅' && u.id === message.author.id, {
					time: 15000
				});

			collector.on('collect', async () => {
				if (channel.id !== message.channel.id) {
					channel.send(
						new MessageEmbed()
							.setColor(config.colour)
							.setAuthor(message.author.username, message.author.displayAvatarURL())
							.setTitle('**Ticket Gesloten**')
							.setDescription(`Ticket gesloten door ${message.author}`)
							.setFooter(guild.name, guild.iconURL())
					);
				}

				confirm.reactions.removeAll();
				confirm.edit(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle(`✅ **Ticket ${ticket.id} gesloten**`)
						.setDescription('Het kanaal wordt binnen enkele seconden automatisch verwijderd nadat de inhoud is gearchiveerd.')
						.setFooter(guild.name, guild.iconURL())
				);
				

				if (channel.id !== message.channel.id)
					message.delete({
						timeout: 5000
					}).then(() => confirm.delete());
				
				success = true;
				close();
			});


			collector.on('end', () => {
				if (!success) {
					confirm.reactions.removeAll();
					confirm.edit(
						new MessageEmbed()
							.setColor(config.err_colour)
							.setAuthor(message.author.username, message.author.displayAvatarURL())
							.setTitle('❌ **Verlopen**')
							.setDescription('Het duurde te lang voordat u reageerde; bevestiging mislukt.')
							.setFooter(guild.name, guild.iconURL()));

					message.delete({
						timeout: 10000
					}).then(() => confirm.delete());
				}
			});
		} else {
			close();
		}

		
		async function close () {
			let users = [];

			if (config.transcripts.text.enabled || config.transcripts.web.enabled) {
				let u = await client.users.fetch(ticket.creator);
				if (u) {
					let dm;
					try {
						dm = u.dmChannel || await u.createDM();
					} catch (e) {
						log.warn(`Kon geen ticket maken met ${u.tag}`);
					}

					let res = {};
					const embed = new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle(`Ticket ${ticket.id}`)
						.setFooter(guild.name, guild.iconURL());

					if (fs.existsSync(paths.text)) {
						embed.addField('Text transcript', 'Zie bij lage');
						res.files = [{
							attachment: paths.text,
							name: `ticket-${ticket.id}-${ticket.get('channel')}.txt`
						}];
					}

					if (fs.existsSync(paths.log) && fs.existsSync(paths.json)) {
						let data = JSON.parse(fs.readFileSync(paths.json));
						for (u in data.entities.users) users.push(u);
						embed.addField('Web archive', await archive.export(Ticket, channel)); // this will also delete these files
					}

					if (embed.fields.length < 1) {
						embed.setDescription(`Er zijn geen teksttranscripties of archiefgegevens voor ticket ${ticket.id}`);
					}

					res.embed = embed;

					try {
						if (config.commands.close.send_transcripts) dm.send(res);
						if (config.transcripts.channel.length > 1) client.channels.cache.get(config.transcripts.channel).send(res);
					} catch (e) {
						message.channel.send('❌Kon niet\' DM of transcript logbericht sturen.');
					}
				}
			}

			// update database
			ticket.update({
				open: false
			}, {
				where: {
					channel: channel.id
				}
			});

			// delete channel
			channel.delete({
				timeout: 5000
			});

			log.info(`${message.author.tag} gesloten ticket (#ticket-${ticket.id})`);

			if (config.logs.discord.enabled) {
				let embed = new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle(`Ticket ${ticket.id} closed`)
					.addField('Creator', `<@${ticket.creator}>`, true)
					.addField('Gesloten door', message.author, true)
					.setFooter(guild.name, guild.iconURL())
					.setTimestamp();

				if (users.length > 1)
					embed.addField('Members', users.map(u => `<@${u}>`).join('\n'));

				client.channels.cache.get(config.logs.discord.channel).send(embed);
			}
		}
	}
};
