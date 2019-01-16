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
            .withDesc(charRaw.desc)
            .build()
    } else {
        return null
    }
}

/**
 * Returns a CharProfile with the character's name, regardless of owner.
 * @param {string} charName Name of the character being found.
 * @returns {CharProfile | null} The CharProfile with the given charName
 * or null if not found.
 */
function charByName(charName) {
    let { characters } = getDataFile(CHAR_FILE)
    let charID = Object.keys(characters).find((id) => {
        return id.startsWith(charName)
    })
    if (charID) {
        let charRaw = characters[charID]
        let char = new CharProfile()
        char.name = charRaw.name
        char.userID = charRaw.userID
        char.job = charRaw.job
        char.money = charRaw.money
        char.desc = charRaw.desc
        char.race = charRaw.race
        return char
    } else
        return null
}

/**
 * Updates a character in the character file.
 * @param {CharProfile} char The character to save.
 */
function updateChar(char) {
    let charTbl = getDataFile(CHAR_FILE)
    charTbl.characters[char.userID] = char
    saveData(charTbl, CHAR_FILE)
}

module.exports = {
    charFromFile,
    saveData,
    getBalance,
    deposit,
    withdraw,
    getDataFile,
    getUser,
    updateChar,
    charByName
}