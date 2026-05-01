const { ContainerBuilder, TextDisplayBuilder, StringSelectMenuBuilder, ActionRowBuilder, SlashCommandBuilder, EmbedBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seed-settings')
        .setDescription('Manage seed calculator settings - multipliers, limits, cooldowns, and tax rates'),
    name: 'seed-settings',
    description: 'Manage seed calculator settings - multipliers, limits, cooldowns, and tax rates',

    async execute(interaction) {
        // Kanal kontrolü - sadece belirli kanalda çalışır
        if (interaction.channelId !== config.CALCULATOR_CHANNEL_ID) {
            return interaction.reply({ 
                content: `❌ This command can only be used in <#${config.CALCULATOR_CHANNEL_ID}>`, 
                ephemeral: true 
            });
        }

        // Slash command handler
        if (interaction.isChatInputCommand()) {
            // Sadece owner kullanabilir
            const isOwner = config.OWNER_ID.includes(interaction.user.id);

            if (!isOwner) {
                return interaction.reply({ 
                    content: '❌ Bu komutu sadece Bot Owner kullanabilir!', 
                    ephemeral: true 
                });
            }

            return this.createSettingsPanel(interaction, 'reply');
        }
    },

    // Prefix command handler (backward compatibility)
    async executeMessage(message) {
        // Kanal kontrolü - sadece belirli kanalda çalışır
        if (message.channelId !== config.CALCULATOR_CHANNEL_ID) {
            return message.reply(`❌ This command can only be used in <#${config.CALCULATOR_CHANNEL_ID}>`);
        }

        // Sadece owner kullanabilir
        const isOwner = config.OWNER_ID.includes(message.author.id);

        if (!isOwner) {
            return message.reply('❌ Bu komutu sadece Bot Owner kullanabilir!');
        }

        return this.createSettingsPanel(message, 'reply');
    },

    async createSettingsPanel(context, method = 'reply') {
        // Settings Panel Container - Components v2
        const settingsContainer = new ContainerBuilder();

        // Main title
        settingsContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `# ⚙️✨ **Seed Calculator Settings**\n` +
                    `**Advanced configuration panel for jar calculator system**\n\n` +
                    `**🎯 Welcome ${context.user?.displayName || context.author?.displayName}!**\n` +
                    `Configure multipliers, limits, cooldowns, and tax rates for the jar calculator.`
                )
        );

        // Current Settings Display
        settingsContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `## 📊 **Current Settings**\n` +
                    `**🔢 Seed Multipliers:**\n` +
                    `• 👑 Owner: \`×${config.SEED_SETTINGS.MULTIPLIERS.OWNER}\`\n` +
                    `• ⭐ Weekly Admin: \`×${config.SEED_SETTINGS.MULTIPLIERS.WEEKLY_ADMIN}\`\n` +
                    `• 🛡️ Admin: \`×${config.SEED_SETTINGS.MULTIPLIERS.ADMIN}\`\n\n` +
                    `**⏱️ Usage Limits:**\n` +
                    `• Daily Jar Limit: \`${config.SEED_SETTINGS.LIMITS.DAILY_JAR_LIMIT} entries\`\n` +
                    `• Weekly Jar Limit: \`${config.SEED_SETTINGS.LIMITS.WEEKLY_JAR_LIMIT} entries\`\n` +
                    `• Cooldown: \`${config.SEED_SETTINGS.LIMITS.COOLDOWN_MINUTES} minutes\`\n\n` +
                    `**💰 Tax & Pricing:**\n` +
                    `• Food Tax: \`${config.SEED_SETTINGS.TAX.FOOD_TAX_PERCENTAGE}%\`\n` +
                    `• 🍪 Gingerbread Cookie: \`${config.FOOD_PRICES.GINGERBREAD_COOKIE} WL\`\n` +
                    `• 🥥 Coconut Tart: \`${config.FOOD_PRICES.COCONUT_TART} WL\``
                )
        );

        // Settings Categories Select Menu
        const settingsSelect = new StringSelectMenuBuilder()
            .setCustomId(`settings_category_${context.user?.id || context.author?.id}`)
            .setPlaceholder('⚙️ Select a category to configure...')
            .addOptions([
                {
                    label: '🔢 Seed Multipliers',
                    description: 'Configure role-based seed calculation multipliers',
                    value: 'multipliers',
                    emoji: '🔢'
                },
                {
                    label: '⏱️ Usage Limits',
                    description: 'Set daily/weekly limits and cooldown periods',
                    value: 'limits',
                    emoji: '⏱️'
                },
                {
                    label: '🍪 Food Prices',
                    description: 'Update food prices and tax percentages',
                    value: 'food_tax',
                    emoji: '🍪'
                },
                {
                    label: '🔄 Reset All Settings',
                    description: 'Reset all settings to default values',
                    value: 'reset_all',
                    emoji: '🔄'
                }
            ]);

        settingsContainer.addActionRowComponents(new ActionRowBuilder().addComponents(settingsSelect));

        // Quick Actions
        const quickActions = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`settings_backup_${context.user?.id || context.author?.id}`)
                    .setLabel('💾 Backup Settings')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💾'),
                new ButtonBuilder()
                    .setCustomId(`settings_reload_${context.user?.id || context.author?.id}`)
                    .setLabel('🔄 Reload Config')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔄'),
                new ButtonBuilder()
                    .setCustomId(`settings_test_${context.user?.id || context.author?.id}`)
                    .setLabel('🧪 Test Settings')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🧪')
            );

        settingsContainer.addActionRowComponents(quickActions);

        // Footer info
        settingsContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `## 📝 **Information**\n` +
                    `• Changes are applied immediately to the jar calculator\n` +
                    `• All settings are automatically saved to config file\n` +
                    `• Use backup feature before making major changes\n\n` +
                    `-# ⚠️ Only bot owners can access these settings • Created By wendos`
                )
        );

        const replyOptions = { 
            components: [settingsContainer],
            flags: MessageFlags.IsComponentsV2
        };

        if (method === 'reply') {
            return context.reply(replyOptions);
        } else if (method === 'update') {
            return context.update(replyOptions);
        } else if (method === 'edit') {
            return context.editReply(replyOptions);
        }
    },

    async handleInteraction(interaction) {
        // Settings category selection
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('settings_category_')) {
            const selectedCategory = interaction.values[0];

            switch (selectedCategory) {
                case 'multipliers':
                    return this.showMultipliersModal(interaction);
                case 'limits':
                    return this.showLimitsModal(interaction);
                case 'food_tax':
                    return this.showFoodTaxModal(interaction);
                case 'reset_all':
                    return this.showResetConfirmation(interaction);
                default:
                    return interaction.reply({ content: '❌ Invalid category selection!', ephemeral: true });
            }
        }

        // Quick action buttons
        if (interaction.isButton() && interaction.customId.startsWith('settings_backup_')) {
            return this.backupSettings(interaction);
        }

        if (interaction.isButton() && interaction.customId.startsWith('settings_reload_')) {
            return this.reloadConfig(interaction);
        }

        if (interaction.isButton() && interaction.customId.startsWith('settings_test_')) {
            return this.testSettings(interaction);
        }

        // Modal handlers
        if (interaction.type === 5 && interaction.customId.startsWith('multipliers_modal_')) {
            return this.handleMultipliersModal(interaction);
        }

        if (interaction.type === 5 && interaction.customId.startsWith('limits_modal_')) {
            return this.handleLimitsModal(interaction);
        }

        if (interaction.type === 5 && interaction.customId.startsWith('food_tax_modal_')) {
            return this.handleFoodTaxModal(interaction);
        }
    },

    async showMultipliersModal(interaction) {
        const multipliersModal = new ModalBuilder()
            .setCustomId(`multipliers_modal_${interaction.user.id}`)
            .setTitle('🔢 Configure Seed Multipliers');

        multipliersModal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('owner_multiplier')
                    .setLabel('👑 Owner Multiplier')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('Current: ' + config.SEED_SETTINGS.MULTIPLIERS.OWNER)
                    .setValue(config.SEED_SETTINGS.MULTIPLIERS.OWNER.toString())
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('weekly_admin_multiplier')
                    .setLabel('⭐ Weekly Admin Multiplier')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('Current: ' + config.SEED_SETTINGS.MULTIPLIERS.WEEKLY_ADMIN)
                    .setValue(config.SEED_SETTINGS.MULTIPLIERS.WEEKLY_ADMIN.toString())
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('admin_multiplier')
                    .setLabel('🛡️ Admin Multiplier')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('Current: ' + config.SEED_SETTINGS.MULTIPLIERS.ADMIN)
                    .setValue(config.SEED_SETTINGS.MULTIPLIERS.ADMIN.toString())
            )
        );

        return interaction.showModal(multipliersModal);
    },

    async showLimitsModal(interaction) {
        const limitsModal = new ModalBuilder()
            .setCustomId(`limits_modal_${interaction.user.id}`)
            .setTitle('⏱️ Configure Usage Limits');

        limitsModal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('daily_limit')
                    .setLabel('Daily Jar Entry Limit')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('Current: ' + config.SEED_SETTINGS.LIMITS.DAILY_JAR_LIMIT)
                    .setValue(config.SEED_SETTINGS.LIMITS.DAILY_JAR_LIMIT.toString())
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('weekly_limit')
                    .setLabel('Weekly Jar Entry Limit')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('Current: ' + config.SEED_SETTINGS.LIMITS.WEEKLY_JAR_LIMIT)
                    .setValue(config.SEED_SETTINGS.LIMITS.WEEKLY_JAR_LIMIT.toString())
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('cooldown_minutes')
                    .setLabel('Cooldown Period (minutes)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('Current: ' + config.SEED_SETTINGS.LIMITS.COOLDOWN_MINUTES)
                    .setValue(config.SEED_SETTINGS.LIMITS.COOLDOWN_MINUTES.toString())
            )
        );

        return interaction.showModal(limitsModal);
    },

    async showFoodTaxModal(interaction) {
        const foodTaxModal = new ModalBuilder()
            .setCustomId(`food_tax_modal_${interaction.user.id}`)
            .setTitle('🍪 Configure Food Prices & Tax');

        foodTaxModal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('gingerbread_price')
                    .setLabel('🍪 Gingerbread Cookie Price (WL)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('Current: ' + config.FOOD_PRICES.GINGERBREAD_COOKIE)
                    .setValue(config.FOOD_PRICES.GINGERBREAD_COOKIE.toString())
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('coconut_price')
                    .setLabel('🥥 Coconut Tart Price (WL)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('Current: ' + config.FOOD_PRICES.COCONUT_TART)
                    .setValue(config.FOOD_PRICES.COCONUT_TART.toString())
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('food_tax_percentage')
                    .setLabel('Food Tax Percentage (%)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('Current: ' + config.SEED_SETTINGS.TAX.FOOD_TAX_PERCENTAGE)
                    .setValue(config.SEED_SETTINGS.TAX.FOOD_TAX_PERCENTAGE.toString())
            )
        );

        return interaction.showModal(foodTaxModal);
    },

    async handleMultipliersModal(interaction) {
        const ownerMult = parseInt(interaction.fields.getTextInputValue('owner_multiplier'));
        const weeklyAdminMult = parseInt(interaction.fields.getTextInputValue('weekly_admin_multiplier'));
        const adminMult = parseInt(interaction.fields.getTextInputValue('admin_multiplier'));

        // Validation
        if (isNaN(ownerMult) || isNaN(weeklyAdminMult) || isNaN(adminMult) || 
            ownerMult < 1 || weeklyAdminMult < 1 || adminMult < 1) {
            return interaction.reply({ content: '❌ Please enter valid positive numbers for all multipliers!', ephemeral: true });
        }

        // Update config
        config.SEED_SETTINGS.MULTIPLIERS.OWNER = ownerMult;
        config.SEED_SETTINGS.MULTIPLIERS.WEEKLY_ADMIN = weeklyAdminMult;
        config.SEED_SETTINGS.MULTIPLIERS.ADMIN = adminMult;

        // Save to file
        await this.saveConfig();

        const resultContainer = new ContainerBuilder();
        resultContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `# ✅ **Multipliers Updated**\n\n` +
                    `**New Seed Multipliers:**\n` +
                    `• 👑 Owner: \`×${ownerMult}\`\n` +
                    `• ⭐ Weekly Admin: \`×${weeklyAdminMult}\`\n` +
                    `• 🛡️ Admin: \`×${adminMult}\`\n\n` +
                    `Changes have been applied to the jar calculator system.`
                )
        );

        return interaction.reply({ 
            components: [resultContainer],
            flags: MessageFlags.IsComponentsV2,
            ephemeral: true
        });
    },

    async handleLimitsModal(interaction) {
        const dailyLimit = parseInt(interaction.fields.getTextInputValue('daily_limit'));
        const weeklyLimit = parseInt(interaction.fields.getTextInputValue('weekly_limit'));
        const cooldownMinutes = parseInt(interaction.fields.getTextInputValue('cooldown_minutes'));

        // Validation
        if (isNaN(dailyLimit) || isNaN(weeklyLimit) || isNaN(cooldownMinutes) || 
            dailyLimit < 1 || weeklyLimit < 1 || cooldownMinutes < 0) {
            return interaction.reply({ content: '❌ Please enter valid numbers for all limits!', ephemeral: true });
        }

        // Update config
        config.SEED_SETTINGS.LIMITS.DAILY_JAR_LIMIT = dailyLimit;
        config.SEED_SETTINGS.LIMITS.WEEKLY_JAR_LIMIT = weeklyLimit;
        config.SEED_SETTINGS.LIMITS.COOLDOWN_MINUTES = cooldownMinutes;

        // Save to file
        await this.saveConfig();

        const resultContainer = new ContainerBuilder();
        resultContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `# ✅ **Limits Updated**\n\n` +
                    `**New Usage Limits:**\n` +
                    `• Daily Jar Limit: \`${dailyLimit} entries\`\n` +
                    `• Weekly Jar Limit: \`${weeklyLimit} entries\`\n` +
                    `• Cooldown: \`${cooldownMinutes} minutes\`\n\n` +
                    `Changes have been applied to the jar calculator system.`
                )
        );

        return interaction.reply({ 
            components: [resultContainer],
            flags: MessageFlags.IsComponentsV2,
            ephemeral: true
        });
    },

    async handleFoodTaxModal(interaction) {
        const gingerbreadPrice = parseInt(interaction.fields.getTextInputValue('gingerbread_price'));
        const coconutPrice = parseInt(interaction.fields.getTextInputValue('coconut_price'));
        const taxPercentage = parseInt(interaction.fields.getTextInputValue('food_tax_percentage'));

        // Validation
        if (isNaN(gingerbreadPrice) || isNaN(coconutPrice) || isNaN(taxPercentage) || 
            gingerbreadPrice < 1 || coconutPrice < 1 || taxPercentage < 0 || taxPercentage > 100) {
            return interaction.reply({ content: '❌ Please enter valid values! Tax must be 0-100%.', ephemeral: true });
        }

        // Update config
        config.FOOD_PRICES.GINGERBREAD_COOKIE = gingerbreadPrice;
        config.FOOD_PRICES.COCONUT_TART = coconutPrice;
        config.SEED_SETTINGS.TAX.FOOD_TAX_PERCENTAGE = taxPercentage;

        // Save to file
        await this.saveConfig();

        const resultContainer = new ContainerBuilder();
        resultContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `# ✅ **Food Prices & Tax Updated**\n\n` +
                    `**New Prices:**\n` +
                    `• 🍪 Gingerbread Cookie: \`${gingerbreadPrice} WL\`\n` +
                    `• 🥥 Coconut Tart: \`${coconutPrice} WL\`\n` +
                    `• Food Tax: \`${taxPercentage}%\`\n\n` +
                    `Changes have been applied to the jar calculator system.`
                )
        );

        return interaction.reply({ 
            components: [resultContainer],
            flags: MessageFlags.IsComponentsV2,
            ephemeral: true
        });
    },

    async saveConfig() {
        try {
            const configPath = path.join(__dirname, '../../config.js');
            const configContent = `module.exports = ${JSON.stringify(config, null, 4)};`;
            fs.writeFileSync(configPath, configContent, 'utf8');
            return true;
        } catch (error) {
            console.error('Config save error:', error);
            return false;
        }
    },

    async backupSettings(interaction) {
        // Create backup of current settings
        const backup = {
            timestamp: new Date().toISOString(),
            settings: {
                SEED_SETTINGS: config.SEED_SETTINGS,
                FOOD_PRICES: config.FOOD_PRICES
            }
        };

        return interaction.reply({ 
            content: `💾 **Settings Backup Created**\n\`\`\`json\n${JSON.stringify(backup, null, 2)}\n\`\`\``, 
            ephemeral: true 
        });
    },

    async reloadConfig(interaction) {
        try {
            // Clear require cache and reload config
            delete require.cache[require.resolve('../../config.js')];
            const newConfig = require('../../config.js');
            
            return interaction.reply({ 
                content: '🔄 **Config Reloaded Successfully**\nAll settings have been refreshed from the config file.', 
                ephemeral: true 
            });
        } catch (error) {
            return interaction.reply({ 
                content: '❌ **Config Reload Failed**\n' + error.message, 
                ephemeral: true 
            });
        }
    },

    async testSettings(interaction) {
        const testContainer = new ContainerBuilder();
        testContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `# 🧪 **Settings Test Results**\n\n` +
                    `**Multiplier Test (1000 jar):**\n` +
                    `• 👑 Owner: \`${Math.floor(1000/200 * config.SEED_SETTINGS.MULTIPLIERS.OWNER)} seed\`\n` +
                    `• ⭐ Weekly Admin: \`${Math.floor(1000/200 * config.SEED_SETTINGS.MULTIPLIERS.WEEKLY_ADMIN)} seed\`\n` +
                    `• 🛡️ Admin: \`${Math.floor(1000/200 * config.SEED_SETTINGS.MULTIPLIERS.ADMIN)} seed\`\n\n` +
                    `**Food Tax Test (10 items each):**\n` +
                    `• 🍪 Gingerbread: \`${config.FOOD_PRICES.GINGERBREAD_COOKIE * 10} WL\` → Tax: \`${Math.floor(config.FOOD_PRICES.GINGERBREAD_COOKIE * 10 * config.SEED_SETTINGS.TAX.FOOD_TAX_PERCENTAGE / 100)} WL\`\n` +
                    `• 🥥 Coconut: \`${config.FOOD_PRICES.COCONUT_TART * 10} WL\` → Tax: \`${Math.floor(config.FOOD_PRICES.COCONUT_TART * 10 * config.SEED_SETTINGS.TAX.FOOD_TAX_PERCENTAGE / 100)} WL\`\n\n` +
                    `**Limits Test:**\n` +
                    `• Daily entries allowed: \`${config.SEED_SETTINGS.LIMITS.DAILY_JAR_LIMIT}\`\n` +
                    `• Weekly entries allowed: \`${config.SEED_SETTINGS.LIMITS.WEEKLY_JAR_LIMIT}\`\n` +
                    `• Cooldown between entries: \`${config.SEED_SETTINGS.LIMITS.COOLDOWN_MINUTES} minutes\``
                )
        );

        return interaction.reply({ 
            components: [testContainer],
            flags: MessageFlags.IsComponentsV2,
            ephemeral: true
        });
    }
};