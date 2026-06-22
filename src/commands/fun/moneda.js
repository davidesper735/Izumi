const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moneda')
    .setDescription('Lanza una moneda al aire'),
  async execute(interaction) {
    const resultado = Math.random() < 0.5 ? '🪙 Cara' : '🪙 Cruz';
    await interaction.reply(`Lanzaste la moneda... ¡**${resultado}**!`);
  }
};