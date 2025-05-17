// Message create event handler
const { getPrefix } = require('../utils/database');
const { incrementUserMessageCount } = require('../utils/database');
const { defaultPrefix } = require('../config.json');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Track message for leaderboard
    if (message.guild) {
      incrementUserMessageCount(message.guild.id, message.author.id);
    }
    
    // Handle commands
    if (!message.guild) return; // Ignore DMs
    
    // Get the server's prefix
    const prefix = getPrefix(message.guild.id, defaultPrefix);
    
    // Check if message starts with prefix
    if (!message.content.startsWith(prefix)) return;
    
    // Parse command and arguments
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    // Get command from collection
    const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));
    
    // If command doesn't exist, return
    if (!command) return;
    
    // Check if command can only be used in guilds
    if (command.guildOnly && message.channel.type !== 0) {
      return message.reply('I can\'t execute that command inside DMs!');
    }
    
    // Check if args are required
    if (command.args && !args.length) {
      let reply = `You didn't provide any arguments, ${message.author}!`;
      
      if (command.usage) {
        reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
      }
      
      return message.reply(reply);
    }
    
    // Check permissions
    if (command.permissions && command.permissions.length) {
      const authorPerms = message.channel.permissionsFor(message.author);
      if (!authorPerms || !command.permissions.some(perm => authorPerms.has(perm))) {
        return message.reply('You do not have the required permissions to use this command!');
      }
    }
    
    // Execute command
    try {
      await command.execute(message, args, client);
    } catch (error) {
      console.error(error);
      message.reply('There was an error trying to execute that command!');
    }
  },
};
