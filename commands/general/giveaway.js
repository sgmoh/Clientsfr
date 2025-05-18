const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const EMOJIS = require('../../utils/emojiConfig');
const ms = require('ms');
const { saveSetting, getSetting } = require('../../utils/database');
const fs = require('fs');
const path = require('path');

// Store active giveaways in memory
let activeGiveaways = new Map();

// Load active giveaways from database
function loadGiveaways(client) {
  const giveawaysPath = path.join(__dirname, '../../data/giveaways.json');
  
  // Check if the file exists
  if (fs.existsSync(giveawaysPath)) {
    try {
      const giveawaysData = JSON.parse(fs.readFileSync(giveawaysPath, 'utf8'));
      
      // Load each giveaway
      for (const giveaway of giveawaysData) {
        if (Date.now() < giveaway.endTime) {
          // Only load active giveaways
          const timeLeft = giveaway.endTime - Date.now();
          const giveawayTimeout = setTimeout(() => endGiveaway(giveaway.messageId, giveaway.guildId, client), timeLeft);
          
          activeGiveaways.set(giveaway.messageId, {
            ...giveaway,
            timeout: giveawayTimeout
          });
        }
      }
      
      console.log(`Loaded ${activeGiveaways.size} active giveaways`);
    } catch (error) {
      console.error('Error loading giveaways:', error);
    }
  } else {
    // Create an empty file if it doesn't exist
    saveGiveaways();
  }
}

// Save active giveaways to database
function saveGiveaways() {
  const giveawaysPath = path.join(__dirname, '../../data/giveaways.json');
  const dataDir = path.join(__dirname, '../../data');
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Prepare data to save (exclude timeout)
  const giveawaysToSave = Array.from(activeGiveaways.values()).map(giveaway => {
    const { timeout, ...giveawayData } = giveaway;
    return giveawayData;
  });
  
  // Save to file
  fs.writeFileSync(giveawaysPath, JSON.stringify(giveawaysToSave, null, 2));
}

// End a giveaway and select a winner
async function endGiveaway(messageId, guildId, client) {
  const giveaway = activeGiveaways.get(messageId);
  if (!giveaway) return;
  
  // Clear the timeout
  clearTimeout(giveaway.timeout);
  
  // Get the guild and channel
  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    activeGiveaways.delete(messageId);
    saveGiveaways();
    return;
  }
  
  const channel = guild.channels.cache.get(giveaway.channelId);
  if (!channel) {
    activeGiveaways.delete(messageId);
    saveGiveaways();
    return;
  }
  
  try {
    // Fetch the message
    const message = await channel.messages.fetch(messageId);
    if (!message) {
      activeGiveaways.delete(messageId);
      saveGiveaways();
      return;
    }
    
    // Get participants from reactions
    const reaction = message.reactions.cache.get('🎉');
    
    let winners = [];
    if (reaction) {
      const users = await reaction.users.fetch();
      // Filter out the bot
      const participants = users.filter(user => !user.bot).map(user => user.id);
      
      if (participants.length > 0) {
        // Randomly select winner(s)
        for (let i = 0; i < giveaway.winnerCount; i++) {
          if (participants.length === 0) break;
          
          const winnerIndex = Math.floor(Math.random() * participants.length);
          const winnerId = participants[winnerIndex];
          
          // Avoid duplicate winners
          participants.splice(winnerIndex, 1);
          winners.push(winnerId);
        }
      }
    }
    
    // Create winner list
    let winnerText = 'No one';
    if (winners.length > 0) {
      winnerText = winners.map(id => `<@${id}>`).join(', ');
    }
    
    // Update the giveaway embed
    const endedEmbed = new EmbedBuilder()
      .setColor('#FF5555')
      .setTitle(`${EMOJIS.TICKET} GIVEAWAY ENDED`)
      .setDescription(`**Prize:** ${giveaway.prize}`)
      .addFields(
        { name: 'Winner(s)', value: winnerText },
        { name: 'Hosted by', value: `<@${giveaway.hostId}>` }
      )
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Update the message
    await message.edit({ embeds: [endedEmbed], components: [] });
    
    // Send winner announcement
    if (winners.length > 0) {
      const winMessage = winners.length === 1 
        ? `Congratulations ${winnerText}! You won: **${giveaway.prize}**`
        : `Congratulations ${winnerText}! You all won: **${giveaway.prize}**`;
      
      await channel.send({
        content: winMessage,
        allowedMentions: { users: winners }
      });
    } else {
      await channel.send(`No one participated in the giveaway for **${giveaway.prize}**!`);
    }
    
    // Remove from active giveaways
    activeGiveaways.delete(messageId);
    saveGiveaways();
  } catch (error) {
    console.error('Error ending giveaway:', error);
    activeGiveaways.delete(messageId);
    saveGiveaways();
  }
}

module.exports = {
  name: 'giveaway',
  description: 'Create or manage giveaways',
  usage: '<create/reroll/end> [options]',
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  category: 'general',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Create or manage giveaways')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new giveaway')
        .addStringOption(option => 
          option.setName('prize')
            .setDescription('What are you giving away?')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('duration')
            .setDescription('Duration of the giveaway (e.g., 1h, 1d)')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('winners')
            .setDescription('Number of winners')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10))
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('Channel to host the giveaway in')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('end')
        .setDescription('End a giveaway early')
        .addStringOption(option => 
          option.setName('message_id')
            .setDescription('ID of the giveaway message to end')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('reroll')
        .setDescription('Reroll a giveaway winner')
        .addStringOption(option => 
          option.setName('message_id')
            .setDescription('ID of the giveaway message to reroll')
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  // Load giveaways when bot starts
  init(client) {
    loadGiveaways(client);
  },
  
  async execute(message, args, client) {
    if (!args.length) {
      return message.reply('Please specify an action: `create`, `end`, or `reroll`.');
    }
    
    const action = args[0].toLowerCase();
    
    switch (action) {
      case 'create':
        return this.handleCreate(message, args.slice(1), client);
      case 'end':
        return this.handleEnd(message, args.slice(1), client);
      case 'reroll':
        return this.handleReroll(message, args.slice(1), client);
      default:
        return message.reply('Invalid action. Use `create`, `end`, or `reroll`.');
    }
  },
  
  async executeSlash(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'create':
        return this.handleCreateInteraction(interaction, client);
      case 'end':
        return this.handleEndInteraction(interaction, client);
      case 'reroll':
        return this.handleRerollInteraction(interaction, client);
    }
  },
  
  async handleCreate(message, args, client) {
    if (args.length < 2) {
      return message.reply('Please provide a prize and duration. Example: `giveaway create "Discord Nitro" 1d`');
    }
    
    // Parse arguments
    let prize = args[0];
    let duration = args[1];
    let winnerCount = 1;
    let channel = message.channel;
    
    // Check for quotes for multi-word prize
    if (prize.startsWith('"') && !prize.endsWith('"')) {
      const prizeWords = [];
      prizeWords.push(prize);
      
      let i = 1;
      while (i < args.length && !args[i].endsWith('"')) {
        prizeWords.push(args[i]);
        i++;
      }
      
      if (i < args.length) {
        prizeWords.push(args[i]);
        prize = prizeWords.join(' ').replace(/"/g, '');
        args = args.slice(i + 1);
        duration = args[0];
        
        if (args.length > 1) {
          winnerCount = parseInt(args[1]);
          if (isNaN(winnerCount) || winnerCount < 1) winnerCount = 1;
        }
        
        if (args.length > 2 && message.mentions.channels.size) {
          channel = message.mentions.channels.first();
        }
      }
    } else {
      if (args.length > 2) {
        winnerCount = parseInt(args[2]);
        if (isNaN(winnerCount) || winnerCount < 1) winnerCount = 1;
      }
      
      if (args.length > 3 && message.mentions.channels.size) {
        channel = message.mentions.channels.first();
      }
    }
    
    // Parse duration
    let durationMs;
    try {
      durationMs = ms(duration);
      if (!durationMs || durationMs < 10000 || durationMs > 1209600000) {
        return message.reply('Please provide a valid duration between 10 seconds and 14 days (e.g., 10s, 1h, 1d).');
      }
    } catch (error) {
      return message.reply('Invalid duration format. Use formats like `10s`, `1h`, `1d`.');
    }
    
    // Create giveaway
    await this.createGiveaway(message.guild.id, channel.id, message.author.id, prize, durationMs, winnerCount, client);
    
    // Confirmation message
    return message.reply(`Giveaway created in ${channel.toString()}!`);
  },
  
  async handleCreateInteraction(interaction, client) {
    // Get options
    const prize = interaction.options.getString('prize');
    const duration = interaction.options.getString('duration');
    const winnerCount = interaction.options.getInteger('winners') || 1;
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    
    // Check if channel is a text channel
    if (channel.type !== 0) {
      return interaction.reply({
        content: 'Please provide a text channel for the giveaway.',
        ephemeral: true
      });
    }
    
    // Parse duration
    let durationMs;
    try {
      durationMs = ms(duration);
      if (!durationMs || durationMs < 10000 || durationMs > 1209600000) {
        return interaction.reply({
          content: 'Please provide a valid duration between 10 seconds and 14 days (e.g., 10s, 1h, 1d).',
          ephemeral: true
        });
      }
    } catch (error) {
      return interaction.reply({
        content: 'Invalid duration format. Use formats like `10s`, `1h`, `1d`.',
        ephemeral: true
      });
    }
    
    // Defer reply while creating giveaway
    await interaction.deferReply({ ephemeral: true });
    
    // Create giveaway
    await this.createGiveaway(interaction.guild.id, channel.id, interaction.user.id, prize, durationMs, winnerCount, client);
    
    // Confirmation message
    return interaction.editReply(`Giveaway created in ${channel.toString()}!`);
  },
  
  async createGiveaway(guildId, channelId, hostId, prize, duration, winnerCount, client) {
    // Get end time
    const endTime = Date.now() + duration;
    
    // Get the guild and channel
    const guild = client.guilds.cache.get(guildId);
    const channel = guild.channels.cache.get(channelId);
    
    // Create giveaway embed
    const embed = new EmbedBuilder()
      .setColor('#FF9900')
      .setTitle(`${EMOJIS.TICKET} GIVEAWAY`)
      .setDescription(`**Prize:** ${prize}
      
**Ends:** <t:${Math.floor(endTime / 1000)}:R>
**Winner Count:** ${winnerCount}
      
React with 🎉 to enter!`)
      .addFields(
        { name: 'Hosted by', value: `<@${hostId}>` }
      )
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp(new Date(endTime));
    
    // Create buttons
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('giveaway_enter')
          .setLabel('Enter Giveaway')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎉')
      );
    
    // Send giveaway message
    const giveawayMessage = await channel.send({ embeds: [embed], components: [row] });
    
    // Add initial reaction
    await giveawayMessage.react('🎉');
    
    // Store the giveaway
    const giveawayData = {
      messageId: giveawayMessage.id,
      channelId,
      guildId,
      hostId,
      prize,
      endTime,
      winnerCount,
      timeout: setTimeout(() => endGiveaway(giveawayMessage.id, guildId, client), duration)
    };
    
    activeGiveaways.set(giveawayMessage.id, giveawayData);
    
    // Save to database
    saveGiveaways();
    
    return giveawayMessage;
  },
  
  async handleEnd(message, args, client) {
    if (!args.length) {
      return message.reply('Please provide the message ID of the giveaway to end.');
    }
    
    const messageId = args[0];
    const giveaway = activeGiveaways.get(messageId);
    
    if (!giveaway) {
      return message.reply('No active giveaway found with that message ID.');
    }
    
    if (giveaway.guildId !== message.guild.id) {
      return message.reply('That giveaway is not from this server.');
    }
    
    // End the giveaway
    clearTimeout(giveaway.timeout);
    await endGiveaway(messageId, message.guild.id, client);
    
    return message.reply('Giveaway ended!');
  },
  
  async handleEndInteraction(interaction, client) {
    const messageId = interaction.options.getString('message_id');
    const giveaway = activeGiveaways.get(messageId);
    
    if (!giveaway) {
      return interaction.reply({
        content: 'No active giveaway found with that message ID.',
        ephemeral: true
      });
    }
    
    if (giveaway.guildId !== interaction.guild.id) {
      return interaction.reply({
        content: 'That giveaway is not from this server.',
        ephemeral: true
      });
    }
    
    // Defer reply
    await interaction.deferReply({ ephemeral: true });
    
    // End the giveaway
    clearTimeout(giveaway.timeout);
    await endGiveaway(messageId, interaction.guild.id, client);
    
    return interaction.editReply('Giveaway ended!');
  },
  
  async handleReroll(message, args, client) {
    if (!args.length) {
      return message.reply('Please provide the message ID of the giveaway to reroll.');
    }
    
    const messageId = args[0];
    
    // Don't need to check active giveaways, as we're rerolling a finished one
    const giveawaysPath = path.join(__dirname, '../../data/giveaways.json');
    
    // Check if file exists
    if (!fs.existsSync(giveawaysPath)) {
      return message.reply('No giveaway data found.');
    }
    
    try {
      const giveawaysData = JSON.parse(fs.readFileSync(giveawaysPath, 'utf8'));
      const giveaway = giveawaysData.find(g => g.messageId === messageId);
      
      if (!giveaway || giveaway.guildId !== message.guild.id) {
        return message.reply('No giveaway found with that message ID in this server.');
      }
      
      // Get the channel
      const channel = message.guild.channels.cache.get(giveaway.channelId);
      if (!channel) {
        return message.reply('The channel for that giveaway no longer exists.');
      }
      
      // Fetch the message
      let giveawayMessage;
      try {
        giveawayMessage = await channel.messages.fetch(messageId);
      } catch (error) {
        return message.reply('Could not find the giveaway message. It may have been deleted.');
      }
      
      // Get participants from reactions
      const reaction = giveawayMessage.reactions.cache.get('🎉');
      
      if (!reaction) {
        return message.reply('No participants found.');
      }
      
      const users = await reaction.users.fetch();
      // Filter out the bot
      const participants = users.filter(user => !user.bot).map(user => user);
      
      if (participants.length === 0) {
        return message.reply('No participants found.');
      }
      
      // Randomly select a new winner
      const winnerIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[winnerIndex];
      
      // Send new winner message
      await channel.send({
        content: `Congratulations! The new winner for the **${giveaway.prize}** giveaway is ${winner.toString()}!`,
        allowedMentions: { users: [winner.id] }
      });
      
      return message.reply(`Successfully rerolled! The new winner is ${winner.toString()}.`);
    } catch (error) {
      console.error('Error rerolling giveaway:', error);
      return message.reply('An error occurred while rerolling the giveaway.');
    }
  },
  
  async handleRerollInteraction(interaction, client) {
    const messageId = interaction.options.getString('message_id');
    
    // Defer reply
    await interaction.deferReply({ ephemeral: true });
    
    // Don't need to check active giveaways, as we're rerolling a finished one
    const giveawaysPath = path.join(__dirname, '../../data/giveaways.json');
    
    // Check if file exists
    if (!fs.existsSync(giveawaysPath)) {
      return interaction.editReply('No giveaway data found.');
    }
    
    try {
      const giveawaysData = JSON.parse(fs.readFileSync(giveawaysPath, 'utf8'));
      const giveaway = giveawaysData.find(g => g.messageId === messageId);
      
      if (!giveaway || giveaway.guildId !== interaction.guild.id) {
        return interaction.editReply('No giveaway found with that message ID in this server.');
      }
      
      // Get the channel
      const channel = interaction.guild.channels.cache.get(giveaway.channelId);
      if (!channel) {
        return interaction.editReply('The channel for that giveaway no longer exists.');
      }
      
      // Fetch the message
      let giveawayMessage;
      try {
        giveawayMessage = await channel.messages.fetch(messageId);
      } catch (error) {
        return interaction.editReply('Could not find the giveaway message. It may have been deleted.');
      }
      
      // Get participants from reactions
      const reaction = giveawayMessage.reactions.cache.get('🎉');
      
      if (!reaction) {
        return interaction.editReply('No participants found.');
      }
      
      const users = await reaction.users.fetch();
      // Filter out the bot
      const participants = users.filter(user => !user.bot).map(user => user);
      
      if (participants.length === 0) {
        return interaction.editReply('No participants found.');
      }
      
      // Randomly select a new winner
      const winnerIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[winnerIndex];
      
      // Send new winner message
      await channel.send({
        content: `Congratulations! The new winner for the **${giveaway.prize}** giveaway is ${winner.toString()}!`,
        allowedMentions: { users: [winner.id] }
      });
      
      return interaction.editReply(`Successfully rerolled! The new winner is ${winner.toString()}.`);
    } catch (error) {
      console.error('Error rerolling giveaway:', error);
      return interaction.editReply('An error occurred while rerolling the giveaway.');
    }
  }
};