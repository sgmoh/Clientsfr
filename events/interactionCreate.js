const { saveSetting, getSetting } = require('../utils/database');
const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EMOJIS = require('../utils/emojiConfig');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    // Handle button interactions
    if (interaction.isButton()) {
      switch (interaction.customId) {
        case 'create_ticket':
          // Handle ticket creation
          await handleTicketCreation(interaction, client);
          break;
          
        case 'close_ticket':
          // Handle ticket closing
          await handleTicketClose(interaction, client);
          break;
          
        case 'delete_ticket':
          // Handle ticket deletion
          try {
            await interaction.reply('This ticket will be deleted in 5 seconds...');
            setTimeout(() => {
              interaction.channel.delete(`Ticket deleted by ${interaction.user.tag}`)
                .catch(error => console.error(`Error deleting ticket: ${error}`));
            }, 5000);
          } catch (error) {
            console.error('Error deleting ticket:', error);
            await interaction.reply({
              content: 'There was an error deleting this ticket.',
              ephemeral: true
            });
          }
          break;
          
        case 'giveaway_enter':
          // Handle giveaway entry - just add the reaction for now
          try {
            const message = interaction.message;
            await message.react('🎉');
            
            await interaction.reply({
              content: 'You have entered the giveaway!',
              ephemeral: true
            });
          } catch (error) {
            console.error('Error entering giveaway:', error);
            await interaction.reply({
              content: 'There was an error entering the giveaway.',
              ephemeral: true
            });
          }
          break;
          
        default:
          // Handle other button interactions (like reaction roles) elsewhere
          break;
      }
    }
    
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.slashCommands.get(interaction.commandName);
      
      if (!command) return;
      
      try {
        await command.executeSlash(interaction, client);
      } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        await interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true
        });
      }
    }
    
    // Handle select menu interactions
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'help-category') {
        try {
          // Get the help command
          const helpCommand = client.commands.get('help');
          
          // Handle the category selection
          await helpCommand.handleCategorySelect(interaction, interaction.values[0], client);
        } catch (error) {
          console.error('Error handling help menu:', error);
          // Only reply if the interaction hasn't been replied to yet
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: 'There was an error while handling the help menu!',
              ephemeral: true
            }).catch(err => console.error('Error sending error response:', err));
          }
        }
      }
    }
  }
};

// Handle ticket creation
async function handleTicketCreation(interaction, client) {
  // Get support role ID
  const supportRoleId = getSetting(interaction.guild.id, 'ticketSupportRole');
  if (!supportRoleId) {
    return interaction.reply({
      content: 'The ticket system is not properly configured. Please contact an administrator.',
      ephemeral: true
    });
  }
  
  // Get category ID (if set)
  const categoryId = getSetting(interaction.guild.id, 'ticketCategory');
  
  // Create a unique channel name
  const channelName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  
  try {
    // Create the ticket channel
    const ticketChannel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: categoryId || null,
      permissionOverwrites: [
        {
          id: interaction.guild.id, // @everyone role
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        },
        {
          id: supportRoleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        },
        {
          id: client.user.id, // Bot itself
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        }
      ]
    });
    
    // Save ticket data
    const ticketData = {
      creator: interaction.user.id,
      createdAt: Date.now()
    };
    
    saveSetting(interaction.guild.id, `ticket_${ticketChannel.id}`, JSON.stringify(ticketData));
    
    // Create welcome embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${EMOJIS.TICKET} Support Ticket`)
      .setDescription(`Thank you for creating a ticket, ${interaction.user}. Please describe your issue and a staff member will assist you shortly.`)
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Create close button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );
    
    // Send welcome message
    await ticketChannel.send({ 
      content: `${interaction.user} | <@&${supportRoleId}>`,
      embeds: [embed],
      components: [row]
    });
    
    // Acknowledge the interaction
    await interaction.reply({
      content: `Your ticket has been created: ${ticketChannel}`,
      ephemeral: true
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    await interaction.reply({
      content: 'There was an error creating your ticket. Please try again later.',
      ephemeral: true
    });
  }
}

// Handle ticket closing
async function handleTicketClose(interaction, client) {
  // Get the ticket command to use its close function
  const ticketCommand = client.commands.get('ticket');
  
  if (ticketCommand) {
    await ticketCommand.closeTicket(interaction.channel, interaction.user, 'closed the ticket using the button', interaction);
  } else {
    // Fallback if command not found
    await interaction.reply({
      content: 'Ticket will be closed in 5 seconds.',
      ephemeral: true
    });
    
    setTimeout(async () => {
      try {
        await interaction.channel.delete(`Ticket closed by ${interaction.user.tag}`);
      } catch (error) {
        console.error('Error deleting ticket channel:', error);
      }
    }, 5000);
  }
}