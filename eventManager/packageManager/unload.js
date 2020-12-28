'use strict';

async function unload(emitter, data) {
    const names = []
    for (const obj of data) {
        names.push(obj.name)
        emitter.off(obj.name, obj.main)
    }
    return names
}

module.exports = unload