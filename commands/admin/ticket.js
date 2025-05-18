const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType, OverwriteType } = require('discord.js');
const { saveSetting, getSetting } = require('../../utils/database');
const EMOJIS = require('../../utils/emojiConfig');

module.exports = {
  name: 'ticket',
  description: 'Set up and manage the ticket system',
  usage: '<setup/close/add/remove>',
  aliases: ['tickets'],
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  category: 'admin',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Set up and manage the ticket system')
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Set up the ticket system')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('The channel to post the ticket panel in')
            .setRequired(true))
        .addRoleOption(option => 
          option.setName('support_role')
            .setDescription('The role that can see and manage tickets')
            .setRequired(true))
        .addChannelOption(option => 
          option.setName('category')
            .setDescription('Category where tickets will be created')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('close')
        .setDescription('Close a ticket channel'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a user to the current ticket')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('User to add to the ticket')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a user from the current ticket')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('User to remove from the ticket')
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  async execute(message, args, client) {
    if (!args.length) {
      return message.reply('Please specify an action: `setup`, `close`, `add`, or `remove`.');
    }
    
    const action = args[0].toLowerCase();
    
    switch (action) {
      case 'setup':
        return this.handleSetup(message, args.slice(1), client);
      case 'close':
        return this.handleClose(message, client);
      case 'add':
        return this.handleAdd(message, args.slice(1), client);
      case 'remove':
        return this.handleRemove(message, args.slice(1), client);
      default:
        return message.reply('Invalid action. Use `setup`, `close`, `add`, or `remove`.');
    }
  },
  
  async executeSlash(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'setup':
        return this.handleSetupInteraction(interaction, client);
      case 'close':
        return this.handleCloseInteraction(interaction, client);
      case 'add':
        return this.handleAddInteraction(interaction, client);
      case 'remove':
        return this.handleRemoveInteraction(interaction, client);
    }
  },
  
  async handleSetup(message, args, client) {
    if (!message.mentions.channels.size || !message.mentions.roles.size) {
      return message.reply('Please mention a channel for the ticket panel and a support role. Example: `ticket setup #tickets @Support`');
    }
    
    const channel = message.mentions.channels.first();
    const supportRole = message.mentions.roles.first();
    
    // Check for category
    let category = null;
    if (args.length > 2) {
      // Try to find the category by name
      const categoryName = args.slice(2).join(' ');
      category = message.guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === categoryName.toLowerCase()
      );
    }
    
    return this.setupTicketSystem(message.guild, channel, supportRole, category, message);
  },
  
  async handleSetupInteraction(interaction, client) {
    const channel = interaction.options.getChannel('channel');
    const supportRole = interaction.options.getRole('support_role');
    const category = interaction.options.getChannel('category');
    
    // Check if channel is a text channel
    if (channel.type !== ChannelType.GuildText) {
      return interaction.reply({
        content: 'Please provide a text channel for the ticket panel.',
        ephemeral: true
      });
    }
    
    // Check if category is valid
    if (category && category.type !== ChannelType.GuildCategory) {
      return interaction.reply({
        content: 'Please provide a valid category channel.',
        ephemeral: true
      });
    }
    
    return this.setupTicketSystem(interaction.guild, channel, supportRole, category, interaction);
  },
  
  async setupTicketSystem(guild, channel, supportRole, category, source) {
    // Save settings to database
    saveSetting(guild.id, 'ticketSupportRole', supportRole.id);
    if (category) {
      saveSetting(guild.id, 'ticketCategory', category.id);
    }
    
    // Create the ticket panel embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${EMOJIS.TICKET} Support Tickets`)
      .setDescription('Need help? Click the button below to create a support ticket!')
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Create the button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket')
          .setLabel('Create Ticket')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎫')
      );
    
    // Send the panel
    await channel.send({ embeds: [embed], components: [row] });
    
    // Create confirmation embed
    const confirmEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(`${EMOJIS.TICKET} Ticket System Setup`)
      .setDescription('The ticket system has been set up successfully!')
      .addFields(
        { name: 'Panel Channel', value: channel.toString() },
        { name: 'Support Role', value: supportRole.toString() },
        { name: 'Ticket Category', value: category ? category.toString() : 'Default' }
      )
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Reply with confirmation
    if (source.reply) {
      return source.reply({ embeds: [confirmEmbed] });
    } else {
      return source.editReply({ embeds: [confirmEmbed] });
    }
  },
  
  async handleClose(message, client) {
    // Check if this is a ticket channel
    const ticketData = getSetting(message.guild.id, `ticket_${message.channel.id}`);
    
    if (!ticketData) {
      return message.reply('This command can only be used in a ticket channel.');
    }
    
    return this.closeTicket(message.channel, message.author, 'closed the ticket', message);
  },
  
  async handleCloseInteraction(interaction, client) {
    // Check if this is a ticket channel
    const ticketData = getSetting(interaction.guild.id, `ticket_${interaction.channel.id}`);
    
    if (!ticketData) {
      return interaction.reply({
        content: 'This command can only be used in a ticket channel.',
        ephemeral: true
      });
    }
    
    return this.closeTicket(interaction.channel, interaction.user, 'closed the ticket', interaction);
  },
  
  async closeTicket(channel, user, reason, source) {
    // Create close confirmation embed
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(`${EMOJIS.TICKET} Ticket Closed`)
      .setDescription(`This ticket has been closed by ${user}.`)
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Send message before closing
    await channel.send({ embeds: [embed] });
    
    // Wait a bit before deleting the channel
    setTimeout(async () => {
      try {
        await channel.delete(`Ticket closed by ${user.tag}`);
      } catch (error) {
        console.error('Error deleting ticket channel:', error);
        if (source && source.reply) {
          await source.reply('There was an error deleting the ticket channel.');
        }
      }
    }, 5000);
    
    // Reply to command
    if (source && source.reply) {
      if (source.deferred) {
        return source.editReply({
          content: 'Ticket will be closed in 5 seconds.',
          ephemeral: true
        });
      } else {
        return source.reply({
          content: 'Ticket will be closed in 5 seconds.',
          ephemeral: true
        });
      }
    }
  },
  
  async handleAdd(message, args, client) {
    // Check if this is a ticket channel
    const ticketData = getSetting(message.guild.id, `ticket_${message.channel.id}`);
    
    if (!ticketData) {
      return message.reply('This command can only be used in a ticket channel.');
    }
    
    // Check if a user is mentioned
    if (!message.mentions.users.size) {
      return message.reply('Please mention a user to add to the ticket.');
    }
    
    const user = message.mentions.users.first();
    return this.addUserToTicket(message.channel, user, message.author, message);
  },
  
  async handleAddInteraction(interaction, client) {
    // Check if this is a ticket channel
    const ticketData = getSetting(interaction.guild.id, `ticket_${interaction.channel.id}`);
    
    if (!ticketData) {
      return interaction.reply({
        content: 'This command can only be used in a ticket channel.',
        ephemeral: true
      });
    }
    
    const user = interaction.options.getUser('user');
    return this.addUserToTicket(interaction.channel, user, interaction.user, interaction);
  },
  
  async addUserToTicket(channel, user, adder, source) {
    // Update channel permissions
    await channel.permissionOverwrites.create(user, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });
    
    // Create notification embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(`${EMOJIS.TICKET} User Added`)
      .setDescription(`${user} has been added to the ticket by ${adder}.`)
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Send notification
    await channel.send({ embeds: [embed] });
    
    // Reply to command
    if (source.reply) {
      return source.reply(`Added ${user} to the ticket.`);
    } else {
      return source.editReply(`Added ${user} to the ticket.`);
    }
  },
  
  async handleRemove(message, args, client) {
    // Check if this is a ticket channel
    const ticketData = getSetting(message.guild.id, `ticket_${message.channel.id}`);
    
    if (!ticketData) {
      return message.reply('This command can only be used in a ticket channel.');
    }
    
    // Check if a user is mentioned
    if (!message.mentions.users.size) {
      return message.reply('Please mention a user to remove from the ticket.');
    }
    
    const user = message.mentions.users.first();
    
    // Parse the ticket data
    let ticketObj;
    try {
      ticketObj = JSON.parse(ticketData);
    } catch (error) {
      ticketObj = { creator: null };
    }
    
    // Don't allow removing the ticket creator
    if (ticketObj.creator === user.id) {
      return message.reply('You cannot remove the ticket creator.');
    }
    
    return this.removeUserFromTicket(message.channel, user, message.author, message);
  },
  
  async handleRemoveInteraction(interaction, client) {
    // Check if this is a ticket channel
    const ticketData = getSetting(interaction.guild.id, `ticket_${interaction.channel.id}`);
    
    if (!ticketData) {
      return interaction.reply({
        content: 'This command can only be used in a ticket channel.',
        ephemeral: true
      });
    }
    
    const user = interaction.options.getUser('user');
    
    // Parse the ticket data
    let ticketObj;
    try {
      ticketObj = JSON.parse(ticketData);
    } catch (error) {
      ticketObj = { creator: null };
    }
    
    // Don't allow removing the ticket creator
    if (ticketObj.creator === user.id) {
      return interaction.reply({
        content: 'You cannot remove the ticket creator.',
        ephemeral: true
      });
    }
    
    return this.removeUserFromTicket(interaction.channel, user, interaction.user, interaction);
  },
  
  async removeUserFromTicket(channel, user, remover, source) {
    // Update channel permissions
    await channel.permissionOverwrites.delete(user.id);
    
    // Create notification embed
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(`${EMOJIS.TICKET} User Removed`)
      .setDescription(`${user} has been removed from the ticket by ${remover}.`)
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Send notification
    await channel.send({ embeds: [embed] });
    
    // Reply to command
    if (source.reply) {
      return source.reply(`Removed ${user} from the ticket.`);
    } else {
      return source.editReply(`Removed ${user} from the ticket.`);
    }
  }
};