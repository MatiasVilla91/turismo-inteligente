import requests
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin

max_results = 100  # Reducir cantidad de lugares para pruebas
places_bp = Blueprint("places", __name__)
@cross_origin()

@places_bp.route("/places", methods=["GET"])
def obtener_lugares_cercanos():
    lat = request.args.get("lat", "-34.6037")  # Coordenadas por defecto: Buenos Aires
    lng = request.args.get("lng", "-58.3816")
    radius = request.args.get("radius", "1000")  # Radio en metros
    category = request.args.get("category", "all")  # Asegurar que category existe

    
    # 🔹 Optimización: Usar expresiones regulares para agrupar filtros similares
    category_mapping = {
        "all": """
            (
                node["amenity"~"cinema|cafe|restaurant|bar|theatre"](around:{radius},{lat},{lng});
                node["tourism"~"museum|artwork|hotel|monument|zoo"](around:{radius},{lat},{lng});
                node["shop"="mall"](around:{radius},{lat},{lng});
                node["leisure"="park"](around:{radius},{lat},{lng});
                node["natural"="beach"](around:{radius},{lat},{lng});
            )
        """,
        "cines": 'node["amenity"="cinema"](around:{radius},{lat},{lng})',
        "museos": 'node["tourism"="museum"](around:{radius},{lat},{lng})',
        "arte": 'node["tourism"="artwork"](around:{radius},{lat},{lng})',
        "parques": 'node["leisure"="park"](around:{radius},{lat},{lng})',
        "cafes": 'node["amenity"="cafe"](around:{radius},{lat},{lng})',
        "restaurantes": 'node["amenity"="restaurant"](around:{radius},{lat},{lng})',
        "bares": 'node["amenity"="bar"](around:{radius},{lat},{lng})',
        "hoteles": 'node["tourism"="hotel"](around:{radius},{lat},{lng})',
        "centros_comerciales": 'node["shop"="mall"](around:{radius},{lat},{lng})',
        "teatros": 'node["amenity"="theatre"](around:{radius},{lat},{lng})',
        "monumentos": 'node["tourism"="monument"](around:{radius},{lat},{lng})',
        "zoologicos": 'node["tourism"="zoo"](around:{radius},{lat},{lng})',
        "playas": 'node["natural"="beach"](around:{radius},{lat},{lng})',
    }
    
    # 🔹 Usamos una query única para traer todos los lugares
    query = f"""
        [out:json];
        (
            node["amenity"~"cinema|cafe|restaurant|bar|theatre"](around:{radius},{lat},{lng});
            node["tourism"~"museum|artwork|hotel|monument|zoo"](around:{radius},{lat},{lng});
            node["shop"="mall"](around:{radius},{lat},{lng});
            node["leisure"="park"](around:{radius},{lat},{lng});
            node["natural"="beach"](around:{radius},{lat},{lng});
        );
        out;
    """

    print(f"🚀 Realizando solicitud con la query:\n{query}")  # Debugging

    # ✅ Validar que la categoría sea válida
    if category not in category_mapping:
        return jsonify({"error": "Categoría inválida"}), 400

    # 🔍 Construcción optimizada de la consulta Overpass
    filter_query = category_mapping[category].format(radius=radius, lat=lat, lng=lng)

    query = f"""
        [out:json];
        {filter_query};
        out;
    """

    print(f"🚀 Realizando solicitud con la query:\n{query}")  # Debugging

    url = f"https://overpass-api.de/api/interpreter?data={query}"

  

    try:
        response = requests.get(url)
        
        if response.status_code == 429:
            print("❌ Overpass ha bloqueado la IP temporalmente. Espera unos minutos e intenta de nuevo.")
            return jsonify({"error": "Demasiadas solicitudes a Overpass. Espera unos minutos e intenta nuevamente."}), 429

        if response.status_code != 200:
            print(f"❌ Overpass API error: {response.status_code} - {response.text}")  # Debugging
            return jsonify({"error": f"Error en Overpass API. Código: {response.status_code}"}), 500

        data = response.json()
        elements = data.get("elements", [])

        if not elements:
            return jsonify([])

        places = [
        {
        "name": element.get("tags", {}).get("name", "Sin Nombre"),
        "lat": element.get("lat"),
        "lng": element.get("lon"),
        "type": element.get("tags", {}).get("tourism", element.get("tags", {}).get("amenity", "N/A")),
        "categoria": category if category != "all" else (
            "cines" if element.get("tags", {}).get("amenity") == "cinema" else
            "museos" if element.get("tags", {}).get("tourism") == "museum" else
            "arte" if element.get("tags", {}).get("tourism") == "artwork" else
            "parques" if element.get("tags", {}).get("leisure") == "park" else
            "cafes" if element.get("tags", {}).get("amenity") == "cafe" else
            "restaurantes" if element.get("tags", {}).get("amenity") == "restaurant" else
            "bares" if element.get("tags", {}).get("amenity") == "bar" else
            "hoteles" if element.get("tags", {}).get("tourism") == "hotel" else
            "centros_comerciales" if element.get("tags", {}).get("shop") == "mall" else
            "teatros" if element.get("tags", {}).get("amenity") == "theatre" else
            "monumentos" if element.get("tags", {}).get("tourism") == "monument" else
            "zoologicos" if element.get("tags", {}).get("tourism") == "zoo" else
            "playas" if element.get("tags", {}).get("natural") == "beach" else "Desconocido"
        ),
    }
    for element in elements[:max_results]
]

        return jsonify(places), 200

    except requests.RequestException as e:
        print(f"🚨 Error en la solicitud: {str(e)}")  # Debugging
        return jsonify({"error": f"Fallo en la solicitud a Overpass: {str(e)}"}), 500

    except Exception as e:
        print(f"🔥 Error inesperado: {str(e)}")  # Debugging
        return jsonify({"error": f"Error inesperado en el backend: {str(e)}"}), 500