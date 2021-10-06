const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('message-count')
    .setDescription('自分の総メッセージ数を表示します。'),
  async execute(interaction) {
    interaction.client.db.query(
      'SELECT * FROM `users` WHERE `userId` = ?',
      [interaction.user.id],
      async (e, rows) => {
        let count = 0
        if (rows[0]) count = rows[0].messageCount

        await interaction.editReply({
          embeds: [
            new MessageEmbed()
              .setTitle('💬 総メッセージ数')
              .setDescription(
                `あなたは、これまで **${count}メッセージ** 送信しています。`,
              )
              .setColor('BLURPLE'),
          ],
        })
      },
    )
  },
}
