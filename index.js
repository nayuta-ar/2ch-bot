require('dotenv').config()

const {
  Client,
  Intents,
  MessageEmbed,
  version: djsversion,
} = require('discord.js')
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
  ],
})
const { mem, cpu, os } = require('node-os-utils')
const { createConnection } = require('mysql')

const tagGen = () => {
  const crypto = require('crypto')
  const S = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from(crypto.randomFillSync(new Uint8Array(5)))
    .map((n) => S[n % S.length])
    .join('')
}

const con = createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
})

con.connect()

client
  .once('ready', () => console.log(`${client.user.tag} でログインしました。`))
  .on('messageCreate', async (message) => {
    if (message.author.bot) return

    const getUser = () => {
      return new Promise((resolve) => {
        con.query(
          'SELECT * FROM `users` WHERE `userId` = ?',
          [message.author.id],
          (e, rows) => {
            if (!rows[0]) {
              con.query('INSERT INTO `users` (`userId`, `tag`) VALUES (?, ?)', [
                message.author.id,
                tagGen(),
              ])

              resolve({
                userId: message.author.id,
                nickName: '名無しさん',
                tag: 'Unknown',
                messageCount: 0,
              })
            } else {
              con.query(
                'UPDATE `users` SET `messageCount` = ? WHERE `userId` = ?',
                [rows[0].messageCount + 1, message.author.id],
              )

              resolve(rows[0])
            }
          },
        )
      })
    }

    const userData = await getUser()

    let userColor
    if (userData.messageCount < 10) userColor = '#FFFFFF'
    else if (userData.messageCount < 30) userColor = '#F4FFF4'
    else if (userData.messageCount < 50) userColor = '#EAFFEA'
    else if (userData.messageCount < 100) userColor = '#D5FFD5'
    else if (userData.messageCount < 200) userColor = '#AAFFAA'
    else if (userData.messageCount < 300) userColor = '#80FF80'
    else if (userData.messageCount < 500) userColor = '#55FF55'
    else if (userData.messageCount < 1000) userColor = '#2BFF2B'
    else if (userData.messageCount < 1500) userColor = '#00FF00'
    else if (userData.messageCount < 2000) userColor = '#00D500'
    else if (userData.messageCount < 3000) userColor = '#00AA00'
    else if (userData.messageCount < 5000) userColor = '#008000'
    else userColor = '#005500'

    if (
      !message.member.roles.cache.some((role) => role.name === '常連') &&
      userData.messageCount >= 100
    )
      message.member.roles.add(
        message.guild.roles.cache.find((role) => role.name === '常連'),
      )

    if (message.member.roles.cache.some((role) => role.name === '運営'))
      userData.nickName = `${userData.nickName}<:moderator:869939850638393374>`

    if (
      message.channel.type === 'GUILD_TEXT' &&
      message.channel.parentId === '876368038528700436'
    ) {
      if (!message.content) {
        return message
          .reply('メッセージが取得できませんでした。\n再試行してください。')
          .then((msg) => setTimeout(() => msg.delete(), 10000))
      }

      await message.delete()

      const thStartMsg = await message.channel.send({
        embeds: [
          new MessageEmbed()
            .setAuthor(`${userData.nickName}(${userData.tag})`)
            .setDescription(message.content)
            .setColor(userColor),
        ],
      })
      const createTh = await message.channel.threads.create({
        name: message.content,
        autoArchiveDuration: 1440,
        startMessage: thStartMsg,
      })

      con.query('INSERT INTO `threads` (`threadId`, `ownerId`) VALUES (?, ?)', [
        createTh.id,
        message.author.id,
      ])

      await createTh.setRateLimitPerUser(3)

      const addMsg = await createTh.send('Loading...')
      await addMsg.edit(`${message.author}<@&875986483260043284>`)
      await addMsg.delete()
    }

    if (message.channel.parentId === '870264227061989416')
      return message.reply(
        'こちらのスレはサービスを終了しました。\nスレ主の方は新しいスレを立ててください。',
      )

    if (
      message.channel.type === 'GUILD_PUBLIC_THREAD' &&
      message.channel.parent.parentId === '876368038528700436'
    ) {
      const getThread = () => {
        return new Promise((resolve) => {
          con.query(
            'SELECT * FROM `threads` WHERE `threadId` = ?',
            [message.channelId],
            (e, rows) => {
              con.query(
                'UPDATE `threads` SET `resNum` = ? WHERE `threadId` = ?',
                [rows[0].resNum + 1, message.channelId],
              )

              resolve(rows[0])
            },
          )
        })
      }

      const threadData = await getThread()

      if (threadData.defaultName && userData.nickName === '名無しさん')
        userData.nickName = threadData.defaultName

      if (threadData.ownerId === message.author.id)
        userData.nickName = `${userData.nickName}<:nushi:869905929146085396>`

      let sendContent = message.content

      if (message.reference) {
        const m = await message.channel.messages
          .fetch({ limit: 100 })
          .then((msgs) =>
            msgs
              .filter((msg) => msg.id === message.reference.messageId)
              .first(),
          )

        sendContent = `[>>${m.embeds[0].author.name.split(' ')[0]}](${m.url})\n${
          message.content
        }`
      }

      const embed = new MessageEmbed()
        .setAuthor(
          `${threadData.resNum + 1} ${userData.nickName}(${userData.tag})`,
        )
        .setDescription(sendContent)
        .setColor(userColor)

      let notImage = false
      if (message.attachments.first()) {
        if (message.attachments.first().contentType.includes('image/'))
          embed.setImage(message.attachments.first().proxyURL)
        else notImage = true
      }

      await message.delete()
      await message.channel
        .send({
          embeds: [embed],
        })
        .then((msg) => {
          if (notImage)
            msg.reply({
              content: '添付ファイル',
              files: [message.attachments.first()],
            })
        })

      if (threadData.resNum + 1 >= 1000) {
        message.channel
          .send({
            embeds: [
              new MessageEmbed()
                .setAuthor('END')
                .setDescription(
                  'レス数が1000以上になったので書き込みを中止しました。\n新しいスレッドを立てて会話してください。',
                )
                .setColor('RED'),
            ],
          })
          .then(() => {
            message.channel.setLocked(true)
            message.channel.setArchived(true)
          })
      }
    }
  })
  .on('guildMemberAdd', (member) => {
    client.channels.cache
      .get('868688109003481148')
      .send(
        `**${member.guild.name}** に <@!${member.user.id}> が参加しました。宣伝したり、話したりしてくれると嬉しいです。`,
      )
  })
  .on('guildMemberRemove', (member) => {
    client.channels.cache
      .get('868688109003481148')
      .send(
        `**${member.guild.name}** から **${member.user.tag}** が退出しました。`,
      )
  })
  .on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return
    await interaction.deferReply({ ephemeral: true })

    switch (interaction.commandName) {
      case 'name': {
        con.query(
          'SELECT * FROM `users` WHERE `userId` = ?',
          [interaction.user.id],
          async (e, rows) => {
            if (!rows[0]) {
              con.query(
                'INSERT INTO `users` (`userId`, `nickName`, `tag`) VALUES (?, ?, ?)',
                [
                  interaction.user.id,
                  interaction.options.getString('name'),
                  tagGen(),
                ],
              )
            } else {
              con.query(
                'UPDATE `users` SET `nickName` = ? WHERE `userId` = ?',
                [interaction.options.getString('name'), interaction.user.id],
              )
            }
            await interaction.editReply(
              `ニックネームを \`${interaction.options.getString(
                'name',
              )}\` に変更しました。`,
            )
          },
        )
        break
      }
      case 'message_count': {
        con.query(
          'SELECT * FROM `users` WHERE `userId` = ?',
          [interaction.user.id],
          async (e, rows) => {
            let count

            if (!rows[0]) count = 0
            else count = rows[0].messageCount

            await interaction.editReply(
              `あなたは、これまで \`${count}メッセージ\` 送信しています。`,
            )
          },
        )
        break
      }
      case 'tag_search': {
        con.query(
          'SELECT * FROM `users` WHERE `tag` = ?',
          [interaction.options.getString('tag')],
          async (e, rows) => {
            if (!rows[0])
              await interaction.editReply('ユーザーが存在しません。')
            else
              await interaction.editReply(
                `<@!${rows[0].userId}> (\`${rows[0].userId}\`)\nnickName: \`${rows[0].nickName}\`\ntag: \`${rows[0].tag}\`\nmessageCount: \`${rows[0].messageCount}\``,
              )
          },
        )
        break
      }
      case 'ranking': {
        con.query(
          'SELECT * FROM `users` ORDER BY `messageCount` DESC LIMIT 7',
          async (e, rows) => {
            await interaction.editReply(
              rows
                .map(
                  (rd, i) =>
                    `**\`${i + 1}.\`** \`${rd.messageCount}\` ${rd.nickName}(${
                      rd.tag
                    })`,
                )
                .join('\n'),
            )
          },
        )
        break
      }
      case 'status': {
        let rss = process.memoryUsage().rss
        if (rss instanceof Array) {
          rss = rss.reduce((sum, val) => sum + val, 0)
        }
        let heapUsed = process.memoryUsage().heapUsed
        if (heapUsed instanceof Array) {
          heapUsed = heapUsed.reduce((sum, val) => sum + val, 0)
        }
        const { totalMemMb } = await mem.info()

        interaction.editReply(
          `\`\`\`\nPing: ${Math.round(client.ws.ping)}ms\nNode.js: v${
            process.versions.node
          }\ndiscord.js: v${djsversion}\nOS: ${await os.oos()}\nCPU: ${cpu.model()}\n├ コア数: ${cpu.count()}\n└ 使用率: ${await cpu.usage()}%\nメモリ: ${totalMemMb}MB\n└ 使用量: ${(
            heapUsed /
            1024 /
            1024
          ).toFixed(2)}MB\n\`\`\``,
        )
        break
      }
      case 'default_name': {
        con.query(
          'SELECT * FROM `threads` WHERE `threadId` = ?',
          [interaction.channelId],
          async (e, rows) => {
            if (!rows[0] || rows[0].ownerId !== interaction.user.id)
              await interaction.editReply(
                'このコマンドはスレ主のみ実行できます。',
              )
            else {
              con.query(
                'UPDATE `threads` SET `defaultName` = ? WHERE `threadId` = ?',
                [interaction.options.getString('name'), interaction.channelId],
              )
              await interaction.editReply('デフォルトハンドルを設定しました。')
            }
          },
        )
        break
      }
    }
  })

client.login(process.env.DISCORD_TOKEN)
