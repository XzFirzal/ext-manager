/* eslint-disable no-unused-vars */
'use strict'

const fs = require('fs')
const path = require('path')
const Collection = require('@discordjs/collection')
const load = require('./packageManager/load')
const unload = require('./packageManager/unload')
const ExtError = require('../errors')
const Discord = require('discord.js')
const { EventEmitter } = require('events')

/**
  * The bot class for a discord bot.
  * @extends {Discord.Client}
  */
class Bot extends Discord.Client {
  /**
    * @param {Object} options Options for the bot
    */
  constructor (options) {
    if (!options.prefix) throw new Error('Invalid prefix given')
    if (!Array.isArray(options.prefix)) options.prefix = [options.prefix]
    if (!options.filters) options.filters = []
    if (!Array.isArray(options.filters)) options.filters = [options.filters]
    if (!options.owner) options.owner = []
    if (!Array.isArray(options.owner)) options.owner = [options.owner]
    if (!options.owner.every(id => typeof id === 'string')) options.owner = options.owner.map(id => String(id))
    super(options)
    this.extensions = new Collection()
    this.commands = new EventEmitter()
    this.commands.collection = new Collection()
    this.commands.cooldown = new Collection()
    this.rest.ping = {}
    this.rest.ping.latency = 0
    this.rest.ping.request = 0

    const now = Date.now()

    ;(async () => {
      this.owner = (await this.fetchApplication().catch(err => console.error(err)) || {}).owner
      this.rest.ping.latency = Date.now() - now
      this.rest.ping.request = 1
      this.loadExtension(path.join(__dirname, 'commandManager/index.js'))

      setTimeout(() => {
        if (this.rest.ping.request > 0) this.rest.ping.request = 0
      }, 60000)
    })()
  }

  /**
    * @param {String} paths The path to the file
    * @returns {Array<String>}
    */
  async loadExtension (paths) {
    if (!path.isAbsolute(paths)) paths = path.resolve(process.cwd(), paths)
    if (this.extensions.get(paths)) throw new ExtError(`Extension ${paths} already loaded`, 'Y35', paths)
    let stat
    try {
      stat = fs.statSync(paths)
    } catch { }
    if (!stat || !stat.isFile()) throw new ExtError(`'${paths}' is not a file`, 'N03X15T', paths)
    let pkg = require(paths)
    if (!Array.isArray(pkg)) pkg = pkg instanceof Object ? [pkg] : []
    this.extensions.set(paths, pkg)
    return await load(this, pkg)
  }

  /**
    * @param {String} paths The path to the file
    * @returns {Array<String>}
    */
  async reloadExtension (paths) {
    if (!path.isAbsolute(paths)) paths = path.resolve(process.cwd(), paths)
    if (!this.extensions.get(paths)) throw new ExtError(`Extension ${paths} has never been loaded`, 'N0', paths)
    let stat
    try {
      stat = fs.statSync(paths)
    } catch { }
    if (!stat || !stat.isFile()) throw new ExtError(`'${paths}' is not a file`, 'N03X15T', paths)
    const oldPkg = this.extensions.get(paths)
    await unload(this, oldPkg)
    delete require.cache[require.resolve(paths)]
    let newPkg = require(paths)
    if (!Array.isArray(newPkg)) newPkg = newPkg instanceof Object ? [newPkg] : []
    this.extensions.set(paths, newPkg)
    return await load(this, newPkg)
  }

  /**
    * @param {String} paths The path to the file
    * @returns {Array<String>}
    */
  async unloadExtension (paths) {
    if (!path.isAbsolute(paths)) paths = path.resolve(process.cwd(), paths)
    if (!this.extensions.get(paths)) throw new ExtError(`Extension ${paths} has never been loaded`, 'N0', paths)
    const pkg = this.extensions.get(paths)
    this.extensions.delete(paths)
    delete require.cache[require.resolve(paths)]
    return await unload(this, pkg)
  }
}

module.exports = Bot
