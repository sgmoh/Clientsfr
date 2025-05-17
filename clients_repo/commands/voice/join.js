const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, AudioPlayerStatus } = require('@discordjs/voice');
const { saveSetting } = require('../../utils/database');

module.exports = {
  name: 'join',
  description: 'Join a voice channel and stay connected 24/7',
  aliases: ['connect'],
  guildOnly: true,
  category: 'voice',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join a voice channel and stay connected 24/7')
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
  
  async execute(message, args, client) {
    // Check if user is in a voice channel
    const voiceChannel = message.member.voice.channel;
    
    if (!voiceChannel) {
      return message.reply('You need to be in a voice channel first!');
    }
    
    // Check for permissions
    const permissions = voiceChannel.permissionsFor(client.user);
    
    if (!permissions.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak)) {
      return message.reply('I need permissions to join and speak in your voice channel!');
    }
    
    try {
      // Create connection
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: false
      });
      
      // Create a silent audio player to keep the connection alive
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      });
      
      // Subscribe to the player
      connection.subscribe(player);
      
      // Store connection in the client
      client.voiceConnections.set(message.guild.id, {
        connection,
        player,
        channelId: voiceChannel.id
      });
      
      // Save voice channel ID to database
      saveSetting(message.guild.id, '24/7VoiceChannel', voiceChannel.id);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🔊 Voice Connection')
        .setDescription(`Successfully joined **${voiceChannel.name}** and will stay connected 24/7!`)
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      // Send confirmation
      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error joining voice channel: ${error}`);
      return message.reply(`Failed to join voice channel: ${error.message}`);
    }
  },
  
  async executeSlash(interaction, client) {
    // Check if user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    
    if (!voiceChannel) {
      return interaction.reply({
        content: 'You need to be in a voice channel first!',
        ephemeral: true
      });
    }
    
    // Check for permissions
    const permissions = voiceChannel.permissionsFor(client.user);
    
    if (!permissions.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak)) {
      return interaction.reply({
        content: 'I need permissions to join and speak in your voice channel!',
        ephemeral: true
      });
    }
    
    try {
      // Create connection
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: false
      });
      
      // Create a silent audio player to keep the connection alive
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      });
      
      // Subscribe to the player
      connection.subscribe(player);
      
      // Store connection in the client
      client.voiceConnections.set(interaction.guild.id, {
        connection,
        player,
        channelId: voiceChannel.id
      });
      
      // Save voice channel ID to database
      saveSetting(interaction.guild.id, '24/7VoiceChannel', voiceChannel.id);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🔊 Voice Connection')
        .setDescription(`Successfully joined **${voiceChannel.name}** and will stay connected 24/7!`)
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      // Send confirmation
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error joining voice channel: ${error}`);
      return interaction.reply({
        content: `Failed to join voice channel: ${error.message}`,
        ephemeral: true
      });
    }
  }
};
