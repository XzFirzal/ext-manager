/* eslint-disable no-unused-vars */
'use strict'

const Discord = require('discord.js')
const ms = require('ms')

function goofCase (text, separator = ' ') {
  return text.split(separator).map(word => word[0].toUpperCase() + word.substr(1).toLowerCase()).join(' ')
}

function parsePerm (resolvable, separator) {
  const perms = new Discord.Permissions(resolvable)
  return perms.toArray().map(perm => goofCase(perm, '_')).join(separator)
}

function ordinal (number) {
  number = String(number)
  const sLast = parseInt(number.substr(-2))
  const last = parseInt(number.substr(-1))
  const ords = ['th', 'st', 'nd', 'rd']
  return number + (sLast > 10 && sLast < 20 ? ords[0] : (last > 0 && last < 4 ? ords[last] : ords[0]))
}

/**
  * An help command for a discord bot.
  */
class HelpCommand {
  /**
    * @param {Object} [options] Options for the help command
    */
  constructor (options) {
    this.name = 'help'
    Object.assign(this, options)
    this.type = 'command'
  }

  /**
    * @param {Discord.Message} message A discord message
    * @param {Array<String>} args An Array of strings
    * @param {String} prefix The bot prefix
    * @param {Object} CMD The command
    */
  async main (message, args, prefix, CMD) {
    const { client } = message
    const { options } = client
    const { helpCommand } = options
    if (!args.length) {
      const decorator = helpCommand ? helpCommand.decorator : undefined
      const hideDuplicate = helpCommand ? helpCommand.hideDuplicate : false
      const embed = helpCommand ? helpCommand.embed : undefined
      const group = decorator ? (decorator.group || {}) : {}
      const groupTitle = group.title || '{name} - {count}'
      const separator = group.separator || ', '
      const commands = new Discord.Collection()
      let command = client.commands.collection.array()
      if (hideDuplicate) {
        const arr = []
        command = command.filter(cmd => !arr.some(c => c.name === cmd.name) ? arr.push(cmd) : false)
      }
      for (const cmd of command) {
        let category = cmd.category
        if (!category) category = 'No Category'
        if (!commands.has(category)) commands.set(category, [])
        commands.get(category).push(cmd.name)
      }
      if (embed instanceof Object) {
        embed.description = (embed.description || `{prefix}${CMD.name} [command], to see more information about command!`).replace(/\{prefix\}/g, prefix)
        const msgEmbed = new Discord.MessageEmbed(embed)
        for (const groups of commands) {
          msgEmbed.addField(groupTitle.replace(/\{name\}/g, groups[0]).replace(/\{count\}/g, groups[1].length), groups[1].join(separator))
        }
        message.channel.send(msgEmbed).catch(err => console.error(err))
      } else {
        const content = `\`\`\`
Help Command
${prefix}${CMD.name} [command], to see more information about command!
                
${commands.map((v, k) => `${groupTitle.replace(/\{name\}/g, k).replace(/\{count\}/g, v.length)}
${v.join(separator)}`).join('\n\n')}\`\`\``
        message.channel.send(content).catch(err => console.error(err))
      }
    } else if (args.length) {
      const decorator = helpCommand ? helpCommand.decorator : undefined
      const embed = helpCommand ? helpCommand.embed : undefined
      const commandDeco = decorator ? (decorator.command || {}) : {}
      const commandTitle = commandDeco.title || '{names} ({category})'
      const separator = commandDeco.separator || ' | '
      const commandNotFound = commandDeco.notFound
      const firstArg = args[0]
      const command = client.commands.collection.find(cmd => (options.insensitive ? cmd.name.toLowerCase() === firstArg.toLowerCase() : cmd.name === firstArg) || (Array.isArray(cmd.aliases) && (options.insensitive ? cmd.aliases.some(alias => alias.toLowerCase() === firstArg.toLowerCase()) : cmd.aliases.includes(firstArg))))

      if (!command) {
        if (typeof commandNotFound === 'string') message.channel.send(commandNotFound).catch(err => console.error(err))
        return
      }

      const key = client.commands.collection.findKey(cmd => cmd === command)
      const stamp = client.commands.cooldown.get(key)
      const names = [command.name]

      if (Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          names.push(alias)
        }
      }

      const name = commandTitle.replace(/\{names\}/g, `${names.join(separator)}`).replace(/\{category\}/g, command.category || 'No Category')
      const usage = `${prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}`
      const notes = `${command.notes || 'None'}`
      const cooldown = `${stamp.get('limit')}/${ms(stamp.get('timeout'))} Per ${goofCase(stamp.get('target').replace(/author/g, 'user'))}`
      const permission = `${command.permission ? `${parsePerm(command.permission.perms, separator)}${command.permission.optional ? '' : '\nUser must have all the specified permissions'}` : 'None'}`
      const botPermission = `${command.botPermission ? `${parsePerm(command.botPermission.perms, separator)}${command.botPermission.optional ? '' : '\nBot must have all the specified permissions'}` : 'None'}`
      const arg = `${Array.isArray(command.args) ? command.args.map(obj => `${ordinal(obj.position)} arguments`).join(separator) : 'None'}`

      let description = command.description || 'None'

      if (command.ownerOnly) description += '\n- Bot Owner Only'
      if (command.guildOnly) description += '\n- Guild Only'

      description = description.trim()

      if (embed instanceof Object) {
        const msgEmbed = new Discord.MessageEmbed(embed)
          .setTitle(name)
          .setDescription(`\`\`\`\n${description}\`\`\``)
          .addField('Usage', `\`\`\`\n${usage}\`\`\``)
          .addField('Cooldown', `\`\`\`\n${cooldown}\`\`\``)
          .addField('Required Permission', `\`\`\`\n${permission}\`\`\``)
          .addField('Required Bot Permission', `\`\`\`\n${botPermission}\`\`\``)
          .addField('Required Arguments', `\`\`\`\n${arg}\`\`\``)
          .addField('Notes', `\`\`\`\n${notes}\`\`\``)
        message.channel.send(msgEmbed)
      } else {
        const content = `**${name}**
\`\`\`\n${description}\`\`\`
**Usage**
\`\`\`\n${usage}\`\`\`
**Cooldown**
\`\`\`\n${cooldown}\`\`\`
**Required Permission**
\`\`\`\n${permission}\`\`\`
**Required Bot Permission**
\`\`\`\n${botPermission}\`\`\`
**Required Arguments**
\`\`\`\n${arg}\`\`\`
**Notes**
\`\`\`\n${notes}\`\`\``
        message.channel.send(content)
      }
    }
  }
}

module.exports = HelpCommand
