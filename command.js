/**
 * @typedef DiscordOpts
 * @type {Object}
 * @property {import('discord.js').Client} bot
 * @property {import('discord.js').User} user
 * @property {import('discord.js').Channel} chan
 * @property {import('discord.js').Guild} guild
 * @property {string[]} args
 */

/**
 * @typedef CommandResult
 * @type {Object}
 * @property {string} mode
 * @property {import('./charprofile').CharProfile} char 
 */

class Command {
    /**
     * Command constructor.
     * @param {string} name The name of the command.
     * @param {string} helpText The help text to display for this command.
     */
    constructor(name, helpText, cb) {
        this.name = `!\`${name}\``
        this.helpText = helpText
        this._fn = cb
    }

    /**
     * Executes this command.
     * @param {DiscordOpts} opts Discord command options.
     */
    execute(opts) {
        let { bot, user, chan, guild, args } = opts
        return this._fn(bot, chan, user, guild, ...args)
    }
}

class CommandBuilder {
    constructor() {
        this._name = "noname"
        this._help = "No help for this command."
        this._fn = this._fn = (bot, chan, user, guild, args) => { }
    }
    withName(name) {
        this._name = name
        return this
    }
    withHelpText(helpText) {
        this._help = helpText
        return this
    }
    withCallback(fn) {
        this._fn = fn
        return this
    }
    build() {
        return new Command(this._name, this._help, this._fn)
    }
}

module.exports = { Command, CommandBuilder }