const { MessageFlags } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // Comandos slash
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        const msg = { content: '❌ Hubo un error ejecutando este comando.', flags: MessageFlags.Ephemeral };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg);
        } else {
          await interaction.reply(msg);
        }
      }
    }

    // Autocompletado
    if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command?.autocomplete) return;

      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error('[AUTOCOMPLETE ERROR]', error);
      }
    }

    // Botones
    if (interaction.isButton()) {
      const commandName = interaction.customId.split('_')[0];
      const command = interaction.client.commands.get(commandName);
      if (!command?.handleButton) return;

      try {
        await command.handleButton(interaction);
      } catch (error) {
        console.error(error);
        const msg = { content: '❌ Hubo un error con este botón.', flags: MessageFlags.Ephemeral };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg);
        } else {
          await interaction.reply(msg);
        }
      }
    }

    // Select menus
    if (interaction.isStringSelectMenu()) {
      const commandName = interaction.customId.split('_')[0];
      const command = interaction.client.commands.get(commandName);
      if (!command?.handleSelectMenu) return;

      try {
        await command.handleSelectMenu(interaction);
      } catch (error) {
        console.error(error);
        const msg = { content: '❌ Hubo un error con el menú.', flags: MessageFlags.Ephemeral };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg);
        } else {
          await interaction.reply(msg);
        }
      }
    }
  }
};