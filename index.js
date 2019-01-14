const Discord = require('discord.js')
const bot = new Discord.Client()
const secrets = require('./secrets.json')
const cmds = require('./commands')
const fs = require('fs')
const { BANK_FILE, CHAR_FILE } = require('./config.json')

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.username}.`)
    for (let f of [BANK_FILE, CHAR_FILE]) {
        if (!fs.exists(f)) {
            fs.writeFileSync(f, JSON.stringify({}, null, 4), 'utf8')
        }
    }
})

bot.on('message', (msg) => {
    if (msg.author !== bot.user && msg.channel.name === 'bot-test') {
        let cmdRegex = /!(.*)/g
        let cmdParse = cmdRegex.exec(msg.content)
        if (cmdParse) {
            let cmdSplit = cmdParse[1].split(/\s+/)
            cmd = cmdSplit.shift()
            let args = [bot, msg.channel, msg.author]
            let fn = cmds[cmd]
            if (!fn) {
                console.error(`No such command: ${cmd}`)
            } else {
                args = args.concat(cmdSplit)
                fn.apply(this, args)
            }
        }
    }
})

bot.login(secrets.token)

