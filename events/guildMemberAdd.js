// Guild member add event handler
const { getAutoRole } = require('../utils/database');
const { EmbedBuilder } = require('discord.js');
const { logMemberJoin, logAutoRole } = require('../utils/logManager');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    try {
      // Log the member join event
      logMemberJoin(member);
      
      // Check for auto role
      const autoRoleId = getAutoRole(member.guild.id);
      
      if (autoRoleId) {
        const role = member.guild.roles.cache.get(autoRoleId);
        
        if (role) {
          await member.roles.add(role);
          console.log(`Added auto role ${role.name} to ${member.user.tag} in ${member.guild.name}`);
          
          // Log the auto-role assignment
          logAutoRole(member, role);
        }
      }
      
      // Welcome message in system channel if available
      const systemChannel = member.guild.systemChannel;
      if (systemChannel) {
        const welcomeEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle(`Welcome to ${member.guild.name}!`)
          .setDescription(`Hey ${member}, welcome to the server! 👋`)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields({ 
            name: 'Member Count', 
            value: `You are our ${member.guild.memberCount}${getNumberSuffix(member.guild.memberCount)} member!` 
          })
          .setFooter({ text: 'Developed by gh_sman' })
          .setTimestamp();
        
        systemChannel.send({ content: `Welcome ${member}!`, embeds: [welcomeEmbed] });
      }
    } catch (error) {
      console.error(`Error handling guild member add: ${error}`);
    }
  },
};

// Helper function to get the suffix for a number (1st, 2nd, 3rd, etc.)
function getNumberSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
}
