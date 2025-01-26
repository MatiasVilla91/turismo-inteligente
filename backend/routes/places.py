import requests
from flask import Blueprint, request, jsonify

places_bp = Blueprint("places", __name__)

@places_bp.route("/places", methods=["GET"])
def get_places():
    lat = request.args.get("lat", "-34.6037")  # Coordenadas por defecto: Buenos Aires
    lng = request.args.get("lng", "-58.3816")
    radius = request.args.get("radius", "100")  # Radio en metros

    # Consulta a Overpass API
    url = f"https://overpass-api.de/api/interpreter?data=[out:json];node[tourism](around:{radius},{lat},{lng});node[leisure=park](around:{radius},{lat},{lng});node[amenity=cafe](around:{radius},{lat},{lng});out;"
    print(f"Consulta a Overpass: {url}")
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        places = [
            {
                "name": element.get("tags", {}).get("name", "Sin Nombre"),
                "lat": element["lat"],
                "lng": element["lon"],
                "type": element.get("tags", {}).get("tourism", "N/A"),
            }
            for element in data.get("elements", [])
        ]
        return jsonify(places)
    else:
        return jsonify({"error": "Error al obtener datos"}), 500
