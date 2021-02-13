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

module.exports = {
	name: 'help',
	description: 'Helpmenu weergeven',
	usage: '[command]',
	aliases: ['command', 'commands'],
	example: 'help new',
	args: false,
	execute(client, message, args, {config}) {
		const guild = client.guilds.cache.get(config.guild);

		const commands = Array.from(client.commands.values());

		if (!args.length) {
			let cmds = [];

			for (let command of commands) {
				if (command.hide || command.disabled) continue;
				if (command.permission && !message.member.hasPermission(command.permission)) continue;

				let desc = command.description;

				if (desc.length > 50) desc = desc.substring(0, 50) + '...';
				cmds.push(`**${config.prefix}${command.name}** **·** ${desc}`);
			}

			message.channel.send(
				new MessageEmbed()
					.setTitle('Commands')
					.setColor(config.colour)
					.setDescription(
						`\nDe opdrachten waartoe u toegang hebt, worden hieronder vermeld. Type \`${config.prefix}help [commando]\ voor meer informatie over een specifiek commando.
						\n${cmds.join('\n\n')}
						\nNeem contact op met **Raymond#1362** voor bugs of problemen`
					)
					.setFooter(guild.name, guild.iconURL())
			).catch((error) => {
				log.warn('Could not send help menu');
				log.error(error);
			});

		} else {
			const name = args[0].toLowerCase();
			const command = client.commands.get(name) || client.commands.find(c => c.aliases && c.aliases.includes(name));

			if (!command)
				return message.channel.send(
					new MessageEmbed()
						.setColor(config.err_colour)
						.setDescription(`❌ **Ongeldig command naam** (\`${config.prefix}help\`)`)
				);


			const cmd = new MessageEmbed()
				.setColor(config.colour)
				.setTitle(command.name);


			if (command.long) cmd.setDescription(command.long);
			else cmd.setDescription(command.description);

			if (command.aliases) cmd.addField('Aliases', `\`${command.aliases.join(', ')}\``, true);

			if (command.usage) cmd.addField('Usage', `\`${config.prefix}${command.name} ${command.usage}\``, false);

			if (command.usage) cmd.addField('Example', `\`${config.prefix}${command.example}\``, false);


			if (command.permission && !message.member.hasPermission(command.permission)) {
				cmd.addField('Vereiste toestemming', `\`${command.permission}\` :uitroep: U heeft geen toestemming om dit commando te gebruiken`, true);
			} else cmd.addField('Vereiste toestemming', `\`${command.permission || 'none'}\``, true);

			message.channel.send(cmd);
		}

		// command ends here
	},
};