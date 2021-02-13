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

        const categoryID = "809455152863117322";


        if (message.channel.parentID == categoryID) {

            var botEmbed = new discord.MessageEmbed()
            .setTitle('Claim')
            .setDescription(`${message.author} Heeft deze ticket Geclaimed`)
            .setThumbnail('')
            .setImage('')
            .setTimestamp()
            .setFooter('claim', '');
        
            message.channel.setTopic(` ${message.author}: Heeft deze ticket geclaimed`)    
        
        return message.channel.send(botEmbed);
        
            } else {
                
        
            message.channel.send("Gelieve dit command te doen bij een ticket.");
            }
        }

    }
