const { DisTube } = require('distube');
const { EmbedBuilder } = require('discord.js');
const { YtDlpPlugin } = require('@distube/yt-dlp');

console.log('YtDlpPlugin cargado:', !!YtDlpPlugin);


function setupDistube(client) {
  const distube = new DisTube(client, {
    plugins: [new YtDlpPlugin({ update: false })]
  });



  distube.on('playSong', (queue, song) => {
    const embed = new EmbedBuilder()
      .setTitle('Reproduciendo')
      .setDescription(`**[${song.name}](${song.url})**`)
      .setThumbnail(song.thumbnail)
      .setColor(0x5865F2)
      .addFields(
        { name: 'Duracion', value: song.formattedDuration, inline: true },
        { name: 'Solicitado por', value: song.user.username, inline: true }
      );
    queue.textChannel?.send({ embeds: [embed] });
  });

  distube.on('addSong', (queue, song) => {
    const embed = new EmbedBuilder()
      .setTitle('Agregado a la cola')
      .setDescription(`**[${song.name}](${song.url})**`)
      .setColor(0x57F287)
      .addFields(
        { name: 'Duracion', value: song.formattedDuration, inline: true },
        { name: 'Posicion en cola', value: `${queue.songs.length}`, inline: true }
      );
    queue.textChannel?.send({ embeds: [embed] });
  });

  distube.on('finish', queue => {
    queue.textChannel?.send('La cola ha terminado.');
  });

  distube.on('error', (error, queue) => {
    console.error('DisTube error:', error);
    queue?.textChannel?.send('Ocurrio un error con la musica.');
  });

  distube.on('disconnect', queue => {
    queue.textChannel?.send('Desconectado del canal de voz.');
  });

    distube.on('debug', (msg) => {
  console.log('[DISTUBE]', msg);
});

distube.on('error', (error) => {
  console.error('[DISTUBE ERROR]', error);
});

  client.distube = distube;
}

module.exports = { setupDistube };