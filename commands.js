const { CharBuilder } = require('./charprofile')
const { CHAR_FILE, BANK_FILE } = require('./config.json')
const userModes = require('./usermodes')
const {
    charFromFile,
    saveData,
    getBalance,
    deposit,
    withdraw,
    getDataFile,
    getUser,
    updateChar } = require('./utils.js')


commands = {}
commands.docs = {
    createchar: 'Usage: `!createchar name race`\nCreates a character of race `race` named `name`.\nExample: `!createchar Rikkas Dwarf`',
    removechar: 'Usage: `!removechar (name)`\nDeletes the character named `name`.\nExample: `!removechar Rikkas`\n**WARNING:** This action cannot be undone and there is **__NO CONFIRMATION. BE CAREFUL.__**',
    viewchar: 'Usage: `!viewchar name`\nViews the character named `name`.\nExample: `!viewchar Rikkas`',
    deposit: 'Usage: `!deposit name amount`\nDeposits `amount` into `name`\'s bank account.\nExample: `!deposit Rikkas 300`\nIf **amount** is more than what the character has on them, the character will deposit all of their current funds.',
    withdraw: 'Usage: `!withdraw name amount`\nWithdraws `amount` from `name`\'s bank account.\nExample: `!withdraw Rikkas 300`\nAn error will be given if there are not enough funds in the character\'s account.',
    balance: 'Usage: `!balance name`\nGets the current bank balance for `name`\'s account.\nExample: `!balance Rikkas`',
    describe: 'Usage: `!describe name`\nEnters description mode. The next message you send will change your character\'s description.\n`!cancel` will prevent changes to the description.',
    addmoney: 'Usage: `!addmoney name amount`\nAdds `amount` to `name`\'s personal funds.\nExample: `!addmoney Rikkas 300`',
    spendmoney: 'Usage: `!spendmoney name amount`\nSpends `amount` of `name`\'s personal funds.\nExample: `!spendmoney Rikkas 300`\nAn error will be given if there are not enough funds on the character.'
}

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
    if (!name) {
        chan.send(`Your character must have a name.\n${helpMsg}`)
    } else if (!race) {
        chan.send(`Your character must have a race.\n${helpMsg}`)
    } else {
        let builder = new CharBuilder(user, name)
        let char = builder
            .withRace(race)
            .withStartingMoney(1000)
            .build()
        let charList = tbl.users[user.id]
        if (charList) {
            if (charList.includes(char.userID))
                chan.send('You have a character with this name already.')
            else {
                tbl.users[user.id].push(char.userID)
                tbl.characters[char.userID] = char
                saveData(tbl, CHAR_FILE)
                chan.send(`New character **${char.name}** created.`)
                chan.send(char.toString())
            }
        } else {
            tbl.users[user.id] = [char.userID]
            tbl.characters[char.userID] = char
            saveData(tbl, CHAR_FILE)
            chan.send(`New character **${char.name}** created.`)
            chan.send(char.toString())
        }
    }
    return [userModes.MODE_TALK, null]
}

/**
 * Removes a character. NO CONFIRMATION PROVIDED.
 * Ex !removechar
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message.
 * @param {string} charName Name of the character being deleted.
 */
commands.removechar = function (bot, chan, user, charName) {
    let charTbl = getDataFile(CHAR_FILE)
    let bankTbl = getDataFile(BANK_FILE)
    let charID = `${charName}-${user.id}`
    let charList = charTbl.users[user.id]
    charTbl.users[user.id] = charList.filter((val) => val !== charID)
    delete charTbl.characters[charID]
    delete bankTbl[charID]
    saveData(charTbl, CHAR_FILE)
    saveData(bankTbl, BANK_FILE)
    chan.send(`Character ${charName}deleted.`)
    return [userModes.MODE_TALK, null]
}

/**
 * Prints user's current character to the screen.
 * Ex. !viewchar
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {string} charName Name of the character to view.
 */
commands.viewchar = function (bot, chan, user, charName) {
    let char = charFromFile(user, charName)
    if (char)
        chan.send(char.toString())
    else if (typeof (charName) === 'undefined')
        chan.send('Try `!viewchar (your character\'s name)`.')
    else
        chan.send(`${charName} does not exist. Try \`!createchar ${charName} (race).\`.'`)
    return [userModes.MODE_TALK, null]
}

/**
 * Displays the given charName's balance.
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {string} charName Name of the character to view.
 */
commands.balance = function (bot, chan, user, charName) {
    let char = charFromFile(user, charName)
    if (char) {
        let bal = getBalance(char)
        chan.send(`${charName} has ${bal} coins stored here.`)
    } else
        chan.send(`${charName} does not exist. Try \`!createchar ${charName} (your character's race)\``)
    return [userModes.MODE_TALK, null]
}

/**
 * Withdraws amt from char's account. 
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {string} charName Name of the character withdrawing.
 */
commands.withdraw = function (bot, chan, user, charName, amt) {
    let char = charFromFile(user, charName)
    if (char) {
        let val = parseInt(amt, 10)
        chan.send(withdraw(char, val))
    } else
        chan.send(`${charName} does not exist. Try \`!createchar ${charName} (your character's race)\``)
    return [userModes.MODE_TALK, null]
}

/**
 * Deposits amt into char's account.
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {string} charName Name of the character depositing.
 */
commands.deposit = function (bot, chan, user, charName, amt) {
    let char = charFromFile(user, charName)
    if (char) {
        let val = parseInt(amt, 10)
        chan.send(deposit(char, val))
    } else
        chan.send(`${charName} does not exist. Try \`!createchar ${charName} (your character's race)\``)
    return [userModes.MODE_TALK, null]
}

/**
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {string} cmdName The command to explain
 */
commands.help = function (bot, chan, user, cmdName) {
    let helpList = ""
    if (cmdName && this.docs[cmdName])
        chan.send(`\`!${cmdName}\`\n${this.docs[cmdName]}`)
    else if (cmdName && !this.docs[cmdName])
        chan.send(`No help available for ${cmdName}.`)
    else {
        for (let cmd of Object.keys(this.docs)) {
            helpList += `\`!${cmd}\`\n${this.docs[cmd]}\n\n`
        }
        chan.send(helpList)
    }
    return [userModes.MODE_TALK, null]
}

commands.describe = function (bot, chan, user, charName) {
    let char = charFromFile(user, charName)
    if (char) {
        chan.send(`Enter description for ${charName}`)
        return [userModes.MODE_DESC, char]
    } else {
        chan.send(`${charName} does not exist. Try \`!createchar ${charName} (your character's race)\``)
        return [userModes.MODE_TALK, null]
    }
}

commands.spendmoney = function (bot, chan, user, charName, amt) {
    let char = charFromFile(user, charName)
    let val = parseInt(amt, 10)
    if (char) {
        if (val > char.money) {
            chan.send(`${char.name} has Insufficient funds.`)
        } else {
            char.money -= amt
            updateChar(char)
            chan.send(`${amt} spent from personal funds; ${char.money} coins left.`)
        }
    } else {
        chan.send(`${charName} does not exist. Try \`!createchar ${charName} (your character's race)\``)
    }
    return [userModes.MODE_TALK, null]
}

commands.addmoney = function (bot, chan, user, charName, amt) {
    let char = charFromFile(user, charName)
    let val = parseInt(amt, 10)
    if (char) {
        char.money += val
        updateChar(char)
        chan.send(`${amt} added to personal funds; ${char.money} coins left.`)
    } else {
        chan.send(`${charName} does not exist. Try \`!createchar ${charName} (your character's race)\``)
    }
    return [userModes.MODE_TALK, null]
}

module.exports = commands