'use strict';

function commands() {
    const obj = {}
    try {
        require('discord.js')
        obj['HelpCommand'] = require('./helpCommand')
        obj['ExtensionCommand'] = require('./extensionCommand')
    } catch (err) {
        throw new Error('Please install discord.js package manually')
    }
    return obj
}

module.exports = commands