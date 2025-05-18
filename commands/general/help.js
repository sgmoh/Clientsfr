const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const { getPrefix } = require('../../utils/database');
const { defaultPrefix } = require('../../config.json');
const EMOJIS = require('../../utils/emojiConfig');

module.exports = {
  name: 'help',
  description: 'Displays a list of available commands',
  usage: '[command]',
  aliases: ['commands', 'h'],
  category: 'general',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays a list of available commands')
    .addStringOption(option => 
      option.setName('command')
        .setDescription('Get info about a specific command')
        .setRequired(false)),
  
  async execute(message, args, client) {
    const prefix = getPrefix(message.guild.id, defaultPrefix);
    
    // If a specific command is specified
    if (args.length) {
      return this.sendCommandHelp(message, args[0], prefix, client);
    }
    
    // Send the main help menu with categories
    return this.sendHelpMenu(message, prefix, client);
  },
  
  async executeSlash(interaction, client) {
    const prefix = getPrefix(interaction.guild.id, defaultPrefix);
    const commandName = interaction.options.getString('command');
    
    if (commandName) {
      return this.sendCommandHelpInteraction(interaction, commandName, prefix, client);
    }
    
    return this.sendHelpMenuInteraction(interaction, prefix, client);
  },
  
  async sendHelpMenu(message, prefix, client) {
    // Create embed for main help menu
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${EMOJIS.HELP} Command Help Menu`)
      .setDescription(`Hello! I'm a multi-purpose bot developed by **gh_sman**.\nMy prefix for this server is \`${prefix}\`\n\nSelect a category below to see available commands:`)
      .setImage('attachment://help_banner.png')
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Get unique categories
    const categories = [...new Set(client.commands.map(cmd => cmd.category))];
    
    // Create select menu for categories
    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('help-category')
          .setPlaceholder('Select a category')
          .addOptions(
            categories.map(category => 
              new StringSelectMenuOptionBuilder()
                .setLabel(category.charAt(0).toUpperCase() + category.slice(1))
                .setValue(category)
                .setDescription(`View ${category} commands`)
                .setEmoji(this.getCategoryEmoji(category))
            )
          )
      );
    
    // Send message with attached image
    const sentMessage = await message.reply({ 
      embeds: [embed], 
      components: [row],
      files: [{ attachment: './attached_assets/help_banner.png', name: 'help_banner.png' }]
    });
    
    // Create collector for interactions
    const collector = sentMessage.createMessageComponentCollector({ 
      time: 60000 // 1 minute timeout
    });
    
    collector.on('collect', async i => {
      // Only respond to interactions from the command author
      if (i.user.id === message.author.id) {
        const categoryName = i.values[0];
        await this.handleCategorySelect(i, categoryName, client);
      } else {
        await i.reply({ content: 'This menu is not for you!', ephemeral: true });
      }
    });
    
    collector.on('end', () => {
      // Remove components when collector ends
      sentMessage.edit({ components: [] }).catch(console.error);
    });
  },
  
  async sendHelpMenuInteraction(interaction, prefix, client) {
    // Create embed for main help menu
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${EMOJIS.HELP} Command Help Menu`)
      .setDescription(`Hello! I'm a multi-purpose bot developed by **gh_sman**.\nMy prefix for this server is \`${prefix}\`\n\nSelect a category below to see available commands:`)
      .setImage('attachment://help_banner.png')
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Get unique categories
    const categories = [...new Set(client.commands.map(cmd => cmd.category))];
    
    // Create select menu for categories
    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('help-category')
          .setPlaceholder('Select a category')
          .addOptions(
            categories.map(category => 
              new StringSelectMenuOptionBuilder()
                .setLabel(category.charAt(0).toUpperCase() + category.slice(1))
                .setValue(category)
                .setDescription(`View ${category} commands`)
                .setEmoji(this.getCategoryEmoji(category))
            )
          )
      );
    
    // Send message with attached image
    await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      files: [{ attachment: './attached_assets/help_banner.png', name: 'help_banner.png' }]
    });
  },
  
  async handleCategorySelect(interaction, categoryName, client) {
    const prefix = getPrefix(interaction.guild.id, defaultPrefix);
    
    // Filter commands by category
    const categoryCommands = client.commands.filter(cmd => cmd.category === categoryName);
    
    if (categoryCommands.size === 0) {
      return interaction.update({ 
        content: 'No commands found in this category.', 
        embeds: [], 
        components: [] 
      });
    }
    
    // Create embed for category
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${this.getCategoryCustomEmoji(categoryName)} ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Commands`)
      .setDescription(`Here are all the commands in the ${categoryName} category:`)
      .setFooter({ text: `Use ${prefix}help [command] for more details | Developed by gh_sman` })
      .setTimestamp();
    
    // Add fields for each command
    categoryCommands.each(command => {
      embed.addFields({
        name: `${prefix}${command.name} ${command.usage || ''}`,
        value: `${command.description || 'No description provided.'}`,
        inline: true
      });
    });
    
    // Create back button
    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('help-category')
          .setPlaceholder('Select a category')
          .addOptions(
            [...new Set(client.commands.map(cmd => cmd.category))].map(category => 
              new StringSelectMenuOptionBuilder()
                .setLabel(category.charAt(0).toUpperCase() + category.slice(1))
                .setValue(category)
                .setDescription(`View ${category} commands`)
                .setEmoji(this.getCategoryEmoji(category))
                .setDefault(category === categoryName)
            )
          )
      );
    
    // Update message
    await interaction.update({ embeds: [embed], components: [row] });
  },
  
  async sendCommandHelp(message, commandName, prefix, client) {
    // Find command
    const command = client.commands.get(commandName) || 
                    client.commands.get(client.aliases.get(commandName));
    
    if (!command) {
      return message.reply(`Command \`${commandName}\` not found. Use \`${prefix}help\` to see all commands.`);
    }
    
    // Create embed for command
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${EMOJIS.HELP} Command: ${prefix}${command.name}`)
      .setDescription(command.description || 'No description provided.')
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Add command details
    if (command.aliases && command.aliases.length) {
      embed.addFields({
        name: 'Aliases',
        value: command.aliases.map(alias => `\`${alias}\``).join(', '),
        inline: true
      });
    }
    
    if (command.usage) {
      embed.addFields({
        name: 'Usage',
        value: `\`${prefix}${command.name} ${command.usage}\``,
        inline: true
      });
    }
    
    embed.addFields({
      name: 'Category',
      value: command.category.charAt(0).toUpperCase() + command.category.slice(1),
      inline: true
    });
    
    // Send message
    return message.reply({ embeds: [embed] });
  },
  
  async sendCommandHelpInteraction(interaction, commandName, prefix, client) {
    // Find command
    const command = client.commands.get(commandName) || 
                    client.commands.get(client.aliases.get(commandName));
    
    if (!command) {
      return interaction.reply({
        content: `Command \`${commandName}\` not found. Use \`${prefix}help\` to see all commands.`,
        ephemeral: true
      });
    }
    
    // Create embed for command
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${EMOJIS.HELP} Command: ${prefix}${command.name}`)
      .setDescription(command.description || 'No description provided.')
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Add command details
    if (command.aliases && command.aliases.length) {
      embed.addFields({
        name: 'Aliases',
        value: command.aliases.map(alias => `\`${alias}\``).join(', '),
        inline: true
      });
    }
    
    if (command.usage) {
      embed.addFields({
        name: 'Usage',
        value: `\`${prefix}${command.name} ${command.usage}\``,
        inline: true
      });
    }
    
    embed.addFields({
      name: 'Category',
      value: command.category.charAt(0).toUpperCase() + command.category.slice(1),
      inline: true
    });
    
    // Send message
    return interaction.reply({ embeds: [embed] });
  },
  
  getCategoryEmoji(category) {
    // Return appropriate emoji for category using standard emojis for select menu compatibility
    switch (category.toLowerCase()) {
      case 'general': return '📋';
      case 'moderation': return '🔨';
      case 'admin': return '⚙️';
      case 'leaderboard': return '📊';
      case 'voice': return '🎤';
      default: return '❓';
    }
  },
  
  getCategoryCustomEmoji(category) {
    // Return appropriate custom emoji for category display
    switch (category.toLowerCase()) {
      case 'general': return `${EMOJIS.HELP}`;
      case 'moderation': return `${EMOJIS.BANNED}`;
      case 'admin': return `${EMOJIS.LOGS}`;
      case 'leaderboard': return `${EMOJIS.CLIPBOARD}`;
      case 'voice': return `${EMOJIS.MUTE}`;
      default: return `${EMOJIS.HELP}`;
    }
  }
};