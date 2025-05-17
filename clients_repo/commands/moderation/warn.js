const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addWarning } = require('../../utils/database');

module.exports = {
  name: 'warn',
  description: 'Issue a warning to a user',
  usage: '<user> <reason>',
  args: true,
  permissions: [PermissionFlagsBits.ModerateMembers],
  guildOnly: true,
  category: 'moderation',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue a warning to a user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to warn')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for warning')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
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
    
    // Check if user exists
    if (!user) {
      return message.reply('You need to specify a valid user to warn.');
    }
    
    // Check if reason is provided
    if (args.length < 2) {
      return message.reply('Please provide a reason for the warning.');
    }
    
    // Get reason (everything after the user)
    const reason = args.slice(1).join(' ');
    
    // Check if trying to warn self
    if (user.id === message.author.id) {
      return message.reply('You cannot warn yourself.');
    }
    
    // Get member
    const member = message.guild.members.cache.get(user.id);
    
    // Check if trying to warn a higher role
    if (member && member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
      return message.reply('You cannot warn someone with a higher or equal role.');
    }
    
    // Add warning to database
    const warningCount = addWarning(message.guild.id, user.id, reason, message.author.id);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#FFFF00')
      .setTitle('⚠️ User Warned')
      .setDescription(`**${user.tag}** has been warned.`)
      .addFields(
        { name: 'Reason', value: reason },
        { name: 'Warned by', value: message.author.tag },
        { name: 'Warning Count', value: warningCount.toString() }
      )
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Send confirmation
    await message.reply({ embeds: [embed] });
    
    // DM the user
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle(`⚠️ Warning from ${message.guild.name}`)
        .setDescription(`You have received a warning.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Warned by', value: message.author.tag },
          { name: 'Warning Count', value: warningCount.toString() }
        )
        .setFooter({ text: 'Please follow the server rules to avoid further actions.' })
        .setTimestamp();
      
      await user.send({ embeds: [dmEmbed] });
    } catch (error) {
      // User has DMs disabled or bot cannot message them
      console.log(`Could not send DM to ${user.tag}`);
    }
  },
  
  async executeSlash(interaction, client) {
    // Get options
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    
    // Check if trying to warn self
    if (user.id === interaction.user.id) {
      return interaction.reply({
        content: 'You cannot warn yourself.',
        ephemeral: true
      });
    }
    
    // Get member
    const member = interaction.guild.members.cache.get(user.id);
    
    // Check if trying to warn a higher role
    if (
      member && 
      member.roles.highest.position >= interaction.member.roles.highest.position && 
      interaction.user.id !== interaction.guild.ownerId
    ) {
      return interaction.reply({
        content: 'You cannot warn someone with a higher or equal role.',
        ephemeral: true
      });
    }
    
    // Add warning to database
    const warningCount = addWarning(interaction.guild.id, user.id, reason, interaction.user.id);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#FFFF00')
      .setTitle('⚠️ User Warned')
      .setDescription(`**${user.tag}** has been warned.`)
      .addFields(
        { name: 'Reason', value: reason },
        { name: 'Warned by', value: interaction.user.tag },
        { name: 'Warning Count', value: warningCount.toString() }
      )
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Send confirmation
    await interaction.reply({ embeds: [embed] });
    
    // DM the user
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle(`⚠️ Warning from ${interaction.guild.name}`)
        .setDescription(`You have received a warning.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Warned by', value: interaction.user.tag },
          { name: 'Warning Count', value: warningCount.toString() }
        )
        .setFooter({ text: 'Please follow the server rules to avoid further actions.' })
        .setTimestamp();
      
      await user.send({ embeds: [dmEmbed] });
    } catch (error) {
      // User has DMs disabled or bot cannot message them
      console.log(`Could not send DM to ${user.tag}`);
    }
  }
};
