const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const BaseCommand = require('./BaseCommand');

const REGION = 'eu';
const BASE_URL = 'https://api.henrikdev.xyz';

class RankCommand extends BaseCommand {
    constructor() {
        super('rank', { useCache: true, useDb: true, defer: true });
    }

    async execute(interaction, { name, tag }) {
        // =========================
        //      API HERE
        // =========================
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

        return [embeds];
    }
}

module.exports = new RankCommand();