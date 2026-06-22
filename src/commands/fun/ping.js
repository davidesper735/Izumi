const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Muestra la latencia del bot'),
  async execute(interaction) {
    const sent = await interaction.reply({ content: '🏓 Calculando...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`🏓 Pong! Latencia: **${latency}ms** | API: **${interaction.client.ws.ping}ms**`);
  }
};