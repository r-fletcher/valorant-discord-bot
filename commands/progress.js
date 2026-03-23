const axios = require('axios');
const {EmbedBuilder} = require('discord.js');
const db = require('../db');
const cache = require('../cache');

const REGION = 'eu';
const BASE_URL = 'https://api.henrikdev.xyz';

module.exports = {
    name: 'progress',
    execute: async (interaction) => {
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
            const cacheKey = `progress:${name}#${tag}`;
            const cached = cache.get(cacheKey);

            if (cached) return interaction.editReply({embeds: cached});

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
            }).join('\t');

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

            const streakString = streak + (winStreak ? " Win/s" : " Loss/es");

            const embed = new EmbedBuilder()
                .setTitle(`Progression for ${name}#${tag}`)
                .addFields(
                    {name: 'Last 10 games', value: `\`${mmrString}\``, inline: true},
                    {name: 'Net', value: `\`${resultText} RR\``, inline: false},
                    {name: 'Streak', value: `\`${streakString}\``, inline: false}
                )
                .setColor(resultRR > 0 ? 0x00ff88 : 0xff4655)
                .setFooter({ text: 'Rank progression • Powered by HenrikDev API' });

            cache.set(cacheKey, [embed]);

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            if (err.response?.status === 404) return interaction.editReply({ content: `:x: Progress for \`${name}#${tag}\` not found` });
            console.log(err);
            interaction.editReply({ content: ":x: Failed to fetch progress" });
        }
    }
};