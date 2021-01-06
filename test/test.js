const { EventEmitter } = require('events')
const { EventManager } = require('ext-manager')

const eventEmitter = new EventEmitter()
const eventManager = new EventManager(eventEmitter)

eventManager.loadExtension('test/ext.js')

eventEmitter.emit('test', 'TEST!')

eventManager.reloadExtension('test/ext.js')
eventManager.unloadExtension('test/ext.js')
