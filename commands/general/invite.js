const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'invite',
  description: 'Get an invite link for the bot',
  aliases: ['inv'],
  category: 'general',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get an invite link for the bot'),
  
  async execute(message, args, client) {
    // Create the invite embed and components
    const { embed, row } = this.createInviteMessage(client);
    
    // Send the embed with button
    return message.reply({ embeds: [embed], components: [row] });
  },
  
  async executeSlash(interaction, client) {
    // Create the invite embed and components
    const { embed, row } = this.createInviteMessage(client);
    
    // Send the embed with button
    return interaction.reply({ embeds: [embed], components: [row] });
  },
  
  createInviteMessage(client) {
    // Generate invite link with required permissions
    const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
    
    // Create button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Invite Me')
          .setStyle(ButtonStyle.Link)
          .setURL(inviteLink)
          .setEmoji('🔗')
      );
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Invite Me to Your Server')
      .setDescription("Thanks for your interest in inviting me! Click the button below to add me to your server.")
      .addFields({
        name: 'Features',
        value: '• Moderation Tools (Ban, Kick, Timeout, Warn, Purge)\n• Message Leaderboard\n• Auto-role\n• 24/7 Voice\n• Server Logs\n• And more!'
      })
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    return { embed, row };
  }
};