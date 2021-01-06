'use strict'

const fs = require('fs')
const path = require('path')
const Collection = require('@discordjs/collection')
const load = require('./packageManager/load')
const unload = require('./packageManager/unload')
const ExtError = require('../errors')
const { EventEmitter } = require('events')

let Bot

try {
  const Discord = require('discord.js')

  /**
     * The bot class for a discord bot.
     * @extends {Discord.Client}
     */
  Bot = class Bot extends Discord.Client {
    /**
         * @param {BotOptions} entries Options for the bot
         */
    constructor (entries) {
      if (!entries.prefix) throw new Error('Invalid prefix given')
      if (!Array.isArray(entries.prefix)) entries.prefix = [entries.prefix]
      if (!entries.filters) entries.filters = []
      if (!Array.isArray(entries.filters)) entries.filters = [entries.filters]
      if (!entries.owner) entries.owner = []
      if (!Array.isArray(entries.owner)) entries.owner = [entries.owner]
      if (!entries.owner.every(id => typeof id === 'string')) entries.owner = entries.owner.map(id => String(id))
      super(entries)
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
         */
    async loadExtension (paths) {
      if (!path.isAbsolute(paths)) paths = path.resolve(process.cwd(), paths)
      if (this.extensions.get(paths)) throw new ExtError(`Extension ${paths} already loaded`, 'Y35', paths)
      let stat
      try {
        stat = fs.statSync(paths)
      } catch {}
      if (!stat || !stat.isFile()) throw new ExtError(`'${paths}' is not a file`, 'N03X15T', paths)
      let pkg = require(paths)
      if (!Array.isArray(pkg)) pkg = pkg instanceof Object ? [pkg] : []
      this.extensions.set(paths, pkg)
      return await load(this, pkg)
    }

    /**
         * @param {String} paths The path to the file
         */
    async reloadExtension (paths) {
      if (!path.isAbsolute(paths)) paths = path.resolve(process.cwd(), paths)
      if (!this.extensions.get(paths)) throw new ExtError(`Extension ${paths} has never been loaded`, 'N0', paths)
      let stat
      try {
        stat = fs.statSync(paths)
      } catch {}
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
} catch {
  Bot = class Bot {
    constructor () {
      throw new Error('Please install discord.js package manually')
    }
  }
}

module.exports = Bot
