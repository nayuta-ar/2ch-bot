const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('発言数ランキングを表示します。'),
  async execute(interaction) {
    interaction.client.db.query(
      'SELECT * FROM `users` ORDER BY `messageCount` DESC LIMIT 10',
      async (e, rows) => {
        await interaction.editReply({
          embeds: [
            new MessageEmbed()
              .setTitle('🏅 発言数ランキング')
              .setDescription(
                rows
                  .map(
                    (rd, i) =>
                      `**\`${i + 1}.\`** \`${rd.messageCount}\` ${
                        rd.nickName
                      }(${rd.tag})`,
                  )
                  .join('\n'),
              )
              .setColor('BLURPLE'),
          ],
        })
      },
    )
  },
}
