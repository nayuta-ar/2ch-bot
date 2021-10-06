module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    if (member.user.bot) return

    member.setNickname('名無しさん')
    member.client.channels.cache
      .get('868688109003481148')
      .send(
        `**${member.guild.name}** に <@!${member.user.id}> が参加しました。宣伝したり、話したりしてくれると嬉しいです。`,
      )
      .catch(() => {})
  },
}
