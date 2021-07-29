const { Client, Intents, MessageEmbed } = require('discord.js'),
  client = new Client({
    intents:
      Intents.FLAGS.GUILDS |
      Intents.FLAGS.GUILD_MESSAGES |
      Intents.FLAGS.GUILD_MEMBERS,
  }),
  mongoose = require('mongoose')
tagGen = () => {
  const crypto = require('crypto')
  const S = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from(crypto.randomFillSync(new Uint8Array(5)))
    .map((n) => S[n % S.length])
    .join('')
}

mongoose.connect(process.env.MONGODB_URI, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
})

const userSchema = require('./models/user.js')

client.once('ready', async () => {
  console.log(`${client.user.tag} でログインしました`)

  setInterval(() => {
    client.user.setActivity(`Prefix: / | Ping: ${client.ws.ping}ms`)
  }, 20000)
})

client.on('messageCreate', async (message) => {
  if (message.author.bot) return

  let userName = '名無しさん'
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
      else userName = user.nick
    }
  )

  if (message.member.roles.cache.some((role) => role.name === '運営'))
    userName = `${userName}<:moderator:869939850638393374>`

  if (message.channel.id === '868493156277170196') {
    if (!message.content) return message.reply('メッセージを送信してください。')

    const userTag = userData ? userData.tag : 'None'
    message.guild.channels
      .create(message.content, {
        parent: '868392026813644871',
        position: 0,
        rateLimitPerUser: 3,
        topic: userTag,
      })
      .then((a) => {
        message.reply(`<#${a.id}> スレッドを立てました。`)
        a.send({
          embeds: [
            new MessageEmbed()
              .setTitle(`0 ${userName}(${userTag})`)
              .setDescription(message.content)
              .setColor('WHITE'),
          ],
        })
      })
  }

  if (message.channel.id === '870263903785992213') {
    if (!message.content) return message.reply('メッセージを送信してください。')

    const userTag = userData ? userData.tag : 'None'
    message.guild.channels.cache
      .get('870264227061989416')
      .send({
        embeds: [
          new MessageEmbed()
            .setTitle(`${userName}(${userTag})`)
            .setDescription(message.content)
            .setColor('WHITE'),
        ],
      })
      .then((msg) =>
        msg.channel.threads.create({
          name: `${message.content}(${userTag})`,
          autoArchiveDuration: 1440,
          startMessage: msg,
        })
      )
      .then((th) => {
        th.setRateLimitPerUser(3)
        message.reply(`${th} スレを立てました。`)
      })
  }

  if (message.channel.parentId === '870264227061989416') {
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

    const userTag = userData ? userData.tag : 'None'
    if (message.channel.name.slice(-6) === `${userTag})`)
      userName = `${userName}<:nushi:869905929146085396>`

    await message.delete()
    message.channel.send({
      embeds: [
        new MessageEmbed()
          .setTitle(`${await num()} ${userName}(${userData.tag})`)
          .setDescription(message.content)
          .setImage(
            message.attachments.first()
              ? message.attachments.first().proxyURL
              : null
          )
          .setColor('WHITE'),
      ],
    })

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
      setTimeout(() => message.channel.setArchived(true), 1000)
    }
  }

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
          .setColor('WHITE'),
      ],
    })
    message.channel.setPosition(0)
  }
})

client.on('guildMemberAdd', (member) => {
  client.channels.cache
    .get('868688109003481148')
    .send(
      `${member.guild.name} に <@!${member.user.id}> が参加しました。宣伝したり、話したりしてくれると嬉しいです。`
    )
})

client.on('guildMemberRemove', (member) => {
  client.channels.cache
    .get('868688109003481148')
    .send(`${member.guild.name} から ${member.user.username} が退出しました。`)
})

const commands = {
  async name(interaction) {
    const userData = await userSchema.findOne(
      {
        id: interaction.member.id,
      },
      (e, user) => {
        if (!user)
          userSchema.create({
            id: message.author.id,
            nick: interaction.options.get('name').value,
            tag: tagGen(),
          })
      }
    )
    await userData.updateOne({
      nick: interaction.options.get('name').value,
    })
    interaction.reply({
      content: `ニックネームを ${
        interaction.options.get('name').value
      } に変更しました。`,
      ephemeral: true,
    })
    return
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
    await userSchema.findOne(
      {
        tag: interaction.options.get('tag').value,
      },
      (e, user) => {
        if (!user)
          return interaction.reply({
            content: 'ユーザーが存在しません。',
            ephemeral: true,
          })
        else
          return interaction.reply({
            content: `<@!${user.id}> (${user.id})\nNick: ${user.nick}\nTag: ${user.tag}`,
            ephemeral: true,
          })
      }
    )
  },
}

async function onInteraction(interaction) {
  if (!interaction.isCommand()) return
  return commands[interaction.commandName](interaction)
}

client.on('interactionCreate', (interaction) => onInteraction(interaction))

client.login(process.env.DISCORD_TOKEN)
