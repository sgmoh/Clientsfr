const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getWarnings, clearWarnings } = require('../../utils/database');

module.exports = {
  name: 'warnings',
  description: 'View or clear warnings for a user',
  usage: '<user> [clear]',
  args: true,
  permissions: [PermissionFlagsBits.ModerateMembers],
  guildOnly: true,
  category: 'moderation',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View or clear warnings for a user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to view warnings for')
        .setRequired(true))
    .addBooleanOption(option => 
      option.setName('clear')
        .setDescription('Clear all warnings for this user')
        .setRequired(false))
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
      return message.reply('You need to specify a valid user to check warnings.');
    }
    
    // Check if clearing warnings
    const clear = args[1] && args[1].toLowerCase() === 'clear';
    
    if (clear) {
      // Clear warnings
      const cleared = clearWarnings(message.guild.id, user.id);
      
      if (cleared) {
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Warnings Cleared')
          .setDescription(`All warnings have been cleared for **${user.tag}**.`)
          .setFooter({ text: 'Developed by gh_sman' })
          .setTimestamp();
        
        return message.reply({ embeds: [embed] });
      } else {
        return message.reply(`${user.tag} has no warnings to clear.`);
      }
    } else {
      // View warnings
      const warnings = getWarnings(message.guild.id, user.id);
      
      if (!warnings || warnings.length === 0) {
        return message.reply(`${user.tag} has no warnings.`);
      }
      
      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle(`Warnings for ${user.tag}`)
        .setDescription(`${user.tag} has ${warnings.length} warning(s).`)
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      // Add warnings to embed
      warnings.forEach((warning, index) => {
        // Get moderator user object if available
        let moderatorText = 'Unknown moderator';
        const moderator = client.users.cache.get(warning.moderatorId);
        if (moderator) {
          moderatorText = moderator.tag;
        }
        
        // Format date
        const date = new Date(warning.timestamp);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        embed.addFields({
          name: `Warning #${index + 1} (${formattedDate})`,
          value: `**Reason:** ${warning.reason}\n**Moderator:** ${moderatorText}`
        });
      });
      
      return message.reply({ embeds: [embed] });
    }
  },
  
  async executeSlash(interaction, client) {
    // Get options
    const user = interaction.options.getUser('user');
    const clear = interaction.options.getBoolean('clear') || false;
    
    if (clear) {
      // Clear warnings
      const cleared = clearWarnings(interaction.guild.id, user.id);
      
      if (cleared) {
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Warnings Cleared')
          .setDescription(`All warnings have been cleared for **${user.tag}**.`)
          .setFooter({ text: 'Developed by gh_sman' })
          .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
      } else {
        return interaction.reply(`${user.tag} has no warnings to clear.`);
      }
    } else {
      // View warnings
      const warnings = getWarnings(interaction.guild.id, user.id);
      
      if (!warnings || warnings.length === 0) {
        return interaction.reply(`${user.tag} has no warnings.`);
      }
      
      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle(`Warnings for ${user.tag}`)
        .setDescription(`${user.tag} has ${warnings.length} warning(s).`)
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      // Add warnings to embed
      warnings.forEach((warning, index) => {
        // Get moderator user object if available
        let moderatorText = 'Unknown moderator';
        const moderator = client.users.cache.get(warning.moderatorId);
        if (moderator) {
          moderatorText = moderator.tag;
        }
        
        // Format date
        const date = new Date(warning.timestamp);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        embed.addFields({
          name: `Warning #${index + 1} (${formattedDate})`,
          value: `**Reason:** ${warning.reason}\n**Moderator:** ${moderatorText}`
        });
      });
      
      return interaction.reply({ embeds: [embed] });
    }
  }
};
