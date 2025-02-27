import requests
from flask import Blueprint, request, jsonify
import os
from dotenv import load_dotenv
from deep_translator import GoogleTranslator
import re
import pickle
from unidecode import unidecode
from database import guardar_mensaje, obtener_historial, consultar_db

from functools import lru_cache
from cachetools import TTLCache


# Cargar variables de entorno desde .env
load_dotenv()
HF_API_KEY = os.getenv("HF_API_KEY")

chatbot_bp = Blueprint('chatbot', __name__)

# Modelo Hugging Face
HF_MODEL = "HuggingFaceH4/zephyr-7b-beta"
API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
HEADERS = {"Authorization": f"Bearer {HF_API_KEY}"}
CIUDADES_CACHE = "ciudades_overpass.pkl"


# 🌍 Categorías de lugares con etiquetas Overpass
CATEGORIAS_LUGARES = {
    "comida barata": ["fast_food", "restaurant", "food_court", "cafe"],
    "comida lujosa": ["restaurant"],
    "hoteles baratos": ["hostel", "motel"],
    "hoteles de lujo": ["hotel"],
    "bares": ["bar", "pub"],
    "discotecas": ["nightclub"],
    "museos": ["museum"],
    "parques": ["park"],
    "monumentos": ["monument"],
    "compras": ["mall", "marketplace", "supermarket"],
    "transporte": ["bus_station", "train_station", "car_rental"],
}

# 🧠 Verbos y términos clave para detección de intención
VERBOS_CLAVE = {
    "comer": ["comer", "cenar", "almorzar", "desayunar"],
    "hospedarse": ["dormir", "hospedarme", "quedarme", "hotel", "hostel"],
    "turistear": ["visitar", "explorar", "conocer", "ver"],
    "salir de noche": ["salir", "fiesta", "discoteca", "bar"],
    "comprar": ["comprar", "shopping", "mercado"],
    "transporte": ["alquilar", "movilizarme", "taxi", "bus", "tren"],
}

def obtener_ciudades_overpass():
    """Consulta Overpass API para obtener ciudades y las guarda en caché."""
    if os.path.exists(CIUDADES_CACHE):
        with open(CIUDADES_CACHE, "rb") as f:
            return pickle.load(f)

    overpass_url = "https://overpass-api.de/api/interpreter"
    query = """
    [out:json];
    node[place=city](if: is_in('Argentina'));  # Filtrar solo Argentina
    out;
    """
    try:
        response = requests.get(overpass_url, params={"data": query})
        data = response.json()
        ciudades = {element["tags"]["name"].lower() for element in data.get("elements", []) if "tags" in element and "name" in element["tags"]}
        
        with open(CIUDADES_CACHE, "wb") as f:
            pickle.dump(ciudades, f)  # Guardar en caché

        return ciudades
    except Exception as e:
        print("Error al obtener ciudades:", e)
        return set()

# Cargar ciudades desde Overpass con manejo de errores
try:
    CIUDADES_OVERPASS = obtener_ciudades_overpass()
    if not CIUDADES_OVERPASS:
        CIUDADES_OVERPASS = set()  # Evita problemas si la carga falla
except Exception as e:
    print(f"Error al cargar ciudades de Overpass: {e}")
    CIUDADES_OVERPASS = set()

def detectar_intencion(mensaje):
    """
    Detecta la intención del usuario y la ciudad basándose en palabras clave.
    Retorna una tupla (categoria_detectada, ciudad_detectada).
    """
    mensaje = unidecode(mensaje.lower())  # Remueve acentos y normaliza
    categoria_detectada = None
    ciudad_detectada = None

    # 🔍 Detectar categoría
    for categoria, palabras in VERBOS_CLAVE.items():
        if any(re.search(rf"\b{unidecode(palabra)}\b", mensaje) for palabra in palabras):
            categoria_detectada = categoria
            break  

    # 🔍 Buscar ciudad con re.search() en lugar de in
    for ciudad in CIUDADES_OVERPASS:
        ciudad_normalizada = unidecode(ciudad.lower())
        if re.search(rf"\b{ciudad_normalizada}\b", mensaje):
            ciudad_detectada = ciudad.capitalize()
            break  

    return categoria_detectada, ciudad_detectada


overpass_cache = TTLCache(maxsize=50, ttl=3600)  # Cache de 50 consultas por 1 hora


def consultar_overpass(ciudad, categoria):
    """Consulta Overpass API para obtener lugares de una categoría en una ciudad."""
    
    cache_key = f"{ciudad}_{categoria}"
    if cache_key in overpass_cache:
        return overpass_cache[cache_key]

    overpass_url = "http://overpass-api.de/api/interpreter"
    tipos = CATEGORIAS_LUGARES.get(categoria, ["tourism"])
    consulta_tipos = "\n".join(f'node["{tipo}"](area.searchArea);' for tipo in tipos)

    query = f"""
    [out:json];
    area[name="{ciudad}"]->.searchArea;
    (
      {consulta_tipos}
    );
    out center;
    """

    try:
        response = requests.get(overpass_url, params={"data": query}, timeout=30)
        response.raise_for_status()
        data = response.json()

        lugares = []
        for elem in data.get("elements", [])[:10]:  # Limitar a 10 resultados
            tags = elem.get("tags", {})
            nombre = tags.get("name", "Nombre desconocido")
            direccion = tags.get("addr:street", "Dirección no disponible")
            tipo = tags.get("amenity", tags.get("tourism", "Categoría desconocida")).replace("_", " ").capitalize()
            contacto = tags.get("contact:website", tags.get("website", "Sin sitio web"))
            
            lat = elem.get("lat", None)
            lon = elem.get("lon", None)

            if nombre and lat and lon:
                print(f"📍 Lugar encontrado: {nombre} ({tipo}) - Coordenadas: {lat}, {lon}")  # 🔥 Imprimir coordenadas
                lugares.append(f"{nombre} ({tipo}) - {direccion} - Más info: {contacto}")

        if lugares:
            overpass_cache[cache_key] = lugares  # Guardar en caché solo si hay resultados

        return lugares if lugares else ["No encontré lugares relevantes en la zona."]
    
    except requests.RequestException as e:
        print(f"Error en Overpass API: {e}")
        return ["Error en Overpass API, intenta de nuevo más tarde."]





def limpiar_respuesta_hf(mensaje, respuesta_hf):
    """Elimina frases genéricas y hace que la respuesta suene más natural."""
    respuesta_hf = respuesta_hf.replace(mensaje, "").strip()

    frases_a_eliminar = [
        "Háganos saber si tiene otras preferencias o requisitos.",
        "Espero que esta información le sea útil.",
        "Será un placer ayudarle con su reserva.",
        "Hacemos que su estadía sea realmente memorable."
    ]

    for frase in frases_a_eliminar:
        respuesta_hf = respuesta_hf.replace(frase, "").strip()

    return re.sub(r"\s+", " ", respuesta_hf) # Limita la longitud máxima[:275] 





def obtener_respuesta_huggingface(mensaje):
    """Genera una respuesta más natural y específica usando Hugging Face con mejor manejo de errores."""
    if not mensaje:
        return "Por favor, dime más detalles para poder ayudarte."

    prompt = f"""
Responde como un asistente de viajes inteligente. Sé claro, directo y conversacional. No uses frases genéricas ni demasiado formales.

Usuario: {mensaje}
Chatbot:
"""

    data = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 500,
            "return_full_text": False,
            "temperature": 0.7,
            "top_p": 0.9,
            "repetition_penalty": 1.2
        }
    }

    try:
        response = requests.post(API_URL, headers=HEADERS, json=data, timeout=30)
        response.raise_for_status()
        respuesta_json = response.json()

        if isinstance(respuesta_json, list) and "generated_text" in respuesta_json[0]:
            return limpiar_respuesta_hf(mensaje, respuesta_json[0]["generated_text"])
        elif "error" in respuesta_json:
            return "Parece que mi servicio de IA está ocupado. ¿Quieres que intente otra consulta o te sugiera actividades populares?"
        else:
            return "No pude generar una respuesta válida. ¿Te gustaría probar con otra pregunta?"

    except requests.Timeout:
        return "El servidor tardó demasiado en responder. ¿Quieres que intente darte una respuesta alternativa?"
    except requests.RequestException as e:
        return f"Hubo un problema con el servicio de IA: {str(e)}"





def traducir_a_espanol(texto):
    """Traduce el texto al español asegurando que no se trunque."""
    try:
        if len(texto) > 500:  # Si el texto es muy largo, dividir en fragmentos
            partes = [texto[i:i+500] for i in range(0, len(texto), 500)]
            traducido = " ".join([GoogleTranslator(source='auto', target='es').translate(p) for p in partes])
        else:
            traducido = GoogleTranslator(source='auto', target='es').translate(texto)
        
        return traducido
    except Exception as e:
        print(f"Error al traducir: {e}")
        return texto


def obtener_historial(user_id, limite=5):
    """Obtiene los últimos 5 mensajes del usuario para contexto en la conversación."""
    try:
        historial = consultar_db(f"SELECT mensaje FROM historial WHERE user_id = %s ORDER BY timestamp DESC LIMIT %s", (user_id, limite))
        return [h["mensaje"] for h in historial] if historial else []
    except Exception as e:
        print(f"Error obteniendo historial: {e}")
        return []
    
def obtener_coordenadas(nombre_lugar):
    """Obtiene coordenadas reales usando OpenStreetMap (Nominatim API)."""
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={nombre_lugar}&format=json&limit=1"
        response = requests.get(url, headers={"User-Agent": "turismo-inteligente"})
        response.raise_for_status()
        data = response.json()

        if data:
            lat, lon = float(data[0]["lat"]), float(data[0]["lon"])
            print(f"📌 Coordenadas obtenidas para '{nombre_lugar}': {lat}, {lon}")  # 🔥 Imprimir en consola
            return lat, lon

        print(f"⚠ No se encontraron coordenadas para: {nombre_lugar}")
        return None, None  # Si no se encuentran coordenadas
    except requests.RequestException as e:
        print(f"❌ Error al obtener coordenadas de '{nombre_lugar}': {e}")
        return None, None





@chatbot_bp.route('/chatbot', methods=['POST'])
def chatbot():
    data = request.json

    if not data or "mensaje" not in data:
        return jsonify({"respuesta": "Error: El JSON enviado no tiene el campo 'mensaje'."})

    user_id = data.get("user_id")  # Identificar al usuario , "default"
    mensaje_usuario = data.get("mensaje", "").strip()

    if not mensaje_usuario:
        return jsonify({"respuesta": "Por favor, envía una consulta válida."})

    # 🧠 OBTENER HISTORIAL DEL USUARIO
    historial = obtener_historial(user_id)

    # 📝 CONSTRUIR EL CONTEXTO DEL CHATBOT
    contexto = "\n".join(historial)  # Se usa el historial previo
    prompt = f"""
    {contexto}
    Usuario: {mensaje_usuario}
    Chatbot:
    """
    print(f"🟢 MENSAJE RECIBIDO: {mensaje_usuario}")  # 🔥 VERIFICACIÓN

    # 🔍 DETECTAR INTENCIÓN Y CIUDAD
    categoria_detectada, ciudad_detectada = detectar_intencion(mensaje_usuario)
        
    if ciudad_detectada and categoria_detectada:
        lugares = consultar_overpass(ciudad_detectada, categoria_detectada)

        if lugares and len(lugares) > 0 and "Error" not in lugares[0]:
            coordenadas = []
            
            # Obtener coordenadas de los primeros lugares
            for lugar in lugares[:5]:  # Limitamos a 5 resultados
                try:
                    nombre = lugar.split("(")[0].strip()
                    lat, lon = obtener_coordenadas(nombre)  # Extraer solo el nombre
                    if lat and lon:
                        coordenadas.append({"nombre": lugar, "lat": lat, "lon": lon})
                except:
                    continue

            respuesta = f"En {ciudad_detectada}, puedes encontrar {categoria_detectada} en:\n- " + "\n- ".join(lugares[:5])
            guardar_mensaje(user_id, mensaje_usuario, respuesta)
            
            return jsonify({"respuesta": respuesta, "coordenadas": coordenadas})

        return jsonify({"respuesta": f"No encontré lugares exactos para {categoria_detectada} en {ciudad_detectada}, intenta preguntarme de otra manera."})

    # Si no detectamos ciudad ni intención clara, usamos Hugging Face como fallback
    respuesta = obtener_respuesta_huggingface(mensaje_usuario)
    respuesta_traducida = traducir_a_espanol(respuesta)

    guardar_mensaje(user_id, mensaje_usuario, respuesta_traducida)

    return jsonify({"respuesta": respuesta_traducida, "coordenadas": []})  # Enviar coordenadas vacías si no se encontraron
    
    
   


# Registrar el blueprint en la aplicación Flask
def register_chatbot(app):
    app.register_blueprint(chatbot_bp)  