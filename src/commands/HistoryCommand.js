const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const BaseCommand = require('./BaseCommand');

const REGION = 'eu';
const BASE_URL = 'https://api.henrikdev.xyz';

class HistoryCommand extends BaseCommand {
    constructor() {
        super('history', { useCache: true, useDb: true, defer: true });
    }

    async execute(interaction, { name, tag }) {

        const res = await axios.get(
            `${BASE_URL}/valorant/v3/matches/${REGION}/${name}/${tag}?mode=competitive&size=5`,
            { headers: { Authorization: process.env.VAL_API_KEY } }
        );

        const mmr = await axios.get(
            `${BASE_URL}/valorant/v1/mmr-history/${REGION}/${name}/${tag}`,
            { headers: { Authorization: process.env.VAL_API_KEY } }
        )

        const matchesData = res.data.data.slice(0, 5);
        const mmrData = mmr.data.data.slice(0, 5);

        const combinedMatches = matchesData.map((match, i) => ({
            ...match,
            mmr: mmrData[i] || null
        }));

        const matchEmbeds = combinedMatches.map(match => {
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

            const rrChange = match.mmr?.mmr_change_to_last_game;
            const rrText =
                rrChange === undefined
                    ? 'N/A'
                    : rrChange > 0
                    ? `+${rrChange}`
                    : `${rrChange}`;

            return new EmbedBuilder()
            .setTitle(`**${map}**`)
            .setColor(draw ? 0xd2d5d8 : win ? 0x00ff88 : 0xff4655)
            .setThumbnail(agentImg ?? null)
            .setDescription(`## ${redScore} - ${blueScore}`)
            .addFields(
                { name: 'Agent', value: agent, inline: true },
                { name: 'KDA', value: `${kills}/${deaths}/${assists}`, inline: true },
                { name: 'K/D', value: kd, inline: true },
                { name: 'RR Change', value: rrText, inline: true}
            );
        });

        const header = new EmbedBuilder()
            .setTitle(`Match History for ${name}#${tag}`)
            .setFooter({ text: 'Last 5 matches • Powered by HenrikDev API' });

        const embeds = [header, ...matchEmbeds];

        return embeds;
    }
}

module.exports = new HistoryCommand();