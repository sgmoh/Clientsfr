const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { saveSetting } = require('../../utils/database');
const EMOJIS = require('../../utils/emojiConfig');

module.exports = {
  name: 'leave',
  description: 'Leave the voice channel',
  aliases: ['disconnect'],
  guildOnly: true,
  category: 'voice',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave the voice channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
  
  async execute(message, args, client) {
    // Check if the bot is in a voice channel
    const voiceConnection = client.voiceConnections.get(message.guild.id);
    
    if (!voiceConnection) {
      return message.reply('I\'m not in a voice channel!');
    }
    
    try {
      // Get channel name before disconnecting
      const channelId = voiceConnection.channelId;
      const channel = client.channels.cache.get(channelId);
      const channelName = channel ? channel.name : 'Voice Channel';
      
      // Destroy connection
      voiceConnection.connection.destroy();
      client.voiceConnections.delete(message.guild.id);
      
      // Remove from database
      saveSetting(message.guild.id, '24/7VoiceChannel', null);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${EMOJIS.MUTE} Voice Disconnection`)
        .setDescription(`Successfully left **${channelName}**!`)
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      // Send confirmation
      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error leaving voice channel: ${error}`);
      return message.reply(`Failed to leave voice channel: ${error.message}`);
    }
  },
  
  async executeSlash(interaction, client) {
    // Check if the bot is in a voice channel
    const voiceConnection = client.voiceConnections.get(interaction.guild.id);
    
    if (!voiceConnection) {
      return interaction.reply({
        content: 'I\'m not in a voice channel!',
        ephemeral: true
      });
    }
    
    try {
      // Get channel name before disconnecting
      const channelId = voiceConnection.channelId;
      const channel = client.channels.cache.get(channelId);
      const channelName = channel ? channel.name : 'Voice Channel';
      
      // Destroy connection
      voiceConnection.connection.destroy();
      client.voiceConnections.delete(interaction.guild.id);
      
      // Remove from database
      saveSetting(interaction.guild.id, '24/7VoiceChannel', null);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${EMOJIS.MUTE} Voice Disconnection`)
        .setDescription(`Successfully left **${channelName}**!`)
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      // Send confirmation
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error leaving voice channel: ${error}`);
      return interaction.reply({
        content: `Failed to leave voice channel: ${error.message}`,
        ephemeral: true
      });
    }
  }
};