const { EmbedBuilder } = require('discord.js');
const { getSetting } = require('../utils/database');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member, client) {
    // Check if welcome messages are configured for this guild
    const channelId = getSetting(member.guild.id, 'welcomeChannelId');
    const welcomeMessage = getSetting(member.guild.id, 'welcomeMessage');
    
    if (!channelId || !welcomeMessage) return;
    
    // Get the welcome channel
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;
    
    try {
      // Replace placeholders in the message
      const formattedMessage = welcomeMessage
        .replace(/{user}/g, member.toString())
        .replace(/{username}/g, member.user.username)
        .replace(/{server}/g, member.guild.name);
      
      // Create welcome embed
      const welcomeEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Welcome to the Server!')
        .setDescription(formattedMessage)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Developed by gh_sman • Member #${member.guild.memberCount}` })
        .setTimestamp();
      
      // Send the welcome message
      await channel.send({ embeds: [welcomeEmbed] });
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  }
};