module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isCommand()) {
      await interaction.deferReply({ ephemeral: true })

      const command = interaction.client.commands.get(interaction.commandName)
      if (!command) return

      try {
        await command.execute(interaction)
      } catch (error) {
        console.error(error)
        return interaction.error('何らかのエラーが発生しました。').catch(() =>
          interaction.error('何らかのエラーが発生しました。', {
            noEdit: true,
          }),
        )
      }
    }
  },
}
