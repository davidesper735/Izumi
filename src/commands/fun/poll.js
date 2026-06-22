const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const polls = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Crea una encuesta con botones')
    .addStringOption(opt =>
      opt.setName('pregunta').setDescription('¿Qué quieres preguntar?').setRequired(true)
    ),

  async execute(interaction) {
    const pregunta = interaction.options.getString('pregunta');
    const pollId = `poll_${Date.now()}`;
    polls.set(pollId, { si: new Set(), no: new Set() });

    const embed = new EmbedBuilder()
      .setTitle('📊 Encuesta')
      .setDescription(`**${pregunta}**`)
      .setColor(0xFEE75C)
      .addFields(
        { name: '✅ Sí', value: '0 votos', inline: true },
        { name: '❌ No', value: '0 votos', inline: true }
      )
      .setFooter({ text: `Creada por ${interaction.user.username}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`poll_si_${pollId}`).setLabel('✅ Sí').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`poll_no_${pollId}`).setLabel('❌ No').setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },

  async handleButton(interaction) {
    const parts = interaction.customId.split('_');
    const voto = parts[1];
    const pollId = parts.slice(2).join('_');
    const poll = polls.get(pollId);
    if (!poll) return interaction.reply({ content: 'Encuesta no encontrada.', ephemeral: true });

    const userId = interaction.user.id;
    poll.si.delete(userId);
    poll.no.delete(userId);
    poll[voto].add(userId);

    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .spliceFields(0, 2,
        { name: '✅ Sí', value: `${poll.si.size} votos`, inline: true },
        { name: '❌ No', value: `${poll.no.size} votos`, inline: true }
      );

    await interaction.update({ embeds: [embed] });
  }
};