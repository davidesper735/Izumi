const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const respuestas = [
  { texto: 'Absolutamente sí 🔮', color: 0x57F287 },
  { texto: 'Todo apunta a que sí ✨', color: 0x57F287 },
  { texto: 'Sin duda alguna 💫', color: 0x57F287 },
  { texto: 'Pregunta de nuevo más tarde 🌀', color: 0xFEE75C },
  { texto: 'Difícil de decir ahora 🤔', color: 0xFEE75C },
  { texto: 'No cuentes con ello ❌', color: 0xED4245 },
  { texto: 'La respuesta es no 🚫', color: 0xED4245 },
  { texto: 'Muy dudoso 😬', color: 0xED4245 },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Consulta a la bola mágica 🎱')
    .addStringOption(opt =>
      opt.setName('pregunta').setDescription('Tu pregunta').setRequired(true)
    ),

  async execute(interaction) {
    const pregunta = interaction.options.getString('pregunta');
    const resp = respuestas[Math.floor(Math.random() * respuestas.length)];

    const embed = new EmbedBuilder()
      .setTitle('🎱 La Bola Mágica habla...')
      .addFields(
        { name: '❓ Pregunta', value: pregunta },
        { name: '🔮 Respuesta', value: resp.texto }
      )
      .setColor(resp.color)
      .setFooter({ text: `Preguntado por ${interaction.user.username}` });

    await interaction.reply({ embeds: [embed] });
  }
};