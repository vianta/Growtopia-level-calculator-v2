const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config.js');

module.exports = {
    name: 'cleanup',
    description: 'Clean up duplicate slash commands',
    data: new SlashCommandBuilder()
        .setName('cleanup')
        .setDescription('Clean up duplicate slash commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all registered commands'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear-global')
                .setDescription('Clear all global commands'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear-guild')
                .setDescription('Clear all guild commands')),
    
    async execute(interaction) {
        // Sadece bot sahibi kullanabilir
        if (!config.OWNER_ID.includes(interaction.user.id)) {
            return interaction.reply({ 
                content: '❌ Only the bot owner can use this command.', 
                ephemeral: true 
            });
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'list':
                    await this.listCommands(interaction);
                    break;
                case 'clear-global':
                    await this.clearGlobalCommands(interaction);
                    break;
                case 'clear-guild':
                    await this.clearGuildCommands(interaction);
                    break;
            }
        } catch (error) {
            console.error('Cleanup command error:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while executing cleanup command.', 
                ephemeral: true 
            });
        }
    },

    // Prefix command handler
    async executeMessage(message, args) {
        // Sadece bot sahibi kullanabilir
        if (!config.OWNER_ID.includes(message.author.id)) {
            return message.reply('❌ Only the bot owner can use this command.');
        }

        const subcommand = args[0]?.toLowerCase();

        try {
            switch (subcommand) {
                case 'list':
                    await this.listCommandsMessage(message);
                    break;
                case 'clear-global':
                    await this.clearGlobalCommandsMessage(message);
                    break;
                case 'clear-guild':
                    await this.clearGuildCommandsMessage(message);
                    break;
                default:
                    const embed = new EmbedBuilder()
                        .setTitle('🗑️ Cleanup Command Help')
                        .setDescription('**Usage:**\n```\n.cleanup list\n.cleanup clear-global\n.cleanup clear-guild\n```')
                        .addFields(
                            { name: '📋 list', value: 'List all registered commands', inline: true },
                            { name: '🌐 clear-global', value: 'Clear all global commands', inline: true },
                            { name: '🏠 clear-guild', value: 'Clear all guild commands', inline: true }
                        )
                        .setColor('#3498db');
                    
                    await message.reply({ embeds: [embed] });
                    break;
            }
        } catch (error) {
            console.error('Cleanup command error:', error);
            await message.reply('❌ An error occurred while executing cleanup command.');
        }
    },

    async listCommandsMessage(message) {
        try {
            const globalCommands = await message.client.application.commands.fetch();
            const guildCommands = await message.guild.commands.fetch();

            const embed = new EmbedBuilder()
                .setTitle('📋 Registered Commands')
                .setColor('#3498db')
                .setTimestamp();

            if (globalCommands.size > 0) {
                const globalList = globalCommands.map(cmd => `• \`/${cmd.name}\` - ${cmd.description}`).join('\n');
                embed.addFields({ name: `🌐 Global Commands (${globalCommands.size})`, value: globalList });
            } else {
                embed.addFields({ name: '🌐 Global Commands', value: 'No global commands found.' });
            }

            if (guildCommands.size > 0) {
                const guildList = guildCommands.map(cmd => `• \`/${cmd.name}\` - ${cmd.description}`).join('\n');
                embed.addFields({ name: `🏠 Guild Commands (${guildCommands.size})`, value: guildList });
            } else {
                embed.addFields({ name: '🏠 Guild Commands', value: 'No guild commands found.' });
            }

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('List commands error:', error);
            await message.reply('❌ Failed to fetch commands.');
        }
    },

    async clearGlobalCommandsMessage(message) {
        const embed = new EmbedBuilder()
            .setTitle('⚠️ Clear Global Commands')
            .setDescription('Are you sure you want to clear ALL global commands? This action cannot be undone.')
            .setColor('#e74c3c');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`cleanup_confirm_global_${message.author.id}`)
                    .setLabel('Yes, Clear All')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`cleanup_cancel_${message.author.id}`)
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async clearGuildCommandsMessage(message) {
        const embed = new EmbedBuilder()
            .setTitle('⚠️ Clear Guild Commands')
            .setDescription('Are you sure you want to clear ALL guild commands? This action cannot be undone.')
            .setColor('#e74c3c');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`cleanup_confirm_guild_${message.author.id}`)
                    .setLabel('Yes, Clear All')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`cleanup_cancel_${message.author.id}`)
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async listCommands(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const globalCommands = await interaction.client.application.commands.fetch();
            const guildCommands = await interaction.guild.commands.fetch();

            const embed = new EmbedBuilder()
                .setTitle('📋 Registered Commands')
                .setColor('#3498db')
                .setTimestamp();

            if (globalCommands.size > 0) {
                const globalList = globalCommands.map(cmd => `• \`/${cmd.name}\` - ${cmd.description}`).join('\n');
                embed.addFields({ name: `🌐 Global Commands (${globalCommands.size})`, value: globalList });
            } else {
                embed.addFields({ name: '🌐 Global Commands', value: 'No global commands found.' });
            }

            if (guildCommands.size > 0) {
                const guildList = guildCommands.map(cmd => `• \`/${cmd.name}\` - ${cmd.description}`).join('\n');
                embed.addFields({ name: `🏠 Guild Commands (${guildCommands.size})`, value: guildList });
            } else {
                embed.addFields({ name: '🏠 Guild Commands', value: 'No guild commands found.' });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('List commands error:', error);
            await interaction.editReply({ content: '❌ Failed to fetch commands.' });
        }
    },

    async clearGlobalCommands(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('⚠️ Clear Global Commands')
            .setDescription('Are you sure you want to clear ALL global commands? This action cannot be undone.')
            .setColor('#e74c3c');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`cleanup_confirm_global_${interaction.user.id}`)
                    .setLabel('Yes, Clear All')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`cleanup_cancel_${interaction.user.id}`)
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },

    async clearGuildCommands(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('⚠️ Clear Guild Commands')
            .setDescription('Are you sure you want to clear ALL guild commands? This action cannot be undone.')
            .setColor('#e74c3c');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`cleanup_confirm_guild_${interaction.user.id}`)
                    .setLabel('Yes, Clear All')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`cleanup_cancel_${interaction.user.id}`)
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },

    async handleInteraction(interaction) {
        if (!interaction.isButton()) return;

        const [action, type, userId] = interaction.customId.split('_').slice(1);
        
        // Sadece komutu kullanan kişi butonlara basabilir
        if (interaction.user.id !== userId) {
            return interaction.reply({ 
                content: '❌ You cannot interact with this command.', 
                ephemeral: true 
            });
        }

        if (action === 'cancel') {
            const embed = new EmbedBuilder()
                .setTitle('❌ Operation Cancelled')
                .setDescription('Command cleanup operation was cancelled.')
                .setColor('#95a5a6');

            await interaction.update({ embeds: [embed], components: [] });
            return;
        }

        if (action === 'confirm') {
            await interaction.deferUpdate();

            try {
                if (type === 'global') {
                    await interaction.client.application.commands.set([]);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('✅ Global Commands Cleared')
                        .setDescription('All global commands have been cleared successfully.')
                        .setColor('#27ae60');

                    await interaction.editReply({ embeds: [embed], components: [] });
                } else if (type === 'guild') {
                    await interaction.guild.commands.set([]);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('✅ Guild Commands Cleared')
                        .setDescription('All guild commands have been cleared successfully.')
                        .setColor('#27ae60');

                    await interaction.editReply({ embeds: [embed], components: [] });
                }
            } catch (error) {
                console.error('Clear commands error:', error);
                
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error')
                    .setDescription('Failed to clear commands. Please try again.')
                    .setColor('#e74c3c');

                await interaction.editReply({ embeds: [embed], components: [] });
            }
        }
    }
};