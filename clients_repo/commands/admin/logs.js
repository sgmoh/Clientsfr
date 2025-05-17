const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { saveSetting, getSetting } = require('../../utils/database');

module.exports = {
  name: 'logs',
  description: 'Set up server logs',
  usage: '<channel/disable>',
  aliases: ['logging', 'log'],
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  category: 'admin',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Set up server logs')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set the channel for server logs')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('The channel to send logs to')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View the current logs channel'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Disable server logs'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  async execute(message, args, client) {
    // Check if a channel was specified
    if (!args.length) {
      return this.viewLogsChannel(message, client);
    }
    
    // Handle disable option
    if (args[0].toLowerCase() === 'disable') {
      return this.disableLogs(message);
    }
    
    // Get the channel mention or ID
    const channelIdentifier = args[0];
    let channel;
    
    if (message.mentions.channels.size) {
      channel = message.mentions.channels.first();
    } else {
      channel = message.guild.channels.cache.find(c => 
        c.id === channelIdentifier || 
        c.name.toLowerCase() === channelIdentifier.toLowerCase()
      );
    }
    
    // Check if channel exists
    if (!channel || channel.type !== ChannelType.GuildText) {
      return message.reply('❌ Please specify a valid text channel for logging.');
    }
    
    // Check if bot can send messages in the channel
    const permissions = channel.permissionsFor(message.guild.members.me);
    if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.ViewChannel)) {
      return message.reply(`⚠️ I don't have permission to send messages in ${channel}. Please adjust my permissions.`);
    }
    
    // Set the logs channel
    saveSetting(message.guild.id, 'logsChannel', channel.id);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle('✅ Logs Channel Set')
      .setDescription(`Server logs will now be sent to ${channel}.`)
      .addFields({
        name: 'Logged Events',
        value: '• Member joins/leaves\n• Messages deleted/edited\n• Role changes\n• Channel updates\n• Moderation actions'
      })
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  },
  
  async executeSlash(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'view') {
      return this.viewLogsChannelInteraction(interaction, client);
    } else if (subcommand === 'disable') {
      return this.disableLogsInteraction(interaction);
    } else if (subcommand === 'set') {
      // Get the specified channel
      const channel = interaction.options.getChannel('channel');
      
      // Check if channel is a text channel
      if (channel.type !== ChannelType.GuildText) {
        return interaction.reply({
          content: '❌ Please specify a valid text channel for logging.',
          ephemeral: true
        });
      }
      
      // Check if bot can send messages in the channel
      const permissions = channel.permissionsFor(interaction.guild.members.me);
      if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.ViewChannel)) {
        return interaction.reply({
          content: `⚠️ I don't have permission to send messages in ${channel}. Please adjust my permissions.`,
          ephemeral: true
        });
      }
      
      // Set the logs channel
      saveSetting(interaction.guild.id, 'logsChannel', channel.id);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('✅ Logs Channel Set')
        .setDescription(`Server logs will now be sent to ${channel}.`)
        .addFields({
          name: 'Logged Events',
          value: '• Member joins/leaves\n• Messages deleted/edited\n• Role changes\n• Channel updates\n• Moderation actions'
        })
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
  },
  
  // Helper method to view the current logs channel
  async viewLogsChannel(message, client) {
    const channelId = getSetting(message.guild.id, 'logsChannel');
    
    if (!channelId) {
      return message.reply('⚠️ Server logs are not currently enabled for this server.');
    }
    
    const channel = message.guild.channels.cache.get(channelId);
    
    if (!channel) {
      // Channel no longer exists
      saveSetting(message.guild.id, 'logsChannel', null);
      return message.reply('⚠️ The previously set logs channel no longer exists. Logging has been disabled.');
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#3498DB')
      .setTitle('🔍 Server Logs Information')
      .setDescription(`Server logs are currently being sent to ${channel}.`)
      .addFields({
        name: 'Logged Events',
        value: '• Member joins/leaves\n• Messages deleted/edited\n• Role changes\n• Channel updates\n• Moderation actions'
      })
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  },
  
  // Helper method to view logs channel with slash command
  async viewLogsChannelInteraction(interaction, client) {
    const channelId = getSetting(interaction.guild.id, 'logsChannel');
    
    if (!channelId) {
      return interaction.reply({
        content: '⚠️ Server logs are not currently enabled for this server.',
        ephemeral: true
      });
    }
    
    const channel = interaction.guild.channels.cache.get(channelId);
    
    if (!channel) {
      // Channel no longer exists
      saveSetting(interaction.guild.id, 'logsChannel', null);
      return interaction.reply({
        content: '⚠️ The previously set logs channel no longer exists. Logging has been disabled.',
        ephemeral: true
      });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#3498DB')
      .setTitle('🔍 Server Logs Information')
      .setDescription(`Server logs are currently being sent to ${channel}.`)
      .addFields({
        name: 'Logged Events',
        value: '• Member joins/leaves\n• Messages deleted/edited\n• Role changes\n• Channel updates\n• Moderation actions'
      })
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
  },
  
  // Helper method to disable logs
  async disableLogs(message) {
    const currentChannelId = getSetting(message.guild.id, 'logsChannel');
    
    if (!currentChannelId) {
      return message.reply('⚠️ Server logs are already disabled for this server.');
    }
    
    // Disable logs
    saveSetting(message.guild.id, 'logsChannel', null);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('🚫 Server Logs Disabled')
      .setDescription('Server logs have been disabled. No more events will be logged.')
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  },
  
  // Helper method to disable logs with slash command
  async disableLogsInteraction(interaction) {
    const currentChannelId = getSetting(interaction.guild.id, 'logsChannel');
    
    if (!currentChannelId) {
      return interaction.reply({
        content: '⚠️ Server logs are already disabled for this server.',
        ephemeral: true
      });
    }
    
    // Disable logs
    saveSetting(interaction.guild.id, 'logsChannel', null);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('🚫 Server Logs Disabled')
      .setDescription('Server logs have been disabled. No more events will be logged.')
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
  }
};