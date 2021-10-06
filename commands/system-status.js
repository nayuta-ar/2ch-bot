const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed, version: djsversion } = require('discord.js')
const { mem, cpu, os } = require('node-os-utils')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('system-status')
    .setDescription('当システムのステータスを表示します。'),
  async execute(interaction) {
    let rss = process.memoryUsage().rss
    if (rss instanceof Array) {
      rss = rss.reduce((sum, val) => sum + val, 0)
    }
    let heapUsed = process.memoryUsage().heapUsed
    if (heapUsed instanceof Array) {
      heapUsed = heapUsed.reduce((sum, val) => sum + val, 0)
    }
    const { totalMemMb } = await mem.info()

    interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setTitle('📊 システムステータス')
          .setDescription(
            `\`\`\`\nPing: ${Math.round(
              interaction.client.ws.ping,
            )}ms\nNode.js: v${
              process.versions.node
            }\ndiscord.js: v${djsversion}\nOS: ${await os.oos()}\nCPU: ${cpu.model()}\n├ コア数: ${cpu.count()}\n└ 使用率: ${await cpu.usage()}%\nメモリ: ${totalMemMb}MB\n└ 使用量: ${(
              heapUsed /
              1024 /
              1024
            ).toFixed(2)}MB\n\`\`\``,
          )
          .setColor('BLURPLE'),
      ],
    })
  },
}
