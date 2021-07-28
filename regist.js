const apiEndpoint =
  'https://discord.com/api/v8/applications/868482542255349801/guilds/868392026813644870/commands/869867966043398205'
const botToken = process.env.DISCORD_TOKEN
const commandData = {
  name: 'tag_search',
  description: '【運営用】ユーザーを照会します。',
  default_permission: false,
  options: [
    {
      name: 'tag',
      description: '照会するタグを入力',
      type: 3,
      required: true,
    },
  ],
}

async function main() {
  const fetch = require('node-fetch')

  const response = await fetch(apiEndpoint, {
    method: 'delete',
    //body: JSON.stringify(commandData),
    headers: {
      Authorization: 'Bot ' + botToken,
      'Content-Type': 'application/json',
    },
  })
  const json = await response.json()

  console.log(json)
}
main()
