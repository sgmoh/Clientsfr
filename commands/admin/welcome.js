const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { saveSetting, getSetting } = require('../../utils/database');
const EMOJIS = require('../../utils/emojiConfig');

module.exports = {
  name: 'welcome',
  description: 'Configure welcome messages for new members',
  usage: '<set/disable> [channel] [message]',
  aliases: ['welcomemsg', 'greeting'],
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  category: 'admin',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Configure welcome messages for new members')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set the welcome channel and message')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('The channel to send welcome messages to')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('message')
            .setDescription('Custom welcome message. Use {user} for mention, {username} for name, {server} for server name')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('test')
        .setDescription('Test the welcome message'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Disable welcome messages'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current welcome message settings'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  async execute(message, args, client) {
    if (!args.length) {
      return this.viewSettings(message);
    }
    
    const action = args[0].toLowerCase();
    
    switch (action) {
      case 'set':
        if (args.length < 3 || !message.mentions.channels.size) {
          return message.reply('Please provide a channel mention and welcome message. Example: `welcome set #welcome Welcome {user} to {server}!`');
        }
        return this.setWelcome(message, message.mentions.channels.first(), args.slice(2).join(' '));
        
      case 'test':
        return this.testWelcome(message, client);
        
      case 'disable':
        return this.disableWelcome(message);
        
      case 'view':
        return this.viewSettings(message);
        
      default:
        return message.reply('Invalid option. Use `set`, `test`, `disable`, or `view`.');
    }
  },
  
  async executeSlash(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'set':
        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message');
        return this.setWelcomeInteraction(interaction, channel, message);
        
      case 'test':
        return this.testWelcomeInteraction(interaction, client);
        
      case 'disable':
        return this.disableWelcomeInteraction(interaction);
        
      case 'view':
        return this.viewSettingsInteraction(interaction);
    }
  },
  
  async setWelcome(message, channel, welcomeMessage) {
    // Check if channel is a text channel
    if (channel.type !== 0) {
      return message.reply('Please provide a text channel for welcome messages.');
    }
    
    // Save settings to database
    saveSetting(message.guild.id, 'welcomeChannelId', channel.id);
    saveSetting(message.guild.id, 'welcomeMessage', welcomeMessage);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(`${EMOJIS.JOINLEAVE} Welcome Message Configured`)
      .setDescription('Welcome messages have been set up successfully!')
      .addFields(
        { name: 'Channel', value: channel.toString() },
        { name: 'Message', value: welcomeMessage }
      )
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  },
  
  async setWelcomeInteraction(interaction, channel, welcomeMessage) {
    // Check if channel is a text channel
    if (channel.type !== 0) {
      return interaction.reply({
        content: 'Please provide a text channel for welcome messages.',
        ephemeral: true
      });
    }
    
    // Save settings to database
    saveSetting(interaction.guild.id, 'welcomeChannelId', channel.id);
    saveSetting(interaction.guild.id, 'welcomeMessage', welcomeMessage);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(`${EMOJIS.JOINLEAVE} Welcome Message Configured`)
      .setDescription('Welcome messages have been set up successfully!')
      .addFields(
        { name: 'Channel', value: channel.toString() },
        { name: 'Message', value: welcomeMessage }
      )
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
  },
  
  async testWelcome(message, client) {
    // Get settings from database
    const channelId = getSetting(message.guild.id, 'welcomeChannelId');
    const welcomeMessage = getSetting(message.guild.id, 'welcomeMessage');
    
    if (!channelId || !welcomeMessage) {
      return message.reply('Welcome messages are not configured yet. Use `welcome set` first.');
    }
    
    // Get channel
    const channel = message.guild.channels.cache.get(channelId);
    if (!channel) {
      return message.reply('The configured welcome channel no longer exists. Please set a new one.');
    }
    
    // Replace placeholders in message
    const formattedMessage = welcomeMessage
      .replace(/{user}/g, message.author.toString())
      .replace(/{username}/g, message.author.username)
      .replace(/{server}/g, message.guild.name);
    
    // Create welcome embed
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Welcome to the Server!')
      .setDescription(formattedMessage)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Developed by gh_sman • Member #${message.guild.memberCount}` })
      .setTimestamp();
    
    // Send test message
    await channel.send({ embeds: [welcomeEmbed] });
    
    return message.reply(`Test welcome message sent to ${channel.toString()}`);
  },
  
  async testWelcomeInteraction(interaction, client) {
    // Get settings from database
    const channelId = getSetting(interaction.guild.id, 'welcomeChannelId');
    const welcomeMessage = getSetting(interaction.guild.id, 'welcomeMessage');
    
    if (!channelId || !welcomeMessage) {
      return interaction.reply({
        content: 'Welcome messages are not configured yet. Use `/welcome set` first.',
        ephemeral: true
      });
    }
    
    // Get channel
    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
      return interaction.reply({
        content: 'The configured welcome channel no longer exists. Please set a new one.',
        ephemeral: true
      });
    }
    
    // Replace placeholders in message
    const formattedMessage = welcomeMessage
      .replace(/{user}/g, interaction.user.toString())
      .replace(/{username}/g, interaction.user.username)
      .replace(/{server}/g, interaction.guild.name);
    
    // Create welcome embed
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Welcome to the Server!')
      .setDescription(formattedMessage)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Developed by gh_sman • Member #${interaction.guild.memberCount}` })
      .setTimestamp();
    
    // Send test message
    await channel.send({ embeds: [welcomeEmbed] });
    
    return interaction.reply({
      content: `Test welcome message sent to ${channel.toString()}`,
      ephemeral: true
    });
  },
  
  async disableWelcome(message) {
    // Remove settings from database
    saveSetting(message.guild.id, 'welcomeChannelId', null);
    saveSetting(message.guild.id, 'welcomeMessage', null);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(`${EMOJIS.LOGS} Welcome Messages Disabled`)
      .setDescription('Welcome messages have been disabled.')
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  },
  
  async disableWelcomeInteraction(interaction) {
    // Remove settings from database
    saveSetting(interaction.guild.id, 'welcomeChannelId', null);
    saveSetting(interaction.guild.id, 'welcomeMessage', null);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(`${EMOJIS.LOGS} Welcome Messages Disabled`)
      .setDescription('Welcome messages have been disabled.')
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
  },
  
  async viewSettings(message) {
    // Get settings from database
    const channelId = getSetting(message.guild.id, 'welcomeChannelId');
    const welcomeMessage = getSetting(message.guild.id, 'welcomeMessage');
    
    if (!channelId || !welcomeMessage) {
      return message.reply('Welcome messages are not configured yet. Use `welcome set` first.');
    }
    
    // Get channel
    const channel = message.guild.channels.cache.get(channelId);
    const channelText = channel ? channel.toString() : 'Channel not found';
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${EMOJIS.LOGS} Welcome Message Settings`)
      .addFields(
        { name: 'Channel', value: channelText },
        { name: 'Message', value: welcomeMessage }
      )
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  },
  
  async viewSettingsInteraction(interaction) {
    // Get settings from database
    const channelId = getSetting(interaction.guild.id, 'welcomeChannelId');
    const welcomeMessage = getSetting(interaction.guild.id, 'welcomeMessage');
    
    if (!channelId || !welcomeMessage) {
      return interaction.reply({
        content: 'Welcome messages are not configured yet. Use `/welcome set` first.',
        ephemeral: true
      });
    }
    
    // Get channel
    const channel = interaction.guild.channels.cache.get(channelId);
    const channelText = channel ? channel.toString() : 'Channel not found';
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${EMOJIS.LOGS} Welcome Message Settings`)
      .addFields(
        { name: 'Channel', value: channelText },
        { name: 'Message', value: welcomeMessage }
      )
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
  }
};