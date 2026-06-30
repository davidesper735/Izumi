const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
  StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags
} = require('discord.js');

const CATEGORY_EMOJIS = {
  'Diversión': '🎉',
  'Interacción': '🤝',
  'Utilidad': '🛠️',
  'Administración': '🛡️',
  'League of Legends': '🎮',
  'General': '📦',
};

function getCategorizedCommands(client) {
  const categories = {};

  for (const command of client.commands.values()) {
    if (!command.data?.name || !command.data?.description) continue; // salta acciones de interact (hug, kiss, etc)

    const cat = command.category || 'General';
    if (!categories[cat]) categories[cat] = [];

    // Evita duplicados (interact agrega comandos individuales al Collection)
    if (categories[cat].some(c => c.name === command.data.name)) continue;

    categories[cat].push({
      name: command.data.name,
      description: command.data.description,
    });
  }

  return categories;
}

function buildHomeEmbed(client, categories) {
  const totalComandos = Object.values(categories).flat().length;
  const totalCategorias = Object.keys(categories).length;

  const lista = Object.entries(categories)
    .map(([cat, cmds]) => `${CATEGORY_EMOJIS[cat] || '📦'} **${cat}** — ${cmds.length} comando${cmds.length !== 1 ? 's' : ''}`)
    .join('\n');

  return new EmbedBuilder()
    .setAuthor({ name: `Comandos de ${client.user.username}`, iconURL: client.user.displayAvatarURL() })
    .setColor(0x5865F2)
    .setDescription(
      `Tengo **${totalCategorias} categorías** y **${totalComandos} comandos** listos para ti.\n\n` +
      `Usa el menú de abajo para explorar cada categoría.\n\n` +
      `**Categorías disponibles**\n${lista}`
    )
    .setTimestamp();
}

function buildCategoryEmbed(client, category, commands) {
  const sorted = [...commands].sort((a, b) => a.name.localeCompare(b.name));

  // Acomoda en columnas tipo grid, similar a la imagen
  const maxLen = Math.max(...sorted.map(c => c.name.length), 8);
  const columns = 3;
  const rows = [];

  for (let i = 0; i < sorted.length; i += columns) {
    const row = sorted.slice(i, i + columns)
      .map(c => c.name.padEnd(maxLen))
      .join(' ');
    rows.push(row);
  }

  const grid = rows.join('\n') || 'Sin comandos en esta categoría.';

  return new EmbedBuilder()
    .setAuthor({ name: `${CATEGORY_EMOJIS[category] || '📦'} ${category}`, iconURL: client.user.displayAvatarURL() })
    .setColor(0x5865F2)
    .setDescription(`¿Quieres más info de un comando? Usa \`/help <comando>\`\n\n**Comandos**\n\`\`\`\n${grid}\n\`\`\``)
    .setFooter({ text: `${commands.length} comando${commands.length !== 1 ? 's' : ''}` })
    .setTimestamp();
}

function formatOption(opt) {
  const required = opt.required ? 'requerido' : 'opcional';
  return `\`${opt.name}\` — ${opt.description} *(${required})*`;
}

function buildCommandDetailEmbed(client, command, subcommandName = null) {
  const cat = command.category || 'General';
  const json = command.data.toJSON(); // ← asegura estructura plana

  if (subcommandName) {
    const sub = json.options?.find(o => o.name === subcommandName && o.type === 1);

    if (sub) {
      const opciones = sub.options?.map(formatOption).join('\n') || 'Sin opciones';

      return new EmbedBuilder()
        .setAuthor({ name: `/${json.name} ${sub.name}`, iconURL: client.user.displayAvatarURL() })
        .setColor(0x5865F2)
        .setDescription(sub.description)
        .addFields(
          { name: 'Categoría', value: `${CATEGORY_EMOJIS[cat] || '📦'} ${cat}`, inline: true },
          { name: 'Opciones', value: opciones, inline: false }
        )
        .setTimestamp();
    }
  }

  const subcommands = json.options?.filter(o => o.type === 1) || [];
  const opciones = json.options?.filter(o => o.type !== 1 && o.type !== 2) || [];

  const fields = [
    { name: 'Categoría', value: `${CATEGORY_EMOJIS[cat] || '📦'} ${cat}`, inline: true }
  ];

  if (subcommands.length) {
    const lista = subcommands.map(s => `\`/${json.name} ${s.name}\` — ${s.description}`).join('\n');
    fields.push({ name: 'Subcomandos', value: lista, inline: false });
    fields.push({ name: '\u200B', value: `Usa \`/help comando:${json.name} ${subcommands[0].name}\` para ver detalles de cada uno.`, inline: false });
  } else {
    fields.push({ name: 'Opciones', value: opciones.map(formatOption).join('\n') || 'Sin opciones', inline: false });
  }

  return new EmbedBuilder()
    .setAuthor({ name: `/${json.name}`, iconURL: client.user.displayAvatarURL() })
    .setColor(0x5865F2)
    .setDescription(json.description)
    .addFields(fields)
    .setTimestamp();
}

function buildSelectMenu(categories, selected = null) {
  const options = Object.keys(categories).map(cat => ({
    label: cat,
    value: cat,
    emoji: CATEGORY_EMOJIS[cat] || '📦',
    default: cat === selected,
  }));

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_select')
      .setPlaceholder('Elige una categoría')
      .addOptions(options)
  );
}

function buildButtons(showBack) {
  const row = new ActionRowBuilder();

  if (showBack) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('help_back')
        .setLabel('Volver')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  row.addComponents(
    new ButtonBuilder()
      .setCustomId('help_close')
      .setLabel('Cerrar')
      .setStyle(ButtonStyle.Danger)
  );

  return row;
}

module.exports = {
  category: 'Utilidad',
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra todos los comandos disponibles')
    .addStringOption(opt =>
      opt.setName('comando')
        .setDescription('Ver detalles de un comando específico')
        .setRequired(false)
        .setAutocomplete(true)
    ),

  async execute(interaction) {
    const comandoBuscado = interaction.options.getString('comando');
    const categories = getCategorizedCommands(interaction.client);

    if (comandoBuscado) {
      console.log('[HELP DEBUG] comandoBuscado:', JSON.stringify(comandoBuscado));
      const [baseName, subName] = comandoBuscado.split(' ');
      console.log('[HELP DEBUG] baseName:', baseName, '| subName:', subName);
      
      const command = interaction.client.commands.get(baseName);

      if (!command || !command.data?.description) {
        return interaction.reply({
          content: `❌ No encontré el comando \`${comandoBuscado}\`.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const embed = buildCommandDetailEmbed(interaction.client, command, subName || null);
      const buttonRow = buildButtons(true);
      return interaction.reply({ embeds: [embed], components: [buttonRow] });
    }

    const embed = buildHomeEmbed(interaction.client, categories);
    const selectRow = buildSelectMenu(categories);
    const buttonRow = buildButtons(false);

    return interaction.reply({ embeds: [embed], components: [selectRow, buttonRow] });
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const commands = [...interaction.client.commands.values()]
      .filter(c => c.data?.name && c.data?.description)
      .filter((c, i, arr) => arr.findIndex(x => x.data.name === c.data.name) === i);

    const entries = [];

    for (const c of commands) {
      entries.push(c.data.name);

      const subs = c.data.options?.filter(o => o.type === 1) || [];
      for (const sub of subs) {
        entries.push(`${c.data.name} ${sub.name}`);
      }
    }

    const matches = entries
      .filter(name => name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(name => ({ name, value: name }));

    return interaction.respond(matches);
  },

  async handleSelectMenu(interaction) {
    const categories = getCategorizedCommands(interaction.client);
    const selected = interaction.values[0];

    const embed = buildCategoryEmbed(interaction.client, selected, categories[selected] || []);
    const selectRow = buildSelectMenu(categories, selected);
    const buttonRow = buildButtons(true);

    return interaction.update({ embeds: [embed], components: [selectRow, buttonRow] });
  },

  async handleButton(interaction) {
    const action = interaction.customId.split('_')[1]; // back | close

    if (action === 'close') {
      return interaction.update({
        content: 'Menú cerrado.',
        embeds: [],
        components: []
      });
    }

    if (action === 'back') {
      const categories = getCategorizedCommands(interaction.client);
      const embed = buildHomeEmbed(interaction.client, categories);
      const selectRow = buildSelectMenu(categories);
      const buttonRow = buildButtons(false);

      return interaction.update({ embeds: [embed], components: [selectRow, buttonRow] });
    }
  }
};