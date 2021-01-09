/* eslint-disable no-labels */
'use strict'

const { MessageEmbed } = require('discord.js')
const parser = require('./parser')
const ms = require('ms')

module.exports = {
  type: 'event',
  name: 'message',
  /**
   * @param {import('discord.js').Message} message
   */
  async main (message) {
    if (message.guild && !message.guild.owner) await message.guild.members.fetch(message.guild.ownerID).catch(err => console.error(err))

    const { client } = message
    const { options } = client
    const now = Date.now()

    ;(async () => {
      if (!client.rest.ping.request) {
        client.owner = (await client.fetchApplication().catch(err => console.error(err)) || {}).owner
        client.rest.ping.latency = Date.now() - now
        client.rest.ping.request = 1

        setTimeout(() => {
          if (client.rest.ping.request > 0) client.rest.ping.request = 0
        }, 90000)
      }
    })()

    /**
     * @type {import('discord.js').Permissions}
     */
    const permissions = message.channel.permissionsFor(message.guild.me)

    if (!permissions.has('SEND_MESSAGES')) {
      if (typeof options.noPermission === 'string' || options.noPermission instanceof MessageEmbed) message.author.send(typeof options.noPermission === 'string' ? options.noPermission.replace(/\{guild\}/g, message.guild.id).replace(/\{channel\}/g, message.channel.id) : Object.fromEntries(Object.entries(options.noPermission).map(prop => [prop[0], typeof prop[1] === 'string' ? prop[1].replace(/\{guild\}/g, message.guild.id).replace(/\{channel\}/g, message.channel.id) : prop[1]]))).catch(err => err)
      return
    }

    const prefixes = []

    for (let prefix of options.prefix) {
      if (typeof prefix === 'function') {
        if (prefix.constructor.name === 'AsyncFunction') prefix = await prefix(message).catch(err => console.error(err))
        else prefix = prefix(message)
      }
      prefixes.push(prefix)
    }

    const prefix = prefixes.find(prefix => message.content.startsWith(prefix))

    if (!prefix) return
    if (!options.respondBot && message.author.bot) return

    const args = message.content.substr(prefix.length).split(' ')
    const firstArg = args.shift()

    const commands = client.commands.collection.filter(cmd => (options.insensitive ? cmd.name.toLowerCase() === firstArg.toLowerCase() : cmd.name === firstArg) || (Array.isArray(cmd.aliases) && (options.insensitive ? cmd.aliases.some(alias => alias.toLowerCase() === firstArg.toLowerCase()) : cmd.aliases.includes(firstArg))))

    if (!client.owner) return
    if (!commands.size) return

    commander:
    for (const cmd of commands) {
      const command = cmd[1]
      if (!parser.isOwner(client.owner, message.author.id, options.owner) || !options.ownerBypass) {
        const now = Date.now()
        const stamp = client.commands.cooldown.get(cmd[0])
        const limit = stamp.get('limit')
        const timeout = stamp.get('timeout')
        const target = message[stamp.get('target')].id
        if (!stamp.has(target)) stamp.set(target, [])
        if (limit > 0) {
          if (stamp.get(target).length >= limit) {
            const expirationTime = stamp.get(target)[0] + timeout
            if (now <= expirationTime) {
              if (command.cooldown && command.cooldown.response && (typeof command.cooldown.response === 'string' || command.cooldown.response instanceof MessageEmbed)) message.channel.send(typeof command.cooldown.response === 'string' ? command.cooldown.response.replace(/\{time\}/g, ms(now - expirationTime, { long: true })) : Object.fromEntries(Object.entries(command.cooldown.response).map(prop => [prop[0], typeof prop[1] === 'string' ? prop[1].replace(/\{time\}/g, ms(now - expirationTime, { long: true })) : prop[1]]))).catch(err => console.error(err))
              continue commander
            }
          }
          stamp.get(target).push(now)
          setTimeout(() => {
            stamp.get(target).shift()
          }, timeout)
        }
      }
      for (const filter of options.filters) {
        let res
        if (filter.constructor.name === 'AsyncFunction') res = await filter(message, args, prefix, command).catch(err => console.error(err))
        else res = filter(message, args, prefix, command)
        if (!res) continue commander
      }
      if (!parser.isOwner(client.owner, message.author.id, options.owner) || !options.ownerBypass) {
        if (command.guildOnly && message.channel.type === 'dm') {
          if (typeof command.guildOnly === 'string' || command.guildOnly instanceof MessageEmbed) message.channel.send(command.guildOnly).catch(err => console.error(err))
          continue
        }
        if (command.ownerOnly && !parser.isOwner(client.owner, message.author.id, options.owner)) {
          if (typeof command.ownerOnly === 'string' || command.ownerOnly instanceof MessageEmbed) message.channel.send(command.ownerOnly).catch(err => console.error(err))
          continue
        }
        if (command.permission && !parser.hasPerms(message, command.permission, message.member)) {
          if (typeof command.permission.response === 'string' || command.permission.response instanceof MessageEmbed) message.channel.send(command.permission.response).catch(err => console.error(err))
          continue
        }
      }

      if (command.botPermission && !parser.hasPerms(message, command.botPermission, message.guild.me)) {
        if (typeof command.botPermission.response === 'string' || command.botPermission.response instanceof MessageEmbed) message.channel.send(command.botPermission.response).catch(err => console.error(err))
        continue
      }

      const commandArgs = Array.isArray(command.args) ? command.args : (command.args instanceof Object ? [command.args] : [])

      for (const arg of commandArgs) {
        const res = await parser.checkArgs(message, args, arg).catch(err => console.error(err))
        if (!res) continue commander
      }
      client.commands.emit(cmd[0], message, args, prefix, command)
    }
  }
}
