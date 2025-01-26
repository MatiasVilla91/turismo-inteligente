from flask import Flask, request, jsonify
from flask_cors import CORS
from routes.places import places_bp  # Importa el blueprint

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def home():
    return "<h1>Backend funcionando correctamente</h1>"

@app.route('/itinerarios', methods=['POST'])
def generar_itinerario():
    try:
        # Capturamos los datos enviados desde el frontend
        datos_usuario = request.json
        intereses = datos_usuario.get("intereses", "cultura")
        presupuesto = int(datos_usuario.get("presupuesto", 0))
        duracion = int(datos_usuario.get("duracion", 1))

        # Ejemplo de destinos disponibles
        destinos_disponibles = [
            {"nombre": "Museo de Arte Moderno", "costo": 50, "tipo": "cultura"},
            {"nombre": "Parque Nacional", "costo": 30, "tipo": "aventura"},
            {"nombre": "Restaurante Gourmet", "costo": 70, "tipo": "gastronomia"},
            {"nombre": "Playa Exclusiva", "costo": 100, "tipo": "relajacion"},
        ]

        # Filtramos los destinos según los intereses
        destinos_filtrados = [
            destino for destino in destinos_disponibles if destino["tipo"] in intereses
        ]

        # Seleccionamos los destinos que se ajusten al presupuesto
        destinos_seleccionados = []
        total_gastado = 0

        for destino in destinos_filtrados:
            if total_gastado + destino["costo"] <= presupuesto:
                destinos_seleccionados.append(destino)
                total_gastado += destino["costo"]
# Si no se seleccionaron destinos, devolvemos un mensaje alternativo
        if not destinos_seleccionados:
            return jsonify({
        "mensaje": "No se encontraron destinos dentro del presupuesto.",
        "itinerario": {"destinos": [], "presupuesto_total": 0, "dias": duracion}
    })        
        # Retornamos el itinerario generado
        itinerario = {
            "destinos": destinos_seleccionados,
            "presupuesto_total": total_gastado,
            "dias": duracion,
        }

        return jsonify({
            "mensaje": "Itinerario generado exitosamente",
            "itinerario": itinerario
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
