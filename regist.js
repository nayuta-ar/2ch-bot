require('dotenv').config()

const fs = require('fs')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const clientId = '895231482828840980'

const commands = []
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'))

for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  commands.push(command.data.toJSON())
}

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN)

;(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(clientId, '882520205706792981'),
      {
        body: commands,
      },
    )

    console.log('コマンドを登録しました。')
  } catch (error) {
    console.error(error)
  }
})()
