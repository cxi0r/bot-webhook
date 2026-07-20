from flask import Flask, request, jsonify
import requests
import os
from datetime import datetime

app = Flask(__name__)

# Webhook de Discord (puedes ponerlo en variables de entorno en Railway)
WEBHOOK_URL = "https://discord.com/api/webhooks/1518688015692599416/9DG8JBvlf31P2FRj3dfRtamrWDpUpCymXpDMkfM8IMEPHVVKmXVeg1i_MXWVZpzokj6L"

@app.route('/webhook', methods=['POST'])
def handle_webhook():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        # Extraer datos
        player = data.get('playerName', 'Desconocido')
        target = data.get('targetName', 'Desconocido')
        target_id = data.get('targetId', 0)
        brainrots = data.get('brainrots', [])
        bases = data.get('bases', [])
        gears = data.get('gears', [])
        timestamp = data.get('timestamp', os.time())

        # Procesar y ordenar alfabéticamente
        brainrot_names = sorted([b['displayName'] for b in brainrots])
        base_names = sorted([b['displayName'] for b in bases])
        gear_names = sorted([g['displayName'] for g in gears])

        # Construir mensaje bonito
        content = f"**📊 Inventario de {player}**\n"
        content += f"**Objetivo:** {target} (ID: {target_id})\n"
        content += f"**🧠 Brainrots ({len(brainrot_names)}):** {', '.join(brainrot_names) if brainrot_names else 'Ninguno'}\n"
        content += f"**🎨 Bases ({len(base_names)}):** {', '.join(base_names) if base_names else 'Ninguno'}\n"
        content += f"**⚙️ Gears ({len(gear_names)}):** {', '.join(gear_names) if gear_names else 'Ninguno'}\n"
        content += f"🕒 `{datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')}`"

        payload = {
            "content": content,
            "username": "TradeNotifier",
            "avatar_url": "https://cdn.pfps.gg/pfps/10184-389218-roblox.png"
        }

        # Enviar a Discord
        r = requests.post(WEBHOOK_URL, json=payload)
        r.raise_for_status()

        return jsonify({"status": "ok"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
