# ext-manager
A package to manage extensions for event listeners or discord bot commands with ease!

# How to use? Easy!
# Install using NPM
```properties
npm install ext-manager
```

# Example of using event manager
at the main file
```js
const { EventEmitter } = require('events')
const { EventManager } = require('ext-manager')

const eventEmitter = new EventEmitter()
const eventManager = new EventManager(eventEmitter)

eventManager.loadExtension('ext.js') //Load ext.js file in same directory

eventEmitter.emit('test', 'TEST!')

eventManager.reloadExtension('ext.js') //Reload ext.js extension if there is any changes
eventManager.unloadExtension('ext.js') //Unload ext.js extension
```

at ext.js
```js
module.exports = {
    name: 'test', //the event listener name
    once: true, //event listener only works for once
    main(str) {
        console.log(str)
    } //the main function
}
```

# Example of using bot
at the main file
```js
const { Bot } = require('ext-manager')

const bot = new Bot({
    prefix: '!', //the bot prefix
    respondBot: false, //bot cannot respond to another bot
    ownerBypass: true, //owner of the bot can bypass any command filter
    insensitive: true, //command are case insensitive
    filters: [] //adding a custom filter to commands
})

bot.loadExtension('commands.js')
bot.loadExtension('memberjoin.js')

bot.login('BOT_TOKEN')
```

at commands.js
```js
module.exports = {
    type: 'command', //the type of the ext
    name: 'ping', //the command name
    description: 'show the bot ping.', //the command description
    async main(message, args, prefix) {
        const now = Date.now()
        const msg = await message.channel.send('Pinging...')

        msg.edit(`Pong! my ping is ${Date.now() - now}ms`)
    } //the command code
}
```

at memberjoin.js
```js
module.exports = {
    type: 'event', //the type of the ext
    name: 'guildMemberAdd', //the event listener name
    async main(member) {
        const channel = member.guild.channels.cache.first()

        await channel.send(`A member has joined, the name is ${member.user.tag}`)
    } //the main function
}
```

# Methods
```js
//Load an extension
loadExtension(String)

//Reload an extension
reloadExtension(String)

//Unload an extension
unloadExtension(String)
```

# You can put events or commands in an array to make it as a group
example
```js
module.exports = [{
    name: 'test',
    once: true,
    main(str) {
        console.log(str)
    }
}, {
    name: 'error',
    main(err) {
        console.error('An error occured', err)
    }
}]
```

# EventManager parameters
```js
new EventManager(eventEmitter)
```

# Bot parameters
```js
new Bot({
    prefix: Array<Function || String> || Function || String,
    owner: Array,
    respondBot: Boolean,
    ownerBypass: Boolean,
    insensitive: Boolean,
    filters: Array,
    helpCommand: {
        embed: Discord.MessageEmbed,
        hideDuplicate: Boolean,
        decorator: {
            group: {
                title: String,
                separator: String
            },
            command: {
                title: String,
                separator: String,
                notFound: String
            }
        }
    },
    extensionCommand: {
        embed: Discord.MessageEmbed
    },
    evalCommand: {
        embed: Discord.MessageEmbed
    },
    ...Discord.ClientOptions
})
```

# Event property
```js
module.exports = {
    type: 'event', //only for discord bot extension
    name: String,
    once: Boolean,
    main: Function
}
```

# Command property
```js
module.exports = {
    type: 'command',
    category: String,
    name: String,
    aliases: Array,
    description: String,
    guildOnly: String,
    ownerOnly: String,
    usage: String,
    notes: String,
    cooldown: {
        limit: Number,
        timeout: Number,
        target: 'guild' || 'channel' || 'author',
        response: String
    },
    permission: {
        type: 'guild' || 'channel',
        optional: Boolean,
        perms: Discord.Permissions || Array<String || Number> || String || Number,
        response: String
    },
    botPermission: {
        type: 'guild' || 'channel',
        optional: Boolean,
        perms: Discord.Permissions || Array<String || Number> || String || Number,
        response: String
    },
    args: [{
        position: Number,
        response: String,
        prompt: {
            timeout: Number,
            cancelled: String,
            failed: String,
            timedOut: String
        }
    }],
    main: Function
}
```

# Notes
```
- Node version must be not less than v10.x to avoid any bugs
- Discord.js version must be 12.x or so
```

# Example of adding help command

at the main file
```js
const { Bot } = require('ext-manager')

const bot = new Bot({
    ...BotParameters
})

bot.loadExtension('help.js')

bot.login('BOT_TOKEN')
```

at help.js
```js
const { Commands } = require('ext-manager')
const { HelpCommand } = Commands

module.exports = new HelpCommand({
    ...CommandProperty
})
```

# Example of adding extension command

at the main file
```js
const { Bot } = require('ext-manager')

const bot = new Bot({
    ...BotParameters
})

bot.loadExtension('extension.js')

bot.login('BOT_TOKEN')
```

at extension.js
```js
const { Commands } = require('ext-manager')
const { ExtensionCommand } = Commands

module.exports = new ExtensionCommand({
    ...CommandProperty
})
```

# Example of adding eval command

at the main file
```js
const { Bot } = require('ext-manager')

const bot = new Bot({
    ...BotParameters
})

bot.loadExtension('eval.js')

bot.login('BOT_TOKEN')
```

at eval.js
```js
const { Commands } = require('ext-manager')
const { EvalCommand } = Commands

module.exports = new EvalCommand({
    ...CommandProperty
})
```