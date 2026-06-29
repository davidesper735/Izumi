const { SlashCommandBuilder, EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { pool } = require('../../database/database');
const axios = require('axios');

const REGIONS = {
  na: { platform: 'na1', cluster: 'americas' },
  euw: { platform: 'euw1', cluster: 'europe' },
  eune: { platform: 'eun1', cluster: 'europe' },
  kr: { platform: 'kr', cluster: 'asia' },
  br: { platform: 'br1', cluster: 'americas' },
  lan: { platform: 'la1', cluster: 'americas' },
  las: { platform: 'la2', cluster: 'americas' },
  jp: { platform: 'jp1', cluster: 'asia' },
  oce: { platform: 'oc1', cluster: 'sea' },
  tr: { platform: 'tr1', cluster: 'europe' },
  ru: { platform: 'ru', cluster: 'europe' },
};

const RIOT_HEADERS = (key) => ({ 'X-Riot-Token': key });

async function getDDragonVersion() {
  const res = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json');
  return res.data[0];
}

async function getChampionMap(version) {
  const res = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/es_ES/champion.json`);
  const map = {};
  for (const champ of Object.values(res.data.data)) {
    map[parseInt(champ.key)] = { name: champ.name, id: champ.id };
  }
  return map;
}

function getRankColor(tier) {
  const colors = {
    IRON: 0x4a4a4a, BRONZE: 0x8c5a28, SILVER: 0x8fa3b1,
    GOLD: 0xf0b232, PLATINUM: 0x4da6a0, EMERALD: 0x2ecc71,
    DIAMOND: 0x4fc3f7, MASTER: 0x9b59b6, GRANDMASTER: 0xe74c3c,
    CHALLENGER: 0xf1c40f,
  };
  return colors[tier] || 0x2b2d31;
}

function formatRank(entry) {
  if (!entry) return '`Sin clasificar`';
  const { tier, rank, leaguePoints, wins, losses } = entry;
  const total = wins + losses;
  const wr = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';
  const tierCapital = tier.charAt(0) + tier.slice(1).toLowerCase();
  return `**${tierCapital} ${rank}** — ${leaguePoints} LP\n${wins}W / ${losses}L — ${wr}% WR`;
}

function getMasteryLabel(level) {
  if (level >= 10) return 'MAX';
  if (level >= 7) return 'S';
  if (level >= 5) return 'A';
  return `${level}`;
}

function getStreak(matches) {
  if (!matches.length) return 'Sin datos';
  const first = matches[0].win;
  let count = 0;
  for (const m of matches) {
    if (m.win === first) count++;
    else break;
  }
  return first ? `${count} victorias seguidas` : `${count} derrotas seguidas`;
}

async function getProfileData(game_name, tag_line, region, riotKey) {
  const { platform, cluster } = REGIONS[region];

  const [version, accountRes] = await Promise.all([
    getDDragonVersion(),
    axios.get(
      `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(game_name)}/${encodeURIComponent(tag_line)}`,
      { headers: RIOT_HEADERS(riotKey) }
    )
  ]);

  const { puuid } = accountRes.data;

  const [summonerRes, rankedRes, matchIdsRes, champMasteryRes] = await Promise.all([
    axios.get(`https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`, { headers: RIOT_HEADERS(riotKey) }),
    axios.get(`https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`, { headers: RIOT_HEADERS(riotKey) }),
    axios.get(`https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=10`, { headers: RIOT_HEADERS(riotKey) }),
    axios.get(`https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=3`, { headers: RIOT_HEADERS(riotKey) }),
  ]);

  const summoner = summonerRes.data;
  const rankedData = rankedRes.data;
  const matchIds = matchIdsRes.data;
  const masteries = champMasteryRes.data;

  const champMap = await getChampionMap(version);

  const matchDetails = await Promise.all(
    matchIds.slice(0, 10).map(id =>
      axios.get(
        `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${id}`,
        { headers: RIOT_HEADERS(riotKey) }
      ).then(r => {
        const p = r.data.info.participants.find(p => p.puuid === puuid);
        return {
          win: p.win,
          champion: p.championName,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
        };
      })
    )
  );

  return { summoner, rankedData, matchDetails, masteries, champMap, version, puuid, platform, cluster };
}

function buildProfileEmbed(game_name, tag_line, region, data, targetUser) {
  const { summoner, rankedData, matchDetails, masteries, champMap, version } = data;

  const soloDuo = rankedData.find(e => e.queueType === 'RANKED_SOLO_5x5');
  const flex = rankedData.find(e => e.queueType === 'RANKED_FLEX_SR');

  const streak = getStreak(matchDetails);
  const wins = matchDetails.filter(m => m.win).length;
  const losses = matchDetails.length - wins;
  const globalWR = matchDetails.length > 0 ? ((wins / matchDetails.length) * 100).toFixed(0) : '0';

  const avgKills = (matchDetails.reduce((a, m) => a + m.kills, 0) / (matchDetails.length || 1)).toFixed(1);
  const avgDeaths = (matchDetails.reduce((a, m) => a + m.deaths, 0) / (matchDetails.length || 1)).toFixed(1);
  const avgAssists = (matchDetails.reduce((a, m) => a + m.assists, 0) / (matchDetails.length || 1)).toFixed(1);

  const topChamps = masteries.map(m => {
    const champ = champMap[m.championId];
    const name = champ?.name || `#${m.championId}`;
    const pts = (m.championPoints / 1000).toFixed(0) + 'k';
    const lvl = getMasteryLabel(m.championLevel);
    return `**${name}** · M${lvl} · ${pts} pts`;
  }).join('\n') || 'Sin datos';

  const recentGames = matchDetails.slice(0, 5).map(m => {
    const result = m.win ? '🟦' : '🟥';
    return `${result} ${m.champion} — ${m.kills}/${m.deaths}/${m.assists}`;
  }).join('\n') || 'Sin partidas recientes';

  const iconUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${summoner.profileIconId}.png`;

  const description = [
    `> Nivel **${summoner.summonerLevel}** · ${region.toUpperCase()} · ${streak}`,
    ``,
    `**RANKED SOLO/DÚO**`,
    formatRank(soloDuo),
    ``,
    `**RANKED FLEX**`,
    formatRank(flex),
  ].join('\n');

  return new EmbedBuilder()
    .setAuthor({ name: `${game_name}#${tag_line}`, iconURL: iconUrl })
    .setColor(soloDuo ? getRankColor(soloDuo.tier) : 0x2b2d31)
    .setDescription(description)
    .addFields(
      {
        name: 'Últimas 10 partidas',
        value: `${wins}W / ${losses}L — **${globalWR}% WR** · KDA promedio: ${avgKills}/${avgDeaths}/${avgAssists}`,
        inline: false
      },
      {
        name: 'Recientes',
        value: recentGames,
        inline: true
      },
      {
        name: 'Top Campeones',
        value: topChamps,
        inline: true
      }
    )
    .setThumbnail(iconUrl)
    .setFooter({ text: targetUser.username, iconURL: targetUser.displayAvatarURL() })
    .setTimestamp();
}

function buildHistorialEmbed(game_name, tag_line, matchDetails, targetUser) {
  const lines = matchDetails.map(m => {
    const result = m.win ? '🟦' : '🟥';
    const kda = `${m.kills}/${m.deaths}/${m.assists}`;
    return `${result} **${m.champion}** — ${kda}`;
  }).join('\n') || 'Sin partidas recientes';

  const wins = matchDetails.filter(m => m.win).length;
  const losses = matchDetails.length - wins;
  const wr = matchDetails.length > 0 ? ((wins / matchDetails.length) * 100).toFixed(0) : '0';

  return new EmbedBuilder()
    .setAuthor({ name: `${game_name}#${tag_line} · Historial` })
    .setColor(0x5865F2)
    .setDescription(lines)
    .addFields({ name: 'Resumen', value: `${wins}W / ${losses}L — **${wr}% WR**`, inline: false })
    .setFooter({ text: targetUser.username, iconURL: targetUser.displayAvatarURL() })
    .setTimestamp();
}

function buildButtons(userId, targetId, view) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`lol_profile_${userId}_${targetId}`)
      .setLabel('Perfil')
      .setStyle(view === 'profile' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`lol_historial_${userId}_${targetId}`)
      .setLabel('Historial')
      .setStyle(view === 'historial' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`lol_live_${userId}_${targetId}`)
      .setLabel('En vivo')
      .setStyle(ButtonStyle.Danger),
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lol')
    .setDescription('Comandos de League of Legends')
    .addSubcommand(sub =>
      sub.setName('settings')
        .setDescription('Vincula tu cuenta de League of Legends')
        .addStringOption(opt =>
          opt.setName('usuario')
            .setDescription('Tu Riot ID (ejemplo: Nombre#TAG)')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('region')
            .setDescription('Tu región')
            .setRequired(true)
            .addChoices(
              { name: 'NA', value: 'na' },
              { name: 'EUW', value: 'euw' },
              { name: 'EUNE', value: 'eune' },
              { name: 'KR', value: 'kr' },
              { name: 'BR', value: 'br' },
              { name: 'LAN', value: 'lan' },
              { name: 'LAS', value: 'las' },
              { name: 'JP', value: 'jp' },
              { name: 'OCE', value: 'oce' },
              { name: 'TR', value: 'tr' },
              { name: 'RU', value: 'ru' },
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('profile')
        .setDescription('Muestra tu perfil de League of Legends')
        .addUserOption(opt =>
          opt.setName('usuario')
            .setDescription('Usuario de Discord (opcional)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('live')
        .setDescription('Ver si estás en partida ahora mismo')
        .addUserOption(opt =>
          opt.setName('usuario')
            .setDescription('Usuario de Discord (opcional)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('compare')
        .setDescription('Compara dos jugadores')
        .addUserOption(opt =>
          opt.setName('jugador1').setDescription('Primer jugador').setRequired(true)
        )
        .addUserOption(opt =>
          opt.setName('jugador2').setDescription('Segundo jugador').setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const riotKey = process.env.RIOT_API_KEY;

    // ── /lol settings ──────────────────────────────────────────────
    if (sub === 'settings') {
      const input = interaction.options.getString('usuario');
      const region = interaction.options.getString('region');

      if (!input.includes('#')) {
        return interaction.reply({ content: '❌ Formato: `Nombre#TAG`', flags: MessageFlags.Ephemeral });
      }

      const [gameName, tagLine] = input.split('#');
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      try {
        const { cluster } = REGIONS[region];
        await axios.get(
          `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
          { headers: RIOT_HEADERS(riotKey) }
        );

        await pool.query(`
          INSERT INTO lol_profiles (user_id, game_name, tag_line, region)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id) DO UPDATE SET game_name=$2, tag_line=$3, region=$4
        `, [interaction.user.id, gameName, tagLine, region]);

        const embed = new EmbedBuilder()
          .setTitle('Cuenta vinculada')
          .setColor(0x57F287)
          .setDescription(`**${gameName}#${tagLine}** · ${region.toUpperCase()}`)
          .setFooter({ text: 'Usa /lol profile para ver tus estadísticas' })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch (e) {
        if (e.response?.status === 404) return interaction.editReply({ content: '❌ Cuenta no encontrada.' });
        console.error('[LOL SETTINGS]', e.message);
        return interaction.editReply({ content: '❌ Error al verificar la cuenta.' });
      }
    }

    // ── /lol profile ───────────────────────────────────────────────
    if (sub === 'profile') {

      await interaction.deferReply();
      const target = interaction.options.getUser('usuario') || interaction.user;
      

      const result = await pool.query('SELECT * FROM lol_profiles WHERE user_id = $1', [target.id]);
      if (!result.rows.length) {
        const msg = target.id === interaction.user.id
          ? '❌ No tienes cuenta vinculada. Usa `/lol settings`.'
          : `❌ ${target.username} no tiene cuenta vinculada.`;
        return interaction.editReply({ content: msg });
      }

      const { game_name, tag_line, region } = result.rows[0];

      try {
        const data = await getProfileData(game_name, tag_line, region, riotKey);
        const embed = buildProfileEmbed(game_name, tag_line, region, data, target);
        const buttons = buildButtons(interaction.user.id, target.id, 'profile');
        return interaction.editReply({ embeds: [embed], components: [buttons] });
      } catch (e) {
        console.error('[LOL PROFILE]', e.message);
        return interaction.editReply({ content: '❌ Error al obtener el perfil.' });
      }
    }

    // ── /lol live ──────────────────────────────────────────────────
    if (sub === 'live') {
      await interaction.deferReply();
      const target = interaction.options.getUser('usuario') || interaction.user;
      

      const result = await pool.query('SELECT * FROM lol_profiles WHERE user_id = $1', [target.id]);
      if (!result.rows.length) return interaction.editReply({ content: '❌ Sin cuenta vinculada.' });

      const { game_name, tag_line, region } = result.rows[0];
      const { platform, cluster } = REGIONS[region];

      try {
        const version = await getDDragonVersion();
        const champMap = await getChampionMap(version);

        const accountRes = await axios.get(
          `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(game_name)}/${encodeURIComponent(tag_line)}`,
          { headers: RIOT_HEADERS(riotKey) }
        );
        const { puuid } = accountRes.data;

        const liveRes = await axios.get(
          `https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,
          { headers: RIOT_HEADERS(riotKey) }
        );

        const game = liveRes.data;
        const participant = game.participants.find(p => p.puuid === puuid);
        const champ = champMap[participant?.championId];
        const champName = champ?.name || 'Desconocido';
        const champId = champ?.id || '';

        const queueNames = {
          420: 'Ranked Solo/Dúo', 440: 'Ranked Flex', 400: 'Normal Draft',
          430: 'Normal Ciego', 450: 'ARAM', 900: 'URF', 1020: 'One for All'
        };
        const queueName = queueNames[game.gameQueueConfigId] || `Cola ${game.gameQueueConfigId}`;
        const duration = Math.floor(game.gameLength / 60);

        const embed = new EmbedBuilder()
          .setAuthor({ name: `${game_name}#${tag_line} · En partida`, iconURL: `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${participant?.profileIconId || 0}.png` })
          .setColor(0xED4245)
          .setDescription(`**${champName}** · ${queueName}`)
          .addFields(
            { name: 'Duración', value: `${duration} min`, inline: true },
            { name: 'Modo', value: queueName, inline: true },
          )
          .setThumbnail(champId ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champId}.png` : null)
          .setFooter({ text: target.username, iconURL: target.displayAvatarURL() })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch (e) {
        if (e.response?.status === 404) {
          return interaction.editReply({ content: `**${game_name}#${tag_line}** no está en partida ahora mismo.` });
        }
        console.error('[LOL LIVE]', e.message);
        return interaction.editReply({ content: '❌ Error al consultar partida en vivo.' });
      }
    }

    // ── /lol compare ───────────────────────────────────────────────
    if (sub === 'compare') {

      await interaction.deferReply();
      const user1 = interaction.options.getUser('jugador1');
      const user2 = interaction.options.getUser('jugador2');
      

      const [r1, r2] = await Promise.all([
        pool.query('SELECT * FROM lol_profiles WHERE user_id = $1', [user1.id]),
        pool.query('SELECT * FROM lol_profiles WHERE user_id = $1', [user2.id]),
      ]);

      if (!r1.rows.length) return interaction.editReply({ content: `❌ ${user1.username} no tiene cuenta vinculada.` });
      if (!r2.rows.length) return interaction.editReply({ content: `❌ ${user2.username} no tiene cuenta vinculada.` });

      try {
        const [d1, d2] = await Promise.all([
          getProfileData(r1.rows[0].game_name, r1.rows[0].tag_line, r1.rows[0].region, riotKey),
          getProfileData(r2.rows[0].game_name, r2.rows[0].tag_line, r2.rows[0].region, riotKey),
        ]);

        function getRankValue(rankedData) {
          const entry = rankedData.find(e => e.queueType === 'RANKED_SOLO_5x5');
          if (!entry) return 0;
          const tierOrder = ['IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'];
          const rankOrder = ['IV','III','II','I'];
          return tierOrder.indexOf(entry.tier) * 400 + rankOrder.indexOf(entry.rank) * 100 + entry.leaguePoints;
        }

        const val1 = getRankValue(d1.rankedData);
        const val2 = getRankValue(d2.rankedData);
        const winnerLabel = val1 > val2
          ? `${r1.rows[0].game_name} gana`
          : val2 > val1
            ? `${r2.rows[0].game_name} gana`
            : 'Empate';

        const soloDuo1 = d1.rankedData.find(e => e.queueType === 'RANKED_SOLO_5x5');
        const soloDuo2 = d2.rankedData.find(e => e.queueType === 'RANKED_SOLO_5x5');

        const wins1 = d1.matchDetails.filter(m => m.win).length;
        const wins2 = d2.matchDetails.filter(m => m.win).length;
        const wr1 = d1.matchDetails.length > 0 ? ((wins1 / d1.matchDetails.length) * 100).toFixed(0) : '0';
        const wr2 = d2.matchDetails.length > 0 ? ((wins2 / d2.matchDetails.length) * 100).toFixed(0) : '0';

        const embed = new EmbedBuilder()
          .setTitle('Comparación · Solo/Dúo')
          .setColor(0xFEE75C)
          .setDescription(`**${winnerLabel}**`)
          .addFields(
            {
              name: `${r1.rows[0].game_name}#${r1.rows[0].tag_line}`,
              value: formatRank(soloDuo1) + `\nNivel ${d1.summoner.summonerLevel}\nÚlt. 10: **${wr1}% WR**`,
              inline: true
            },
            { name: '\u200B', value: '\u200B', inline: true },
            {
              name: `${r2.rows[0].game_name}#${r2.rows[0].tag_line}`,
              value: formatRank(soloDuo2) + `\nNivel ${d2.summoner.summonerLevel}\nÚlt. 10: **${wr2}% WR**`,
              inline: true
            },
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch (e) {
        console.error('[LOL COMPARE]', e.message);
        return interaction.editReply({ content: '❌ Error al comparar perfiles.' });
      }
    }
  },

  // ── Botones ────────────────────────────────────────────────────
  async handleButton(interaction) {
    const parts = interaction.customId.split('_');
    // customId: lol_profile_requesterId_targetId
    const view = parts[1];
    const requesterId = parts[2];
    const targetId = parts[3];
    const riotKey = process.env.RIOT_API_KEY;

    if (interaction.user.id !== requesterId) {
      return interaction.reply({ content: '❌ Solo quien usó el comando puede navegar.', flags: MessageFlags.Ephemeral });
    }

    await interaction.deferUpdate();

    const target = await interaction.client.users.fetch(targetId);
    const result = await pool.query('SELECT * FROM lol_profiles WHERE user_id = $1', [targetId]);
    if (!result.rows.length) return;

    const { game_name, tag_line, region } = result.rows[0];
    const { platform, cluster } = REGIONS[region];

    if (view === 'profile') {
      try {
        const data = await getProfileData(game_name, tag_line, region, riotKey);
        const embed = buildProfileEmbed(game_name, tag_line, region, data, target);
        const buttons = buildButtons(requesterId, targetId, 'profile');
        return interaction.editReply({ embeds: [embed], components: [buttons] });
      } catch (e) {
        console.error('[LOL BUTTON PROFILE]', e.message);
      }
    }

    if (view === 'historial') {
      try {
        const data = await getProfileData(game_name, tag_line, region, riotKey);
        const embed = buildHistorialEmbed(game_name, tag_line, data.matchDetails, target);
        const buttons = buildButtons(requesterId, targetId, 'historial');
        return interaction.editReply({ embeds: [embed], components: [buttons] });
      } catch (e) {
        console.error('[LOL BUTTON HISTORIAL]', e.message);
      }
    }

    if (view === 'live') {
      try {
        const version = await getDDragonVersion();
        const champMap = await getChampionMap(version);

        const accountRes = await axios.get(
          `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(game_name)}/${encodeURIComponent(tag_line)}`,
          { headers: RIOT_HEADERS(riotKey) }
        );
        const { puuid } = accountRes.data;

        const liveRes = await axios.get(
          `https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,
          { headers: RIOT_HEADERS(riotKey) }
        );

        const game = liveRes.data;
        const participant = game.participants.find(p => p.puuid === puuid);
        const champ = champMap[participant?.championId];
        const champName = champ?.name || 'Desconocido';
        const champId = champ?.id || '';
        const duration = Math.floor(game.gameLength / 60);
        const queueNames = {
          420: 'Ranked Solo/Dúo', 440: 'Ranked Flex', 400: 'Normal Draft',
          430: 'Normal Ciego', 450: 'ARAM', 900: 'URF', 1020: 'One for All'
        };

        const embed = new EmbedBuilder()
          .setAuthor({ name: `${game_name}#${tag_line} · En partida` })
          .setColor(0xED4245)
          .setDescription(`**${champName}** · ${queueNames[game.gameQueueConfigId] || 'Otro modo'}`)
          .addFields(
            { name: 'Duración', value: `${duration} min`, inline: true },
            { name: 'Modo', value: queueNames[game.gameQueueConfigId] || 'Otro', inline: true },
          )
          .setThumbnail(champId ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champId}.png` : null)
          .setFooter({ text: target.username, iconURL: target.displayAvatarURL() })
          .setTimestamp();

        const buttons = buildButtons(requesterId, targetId, 'live');
        return interaction.editReply({ embeds: [embed], components: [buttons] });
      } catch (e) {
        if (e.response?.status === 404) {
          return interaction.editReply({
            content: `**${game_name}#${tag_line}** no está en partida ahora mismo.`,
            embeds: [],
            components: []
          });
        }
        console.error('[LOL BUTTON LIVE]', e.message);
      }
    }
  }
};