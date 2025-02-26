import psycopg2
import os
from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Conectar a PostgreSQL
def conectar_db():
    return psycopg2.connect(DATABASE_URL)

# Crear la tabla si no existe
def inicializar_db():
    conn = conectar_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversaciones (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            mensaje TEXT,
            respuesta TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

# Guardar mensajes en la base de datos
def guardar_mensaje(user_id, mensaje, respuesta):
    try:
        conn = conectar_db()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO conversaciones (user_id, mensaje, respuesta) VALUES (%s, %s, %s)", (user_id, mensaje, respuesta))
        conn.commit()
        conn.close()
        print(f"✅ Mensaje guardado en PostgreSQL: {mensaje} → {respuesta}")
    except Exception as e:
        print(f"❌ ERROR al guardar en PostgreSQL: {e}")


# Obtener el historial de un usuario
def obtener_historial(user_id, limite=5):
    conn = conectar_db()
    cursor = conn.cursor()
    cursor.execute("SELECT mensaje, respuesta FROM conversaciones WHERE user_id = %s ORDER BY timestamp DESC LIMIT %s", (user_id, limite))
    historial = cursor.fetchall()
    conn.close()
    return [f"Usuario: {row[0]}\nChatbot: {row[1]}" for row in historial]

def consultar_db(query, params):
    """Ejecuta una consulta SQL en la base de datos."""
    try:
        conn = conectar_db()  # Asegúrate de que esta función esté definida
        cursor = conn.cursor()
        cursor.execute(query, params)
        result = cursor.fetchall()
        conn.close()
        return result
    except Exception as e:
        print(f"Error en la base de datos: {e}")
        return []


# Inicializar la base de datos
inicializar_db()
