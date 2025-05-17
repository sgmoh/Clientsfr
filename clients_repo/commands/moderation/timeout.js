const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const EMOJIS = require('../../utils/emojiConfig');
const ms = require('ms');

module.exports = {
  name: 'timeout',
  description: 'Timeout a user for a specified duration',
  usage: '<user> <duration> [reason]',
  aliases: ['mute'],
  args: true,
  permissions: [PermissionFlagsBits.ModerateMembers],
  guildOnly: true,
  category: 'moderation',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user for a specified duration')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to timeout')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('duration')
        .setDescription('Duration of timeout (e.g., 1m, 1h, 1d)')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for timeout')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
  async execute(message, args, client) {
    // Check if user, duration, and reason are provided
    if (args.length < 2) {
      return message.reply('Please provide both a user and duration for the timeout.');
    }
    
    // Get mentioned user or get user by ID
    const userIdentifier = args[0];
    let user;
    
    if (message.mentions.users.size) {
      user = message.mentions.users.first();
    } else {
      try {
        user = await client.users.fetch(userIdentifier);
      } catch (error) {
        return message.reply('Invalid user specified. Please mention a user or provide a valid user ID.');
      }
    }
    
    // Get the member from the guild
    const member = message.guild.members.cache.get(user.id);
    
    // Check if member exists in the guild
    if (!member) {
      return message.reply('That user is not in this server.');
    }
    
    // Get duration
    const durationStr = args[1];
    let duration;
    
    try {
      duration = ms(durationStr);
      
      // Check if the duration is valid
      if (!duration || isNaN(duration)) {
        throw new Error('Invalid duration');
      }
      
      // Check if duration is within Discord's limits (max 28 days)
      if (duration < 5000 || duration > 2419200000) {
        return message.reply('Timeout duration must be between 5 seconds and 28 days.');
      }
    } catch (error) {
      return message.reply('Invalid duration format. Please use a valid duration (e.g., 1m, 1h, 1d).');
    }
    
    // Get reason (everything after user and duration)
    const reason = args.slice(2).join(' ') || 'No reason provided';
    
    // Check if member is timeout-able
    if (!member.moderatable) {
      return message.reply('I cannot timeout this user. Their role might be higher than mine or I don\'t have moderate members permissions.');
    }
    
    // Check if trying to timeout self
    if (member.id === message.author.id) {
      return message.reply('You cannot timeout yourself.');
    }
    
    // Check if trying to timeout a higher role
    if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
      return message.reply('You cannot timeout someone with a higher or equal role.');
    }
    
    // Attempt to timeout the user
    try {
      await member.timeout(duration, `Timeout by ${message.author.tag} | Reason: ${reason}`);
      
      // Get human-readable duration string for the embed
      const readableDuration = durationStr;
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#9932CC')
        .setTitle(`${EMOJIS.TIMEOUT} User Timed Out`)
        .setDescription(`**${user.tag}** has been timed out.`)
        .addFields(
          { name: 'Duration', value: readableDuration },
          { name: 'Reason', value: reason },
          { name: 'Timed out by', value: message.author.tag }
        )
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      // Send confirmation
      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error timing out user: ${error}`);
      return message.reply(`Failed to timeout user: ${error.message}`);
    }
  },
  
  async executeSlash(interaction, client) {
    // Get options
    const user = interaction.options.getUser('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Get the member from the guild
    const member = interaction.guild.members.cache.get(user.id);
    
    // Check if member exists in the guild
    if (!member) {
      return interaction.reply({
        content: 'That user is not in this server.',
        ephemeral: true
      });
    }
    
    // Parse duration
    let duration;
    
    try {
      duration = ms(durationStr);
      
      // Check if the duration is valid
      if (!duration || isNaN(duration)) {
        throw new Error('Invalid duration');
      }
      
      // Check if duration is within Discord's limits (max 28 days)
      if (duration < 5000 || duration > 2419200000) {
        return interaction.reply({
          content: 'Timeout duration must be between 5 seconds and 28 days.',
          ephemeral: true
        });
      }
    } catch (error) {
      return interaction.reply({
        content: 'Invalid duration format. Please use a valid duration (e.g., 1m, 1h, 1d).',
        ephemeral: true
      });
    }
    
    // Check if member is timeout-able
    if (!member.moderatable) {
      return interaction.reply({
        content: 'I cannot timeout this user. Their role might be higher than mine or I don\'t have moderate members permissions.',
        ephemeral: true
      });
    }
    
    // Check if trying to timeout self
    if (member.id === interaction.user.id) {
      return interaction.reply({
        content: 'You cannot timeout yourself.',
        ephemeral: true
      });
    }
    
    // Check if trying to timeout a higher role
    if (
      member.roles.highest.position >= interaction.member.roles.highest.position && 
      interaction.user.id !== interaction.guild.ownerId
    ) {
      return interaction.reply({
        content: 'You cannot timeout someone with a higher or equal role.',
        ephemeral: true
      });
    }
    
    // Attempt to timeout the user
    try {
      await member.timeout(duration, `Timeout by ${interaction.user.tag} | Reason: ${reason}`);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#9932CC')
        .setTitle(`${EMOJIS.TIMEOUT} User Timed Out`)
        .setDescription(`**${user.tag}** has been timed out.`)
        .addFields(
          { name: 'Duration', value: durationStr },
          { name: 'Reason', value: reason },
          { name: 'Timed out by', value: interaction.user.tag }
        )
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      // Send confirmation
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error timing out user: ${error}`);
      return interaction.reply({
        content: `Failed to timeout user: ${error.message}`,
        ephemeral: true
      });
    }
  }
};