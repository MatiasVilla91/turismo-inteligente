from flask import Blueprint, request, jsonify
from database import conectar_db
import bcrypt

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    nombre = data.get("nombre")
    email = data.get("email")
    password = data.get("password")

    if not (nombre and email and password):
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    # Hashear la contraseña antes de guardarla
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    try:
        conn = conectar_db()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO usuarios (nombre, email, password) VALUES (%s, %s, %s) RETURNING id", 
                       (nombre, email, hashed_password))
        user_id = cursor.fetchone()[0]
        conn.commit()
        conn.close()

        return jsonify({"message": "Usuario registrado", "user_id": user_id})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not (email and password):
        return jsonify({"error": "Email y contraseña son obligatorios"}), 400

    try:
        conn = conectar_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, password FROM usuarios WHERE email = %s", (email,))
        usuario = cursor.fetchone()
        conn.close()

        if usuario and bcrypt.checkpw(password.encode('utf-8'), usuario[1].encode('utf-8')):
            return jsonify({"message": "Inicio de sesión exitoso", "user_id": usuario[0]})
        else:
            return jsonify({"error": "Email o contraseña incorrectos"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500
