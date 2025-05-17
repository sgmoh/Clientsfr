const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const EMOJIS = require('../../utils/emojiConfig');

module.exports = {
  name: 'kick',
  description: 'Kick a user from the server',
  usage: '<user> [reason]',
  args: true,
  permissions: [PermissionFlagsBits.KickMembers],
  guildOnly: true,
  category: 'moderation',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for kicking')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  
  async execute(message, args, client) {
    // Get mentioned user or user by ID
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
      return message.reply('You need to specify a valid user to kick.');
    }
    
    // Get the member from the guild
    const member = message.guild.members.cache.get(user.id);
    
    // Check if member exists in the guild
    if (!member) {
      return message.reply('That user is not in this server.');
    }
    
    // Check if member is kickable
    if (!member.kickable) {
      return message.reply('I cannot kick this user. Their role might be higher than mine or I don\'t have kick permissions.');
    }
    
    // Check if trying to kick self
    if (member.id === message.author.id) {
      return message.reply('You cannot kick yourself.');
    }
    
    // Check if trying to kick a higher role
    if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
      return message.reply('You cannot kick someone with a higher or equal role.');
    }
    
    // Attempt to kick the user
    try {
      await member.kick(`Kicked by ${message.author.tag} | Reason: ${reason}`);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle(`${EMOJIS.KICK} User Kicked`)
        .setDescription(`**${user.tag}** has been kicked from the server.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Kicked by', value: message.author.tag }
        )
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      // Send confirmation
      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error kicking user: ${error}`);
      return message.reply(`Failed to kick user: ${error.message}`);
    }
  },
  
  async executeSlash(interaction, client) {
    // Get user from options
    const user = interaction.options.getUser('user');
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
    
    // Check if member is kickable
    if (!member.kickable) {
      return interaction.reply({
        content: 'I cannot kick this user. Their role might be higher than mine or I don\'t have kick permissions.',
        ephemeral: true
      });
    }
    
    // Check if trying to kick self
    if (member.id === interaction.user.id) {
      return interaction.reply({
        content: 'You cannot kick yourself.',
        ephemeral: true
      });
    }
    
    // Check if trying to kick a higher role
    if (
      member.roles.highest.position >= interaction.member.roles.highest.position && 
      interaction.user.id !== interaction.guild.ownerId
    ) {
      return interaction.reply({
        content: 'You cannot kick someone with a higher or equal role.',
        ephemeral: true
      });
    }
    
    // Attempt to kick the user
    try {
      await member.kick(`Kicked by ${interaction.user.tag} | Reason: ${reason}`);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle(`${EMOJIS.KICK} User Kicked`)
        .setDescription(`**${user.tag}** has been kicked from the server.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Kicked by', value: interaction.user.tag }
        )
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      // Send confirmation
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error kicking user: ${error}`);
      return interaction.reply({
        content: `Failed to kick user: ${error.message}`,
        ephemeral: true
      });
    }
  }
};