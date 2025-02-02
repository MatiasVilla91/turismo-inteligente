from flask import Flask, request, jsonify
from flask_cors import CORS
from routes import register_blueprints
from data import destinos_disponibles
from services.itinerarios import generar_itinerario


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/')
def home():
    return "<h1>Backend funcionando correctamente</h1>"

@app.route('/itinerarios', methods=['POST'])
def itinerarios():
    datos_usuario = request.json
    resultado = generar_itinerario(datos_usuario)
    return jsonify(resultado)

# Registrar blueprints
def initialize_app():
    register_blueprints(app)

if __name__ == '__main__':
    initialize_app()
    app.run(debug=True)