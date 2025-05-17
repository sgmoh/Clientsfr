// Bot ready event handler
const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Set bot activity
    client.user.setPresence({
      activities: [{ name: 'Use .help | Developed by gh_sman', type: ActivityType.Watching }],
      status: 'online',
    });
    
    // Log guild count
    console.log(`Bot is serving ${client.guilds.cache.size} servers.`);
  },
};
