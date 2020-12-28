'use strict';

const keyGen = require('./keyGen')
const collection = require('@discordjs/collection')

async function load(client, data) {
    const names = []
    for (const obj of data) {
        if (obj.type.toLowerCase() == 'event') {
            names.push(`EVENT ${obj.name}`)
            if (obj.once) client.once(obj.name, obj.main)
            else client.on(obj.name, obj.main)
        } else if (obj.type.toLowerCase() == 'command') {
            names.push(`COMMAND ${obj.name}`)
            let id = keyGen()
            while (client.commands.collection.get(id)) {
                id = keyGen()
            }
            client.commands.on(id, obj.main)
            client.commands.collection.set(id, obj)
            client.commands.cooldown.set(id, new collection())
            client.commands.cooldown.get(id).set('limit', obj.cooldown && obj.cooldown.limit >= 0 ? obj.cooldown.limit : 0)
            client.commands.cooldown.get(id).set('timeout', (obj.cooldown && obj.cooldown.timeout >= 0 ? obj.cooldown.timeout : 0) * 1000)
            client.commands.cooldown.get(id).set('target', obj.cooldown ? (obj.cooldown.target || 'author') : 'author')
        }
    }
    return names
}

module.exports = load