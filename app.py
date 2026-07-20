from flask import Flask, request, jsonify
import requests
import os
from datetime import datetime
import traceback

app = Flask(__name__)

# Webhook de Discord (puedes cambiarlo o leerlo desde variable de entorno)
WEBHOOK_URL = "https://discord.com/api/webhooks/1518688015692599416/9DG8JBvlf31P2FRj3dfRtamrWDpUpCymXpDMkfM8IMEPHVVKmXVeg1i_MXWVZpzokj6L"
# Si quieres usar variable de entorno, descomenta esta línea:
# WEBHOOK_URL = os.environ.get("WEBHOOK_URL", "https://discord.com/api/webhooks/...")

@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "API de TradeNotifier funcionando correctamente", "version": "1.0"})

@app.route('/webhook', methods=['POST'])
def handle_webhook():
    try:
        # Obtener datos del cuerpo de la petición
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        # Extraer datos con valores predeterminados
        player = data.get('playerName', 'Desconocido')
        target = data.get('targetName', 'Desconocido')
        target_id = data.get('targetId', 0)
        brainrots = data.get('brainrots', [])
        bases = data.get('bases', [])
        gears = data.get('gears', [])
        timestamp = data.get('timestamp', int(datetime.now().timestamp()))
        # Formato del mensaje: true = mostrar nombres en bruto, false = mostrar con formato bonito
        raw = data.get('raw', False)

        # Procesar y ordenar los nombres
        brainrot_names = sorted([b['displayName'] for b in brainrots if isinstance(b, dict) and 'displayName' in b])
        base_names = sorted([b['displayName'] for b in bases if isinstance(b, dict) and 'displayName' in b])
        gear_names = sorted([g['displayName'] for g in gears if isinstance(g, dict) and 'displayName' in g])

        # Contar duplicados (función auxiliar)
        def count_items(names):
            counts = {}
            for name in names:
                counts[name] = counts.get(name, 0) + 1
            return counts

        # Construir mensaje según formato
        if raw:
            # Modo bruto: solo listas separadas por comas
            content = f"**📊 Inventario de {player}**\n"
            content += f"**Objetivo:** {target} (ID: {target_id})\n"
            content += f"**🧠 Brainrots ({len(brainrot_names)}):** {', '.join(brainrot_names) if brainrot_names else 'Ninguno'}\n"
            content += f"**🎨 Bases ({len(base_names)}):** {', '.join(base_names) if base_names else 'Ninguno'}\n"
            content += f"**⚙️ Gears ({len(gear_names)}):** {', '.join(gear_names) if gear_names else 'Ninguno'}\n"
            content += f"🕒 `{datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')}`"
        else:
            # Modo bonito: muestra cantidades y ordena
            content = f"**📊 Inventario de {player}**\n"
            content += f"**Objetivo:** {target} (ID: {target_id})\n"
            
            # Brainrots
            brainrot_counts = count_items(brainrot_names)
            brainrot_str = ', '.join([f"{name} (x{count})" if count > 1 else name for name, count in brainrot_counts.items()])
            content += f"**🧠 Brainrots ({len(brainrot_names)}):** {brainrot_str if brainrot_str else 'Ninguno'}\n"
            
            # Bases
            base_counts = count_items(base_names)
            base_str = ', '.join([f"{name} (x{count})" if count > 1 else name for name, count in base_counts.items()])
            content += f"**🎨 Bases ({len(base_names)}):** {base_str if base_str else 'Ninguno'}\n"
            
            # Gears
            gear_counts = count_items(gear_names)
            gear_str = ', '.join([f"{name} (x{count})" if count > 1 else name for name, count in gear_counts.items()])
            content += f"**⚙️ Gears ({len(gear_names)}):** {gear_str if gear_str else 'Ninguno'}\n"
            
            content += f"🕒 `{datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')}`"

        # Construir payload para Discord
        payload = {
            "content": content,
            "username": "TradeNotifier",
            "avatar_url": "https://cdn.pfps.gg/pfps/10184-389218-roblox.png"
        }

        # Enviar a Discord
        response = requests.post(WEBHOOK_URL, json=payload, timeout=10)
        response.raise_for_status()

        # Responder al cliente
        return jsonify({
            "status": "ok",
            "message": "Notificación enviada a Discord",
            "discord_status": response.status_code
        }), 200

    except Exception as e:
        # Capturar cualquier error y enviar detalle
        error_details = {
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(error_details)  # Esto se verá en los logs de Railway
        return jsonify(error_details), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
