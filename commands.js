const { CharProfile, CharBuilder } = require('./charprofile')
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
    updateChar,
    charByName,
    getRole } = require('./utils')
const { Command, CommandBuilder } = require('./command')

/**
 * @typedef CommandResult
 * @type {Object}
 * @property {string} mode
 * @property {CharProfile} char
 */


commands = {}

/**
 * Creates a character for the user.
 * Ex. !createchar Rikkas Dwarf
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {import('discord.js').Guild} guild Server reference.
 * @param {string} name Character's name
 * @param {string} race Character's race
 * @returns {CommandResult} CommandResult from this command.
 */

function createChar(bot, chan, user, guild, name, race) {
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
    return { mode: userModes.MODE_TALK, char: null }
}

/**
 * Removes a character. NO CONFIRMATION PROVIDED.
 * Ex !removechar
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message.
 * @param {import('discord.js').Guild} guild Server reference.
 * @param {string} charName Name of the character being deleted.
 * @returns {CommandResult} CommandResult from this command.
 */
function removeChar(bot, chan, user, guild, charName) {
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
    return { mode: userModes.MODE_TALK, char: null }
}

/**
 * Prints the named character to the screen.
 * Ex. !viewchar
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {import('discord.js').Guild} guild Server reference.
 * @param {string} charName Name of the character to view.
 * @returns {CommandResult} CommandResult from this command.
 */
function viewChar(bot, chan, user, guild, charName) {
    let char = charByName(charName)
    if (char)
        chan.send(char.toString())
    else if (typeof (charName) === 'undefined')
        chan.send('Try `!viewchar (character\'s name)`.')
    else
        chan.send(`${charName} does not exist. Try \`!createchar ${charName} (race).\`.'`)
    return { mode: userModes.MODE_TALK, char: null }
}

/**
 * Displays the given charName's balance.
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {import('discord.js').Guild} guild Server reference.
 * @param {string} charName Name of the character to view.
 * @returns {CommandResult} CommandResult from this command.
 */
function bal(bot, chan, user, guild, charName) {
    let char = charFromFile(user, charName)
    if (char) {
        let bal = getBalance(char)
        chan.send(`${charName} has ${bal} coins stored here.`)
    } else
        chan.send(`${charName} does not exist. Try \`!createchar ${charName} (your character's race)\``)
    return { mode: userModes.MODE_TALK, char: null }
}

/**
 * Withdraws amt from char's account.
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {import('discord.js').Guild} guild Server reference.
 * @param {string} charName Name of the character withdrawing.
 * @returns {CommandResult} CommandResult from this command.
 */
function withdrawCB(bot, chan, user, guild, charName, amt) {
    let char = charFromFile(user, charName)
    if (char) {
        let val = parseInt(amt, 10)
        chan.send(withdraw(char, val))
    } else
        chan.send(`${charName} does not exist. Try \`!createchar ${charName} (your character's race)\``)
    return { mode: userModes.MODE_TALK, char: null }
}

/**
 * Deposits amt into char's account.
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {import('discord.js').Guild} guild Server reference.
 * @param {string} charName Name of the character depositing.
 * @returns {CommandResult} CommandResult from this command.
 */
function depositCB(bot, chan, user, guild, charName, amt) {
    let char = charFromFile(user, charName)
    if (char) {
        let val = parseInt(amt, 10)
        chan.send(deposit(char, val))
    } else
        chan.send(`${charName} does not exist. Try \`!createchar ${charName} (your character's race)\``)
    return { mode: userModes.MODE_TALK, char: null }
}

/**
 * Displays help text for cmdName, or gives a list of commands if
 * cmdName is null.
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {import('discord.js').Guild} guild Server reference.
 * @param {string} cmdName The command to explain
 * @returns {CommandResult} CommandResult from this command.
 */
function helpCB(bot, chan, user, guild, cmdName) {
    let helpList = ""
    let cmd = commands[cmdName]
    if (cmdName && cmd)
        chan.send(`${cmd.name}\n${cmd.helpText}`)
    else if (cmdName && commands[cmdName])
        chan.send(`No help available for ${cmdName}.`)
    else {
        for (let c of Object.keys(commands)) {

            helpList += `${commands[c].name}\n${commands[c].helpText}\n\n`
        }
        chan.send(helpList)
    }
    return { mode: userModes.MODE_TALK, char: null }
}

/**
 * Adds amt to charName's personal funds.
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {import('discord.js').Guild} guild Server reference.
 * @param {string} charName The character to add money to.
 * @param {string} amt The amount to add.
 * @returns {CommandResult} The CommandResult of this command.
 */
function addMoneyCB(bot, chan, user, guild, charName, amt) {
    let char = charFromFile(user, charName)
    let val = parseInt(amt, 10)
    if (char) {
        char.money += val
        updateChar(char)
        chan.send(`${amt} added to personal funds; ${char.money} coins left.`)
    } else {
        chan.send(`${charName} does not exist. Try \`!createchar ${charName} (your character's race)\``)
    }
    return { mode: userModes.MODE_TALK, char: null }
}

/**
 * Places the user in description mode for charName.
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {import('discord.js').Guild} guild Server reference.
 * @param {string} charName The character to describe.
 * @returns {CommandResult} CommandResult of this command.
 */
function describeCB(bot, chan, user, guild, charName) {
    let char = charFromFile(user, charName)
    if (char) {
        chan.send(`Enter description for ${charName}`)
        return { mode: userModes.MODE_DESC, char: char }
    } else {
        chan.send(`${charName} does not exist. Try \`!createchar ${charName} (your character's race)\``)
        return { mode: userModes.MODE_TALK, char: char }
    }
}
/**
 * 
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {import('discord.js').Guild} guild Server reference.
 * @param {string} charName  The character to take funds from.
 * @param {string} amt The amount to spend.
 * @returns {CommandResult} CommandResult of this command.
 */
function spendMoneyCB(bot, chan, user, guild, charName, amt) {
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
    return { mode: userModes.MODE_TALK, char: null }
}

/**
 * 
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {import('discord.js').Guild} guild Server reference.
 * @param {string} charName The character whose job to change.
 * @param {string} newJob The character's new job.
 * @returns {CommandResult} The CommandResult of this command.
 */
function changeJobCB(bot, chan, user, guild, charName, newJob) {
    let char = charFromFile(user, charName)
    if (char && newJob) {
        char.job = newJob
        updateChar(char)
        chan.send(`${charName}'s job is now ${newJob}.`)
    } else if (!newJob) {
        chan.send('New job required. Try `!changejob name job.`')
    } else {
        chan.send(`${charName} does not exist. Try \`!createchar ${charName} (your character's race)\``)
    }
    return { mode: userModes.MODE_TALK, char: null }
}

commands.createchar = new CommandBuilder()
    .withName('createchar')
    .withHelpText('Usage: `!createchar name race`\nCreates a character of race `race` named `name`.\nExample: `!createchar Rikkas Dwarf`')
    .withCallback(createChar)
    .build()

commands.removechar = new CommandBuilder()
    .withName('removechar')
    .withHelpText('Usage: `!removechar (name)`\nDeletes the character named `name`.\nExample: `!removechar Rikkas`\n**WARNING:** This action cannot be undone and there is **__NO CONFIRMATION. BE CAREFUL.__**')
    .withCallback(removeChar)
    .build()

commands.viewchar = new CommandBuilder()
    .withName('viewchar')
    .withHelpText('Usage: `!viewchar name`\nViews the character named `name`.\nExample: `!viewchar Rikkas`')
    .withCallback(viewChar)
    .build()

commands.balance = new CommandBuilder()
    .withName('balance')
    .withHelpText('Usage: `!balance name`\nGets the current bank balance for `name`\'s account.\nExample: `!balance Rikkas`')
    .withCallback(bal)
    .build()

commands.withdraw = new CommandBuilder()
    .withName('withdraw')
    .withHelpText('Usage: `!withdraw name amount`\nWithdraws `amount` from `name`\'s bank account.\nExample: `!withdraw Rikkas 300`\nAn error will be given if there are not enough funds in the character\'s account.')
    .withCallback(withdrawCB)
    .build()

commands.deposit = new CommandBuilder()
    .withName('deposit')
    .withHelpText('Usage: `!deposit name amount`\nDeposits `amount` into `name`\'s bank account.\nExample: `!deposit Rikkas 300`\nIf **amount** is more than what the character has on them, the character will deposit all of their current funds.')
    .withCallback(depositCB)
    .build()

commands.help = new CommandBuilder()
    .withName('help')
    .withHelpText('Usage: `!help` displays a list of commands.\n`!help command` displays detailed info on `command.`')
    .withCallback(helpCB)
    .build()

commands.describe = new CommandBuilder()
    .withName('describe')
    .withHelpText('Usage: `!describe name`\nEnters description mode. The next message you send will change your character\'s description.\n`!cancel` will prevent changes to the description.')
    .withCallback(describeCB)
    .build()

commands.spendmoney = new CommandBuilder()
    .withName('spendmoney')
    .withHelpText('Usage: `!spendmoney name amount`\nSpends `amount` of `name`\'s personal funds.\nExample: `!spendmoney Rikkas 300`\nAn error will be given if there are not enough funds on the character.')
    .withCallback(spendMoneyCB)
    .build()

commands.addmoney = new CommandBuilder()
    .withName('addmoney')
    .withHelpText('Usage: `!addmoney name amount`\nAdds `amount` to `name`\'s personal funds.\nExample: `!addmoney Rikkas 300`')
    .withCallback(addMoneyCB)
    .build()

commands.changejob = new CommandBuilder()
    .withName('changejob')
    .withHelpText('Usage: `!changejob name job`\nChanges `name`\'s job to `job`.\nExample: `!changejob Rikkas Runesmith`')
    .withCallback(changeJobCB)
    .build()

module.exports = commands