// Log manager utility
const { EmbedBuilder } = require('discord.js');
const { getSetting } = require('./database');

/**
 * Send a log message to the designated logging channel
 * @param {Guild} guild - The guild to log for
 * @param {EmbedBuilder} embed - The embed to send
 * @returns {boolean} Whether the log was sent successfully
 */
async function sendLogEmbed(guild, embed) {
  try {
    const channelId = getSetting(guild.id, 'logsChannel');
    
    if (!channelId) {
      return false; // Logging is not enabled
    }
    
    const channel = guild.channels.cache.get(channelId);
    
    if (!channel) {
      // Channel no longer exists, disable logging
      require('./database').saveSetting(guild.id, 'logsChannel', null);
      return false;
    }
    
    // Add footer and timestamp if not already present
    if (!embed.data.footer) {
      embed.setFooter({ text: 'Developed by gh_sman' });
    }
    
    if (!embed.data.timestamp) {
      embed.setTimestamp();
    }
    
    await channel.send({ embeds: [embed] });
    return true;
  } catch (error) {
    console.error(`Error sending log: ${error}`);
    return false;
  }
}

/**
 * Log a member join event
 * @param {GuildMember} member - The member who joined
 * @returns {boolean} Whether the log was sent successfully
 */
async function logMemberJoin(member) {
  const embed = new EmbedBuilder()
    .setColor('#2ECC71')
    .setTitle('👋 Member Joined')
    .setDescription(`**${member.user.tag}** has joined the server.`)
    .addFields(
      { name: 'Account Created', value: member.user.createdAt.toUTCString(), inline: true },
      { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
      { name: 'User ID', value: member.id, inline: true }
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
    
  return sendLogEmbed(member.guild, embed);
}

/**
 * Log a member leave event
 * @param {GuildMember} member - The member who left
 * @returns {boolean} Whether the log was sent successfully
 */
async function logMemberLeave(member) {
  const embed = new EmbedBuilder()
    .setColor('#E74C3C')
    .setTitle('👋 Member Left')
    .setDescription(`**${member.user.tag}** has left the server.`)
    .addFields(
      { name: 'Joined At', value: member.joinedAt ? member.joinedAt.toUTCString() : 'Unknown', inline: true },
      { name: 'New Member Count', value: `${member.guild.memberCount}`, inline: true },
      { name: 'User ID', value: member.id, inline: true }
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
    
  return sendLogEmbed(member.guild, embed);
}

/**
 * Log a message delete event
 * @param {Message} message - The deleted message
 * @returns {boolean} Whether the log was sent successfully
 */
async function logMessageDelete(message) {
  if (!message.guild || message.author.bot) return false;
  
  const contentToShow = message.content.length > 1024 
    ? message.content.slice(0, 1021) + '...' 
    : message.content || 'No text content';
  
  const embed = new EmbedBuilder()
    .setColor('#FF9800')
    .setTitle('🗑️ Message Deleted')
    .setDescription(`A message by **${message.author.tag}** was deleted in ${message.channel}.`)
    .addFields(
      { name: 'Content', value: contentToShow },
      { name: 'Channel', value: `${message.channel.name} (${message.channel.id})`, inline: true },
      { name: 'Author ID', value: message.author.id, inline: true }
    );
    
  // Add attachment info if it exists
  if (message.attachments.size > 0) {
    embed.addFields({ 
      name: 'Attachments', 
      value: message.attachments.map(a => a.name || 'Unnamed attachment').join(', ') 
    });
  }
    
  return sendLogEmbed(message.guild, embed);
}

/**
 * Log a role assignment event
 * @param {GuildMember} member - The member receiving the role
 * @param {Role} role - The role being assigned
 * @param {string} reason - The reason for the assignment (e.g. "Auto-role")
 * @returns {boolean} Whether the log was sent successfully
 */
async function logRoleAdd(member, role, reason = 'Manual assignment') {
  const embed = new EmbedBuilder()
    .setColor(role.hexColor === '#000000' ? '#7289DA' : role.hexColor)
    .setTitle('📥 Role Added')
    .setDescription(`**${member.user.tag}** has been given the **${role.name}** role.`)
    .addFields(
      { name: 'Member', value: `${member.user.tag} (${member.id})`, inline: true },
      { name: 'Role', value: `${role.name} (${role.id})`, inline: true },
      { name: 'Reason', value: reason, inline: true }
    );
    
  return sendLogEmbed(member.guild, embed);
}

/**
 * Log a role removal event
 * @param {GuildMember} member - The member losing the role
 * @param {Role} role - The role being removed
 * @param {string} reason - The reason for the removal
 * @returns {boolean} Whether the log was sent successfully
 */
async function logRoleRemove(member, role, reason = 'Manual removal') {
  const embed = new EmbedBuilder()
    .setColor(role.hexColor === '#000000' ? '#7289DA' : role.hexColor)
    .setTitle('📤 Role Removed')
    .setDescription(`The **${role.name}** role has been removed from **${member.user.tag}**.`)
    .addFields(
      { name: 'Member', value: `${member.user.tag} (${member.id})`, inline: true },
      { name: 'Role', value: `${role.name} (${role.id})`, inline: true },
      { name: 'Reason', value: reason, inline: true }
    );
    
  return sendLogEmbed(member.guild, embed);
}

/**
 * Log a moderation action
 * @param {Guild} guild - The guild where the action occurred
 * @param {User} moderator - The moderator who performed the action
 * @param {User} target - The target of the moderation action
 * @param {string} action - The action performed (e.g. "Ban", "Kick", "Timeout")
 * @param {string} reason - The reason for the action
 * @returns {boolean} Whether the log was sent successfully
 */
async function logModAction(guild, moderator, target, action, reason = 'No reason provided') {
  const colors = {
    'Ban': '#E74C3C',
    'Kick': '#FF9800',
    'Timeout': '#F1C40F',
    'Warn': '#FFEB3B',
    'Unban': '#2ECC71'
  };
  
  const embed = new EmbedBuilder()
    .setColor(colors[action] || '#7289DA')
    .setTitle(`🛡️ ${action} Action`)
    .setDescription(`**${target.tag}** has been ${action.toLowerCase()}ed.`)
    .addFields(
      { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
      { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true },
      { name: 'Reason', value: reason }
    );
    
  return sendLogEmbed(guild, embed);
}

/**
 * Log when auto-role is applied to a new member
 * @param {GuildMember} member - The member receiving the auto-role
 * @param {Role} role - The auto-role that was applied
 * @returns {boolean} Whether the log was sent successfully
 */
async function logAutoRole(member, role) {
  return logRoleAdd(member, role, 'Auto-role for new members');
}

module.exports = {
  sendLogEmbed,
  logMemberJoin,
  logMemberLeave,
  logMessageDelete,
  logRoleAdd,
  logRoleRemove,
  logModAction,
  logAutoRole
};