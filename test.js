const { EventEmitter } = require('events')
const { EventManager } = require('ext-manager')

const eventEmitter = new EventEmitter()
const eventManager = new EventManager(eventEmitter)

eventManager.loadExtension('ext.js')

eventEmitter.emit('test', 'TEST!')

eventManager.reloadExtension('ext.js')
eventManager.unloadExtension('ext.js')
