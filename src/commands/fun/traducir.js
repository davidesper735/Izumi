const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const LIBRETRANSLATE_URL = 'https://libretranslate.de';

const idiomas = {
  'es': 'Español',
  'en': 'Ingles',
  'fr': 'Frances',
  'de': 'Aleman',
  'it': 'Italiano',
  'pt': 'Portugues',
  'ru': 'Ruso',
  'ja': 'Japones',
  'zh': 'Chino',
  'ko': 'Coreano',
  'ar': 'Arabe',
  'nl': 'Holandes',
  'pl': 'Polaco',
  'tr': 'Turco',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('traducir')
    .setDescription('Traduce texto a cualquier idioma')
    .addStringOption(opt =>
      opt.setName('texto').setDescription('Texto a traducir').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('destino')
        .setDescription('Idioma destino')
        .setRequired(true)
        .addChoices(
          { name: 'Español', value: 'es' },
          { name: 'Ingles', value: 'en' },
          { name: 'Frances', value: 'fr' },
          { name: 'Aleman', value: 'de' },
          { name: 'Italiano', value: 'it' },
          { name: 'Portugues', value: 'pt' },
          { name: 'Ruso', value: 'ru' },
          { name: 'Japones', value: 'ja' },
          { name: 'Chino', value: 'zh' },
          { name: 'Coreano', value: 'ko' },
          { name: 'Arabe', value: 'ar' },
          { name: 'Holandes', value: 'nl' },
          { name: 'Polaco', value: 'pl' },
          { name: 'Turco', value: 'tr' },
        )
    )
    .addStringOption(opt =>
      opt.setName('origen')
        .setDescription('Idioma origen (por defecto: auto)')
        .addChoices(
          { name: 'Auto detectar', value: 'auto' },
          { name: 'Español', value: 'es' },
          { name: 'Ingles', value: 'en' },
          { name: 'Frances', value: 'fr' },
          { name: 'Aleman', value: 'de' },
          { name: 'Italiano', value: 'it' },
          { name: 'Portugues', value: 'pt' },
          { name: 'Ruso', value: 'ru' },
          { name: 'Japones', value: 'ja' },
          { name: 'Chino', value: 'zh' },
          { name: 'Coreano', value: 'ko' },
          { name: 'Arabe', value: 'ar' },
          { name: 'Holandes', value: 'nl' },
          { name: 'Polaco', value: 'pl' },
          { name: 'Turco', value: 'tr' },
        )
    ),

  async execute(interaction) {
    const context = {
      guild: interaction.guild,
      channel: interaction.channel,
      user: interaction.user,
      member: interaction.member,
      args: [
        interaction.options.getString('texto'),
        interaction.options.getString('destino'),
        interaction.options.getString('origen') || 'auto'
      ],
      isSlash: true,
      reply: (content) => interaction.reply(content)
    };
    await this.run(context);
  },

  async run(context) {
    const [texto, destino, origen] = context.isSlash
      ? context.args
      : [context.args.slice(2).join(' '), context.args[0], context.args[1] || 'auto'];

    if (!texto || !destino) {
      return context.reply({ content: 'Uso con prefix: `#traducir <destino> [origen] <texto>`', flags: 64 });
    }

    await context.channel.sendTyping?.();

    try {
      const { data } = await axios.post(`${LIBRETRANSLATE_URL}/translate`, {
        q: texto,
        source: origen,
        target: destino,
        format: 'text'
      });

      const origenNombre = origen === 'auto' ? 'Auto' : (idiomas[origen] || origen);
      const destinoNombre = idiomas[destino] || destino;

      const embed = new EmbedBuilder()
        .setTitle('Traduccion')
        .setColor(0x5865F2)
        .addFields(
          { name: `Original (${origenNombre})`, value: texto.slice(0, 1024) },
          { name: `Traduccion (${destinoNombre})`, value: data.translatedText.slice(0, 1024) },
        )
        .setFooter({ text: `Pedido por ${context.user.username}` })
        .setTimestamp();

      context.reply({ embeds: [embed] });
    } catch (err) {
      context.reply({ content: 'No se pudo traducir el texto. Intenta de nuevo mas tarde.', flags: 64 });
    }
  }
};