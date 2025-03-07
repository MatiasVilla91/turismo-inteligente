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
            print(f"🔍 Ciudad detectada correctamente: {ciudad_detectada}")  # 🔥 DEBUG

            break  

    return categoria_detectada, ciudad_detectada


overpass_cache = TTLCache(maxsize=50, ttl=3600)  # Cache de 50 consultas por 1 hora


import requests
from cachetools import TTLCache
from unidecode import unidecode

# Cache para evitar consultas repetidas en poco tiempo
overpass_cache = TTLCache(maxsize=100, ttl=3600)  # Cachea hasta 100 consultas por 1 hora

def consultar_overpass(ciudad, categoria):
    """Consulta Overpass API para obtener lugares de una categoría en una ciudad."""
    
    # 🔥 Clave de cache para evitar repetición de consultas
    cache_key = f"{unidecode(ciudad.lower())}_{categoria}"
    if cache_key in overpass_cache:
        print(f"🛑 Usando datos en caché para {ciudad} - {categoria}")
        return overpass_cache[cache_key]

    # 🔍 Selección de etiquetas según la categoría solicitada
    if categoria == "hospedarse":
        tipos = ['tourism=hotel', 'tourism=hostel', 'tourism=motel', 'amenity=hotel']
    elif categoria == "comer":
        tipos = ['amenity=restaurant', 'amenity=cafe', 'amenity=fast_food', 'amenity=food_court']
    elif categoria == "compras":
        tipos = ['shop=mall', 'shop=supermarket', 'shop=department_store']
    elif categoria == "turismo":
        tipos = ['tourism=museum', 'tourism=monument', 'tourism=zoo', 'tourism=theme_park']
    else:
        tipos = ["tourism", "amenity"]

    # 🔹 Generar consulta Overpass con los filtros adecuados
    consulta_tipos = "\n".join(f'node["{t.split("=")[0]}"="{t.split("=")[1]}"](area.searchArea);' for t in tipos)

    query = f"""
    [out:json];
    area[name="{ciudad}"]->.searchArea;
    (
      {consulta_tipos}
    );
    out center;
    """

    # 🔥 Endpoint alternativo en caso de bloqueo
    overpass_urls = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter"
    ]

    for overpass_url in overpass_urls:
        try:
            print(f"📡 Consultando Overpass: {overpass_url} para {ciudad} ({categoria})")
            response = requests.get(overpass_url, params={"data": query}, timeout=30)
            response.raise_for_status()
            data = response.json()

            # 📌 Procesar lugares encontrados
            lugares = []
            for elem in data.get("elements", [])[:20]:  # Limitar a 20 resultados
                tags = elem.get("tags", {})
                nombre = tags.get("name", "").strip()
                direccion = tags.get("addr:street", "Dirección no disponible").strip()
                tipo = tags.get("tourism", tags.get("amenity", "Categoría desconocida")).replace("_", " ").capitalize()
                contacto = tags.get("contact:website", tags.get("website", "Sin sitio web")).strip()

                lat, lon = elem.get("lat"), elem.get("lon")

                # 🚫 FILTRO de lugares inútiles
                if not nombre or nombre.lower() in ["nombre desconocido", "information", "artwork", "point"]:
                    continue  # Omitir lugares irrelevantes

                if lat and lon:
                    lugares.append(f"{nombre} ({tipo}) - {direccion} - Más info: {contacto}-{lat} {lon}")

            if lugares:
                overpass_cache[cache_key] = lugares  # Guardar en caché si hay resultados
                return lugares

        except requests.RequestException as e:
            print(f"⚠ Error en Overpass ({overpass_url}): {e}")

    return ["⚠ No encontré lugares relevantes en la zona o Overpass está caído."]






def limpiar_respuesta_hf(mensaje, respuesta_hf):
    """Elimina frases genéricas y hace que la respuesta suene más natural."""
    respuesta_hf = respuesta_hf.replace(mensaje, "").strip()
    
    frases_a_eliminar = [
        "Si necesitas más información, házmelo saber.",
        "Puedo ayudarte con más detalles si lo requieres.",
        "Por favor, dime si necesitas algo más.",
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
Eres un asistente de viajes experto en recomendar destinos, actividades y opciones según el interés del usuario. Responde de forma clara, directa y conversacional, adaptándote al contexto y necesidades del viajero.
Responde de forma clara, conversacional y amigable, adaptándote a lo que busca el viajero.

- Evita respuestas genéricas o demasiado formales.
- Proporciona detalles útiles como nombres de lugares, horarios aproximados y precios estimados si aplica.
- Si el usuario menciona una ciudad, sugiere actividades relevantes basadas en la categoría detectada.
- Si la consulta es ambigua, pide más información de manera natural.
- Si mencionan hoteles, describe cada uno en una frase breve y atractiva.
- Si se trata de monumentos, museos o lugares turísticos, destaca qué hace especial a cada uno.
- Usa emojis cuando sea apropiado para hacer la respuesta más visualmente atractiva.


Usuario: {mensaje}
Chatbot:
"""


    data = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 500,
            "return_full_text": False,
            "temperature": 0.8,
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


def obtener_historial_usuario(user_id, limite=10):
    """Obtiene los últimos 3 mensajes del usuario para contexto en la conversación."""
    try:
        historial = consultar_db(f"SELECT mensaje FROM historial WHERE user_id = %s ORDER BY timestamp DESC LIMIT %s", (user_id, limite))
        return [h["mensaje"] for h in historial] if historial else []
    except Exception as e:
        print(f"Error obteniendo historial: {e}")
        return []
    
import requests
import requests
from geopy.distance import geodesic

import requests
from geopy.distance import geodesic

def obtener_coordenadas(nombre_lugar, ciudad_referencia=None, umbral_km=50):
    """
    Obtiene coordenadas de un lugar con Nominatim, priorizando lugares dentro del país correcto.
    Si `ciudad_referencia` se proporciona, filtra lugares demasiado lejanos.
    """
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={nombre_lugar}&format=json&limit=5"
        headers = {"User-Agent": "turismo-inteligente"}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()

        if not data:
            print(f"⚠ No se encontraron coordenadas para: {nombre_lugar}")
            return None, None
        
        # 🔍 Filtramos lugares que sean realmente ciudades o puntos de interés
        lugares_validos = [l for l in data if l.get("type") in ["city", "town", "village", "municipality", "hotel", "tourism", "attraction"]]

        if not lugares_validos:
            print(f"⚠ No se encontró una ciudad clara para: {nombre_lugar}, usando primer resultado disponible.")
            mejor_opcion = data[0]  # Última opción si no hay ciudades claras
        else:
            # 🔥 Elegir la ciudad con mayor importancia (prioriza lugares reconocidos)
            mejor_opcion = max(lugares_validos, key=lambda l: l.get("importance", 0))
        
        if "nombre desconocido" in mejor_opcion.get("name", "").lower():
            mejor_opcion["name"] = mejor_opcion.get("display_name", "Ubicación sin nombre")

        lat, lon = float(mejor_opcion["lat"]), float(mejor_opcion["lon"])
        pais_detectado = mejor_opcion.get("display_name", "").split(",")[-1].strip()

        # 🛑 FILTRAR LUGARES ERRÓNEOS POR DISTANCIA
        if ciudad_referencia:
            ref_lat, ref_lon = ciudad_referencia
            distancia = geodesic((ref_lat, ref_lon), (lat, lon)).km
            if distancia > umbral_km:
                print(f"❌ DESCARTADO: {nombre_lugar} ({lat}, {lon}) por estar a {distancia:.2f} km de la ciudad base.")
                return None, None

        print(f"📌 Ciudad final: {nombre_lugar} | País detectado: {pais_detectado} | Coordenadas finales: {lat}, {lon}")
        return lat, lon

    except requests.RequestException as e:
        print(f"❌ Error al obtener coordenadas de '{nombre_lugar}': {e}")
        return None, None





from geopy.distance import geodesic

def filtrar_lugares_invalidos(ciudad_lat, ciudad_lon, lugares, umbral_km=50):
    """
    Filtra lugares que están a más de `umbral_km` km de la ciudad detectada.
    Esto previene errores como Madrid con lugares en Panamá.
    """
    lugares_validos = []
    for lugar in lugares:
        lugar_lat = float(lugar.get("lat", 0))
        lugar_lon = float(lugar.get("lon", 0))
        distancia = geodesic((ciudad_lat, ciudad_lon), (lugar_lat, lugar_lon)).km

        if distancia <= umbral_km:
            lugares_validos.append(lugar)
        else:
            print(f"❌ DESCARTADO: {lugar.get('name', 'Lugar desconocido')} ({lugar_lat}, {lugar_lon}) "
                  f"por estar a {distancia:.2f} km de {ciudad_lat}, {ciudad_lon}")

    return lugares_validos



@chatbot_bp.route('/chatbot', methods=['POST'])
def chatbot():
    data = request.json

    if not data or "mensaje" not in data:
        return jsonify({"respuesta": "Error: El JSON enviado no tiene el campo 'mensaje'."})

    user_id = data.get("user_id")  # Identificar al usuario , "default"
    mensaje_usuario = data.get("mensaje", "").strip()
    user_id = data.get("user_id", "default")

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
    lat_ciudad, lon_ciudad = obtener_coordenadas(ciudad_detectada)
        
    if ciudad_detectada and categoria_detectada:
        lugares = consultar_overpass(ciudad_detectada, categoria_detectada)

        if lugares and len(lugares) > 0 and "Error" not in lugares[0]:
            coordenadas = []
            
            # Obtener coordenadas de los primeros lugares
            for lugar in lugares[:5]:  # Limitamos a 5 resultados
                try:
                    nombre = lugar.split("(")[0].strip()
                    lat, lon = obtener_coordenadas(nombre,ciudad_referencia=(lat_ciudad, lon_ciudad))  # Extraer solo el nombre
                    if lat and lon:
                        coordenadas.append({"nombre": lugar, "lat": lat, "lon": lon})
                except:
                    continue

            respuesta = f"En {ciudad_detectada}, puedes encontrar {categoria_detectada} en:\n- " + "\n- ".join(lugares[:5])
            guardar_mensaje(user_id, mensaje_usuario, respuesta)
            
            return jsonify({"respuesta": respuesta, "coordenadas": coordenadas})

        return jsonify({"respuesta": f"No encontré lugares exactos para {categoria_detectada} en {ciudad_detectada}, intenta preguntarme de otra manera."})

    # Evitar errores con mensajes genéricos
    if mensaje_usuario.lower() in ["hola", "hi", "hey"]:
        return jsonify({"respuesta": "¡Hola! ¿En qué puedo ayudarte con tu viaje?"})
    
    # Si no detectamos ciudad ni intención clara, usamos Hugging Face como fallback
    respuesta = obtener_respuesta_huggingface(mensaje_usuario)
    respuesta_traducida = traducir_a_espanol(respuesta)

    guardar_mensaje(user_id, mensaje_usuario, respuesta_traducida)
    # Obtener historial reciente del usuario
    historial_usuario = obtener_historial_usuario(user_id)
    contexto = "\n".join(historial_usuario)
    
    # Construir prompt con contexto limitado
    prompt = f"""
    {contexto}
    Usuario: {mensaje_usuario}
    Chatbot:
    """
    
    respuesta = obtener_respuesta_huggingface(prompt)
    respuesta_limpia = limpiar_respuesta_hf(mensaje_usuario, respuesta)
    
    # Guardar mensaje en historial si la BD está funcionando
    try:
        guardar_mensaje(user_id, mensaje_usuario, respuesta_limpia)
    except Exception as e:
        print(f"⚠ Error guardando historial: {e}")
    
    return jsonify({"respuesta": respuesta_limpia})

    return jsonify({"respuesta": respuesta_traducida, "coordenadas": []})  # Enviar coordenadas vacías si no se encontraron
    
    
   


# Registrar el blueprint en la aplicación Flask
def register_chatbot(app):
    app.register_blueprint(chatbot_bp)  