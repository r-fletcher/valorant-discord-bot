const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const BaseCommand = require('./BaseCommand');

const REGION = 'eu';
const BASE_URL = 'https://api.henrikdev.xyz';

class ProgressCommand extends BaseCommand {
    constructor() {
        super('progress', { useCache: true, useDb: true, defer: true });
    }

    async execute(interaction, { name, tag }) {
        const mmr = await axios.get(
            `${BASE_URL}/valorant/v1/mmr-history/${REGION}/${name}/${tag}`,
            { headers: { Authorization: process.env.VAL_API_KEY } }
        );

        const mmrData = mmr.data.data.slice(0, 10);

        const mmrString = mmrData.map(mmr => {
            const rrChange = mmr?.mmr_change_to_last_game;
            const rrText =
                rrChange === undefined
                    ? 'N/A'
                    : rrChange > 0
                    ? `+${rrChange}`
                    : `${rrChange}`;
            return rrText
        }).join('\u200b \u200b \u200b \u200b');

        const resultRR = mmrData.reduce((accumulator, currentVal) => {
            return accumulator + currentVal.mmr_change_to_last_game;
        }, 0);

        const resultText =
                resultRR === undefined
                    ? 'N/A'
                    : resultRR > 0
                    ? `+${resultRR}`
                    : `${resultRR}`;

        let streak = 0;
        let winStreak = null;

        for (const game of mmrData) {
            const isWin = game.mmr_change_to_last_game > 0;

            if (winStreak === null) {
                winStreak = isWin;
                streak++;
            } else if (isWin === winStreak) {
                streak++;
            } else {
                break;
            }
        }

        const streakString = streak + (streak == 1 ? (winStreak ? " Win" : " Loss") : (winStreak ? " Wins" : " Losses"));

        const embed = new EmbedBuilder()
            .setTitle(`Progression for ${name}#${tag}`)
            .addFields(
                {name: 'Last 10 games', value: `${mmrString}`, inline: true},
                {name: '', value: '~~-------------------------------------------------~~'},
                {name: 'Net', value: `${resultText} RR`, inline: false},
                {name: 'Streak', value: `${streakString}`, inline: false},
                {name: '', value: '~~-------------------------------------------------~~'}
            )
            .setColor(resultRR > 0 ? 0x00ff88 : 0xff4655)
            .setFooter({ text: 'Rank progression • Powered by HenrikDev API' });

        return [embed];
    }
}

module.exports = new ProgressCommand();