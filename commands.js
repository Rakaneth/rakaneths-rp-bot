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
 * Sets points on user's account.
 * @param {CharProfile} char
 * @param {number} val 
 */
function setBalance(char, val) {
    let tbl = getDataFile(BANK_FILE)
    let charID = char.userID
    tbl[charID] = val
    saveData(tbl, BANK_FILE)
}

/**
 * Withdraws amt from char's bank account.
 * @param {CharProfile} char Character withdrawing the money.
 * @param {number} amt The amount to be withdrawn.
 */
function withdraw(char, amt) {
    let result = ""
    let charID = char.userID
    let bank = getDataFile(BANK_FILE)
    let chars = getDataFile(CHAR_FILE)
    let curAmt = bank[charID]
    if (amt <= 0)
        result = 'Amount must be greater than zero.'
    else if (typeof (curAmt) === 'undefined')
        result = 'No account associated with this character'
    else if (amt > curAmt) {
        result = 'Insufficient funds.'
    } else {
        char.money += amt
        bank[charID] -= amt
        saveData(bank, BANK_FILE)
        result = `Withdrew ${amt} from bank account; new balance is ${bank[charID]}`
    }
    chars.characters[char.userID] = char
    saveData(chars, CHAR_FILE)
    saveData(bank, BANK_FILE)
    return result
}


/**
 * Deposits amt into char's bank account.
 * @param {CharProfile} char 
 * @param {number} amt 
 */
function deposit(char, amt) {
    let bank = getDataFile(BANK_FILE)
    let chars = getDataFile(CHAR_FILE)
    let charID = char.userID
    let result = ""
    amt = Math.min(amt, char.money)
    if (amt <= 0)
        result = "Amount must be greater than zero."
    else if (typeof (bank[charID]) === 'undefined') {
        char.money -= amt
        setBalance(char, amt)
        result = `${amt} deposited into new account.`
    } else {
        char.money -= amt
        bank[charID] += amt
        result = `${amt} deposited into bank account; new balance is ${bank[charID]}.`
        saveData(bank, BANK_FILE)
    }
    chars.characters[charID] = char
    saveData(chars, CHAR_FILE)
    return result
}

/**
 * Gets points on user's account.
 * @param {CharProfile} char
 */
function getBalance(char) {
    let tbl = getDataFile(BANK_FILE)
    let charID = char.userID
    return tbl[charID] || 0
}

/**
 * Saves obj to filename.
 * @param {any} obj The object to save.
 * @param {string} fileName The filename to save to.
 */
function saveData(obj, fileName) {
    fs.writeFileSync(fileName, JSON.stringify(obj, null, 4), 'utf8')
}

/**
 * Returns a CharProfile with the character's name.
 * @param {import('discord.js').User} user The user who owns the character.
 * @param {string} charName Name of the character being found.
 * @returns {CharProfile | null} The CharProfile with the given charName,
 * or null if not found.
 */
function charFromFile(user, charName) {
    let charTbl = getDataFile(CHAR_FILE)
    let charID = `${charName}-${user.id}`
    let charRaw = charTbl.characters[charID]
    if (charRaw) {
        return new CharBuilder(user, charRaw.name)
            .withJob(charRaw.job)
            .withRace(charRaw.race)
            .withStartingMoney(charRaw.money)
            .build()
    } else {
        return null;
    }
}

commands = {}
commands.docs = {
    createchar: 'Usage: `!createchar name race`\nCreates a character of race **race** named **name**.\nExample: `!createchar Rikkas Dwarf`',
    removechar: 'Usage: `!removechar (name)`\nDeletes the character named **name**.\nExample: `!removechar Rikkas`\n**WARNING:** This action cannot be undone and there is **__NO CONFIRMATION. BE CAREFUL.__**',
    viewchar: 'Usage: `!viewchar name`\nViews the character named **name**.\nExample: `!viewchar Rikkas`',
    deposit: 'Usage: `!deposit name amount`\nDeposits **amount** into **name**\'s bank account.\nExample: `!deposit Rikkas 300`\nIf **amount** is more than what the character has on them, the character will deposit all of their current funds.',
    withdraw: 'Usage: `!withdraw name amount`\nWithdraws **amount** from **name**\'s bank account.\nExample: `!withdraw Rikkas 300`\nAn error will be given if there are not enough funds in the character\'s account.',
    balance: 'Usage: `!balance name`\nGets the current bank balance for **name**\'s account.\nExample: `!balance Rikkas`'
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
            .withStartingMoney(0)
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
    else
        chan.send(`${charName} does not exist. Try \`!createchar ${charName} (race).\`.'`)
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
    } else {
        chan.send(`${charName} does not exist.`)
    }
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
    let val = parseInt(amt, 10)
    chan.send(withdraw(char, val))
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
    let val = parseInt(amt, 10)
    chan.send(deposit(char, val))
}

/**
 * @param {import('discord.js').Client} bot Discord bot reference
 * @param {import('discord.js').TextChannel} chan Discord channel.
 * @param {import('discord.js').User} user User sending the message,
 * @param {string} cmdName The command to explain
 */
commands.help = function (bot, chan, user, cmdName) {
    if (cmdName && this.docs[cmdName])
        chan.send(`!\`${cmdName}\`\n${this.docs[cmdName]}`)
    else if (cmdName && !this.docs[cmdName])
        chan.send(`No help available for ${cmdName}.`)
    else {
        for (let cmd of Object.keys(this.docs)) {
            chan.send(`!\`${cmd}\`\n${this.docs[cmd]}`)
        }
    }
}

module.exports = commands