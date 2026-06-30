const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const respuestas8ball = [
  { texto: 'Absolutamente si', color: 0x57F287 },
  { texto: 'Todo apunta a que si', color: 0x57F287 },
  { texto: 'Sin duda alguna', color: 0x57F287 },
  { texto: 'Muy probable', color: 0x57F287 },
  { texto: 'Las señales dicen que si', color: 0x57F287 },
  { texto: 'Pregunta de nuevo mas tarde', color: 0xFEE75C },
  { texto: 'Dificil de decir ahora', color: 0xFEE75C },
  { texto: 'No puedo predecirlo aun', color: 0xFEE75C },
  { texto: 'No cuentes con ello', color: 0xED4245 },
  { texto: 'La respuesta es no', color: 0xED4245 },
  { texto: 'Muy dudoso', color: 0xED4245 },
  { texto: 'Mis fuentes dicen que no', color: 0xED4245 },
];

module.exports = {
  category: 'Diversión',
  data: new SlashCommandBuilder()
    .setName('fun')
    .setDescription('Comandos de entretenimiento')
    .addSubcommand(sub =>
      sub.setName('dado')
        .setDescription('Lanza un dado')
        .addIntegerOption(opt =>
          opt.setName('caras').setDescription('Numero de caras del dado (por defecto 6)').setMinValue(2).setMaxValue(100)
        )
    )
    .addSubcommand(sub =>
      sub.setName('moneda')
        .setDescription('Lanza una moneda')
    )
    .addSubcommand(sub =>
      sub.setName('8ball')
        .setDescription('Consulta a la bola magica')
        .addStringOption(opt =>
          opt.setName('pregunta').setDescription('Tu pregunta').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('sorteo')
        .setDescription('Elige un ganador aleatorio de una lista')
        .addStringOption(opt =>
          opt.setName('participantes').setDescription('Lista de participantes separados por coma').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('coinflip')
        .setDescription('Apuesta cara o cruz con alguien')
        .addUserOption(opt =>
          opt.setName('usuario').setDescription('Usuario con quien apostar').setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'dado') {
      const caras = interaction.options.getInteger('caras') || 6;
      const resultado = Math.floor(Math.random() * caras) + 1;

      const embed = new EmbedBuilder()
        .setTitle('Dado')
        .setDescription(`${interaction.user.username} lanzo un dado de ${caras} caras y obtuvo **${resultado}**`)
        .setColor(0x5865F2)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'moneda') {
      const resultado = Math.random() < 0.5 ? 'Cara' : 'Cruz';

      const embed = new EmbedBuilder()
        .setTitle('Moneda')
        .setDescription(`${interaction.user.username} lanzo una moneda y obtuvo **${resultado}**`)
        .setColor(0x5865F2)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === '8ball') {
      const pregunta = interaction.options.getString('pregunta');
      const resp = respuestas8ball[Math.floor(Math.random() * respuestas8ball.length)];

      const embed = new EmbedBuilder()
        .setTitle('La Bola Magica habla...')
        .setColor(resp.color)
        .addFields(
          { name: 'Pregunta', value: pregunta },
          { name: 'Respuesta', value: resp.texto },
        )
        .setFooter({ text: `Preguntado por ${interaction.user.username}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'sorteo') {
      const lista = interaction.options.getString('participantes')
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      if (lista.length < 2) {
        return interaction.reply({ content: 'Necesitas al menos 2 participantes separados por coma.', flags: 64 });
      }

      const ganador = lista[Math.floor(Math.random() * lista.length)];

      const embed = new EmbedBuilder()
        .setTitle('Sorteo')
        .setColor(0x5865F2)
        .addFields(
          { name: 'Participantes', value: lista.join(', ') },
          { name: 'Ganador', value: `**${ganador}**` },
        )
        .setFooter({ text: `Sorteado por ${interaction.user.username}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'coinflip') {
      const rival = interaction.options.getUser('usuario');

      if (rival.id === interaction.user.id) {
        return interaction.reply({ content: 'No puedes apostar contigo mismo.', flags: 64 });
      }

      if (rival.bot) {
        return interaction.reply({ content: 'No puedes apostar contra un bot.', flags: 64 });
      }

      const resultado = Math.random() < 0.5;
      const ganador = resultado ? interaction.user : rival;
      const perdedor = resultado ? rival : interaction.user;

      const embed = new EmbedBuilder()
        .setTitle('Coinflip')
        .setColor(resultado ? 0x57F287 : 0xED4245)
        .setDescription(`**${ganador.username}** gano contra **${perdedor.username}**`)
        .setFooter({ text: `Apostado por ${interaction.user.username}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
};