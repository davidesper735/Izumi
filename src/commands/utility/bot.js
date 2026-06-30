const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
  category: 'Diversión',
  data: new SlashCommandBuilder()
    .setName('bot')
    .setDescription('Información del bot')
    .addSubcommand(sub =>
      sub.setName('info')
        .setDescription('Muestra información general del bot')
    )
    .addSubcommand(sub =>
      sub.setName('ping')
        .setDescription('Muestra la latencia del bot')
    )
    .addSubcommand(sub =>
      sub.setName('uptime')
        .setDescription('Muestra cuánto tiempo lleva el bot en línea')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const client = interaction.client;

    if (sub === 'ping') {
      await interaction.deferReply();
      const reply = await interaction.fetchReply();
      const botLatency = reply.createdTimestamp - interaction.createdTimestamp;
      const apiLatency = Math.round(client.ws.ping);

      const color = botLatency < 200 ? 0x57F287 : botLatency < 500 ? 0xFEE75C : 0xED4245;

      const embed = new EmbedBuilder()
        .setTitle('🏓 Pong!')
        .setColor(color)
        .addFields(
          { name: '📡 Latencia del bot', value: `${botLatency}ms`, inline: true },
          { name: '💙 Latencia de la API', value: `${apiLatency}ms`, inline: true },
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'uptime') {
      const uptimeSeconds = Math.floor(client.uptime / 1000);
      const dias = Math.floor(uptimeSeconds / 86400);
      const horas = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutos = Math.floor((uptimeSeconds % 3600) / 60);
      const segundos = uptimeSeconds % 60;

      const embed = new EmbedBuilder()
        .setTitle('⏱️ Uptime')
        .setColor(0x5865F2)
        .setDescription(`El bot lleva en línea:\n\`${dias}d ${horas}h ${minutos}m ${segundos}s\``)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'info') {
      const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const nodeVersion = process.version;
      const djsVersion = require('discord.js').version;
      const uptimeSeconds = Math.floor(client.uptime / 1000);
      const dias = Math.floor(uptimeSeconds / 86400);
      const horas = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutos = Math.floor((uptimeSeconds % 3600) / 60);
      const segundos = uptimeSeconds % 60;

      const embed = new EmbedBuilder()
        .setTitle(`🤖 ${client.user.username}`)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setColor(0x5865F2)
        .addFields(
          { name: '⏱️ Uptime', value: `${dias}d ${horas}h ${minutos}m ${segundos}s`, inline: true },
          { name: '🏓 Ping', value: `${Math.round(client.ws.ping)}ms`, inline: true },
          { name: '📊 Servidores', value: `${client.guilds.cache.size}`, inline: true },
          { name: '👥 Usuarios', value: `${client.users.cache.size}`, inline: true },
          { name: '🧠 Memoria', value: `${memUsage} MB`, inline: true },
          { name: '🖥️ Node.js', value: nodeVersion, inline: true },
          { name: '📦 Discord.js', value: `v${djsVersion}`, inline: true },
          { name: '🖧 Plataforma', value: `${os.type()} ${os.release()}`, inline: true },
        )
        .setFooter({ text: `ID: ${client.user.id}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
};