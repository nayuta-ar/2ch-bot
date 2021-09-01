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

    let userName = '名無しさん'
    let userColor = '#ffffff'
    let userTag = 'Unknown'

    con.query(
      'SELECT * FROM `users` WHERE `userId` = ?',
      [message.author.id],
      (e, rows) => {
        if (!rows[0]) {
          con.query('INSERT INTO `users` (`userId`, `tag`) VALUES (?, ?)', [
            message.author.id,
            tagGen(),
          ])
        } else {
          userName = rows[0].nickName
          userTag = rows[0].tag

          if (rows[0].messageCount >= 10 && rows[0].messageCount < 30)
            userColor = '#f4fff4'
          else if (rows[0].messageCount < 50) userColor = '#eaffea'
          else if (rows[0].messageCount < 100) userColor = '#d5ffd5'
          else if (rows[0].messageCount < 200) userColor = '#aaffaa'
          else if (rows[0].messageCount < 300) userColor = '#80ff80'
          else if (rows[0].messageCount < 500) userColor = '#55ff55'
          else if (rows[0].messageCount < 1000) userColor = '#2bff2b'
          else if (rows[0].messageCount < 1500) userColor = '#00ff00'
          else if (rows[0].messageCount < 2000) userColor = '#00d500'
          else if (rows[0].messageCount < 3000) userColor = '#00aa00'
          else if (rows[0].messageCount < 5000) userColor = '#008000'
          else userColor = '#005500'

          if (
            !message.member.roles.cache.some((role) => role.name === '常連') &&
            rows[0].messageCount >= 100
          )
            message.member.roles.add(
              message.guild.roles.cache.find((role) => role.name === '常連'),
            )

          con.query(
            'UPDATE `users` SET `messageCount` = ? WHERE `userId` = ?',
            [(rows[0].messageCount += 1), message.author.id],
          )
        }
      },
    )

    if (message.member.roles.cache.some((role) => role.name === '運営'))
      userName = `${userName}<:moderator:869939850638393374>`

    if (
      message.channel.type === 'GUILD_TEXT' &&
      message.channel.parentId === '882520205706792982'
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
            .setTitle(`${userName}(${userTag})`)
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

    if (
      message.channel.type === 'GUILD_PUBLIC_THREAD' &&
      message.channel.parent.parentId === '882520205706792982'
    ) {
      function getThread() {
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

      if (threadData.defaultName && userName === '名無しさん')
        userName = threadData.defaultName

      if (threadData.ownerId === message.author.id)
        userName = `${userName}<:nushi:869905929146085396>`

      let sendContent = message.content

      if (message.reference) {
        const m = await message.channel.messages
          .fetch({ limit: 100 })
          .then((msgs) =>
            msgs
              .filter((msg) => msg.id === message.reference.messageId)
              .first(),
          )

        sendContent = `[>>${m.embeds[0].title.split(' ')[0]}](${m.url})\n${
          message.content
        }`
      }

      const embed = new MessageEmbed()
        .setTitle(`${threadData.resNum + 1} ${userName}(${userTag})`)
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
                .setTitle('END')
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
  /* .on('guildMemberAdd', (member) => {
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
  }) */
  .on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return
    const { commandName } = interaction

    switch (commandName) {
      case 'name': {
        await interaction.deferReply({ ephemeral: true })

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
              con.query('UPDATE `users` SET `nick` = ? WHERE `userId` = ?', [
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
        await interaction.deferReply({ ephemeral: true })

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
      case 'reset': {
        await interaction.reply({
          embeds: [
            new MessageEmbed().setTitle(
              String(interaction.options.get('num').value),
            ),
          ],
        })
        break
      }
      case 'tag_search': {
        await interaction.deferReply({ ephemeral: true })

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
        await interaction.reply({
          content: '現在、ランキング機能を一時的に停止しています。',
          ephemeral: true,
        })
        break
      }
      case 'status': {
        await interaction.deferReply({ ephemeral: true })

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
    }
  })

client.login(process.env.DISCORD_TOKEN)
