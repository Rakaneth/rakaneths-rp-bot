class CharProfile {
    constructor() {
        this.name = "No name"
        this.userID = "No user id"
        this.money = 0
        this.race = "Human"
        this.job = "Fighter"
    }
}

class CharBuilder {
    constructor() {
        this._char = new CharProfile()
    }
    withName(name) {
        this._char.name = name
        return this
    }
    withUserID(ID) {
        this._char.userID = ID
        return this
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