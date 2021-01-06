'use strict'

/**
 * A function to provide commands for bot.
 */
function commands () {
  const obj = {}
  try {
    require('discord.js')
    obj.HelpCommand = require('./helpCommand')
    obj.ExtensionCommand = require('./extensionCommand')
    obj.EvalCommand = require('./evalCommand')
  } catch (err) {
    throw new Error('Please install discord.js package manually')
  }
  return obj
}

module.exports = commands
