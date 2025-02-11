#  ESTE ES EL QUE VA HASTA AHORA!!!!!!!!!!!!!!1  chatbot.py - Módulo para manejar las respuestas del chatbot con Hugging Face y Overpass 
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

#🌍 Función para verificar si el nombre ingresado es una ciudad válida en Overpass
def verificar_ciudad(ciudad):
    """Consulta Overpass API para verificar si la ciudad existe."""
    overpass_url = "http://overpass-api.de/api/interpreter"
    query = f"""
    [out:json];
    node["place"="city"](if: "{ciudad}" in name);
    out;
    """

    try:
        response = requests.get(overpass_url, params={"data": query})
        response.raise_for_status()
        data = response.json()

        # Si hay resultados, la ciudad existe
        return len(data.get("elements", [])) > 0
    except requests.RequestException:
        return False


# 🌍 Función para consultar Overpass API y obtener lugares reales
def consultar_overpass(ciudad, tipo="tourism"):
    """Consulta Overpass API para obtener lugares relacionados con la búsqueda."""
    overpass_url = "http://overpass-api.de/api/interpreter"
    query = f"""
    [out:json];
    area[name="{ciudad}"]->.searchArea;
    (
      node["{tipo}"](area.searchArea);
      way["{tipo}"](area.searchArea);
      relation["{tipo}"](area.searchArea);
    );
    out center;
    """

    try:
        response = requests.get(overpass_url, params={"data": query})
        response.raise_for_status()
        data = response.json()

        if "elements" in data and len(data["elements"]) > 0:
            lugares = []
            for elem in data["elements"]:
                nombre = elem.get("tags", {}).get("name", "Lugar sin nombre")
                lugares.append(nombre)

            return lugares if lugares else ["No encontré lugares relevantes."]
        else:
            return ["No encontré lugares en la zona especificada."]
    
    except requests.RequestException as e:
        return [f"Error en Overpass API: {str(e)}"]
    
# 📍 Función para extraer el nombre del lugar de la consulta del usuario
def extraer_lugar(mensaje):
    """Extrae el nombre de una posible ciudad usando expresiones regulares."""
    palabras = mensaje.split()
    for palabra in palabras:
        if palabra[0].isupper():  # Busca palabras con mayúscula (posibles nombres propios)
            return palabra
    return None
    

# 📡 Función para obtener respuesta de Hugging Face
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
            respuesta = respuesta_json[0]["generated_text"]
            # Elimina la pregunta del usuario si está en la respuesta
            respuesta = respuesta.replace(mensaje, "").strip()
            return respuesta
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

    # 🧠 Identificar si el usuario está preguntando por lugares
    #if "lugares" in mensaje_usuario.lower() or "dónde" in mensaje_usuario.lower():
    #    ciudad = "Córdoba"  # Puedes hacer esto dinámico si quieres que el usuario elija
    #    lugares = consultar_overpass(ciudad)

    #    return jsonify({"respuesta": f"Aquí tienes algunos lugares en {ciudad}: " + ", ".join(lugares)})

    # 💬 Obtener respuesta del modelo Hugging Face si no es una consulta de lugares
    respuesta = obtener_respuesta_huggingface(mensaje_usuario)
    return jsonify({"respuesta": respuesta})

# Registrar el blueprint en la aplicación Flask
def register_chatbot(app):
    app.register_blueprint(chatbot_bp)
