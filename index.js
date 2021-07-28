const { Client, Intents } = require('discord.js'),
  client = new Client({
    intents: Intents.FLAGS.GUILDS | Intents.FLAGS.GUILD_MESSAGES,
  }),
  mongoose = require('mongoose')

mongoose.connect(proess.env.MONGODB_URI, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
})

client.once('ready', async () => {
  console.log(`${client.user.tag} でログインしました`)

  setInterval(() => {
    client.user.setActivity(`Prefix: / | Ping: ${client.ws.ping}ms`)
  }, 20000)
})

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.channel.id === '868493156277170196') {
    if (!message.content) return message.reply('メッセージを送信してください。')

    message.guild.channels
			.create(message.content, {
				parent: '868392026813644871',
        rateLimitPerUser: 3,
        topic: `作成者: ${message.author.tag}`
			})
			.then(a => {
				message.reply(`<#${a.id}> スレッドを立てました。`);
				a.setTopic(`作成者:${s.name}|${encode(message.author.id)}`);
				a.setRateLimitPerUser(3);
			})
  }
})

client.login(process.env.DISCORD_TOKEN)
