'use strict';

function isOwner(owner, userID, addition = []) {
    const conditions = [addition.some(id => id == userID)]
    if (owner.members) {
        condition.push(owner.members.some(us => userID == us.id))
    } else {
        condition.push(owner.id == userID)
    }
    return conditions.some(condition => condition)
}

function hasPerms(message, perm, member) {
    let permission
    if (perm.type.toLowerCase() == 'channel') {
        permission = message.channel.permissionsFor(member)
    } else {
        permission = member.permissions
    }
    
    if (perm.optional) {
        return permission.any(perm.perms)
    } else {
        return permission.has(perm.perms)
    }
}

async function checkArgs(message, args, arg) {
    if (args[arg.position]) return true
    if (typeof arg.response == 'string') message.channel.send(arg.response).catch(err => console.error(err))
    if (!(arg.prompt instanceof Object)) return
    try {
        const timeout = arg.prompt.timeout > 0 ? arg.prompt.timeout : 30
        const filter = mess => mess.author.id == message.author.id
        const msg = await message.channel.awaitMessages(filter, { max: 1, time: timeout * 1000, errors: ['timed out'] })
        const res = msg.first().content
        if (res == 'cancel') {
            if (typeof arg.prompt.cancelled == 'string') message.channel.send(arg.prompt.cancelled)
            return false
        }
        args.push(...res.split(' '))
        if (args[arg.position]) return true
        if (typeof arg.prompt.failed == 'string') message.channel.send(arg.prompt.failed)
        return false
    } catch {
        if (typeof arg.prompt.timedOut == 'string') message.channel.send(arg.prompt.timedOut)
        return false
    }
}

module.exports = {
    isOwner, hasPerms, checkArgs
}