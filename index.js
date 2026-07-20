require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Middleware de seguridad: exige una API Key en la cabecera Authorization
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (process.env.API_KEY && authHeader !== `Bearer ${process.env.API_KEY}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
});

// Endpoint que recibe los datos desde Roblox
app.post('/transform', async (req, res) => {
  try {
    const data = req.body;
    const discordMessage = buildDiscordMessage(data);

    // Enviar el mensaje al webhook de Discord
    await axios.post(process.env.DISCORD_WEBHOOK_URL, {
      content: discordMessage
      // Si prefieres usar embeds, cambia la línea anterior por un objeto "embeds"
    });

    res.json({ status: 'ok', message: 'Mensaje enviado a Discord' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Función que formatea los datos en texto
function buildDiscordMessage(data) {
  let msg = `**${data.usuario}** — $${data.valor}/s\n`;
  msg += `**Targets:**\n`;
  if (data.targets && data.targets.length > 0) {
    data.targets.forEach(t => {
      msg += `- ${t.nombre}: ${t.info}\n`;
    });
  } else {
    msg += `Ninguno\n`;
  }
  msg += `\n**Gears:** ${data.gears?.join(', ') || 'Ninguno'}\n`;
  msg += `**Skins base:** ${data.skins?.join(', ') || 'Ninguno'}\n`;
  msg += `\nServidor: ${data.server}\nJugadores: ${data.players}\nEjecutor: ${data.executor}\nHora: ${data.timestamp}`;
  return msg;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API escuchando en puerto ${PORT}`));
