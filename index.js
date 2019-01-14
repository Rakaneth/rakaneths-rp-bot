const Discord = require('discord.js')
const bot = new Discord.Client()
const secrets = require('./secrets.json')

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.username}.`)
})

bot.on('message', (msg) => {
    if (msg.author.tag !== bot.user.tag)
        msg.reply(`This is what you said, ${msg.author.tag}: ${msg.content}!`)
})

bot.login(secrets.token)

