const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const BaseCommand = require('./BaseCommand');

const REGION = 'eu';
const BASE_URL = 'https://api.henrikdev.xyz';

class StatsCommand extends BaseCommand {
    constructor() {
        super('stats', { useCache: true, useDb: true, defer: true });
    }

    async execute(interaction, { name, tag }) {
        const searchSize = interaction.options.getString("searchsize");

        const size = searchSize ? searchSize : 10;

        const res = await axios.get(`${BASE_URL}/valorant/v1/stored-matches/${REGION}/${name}/${tag}?mode=competitive&size=${size}`, {
            headers: { Authorization: process.env.VAL_API_KEY }
        });

        const statData = res.data.data;

        if (!statData || statData.length === 0) {
            interaction.editReply({
                content: `:x: No matches found for ${name}#${tag}`,
            });
            return 0;
        }

        const summary = statData.reduce((accum, match) => {
            accum.score += match.stats.score;
            accum.kills += match.stats.kills;
            accum.deaths += match.stats.deaths;
            accum.assists += match.stats.assists;
            accum.head += match.stats.shots.head;
            accum.body += match.stats.shots.body;
            accum.leg += match.stats.shots.leg;
            accum.dealt += match.stats.damage.made;
            accum.received += match.stats.damage.received;
            accum.rounds = accum.rounds + match.teams.red + match.teams.blue;
            return accum;
        }, {score: 0, kills: 0, deaths: 0, assists: 0, head: 0, body: 0, leg: 0, dealt: 0, received: 0, rounds: 0});

        const kd = (summary.kills / Math.max(1, summary.deaths)).toFixed(2);
        const totalShots = summary.head + summary.body + summary.leg;
        const hsP = totalShots ? ((summary.head / totalShots) * 100).toFixed(2) : 0;
        const bsP = totalShots ? ((summary.body / totalShots) * 100).toFixed(2) : 0;
        const lsP = totalShots ? ((summary.leg / totalShots) * 100).toFixed(2) : 0;
        const aveScore = (summary.score/Math.max(1, statData.length)).toFixed(2);
        const aveDealt = (summary.dealt/Math.max(summary.rounds)).toFixed(2);
        const aveReceived = (summary.received/Math.max(1, summary.rounds)).toFixed(2);
        const kA = (summary.kills/Math.max(1, statData.length)).toFixed(1);
        const dA = (summary.deaths/Math.max(1, statData.length)).toFixed(1);
        const aA = (summary.assists/Math.max(1, statData.length)).toFixed(1);

        const embed = new EmbedBuilder()
            .setTitle(`${size} Match Stat Summary for ${name}#${tag}`)
            .addFields(
                { name: 'Average Score', value: aveScore.toString(), inline: true},
                { name: 'K/D', value: kd.toString(), inline: true },
                { name: 'Kills / Deaths / Assists', value: `Total: ${summary.kills}/${summary.deaths}/${summary.assists}\nAverage: ${kA}/${dA}/${aA}`},
                { name: 'Shots Breakdown', value: `Head: ${hsP}% | Body: ${bsP}% | Leg: ${lsP}%` },
                { name: 'Damage Breakdown per Round', value: `Dealt: ${aveDealt} | Received: ${aveReceived}`}
            );

        return [embed];
    }
}

module.exports = new StatsCommand();