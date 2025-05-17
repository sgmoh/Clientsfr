// Guild member remove event handler
const { logMemberLeave } = require('../utils/logManager');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    try {
      // Log the member leave event
      logMemberLeave(member);
      
      // Goodbye message in system channel if available
      const systemChannel = member.guild.systemChannel;
      if (systemChannel) {
        const leaveEmbed = new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('Member Left')
          .setDescription(`**${member.user.tag}** has left the server.`)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: 'Developed by gh_sman' })
          .setTimestamp();
        
        systemChannel.send({ embeds: [leaveEmbed] });
      }
    } catch (error) {
      console.error(`Error handling guild member remove: ${error}`);
    }
  },
};