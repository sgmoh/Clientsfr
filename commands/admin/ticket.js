const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveSetting, getSetting } = require('../../utils/database');
const EMOJIS = require('../../utils/emojiConfig');

module.exports = {
  name: 'ticket',
  description: 'Create and manage a ticket system',
  usage: '<setup/close/delete>',
  args: true,
  permissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  category: 'admin',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Create and manage a ticket system')
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Setup the ticket system')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send the ticket message')
            .setRequired(true))
        .addRoleOption(option =>
          option.setName('support_role')
            .setDescription('The role that can see and manage tickets')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('message')
            .setDescription('Custom message for the ticket panel')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('close')
        .setDescription('Close a ticket channel'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete a ticket channel'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  async execute(message, args, client) {
    const subcommand = args[0]?.toLowerCase();
    
    if (!subcommand || !['setup', 'close', 'delete'].includes(subcommand)) {
      return message.reply('Please specify a valid subcommand: `setup`, `close`, or `delete`');
    }
    
    if (subcommand === 'setup') {
      // Get the mentioned channel
      const channel = message.mentions.channels.first();
      if (!channel) {
        return message.reply('Please mention a channel to set up the ticket system.');
      }
      
      // Get the mentioned role
      const supportRole = message.mentions.roles.first();
      if (!supportRole) {
        return message.reply('Please mention a support role that can see and manage tickets.');
      }
      
      // Get custom message if provided
      const customMessage = args.slice(2).join(' ') || 'Click the button below to create a support ticket.';
      
      return this.setupTicketSystem(message, channel, supportRole, customMessage);
    } else if (subcommand === 'close') {
      return this.closeTicket(message);
    } else if (subcommand === 'delete') {
      return this.deleteTicket(message);
    }
  },
  
  async executeSlash(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'setup') {
      const channel = interaction.options.getChannel('channel');
      const supportRole = interaction.options.getRole('support_role');
      const customMessage = interaction.options.getString('message') || 'Click the button below to create a support ticket.';
      
      return this.setupTicketSystemInteraction(interaction, channel, supportRole, customMessage);
    } else if (subcommand === 'close') {
      return this.closeTicketInteraction(interaction);
    } else if (subcommand === 'delete') {
      return this.deleteTicketInteraction(interaction);
    }
  },
  
  async setupTicketSystem(message, channel, supportRole, customMessage) {
    try {
      // Save settings to database
      saveSetting(message.guild.id, 'ticketSupportRole', supportRole.id);
      
      // Create ticket embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${EMOJIS.TICKET} Support Tickets`)
        .setDescription(customMessage)
        .setFooter({ text: 'Click the button below to create a ticket' })
        .setTimestamp();
      
      // Create button for ticket creation
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Create Ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎟️')
        );
      
      // Send ticket message
      const sentMessage = await channel.send({ embeds: [embed], components: [row] });
      
      // Save ticket message ID to database
      saveSetting(message.guild.id, 'ticketMessageId', sentMessage.id);
      saveSetting(message.guild.id, 'ticketChannelId', channel.id);
      
      // Send confirmation
      const confirmEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(`${EMOJIS.TICKET} Ticket System Configured`)
        .setDescription(`Ticket system has been set up in ${channel}.`)
        .addFields(
          { name: 'Support Role', value: supportRole.toString() }
        )
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      return message.reply({ embeds: [confirmEmbed] });
    } catch (error) {
      console.error(`Error setting up ticket system: ${error}`);
      return message.reply(`Failed to set up ticket system: ${error.message}`);
    }
  },
  
  async setupTicketSystemInteraction(interaction, channel, supportRole, customMessage) {
    try {
      // Save settings to database
      saveSetting(interaction.guild.id, 'ticketSupportRole', supportRole.id);
      
      // Create ticket embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${EMOJIS.TICKET} Support Tickets`)
        .setDescription(customMessage)
        .setFooter({ text: 'Click the button below to create a ticket' })
        .setTimestamp();
      
      // Create button for ticket creation
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Create Ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎟️')
        );
      
      // Send ticket message
      const sentMessage = await channel.send({ embeds: [embed], components: [row] });
      
      // Save ticket message ID to database
      saveSetting(interaction.guild.id, 'ticketMessageId', sentMessage.id);
      saveSetting(interaction.guild.id, 'ticketChannelId', channel.id);
      
      // Send confirmation
      const confirmEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(`${EMOJIS.TICKET} Ticket System Configured`)
        .setDescription(`Ticket system has been set up in ${channel}.`)
        .addFields(
          { name: 'Support Role', value: supportRole.toString() }
        )
        .setFooter({ text: 'Developed by gh_sman' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [confirmEmbed] });
    } catch (error) {
      console.error(`Error setting up ticket system: ${error}`);
      return interaction.reply({
        content: `Failed to set up ticket system: ${error.message}`,
        ephemeral: true
      });
    }
  },
  
  async closeTicket(message) {
    // Check if channel is a ticket
    const isTicket = message.channel.name.startsWith('ticket-');
    
    if (!isTicket) {
      return message.reply('This command can only be used in ticket channels.');
    }
    
    // Create confirmation embed
    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle(`${EMOJIS.TICKET} Ticket Closed`)
      .setDescription('This ticket has been closed by a staff member.')
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Create close button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('delete_ticket')
          .setLabel('Delete Ticket')
          .setStyle(ButtonStyle.Danger)
      );
    
    await message.channel.send({ embeds: [embed], components: [row] });
    
    // Remove access for the ticket creator
    const ticketUserId = message.channel.topic?.split(': ')[1];
    
    if (ticketUserId) {
      try {
        await message.channel.permissionOverwrites.edit(ticketUserId, {
          ViewChannel: false,
          SendMessages: false
        });
      } catch (error) {
        console.error(`Error removing user access: ${error}`);
      }
    }
    
    return message.reply('Ticket has been closed.');
  },
  
  async closeTicketInteraction(interaction) {
    // Check if channel is a ticket
    const isTicket = interaction.channel.name.startsWith('ticket-');
    
    if (!isTicket) {
      return interaction.reply({
        content: 'This command can only be used in ticket channels.',
        ephemeral: true
      });
    }
    
    // Create confirmation embed
    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle(`${EMOJIS.TICKET} Ticket Closed`)
      .setDescription('This ticket has been closed by a staff member.')
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Create close button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('delete_ticket')
          .setLabel('Delete Ticket')
          .setStyle(ButtonStyle.Danger)
      );
    
    await interaction.channel.send({ embeds: [embed], components: [row] });
    
    // Remove access for the ticket creator
    const ticketUserId = interaction.channel.topic?.split(': ')[1];
    
    if (ticketUserId) {
      try {
        await interaction.channel.permissionOverwrites.edit(ticketUserId, {
          ViewChannel: false,
          SendMessages: false
        });
      } catch (error) {
        console.error(`Error removing user access: ${error}`);
      }
    }
    
    return interaction.reply('Ticket has been closed.');
  },
  
  async deleteTicket(message) {
    // Check if channel is a ticket
    const isTicket = message.channel.name.startsWith('ticket-');
    
    if (!isTicket) {
      return message.reply('This command can only be used in ticket channels.');
    }
    
    try {
      await message.reply('This ticket will be deleted in 5 seconds...');
      
      // Delete after 5 seconds
      setTimeout(() => {
        message.channel.delete('Ticket deleted by staff')
          .catch(error => console.error(`Error deleting ticket: ${error}`));
      }, 5000);
    } catch (error) {
      console.error(`Error deleting ticket: ${error}`);
      return message.reply(`Failed to delete ticket: ${error.message}`);
    }
  },
  
  async deleteTicketInteraction(interaction) {
    // Check if channel is a ticket
    const isTicket = interaction.channel.name.startsWith('ticket-');
    
    if (!isTicket) {
      return interaction.reply({
        content: 'This command can only be used in ticket channels.',
        ephemeral: true
      });
    }
    
    try {
      await interaction.reply('This ticket will be deleted in 5 seconds...');
      
      // Delete after 5 seconds
      setTimeout(() => {
        interaction.channel.delete('Ticket deleted by staff')
          .catch(error => console.error(`Error deleting ticket: ${error}`));
      }, 5000);
    } catch (error) {
      console.error(`Error deleting ticket: ${error}`);
      return interaction.reply({
        content: `Failed to delete ticket: ${error.message}`,
        ephemeral: true
      });
    }
  }
};