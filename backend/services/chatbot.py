import requests
from flask import Blueprint, request, jsonify
import os
from dotenv import load_dotenv
from deep_translator import GoogleTranslator
import re
import pickle
from unidecode import unidecode

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

# Cargar ciudades desde Overpass
CIUDADES_OVERPASS = obtener_ciudades_overpass()

def detectar_intencion(mensaje):
    """
    Detecta la intención del usuario y la ciudad basándose en palabras clave.
    Retorna una tupla (categoria_detectada, ciudad_detectada).
    """
    mensaje = unidecode(mensaje.lower())
    categoria_detectada = None
    ciudad_detectada = None

    for categoria, palabras in VERBOS_CLAVE.items():
        if any(re.search(rf"\b{unidecode(palabra)}\b", mensaje) for palabra in palabras):
            categoria_detectada = categoria
            break  

    for palabra in mensaje.split():
        if palabra in CIUDADES_OVERPASS:
            ciudad_detectada = palabra.capitalize()
            break  

    return categoria_detectada, ciudad_detectada

def consultar_overpass(ciudad, categoria):
    """Consulta Overpass API para obtener lugares de una categoría en una ciudad, limitando resultados y filtrando correctamente."""
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
        response = requests.get(overpass_url, params={"data": query})
        response.raise_for_status()
        data = response.json()

        lugares = []
        for elem in data.get("elements", [])[:10]:  # Limitar a 10 resultados
            tags = elem.get("tags", {})

            nombre = tags.get("name", "Nombre desconocido")
            direccion = tags.get("addr:street", "Dirección no disponible")
            tipo = tags.get("amenity", tags.get("tourism", "Categoría desconocida")).replace("_", " ").capitalize()
            contacto = tags.get("contact:website", tags.get("website", "Sin sitio web"))

            if nombre:
                lugares.append(f"{nombre} ({tipo}) - {direccion} - Más info: {contacto}")

        return lugares if lugares else ["No encontré lugares relevantes en la zona."]
    
    except requests.RequestException as e:
        return [f"Error en Overpass API: {str(e)}"]


def limpiar_respuesta_hf(mensaje, respuesta_hf):
    """Limpia la respuesta de Hugging Face para evitar repeticiones del mensaje original."""
    respuesta_hf = respuesta_hf.replace(mensaje, "").strip()
    
    # Eliminar espacios extra y cortar respuestas muy largas
    return re.sub(r"\s+", " ", respuesta_hf)

def obtener_respuesta_huggingface(mensaje):
    """Consulta un modelo de Hugging Face para obtener una respuesta conversacional con mejor manejo de errores."""
    if not mensaje:
        return "Error: Mensaje vacío."

    data = {
    "inputs": mensaje,
    "parameters": {
        "max_new_tokens": 1000,  # Reducimos a 500 tokens para evitar respuestas infinitas
        "return_full_text": False,  # Evita que el modelo repita la entrada
        "temperature": 0.1,  # Controla la creatividad del modelo
        "top_p": 0.9,  # Filtra palabras poco probables
        "repetition_penalty": 1.2  # Penaliza repeticiones en la respuesta
    }
}

    try:
        response = requests.post(API_URL, headers=HEADERS, json=data, timeout=30)
        response.raise_for_status()
        respuesta_json = response.json()

        print("🔍 Respuesta completa de Hugging Face:", respuesta_json)  # Imprimir respuesta completa

        if isinstance(respuesta_json, list) and "generated_text" in respuesta_json[0]:
            return limpiar_respuesta_hf(mensaje, respuesta_json[0]["generated_text"])
        elif "error" in respuesta_json:
            return "Parece que el servicio está ocupado, intenta de nuevo más tarde."
        else:
            return "No se pudo obtener una respuesta válida."

    except requests.Timeout:
        return "El servidor de IA tardó demasiado en responder. Inténtalo de nuevo más tarde."
    except requests.RequestException as e:
        return f"Error al procesar la consulta: {str(e)}"

    

def traducir_a_espanol(texto):
    """Traduce el texto al español y resume si es demasiado largo."""
    try:
        traducido = GoogleTranslator(source='auto', target='es').translate(texto)
        
        return traducido
    except Exception as e:
        print(f"Error al traducir: {e}")
        return texto


@chatbot_bp.route('/chatbot', methods=['POST'])
def chatbot():
    data = request.json

    if not data or "mensaje" not in data:
        return jsonify({"respuesta": "Error: El JSON enviado no tiene el campo 'mensaje'."})

    mensaje_usuario = data.get("mensaje", "").strip()

    if not mensaje_usuario:
        return jsonify({"respuesta": "Por favor, envía una consulta válida."})

    # Detectar intención y ciudad
    categoria_detectada, ciudad_detectada = detectar_intencion(mensaje_usuario)

    if ciudad_detectada and categoria_detectada:
        lugares = consultar_overpass(ciudad_detectada, categoria_detectada)

        # Si Overpass encuentra lugares, los mostramos de manera clara
        if lugares and len(lugares) > 0 and "Error" not in lugares[0]:
            respuesta = f"En {ciudad_detectada}, puedes encontrar {categoria_detectada} en:\n- " + "\n- ".join(lugares[:7])  # Mostramos hasta 5 lugares
            return jsonify({"respuesta": respuesta})

        # Si Overpass no encontró nada, pero tenemos una intención, damos una respuesta más humana
        return jsonify({"respuesta": f"No encontré lugares exactos para {categoria_detectada} en {ciudad_detectada},  preguntame de otra manera."})

    # Si no detectamos ciudad ni intención clara, usamos Hugging Face como fallback
    respuesta = obtener_respuesta_huggingface(mensaje_usuario)

    # Traducimos la respuesta
    respuesta_traducida = traducir_a_espanol(respuesta)
    
    # Si Hugging Face responde con un artículo largo, lo acortamos
    #if len(respuesta_traducida) > 300:
        #respuesta_traducida = respuesta_traducida[:500] + "..."

        
    return jsonify({"respuesta": respuesta_traducida})


# Registrar el blueprint en la aplicación Flask
def register_chatbot(app):
    app.register_blueprint(chatbot_bp)
