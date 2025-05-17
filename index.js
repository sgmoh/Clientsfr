// Discord All-in-One Bot
// Developed by gh_sman

const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { token } = require('./config.json');
const { loadCommands } = require('./utils/commandHandler');
const { registerSlashCommands } = require('./utils/slashCommandHandler');
const { ensureDatabase } = require('./utils/database');

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.User]
});

// Initialize Collections
client.commands = new Collection();
client.slashCommands = new Collection();
client.aliases = new Collection();
client.voiceConnections = new Collection();
client.prefixes = new Collection();

// Initialize database files
ensureDatabase();

// Load event handlers
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Load commands
loadCommands(client);

// Register slash commands
registerSlashCommands(client);

// Login to Discord with your client's token
client.login(token || process.env.DISCORD_TOKEN);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Bot shutting down...');
  client.destroy();
  process.exit(0);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});
