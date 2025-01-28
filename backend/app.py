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
    data = request.get_json()
    try:
        # Capturamos los datos enviados desde el frontend
        datos_usuario = request.json
        intereses = datos_usuario.get("intereses", "cultura")  # Separar intereses por comas
        if isinstance(intereses, str):
            intereses = datos_usuario.get("intereses", "cultura")  # Si es una cadena, dividirla en una lista
        elif not isinstance(intereses, list):
            return jsonify({"error": "Formato inválido para intereses. Debe ser lista o cadena"}), 400 
        presupuesto = int(datos_usuario.get("presupuesto", 0))
        duracion = int(datos_usuario.get("duracion", 1))
        categorias_colores = {
             "cines": "#FF5733",
            "museos": "#33FF57",
             "arte": "#3357FF",
            "atracciones_turísticas": "#FFC300",
            "parques": "#8E44AD"
}

        # Ejemplo de destinos disponibles
        destinos_disponibles = [
    {"nombre": "Museo de Arte Moderno", "costo": 50, "tipo": "cultura", "categoria": "museos"},
    {"nombre": "Parque Nacional", "costo": 30, "tipo": "aventura", "categoria": "parques"},
    {"nombre": "Cine Central", "costo": 20, "tipo": "entretenimiento", "categoria": "cines"}
        ]
        
        for destino in destinos_disponibles:
            destino["color"] = categorias_colores.get(destino["categoria"], "#000000")  # Color por defecto negro


        # Filtrar destinos según los intereses
        destinos_filtrados = [
            destino for destino in destinos_disponibles if destino["tipo"] in intereses
        ]

        # Seleccionar destinos dentro del presupuesto
        destinos_seleccionados = []
        total_gastado = 0

        for destino in destinos_filtrados:
            if total_gastado + destino["costo"] <= presupuesto:
                destinos_seleccionados.append(destino)
                total_gastado += destino["costo"]

        # Si no se seleccionaron destinos, devolver un mensaje alternativo
        if not destinos_seleccionados:
            return jsonify({
                "mensaje": "No se encontraron destinos dentro del presupuesto.",
                "itinerario": {"destinos": [], "presupuesto_total": 0, "dias": duracion}
            })

        # Retornar el itinerario generado
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

# Registrar el blueprint
app.register_blueprint(places_bp)

if __name__ == '__main__':
    app.run(debug=True)
