require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent
    ]
});

const REGION = 'eu';
const BASE_URL = 'https://api.henrikdev.xyz';
const userLinks = {};

client.on('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand) return;

    if (interaction.commandName === 'ping') {
        await interaction.reply(':ping_pong: Pong!');
    }

    if (interaction.commandName === 'rank') {
        const riotId = interaction.options.getString('riotid');
        let name, tag;

        if (riotId) {
            if (!riotId.includes('#')) return interaction.reply({content: "Please use the format `Name#Tag`", ephemeral: true});

            [name, tag] = riotId.split('#');
        } else {
            if (!userLinks[interaction.user.id]) return interaction.reply({content: "Please link account `/link name#tag` or use `/rank name#tag`", ephemeral: true});

            [name, tag] = userLinks[interaction.user.id].split('#');
        }

        try {
            const res = await axios.get(
                `${BASE_URL}/valorant/v2/mmr/${REGION}/${name}/${tag}`,
                {
                    headers: { Authorization: process.env.VAL_API_KEY }
                }
            );

            const data = res.data.data.current_data;

            //console.log(data);

            const imgURL = data.images.small;

            const embed = new EmbedBuilder()
                .setTitle(`${name}#${tag}`)
                .setDescription(`Rank: **${data.currenttierpatched}**\nRR: ${data.ranking_in_tier}`)
                .setThumbnail(imgURL)
                .setColor(0xff4655);

            interaction.reply({embeds: [embed]});
        } catch (err) {
            console.log(err);
            interaction.reply("Could not fetch player.");
        }
    }

    if (interaction.commandName === 'link') {
        const riotId = interaction.options.getString('riotid');

        if (!riotId.includes('#')) return interaction.reply({content: "Please use the format `Name#Tag`", ephemeral: true});

        userLinks[interaction.user.id] = riotId;

        interaction.reply({content: "Linked!", ephemeral: true});
    }
});