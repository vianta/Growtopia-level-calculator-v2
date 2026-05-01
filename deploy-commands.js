const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.js');

const commands = [];

// Komutları yükle
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`⚠️ The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// REST instance oluştur
const rest = new REST().setToken(config.token);

// Deploy commands
(async () => {
    try {
        console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);

        // Önce tüm komutları temizle
        console.log('🗑️ Clearing all existing commands...');
        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: [] },
        );

        console.log('✅ All commands cleared.');

        // Sonra yeni komutları deploy et
        const data = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
        
        // Deploy edilen komutları listele
        console.log('📋 Deployed commands:');
        commands.forEach(cmd => {
            console.log(`   - /${cmd.name}: ${cmd.description}`);
        });
        
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
    }
})();