const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'serverinfo',
  description: 'Displays information about the server',
  aliases: ['server', 'guildinfo'],
  category: 'general',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Displays information about the server'),
  
  async execute(message, args, client) {
    const guild = message.guild;
    
    // Create the server info embed
    const embed = this.createServerInfoEmbed(guild);
    
    // Send the embed
    return message.reply({ embeds: [embed] });
  },
  
  async executeSlash(interaction, client) {
    const guild = interaction.guild;
    
    // Create the server info embed
    const embed = this.createServerInfoEmbed(guild);
    
    // Send the embed
    return interaction.reply({ embeds: [embed] });
  },
  
  createServerInfoEmbed(guild) {
    // Get verification level
    const verificationLevel = {
      0: 'None',
      1: 'Low',
      2: 'Medium',
      3: 'High',
      4: 'Very High'
    };
    
    // Get content filter level
    const filterLevel = {
      0: 'Disabled',
      1: 'Members without roles',
      2: 'All members'
    };
    
    // Count categories, text channels, and voice channels
    const categoryCount = guild.channels.cache.filter(c => c.type === 4).size;
    const textChannelCount = guild.channels.cache.filter(c => c.type === 0).size;
    const voiceChannelCount = guild.channels.cache.filter(c => c.type === 2).size;
    const threadCount = guild.channels.cache.filter(c => [10, 11, 12].includes(c.type)).size;
    
    // Get member counts
    const totalMembers = guild.memberCount;
    const botCount = guild.members.cache.filter(m => m.user.bot).size;
    const humanCount = totalMembers - botCount;
    
    // Get online/offline members if available
    const onlineCount = guild.members.cache.filter(m => m.presence?.status === 'online' || m.presence?.status === 'idle' || m.presence?.status === 'dnd').size;
    
    // Create the embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${guild.name} - Server Information`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: '📋 General Info', value: 
          `**ID:** ${guild.id}
           **Owner:** <@${guild.ownerId}>
           **Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>
           **Verification Level:** ${verificationLevel[guild.verificationLevel]}
           **Content Filter:** ${filterLevel[guild.explicitContentFilter]}`
        },
        { name: '📊 Statistics', value: 
          `**Total Members:** ${totalMembers}
           **Humans:** ${humanCount}
           **Bots:** ${botCount}
           ${onlineCount ? `**Online:** ${onlineCount}` : ''}`
        },
        { name: '📢 Channels', value: 
          `**Categories:** ${categoryCount}
           **Text Channels:** ${textChannelCount}
           **Voice Channels:** ${voiceChannelCount}
           **Threads:** ${threadCount}
           **Total:** ${guild.channels.cache.size}`
        },
        { name: '✨ Other', value: 
          `**Roles:** ${guild.roles.cache.size}
           **Emojis:** ${guild.emojis.cache.size}
           **Boost Level:** ${guild.premiumTier}
           **Boosts:** ${guild.premiumSubscriptionCount || 0}`
        }
      )
      .setFooter({ text: 'Developed by gh_sman' })
      .setTimestamp();
    
    // Add server description if it exists
    if (guild.description) {
      embed.setDescription(guild.description);
    }
    
    // Add server banner if it exists
    if (guild.bannerURL()) {
      embed.setImage(guild.bannerURL({ size: 1024 }));
    }
    
    return embed;
  }
};