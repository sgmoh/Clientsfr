const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'bulkemoji',
  description: 'Add multiple themed emojis to the server',
  usage: '[theme]',
  aliases: ['themoji', 'themedemojis'],
  permissions: [PermissionFlagsBits.ManageGuildExpressions],
  guildOnly: true,
  category: 'admin',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('bulkemoji')
    .setDescription('Add multiple themed emojis to the server')
    .addStringOption(option => 
      option.setName('theme')
        .setDescription('The theme of emojis to add')
        .setRequired(true)
        .addChoices(
          { name: 'Palestine', value: 'palestine' }
        ))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions),
  
  async execute(message, args, client) {
    // Check if theme is provided
    if (!args.length) {
      return message.reply('Please provide a theme for the emojis (e.g., palestine).');
    }
    
    const theme = args[0].toLowerCase();
    
    if (theme !== 'palestine') {
      return message.reply('Currently only the "palestine" theme is available.');
    }
    
    try {
      // Send initial response
      const initialResponse = await message.reply('Starting to add Palestine-themed emojis to the server...');
      
      // Define the emoji data
      const palestineEmojis = [
        { name: 'pal_help', url: 'https://i.imgur.com/8z9vHsR.png' },
        { name: 'pal_ban', url: 'https://i.imgur.com/u6fJxV5.png' },
        { name: 'pal_kick', url: 'https://i.imgur.com/3f5Kxbk.png' },
        { name: 'pal_mute', url: 'https://i.imgur.com/e1UGeQv.png' },
        { name: 'pal_timeout', url: 'https://i.imgur.com/S9w7kji.png' },
        { name: 'pal_tickets', url: 'https://i.imgur.com/Lkk2RzW.png' },
        { name: 'pal_logs', url: 'https://i.imgur.com/G8BDzYq.png' },
        { name: 'pal_purge', url: 'https://i.imgur.com/vkDFQyE.png' },
        { name: 'pal_settings', url: 'https://i.imgur.com/uOtLLt6.png' },
        { name: 'pal_multipurpose', url: 'https://i.imgur.com/kxKRPww.png' }
      ];
      
      // Keep track of successes and failures
      const results = {
        success: [],
        failed: []
      };
      
      // Add each emoji
      for (const emoji of palestineEmojis) {
        try {
          // Fetch the image
          const response = await axios.get(emoji.url, { responseType: 'arraybuffer' });
          if (response.status !== 200) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }
          
          const imageBuffer = Buffer.from(response.data);
          
          // Add the emoji to the server
          const newEmoji = await message.guild.emojis.create({
            attachment: imageBuffer,
            name: emoji.name
          });
          
          results.success.push({ name: emoji.name, emoji: newEmoji });
          
          // Add a short delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Error adding emoji ${emoji.name}: ${error}`);
          results.failed.push({ name: emoji.name, error: error.message });
        }
      }
      
      // Create result embed
      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('🎭 Palestine Emojis Added')
        .setDescription(`Successfully added ${results.success.length} Palestine-themed emojis to the server.`)
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      if (results.success.length > 0) {
        embed.addFields({
          name: '✅ Added Emojis',
          value: results.success.map(e => `${e.emoji} - \`:${e.name}:\``).join('\n')
        });
      }
      
      if (results.failed.length > 0) {
        embed.addFields({
          name: '❌ Failed Emojis',
          value: results.failed.map(e => `${e.name} - ${e.error}`).join('\n')
        });
      }
      
      return initialResponse.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error(`Error adding emojis: ${error}`);
      return message.reply(`Failed to add emojis: ${error.message}`);
    }
  },
  
  async executeSlash(interaction, client) {
    const theme = interaction.options.getString('theme');
    
    try {
      await interaction.deferReply();
      
      if (theme !== 'palestine') {
        return interaction.editReply('Currently only the "palestine" theme is available.');
      }
      
      // Define the emoji data
      const palestineEmojis = [
        { name: 'pal_help', url: 'https://i.imgur.com/8z9vHsR.png' },
        { name: 'pal_ban', url: 'https://i.imgur.com/u6fJxV5.png' },
        { name: 'pal_kick', url: 'https://i.imgur.com/3f5Kxbk.png' },
        { name: 'pal_mute', url: 'https://i.imgur.com/e1UGeQv.png' },
        { name: 'pal_timeout', url: 'https://i.imgur.com/S9w7kji.png' },
        { name: 'pal_tickets', url: 'https://i.imgur.com/Lkk2RzW.png' },
        { name: 'pal_logs', url: 'https://i.imgur.com/G8BDzYq.png' },
        { name: 'pal_purge', url: 'https://i.imgur.com/vkDFQyE.png' },
        { name: 'pal_settings', url: 'https://i.imgur.com/uOtLLt6.png' },
        { name: 'pal_multipurpose', url: 'https://i.imgur.com/kxKRPww.png' }
      ];
      
      // Keep track of successes and failures
      const results = {
        success: [],
        failed: []
      };
      
      // Add each emoji
      for (const emoji of palestineEmojis) {
        try {
          // Fetch the image
          const response = await axios.get(emoji.url, { responseType: 'arraybuffer' });
          if (response.status !== 200) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }
          
          const imageBuffer = Buffer.from(response.data);
          
          // Add the emoji to the server
          const newEmoji = await interaction.guild.emojis.create({
            attachment: imageBuffer,
            name: emoji.name
          });
          
          results.success.push({ name: emoji.name, emoji: newEmoji });
          
          // Add a short delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Send progress update
          await interaction.editReply(`Adding emojis: ${results.success.length}/${palestineEmojis.length} complete...`);
          
        } catch (error) {
          console.error(`Error adding emoji ${emoji.name}: ${error}`);
          results.failed.push({ name: emoji.name, error: error.message });
        }
      }
      
      // Create result embed
      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('🎭 Palestine Emojis Added')
        .setDescription(`Successfully added ${results.success.length} Palestine-themed emojis to the server.`)
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      if (results.success.length > 0) {
        embed.addFields({
          name: '✅ Added Emojis',
          value: results.success.map(e => `${e.emoji} - \`:${e.name}:\``).join('\n')
        });
      }
      
      if (results.failed.length > 0) {
        embed.addFields({
          name: '❌ Failed Emojis',
          value: results.failed.map(e => `${e.name} - ${e.error}`).join('\n')
        });
      }
      
      return interaction.editReply({ content: null, embeds: [embed] });
    } catch (error) {
      console.error(`Error adding emojis: ${error}`);
      return interaction.editReply(`Failed to add emojis: ${error.message}`);
    }
  }
};