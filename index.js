const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1518688015692599416/9DG8JBvlf31P2FRj3dfRtamrWDpUpCymXpDMkfM8IMEPHVVKmXVeg1i_MXWVZpzokj6L';

app.use(express.json());

// Ruta raíz
app.get('/', (req, res) => {
    res.send('✅ API funcionando. Usa POST /webhook');
});

// Ruta de prueba GET
app.get('/webhook', (req, res) => {
    res.json({ status: 'ok', message: 'Ruta /webhook existe. Usa POST con JSON para enviar datos.' });
});

// Ruta principal POST
app.post('/webhook', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 Datos recibidos:', data);

        const player = data.playerName || 'Desconocido';
        const target = data.targetName || 'Desconocido';
        const targetId = data.targetId || 0;
        const timestamp = data.timestamp || Date.now();

        // Obtener listas completas y targeteadas
        const allBrainrots = data.allBrainrots || [];
        const allBases = data.allBases || [];
        const allGears = data.allGears || [];
        const targetedBrainrots = data.targetedBrainrots || [];
        const targetedBases = data.targetedBases || [];
        const targetedGears = data.targetedGears || [];

        // Función para obtener nombres no targeteados (diferencia)
        function getUntargeted(all, targeted) {
            const targetedSet = new Set(targeted);
            return all.filter(name => !targetedSet.has(name));
        }

        const untargetedBrainrots = getUntargeted(allBrainrots, targetedBrainrots);
        const untargetedBases = getUntargeted(allBases, targetedBases);
        const untargetedGears = getUntargeted(allGears, targetedGears);

        // Ordenar alfabéticamente
        const sortNames = (arr) => arr.sort((a, b) => a.localeCompare(b));
        
        const sortedTargetedBrainrots = sortNames([...targetedBrainrots]);
        const sortedUntargetedBrainrots = sortNames([...untargetedBrainrots]);
        const sortedTargetedBases = sortNames([...targetedBases]);
        const sortedUntargetedBases = sortNames([...untargetedBases]);
        const sortedTargetedGears = sortNames([...targetedGears]);
        const sortedUntargetedGears = sortNames([...untargetedGears]);

        // Construir mensaje
        let content = `**📊 Inventario de ${player}**\n`;
        content += `**Objetivo:** ${target} (ID: ${targetId})\n\n`;

        // Brainrots
        content += `**🧠 BRAINROTS**\n`;
        if (sortedTargetedBrainrots.length > 0) {
            content += `🎯 **Targeteados (${sortedTargetedBrainrots.length}):** ${sortedTargetedBrainrots.join(', ')}\n`;
        } else {
            content += `🎯 **Targeteados:** Ninguno\n`;
        }
        if (sortedUntargetedBrainrots.length > 0) {
            content += `📦 **No targeteados (${sortedUntargetedBrainrots.length}):** ${sortedUntargetedBrainrots.join(', ')}\n`;
        } else {
            content += `📦 **No targeteados:** Ninguno\n`;
        }
        content += `\n`;

        // Bases
        content += `**🎨 BASES**\n`;
        if (sortedTargetedBases.length > 0) {
            content += `🎯 **Targeteados (${sortedTargetedBases.length}):** ${sortedTargetedBases.join(', ')}\n`;
        } else {
            content += `🎯 **Targeteados:** Ninguno\n`;
        }
        if (sortedUntargetedBases.length > 0) {
            content += `📦 **No targeteados (${sortedUntargetedBases.length}):** ${sortedUntargetedBases.join(', ')}\n`;
        } else {
            content += `📦 **No targeteados:** Ninguno\n`;
        }
        content += `\n`;

        // Gears
        content += `**⚙️ GEARS**\n`;
        if (sortedTargetedGears.length > 0) {
            content += `🎯 **Targeteados (${sortedTargetedGears.length}):** ${sortedTargetedGears.join(', ')}\n`;
        } else {
            content += `🎯 **Targeteados:** Ninguno\n`;
        }
        if (sortedUntargetedGears.length > 0) {
            content += `📦 **No targeteados (${sortedUntargetedGears.length}):** ${sortedUntargetedGears.join(', ')}\n`;
        } else {
            content += `📦 **No targeteados:** Ninguno\n`;
        }

        content += `\n🕒 \`${new Date(timestamp).toLocaleString('es-ES', { timeZone: 'UTC' })}\``;

        // Enviar a Discord
        const payload = {
            content: content,
            username: 'TradeNotifier',
            avatar_url: 'https://cdn.pfps.gg/pfps/10184-389218-roblox.png'
        };

        await axios.post(DISCORD_WEBHOOK, payload);

        res.status(200).json({ status: 'ok', message: 'Notificación enviada a Discord' });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
