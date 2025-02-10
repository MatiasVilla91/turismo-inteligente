# chatbot.py - Módulo para manejar las respuestas del chatbot con un modelo gratuito de Hugging Face
import requests
from flask import Blueprint, request, jsonify
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()
HF_API_KEY = os.getenv("HF_API_KEY")

chatbot_bp = Blueprint('chatbot', __name__)

# Modelo optimizado para español
HF_MODEL = "HuggingFaceH4/zephyr-7b-beta"
API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
HEADERS = {"Authorization": f"Bearer {HF_API_KEY}"}

def obtener_respuesta_huggingface(mensaje):
    """Consulta un modelo de Hugging Face para obtener una respuesta conversacional."""
    
    if not mensaje:
        return "Error: Mensaje vacío."

    data = {"inputs": mensaje, "parameters": {"max_new_tokens": 500}}

    try:
        response = requests.post(API_URL, headers=HEADERS, json=data)
        response.raise_for_status()
        respuesta_json = response.json()

        print("🔍 Respuesta API:", respuesta_json)  # 👀 Para debuggear

        if isinstance(respuesta_json, list) and "generated_text" in respuesta_json[0]:
            return respuesta_json[0]["generated_text"]
        elif "error" in respuesta_json:
            return f"Error API: {respuesta_json['error']}"
        else:
            return "No se pudo obtener una respuesta válida."

    except requests.RequestException as e:
        return f"Error al procesar la consulta: {str(e)}"

@chatbot_bp.route('/chatbot', methods=['POST'])
def chatbot():
    data = request.json

    # 🔍 Debug: Verifica si el JSON llega correctamente
    print("📩 JSON recibido:", data)

    if not data or "mensaje" not in data:
        return jsonify({"respuesta": "Error: El JSON enviado no tiene el campo 'mensaje'."})

    mensaje_usuario = data.get("mensaje", "").strip()

    if not mensaje_usuario:
        return jsonify({"respuesta": "Por favor, envía una consulta válida."})

    respuesta = obtener_respuesta_huggingface(mensaje_usuario)
    return jsonify({"respuesta": respuesta})

# Registrar el blueprint en la aplicación Flask
def register_chatbot(app):
    app.register_blueprint(chatbot_bp)
