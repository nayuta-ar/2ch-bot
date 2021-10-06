const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('default-name')
    .setDescription('スレッドのデフォルトニックネームを設定します。')
    .addStringOption((option) =>
      option
        .setName('new-name')
        .setDescription(
          '新しく設定するスレッドのデフォルトのニックネームを指定できます。',
        ),
    ),
  async execute(interaction) {
    const newNick = interaction.options.getString('new-nick') || '名無しさん'

    interaction.client.db.query(
      'SELECT * FROM `threads` WHERE `threadId` = ?',
      [interaction.channelId],
      async (e, rows) => {
        if (!rows[0] || rows[0].ownerId !== interaction.user.id) {
          await interaction.error('このコマンドはスレ主のみ実行できます。')
        } else {
          if (newNick.length > 50) {
            return interaction.error('50文字まで入力できます。')
          }

          interaction.client.db.query(
            'UPDATE `threads` SET `defaultName` = ? WHERE `threadId` = ?',
            [newNick, interaction.channelId],
          )
          await interaction.success(
            `スレッドのデフォルトのニックネームを ${newNick} に変更しました。`,
          )
        }
      },
    )
  },
}
