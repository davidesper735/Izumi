const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('music')
    .setDescription('Comandos de musica')
    .addSubcommand(sub =>
      sub.setName('play')
        .setDescription('Reproduce una cancion o busca en YouTube')
        .addStringOption(opt =>
          opt.setName('cancion').setDescription('URL o nombre de la cancion').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('skip')
        .setDescription('Salta la cancion actual')
    )
    .addSubcommand(sub =>
      sub.setName('stop')
        .setDescription('Detiene la musica y limpia la cola')
    )
    .addSubcommand(sub =>
      sub.setName('pause')
        .setDescription('Pausa la musica')
    )
    .addSubcommand(sub =>
      sub.setName('resume')
        .setDescription('Reanuda la musica')
    )
    .addSubcommand(sub =>
      sub.setName('queue')
        .setDescription('Muestra la cola de canciones')
    )
    .addSubcommand(sub =>
      sub.setName('volume')
        .setDescription('Cambia el volumen')
        .addIntegerOption(opt =>
          opt.setName('nivel').setDescription('Volumen del 1 al 100').setRequired(true).setMinValue(1).setMaxValue(100)
        )
    )
    .addSubcommand(sub =>
      sub.setName('loop')
        .setDescription('Cambia el modo de repeticion')
        .addStringOption(opt =>
          opt.setName('modo')
            .setDescription('Modo de repeticion')
            .setRequired(true)
            .addChoices(
              { name: 'Desactivado', value: '0' },
              { name: 'Cancion actual', value: '1' },
              { name: 'Cola completa', value: '2' },
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('nowplaying')
        .setDescription('Muestra la cancion actual')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const distube = interaction.client.distube;
    const voiceChannel = interaction.member.voice.channel;
    const queue = distube.getQueue(interaction.guild);

    // Comandos que requieren estar en un canal de voz
    const requireVoice = ['play', 'skip', 'stop', 'pause', 'resume', 'volume', 'loop'];
    if (requireVoice.includes(sub) && !voiceChannel) {
      return interaction.reply({ content: 'Debes estar en un canal de voz.', flags: MessageFlags.Ephemeral });
    }

    // Comandos que requieren musica activa
    const requireQueue = ['skip', 'stop', 'pause', 'resume', 'queue', 'volume', 'loop', 'nowplaying'];
    if (requireQueue.includes(sub) && !queue) {
      return interaction.reply({ content: 'No hay musica reproduciendose.', flags: MessageFlags.Ephemeral });
    }

    if (sub === 'play') {
      const cancion = interaction.options.getString('cancion');
      await interaction.deferReply();
      try {
        await distube.play(voiceChannel, cancion, {
          member: interaction.member,
          textChannel: interaction.channel,
        });
        await interaction.editReply({ content: 'Buscando cancion...' });
      } catch (err) {
        console.error(err);
        await interaction.editReply({ content: 'No pude reproducir esa cancion.' });
      }
    }

    if (sub === 'skip') {
      await queue.skip();
      await interaction.reply({ content: 'Cancion saltada.' });
    }

    if (sub === 'stop') {
      await queue.stop();
      await interaction.reply({ content: 'Musica detenida y cola limpiada.' });
    }

    if (sub === 'pause') {
      queue.pause();
      await interaction.reply({ content: 'Musica pausada.' });
    }

    if (sub === 'resume') {
      queue.resume();
      await interaction.reply({ content: 'Musica reanudada.' });
    }

    if (sub === 'volume') {
      const nivel = interaction.options.getInteger('nivel');
      queue.setVolume(nivel);
      await interaction.reply({ content: `Volumen establecido en ${nivel}%.` });
    }

    if (sub === 'loop') {
      const modo = parseInt(interaction.options.getString('modo'));
      queue.setRepeatMode(modo);
      const modos = ['Desactivado', 'Cancion actual', 'Cola completa'];
      await interaction.reply({ content: `Modo de repeticion: **${modos[modo]}**` });
    }

    if (sub === 'nowplaying') {
      const song = queue.songs[0];
      const embed = new EmbedBuilder()
        .setTitle('Reproduciendo ahora')
        .setDescription(`**[${song.name}](${song.url})**`)
        .setThumbnail(song.thumbnail)
        .setColor(0x5865F2)
        .addFields(
          { name: 'Duracion', value: song.formattedDuration, inline: true },
          { name: 'Solicitado por', value: song.user.username, inline: true },
          { name: 'Canciones en cola', value: `${queue.songs.length}`, inline: true }
        );
      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'queue') {
      const songs = queue.songs;
      if (songs.length === 0) {
        return interaction.reply({ content: 'La cola esta vacia.', flags: MessageFlags.Ephemeral });
      }

      const lista = songs
        .slice(0, 10)
        .map((s, i) => `${i === 0 ? 'Reproduciendo' : `${i}.`} **${s.name}** (${s.formattedDuration})`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle('Cola de musica')
        .setDescription(lista)
        .setColor(0x5865F2)
        .setFooter({ text: `${songs.length} cancion${songs.length !== 1 ? 'es' : ''} en total` });

      await interaction.reply({ embeds: [embed] });
    }
  }
};