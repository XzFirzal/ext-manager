'use strict';

const Discord = require('discord.js')
const BasePaginator = require('discord-paginator.js')
const yargs = require('yargs-parser')
const util = require('util')
const { isOwner } = require('../bot/commandManager/parser')

function arraySplitter(array, pages = 10) {
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

function clean(text, token) {
	return text
		.replace(/`/g, '`' + String.fromCharCode(8203))
		.replace(/@/g, '@' + String.fromCharCode(8203))
		.replace(new RegExp(token), '[Token]');
}

class EvalCommand {
    constructor(entries) {
        this.name = 'eval'
        this.ownerOnly = 'This command is can only used by bot developers!'
        Object.assign(this, entries)
        this.type = 'command'
    }

    async main(message, args, prefix, CMD) {
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

        const argv = yargs(args.join(" "), opts)
        const code = (argv._.join(' ').split('\n').slice(0, -1).join('\n')
            + '\nreturn ' + argv._.join(' ').split('\n').slice(-1).join('\n')).trim()

        let reaction
        let content = {}

        const timeout = setTimeout(async () => {
            reaction = await message.react('▶️').catch(err => {})
        }, 5000)

        try {
            let evaled

            if (!argv.async) evaled = eval(`(() => {${code}})()`)
            else if (argv.async) evaled = await eval(`(async () => {${code}})()`)

            const type = typeof evaled

            if (type != 'string') evaled = util.inspect(evaled, {
                depth: argv.depth >= 0 ? argv.depth : 0
            })

            if (!argv.silent) {
                evaled = clean(evaled, client.token)

                if (argv.console) {
                    console.log('\x1b[32m%s\x1b[0m', evaled)
                } else if (!argv.embed || !(embed instanceof Object)) {
                    const contents = arraySplitter(evaled.split(''), 1975)
					content = contents.map(ctx => `\`\`\`js\n${ctx.join('')}\`\`\``)
                } else if (argv.embed && embed instanceof Object) {
                    const contents = arraySplitter(evaled.split(''), 1010)
                    content = contents.map(ctx => new Discord.MessageEmbed(embed)
                        .addFields(
                            { name: 'Input', value: `\`\`\`js\n${code}\`\`\``},
                            { name: 'Output', value: `\`\`\`js\n${ctx.join('')}\`\`\``},
                            { name: 'Type', value: `\`\`\`js\n${type}\`\`\``}
                        )
                    )
                }
            }
        } catch(err) {
            err = util.inspect(err, {
                depth: argv.depth >= 0 ? argv.depth : 0
            })

            err = clean(err, client.token)

            if (argv.console) {
                console.error('\x1b[31m%s\x1b[0m', err)
            } else if (!argv.embed || !(embed instanceof Object)) {
                const contents = arraySplitter(evaled.split(''), 1975)
                content = contents.map(ctx => `Error:\`\`\`js\n${ctx.join('')}\`\`\``)
            } else if (argv.embed && embed instanceof Object) {
                const contents = arraySplitter(evaled.split(''), 1010)
                content = contents.map(ctx => new Discord.MessageEmbed(embed)
                    .addFields(
                        { name: 'Input', value: `\`\`\`js\n${code}\`\`\``},
                        { name: 'Error', value: `\`\`\`js\n${ctx.join('')}\`\`\``},
                        { name: 'Type', value: `\`\`\`js\nError\`\`\``}
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