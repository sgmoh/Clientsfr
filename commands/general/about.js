const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');
const EMOJIS = require('../../utils/emojiConfig');

module.exports = {
  name: 'about',
  description: 'Shows information about the bot',
  aliases: ['botinfo', 'info'],
  category: 'general',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Shows information about the bot'),
  
  async execute(message, args, client) {
    const embed = this.createAboutEmbed(client);
    return message.reply({ embeds: [embed] });
  },
  
  async executeSlash(interaction, client) {
    const embed = this.createAboutEmbed(client);
    return interaction.reply({ embeds: [embed] });
  },
  
  createAboutEmbed(client) {
    // Calculate uptime
    const uptime = this.formatUptime(client.uptime);
    
    // Create the embed
    const embed = new EmbedBuilder()
      .setColor('#00AA00')
      .setTitle(`${EMOJIS.HELP} About ${client.user.username}`)
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: `${EMOJIS.LOGS} Bot Stats`, value: 
          `**Servers:** ${client.guilds.cache.size}\n` +
          `**Users:** ${client.users.cache.size}\n` +
          `**Channels:** ${client.channels.cache.size}\n` +
          `**Commands:** ${client.commands.size}\n` +
          `**Uptime:** ${uptime}`
        },
        { name: `${EMOJIS.MULTIPURPOSE} Version Info`, value: 
          `**Discord.js:** v${version}\n` +
          `**Node.js:** ${process.version}`
        },
        { name: `${EMOJIS.HELP} Need help?`, value: 
          `Use \`.help\` to see all available commands.\n` +
          `Use \`.customize view\` to see all custom emojis.`
        }
      )
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return embed;
  },
  
  formatUptime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    const parts = [];
    if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
    if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`);
    
    return parts.join(', ');
  }
};