// Slash Command handler utility
const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const { clientId, token } = require('../config.json');

/**
 * Register slash commands with Discord API
 * @param {Client} client - Discord.js client
 */
async function registerSlashCommands(client) {
  const commands = [];
  const commandsDir = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsDir).filter(file => {
    return fs.statSync(path.join(commandsDir, file)).isDirectory();
  });

  // Collect all slash commands from command files
  for (const category of categories) {
    const categoryPath = path.join(commandsDir, category);
    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      const command = require(filePath);
      
      if (command.data) {
        commands.push(command.data.toJSON());
        client.slashCommands.set(command.data.name, command);
      }
    }
  }

  // Register slash commands with Discord API
  const rest = new REST({ version: '10' }).setToken(token || process.env.DISCORD_TOKEN);
  const applicationId = clientId || process.env.DISCORD_CLIENT_ID;

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    if (!applicationId) {
      console.log('Client ID is missing. Skipping slash command registration.');
      return;
    }

    await rest.put(
      Routes.applicationCommands(applicationId),
      { body: commands },
    );

    console.log(`Successfully reloaded application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
}

module.exports = { registerSlashCommands };
