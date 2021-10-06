module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    if (member.user.bot) return

    member.client.channels.cache
      .get('868688109003481148')
      .send(
        `**${member.guild.name}** から **${member.user.tag}** が退出しました。`,
      )
      .catch(() => {})
  },
}
