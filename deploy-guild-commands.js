const { REST, Routes, PermissionFlagsBits } = require('discord.js');
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
            const commandData = command.data.toJSON();
            
            // Cleanup komutu hariç diğer komutları sadece belirli kanalda görünür yap
            if (commandData.name !== 'cleanup') {
                commandData.contexts = [0]; // Guild context only
                commandData.integration_types = [0]; // Guild install only
            }
            
            commands.push(commandData);
        } else {
            console.log(`⚠️ The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// REST instance oluştur
const rest = new REST().setToken(config.token);

// Deploy commands to specific guild with channel permissions
(async () => {
    try {
        console.log(`🔄 Started refreshing ${commands.length} guild (/) commands.`);

        // Önce guild komutlarını temizle
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: [] },
        );

        // Guild commands için deploy et
        const data = await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} guild (/) commands.`);
        console.log('Commands deployed to guild:', config.guildId);
        
        // Deployed commands listesi
        data.forEach(cmd => {
            console.log(`- /${cmd.name}: ${cmd.description}`);
        });

        // Şimdi komut izinlerini ayarla (sadece belirli kanalda görünür)
        console.log('\n🔒 Setting up command permissions...');
        
        for (const cmd of data) {
            if (cmd.name !== 'cleanup') { // Cleanup hariç
                try {
                    await rest.put(
                        Routes.applicationCommandPermissions(config.clientId, config.guildId, cmd.id),
                        {
                            body: {
                                permissions: [
                                    {
                                        id: config.CALCULATOR_CHANNEL_ID,
                                        type: 1, // CHANNEL
                                        permission: true
                                    }
                                ]
                            }
                        }
                    );
                    console.log(`✅ Set channel permission for /${cmd.name}`);
                } catch (permError) {
                    console.log(`⚠️ Could not set permissions for /${cmd.name}:`, permError.message);
                }
            }
        }
        
        console.log(`\n✅ Commands are now restricted to channel: ${config.CALCULATOR_CHANNEL_ID}`);
        
    } catch (error) {
        console.error('❌ Error deploying guild commands:', error);
    }
})();