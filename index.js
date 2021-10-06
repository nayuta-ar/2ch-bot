require('http')
  .createServer(function (req, res) {
    res.write('It works!')
    res.end()
  })
  .listen(process.env.PORT || 8080)

require('dotenv').config()
require('./helpers/extends')

const { Client, Collection } = require('discord.js')
const client = new Client({
  intents: [
    'GUILDS',
    'GUILD_MEMBERS',
    'GUILD_EMOJIS_AND_STICKERS',
    'GUILD_INTEGRATIONS',
    'GUILD_PRESENCES',
    'GUILD_MESSAGES',
  ],
})
const { createConnection } = require('mysql')
const fs = require('fs')

client.db = createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
  charset: 'utf8mb4',
})

client.db.connect()

client.commands = new Collection()
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'))

for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  client.commands.set(command.data.name, command)
}

const eventFiles = fs
  .readdirSync('./events')
  .filter((file) => file.endsWith('.js'))

for (const file of eventFiles) {
  const event = require(`./events/${file}`)
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args))
  } else {
    client.on(event.name, (...args) => event.execute(...args))
  }
}

client.login(process.env.DISCORD_TOKEN)
