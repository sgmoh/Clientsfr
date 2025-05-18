const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const EMOJIS = require('../../utils/emojiConfig');

module.exports = {
  name: 'customize',
  description: 'Customize the bot appearance',
  usage: '<view>',
  aliases: ['custom', 'theme'],
  permissions: [PermissionFlagsBits.Administrator],
  guildOnly: true,
  category: 'admin',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('customize')
    .setDescription('Customize the bot appearance')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View the current custom emojis used by the bot'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(message, args, client) {
    const subcommand = args[0]?.toLowerCase();
    
    if (subcommand === 'view' || !subcommand) {
      return this.viewCustomEmojis(message);
    }
    
    return message.reply('Invalid subcommand. Available subcommands: `view`');
  },
  
  async executeSlash(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'view') {
      return this.viewCustomEmojisInteraction(interaction);
    }
  },
  
  async viewCustomEmojis(message) {
    const embed = this.createCustomEmojisEmbed();
    return message.reply({ embeds: [embed] });
  },
  
  async viewCustomEmojisInteraction(interaction) {
    const embed = this.createCustomEmojisEmbed();
    return interaction.reply({ embeds: [embed] });
  },
  
  createCustomEmojisEmbed() {
    // Create categories of emojis for better organization
    const categories = {
      'Moderation': [
        { name: 'BANNED', emoji: EMOJIS.BANNED, description: 'Used for ban command' },
        { name: 'KICK', emoji: EMOJIS.KICK, description: 'Used for kick command' },
        { name: 'WARN', emoji: EMOJIS.WARN, description: 'Used for warn command' },
        { name: 'TIMEOUT', emoji: EMOJIS.TIMEOUT, description: 'Used for timeout command' },
        { name: 'CLEAR', emoji: EMOJIS.CLEAR, description: 'Used for purge command' }
      ],
      'Systems': [
        { name: 'TICKET', emoji: EMOJIS.TICKET, description: 'Used for ticket system' },
        { name: 'GIVEAWAY', emoji: EMOJIS.GIVEAWAY, description: 'Used for giveaway system' },
        { name: 'REACTIONROLE', emoji: EMOJIS.REACTIONROLE, description: 'Used for reaction roles' },
        { name: 'JOINLEAVE', emoji: EMOJIS.JOINLEAVE, description: 'Used for welcome/leave messages' }
      ],
      'Utilities': [
        { name: 'HELP', emoji: EMOJIS.HELP, description: 'Used for help command' },
        { name: 'LOGS', emoji: EMOJIS.LOGS, description: 'Used for logging system' },
        { name: 'CLIPBOARD', emoji: EMOJIS.CLIPBOARD, description: 'Used for leaderboard' },
        { name: 'PREFIX', emoji: EMOJIS.PREFIX, description: 'Used for prefix command' }
      ],
      'Voice': [
        { name: 'JOIN', emoji: EMOJIS.JOIN, description: 'Used for voice join command' },
        { name: 'LEAVE', emoji: EMOJIS.LEAVE, description: 'Used for voice leave command' },
        { name: 'MUTE', emoji: EMOJIS.MUTE, description: 'Used for voice mute functions' }
      ]
    };
    
    // Create the embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${EMOJIS.MULTIPURPOSE} Custom Emojis Overview`)
      .setDescription('Here are all the custom emojis used by the bot:')
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Add each category as a field
    for (const [category, emojis] of Object.entries(categories)) {
      const emojiText = emojis.map(e => `${e.emoji} **${e.name}** - ${e.description}`).join('\n');
      embed.addFields({ name: `${category} Emojis`, value: emojiText });
    }
    
    return embed;
  }
};