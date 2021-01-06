'use strict'

const fs = require('fs')
const path = require('path')
const Collection = require('@discordjs/collection')
const load = require('./packageManager/load')
const unload = require('./packageManager/unload')
const ExtError = require('../errors')

/**
 * The Event Manager for managing any events emitted by Event Emitter.
 */
class EventManager {
  /**
     * @param {import {EventEmitter} from 'events'} emitter The Event Emitter
     */
  constructor (emitter) {
    this.emitter = emitter
    this.extensions = new Collection()
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
    return await load(this.emitter, pkg)
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
    await unload(this.emitter, oldPkg)
    delete require.cache[require.resolve(paths)]
    let newPkg = require(paths)
    if (!Array.isArray(newPkg)) newPkg = newPkg instanceof Object ? [newPkg] : []
    this.extensions.set(paths, newPkg)
    return await load(this.emitter, newPkg)
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
    return await unload(this.emitter, pkg)
  }
}

module.exports = EventManager
