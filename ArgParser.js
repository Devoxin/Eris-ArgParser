const idMatcher = /^([0-9]{15,21})$/
const userMentionMatcher = /<@!?([0-9]{15,21})>/
const channelMentionMatcher = /<#([0-9]{15,21})>/
const roleMentionMatcher = /<@&([0-9]{15,21})>/

class ArgParser {
  constructor (msg, args) {
    this.msg = msg
    this.args = args
    this.bot = msg._client
  }

  /**
    * Resolves a user using the next argument in the list or all remaining arguments
    * @param {Boolean} consumeRest Whether to use the rest of the arguments to resolve the user or not
    * @return {Null|Object} Null if the argument couldn't be resolved, otherwise the user object
    */
  resolveUser (consumeRest = false) {
    // TODO: Quotation support
    const args = consumeRest
      ? this.args.splice(0).join(' ')
      : this.args.shift() // We use splice to ensure the args array is emptied

    if (!args) {
      return null // We have nothing to resolve a user with
    }

    const idMatch = idMatcher.exec(args) || userMentionMatcher.exec(args)

    if (idMatch) { // Found the user by mention or raw ID
      return this.bot.users.get(idMatch[1])
    } else { // Find the user by their username (and discrim?)
      if (args.length > 5 && args.slice(-5, -4) === '#') { // we have a discrim
        return this.bot.users.find(user => `${user.username}#${user.discriminator}` === args)
      } else {
        return this.bot.users.find(user => user.username === args)
      }
    }
  }

  /**
    * Resolves a channel using the next argument in the list or all remaining arguments
    * @param {Boolean} consumeRest Whether to use the rest of the arguments to resolve the channel or not
    * @return {Null|Object} Null if the argument couldn't be resolved, otherwise the channel object
    */
  resolveChannel (consumeRest = false) {
    const args = consumeRest
      ? this.args.splice(0).join(' ')
      : this.args.shift()

    if (!args) {
      return null // We have nothing to resolve a user with
    }

    const idMatch = idMatcher.exec(args) || channelMentionMatcher.exec(args)

    if (idMatch) {
      return this.bot.getChannel(idMatch[1])
    } else {
      if (!this.msg.channel.guild) {
        return null // Only allow name-lookup for channels locally due to the performance impact this would have for searching lots of guilds
      } else {
        return this.msg.channel.guild.channels.find(channel => channel.name === args)
      }
    }
  }

  /**
    * Resolves a role using the next argument in the list or all remaining arguments
    * @param {Boolean} consumeRest Whether to use the rest of the arguments to resolve the role or not
    * @return {Null|Object} Null if the argument couldn't be resolved, otherwise the role object
    */
  resolveRole (consumeRest = false) {
    const args = consumeRest
      ? this.args.splice(0).join(' ')
      : this.args.shift()

    if (!this.msg.channel.guild || !args) {
      return null
    }

    const idMatch = idMatcher.exec(args) || roleMentionMatcher.exec(args)

    if (idMatch) {
      return this.msg.channel.guild.roles.get(idMatch[1])
    } else {
      return this.msg.channel.guild.roles.find(role => role.name === args)
    }
  }

  /**
    * Returns the next word(s) in the argument list
    * @param {Boolean} consumeRest Whether to return the remaining arguments or a single argument
    * @return {Null|String} Null if the arg list is empty, otherwise the arguments
    */
  nextArgument (consumeRest = false) {
    return consumeRest ? this.args.splice(0).join(' ') : this.args.shift()
  }

  /**
    * Returns the arguments with cleaned mentions
    * @param {Boolean} consumeRest Whether to use the remaining arguments or a single argument
    * @return {Null|String} Null if the arg list is empty, otherwise the cleaned arguments
    */
  cleanContent (consumeRest = false) {
    let args = consumeRest
      ? this.args.splice(0).join(' ')
      : this.args.shift()

    if (!args) {
      return null
    }

    let match

    while ((match = userMentionMatcher.exec(args)) !== null) { // Clean user mentions
      const user = this.msg.channel.guild
        ? this.msg.channel.guild.members.get(match[1])
        : this.bot.users.get(match[1])

      const formatted = user ? `@${user.nick || user.username}` : '@deleted-user'
      args = args.replace(match[0], formatted)
    }

    while ((match = channelMentionMatcher.exec(args)) !== null) { // Clean channel mentions
      const channel = this.msg.channel.guild.channels.get(match[1])
      const formatted = channel ? `#${channel.name}` : '#deleted-channel'
      args = args.replace(match[0], formatted)
    }

    while ((match = roleMentionMatcher.exec(args)) !== null) { // Clean role mentions
      const role = this.msg.channel.guild.roles.get(match[1])
      const formatted = role ? `@${role.name}` : '@deleted-role'
      args = args.replace(match[0], formatted)
    }

    args = args
      .replace('@everyone', '@\u200Beveryone')
      .replace('@here', '@\u200Bhere') // Clean everyone/here mentions

    return args
  }

  /**
    * Returns a boolean based on whether the args list is empty
    * @return {Boolean} True if there are no remaining arguments, otherwise false
    */
  get isEmpty () {
    return !this.args[0]
  }

  /**
    * Returns the combined length of all remaining arguments
    * @return {Number} The combined length of all remaining arguments
    */
  get textLength () {
    return this.args.join(' ').length
  }

  /**
    * Returns the argument at the specified index
    * @param {Number} index The index of the argument to retrieve
    * @return {Null|String} Null if the index is out of bounds, otherwise the argument
    */
  getArgument (index = 0) {
    const args = this.args.slice(index, 1)
    return args.join(' ')
  }

  /**
    * Returns all remaining arguments as a string
    * @return {String} The remaining arguments as a string
    */
  gather () {
    return this.args.join(' ')
  }

  /**
    * Removes the a single argument at the given index
    * @param {Number} index The index of the argument to remove
    * @return {void}
    */
  drop (index) {
    this.args.splice(index, 1)
  }
}

module.exports = ArgParser
