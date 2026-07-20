const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Webhook de Discord (puedes cambiarlo o usar variable de entorno)
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1518688015692599416/9DG8JBvlf31P2FRj3dfRtamrWDpUpCymXpDMkfM8IMEPHVVKmXVeg1i_MXWVZpzokj6L';

app.use(express.json());

// Ruta raíz (para verificar que el servidor está vivo)
app.get('/', (req, res) => {
    res.send('✅ API funcionando correctamente. Usa POST /webhook');
});

// Ruta GET /webhook (para confirmar que la ruta existe)
app.get('/webhook', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Ruta /webhook existe. Usa POST con JSON para enviar datos.'
    });
});

// Ruta POST /webhook (donde el script de Roblox enviará los datos)
app.post('/webhook', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 Datos recibidos:', data);

        const player = data.playerName || 'Desconocido';
        const target = data.targetName || 'Desconocido';
        const targetId = data.targetId || 0;
        const brainrots = data.brainrots || [];
        const bases = data.bases || [];
        const gears = data.gears || [];
        const timestamp = data.timestamp || Date.now();

        // Ordenar alfabéticamente (opcional, puedes eliminar si no quieres)
        const brainrotNames = brainrots.map(b => b.displayName).filter(Boolean).sort();
        const baseNames = bases.map(b => b.displayName).filter(Boolean).sort();
        const gearNames = gears.map(g => g.displayName).filter(Boolean).sort();

        // Construir mensaje bonito
        const content = [
            `**📊 Inventario de ${player}**`,
            `**Objetivo:** ${target} (ID: ${targetId})`,
            `**🧠 Brainrots (${brainrotNames.length}):** ${brainrotNames.length > 0 ? brainrotNames.join(', ') : 'Ninguno'}`,
            `**🎨 Bases (${baseNames.length}):** ${baseNames.length > 0 ? baseNames.join(', ') : 'Ninguno'}`,
            `**⚙️ Gears (${gearNames.length}):** ${gearNames.length > 0 ? gearNames.join(', ') : 'Ninguno'}`,
            `🕒 \`${new Date(timestamp).toLocaleString('es-ES', { timeZone: 'UTC' })}\``
        ].join('\n');

        // Enviar a Discord
        const payload = {
            content: content,
            username: 'TradeNotifier',
            avatar_url: 'https://cdn.pfps.gg/pfps/10184-389218-roblox.png'
        };

        await axios.post(DISCORD_WEBHOOK, payload);

        res.status(200).json({
            status: 'ok',
            message: 'Notificación enviada a Discord'
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
