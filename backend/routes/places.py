import requests
from flask import Blueprint, request, jsonify

places_bp = Blueprint("places", __name__)

@places_bp.route("/places", methods=["GET"])
def get_places():
    lat = request.args.get("lat", "-34.6037")  # Coordenadas por defecto: Buenos Aires
    lng = request.args.get("lng", "-58.3816")
    radius = request.args.get("radius", "1000")  # Radio en metros
    category = request.args.get("category", "")  # Recibimos la categoría

    if not (lat and lng):
        return jsonify({"error": "Parámetros lat y lng son obligatorios"}), 400

    # Definimos las categorías válidas y sus tags correspondientes
    categories = {
        "museum": "tourism=museum",
        "hotel": "tourism=hotel",
        "attraction": "tourism=attraction",
        "monument": "historic=monument",
        "park": "leisure=park",
        "restaurant": "amenity=restaurant",
        "cafe": "amenity=cafe",
    }

    # Validamos la categoría
    if category and category not in categories:
        return jsonify({"error": f"Categoría no válida. Categorías permitidas: {', '.join(categories.keys())}"}), 400

    # Construimos la consulta para Overpass API
    query = "[out:json];"
    if category:  # Si se especifica una categoría, usamos su filtro
        query += f"node[{categories[category]}](around:{radius},{lat},{lng});"
    else:  # Si no, traemos todas las categorías
        for cat_tag in categories.values():
            query += f"node[{cat_tag}](around:{radius},{lat},{lng});"
    query += "out;"

    url = f"https://overpass-api.de/api/interpreter?data={query}"
    print(f"Consulta a Overpass: {url}")
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        places = [
            {
                "name": element.get("tags", {}).get("name", "Sin Nombre"),
                "lat": element["lat"],
                "lng": element["lon"],
                "category": category or element.get("tags", {}).get("tourism", "N/A"),  # Etiqueta de categoría
            }
            for element in data.get("elements", [])
        ]
        return jsonify(places)
    else:
        return jsonify({"error": "Error al obtener datos"}), 500
