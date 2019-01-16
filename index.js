const Discord = require('discord.js')
const bot = new Discord.Client()
const secrets = require('./secrets.json')
const cmds = require('./commands')
const fs = require('fs')
const { BANK_FILE, CHAR_FILE } = require('./config.json')
const usermodes = require('./usermodes')
const { saveData, getDataFile, updateChar } = require('./utils')

let modes = {}

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.username}.`)

    fs.exists(BANK_FILE, (exists) => {
        if (!exists) {
            console.log('Creating new bank file')
            let bankShell = {}
            fs.writeFileSync(BANK_FILE, JSON.stringify(bankShell, null, 4), 'utf8')
        }
    })
    fs.exists(CHAR_FILE, (exists) => {
        if (!exists) {
            console.log('Creating new profile store')
            let profShell = {
                users: {},
                characters: {}
            }
            fs.writeFileSync(CHAR_FILE, JSON.stringify(profShell, null, 4), 'utf8')
        }
    })
})

bot.on('message', (msg) => {
    let user = msg.author
    if (!modes[user.id])
        modes[user.id] = [usermodes.MODE_TALK, null]
    let [userMode, char] = modes[msg.author.id]
    if (msg.author !== bot.user) {
        if (!userMode || userMode === usermodes.MODE_TALK) {
            if (msg.channel.name === 'bot-test') {
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
                        modes[user.id] = fn.apply(cmds, args)
                    }
                }
            }
        } else if (userMode === usermodes.MODE_DESC) {
            if (msg.content === '!cancel') {
                msg.channel.send(`Canceled; description for ${char.name} unchanged.`)
                modes[user.id] = [usermodes.MODE_TALK, null]
            } else {
                char.desc = msg.content
                updateChar(char)
                msg.channel.send(char.toString())
                modes[msg.author.id] = [usermodes.MODE_TALK, null]
            }
        }
    }
})

bot.login(secrets.token)

