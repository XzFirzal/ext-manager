'use strict'

const Bot = require('./bot')
const EventManager = require('./eventManager')
const Commands = require('./commands')

const version = require('./package.json').version

module.exports = {
  Bot, EventManager, Commands, version
}
