const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { setAutoRole, getAutoRole } = require('../../utils/database');

module.exports = {
  name: 'autorole',
  description: 'Set or view the auto-role for new members',
  usage: '[role/disable]',
  aliases: ['ar'],
  permissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  category: 'admin',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Set or view the auto-role for new members')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set the auto-role for new members')
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The role to automatically assign to new members')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View the current auto-role settings'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Disable auto-role'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  async execute(message, args, client) {
    // Check if a role was specified
    if (!args.length) {
      return this.viewAutoRole(message, client);
    }
    
    // Handle disable option
    if (args[0].toLowerCase() === 'disable') {
      return this.disableAutoRole(message);
    }
    
    // Get the role mention or ID
    const roleIdentifier = args[0];
    let role;
    
    if (message.mentions.roles.size) {
      role = message.mentions.roles.first();
    } else {
      role = message.guild.roles.cache.find(r => 
        r.id === roleIdentifier || 
        r.name.toLowerCase() === roleIdentifier.toLowerCase()
      );
    }
    
    // Check if role exists
    if (!role) {
      return message.reply('❌ Could not find that role. Please mention a role or provide a valid role name/ID.');
    }
    
    // Check if bot can assign the role
    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply('⚠️ I cannot assign that role to members because it\'s positioned higher than or equal to my highest role.');
    }
    
    // Set the auto role
    setAutoRole(message.guild.id, role.id);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle('✅ Auto-Role Set')
      .setDescription(`New members will now automatically receive the **${role.name}** role.`)
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  },
  
  async executeSlash(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'view') {
      return this.viewAutoRoleInteraction(interaction, client);
    } else if (subcommand === 'disable') {
      return this.disableAutoRoleInteraction(interaction);
    } else if (subcommand === 'set') {
      // Get the specified role
      const role = interaction.options.getRole('role');
      
      // Check if bot can assign the role
      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
          content: '⚠️ I cannot assign that role to members because it\'s positioned higher than or equal to my highest role.',
          ephemeral: true
        });
      }
      
      // Set the auto role
      setAutoRole(interaction.guild.id, role.id);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('✅ Auto-Role Set')
        .setDescription(`New members will now automatically receive the **${role.name}** role.`)
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
  },
  
  // Helper method to view the current auto role
  async viewAutoRole(message, client) {
    const roleId = getAutoRole(message.guild.id);
    
    if (!roleId) {
      return message.reply('⚠️ Auto-role is not currently set for this server.');
    }
    
    const role = message.guild.roles.cache.get(roleId);
    
    if (!role) {
      // Role no longer exists
      setAutoRole(message.guild.id, null);
      return message.reply('⚠️ The previously set auto-role no longer exists. Auto-role has been disabled.');
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#3498DB')
      .setTitle('🔍 Auto-Role Info')
      .setDescription(`The current auto-role is set to: **${role.name}**`)
      .addFields({
        name: 'Role Details',
        value: `• Name: ${role.name}\n• ID: ${role.id}\n• Color: ${role.hexColor}\n• Position: ${role.position}`
      })
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  },
  
  // Helper method to view auto role with slash command
  async viewAutoRoleInteraction(interaction, client) {
    const roleId = getAutoRole(interaction.guild.id);
    
    if (!roleId) {
      return interaction.reply({
        content: '⚠️ Auto-role is not currently set for this server.',
        ephemeral: true
      });
    }
    
    const role = interaction.guild.roles.cache.get(roleId);
    
    if (!role) {
      // Role no longer exists
      setAutoRole(interaction.guild.id, null);
      return interaction.reply({
        content: '⚠️ The previously set auto-role no longer exists. Auto-role has been disabled.',
        ephemeral: true
      });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#3498DB')
      .setTitle('🔍 Auto-Role Info')
      .setDescription(`The current auto-role is set to: **${role.name}**`)
      .addFields({
        name: 'Role Details',
        value: `• Name: ${role.name}\n• ID: ${role.id}\n• Color: ${role.hexColor}\n• Position: ${role.position}`
      })
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
  },
  
  // Helper method to disable auto role
  async disableAutoRole(message) {
    const currentRoleId = getAutoRole(message.guild.id);
    
    if (!currentRoleId) {
      return message.reply('⚠️ Auto-role is already disabled for this server.');
    }
    
    // Disable auto role
    setAutoRole(message.guild.id, null);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('🚫 Auto-Role Disabled')
      .setDescription('Auto-role has been disabled. New members will no longer automatically receive a role.')
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  },
  
  // Helper method to disable auto role with slash command
  async disableAutoRoleInteraction(interaction) {
    const currentRoleId = getAutoRole(interaction.guild.id);
    
    if (!currentRoleId) {
      return interaction.reply({
        content: '⚠️ Auto-role is already disabled for this server.',
        ephemeral: true
      });
    }
    
    // Disable auto role
    setAutoRole(interaction.guild.id, null);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('🚫 Auto-Role Disabled')
      .setDescription('Auto-role has been disabled. New members will no longer automatically receive a role.')
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
  }
};