'use strict'

const ms = require('ms')
const versions = {
  ext: require('../package.json').version,
  discord: require('discord.js').version,
  node: process.version.replace('v', '')
}
const discord = require('discord.js')
const BasePaginator = require('discord-paginator.js')
const { isOwner } = require('../bot/commandManager/parser')

function arraySplitter (array, pages = 10) {
  const arr = []
  const len = array.length
  for (let i = 0; i < len / pages; i++) {
    arr.push(array.splice(0, pages))
  }
  if (arr.length < len / pages) {
    arr.push(array.splice(0, array.length))
  }
  return arr
}

/**
 * An extension command for a discord bot to manage extensions.
 */
class ExtensionCommand {
  /**
     * @param {BotCommandExt} entries Options for the extension command
     */
  constructor (entries) {
    this.name = 'extension'
    this.ownerOnly = 'This command is can only used by bot developers!'
    Object.assign(this, entries)
    this.type = 'command'
  }

  /**
     * @param {discord.Message} message A discord message
     * @param {Array<String>} args An Array of strings
     * @param {String} prefix The bot prefix
     * @param {BotCommandExt} CMD The command
     */
  async main (message, args, prefix, CMD) {
    const { client } = message
    const { options } = client
    const { shard } = client
    const { extensionCommand } = options
    const embed = extensionCommand ? extensionCommand.embed : undefined
    if (!args.length) {
      let guilds = client.guilds.cache.size
      let users = client.users.cache.size

      if (shard) {
        const res = {
          guilds: await shard.fetchClientValues('guilds.cache.size').catch(console.error),
          users: await shard.fetchClientValues('users.cache.size').catch(console.error)
        }

        guilds = res.guilds.reduce((acc, count) => acc + count, 0)
        users = res.users.reduce((acc, count) => acc + count, 0)
      }

      const version = `ext-manager v${versions.ext}, discord.js v${versions.discord}, nodejs v${versions.node}`
      const uptime = `Process has been running for ${ms(process.uptime() * 1000, { long: true })}, client has been running for ${ms(client.uptime, { long: true })}`
      const memoryUsage = `Using ${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)}MB physical memory, with ${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(1)}MB allocated to heap and ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB used`
      const pidAndPpid = `PID is ${process.pid}, and PPID is ${process.ppid}`
      const stats = `${shard ? `This bot is sharded with total ${shard.count} of shards` : 'This bot is not sharded'}, can see ${guilds} guild(s), and ${users} user(s) are cached`
      const messageCache = `${options.messageCacheMaxSize < 0 && options.messageCacheMaxSize >= Infinity ? 'Message cache is not capped' : `Message cache capped at ${options.messageCacheMaxSize}`}`
      const info = `Websocket latency: ${client.ws.ping}ms\nRest latency: ${client.rest.ping.latency}ms\nPrefix: ${prefix}`
      const contents = [version, uptime, memoryUsage, pidAndPpid, stats, messageCache, info].join('\n')

      if (embed instanceof Object) {
        const msgEmbed = new discord.MessageEmbed(embed)
          .setDescription(contents)
        message.channel.send(msgEmbed).catch(console.error)
      } else {
        const content = `\`\`\`\n${contents}\`\`\``
        message.channel.send(content).catch(console.error)
      }
    } else if (args.length) {
      const arr = []

      if (args[0].toLowerCase() === 'load') {
        if (!args[1]) {
          message.channel.send('You must enter what extension you want to load!').catch(console.error)
          return
        }

        try {
          const res = await client.loadExtension(args.slice(1).join(' '))
          for (const str of res) arr.push(`📥 ${str}`)
        } catch (err) {
          message.channel.send(err.message).catch(console.error)
          return
        }
      } else if (args[0].toLowerCase() === 'reload') {
        if (!args[1]) {
          message.channel.send('You must enter what extension you want to reload!').catch(console.error)
          return
        }

        try {
          const res = await client.reloadExtension(args.slice(1).join(' '))
          for (const str of res) arr.push(`🔄 ${str}`)
        } catch (err) {
          message.channel.send(err.message).catch(console.error)
          return
        }
      } else if (args[0].toLowerCase() === 'unload') {
        if (!args[1]) {
          message.channel.send('You must enter what extension you want to unload!').catch(console.error)
          return
        }

        try {
          const res = await client.unloadExtension(args.slice(1).join(' '))
          for (const str of res) arr.push(`📤 ${str}`)
        } catch (err) {
          message.channel.send(err.message).catch(console.error)
          return
        }
      } else {
        message.channel.send('Invalid subcommand entered, available subcommand is `load`, `reload`, and `unload`!').catch(console.error)
        return
      }

      const contents = arraySplitter((arr.length ? arr.join('\n') : 'None').split(''), 2030)
      const content = contents.map(ctx => {
        if (embed instanceof Object) {
          const msgEmbed = new discord.MessageEmbed(embed)
            .setDescription(ctx.join('').trim())
          return msgEmbed
        }
        return `\`\`\`\n${ctx.join('').trim()}\`\`\``
      })

      const Paginator = new BasePaginator({
        pages: content,
        timeout: 90000,
        filter: (reaction, user) => isOwner(client.owner, user.id, [...options.owner, message.author.id])
      })

      Paginator.spawn(message.channel)
    }
  }
}

module.exports = ExtensionCommand
