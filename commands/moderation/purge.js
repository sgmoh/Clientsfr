const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const EMOJIS = require('../../utils/emojiConfig');

module.exports = {
  name: 'purge',
  description: 'Delete a specified number of messages',
  usage: '<amount>',
  aliases: ['clear', 'prune'],
  args: true,
  permissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  category: 'moderation',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a specified number of messages')
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addUserOption(option => 
      option.setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  
  async execute(message, args, client) {
    // Check if amount is provided
    if (!args.length) {
      return message.reply('Please provide the number of messages to delete.');
    }
    
    // Parse amount
    const amount = parseInt(args[0]);
    
    if (isNaN(amount)) {
      return message.reply('Please provide a valid number.');
    }
    
    if (amount < 1 || amount > 100) {
      return message.reply('Please provide a number between 1 and 100.');
    }
    
    // Check if user is specified
    let targetUser = null;
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
    }
    
    try {
      // Delete the command message first
      await message.delete();
      
      // Fetch messages
      const messages = await message.channel.messages.fetch({ limit: 100 });
      
      // Filter messages if user is specified
      let messagesToDelete = messages;
      if (targetUser) {
        messagesToDelete = messages.filter(msg => msg.author.id === targetUser.id);
      }
      
      // Only get the requested amount and ensure they're not older than 14 days
      messagesToDelete = messagesToDelete.filter(msg => {
        const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        return msg.createdTimestamp > twoWeeksAgo;
      }).first(amount);
      
      // Check if there are messages to delete
      if (messagesToDelete.length === 0) {
        const tempMsg = await message.channel.send('No eligible messages found to delete.');
        setTimeout(() => tempMsg.delete().catch(console.error), 5000);
        return;
      }
      
      // Bulk delete messages
      const deleted = await message.channel.bulkDelete(messagesToDelete, true);
      
      // Create success embed
      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle(`${EMOJIS.CLEAR} Messages Purged`)
        .setDescription(`Successfully deleted ${deleted.size} messages.${targetUser ? ` (from ${targetUser.tag})` : ''}`)
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      // Send confirmation and delete it after 5 seconds
      const confirmation = await message.channel.send({ embeds: [embed] });
      setTimeout(() => confirmation.delete().catch(console.error), 5000);
    } catch (error) {
      console.error(`Error purging messages: ${error}`);
      
      let errorMessage = 'Failed to delete messages.';
      if (error.code === 10008) {
        errorMessage = 'Some messages were too old to be deleted.';
      }
      
      const tempMsg = await message.channel.send(errorMessage);
      setTimeout(() => tempMsg.delete().catch(console.error), 5000);
    }
  },
  
  async executeSlash(interaction, client) {
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');
    
    await interaction.deferReply({ ephemeral: true });
    
    try {
      // Fetch messages
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      
      // Filter messages if user is specified
      let messagesToDelete = messages;
      if (targetUser) {
        messagesToDelete = messages.filter(msg => msg.author.id === targetUser.id);
      }
      
      // Only get the requested amount and ensure they're not older than 14 days
      messagesToDelete = messagesToDelete.filter(msg => {
        const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        return msg.createdTimestamp > twoWeeksAgo;
      }).first(amount);
      
      // Check if there are messages to delete
      if (messagesToDelete.length === 0) {
        return interaction.editReply('No eligible messages found to delete.');
      }
      
      // Bulk delete messages
      const deleted = await interaction.channel.bulkDelete(messagesToDelete, true);
      
      // Create success embed
      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle(`${EMOJIS.CLEAR} Messages Purged`)
        .setDescription(`Successfully deleted ${deleted.size} messages.${targetUser ? ` (from ${targetUser.tag})` : ''}`)
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      // Send confirmation to the user only (ephemeral)
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error purging messages: ${error}`);
      
      let errorMessage = 'Failed to delete messages.';
      if (error.code === 10008) {
        errorMessage = 'Some messages were too old to be deleted.';
      }
      
      return interaction.editReply(errorMessage);
    }
  }
};