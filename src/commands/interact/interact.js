const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Ruta del archivo de contadores
const dataPath = path.join(__dirname, '..', '..', '..', 'data', 'interact.json');

function loadData() {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, '{}');
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function getCount(data, action, userId) {
  return data?.[action]?.[userId] || 0;
}

function increment(data, action, userId) {
  if (!data[action]) data[action] = {};
  data[action][userId] = (data[action][userId] || 0) + 1;
  saveData(data);
  return data[action][userId];
}

const acciones = {
  hug:   { descripcion: 'Abraza a alguien',   target: true,  msg: (a, b) => `💞 **${a}** abraza a **${b}**`,          counter: (b, n) => `${b} ha recibido ${n} abrazo${n !== 1 ? 's' : ''}.`,     boton: 'Abrazar de vuelta',   emoji: '🤗' },
  kiss:  { descripcion: 'Besa a alguien',      target: true,  msg: (a, b) => `💋 **${a}** le da un beso a **${b}**`,   counter: (b, n) => `${b} ha recibido ${n} beso${n !== 1 ? 's' : ''}.`,       boton: 'Besar de vuelta',     emoji: '😘' },
  pat:   { descripcion: 'Acaricia a alguien',  target: true,  msg: (a, b) => `👋 **${a}** le da palmaditas a **${b}**`, counter: (b, n) => `${b} ha recibido ${n} caricia${n !== 1 ? 's' : ''}.`,    boton: 'Acariciar de vuelta', emoji: '🥰' },
  slap:  { descripcion: 'Abofetea a alguien',  target: true,  msg: (a, b) => `👋 **${a}** abofetea a **${b}**`,        counter: (b, n) => `${b} ha recibido ${n} bofetada${n !== 1 ? 's' : ''}.`,   boton: 'Abofetear de vuelta', emoji: '😤' },
  poke:  { descripcion: 'Pincha a alguien',    target: true,  msg: (a, b) => `👉 **${a}** pincha a **${b}**`,          counter: (b, n) => `${b} ha recibido ${n} pinch${n !== 1 ? 'azos' : 'azo'}.`, boton: 'Pinchar de vuelta',   emoji: '😏' },
  bite:  { descripcion: 'Muerde a alguien',    target: true,  msg: (a, b) => `😬 **${a}** muerde a **${b}**`,          counter: (b, n) => `${b} ha recibido ${n} mordid${n !== 1 ? 'as' : 'a'}.`,   boton: 'Morder de vuelta',    emoji: '😈' },
  wave:  { descripcion: 'Saluda a alguien',    target: true,  msg: (a, b) => `👋 **${a}** saluda a **${b}**`,          counter: (b, n) => `${b} ha recibido ${n} saludo${n !== 1 ? 's' : ''}.`,     boton: 'Saludar de vuelta',   emoji: '😊' },
  cry:   { descripcion: 'Llora',               target: false, msg: (a)    => `😢 **${a}** está llorando...`,           counter: (b, n) => `${b} ha llorado ${n} ve${n !== 1 ? 'ces' : 'z'}.`,       boton: null,                  emoji: '😭' },
  blush: { descripcion: 'Te sonrojas',         target: false, msg: (a)    => `😳 **${a}** se sonroja`,                 counter: (b, n) => `${b} se ha sonrojado ${n} ve${n !== 1 ? 'ces' : 'z'}.`,  boton: null,                  emoji: '🌸' },
  dance: { descripcion: 'Baila',               target: false, msg: (a)    => `💃 **${a}** está bailando`,              counter: (b, n) => `${b} ha bailado ${n} ve${n !== 1 ? 'ces' : 'z'}.`,       boton: null,                  emoji: '🎶' },
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

async function sendInteraction(interaction, sub, autor, target) {
  const config = acciones[sub];
  const data = loadData();

  if (target && target.id === autor.id) {
    return interaction.reply({ content: '❌ No puedes hacerte eso a ti mismo.', ephemeral: true });
  }

  await interaction.deferReply();

  try {
    const { data: apiData } = await axios.get(`https://nekos.best/api/v2/${sub}`);
    const result = apiData.results[0];
    const gifURL = result.url;
    const animeName = result.anime_name || null;

    const countTarget = target || autor;
    const count = increment(data, sub, countTarget.id);

    const descripcion = config.target
      ? config.msg(autor.username, target.username)
      : config.msg(autor.username);

    const counterText = config.counter(countTarget.username, count);

    const embed = new EmbedBuilder()
      .setDescription(descripcion)
      .setImage(gifURL)
      .setColor(0xFF6B9D);

    // Footer con contador y nombre del anime
    const footerParts = [counterText];
    if (animeName) footerParts.push(`Anime: ${animeName}`);
    embed.setFooter({ text: footerParts.join('\n') });

    // Botón de respuesta solo si tiene target y botón definido
    const components = [];
    if (config.boton && target) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`interact_${sub}_${autor.id}_${target.id}`)
          .setLabel(`${config.emoji} ${config.boton}`)
          .setStyle(ButtonStyle.Secondary)
      );
      components.push(row);
    }

    await interaction.editReply({ embeds: [embed], components });
  } catch (err) {
    await interaction.editReply({ content: '❌ No pude obtener el GIF, intenta de nuevo.' });
  }
}

module.exports = {
  data: builder,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const config = acciones[sub];
    const autor = interaction.user;
    const target = config.target ? interaction.options.getUser('usuario') : null;

    await sendInteraction(interaction, sub, autor, target);
  },

  async handleButton(interaction) {
    // customId: interact_<accion>_<autorOriginal>_<targetOriginal>
    const parts = interaction.customId.split('_');
    const sub = parts[1];
    const originalAutorId = parts[2];

    // Solo el target original puede responder
    if (interaction.user.id !== originalAutorId && interaction.user.id !== parts[3]) {
      return interaction.reply({ content: '❌ Solo el usuario mencionado puede responder.', ephemeral: true });
    }

    // El que responde es ahora el autor, y el autor original es el target
    const nuevoAutor = interaction.user;
    const nuevoTarget = await interaction.client.users.fetch(originalAutorId);

    await interaction.deferReply();
    
    const config = acciones[sub];
    const data = loadData();
    const { data: apiData } = await axios.get(`https://nekos.best/api/v2/${sub}`);
    const result = apiData.results[0];
    const gifURL = result.url;
    const animeName = result.anime_name || null;

    const count = increment(data, sub, nuevoTarget.id);
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
        .setLabel(`${config.emoji} ${config.boton}`)
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};