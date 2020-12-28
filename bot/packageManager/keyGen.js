'use strict';

const num = '0123456789ABCDEF'

function keyGen(length = 4) {
    let str = ''
    for (let i = 0; i < length; i++) {
        str += num[Math.floor(Math.random() * num.length)]
    }
    return str
}

module.exports = keyGen