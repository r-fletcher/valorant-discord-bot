const db = require('../db');

module.exports = {
    name: 'link',
    execute: async (interaction) => {
        const riotId = interaction.options.getString('riotid');

        if (!riotId.includes('#')) return interaction.reply({ content: "Please use the format `Name#Tag`", ephemeral: true });

        const [name, tag] = riotId.split('#');

        await new Promise((resolve, reject) => {
            db.run(
                `INSERT OR REPLACE INTO users (discord_id, riot_name, riot_tag) VALUES (?, ?, ?)`,
                [interaction.user.id, name, tag],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        }).then(() => {
            interaction.reply({ content: `Linked **${name}#${tag}** to your account!`, ephemeral: true });
        }).catch((err) => {
            console.log(err);
            interaction.reply({ content: ":x: Error linking your account", ephemeral: true });
        });
    }
}