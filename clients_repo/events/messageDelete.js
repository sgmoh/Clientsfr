// Message delete event handler
const { logMessageDelete } = require('../utils/logManager');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    try {
      // Don't log bot messages or DMs
      if (message.author?.bot || !message.guild) return;
      
      // Log the message deletion
      logMessageDelete(message);
    } catch (error) {
      console.error(`Error handling message delete: ${error}`);
    }
  },
};