# chatbot.py - Módulo para manejar las respuestas del chatbot
import random
import requests
import unicodedata
from flask import Blueprint, request, jsonify

chatbot_bp = Blueprint('chatbot', __name__)

def normalizar_texto(texto):
    """Elimina acentos y caracteres especiales para mejorar la búsqueda."""
    return ''.join(
        c for c in unicodedata.normalize('NFD', texto)
        if unicodedata.category(c) != 'Mn'
    )

def obtener_coordenadas(destino):
    """Convierte el nombre de una ciudad en coordenadas (lat, lon), manejando errores."""
    destino = normalizar_texto(destino.strip())  # Normaliza y elimina espacios extra
    url = f"https://nominatim.openstreetmap.org/search?format=json&q={destino}&limit=1"
    headers = {"User-Agent": "TurismoInteligenteBot/1.0 (contacto: tuemail@example.com)"}  # IMPORTANTE: Cambia el email por uno válido
    try:
        response = requests.get(url, headers=headers, timeout=5)
        print(f"🔍 API Request: {url}")  # Muestra la URL que estamos llamando
        print(f"📩 API Response Text: {response.text}")  # Imprime la respuesta cruda
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            return {"lat": float(data[0]["lat"]), "lng": float(data[0]["lon"])}
        else:
            print("⚠️ La API no devolvió resultados para esta ciudad.")
        
    except requests.RequestException as e:
        print(f"❌ Error al obtener coordenadas: {e}")
    except ValueError:
        print("❌ Error al decodificar JSON en obtener_coordenadas")
    
    return None  

def obtener_lugares_desde_overpass(ciudad, radio=5000):
    """Consulta Overpass API para obtener lugares turísticos y maneja errores."""
    query = f"""
        [out:json];
        (
            node["tourism"~"museum|artwork|monument|zoo|hotel|viewpoint|theme_park"](around:{radio},{ciudad["lat"]},{ciudad["lng"]});
            node["amenity"~"restaurant|cafe|bar|cinema|theatre"](around:{radio},{ciudad["lat"]},{ciudad["lng"]});
        );
        out;
    """
    url = f"https://overpass-api.de/api/interpreter?data={query}"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        lugares = [
            {
                "nombre": lugar.get("tags", {}).get("name", "Sin Nombre"),
                "tipo": lugar.get("tags", {}).get("tourism", lugar.get("tags", {}).get("amenity", "N/A"))
            }
            for lugar in data.get("elements", [])
        ]
        return lugares[:5]  # Limitamos a 5 resultados para respuestas más directas
    
    except requests.RequestException as e:
        print(f"Error al obtener lugares desde Overpass: {e}")
    except ValueError:
        print("Error al decodificar JSON en obtener_lugares_desde_overpass")
    
    return []

def obtener_respuesta_usuario(mensaje):
    """Responde según el mensaje del usuario y puede integrar lugares en tiempo real."""
    mensaje = mensaje.lower()
    
    if "lugares turísticos en" in mensaje:
        ciudad_nombre = mensaje.replace("lugares turísticos en", "").strip()
        coordenadas = obtener_coordenadas(ciudad_nombre)
        if coordenadas:
            lugares = obtener_lugares_desde_overpass(coordenadas)
            if lugares:
                respuesta = "Aquí tienes algunos lugares interesantes en " + ciudad_nombre + "\n"
                respuesta += "\n".join([f"- {l['nombre']} ({l['tipo']})" for l in lugares])
                return respuesta
            else:
                return "No encontré lugares turísticos en esa ciudad."
        else:
            return "No pude encontrar la ubicación de esa ciudad."
    
    respuestas = {
        "hola": "¡Hola! ¿En qué puedo ayudarte con tu viaje?",
        "qué puedo hacer": "Puedes generar un itinerario personalizado según tu destino, intereses y presupuesto.",
        "gracias": "¡De nada! Espero que tengas un gran viaje.",
    }
    
    for clave in respuestas:
        if clave in mensaje:
            return respuestas[clave]
    
    return random.choice([
        "No estoy seguro de entender. ¿Puedes reformular tu pregunta?",
        "Lo siento, no tengo información sobre eso. ¿Quieres que te ayude con un itinerario?",
        "Podría ayudarte con recomendaciones de viaje, itinerarios o lugares turísticos. ¡Pregúntame algo!"
    ])

@chatbot_bp.route('/chatbot', methods=['POST'])
def chatbot():
    data = request.json
    mensaje_usuario = data.get("mensaje", "")
    respuesta = obtener_respuesta_usuario(mensaje_usuario)
    return jsonify({"respuesta": respuesta})

# Registrar el blueprint en la aplicación Flask

def register_chatbot(app):
    app.register_blueprint(chatbot_bp)
    