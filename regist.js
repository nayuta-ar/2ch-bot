const apiEndpoint =
  'https://discord.com/api/v8/applications/868482542255349801/guilds/868392026813644870/commands'
const botToken = process.env.DISCORD_TOKEN
const commandData = {
  name: 'status',
  description: 'システムステータスを表示します。',
  //default_permission: true,
  options: [],
}

async function main() {
  const fetch = require('node-fetch')

  const response = await fetch(apiEndpoint, {
    method: 'post',
    body: JSON.stringify(commandData),
    headers: {
      Authorization: 'Bot ' + botToken,
      'Content-Type': 'application/json',
    },
  })
  const json = await response.json()

  console.log(json)
}
main()
