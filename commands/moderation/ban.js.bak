const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const EMOJIS = require('../../utils/emojiConfig');

module.exports = {
  name: 'ban',
  description: 'Ban a user from the server',
  usage: '<user> [reason]',
  args: true,
  permissions: [PermissionFlagsBits.BanMembers],
  guildOnly: true,
  category: 'moderation',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for banning')
        .setRequired(false))
    .addIntegerOption(option => 
      option.setName('days')
        .setDescription('Number of days of messages to delete (0-7)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  
  async execute(message, args, client) {
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
    
    // Get reason (everything after the user)
    const reason = args.slice(1).join(' ') || 'No reason provided';
    
    // Check if user exists
    if (!user) {
      return message.reply('You need to specify a valid user to ban.');
    }
    
    // Check if user is bannable
    const member = message.guild.members.cache.get(user.id);
    if (member) {
      if (!member.bannable) {
        return message.reply('I cannot ban this user. Their role might be higher than mine or I don\'t have ban permissions.');
      }
      
      // Check if trying to ban self
      if (member.id === message.author.id) {
        return message.reply('You cannot ban yourself.');
      }
      
      // Check if trying to ban a higher role
      if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
        return message.reply('You cannot ban someone with a higher or equal role.');
      }
    }
    
    // Attempt to ban the user
    try {
      await message.guild.members.ban(user.id, { 
        reason: `Banned by ${message.author.tag} | Reason: ${reason}`,
        deleteMessageDays: 1
      });
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(`${EMOJIS.BAN} User Banned`)
        .setDescription(`**${user.tag}** has been banned from the server.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Banned by', value: message.author.tag }
        )
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      // Send confirmation
      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error banning user: ${error}`);
      return message.reply(`Failed to ban user: ${error.message}`);
    }
  },
  
  async executeSlash(interaction, client) {
    // Get user from options
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const days = interaction.options.getInteger('days') || 1;
    
    // Check if user is bannable
    const member = interaction.guild.members.cache.get(user.id);
    if (member) {
      if (!member.bannable) {
        return interaction.reply({
          content: 'I cannot ban this user. Their role might be higher than mine or I don\'t have ban permissions.',
          ephemeral: true
        });
      }
      
      // Check if trying to ban self
      if (member.id === interaction.user.id) {
        return interaction.reply({
          content: 'You cannot ban yourself.',
          ephemeral: true
        });
      }
      
      // Check if trying to ban a higher role
      if (
        member.roles.highest.position >= interaction.member.roles.highest.position && 
        interaction.user.id !== interaction.guild.ownerId
      ) {
        return interaction.reply({
          content: 'You cannot ban someone with a higher or equal role.',
          ephemeral: true
        });
      }
    }
    
    // Attempt to ban the user
    try {
      await interaction.guild.members.ban(user.id, { 
        reason: `Banned by ${interaction.user.tag} | Reason: ${reason}`,
        deleteMessageDays: days
      });
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(`${EMOJIS.BAN} User Banned`)
        .setDescription(`**${user.tag}** has been banned from the server.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Banned by', value: interaction.user.tag }
        )
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      // Send confirmation
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error banning user: ${error}`);
      return interaction.reply({
        content: `Failed to ban user: ${error.message}`,
        ephemeral: true
      });
    }
  }
};