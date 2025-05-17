const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../utils/database');

module.exports = {
  name: 'leaderboard',
  description: 'Display the server\'s message leaderboard',
  usage: '[daily/total]',
  aliases: ['lb'],
  category: 'leaderboard',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Display the server\'s message leaderboard')
    .addStringOption(option => 
      option.setName('type')
        .setDescription('Type of leaderboard to display')
        .setRequired(false)
        .addChoices(
          { name: 'Daily', value: 'daily' },
          { name: 'Total', value: 'total' }
        )),
  
  async execute(message, args, client) {
    // Determine leaderboard type
    const type = args[0] && args[0].toLowerCase() === 'total' ? 'total' : 'daily';
    
    // Get leaderboard data
    const leaderboardData = getLeaderboard(message.guild.id, type);
    
    if (!leaderboardData || leaderboardData.length === 0) {
      return message.reply('No messages have been tracked yet.');
    }
    
    // Create embed
    const embed = this.createLeaderboardEmbed(leaderboardData, type, message.guild, client);
    
    // Send message
    return message.reply({ embeds: [embed] });
  },
  
  async executeSlash(interaction, client) {
    // Get leaderboard type
    const type = interaction.options.getString('type') || 'daily';
    
    // Get leaderboard data
    const leaderboardData = getLeaderboard(interaction.guild.id, type);
    
    if (!leaderboardData || leaderboardData.length === 0) {
      return interaction.reply('No messages have been tracked yet.');
    }
    
    // Create embed
    const embed = this.createLeaderboardEmbed(leaderboardData, type, interaction.guild, client);
    
    // Send message
    return interaction.reply({ embeds: [embed] });
  },
  
  createLeaderboardEmbed(leaderboardData, type, guild, client) {
    // Create base embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`🏆 ${guild.name} ${type.charAt(0).toUpperCase() + type.slice(1)} Message Leaderboard`)
      .setDescription(`Top message senders in this server for ${type === 'daily' ? 'today' : 'all time'}:`)
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Get top 10 entries
    const top10 = leaderboardData.slice(0, 10);
    
    // Create leaderboard entries
    let description = '';
    
    top10.forEach((entry, index) => {
      const userId = entry[0];
      const count = entry[1];
      
      const user = client.users.cache.get(userId) || { tag: 'Unknown User' };
      
      // Add medal for top 3
      let medal = '';
      if (index === 0) medal = '🥇';
      else if (index === 1) medal = '🥈';
      else if (index === 2) medal = '🥉';
      
      description += `${medal} **${index + 1}. ${user.tag}** - ${count} message${count !== 1 ? 's' : ''}\n`;
    });
    
    embed.setDescription(description);
    
    return embed;
  }
};
