const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const axios = require('axios');
const { pool } = require('../../database/database');

async function increment(userId, targetId, action) {
  const existing = await pool.query(
    'SELECT id FROM interactions WHERE user_id = $1 AND target_id = $2 AND action = $3',
    [userId, targetId, action]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      'UPDATE interactions SET count = count + 1 WHERE user_id = $1 AND target_id = $2 AND action = $3',
      [userId, targetId, action]
    );
  } else {
    await pool.query(
      'INSERT INTO interactions (user_id, target_id, action, count) VALUES ($1, $2, $3, 1)',
      [userId, targetId, action]
    );
  }

  const result = await pool.query(
    'SELECT count FROM interactions WHERE user_id = $1 AND target_id = $2 AND action = $3',
    [userId, targetId, action]
  );

  return result.rows[0].count;
}

const acciones = {
  hug:   { descripcion: 'Abraza a alguien',    target: true,  msg: (a, b) => `**${a}** abraza a **${b}**`,            counter: (b, n) => `${b} ha recibido ${n} abrazo${n !== 1 ? 's' : ''}.`,      boton: 'Abrazar de vuelta'   },
  kiss:  { descripcion: 'Besa a alguien',       target: true,  msg: (a, b) => `**${a}** le da un beso a **${b}**`,     counter: (b, n) => `${b} ha recibido ${n} beso${n !== 1 ? 's' : ''}.`,        boton: 'Besar de vuelta'     },
  pat:   { descripcion: 'Acaricia a alguien',   target: true,  msg: (a, b) => `**${a}** le da palmaditas a **${b}**`,  counter: (b, n) => `${b} ha recibido ${n} caricia${n !== 1 ? 's' : ''}.`,     boton: 'Acariciar de vuelta' },
  slap:  { descripcion: 'Abofetea a alguien',   target: true,  msg: (a, b) => `**${a}** abofetea a **${b}**`,          counter: (b, n) => `${b} ha recibido ${n} bofetada${n !== 1 ? 's' : ''}.`,    boton: 'Abofetear de vuelta' },
  poke:  { descripcion: 'Pincha a alguien',     target: true,  msg: (a, b) => `**${a}** pincha a **${b}**`,            counter: (b, n) => `${b} ha recibido ${n} pinch${n !== 1 ? 'azos' : 'azo'}.`, boton: 'Pinchar de vuelta'   },
  bite:  { descripcion: 'Muerde a alguien',     target: true,  msg: (a, b) => `**${a}** muerde a **${b}**`,            counter: (b, n) => `${b} ha recibido ${n} mordid${n !== 1 ? 'as' : 'a'}.`,    boton: 'Morder de vuelta'    },
  wave:  { descripcion: 'Saluda a alguien',     target: true,  msg: (a, b) => `**${a}** saluda a **${b}**`,            counter: (b, n) => `${b} ha recibido ${n} saludo${n !== 1 ? 's' : ''}.`,      boton: 'Saludar de vuelta'   },
  cry:   { descripcion: 'Llora',                target: false, msg: (a)    => `**${a}** está llorando...`,             counter: (b, n) => `${b} ha llorado ${n} ve${n !== 1 ? 'ces' : 'z'}.`,        boton: null                  },
  blush: { descripcion: 'Te sonrojas',          target: false, msg: (a)    => `**${a}** se sonroja`,                   counter: (b, n) => `${b} se ha sonrojado ${n} ve${n !== 1 ? 'ces' : 'z'}.`,   boton: null                  },
  dance: { descripcion: 'Baila',                target: false, msg: (a)    => `**${a}** está bailando`,                counter: (b, n) => `${b} ha bailado ${n} ve${n !== 1 ? 'ces' : 'z'}.`,        boton: null                  },
};

const builder = new SlashCommandBuilder()
  .setName('interact')
  .setDescription('Interacciones con GIFs de anime');

for (const [nombre, config] of Object.entries(acciones)) {
  builder.addSubcommand(sub => {
    sub.setName(nombre).setDescription(config.descripcion);
    if (config.target) {
      sub.addUserOption(opt =>
        opt.setName('usuario').setDescription('Usuario objetivo').setRequired(true)
      );
    }
    return sub;
  });
}

async function sendInteraction(context, sub, autor, target) {
  const config = acciones[sub];
  const isSlash = context.isSlash;

  if (target && target.id === autor.id) {
    return context.reply({ content: 'No puedes hacerte eso a ti mismo.' });
  }

  if (isSlash) {
    await context.interaction.deferReply();
  } else {
    await context.channel.sendTyping();
  }

  try {
    const { data: apiData } = await axios.get(`https://nekos.best/api/v2/${sub}`);
    const result = apiData.results[0];
    const gifURL = result.url;
    const animeName = result.anime_name || null;

    const countTarget = target || autor;
    const count = await increment(autor.id, countTarget.id, sub);

    const descripcion = config.target
      ? config.msg(autor.username, target.username)
      : config.msg(autor.username);

    const counterText = config.counter(countTarget.username, count);

    const embed = new EmbedBuilder()
      .setDescription(descripcion)
      .setImage(gifURL)
      .setColor(0xFF6B9D);

    const footerParts = [counterText];
    if (animeName) footerParts.push(`Anime: ${animeName}`);
    embed.setFooter({ text: footerParts.join('\n') });

    const components = [];
    if (config.boton && target && isSlash) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`interact_${sub}_${autor.id}_${target.id}`)
          .setLabel(config.boton)
          .setStyle(ButtonStyle.Secondary)
      );
      components.push(row);
    }

    if (isSlash) {
      await context.interaction.editReply({ embeds: [embed], components });
    } else {
      await context.reply({ embeds: [embed] });
    }
  } catch (err) {
    console.error(err);
    const msg = 'No pude obtener el GIF, intenta de nuevo.';
    if (isSlash) {
      await context.interaction.editReply({ content: msg });
    } else {
      await context.reply(msg);
    }
  }
}

module.exports = {
  data: builder,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const config = acciones[sub];
    const autor = interaction.user;
    const target = config.target ? interaction.options.getUser('usuario') : null;

    const context = {
      isSlash: true,
      interaction,
      guild: interaction.guild,
      channel: interaction.channel,
      user: interaction.user,
      reply: (content) => interaction.reply(content)
    };

    await sendInteraction(context, sub, autor, target);
  },

  async runAccion(context) {
    const sub = context.accion;
    const config = acciones[sub];
    if (!config) return;

    const autor = context.user;
    const target = config.target ? context.resolveUser(0) : null;

    if (config.target && !target) {
      return context.reply({ content: `Menciona a un usuario. Uso: \`${context.prefix || '#'}${sub} @usuario\`` });
    }

    await sendInteraction(context, sub, autor, target);
  },

  async handleButton(interaction) {
    const parts = interaction.customId.split('_');
    const sub = parts[1];
    const originalAutorId = parts[2];
    const originalTargetId = parts[3];

    if (interaction.user.id !== originalTargetId) {
      return interaction.reply({ content: 'Solo el usuario mencionado puede responder.', flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply();

    const nuevoAutor = interaction.user;
    const nuevoTarget = await interaction.client.users.fetch(originalAutorId);
    const config = acciones[sub];

    try {
      const { data: apiData } = await axios.get(`https://nekos.best/api/v2/${sub}`);
      const result = apiData.results[0];
      const gifURL = result.url;
      const animeName = result.anime_name || null;

      const count = await increment(nuevoAutor.id, nuevoTarget.id, sub);
      const descripcion = config.msg(nuevoAutor.username, nuevoTarget.username);
      const counterText = config.counter(nuevoTarget.username, count);

      const embed = new EmbedBuilder()
        .setDescription(descripcion)
        .setImage(gifURL)
        .setColor(0xFF6B9D);

      const footerParts = [counterText];
      if (animeName) footerParts.push(`Anime: ${animeName}`);
      embed.setFooter({ text: footerParts.join('\n') });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`interact_${sub}_${nuevoAutor.id}_${nuevoTarget.id}`)
          .setLabel(config.boton)
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: 'No pude obtener el GIF, intenta de nuevo.' });
    }
  }
};