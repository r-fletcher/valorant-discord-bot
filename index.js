require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const db = require('./db');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent
    ]
});

const REGION = 'eu';
const BASE_URL = 'https://api.henrikdev.xyz';

client.on('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand) return;

    if (interaction.commandName === 'ping') {
        await interaction.reply(`:ping_pong: Pong!\n\`Latency: ${client.ws.ping}ms\``);
    }

    if (interaction.commandName === 'rank') {
        const riotId = interaction.options.getString('riotid');
        let name, tag;

        if (riotId) {
            if (!riotId.includes('#')) return interaction.reply({ content: "Please use the format `Name#Tag`", ephemeral: true });
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

                if (!row) {
                    return interaction.reply({ content: ":x: No linked account. Use `/link name#tag`", ephemeral: true });
                }

                name = row.riot_name;
                tag = row.riot_tag;
            } catch (err) {
                console.log(err);
                return interaction.reply({ content: ":x: Database error. Please use `/rank name#tag`", ephemeral: true });
            }
        }

        try {
            const res = await axios.get(
                `${BASE_URL}/valorant/v2/mmr/${REGION}/${name}/${tag}`,
                { headers: { Authorization: process.env.VAL_API_KEY } }
            );

            const data = res.data.data.current_data;
            const imgURL = data.images.small;

            const embed = new EmbedBuilder()
                .setTitle(`${name}#${tag}`)
                .setDescription(`Rank: **${data.currenttierpatched}**\nRR: ${data.ranking_in_tier}`)
                .setThumbnail(imgURL)
                .setColor(0xff4655);

            interaction.reply({ embeds: [embed] });
        } catch (err) {
            if (err.status === 404) return interaction.reply({ content: `:x: Player \`${name}#${tag}\` not found`, ephemeral: true });
            console.log(err);
            interaction.reply({ content: ":x: An unknown error occured", ephemeral: true });
        }
    }

    if (interaction.commandName === 'link') {
        const riotId = interaction.options.getString('riotid');

        if (!riotId.includes('#')) return interaction.reply({content: "Please use the format `Name#Tag`", ephemeral: true});

        const split = riotId.split('#');

        db.run(
            `INSERT OR REPLACE INTO users (discord_id, riot_name, riot_tag)
            VALUES (?, ?, ?)`,
            [interaction.user.id, split[0], split[1]],
            (err) => {
                console.log(err);
                return interaction.reply({content: ":x: Error linking your account", ephemeral: true})
            }
        )

        interaction.reply({content: "Linked!", ephemeral: true});
    }
});
