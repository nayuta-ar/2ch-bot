const { Interaction, MessageEmbed } = require('discord.js')

Interaction.prototype.error = function (key, options = {}) {
  options.emoji = 'x'
  options.msg = 'エラー'
  options.color = 'RED'
  return this.sendE(key, options)
}

Interaction.prototype.success = function (key, options = {}) {
  options.emoji = 'white_check_mark'
  options.msg = '成功'
  options.color = 'GREEN'
  return this.sendE(key, options)
}

Interaction.prototype.info = function (key, options = {}) {
  options.emoji = 'information_source'
  options.msg = 'Info'
  options.color = 'BLURPLE'
  return this.sendE(key, options)
}

Interaction.prototype.sendE = function (key, options = {}) {
  const embed = new MessageEmbed()
    .setTitle(`:${options.emoji}: ${options.msg}`)
    .setDescription(key)
    .setColor(options.color)

  if (options.noEdit) {
    return this.reply({ embeds: [embed] })
  } else {
    return this.editReply({ embeds: [embed] })
  }
}
