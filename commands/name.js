const { SlashCommandBuilder } = require('@discordjs/builders')
const tagGen = require('../helpers/tagGen')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('name')
    .setDescription('ニックネームを変更します。')
    .addStringOption((option) =>
      option
        .setName('new-name')
        .setDescription('新しく設定するニックネームを指定できます。'),
    ),
  async execute(interaction) {
    const newNick = interaction.options.getString('new-nick') || '名無しさん'

    if (newNick.length > 50) {
      return interaction.error('50文字まで入力できます。')
    }

    interaction.client.db.query(
      'SELECT * FROM `users` WHERE `userId` = ?',
      [interaction.user.id],
      async (e, rows) => {
        if (!rows || !rows[0]) {
          interaction.client.db.query(
            'INSERT INTO `users` (`userId`, `nickName`, `tag`) VALUES (?, ?, ?)',
            [interaction.user.id, newNick, tagGen()],
          )
        } else {
          interaction.client.db.query(
            'UPDATE `users` SET `nickName` = ? WHERE `userId` = ?',
            [newNick, interaction.user.id],
          )
        }
        await interaction.success(`ニックネームを ${newNick} に変更しました。`)
      },
    )
  },
}
