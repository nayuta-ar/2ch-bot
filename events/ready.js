module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`)

    /* const members = client.guilds.cache
      .get('868392026813644870')
      .members.cache.filter((member) => !member.user.bot)
      .map((member) => member)

    for (const member of members.filter(
      (member) => !member.roles.cache.has('870901469279318067'),
    )) {
      client.db.query(
        'SELECT * FROM `users` WHERE `userId` = ?',
        [member.id],
        (e, rows) => {
          if (rows[0] && rows[0].messageCount >= 100) {
            member.roles.add('870901469279318067')
          }
        },
      )
    }

    for (const member of members) {
      member.setNickname('名無しさん').catch(() => {})
    } */
  },
}
