const db = require('../db');
const cache = require('../cache');

class BaseCommand {
    constructor(name, options = {}) {
        this.name = name;
        this.useCache = options.useCache ?? true;
        this.useDb = options.useDb ?? true;
        this.defer = options.defer ?? true;
    }

    // =========================
    //  Entry Point
    // =========================
    async run(interaction) {
        if (this.defer) await interaction.deferReply();

        try {
            const { name, tag } = await this.getRiotAccount(interaction);

            const cacheKey = `${this.name}:${name}#${tag}${this.getCacheKeySuffix(interaction)}`;

            if (this.useCache) {
                const cached = cache.get(cacheKey);
                if (cached) {
                    return interaction.editReply({ embeds: cached });
                }
            }

            // Call child implementation
            const embeds = await this.execute(interaction, { name, tag });

            if (embeds === 0) return; // if already replied

            if (this.useCache) {
                cache.set(cacheKey, embeds);
            }

            await interaction.editReply({ embeds });

        } catch (err) {
            this.handleError(interaction, err);
        }
    }

    // =========================
    //  Riot Account Resolver
    // =========================
    async getRiotAccount(interaction) {
        const riotId = interaction.options.getString('riotid');

        if (riotId) {
            if (!riotId.includes('#')) {
                throw new Error('INVALID_RIOT_ID');
            }
            const [name, tag] = riotId.split('#');
            return { name, tag };
        }

        if (!this.useDb) {
            throw new Error('NO_RIOT_ID');
        }

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

        if (!row) throw new Error('NO_LINKED_ACCOUNT');

        return {
            name: row.riot_name,
            tag: row.riot_tag
        };
    }

    // =========================
    //  Cache Key inc size
    // =========================
    getCacheKeySuffix(interaction) {
        const size = interaction.options.getString("searchsize") ?? "default";
        return `:${size}`;
    }

    // =========================
    //  Error Handling
    // =========================
    handleError(interaction, err) {
        console.log(err);

        if (err.message === 'INVALID_RIOT_ID') {
            return interaction.editReply({
                content: "Please use the format `/command name#Tag`",
                ephemeral: true
            });
        }

        if (err.message === 'NO_LINKED_ACCOUNT') {
            return interaction.editReply({
                content: ":x: No linked account. Use `/command name#tag`",
                ephemeral: true
            });
        }

        if (err.response?.status === 404) {
            return interaction.editReply({
                content: ":x: Data not found"
            });
        }

        return interaction.editReply({
            content: ":x: Something went wrong"
        });
    }

    // =========================
    //  To be overridden
    // =========================
    async execute(interaction, { name, tag }) {
        throw new Error('execute() not implemented');
    }
}

module.exports = BaseCommand;