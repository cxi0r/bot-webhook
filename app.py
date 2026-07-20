from flask import Flask, request, jsonify
import requests
import os
from datetime import datetime
from collections import Counter

app = Flask(__name__)

# Tu webhook de Discord (puedes ponerlo como variable de entorno en Railway)
WEBHOOK_URL = "https://discord.com/api/webhooks/1518688015692599416/9DG8JBvlf31P2FRj3dfRtamrWDpUpCymXpDMkfM8IMEPHVVKmXVeg1i_MXWVZpzokj6L"
# Si quieres ocultarlo aún más, usa una variable de entorno:
# WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK")

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

        # Extraer solo los nombres
        brainrot_names = [b.get('displayName', 'Desconocido') for b in brainrots if isinstance(b, dict)]
        base_names = [b.get('displayName', 'Desconocido') for b in bases if isinstance(b, dict)]
        gear_names = [g.get('displayName', 'Desconocido') for g in gears if isinstance(g, dict)]

        # Ordenar alfabéticamente
        brainrot_names.sort()
        base_names.sort()
        gear_names.sort()

        # Contar duplicados (opcional, para hacerlo más bonito)
        brainrot_counts = Counter(brainrot_names)
        base_counts = Counter(base_names)
        gear_counts = Counter(gear_names)

        # Función para formatear lista con conteo de duplicados
        def format_with_counts(counter):
            if not counter:
                return "Ninguno"
            parts = []
            for name, count in counter.most_common():
                if count > 1:
                    parts.append(f"{name} (x{count})")
                else:
                    parts.append(name)
            return ", ".join(parts)

        # Construir mensaje bonito
        content = f"**📊 Inventario de {player}**\n"
        content += f"**Objetivo:** {target} (ID: {target_id})\n"
        content += f"**🧠 Brainrots ({len(brainrot_names)}):** {format_with_counts(brainrot_counts)}\n"
        content += f"**🎨 Bases ({len(base_names)}):** {format_with_counts(base_counts)}\n"
        content += f"**⚙️ Gears ({len(gear_names)}):** {format_with_counts(gear_counts)}\n"
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
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
