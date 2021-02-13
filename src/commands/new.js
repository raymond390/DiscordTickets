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
const config = require(join(__dirname, '../../user/', require('../').config));

module.exports = {
	name: 'new',
	description: 'Maak een nieuw supportticket aan',
	usage: '[korte beschrijving]',
	aliases: ['ticket', 'open'],
	example: 'new ik heb een probleem',
	args: false,
	disabled: !config.commands.new.enabled,
	async execute(client, message, args, {config, Ticket}) {

		if (!config.commands.new.enabled) return; // stop if the command is disabled


		const guild = client.guilds.cache.get(config.guild);

		const supportRole = guild.roles.cache.get(config.staff_role);
		
		if (!supportRole)
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setTitle('❌ **Error**')
					.setDescription(`${config.name} is niet correct ingesteld. Kan geen rol 'staffteam' vinden met de id \`${config.staff_role}\``)
					.setFooter(guild.name, guild.iconURL())
			);


		let tickets = await Ticket.findAndCountAll({
			where: {
				creator: message.author.id,
				open: true
			},
			limit: config.tickets.max
		});

		if (tickets.count >= config.tickets.max) {
			let ticketList = [];
			for (let t in tickets.rows) {
				let desc = tickets.rows[t].topic.substring(0, 30);
				ticketList
					.push(`<#${tickets.rows[t].channel}>: \`${desc}${desc.length > 30 ? '...' : ''}\``);
			}

			let m = await message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle(`❌ **Je hebt al ${tickets.count} of meer openstaande tickets**`)
					.setDescription(`gebruik \`${config.prefix}close\` om onnodige tickets te sluiten.\n\n${ticketList.join(',\n')}`)
					.setFooter(guild.name + ' | Dit bericht wordt binnen 15 seconden verwijderd', guild.iconURL())
			);

			return setTimeout(async () => {
				await message.delete();
				await m.delete();
			}, 15000);
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
		else if (topic.length < 1) {
			topic = config.tickets.default_topic.command;
		}

		let ticket = await Ticket.create({
			channel: '',
			creator: message.author.id,
			open: true,
			archived: false,
			topic: topic
		});

		let name = 'ticket-' + ticket.get('id');

		guild.channels.create(name, {
			type: 'text',
			topic: `${message.author} | ${topic}`,
			parent: config.tickets.category,
			permissionOverwrites: [{
				id: guild.roles.everyone,
				deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
			},
			{
				id: client.user,
				allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY']
			},
			{
				id: message.member,
				allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY']
			},
			{
				id: supportRole,
				allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY']
			}
			],
			reason: 'User requested a new support ticket channel'
		}).then(async c => {

			Ticket.update({
				channel: c.id
			}, {
				where: {
					id: ticket.id
				}
			});

			let m = await message.channel.send(
				new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('✅ **Ticket aangemaakt**')
					.setDescription(`Je ticket is aangemaakt: ${c}`)
					.setFooter(client.user.username + ' | Dit bericht wordt binnen 15 seconden verwijderd', client.user.displayAvatarURL())
			);

			setTimeout(async () => {
				await message.delete();
				await m.delete();
			}, 15000);

			// require('../modules/archive').create(client, c); // create files

			let ping;
			switch (config.tickets.ping) {
			case 'staff':
				ping = `<@&${config.staff_role}>,\n`;
				break;
			case false:
				ping = '';
				break;
			default:
				ping = `@${config.tickets.ping},\n`;
			}

			await c.send(ping + `${message.author} heeft een nieuwe ticket gemaakt`);

			if (config.tickets.send_img) {
				const images = fs.readdirSync(join(__dirname, '../../user/images'));
				await c.send({
					files: [
						join(__dirname, '../../user/images', images[Math.floor(Math.random() * images.length)])
					]
				});
			}

			let text = config.tickets.text
				.replace(/{{ ?name ?}}/gmi, message.author.username)
				.replace(/{{ ?(tag|mention) ?}}/gmi, message.author);


			let w = await c.send(
				new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setDescription(text)
					.addField('Topic', `\`${topic}\``)
					.setFooter(guild.name, guild.iconURL())
			);

			if (config.tickets.pin) await w.pin();
			// await w.pin().then(m => m.delete()); // oopsie, this deletes the pinned message

			if (config.logs.discord.enabled)
				client.channels.cache.get(config.logs.discord.channel).send(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle('New ticket')
						.setDescription(`\`${topic}\``)
						.addField('Creator', message.author, true)
						.addField('kanaal', c, true)
						.setFooter(guild.name, guild.iconURL())
						.setTimestamp()
				);

			log.info(`${message.author.tag} Maakte een nieuwe ticket (#${name})`);


		}).catch(log.error);

	},
};
