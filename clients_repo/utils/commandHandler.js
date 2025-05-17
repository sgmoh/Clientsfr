// Command handler utility
const fs = require('fs');
const path = require('path');

/**
 * Load all commands from the commands directory
 * @param {Client} client - Discord.js client
 */
function loadCommands(client) {
  const commandsDir = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsDir).filter(file => {
    return fs.statSync(path.join(commandsDir, file)).isDirectory();
  });

  console.log(`Loading commands from ${categories.length} categories...`);

  // Load commands from each category folder
  for (const category of categories) {
    const categoryPath = path.join(commandsDir, category);
    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
    
    console.log(`Loading ${commandFiles.length} commands from ${category} category`);
    
    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      const command = require(filePath);
      
      // Set the command category
      command.category = category;
      
      // Add to commands collection
      if (command.name) {
        client.commands.set(command.name, command);
        console.log(`Loaded command: ${command.name}`);
        
        // Add aliases if they exist
        if (command.aliases && Array.isArray(command.aliases)) {
          command.aliases.forEach(alias => {
            client.aliases.set(alias, command.name);
          });
        }
      } else {
        console.log(`Command at ${filePath} is missing a name property!`);
      }
    }
  }
  
  console.log(`Successfully loaded ${client.commands.size} commands!`);
}

module.exports = { loadCommands };
