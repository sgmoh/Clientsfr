const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setPrefix, getPrefix } = require('../../utils/database');
const { defaultPrefix } = require('../../config.json');

module.exports = {
  name: 'setprefix',
  description: 'Set the bot\'s prefix for this server',
  usage: '<new_prefix>',
  args: true,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  category: 'general',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('setprefix')
    .setDescription('Set the bot\'s prefix for this server')
    .addStringOption(option =>
      option.setName('prefix')
        .setDescription('The new prefix to use')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  async execute(message, args, client) {
    const newPrefix = args[0];
    
    // Check for prefix length
    if (newPrefix.length > 5) {
      return message.reply('Prefix cannot be longer than 5 characters.');
    }
    
    // Set new prefix
    setPrefix(message.guild.id, newPrefix);
    
    message.reply(`Successfully set the server prefix to \`${newPrefix}\``);
  },
  
  async executeSlash(interaction, client) {
    const newPrefix = interaction.options.getString('prefix');
    
    // Check for prefix length
    if (newPrefix.length > 5) {
      return interaction.reply({
        content: 'Prefix cannot be longer than 5 characters.',
        ephemeral: true
      });
    }
    
    // Set new prefix
    setPrefix(interaction.guild.id, newPrefix);
    
    interaction.reply(`Successfully set the server prefix to \`${newPrefix}\``);
  }
};
