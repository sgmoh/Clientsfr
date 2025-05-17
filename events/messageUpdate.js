// Message update event handler
const { EmbedBuilder } = require('discord.js');
const { getSetting } = require('../utils/database');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage, client) {
    try {
      // Skip if the message is from a bot or in a DM
      if (oldMessage.author?.bot || !oldMessage.guild) return;
      
      // Skip if content hasn't changed or there is no content
      if (oldMessage.content === newMessage.content || !oldMessage.content) return;
      
      // Get the logs channel
      const logsChannelId = getSetting(oldMessage.guild.id, 'logsChannel');
      if (!logsChannelId) return;
      
      const logsChannel = oldMessage.guild.channels.cache.get(logsChannelId);
      if (!logsChannel) return;
      
      // Truncate message content if needed
      const oldContent = oldMessage.content.length > 1024 
        ? oldMessage.content.slice(0, 1021) + '...' 
        : oldMessage.content;
        
      const newContent = newMessage.content.length > 1024 
        ? newMessage.content.slice(0, 1021) + '...' 
        : newMessage.content;
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('✏️ Message Edited')
        .setDescription(`A message by **${oldMessage.author.tag}** was edited in ${oldMessage.channel}.`)
        .addFields(
          { name: 'Before', value: oldContent || 'No content' },
          { name: 'After', value: newContent || 'No content' },
          { name: 'Channel', value: `${oldMessage.channel.name} (${oldMessage.channel.id})`, inline: true },
          { name: 'Author ID', value: oldMessage.author.id, inline: true },
          { name: 'Message Link', value: `[Click to Jump](${newMessage.url})`, inline: true }
        )
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      logsChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error(`Error handling message update: ${error}`);
    }
  },
};