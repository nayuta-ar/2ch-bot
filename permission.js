const apiEndpoint =
  'https://discord.com/api/v8/applications/868482542255349801/guilds/868392026813644870/commands/869876214289031188/permissions'
const botToken = process.env.DISCORD_TOKEN
const commandData = {
  permissions: [
    {
      id: '868499397552513034',
      type: 1,
      permission: true,
    },
  ],
}

async function main() {
  const fetch = require('node-fetch')

  const response = await fetch(apiEndpoint, {
    method: 'put',
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
