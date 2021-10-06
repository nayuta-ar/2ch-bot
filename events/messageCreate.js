const { MessageEmbed } = require('discord.js')
const tagGen = require('../helpers/tagGen')

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return

    const getUser = () => {
      return new Promise((resolve) => {
        message.client.db.query(
          'SELECT * FROM `users` WHERE `userId` = ?',
          [message.author.id],
          (e, rows) => {
            if (!rows[0]) {
              message.client.db.query(
                'INSERT INTO `users` (`userId`, `tag`) VALUES (?, ?)',
                [message.author.id, tagGen()],
              )

              resolve({
                userId: message.author.id,
                nickName: '名無しさん',
                tag: 'Unknown',
                messageCount: 0,
              })
            } else {
              message.client.db.query(
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
        autoArchiveDuration: 4320,
        startMessage: thStartMsg,
      })

      message.client.db.query(
        'INSERT INTO `threads` (`threadId`, `ownerId`) VALUES (?, ?)',
        [createTh.id, message.author.id],
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
          message.client.db.query(
            'SELECT * FROM `threads` WHERE `threadId` = ?',
            [message.channelId],
            (e, rows) => {
              message.client.db.query(
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
            message.client.db.query(
              'SELECT * FROM `messages` WHERE `resId` = ?',
              [message.reference.messageId],
              (e, rows) => {
                if (!rows[0]) {
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

          message.client.db.query(
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
  },
}
