const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType } = require('discord.js');
const { saveSetting, getSetting } = require('../../utils/database');
const EMOJIS = require('../../utils/emojiConfig');
const fs = require('fs');
const path = require('path');

// Store active reaction role messages
let reactionRoles = new Map();

// Load reaction roles from database
function loadReactionRoles() {
  const rolesPath = path.join(__dirname, '../../data/reactionroles.json');
  
  // Check if the file exists
  if (fs.existsSync(rolesPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
      
      // Convert the array to a map
      for (const entry of data) {
        reactionRoles.set(`${entry.guildId}-${entry.messageId}`, entry);
      }
      
      console.log(`Loaded ${reactionRoles.size} reaction role messages`);
    } catch (error) {
      console.error('Error loading reaction roles:', error);
    }
  } else {
    // Create an empty file if it doesn't exist
    saveReactionRoles();
  }
}

// Save reaction roles to database
function saveReactionRoles() {
  const rolesPath = path.join(__dirname, '../../data/reactionroles.json');
  const dataDir = path.join(__dirname, '../../data');
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Convert map to array and save
  const data = Array.from(reactionRoles.values());
  fs.writeFileSync(rolesPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'reactionroles',
  description: 'Create and manage reaction role messages',
  usage: '<create/list/remove>',
  aliases: ['rr', 'roles'],
  permissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  category: 'admin',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('reactionroles')
    .setDescription('Create and manage reaction role messages')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new reaction role message')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('The channel to post the reaction role message in')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('title')
            .setDescription('Title for the reaction role message')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('description')
            .setDescription('Description for the reaction role message')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a role to an existing reaction role message')
        .addStringOption(option => 
          option.setName('message_id')
            .setDescription('ID of the reaction role message')
            .setRequired(true))
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The role to add')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('emoji')
            .setDescription('Emoji for the role button')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('label')
            .setDescription('Text label for the button')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all reaction role messages in this server'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a reaction role message')
        .addStringOption(option => 
          option.setName('message_id')
            .setDescription('ID of the reaction role message to remove')
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  // Load reaction roles when bot starts
  init(client) {
    loadReactionRoles();
    
    // Set up event listener for button clicks
    client.on('interactionCreate', interaction => {
      if (!interaction.isButton()) return;
      
      const { customId } = interaction;
      
      // Check if this is a reaction role button
      if (customId.startsWith('role_')) {
        this.handleRoleButton(interaction);
      }
    });
  },
  
  async execute(message, args, client) {
    if (!args.length) {
      return message.reply('Please specify an action: `create`, `add`, `list`, or `remove`.');
    }
    
    const action = args[0].toLowerCase();
    
    switch (action) {
      case 'create':
        return this.handleCreate(message, args.slice(1), client);
      case 'add':
        return this.handleAdd(message, args.slice(1), client);
      case 'list':
        return this.handleList(message, client);
      case 'remove':
        return this.handleRemove(message, args.slice(1), client);
      default:
        return message.reply('Invalid action. Use `create`, `add`, `list`, or `remove`.');
    }
  },
  
  async executeSlash(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'create':
        return this.handleCreateInteraction(interaction, client);
      case 'add':
        return this.handleAddInteraction(interaction, client);
      case 'list':
        return this.handleListInteraction(interaction, client);
      case 'remove':
        return this.handleRemoveInteraction(interaction, client);
    }
  },
  
  async handleCreate(message, args, client) {
    if (args.length < 3 || !message.mentions.channels.size) {
      return message.reply('Please provide a channel, title, and description. Example: `reactionroles create #roles Roles Choose your roles`');
    }
    
    const channel = message.mentions.channels.first();
    const title = args[1];
    const description = args.slice(2).join(' ');
    
    return this.createReactionRoleMessage(channel, title, description, message.author, message);
  },
  
  async handleCreateInteraction(interaction, client) {
    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    
    // Check if channel is a text channel
    if (channel.type !== ChannelType.GuildText) {
      return interaction.reply({
        content: 'Please provide a text channel for the reaction roles.',
        ephemeral: true
      });
    }
    
    // Defer reply while creating message
    await interaction.deferReply({ ephemeral: true });
    
    return this.createReactionRoleMessage(channel, title, description, interaction.user, interaction);
  },
  
  async createReactionRoleMessage(channel, title, description, author, source) {
    // Create the reaction role embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${EMOJIS.REACTIONROLE} ${title}`)
      .setDescription(description)
      .setFooter({ text: 'Click the buttons below to get or remove roles' })
      .setTimestamp();
    
    // No buttons initially
    const row = new ActionRowBuilder();
    
    // Send the message
    const message = await channel.send({ embeds: [embed], components: [row] });
    
    // Store the reaction role message
    const reactionRole = {
      guildId: channel.guild.id,
      channelId: channel.id,
      messageId: message.id,
      roles: [],
      createdBy: author.id,
      createdAt: Date.now()
    };
    
    reactionRoles.set(`${channel.guild.id}-${message.id}`, reactionRole);
    saveReactionRoles();
    
    // Success message
    if (source.reply) {
      return source.reply(`Reaction role message created in ${channel}. Use \`reactionroles add ${message.id} @Role emoji label\` to add roles.`);
    } else {
      return source.editReply(`Reaction role message created in ${channel}. Use \`/reactionroles add\` with message ID \`${message.id}\` to add roles.`);
    }
  },
  
  async handleAdd(message, args, client) {
    if (args.length < 4 || !message.mentions.roles.size) {
      return message.reply('Please provide a message ID, role, emoji, and label. Example: `reactionroles add 123456789 @Role 🔴 Red Team`');
    }
    
    const messageId = args[0];
    const role = message.mentions.roles.first();
    const emoji = args[2];
    const label = args.slice(3).join(' ');
    
    return this.addRoleToMessage(message.guild.id, messageId, role, emoji, label, message);
  },
  
  async handleAddInteraction(interaction, client) {
    const messageId = interaction.options.getString('message_id');
    const role = interaction.options.getRole('role');
    const emoji = interaction.options.getString('emoji');
    const label = interaction.options.getString('label');
    
    // Defer reply
    await interaction.deferReply({ ephemeral: true });
    
    return this.addRoleToMessage(interaction.guild.id, messageId, role, emoji, label, interaction);
  },
  
  async addRoleToMessage(guildId, messageId, role, emoji, label, source) {
    // Check if the reaction role message exists
    const reactionRole = reactionRoles.get(`${guildId}-${messageId}`);
    
    if (!reactionRole) {
      if (source.reply) {
        return source.reply('No reaction role message found with that ID.');
      } else {
        return source.editReply('No reaction role message found with that ID.');
      }
    }
    
    // Get the guild, channel, and message
    const guild = source.guild;
    const channel = guild.channels.cache.get(reactionRole.channelId);
    
    if (!channel) {
      if (source.reply) {
        return source.reply('The channel for that reaction role message no longer exists.');
      } else {
        return source.editReply('The channel for that reaction role message no longer exists.');
      }
    }
    
    // Fetch the message
    let message;
    try {
      message = await channel.messages.fetch(messageId);
    } catch (error) {
      if (source.reply) {
        return source.reply('Failed to fetch the reaction role message. It may have been deleted.');
      } else {
        return source.editReply('Failed to fetch the reaction role message. It may have been deleted.');
      }
    }
    
    // Check if the role is already in the message
    const existingRole = reactionRole.roles.find(r => r.id === role.id);
    if (existingRole) {
      if (source.reply) {
        return source.reply(`The role ${role} is already in the reaction role message.`);
      } else {
        return source.editReply(`The role ${role} is already in the reaction role message.`);
      }
    }
    
    // Check if we have room for more buttons (max 5 per row)
    if (reactionRole.roles.length >= 25) {
      if (source.reply) {
        return source.reply('The reaction role message already has the maximum number of roles (25).');
      } else {
        return source.editReply('The reaction role message already has the maximum number of roles (25).');
      }
    }
    
    // Add the role to the reaction role message
    reactionRole.roles.push({
      id: role.id,
      emoji: emoji,
      label: label
    });
    
    // Update the stored data
    saveReactionRoles();
    
    // Update the message with the new button
    await this.updateReactionRoleMessage(guild, message, reactionRole);
    
    // Success message
    if (source.reply) {
      return source.reply(`Added ${role} to the reaction role message.`);
    } else {
      return source.editReply(`Added ${role} to the reaction role message.`);
    }
  },
  
  async updateReactionRoleMessage(guild, message, reactionRole) {
    // Get the original embed
    const embed = message.embeds[0];
    
    // Create button rows (max 5 buttons per row)
    const rows = [];
    let currentRow = new ActionRowBuilder();
    let buttonsInRow = 0;
    
    for (const role of reactionRole.roles) {
      // If the current row is full, start a new one
      if (buttonsInRow === 5) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
        buttonsInRow = 0;
      }
      
      // Add button to the current row
      currentRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`role_${role.id}`)
          .setLabel(role.label)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(role.emoji)
      );
      
      buttonsInRow++;
    }
    
    // Add the last row if it has buttons
    if (buttonsInRow > 0) {
      rows.push(currentRow);
    }
    
    // Update the message
    await message.edit({ embeds: [embed], components: rows });
  },
  
  async handleRoleButton(interaction) {
    // Extract the role ID from the custom ID
    const roleId = interaction.customId.replace('role_', '');
    const member = interaction.member;
    
    // Get the role
    const role = interaction.guild.roles.cache.get(roleId);
    
    if (!role) {
      return interaction.reply({
        content: 'That role no longer exists.',
        ephemeral: true
      });
    }
    
    // Check if the bot can manage this role
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        content: 'I cannot assign this role as it is positioned higher than or equal to my highest role.',
        ephemeral: true
      });
    }
    
    // Toggle the role
    try {
      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId);
        return interaction.reply({
          content: `Removed the ${role.name} role.`,
          ephemeral: true
        });
      } else {
        await member.roles.add(roleId);
        return interaction.reply({
          content: `Added the ${role.name} role.`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error toggling role:', error);
      return interaction.reply({
        content: 'There was an error toggling the role.',
        ephemeral: true
      });
    }
  },
  
  async handleList(message, client) {
    return this.listReactionRoles(message.guild.id, message);
  },
  
  async handleListInteraction(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    return this.listReactionRoles(interaction.guild.id, interaction);
  },
  
  async listReactionRoles(guildId, source) {
    // Filter reaction roles for this guild
    const guildReactionRoles = Array.from(reactionRoles.values())
      .filter(rr => rr.guildId === guildId);
    
    if (guildReactionRoles.length === 0) {
      if (source.reply) {
        return source.reply('There are no reaction role messages in this server.');
      } else {
        return source.editReply('There are no reaction role messages in this server.');
      }
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${EMOJIS.REACTIONROLE} Reaction Role Messages`)
      .setDescription(`Found ${guildReactionRoles.length} reaction role messages in this server.`)
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Add fields for each reaction role message
    for (const rr of guildReactionRoles) {
      const channel = source.guild.channels.cache.get(rr.channelId);
      const channelName = channel ? channel.name : 'Unknown Channel';
      
      embed.addFields({
        name: `Message ID: ${rr.messageId}`,
        value: `Channel: #${channelName}\nRoles: ${rr.roles.length}`
      });
    }
    
    // Send the list
    if (source.reply) {
      return source.reply({ embeds: [embed] });
    } else {
      return source.editReply({ embeds: [embed] });
    }
  },
  
  async handleRemove(message, args, client) {
    if (!args.length) {
      return message.reply('Please provide the message ID of the reaction role message to remove.');
    }
    
    const messageId = args[0];
    return this.removeReactionRoleMessage(message.guild.id, messageId, message);
  },
  
  async handleRemoveInteraction(interaction, client) {
    const messageId = interaction.options.getString('message_id');
    
    // Defer reply
    await interaction.deferReply({ ephemeral: true });
    
    return this.removeReactionRoleMessage(interaction.guild.id, messageId, interaction);
  },
  
  async removeReactionRoleMessage(guildId, messageId, source) {
    // Check if the reaction role message exists
    const reactionRole = reactionRoles.get(`${guildId}-${messageId}`);
    
    if (!reactionRole) {
      if (source.reply) {
        return source.reply('No reaction role message found with that ID.');
      } else {
        return source.editReply('No reaction role message found with that ID.');
      }
    }
    
    // Delete the message
    try {
      const guild = source.guild;
      const channel = guild.channels.cache.get(reactionRole.channelId);
      
      if (channel) {
        const message = await channel.messages.fetch(messageId);
        if (message) {
          await message.delete();
        }
      }
    } catch (error) {
      console.error('Error deleting reaction role message:', error);
    }
    
    // Remove from storage
    reactionRoles.delete(`${guildId}-${messageId}`);
    saveReactionRoles();
    
    // Success message
    if (source.reply) {
      return source.reply('Reaction role message removed.');
    } else {
      return source.editReply('Reaction role message removed.');
    }
  }
};