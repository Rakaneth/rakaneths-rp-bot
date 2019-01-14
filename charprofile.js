class CharProfile {
    /**
     * Creates a character for a user.
     * @param {import('discord.js').User} user User to create character for.
     * @param {string} name Name of character
     */
    constructor(user, charName) {
        this.name = charName || "No name"
        this.userID = `${this.name}-${user.id}`
        this.money = 0
        this.race = "Human"
        this.job = "Fighter"
    }

    toString() {
        return `
\`\`\`
Name: ${this.name}
Race: ${this.race}
Job: ${this.job}
Money: ${this.money}
\`\`\``
    }
}

class CharBuilder {
    constructor(user, name) {
        this._char = new CharProfile(user, name)
    }
    withStartingMoney(money) {
        this._char.money = money
        return this
    }
    withRace(race) {
        this._char.race = race
        return this
    }
    withJob(job) {
        this._char.job = job
        return this
    }
    build() {
        return this._char
    }
}

module.exports = {
    CharProfile, CharBuilder
}