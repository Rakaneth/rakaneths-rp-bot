const fs = require('fs')
const { CharProfile, CharBuilder } = require('./charprofile')
const { CHAR_FILE, BANK_FILE } = require('./config.json')

/**
 * Finds a user by username.
 * @param {import('discord.js').Client} bot A Discord client reference.
 * @param {string} username The username to find.
 */
function getUser(bot, username) {
    return bot.users.find(u => u.username === username)
}

/**
 * Gets the data from the JSON as an object.
 * @param {string} fileName The filename of the data.
 * @returns An object containing the data in the file.
 */
function getDataFile(fileName) {
    let raw = fs.readFileSync(fileName, 'utf8')
    return JSON.parse(raw)
}

/**
 * Sets points on user's account. Local function.
 * @param {import('discord.js').User} user 
 * @param {number} val 
 */
function setBalance(user, val) {
    let result = true
    let tbl = getDataFile(BANK_FILE)
    tbl[user.id] = val
    fs.writeFileSync(BANK_FILE, JSON.stringify(tbl, null, 4), 'utf8')
    return result
}

/**
 * Gets points on user's account. Local function.
 * @param {import('discord.js').User} user 
 */
function getBalance(user) {
    let tbl = getDataFile(BANK_FILE)
    return tbl[user.id] || 0
}

/**
 * Saves a character profile.
 * @param {CharProfile} char 
 */
function saveChar(char) {
    let tbl = getDataFile(CHAR_FILE)
    tbl[char.userID] = char
    fs.writeFileSync(CHAR_FILE, JSON.stringify(tbl, null, 4), 'utf8')
}

/**
 * Returns a character profile to the channel.
 * @param {CharProfile} char 
 */
function printChar(char) {
    return `
\`\`\`
Name: ${char.name}
Race: ${char.race}
Job: ${char.job}
Money: ${char.money}
\`\`\``
}

commands = {}

/**
 * Creates a character for the user.
 * Ex. !createchar Rikkas Dwarf
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {string} name Character's name
 * @param {string} race Character's race
 */
commands.createchar = function (bot, chan, user, name, race) {
    let tbl = getDataFile(CHAR_FILE)
    let helpMsg = 'Try `!createchar CHAR_NAME CHAR_RACE.` Example: `!createchar Rikkas Dwarf`'
    if (tbl[user.id]) {
        chan.send(`You have a character already.`)
    } else if (!name) {
        chan.send(`Your character must have a name.\n${helpMsg}`)
    } else if (!race) {
        chan.send(`Your character must have a race.\n${helpMsg}`)
    } else {
        let builder = new CharBuilder()
        let char = builder
            .withName(name)
            .withRace(race)
            .withStartingMoney(0)
            .withUserID(user.id)
            .build()
        saveChar(char)
        setBalance(user, 0)
        chan.send(`New character **${char.name}** created.`)
        chan.send(printChar(char))
    }
}

/**
 * Removes a character. NO CONFIRMATION PROVIDED.
 * Ex !removechar
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 */
commands.removechar = function (bot, chan, user) {
    let charTbl = getDataFile(CHAR_FILE)
    let bankTbl = getDataFile(BANK_FILE)
    let charName = tbl[user.id]['name']
    delete charTbl[user.id]
    delete bankTbl[user.id]
    fs.writeFileSync(CHAR_FILE, charTbl, 'utf8')
    fs.writeFileSync(BANK_FILE, bankTbl, 'utf8')
    chan.send(`Character ${name}deleted.`)
}

/**
 * Prints user's current character to the screen.
 * Ex. !viewchar
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 */
commands.viewchar = function (bot, chan, user) {
    let charTbl = getDataFile(CHAR_FILE)
    let char = charTbl[user.id]
    if (char)
        chan.send(printChar(char))
    else
        chan.send('You do not have a character to print. Try `!createchar`.')
}



module.exports = commands