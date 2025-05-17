// Database utility for file-based storage
const fs = require('fs');
const path = require('path');

// Define database file paths
const dbFolder = path.join(__dirname, '..', 'data');
const messageStatsFile = path.join(dbFolder, 'messageStats.json');
const prefixesFile = path.join(dbFolder, 'prefixes.json');
const warningsFile = path.join(dbFolder, 'warnings.json');
const autoRolesFile = path.join(dbFolder, 'autoRoles.json');
const settingsFile = path.join(dbFolder, 'settings.json');

/**
 * Ensures all database files exist and are valid JSON
 */
function ensureDatabase() {
  // Make sure the data directory exists
  if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
  }

  // Initialize message stats file if it doesn't exist
  if (!fs.existsSync(messageStatsFile)) {
    fs.writeFileSync(messageStatsFile, JSON.stringify({}, null, 2));
  }

  // Initialize prefixes file if it doesn't exist
  if (!fs.existsSync(prefixesFile)) {
    fs.writeFileSync(prefixesFile, JSON.stringify({}, null, 2));
  }

  // Initialize warnings file if it doesn't exist
  if (!fs.existsSync(warningsFile)) {
    fs.writeFileSync(warningsFile, JSON.stringify({}, null, 2));
  }

  // Initialize auto roles file if it doesn't exist
  if (!fs.existsSync(autoRolesFile)) {
    fs.writeFileSync(autoRolesFile, JSON.stringify({}, null, 2));
  }

  // Initialize settings file if it doesn't exist
  if (!fs.existsSync(settingsFile)) {
    fs.writeFileSync(settingsFile, JSON.stringify({}, null, 2));
  }
}

/**
 * Get server prefix
 * @param {string} guildId - Guild ID
 * @param {string} defaultPrefix - Default prefix to use if not set
 * @returns {string} Server prefix
 */
function getPrefix(guildId, defaultPrefix) {
  try {
    const prefixes = JSON.parse(fs.readFileSync(prefixesFile));
    return prefixes[guildId] || defaultPrefix;
  } catch (error) {
    console.error('Error reading prefixes:', error);
    return defaultPrefix;
  }
}

/**
 * Set server prefix
 * @param {string} guildId - Guild ID
 * @param {string} prefix - Prefix to set
 */
function setPrefix(guildId, prefix) {
  try {
    const prefixes = JSON.parse(fs.readFileSync(prefixesFile));
    prefixes[guildId] = prefix;
    fs.writeFileSync(prefixesFile, JSON.stringify(prefixes, null, 2));
  } catch (error) {
    console.error('Error setting prefix:', error);
  }
}

/**
 * Increment user message count
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 */
function incrementUserMessageCount(guildId, userId) {
  try {
    const stats = JSON.parse(fs.readFileSync(messageStatsFile));
    
    // Create guild entry if it doesn't exist
    if (!stats[guildId]) {
      stats[guildId] = {};
    }
    
    // Create user entry if it doesn't exist
    if (!stats[guildId][userId]) {
      stats[guildId][userId] = {
        total: 0,
        daily: 0,
        lastMessageDate: new Date().toISOString().split('T')[0]
      };
    }
    
    // Check if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (stats[guildId][userId].lastMessageDate !== today) {
      stats[guildId][userId].daily = 0;
      stats[guildId][userId].lastMessageDate = today;
    }
    
    // Increment message counts
    stats[guildId][userId].total += 1;
    stats[guildId][userId].daily += 1;
    
    fs.writeFileSync(messageStatsFile, JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('Error updating message stats:', error);
  }
}

/**
 * Get message leaderboard for a guild
 * @param {string} guildId - Guild ID
 * @param {string} type - Type of leaderboard ('daily' or 'total')
 * @returns {Array} Sorted leaderboard
 */
function getLeaderboard(guildId, type = 'daily') {
  try {
    const stats = JSON.parse(fs.readFileSync(messageStatsFile));
    
    if (!stats[guildId]) {
      return [];
    }
    
    // Convert to array of [userId, count] pairs
    const entries = Object.entries(stats[guildId]).map(([userId, userData]) => {
      return [userId, userData[type] || 0];
    });
    
    // Sort in descending order by count
    return entries.sort((a, b) => b[1] - a[1]);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

/**
 * Add a warning to a user
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {string} reason - Reason for warning
 * @param {string} moderatorId - Moderator ID
 */
function addWarning(guildId, userId, reason, moderatorId) {
  try {
    const warnings = JSON.parse(fs.readFileSync(warningsFile));
    
    // Create guild entry if it doesn't exist
    if (!warnings[guildId]) {
      warnings[guildId] = {};
    }
    
    // Create user entry if it doesn't exist
    if (!warnings[guildId][userId]) {
      warnings[guildId][userId] = [];
    }
    
    // Add warning
    warnings[guildId][userId].push({
      reason,
      moderatorId,
      timestamp: Date.now()
    });
    
    fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));
    
    return warnings[guildId][userId].length;
  } catch (error) {
    console.error('Error adding warning:', error);
    return 0;
  }
}

/**
 * Get warnings for a user
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @returns {Array} User warnings
 */
function getWarnings(guildId, userId) {
  try {
    const warnings = JSON.parse(fs.readFileSync(warningsFile));
    
    if (!warnings[guildId] || !warnings[guildId][userId]) {
      return [];
    }
    
    return warnings[guildId][userId];
  } catch (error) {
    console.error('Error getting warnings:', error);
    return [];
  }
}

/**
 * Clear warnings for a user
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 */
function clearWarnings(guildId, userId) {
  try {
    const warnings = JSON.parse(fs.readFileSync(warningsFile));
    
    if (!warnings[guildId] || !warnings[guildId][userId]) {
      return false;
    }
    
    warnings[guildId][userId] = [];
    fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error clearing warnings:', error);
    return false;
  }
}

/**
 * Set auto role for a guild
 * @param {string} guildId - Guild ID
 * @param {string} roleId - Role ID
 */
function setAutoRole(guildId, roleId) {
  try {
    const autoRoles = JSON.parse(fs.readFileSync(autoRolesFile));
    autoRoles[guildId] = roleId;
    fs.writeFileSync(autoRolesFile, JSON.stringify(autoRoles, null, 2));
    return true;
  } catch (error) {
    console.error('Error setting auto role:', error);
    return false;
  }
}

/**
 * Get auto role for a guild
 * @param {string} guildId - Guild ID
 * @returns {string|null} Auto role ID
 */
function getAutoRole(guildId) {
  try {
    const autoRoles = JSON.parse(fs.readFileSync(autoRolesFile));
    return autoRoles[guildId] || null;
  } catch (error) {
    console.error('Error getting auto role:', error);
    return null;
  }
}

/**
 * Save setting for a guild
 * @param {string} guildId - Guild ID
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 */
function saveSetting(guildId, key, value) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsFile));
    
    if (!settings[guildId]) {
      settings[guildId] = {};
    }
    
    settings[guildId][key] = value;
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving setting:', error);
    return false;
  }
}

/**
 * Get setting for a guild
 * @param {string} guildId - Guild ID
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if setting not found
 * @returns {any} Setting value
 */
function getSetting(guildId, key, defaultValue = null) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsFile));
    
    if (!settings[guildId] || settings[guildId][key] === undefined) {
      return defaultValue;
    }
    
    return settings[guildId][key];
  } catch (error) {
    console.error('Error getting setting:', error);
    return defaultValue;
  }
}

module.exports = {
  ensureDatabase,
  getPrefix,
  setPrefix,
  incrementUserMessageCount,
  getLeaderboard,
  addWarning,
  getWarnings,
  clearWarnings,
  setAutoRole,
  getAutoRole,
  saveSetting,
  getSetting
};
