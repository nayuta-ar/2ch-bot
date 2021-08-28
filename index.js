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
const mongoose = require('mongoose')
const { mem, cpu, os } = require('node-os-utils')

// 識別タグの作成
const tagGen = () => {
  const crypto = require('crypto')
  const S = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from(crypto.randomFillSync(new Uint8Array(5)))
    .map((n) => S[n % S.length])
    .join('')
}

// MongoDBに接続
mongoose.connect(process.env.MONGODB_URI, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
})

const userSchema = require('./models/user.js')

// Bot起動時に発火するイベント
client.once('ready', async () => {
  console.log(`${client.user.tag} でログインしました`)

  setInterval(() => {
    client.user.setActivity(`Prefix: / | Ping: ${client.ws.ping}ms`)
  }, 20000)
})

// メッセージ送信時に発火するイベント
client.on('messageCreate', async (message) => {
  if (message.author.bot) return

  if (message.content.startsWith('2ch!')) {
    const args = message.content.slice(4).trim().split(/ +/)
    const command = args.shift().toLowerCase()

    if (command === 'eval') {
      if (message.author.id !== '723052392911863858') return

      try {
        const { inspect } = require('util')
        const evaled = await eval(args.join(' '))
        message.reply({
          embeds: [
            new MessageEmbed()
              .setTitle('出力')
              .setDescription(`\`\`\`js\n${inspect(evaled)}\n\`\`\``)
              .setColor('BLURPLE'),
          ],
        })
      } catch (e) {
        message.reply({
          embeds: [
            new MessageEmbed()
              .setTitle('エラー')
              .setDescription(`\`\`\`js\n${e}\n\`\`\``)
              .setColor('RED'),
          ],
        })
      }
    }
  }

  let userName = '名無しさん'
  let userColor = '#ffffff'
  const userData = await userSchema.findOne(
    {
      id: message.author.id,
    },
    (e, user) => {
      if (!user)
        userSchema.create({
          id: message.author.id,
          tag: tagGen(),
        })
      else {
        userName = user.nick

        if (10 <= user.count && user.count < 30) userColor = '#f4fff4'
        else if (user.count < 50) userColor = '#eaffea'
        else if (user.count < 100) userColor = '#d5ffd5'
        else if (user.count < 200) userColor = '#aaffaa'
        else if (user.count < 300) userColor = '#80ff80'
        else if (user.count < 500) userColor = '#55ff55'
        else if (user.count < 1000) userColor = '#2bff2b'
        else if (user.count < 1500) userColor = '#00ff00'
        else if (user.count < 2000) userColor = '#00d500'
        else if (user.count < 3000) userColor = '#00aa00'
        else if (user.count < 5000) userColor = '#008000'
        else userColor = '#005500'

        if (
          !message.member.roles.cache.some((role) => role.name === '常連') &&
          user.count > 100
        )
          message.member.roles.add(
            message.guild.roles.cache.find((role) => role.name === '常連')
          )
      }
    }
  )

  // システムメッセージは無視 (ウェルカムメッセージなど)
  if (message.system) return

  // 発言数を1増やす
  await userData
    .updateOne({
      count: (userData.count += 1),
    })
    .catch(() => {})

  // 「運営」ロールがあれば :moderator: バッジをつける
  if (message.member.roles.cache.some((role) => role.name === '運営'))
    userName = `${userName}<:moderator:869939850638393374>`

  // message.content がnullの場合はreturn (画像だけ送信など)
  if (message.channel.id === '870263903785992213') {
    if (!message.content) return message.reply('メッセージを送信してください。')

    const userTag = userData ? userData.tag : 'Unkuown'
    const thStartMsg = await message.guild.channels.cache
      .get('870264227061989416')
      .send({
        embeds: [
          new MessageEmbed()
            .setTitle(`${userName}(${userTag})`)
            .setDescription(message.content)
            .setColor(userColor),
        ],
      })
    const createTh = await thStartMsg.channel.threads.create({
      name: `${message.content}(${userTag})`,
      autoArchiveDuration: 1440,
      startMessage: thStartMsg,
    })

    await createTh.setRateLimitPerUser(3)

    const addMsg = await createTh.send('Loading...')
    await addMsg.edit(`${message.author}<@&875986483260043284>`)
    await addMsg.delete()

    message.reply(`${createTh} スレを立てました。`)
  }

  // チャンネルがスレッドかつ #📚｜スレ一覧 配下の場合
  if (
    message.channel.type === 'GUILD_PUBLIC_THREAD' &&
    message.channel.parentId === '870264227061989416'
  ) {
    let m_content = message.content

    // レス番号を計算
    num = async () => {
      try {
        let n = await message.channel.messages.fetch().then(
          (a) =>
            Number(
              a
                .filter((a) => a.author.id === client.user.id && a.embeds[0])
                .first()
                .embeds[0].title.split(' ')[0]
            ) + 1
        )
        return n
      } catch {
        return 1
      }
    }

    // スレ主の場合 :nushi: バッジをつける
    const userTag = userData ? userData.tag : 'None'
    if (message.channel.name.slice(-6) === `${userTag})`)
      userName = `${userName}<:nushi:869905929146085396>`

    if (message.reference) {
      let m = await message.channel.messages
        .fetch({ limit: 100 })
        .then((msgs) =>
          msgs.filter((msg) => msg.id === message.reference.messageId).first()
        )

      m_content = `[>>${m.embeds[0].title.split(' ')[0]}](${m.url})\n${
        message.content
      }`
    }

    const embed = new MessageEmbed()
      .setTitle(`${await num()} ${userName}(${userData.tag})`)
      .setDescription(m_content)
      .setColor(userColor)

    let notImage = false
    if (message.attachments.first()) {
      if (message.attachments.first().contentType.includes('image/'))
        embed.setImage(message.attachments.first().proxyURL)
      else notImage = true
    }

    await message.delete()
    message.channel
      .send({
        embeds: [embed],
      })
      .then((msg) => {
        if (notImage) {
          msg.reply({
            content: '添付ファイル',
            files: [message.attachments.first()],
          })
        }
      })

    // 1000レスに到達した時
    if ((await num()) >= 1000) {
      message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setTitle('END')
              .setDescription(
                'レス数が1000以上になったので書き込みを中止しました。\n新しいスレッドを立てて会話してください。'
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

  if (
    message.channel.type === 'GUILD_TEXT' &&
    message.channel.id === '870264227061989416'
  ) {
    const msg = await message.reply(
      'スレを立てる場合は、<#870263903785992213> にスレタイトルを送信してください。'
    )
    setTimeout(() => {
      msg.delete()
      message.delete().catch(() => {})
    }, 10000)
  }

  if (!message.channel.parent) return

  if (
    message.channel.parent.id === '868392026813644871' ||
    message.channel.parent.id === '868694406876790804'
  ) {
    num = async () => {
      try {
        let n = await message.channel.messages.fetch().then(
          (a) =>
            Number(
              a
                .filter((a) => a.author.id === client.user.id)
                .first()
                .embeds[0].title.split(' ')[0]
            ) + 1
        )
        return n
      } catch {
        return 1
      }
    }

    if ((await num()) >= 1000) {
      message.channel.send({
        embeds: [
          new MessageEmbed()
            .setTitle('END')
            .setDescription(
              'レス数が1000以上になったので書き込みを中止しました。\n新しいスレッドを立てて会話してください。'
            )
            .setColor('RED'),
        ],
      })
      return message.channel.setParent('868694406876790804')
    }

    const userTag = userData ? userData.tag : 'None'
    if (userTag === message.channel.topic)
      userName = `${userName}<:nushi:869905929146085396>`

    await message.delete()
    message.channel.send({
      embeds: [
        new MessageEmbed()
          .setTitle(`${await num()} ${userName}(${userTag})`)
          .setDescription(message.content)
          .setImage(
            message.attachments.first()
              ? message.attachments.first().proxyURL
              : null
          )
          .setColor(userColor),
      ],
    })
    message.channel.setPosition(1)
  }
})

// メンバー参加時に発火するイベント
client.on('guildMemberAdd', (member) => {
  client.channels.cache
    .get('868688109003481148')
    .send(
      `**${member.guild.name}** に <@!${member.user.id}> が参加しました。宣伝したり、話したりしてくれると嬉しいです。`
    )
})

// メンバー退出時に発火するイベント
client.on('guildMemberRemove', (member) => {
  client.channels.cache
    .get('868688109003481148')
    .send(
      `**${member.guild.name}** から **${member.user.tag}** が退出しました。`
    )
})

// Slash commandsのリスト
const commands = {
  async name(interaction) {
    await interaction.deferReply({ ephemeral: true })

    const userData = await userSchema.findOne(
      {
        id: interaction.member.id,
      },
      (e, user) => {
        if (!user)
          userSchema.create({
            id: interaction.member.id,
            nick: interaction.options.get('name').value,
            tag: tagGen(),
          })
      }
    )
    await userData
      .updateOne({
        nick: interaction.options.get('name').value,
      })
      .catch(() => {})
    interaction.editReply({
      content: `ニックネームを **${
        interaction.options.get('name').value
      }** に変更しました。`,
      ephemeral: true,
    })
    return
  },
  async message_count(interaction) {
    await interaction.deferReply({ ephemeral: true })

    await userSchema.findOne(
      {
        id: interaction.member.id,
      },
      (e, user) => {
        return interaction.editReply({
          content: `あなたは、これまで **${user.count}メッセージ** 送信しています。`,
          ephemeral: true,
        })
      }
    )
  },
  async reset(interaction) {
    return await interaction.reply({
      embeds: [
        new MessageEmbed().setTitle(
          String(interaction.options.get('num').value)
        ),
      ],
    })
  },
  async tag_search(interaction) {
    await interaction.deferReply({ ephemeral: true })

    await userSchema.findOne(
      {
        tag: interaction.options.get('tag').value,
      },
      (e, user) => {
        if (!user)
          return interaction.editReply({
            content: 'ユーザーが存在しません。',
            ephemeral: true,
          })
        else
          return interaction.editReply({
            content: `<@!${user.id}> (**${user.id}**)\nNick: **${user.nick}**\nTag: **${user.tag}**\nCount: **${user.count}**`,
            ephemeral: true,
          })
      }
    )
  },
  async ranking(interaction) {
    await interaction.deferReply({ ephemeral: true })

    let rankData = await userSchema.find().sort({ count: -1 }).exec()
    rankData = rankData
      .slice(0, 7)
      .map((rd, i) => `**\`${i + 1}.\`** \`${rd.count}\` ${rd.nick}(${rd.tag})`)
      .join('\n')

    return interaction.editReply(rankData)
  },
  async status(interaction) {
    await interaction.deferReply({ ephemeral: true })

    let rss = process.memoryUsage().rss
    if (rss instanceof Array) {
      rss = rss.reduce((sum, val) => sum + val, 0)
    }
    let heapUsed = process.memoryUsage().heapUsed
    if (heapUsed instanceof Array) {
      heapUsed = heapUsed.reduce((sum, val) => sum + val, 0)
    }

    const { totalMemMb, usedMemMb } = await mem.info()

    return interaction.editReply(
      `\`\`\`\nPing: ${Math.round(client.ws.ping)}ms\nNode.js: v${
        process.versions.node
      }\ndiscord.js: v${djsversion}\nOS: ${await os.oos()}\nCPU: ${cpu.model()}\n├ コア数: ${cpu.count()}\n└ 使用率: ${await cpu.usage()}%\nメモリ: ${totalMemMb}MB\n└ 使用量: ${(
        heapUsed /
        1024 /
        1024
      ).toFixed(2)}MB\n\`\`\``
    )
  },
}

// Buttonsのリスト
const buttons = {
  async sudo(interaction) {
    await interaction.deferReply()

    if (
      interaction.member.roles.cache.some((role) => role.name === '管理者権限')
    ) {
      interaction.member.roles.remove(
        interaction.member.guild.roles.cache.find(
          (role) => role.name === '管理者権限'
        )
      )

      return interaction.editReply({
        content:
          '管理者権限を外しました。\nボタンを再度押すと、管理者権限を取得することができます。',
        ephemeral: true,
      })
    } else {
      interaction.member.roles.add(
        interaction.member.guild.roles.cache.find(
          (role) => role.name === '管理者権限'
        )
      )

      return interaction.editReply({
        content:
          '管理者権限を付与しました。\nボタンを再度押すと、管理者権限を外すことができます。',
        ephemeral: true,
      })
    }
  },
}

async function onInteraction(interaction) {
  // Buttons
  if (interaction.isButton()) return buttons[interaction.customId](interaction)
  // Slash commands
  else if (interaction.isCommand())
    return commands[interaction.commandName](interaction)
}

// インタラクション発生時に発火するイベント
client.on('interactionCreate', (interaction) => onInteraction(interaction))

// TOKENでBotにログイン
client.login(process.env.DISCORD_TOKEN)
