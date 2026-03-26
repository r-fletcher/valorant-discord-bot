const axios = require('axios');
const {EmbedBuilder} = require('discord.js');
const db = require('../db');
const cache = require('../cache');


const REGION = 'eu';
const BASE_URL = 'https://api.henrikdev.xyz';

module.exports = {
    name: 'rank',
    execute: async (interaction) => {
        await interaction.deferReply();
        const riotId = interaction.options.getString('riotid');
        let name, tag;

        if (riotId) {
            if (!riotId.includes('#')) return interaction.editReply({ content: "Please use the format `/rank name#Tag`"});
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

                if (!row) return interaction.editReply({ content: ":x: No linked account. Use `/link name#tag`"});

                name = row.riot_name;
                tag = row.riot_tag;
            } catch (err) {
                console.log(err);
                return interaction.editReply({ content: ":x: Database error. Please use `/rank name#tag`"});
            }
        }

        try {
            const cacheKey = `rank:${name}#${tag}`;
            const cached = cache.get(cacheKey);

            if (cached) return interaction.editReply({embeds: cached});

            const res = await axios.get(
                `${BASE_URL}/valorant/v2/mmr/${REGION}/${name}/${tag}`,
                { headers: { Authorization: process.env.VAL_API_KEY } }
            );

            const data = res.data.data.current_data;
            const imgURL = data.images.small;

            const embeds = new EmbedBuilder()
                .setTitle(`${name}#${tag}`)
                .setDescription(`Rank: **${data.currenttierpatched}**\nRR: ${data.ranking_in_tier}`)
                .setThumbnail(imgURL)
                .setColor(0xff4655)
                .setFooter({ text: 'Powered by HenrikDev API' });

            cache.set(cacheKey, [embeds]);

            interaction.editReply({ embeds: [embeds] });
        } catch (err) {
            if (err.status === 404) return interaction.editReply({ content: `:x: Player \`${name}#${tag}\` not found`});
            console.log(err);
            interaction.editReply({ content: ":x: An unknown error occured"});
        }
    }
}