require('http')
  .createServer(function (req, res) {
    res.write('ok')
    res.end()
  })
  .listen(process.env.PORT || 8080)

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
const cron = require('node-cron')

const tagGen = () => {
  const crypto = require('crypto')
  const S = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const resTag = Array.from(crypto.randomFillSync(new Uint8Array(5)))
    .map((n) => S[n % S.length])
    .join('')

  con.query('SELECT * FROM `users` WHERE `tag` = ?', [resTag], (e, rows) => {
    if (e) return

    if (rows.length < 1) {
      return tagGen()
    } else {
      return resTag
    }
  })
}

const con = createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
})

con.connect()

process.on('uncaughtException', (error) => {
  console.log(error)
})

cron.schedule('0 0 * * *', () => {
  client.guilds.cache
    .get('868392026813644870')
    .members.cache.filter(
      (member) => !member.roles.cache.has('870901469279318067'),
    )
    .map((member) => member)
    .forEach((member) => {
      con.query(
        'SELECT * FROM `users` WHERE `userId` = ? and `messageCount` > 100',
        [member.id],
        (e, rows) => {
          if (e || !rows.length < 1) return

          if (rows.length < 1) {
            member.roles.add('870901469279318067')
          }
        },
      )
    })
})

client.once('ready', () => {
  console.log(`${client.user.tag} でログインしました。`)
})

client.on('messageCreate', async (message) => {
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

  if (message.member.roles.cache.has('868499397552513034'))
    userData.nickName = `${userData.nickName}<:moderator:869939850638393374>`

  if (
    message.channel.type === 'GUILD_TEXT' &&
    message.channel.parentId === '876368038528700436'
  ) {
    await message.delete()

    if (!message.content) {
      return message.channel
        .send('メッセージが取得できませんでした。\n再試行してください。')
        .then((msg) => setTimeout(() => msg.delete(), 10000))
    }

    const thStartMsg = await message.channel.send({
      embeds: [
        new MessageEmbed()
          .setTitle(`${userData.nickName}(${userData.tag})`)
          .setDescription(message.content)
          .setColor(userColor),
      ],
    })
    const createTh = await message.channel.threads.create({
      name: message.content,
      autoArchiveDuration: 1440,
      startMessage: thStartMsg,
    })

    con.query(
      'INSERT INTO `threads` (`threadId`, `ownerId`) VALUES (?, ?)',
      [createTh.id, message.author.id],
      async (e) => {
        const msg = await message.channel.send(
          'エラーが発生しました。\nシステム管理者に連絡してください。',
        )
        return setTimeout(() => msg.delete(), 10000)
      },
    )

    await createTh.setRateLimitPerUser(3)

    const addMsg = await createTh.send('Loading...')
    await addMsg.edit(`${message.author}<@&875986483260043284>`)
    await addMsg.delete()
  }

  if (
    message.channel.type === 'GUILD_PUBLIC_THREAD' &&
    message.channel.parent.parentId === '876368038528700436'
  ) {
    await message.delete()

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
      const getRef = () => {
        return new Promise((resolve) => {
          con.query(
            'SELECT * FROM `messages` WHERE `resId` = ?',
            [message.reference.messageId],
            (e, rows) => {
              if (!rows.length < 1) {
                resolve(sendContent)
              } else {
                resolve(
                  `[>>${rows[0].resNum}](https://discord.com/channels/868392026813644870/${rows[0].threadId}/${rows[0].resId})\n${sendContent}`,
                )
              }
            },
          )
        })
      }

      sendContent = await getRef()
    }
    const moment = require('moment-timezone')

    const embed = new MessageEmbed()
      .setTitle(
        `${threadData.resNum + 1} ${userData.nickName}(${userData.tag})`,
      )
      .setDescription(sendContent)
      .setColor(userColor)
      .setFooter(
        moment(message.createdAt)
          .tz('Asia/Tokyo')
          .format('YYYY/MM/DD HH:mm:ss'),
      )

    let notImage = false
    if (message.attachments.first()) {
      if (message.attachments.first().contentType.includes('image/'))
        embed.setImage(message.attachments.first().proxyURL)
      else notImage = true
    }

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

        con.query(
          'INSERT INTO messages (`resId`, `authorId`, `threadId`, `resNum`, `content`, `attachment`) VALUES (?, ?, ?, ?, ?, ?)',
          [
            msg.id,
            message.author.id,
            message.channel.id,
            threadData.resNum + 1,
            sendContent,
            message.attachments.first()
              ? message.attachments.first().proxyURL
              : null,
          ],
        )
      })

    if (threadData.resNum + 1 >= 1000) {
      const embed = new MessageEmbed()
        .setTitle('END')
        .setDescription(
          'レス数が1000以上になったので書き込みを中止しました。\n新しいスレッドを立てて会話してください。',
        )
        .setColor('RED')

      message.channel
        .send({
          embeds: [embed],
        })
        .then(() => {
          message.channel.setLocked(true)
          message.channel.setArchived(true)
        })
    }
  }
})

client.on('guildMemberAdd', (member) => {
  if (member.user.bot) return
  member.setNickname('名無しさん')
  client.channels.cache
    .get('868688109003481148')
    .send(
      `**${member.guild.name}** に <@!${member.user.id}> が参加しました。宣伝したり、話したりしてくれると嬉しいです。`,
    )
})

client.on('guildMemberRemove', (member) => {
  client.channels.cache
    .get('868688109003481148')
    .send(
      `**${member.guild.name}** から **${member.user.tag}** が退出しました。`,
    )
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  await interaction.deferReply({ ephemeral: true })

  switch (interaction.commandName) {
    case 'name': {
      if (interaction.options.getString('name').length > 50) {
        return interaction.editReply('ニックネームは50文字以内にしてください。')
      }
      con.query(
        'SELECT * FROM `users` WHERE `userId` = ?',
        [interaction.user.id],
        async (e, rows) => {
          if (!rows.length < 1) {
            con.query(
              'INSERT INTO `users` (`userId`, `nickName`, `tag`) VALUES (?, ?, ?)',
              [
                interaction.user.id,
                interaction.options.getString('name'),
                tagGen(),
              ],
            )
          } else {
            con.query('UPDATE `users` SET `nickName` = ? WHERE `userId` = ?', [
              interaction.options.getString('name'),
              interaction.user.id,
            ])
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
          if (!rows.length < 1)
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
          if (!rows.length < 1 || rows[0].ownerId !== interaction.user.id) {
            await interaction.editReply(
              'このコマンドはスレ主のみ実行できます。',
            )
          } else {
            if (interaction.options.getString('name').length > 50) {
              return interaction.editReply(
                'デフォルトハンドルは50文字以内にしてください。',
              )
            }
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
