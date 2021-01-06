/* eslint-disable no-ex-assign */
/* eslint-disable no-eval */
/* eslint-disable node/handle-callback-err */
'use strict'

const Discord = require('discord.js')
const BasePaginator = require('discord-paginator.js')
const yargs = require('yargs-parser')
const util = require('util')
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

function merge (array, arr) {
  const merged = []

  for (let i = 0; i < arr.length; i++) {
    const mergeArr = []

    mergeArr.push(array[array[i] ? i : i - 1])
    mergeArr.push(arr[i])
    merged.push(mergeArr)

    continue
  }

  return merged
}

function clean (text, token) {
  return text
    .replace(/`/g, '`' + String.fromCharCode(8203))
    .replace(/@/g, '@' + String.fromCharCode(8203))
    .replace(new RegExp(token), '[Token]')
}

/**
 * an eval command for a discord bot developer.
 */
class EvalCommand {
  /**
     * @param {BotCommandExt} entries Options for the eval command
     */
  constructor (entries) {
    this.name = 'eval'
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
    if (!args.length) {
      message.channel.send('Please enter a code to evaluate with!').catch(console.error)
      return
    }

    const { client } = message
    const { options } = client
    const { evalCommand } = options
    const embed = evalCommand ? evalCommand.embed : undefined

    const opts = {
      alias: {
        async: ['a'],
        embed: ['e'],
        silent: ['s'],
        console: ['c', 'log'],
        depth: ['d']
      },
      boolean: ['async', 'embed', 'silent', 'console'],
      number: ['depth'],
      default: {
        async: false,
        embed: embed instanceof Object,
        silent: false,
        console: false,
        depth: 0
      }
    }

    const argv = yargs(args.join(' '), opts)
    let code = argv._.join(' ').trim()

    let reaction
    let content = {}

    const timeout = setTimeout(async () => {
      reaction = await message.react('▶️').catch(err => {})
    }, 5000)

    try {
      let evaled

      if (!argv.async) evaled = eval(`(() => {${code}})()`)
      else if (argv.async) evaled = await eval(`(async () => {${code}})()`)

      code = clean(code)

      const type = typeof evaled

      if (type !== 'string') {
        evaled = util.inspect(evaled, {
          depth: argv.depth >= 0 ? argv.depth : 0
        })
      }

      if (!argv.silent) {
        evaled = clean(evaled, client.token)

        if (argv.console) {
          console.log('\x1b[32m%s\x1b[0m', evaled)
        } else if (!argv.embed || !(embed instanceof Object)) {
          const contents = arraySplitter(evaled.split(''), 1975)
          content = contents.map(ctx => `\`\`\`js\n${ctx.join('')}\`\`\``)
        } else if (argv.embed && embed instanceof Object) {
          let contents = arraySplitter(evaled.split(''), 1010)
          code = arraySplitter(code.split(''), 1010)
          contents = merge(contents, code)
          content = contents.map(ctx => new Discord.MessageEmbed(embed)
            .addFields(
              { name: 'Input', value: `\`\`\`js\n${ctx[1].join('')}\`\`\`` },
              { name: 'Output', value: `\`\`\`js\n${ctx[0].join('')}\`\`\`` },
              { name: 'Type', value: `\`\`\`js\n${type}\`\`\`` }
            )
          )
        }
      }
    } catch (err) {
      err = util.inspect(err, {
        depth: argv.depth >= 0 ? argv.depth : 0
      })

      err = clean(err, client.token)
      code = clean(code)

      if (argv.console) {
        console.error('\x1b[31m%s\x1b[0m', err)
      } else if (!argv.embed || !(embed instanceof Object)) {
        const contents = arraySplitter(err.split(''), 1975)
        content = contents.map(ctx => `Error:\`\`\`js\n${ctx.join('')}\`\`\``)
      } else if (argv.embed && embed instanceof Object) {
        let contents = arraySplitter(err.split(''), 1010)
        code = arraySplitter(code.split(''), 1010)
        contents = merge(contents, code)
        content = contents.map(ctx => new Discord.MessageEmbed(embed)
          .addFields(
            { name: 'Input', value: `\`\`\`js\n${ctx[1].join('')}\`\`\`` },
            { name: 'Error', value: `\`\`\`js\n${ctx[0].join('')}\`\`\`` },
            { name: 'Type', value: '```js\nError```' }
          )
        )
      }

      content.error = true
    }

    if (Array.isArray(content) && content.length) {
      const Paginator = new BasePaginator({
        pages: content,
        timeout: 90000,
        filter: (reaction, user) => isOwner(client.owner, user.id, [...options.owner, message.author.id])
      })

      Paginator.spawn(message.channel).catch(console.error)
    }

    if (reaction) await reaction.remove().catch(err => {}) || await reaction.users.remove(client.user.id).catch(err => {})

    if (content.error) {
      reaction = await message.react('‼️').catch(err => {})
    } else if (!content.error) {
      reaction = await message.react('✅').catch(err => {})
    }

    clearTimeout(timeout)
  }
}

module.exports = EvalCommand
