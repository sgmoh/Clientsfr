// Interaction create event handler
module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.slashCommands.get(interaction.commandName);
      
      if (!command) return;
      
      try {
        await command.executeSlash(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true
        });
      }
    }
    
    // Handle select menus
    else if (interaction.isStringSelectMenu()) {
      // Handle help menu selection
      if (interaction.customId === 'help-category') {
        const categoryName = interaction.values[0];
        const helpCommand = client.commands.get('help');
        
        if (helpCommand) {
          try {
            await helpCommand.handleCategorySelect(interaction, categoryName, client);
          } catch (error) {
            console.error(error);
            await interaction.reply({
              content: 'There was an error while handling the help menu!',
              ephemeral: true
            });
          }
        }
      }
    }
    
    // Handle buttons
    else if (interaction.isButton()) {
      // Add button handlers here when needed
    }
  },
};
