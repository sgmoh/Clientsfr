const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'emoji',
  description: 'Add emoji to the server',
  usage: '<emoji_url> <name>',
  aliases: ['addemoji', 'createemoji'],
  permissions: [PermissionFlagsBits.ManageGuildExpressions],
  guildOnly: true,
  category: 'admin',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('emoji')
    .setDescription('Add emoji to the server')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a new emoji to the server')
        .addStringOption(option => 
          option.setName('url')
            .setDescription('The URL of the emoji image')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('name')
            .setDescription('The name for the emoji')
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions),
  
  async execute(message, args, client) {
    // Check if URL and name are provided
    if (args.length < 2) {
      return message.reply('Please provide both a URL and a name for the emoji.');
    }
    
    const url = args[0];
    const name = args[1].replace(/[^a-z0-9_]/gi, '').toLowerCase(); // Ensure valid emoji name
    
    if (name.length < 2 || name.length > 32) {
      return message.reply('Emoji name must be between 2 and 32 characters.');
    }
    
    try {
      // Fetch the image
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      if (response.status !== 200) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const imageBuffer = Buffer.from(response.data);
      
      // Add the emoji to the server
      const newEmoji = await message.guild.emojis.create({
        attachment: imageBuffer,
        name: name
      });
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('✅ Emoji Added')
        .setDescription(`Successfully added emoji ${newEmoji} with name \`:${name}:\``)
        .setThumbnail(`https://cdn.discordapp.com/emojis/${newEmoji.id}.png`)
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error adding emoji: ${error}`);
      return message.reply(`Failed to add emoji: ${error.message}`);
    }
  },
  
  async executeSlash(interaction, client) {
    const url = interaction.options.getString('url');
    const name = interaction.options.getString('name').replace(/[^a-z0-9_]/gi, '').toLowerCase(); // Ensure valid emoji name
    
    if (name.length < 2 || name.length > 32) {
      return interaction.reply({
        content: 'Emoji name must be between 2 and 32 characters.',
        ephemeral: true
      });
    }
    
    try {
      await interaction.deferReply();
      
      // Fetch the image
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      if (response.status !== 200) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const imageBuffer = Buffer.from(response.data);
      
      // Add the emoji to the server
      const newEmoji = await interaction.guild.emojis.create({
        attachment: imageBuffer,
        name: name
      });
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('✅ Emoji Added')
        .setDescription(`Successfully added emoji ${newEmoji} with name \`:${name}:\``)
        .setThumbnail(`https://cdn.discordapp.com/emojis/${newEmoji.id}.png`)
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error adding emoji: ${error}`);
      return interaction.editReply(`Failed to add emoji: ${error.message}`);
    }
  }
};