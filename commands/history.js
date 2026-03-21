const axios = require('axios');
const {EmbedBuilder} = require('discord.js');
const db = require('../db');
const cache = require('../cache');

const REGION = 'eu';
const BASE_URL = 'https://api.henrikdev.xyz';

module.exports = async (interaction) => {
    await interaction.deferReply();

    const riotId = interaction.options.getString('riotid');
    let name, tag;

    if (riotId) {
        if (!riotId.includes('#')) return interaction.editReply({ content: "Please use the format `/history name#Tag`", ephemeral: true });
        [name, tag] = riotId.split('#');
    } else {
        try {
            const row = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT riot_name, riot_tag FROM users WHERE discord_id = ?`,
                    [interaction.user.id],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!row) return interaction.editReply({ content: ":x: No linked account. Use `/history name#tag`", ephemeral: true });

            name = row.riot_name;
            tag = row.riot_tag;
        } catch (err) {
            console.log(err);
            return interaction.editReply({ content: ":x: Database error. Please use `/history name#tag`", ephemeral: true });
        }
    }

    try {
        const cacheKey = `history:${name}#${tag}`;
        const cached = cache.get(cacheKey);

        if (cached) return interaction.editReply({embeds: cached});

        const res = await axios.get(
            `${BASE_URL}/valorant/v3/matches/${REGION}/${name}/${tag}?mode=competitive`,
            { headers: { Authorization: process.env.VAL_API_KEY } }
        );

        const matches = res.data.data.slice(0, 5);

        const matchEmbeds = matches.map(match => {
            const player = match.players.all_players.find(
                p => p.name.replaceAll(' ', '') === name.replaceAll(' ','') && p.tag === tag
            );

            if (!player) return new EmbedBuilder().setDescription(':warning: Could not find player data for this match');

            const {kills, deaths, assists } = player.stats;
            const kd = (kills / Math.max(deaths, 1)).toFixed(2);
            const agent = player.character;
            const agentImg = player.assets.agent.small;
            const map = match.metadata.map;
            const team = player.team.toLowerCase();
            const redScore = match.teams.red.rounds_won;
            const blueScore = match.teams.blue.rounds_won;
            const draw = match.teams.blue.has_won === match.teams.red.has_won;
            const win = match.teams[team]?.has_won ?? false;

            return new EmbedBuilder()
            .setTitle(`**${map}**`)
            .setColor(draw ? 0xd2d5d8 : win ? 0x00ff88 : 0xff4655)
            .setThumbnail(agentImg ?? null)
            .setDescription(`## ${redScore} - ${blueScore}`)
            .addFields(
                { name: 'Agent', value: agent, inline: true },
                { name: 'KDA', value: `${kills}/${deaths}/${assists}`, inline: true },
                { name: 'K/D', value: kd, inline: true }
            );
        });

        const header = new EmbedBuilder()
            .setTitle(`Match History for ${name}#${tag}`)
            .setFooter({ text: 'Last 5 matches • Powered by HenrikDev API' });

        const embeds = [header, ...matchEmbeds];
        cache.set(cacheKey, embeds);

        await interaction.editReply({ embeds });
    } catch (err) {
        if (err.status === 404) return interaction.editReply({ content: `:x: Matches for \`${name}#${tag}\` not found` });
        console.log(err);
        interaction.editReply({ content: ":x: Failed to fetch matches" });
    }
}