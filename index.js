const { Client, Intents, MessageEmbed } = require('discord.js'),
  client = new Client({
    intents: Intents.FLAGS.GUILDS | Intents.FLAGS.GUILD_MESSAGES,
  }),
  base64 = require('base-64'),
  utf8 = require('utf8'),
  encode = (txt) => base64.encode(utf8.encode(txt)),
  moment = require('moment'),
  mongoose = require('mongoose')

mongoose.connect(proess.env.MONGODB_URI, {
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
  const userData = await userSchema
    .findOne({
      id: message.author.id,
    })
    .catch(e, (user) => {
      if (!user)
        await userSchema.create({
          id: message.author.id,
        })
      else
        userName = user.nick
    })

  if (message.channel.id === '868493156277170196') {
    if (!message.content) return message.reply('メッセージを送信してください。')

    message.guild.channels
      .create(message.content, {
        parent: '868392026813644871',
        rateLimitPerUser: 3,
        topic: encode(message.author.id),
      })
      .then((a) => {
        message.reply(`<#${a.id}> スレッドを立てました。`)
      })
  }

  if (
    message.parent.id === '868392026813644871' ||
    message.parent.id === '868694406876790804'
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

    if ((await num()) > 1000) {
      message.channel.send(
        new MessageEmbed()
          .setTitle('END')
          .setDescription(
            'レス数が1000以上になったので書き込みを中止しました。\n新しいスレッドを立てて会話してください。'
          )
          .setColor('RED')
      )
      return message.channel.setParent('868694406876790804')
    }

    if (encode(message.author.id) === message.channel.topic)
      userName = `${userName} [主]`

    await message.delete()
    message.channel.send(
      new MessageEmbed()
        .setAuthor(
          `${await num()} ${userName} ${moment(message.createdAt).format(
            'YYYY/MM/DD HH:mm:ss'
          )} (${encode(message.author.id)})`
        )
        .setDescription(message.content)
        .setImage(message.attachments.first().proxyURL ?? null)
    )
  }
})

client.login(process.env.DISCORD_TOKEN)
