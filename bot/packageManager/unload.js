'use strict'

async function unload (client, data) {
  const names = []
  for (const obj of data) {
    if (obj.type.toLowerCase() === 'event') {
      names.push(`EVENT ${obj.name}`)
      client.off(obj.name, obj.main)
    } else if (obj.type.toLowerCase() === 'command') {
      names.push(`COMMAND ${obj.name}`)
      const key = client.commands.collection.findKey(ext => ext === obj)
      client.commands.off(key, obj.main)
      client.commands.collection.delete(key)
      client.commands.cooldown.delete(key)
    }
  }
  return names
}

module.exports = unload
