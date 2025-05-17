const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ping',
  description: 'Check the bot\'s latency',
  aliases: ['latency'],
  category: 'general',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot\'s latency'),
  
  async execute(message, args, client) {
    // Send initial message
    const sentMessage = await message.reply('Pinging...');
    
    // Calculate ping
    const pingLatency = sentMessage.createdTimestamp - message.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'Bot Latency', value: `${pingLatency}ms`, inline: true },
        { name: 'API Latency', value: `${apiLatency}ms`, inline: true }
      )
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Edit original message
    await sentMessage.edit({ content: null, embeds: [embed] });
  },
  
  async executeSlash(interaction, client) {
    // Send initial message
    await interaction.deferReply();
    
    // Calculate ping
    const pingLatency = Date.now() - interaction.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'Bot Latency', value: `${pingLatency}ms`, inline: true },
        { name: 'API Latency', value: `${apiLatency}ms`, inline: true }
      )
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Send response
    await interaction.editReply({ embeds: [embed] });
  }
};
