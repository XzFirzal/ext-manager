'use strict';

async function load(emitter, data) {
    const names = []
    for (const obj of data) {
        names.push(obj.name)
        if (obj.once) emitter.once(obj.name, obj.main)
        else emitter.on(obj.name, obj.main)
    }
    return names
}

module.exports = load