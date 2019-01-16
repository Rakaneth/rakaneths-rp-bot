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
    let chan = msg.channel
    let guild = msg.guild
    if (!modes[user.id])
        modes[user.id] = { mode: usermodes.MODE_TALK, char: null }
    let { mode, char } = modes[msg.author.id]
    if (msg.author !== bot.user) {
        if (!mode || mode === usermodes.MODE_TALK) {
            if (msg.channel.name === 'bot-test') {
                let cmdRegex = /!(.*)/g
                let cmdParse = cmdRegex.exec(msg.content)
                if (cmdParse) {
                    let args = cmdParse[1].split(/\s+/)
                    let cmdName = args.shift()
                    let cmd = cmds[cmdName]
                    if (!cmd) {
                        chan.send(`No such command: ${cmdName}. Try \`!help\` to see a list of commands.`)
                        console.error(`No such command: ${cmd}`)
                    } else {
                        let opts = { bot, user, chan, guild, args }
                        modes[user.id] = cmd.execute(opts)
                    }
                }
            }
        } else if (mode === usermodes.MODE_DESC) {
            if (msg.content === '!cancel') {
                chan.send(`Canceled; description for ${char.name} unchanged.`)
                modes[user.id] = { mode: usermodes.MODE_TALK, char: null }
            } else {
                char.desc = msg.content
                updateChar(char)
                chan.send(char.toString())
                modes[msg.author.id] = { mode: usermodes.MODE_TALK, char: null }
            }
        }
    }
})

bot.login(secrets.token)

