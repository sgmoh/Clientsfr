const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { saveSetting } = require('../../utils/database');
const EMOJIS = require('../../utils/emojiConfig');

module.exports = {
  name: 'leave',
  description: 'Leave the voice channel and stop 24/7 connection',
  aliases: ['disconnect'],
  guildOnly: true,
  category: 'voice',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave the voice channel and stop 24/7 connection')
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
  
  async execute(message, args, client) {
    // Check if the bot is in a voice channel
    const voiceConnection = client.voiceConnections.get(message.guild.id);
    const connection = getVoiceConnection(message.guild.id);
    
    if (!connection && !voiceConnection) {
      return message.reply('I\'m not connected to any voice channel!');
    }
    
    try {
      // Destroy the connection
      if (connection) connection.destroy();
      
      // Clear from client tracking
      if (voiceConnection) {
        if (voiceConnection.player) {
          voiceConnection.player.stop();
        }
        if (voiceConnection.connection) {
          voiceConnection.connection.destroy();
        }
        client.voiceConnections.delete(message.guild.id);
      }
      
      // Remove from database
      saveSetting(message.guild.id, '24/7VoiceChannel', null);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#FF5555')
        .setTitle(`${EMOJIS.LEAVE} Voice Disconnection`)
        .setDescription('Successfully left the voice channel and disabled 24/7 connection.')
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
    const connection = getVoiceConnection(interaction.guild.id);
    
    if (!connection && !voiceConnection) {
      return interaction.reply({
        content: 'I\'m not connected to any voice channel!',
        ephemeral: true
      });
    }
    
    try {
      // Destroy the connection
      if (connection) connection.destroy();
      
      // Clear from client tracking
      if (voiceConnection) {
        if (voiceConnection.player) {
          voiceConnection.player.stop();
        }
        if (voiceConnection.connection) {
          voiceConnection.connection.destroy();
        }
        client.voiceConnections.delete(interaction.guild.id);
      }
      
      // Remove from database
      saveSetting(interaction.guild.id, '24/7VoiceChannel', null);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#FF5555')
        .setTitle(`${EMOJIS.LEAVE} Voice Disconnection`)
        .setDescription('Successfully left the voice channel and disabled 24/7 connection.')
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