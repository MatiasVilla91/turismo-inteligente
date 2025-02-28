@chatbot_bp.route('/feedback', methods=['POST'])
def feedback():
    """Registra feedback del usuario sobre la respuesta del chatbot."""
    data = request.json

    if not data or not all(key in data for key in ["user_id", "id_respuesta", "calificacion"]):
        return jsonify({"error": "Faltan datos en la solicitud. Se requiere 'user_id', 'id_respuesta' y 'calificacion'."})

    user_id = data["user_id"]
    id_respuesta = data["id_respuesta"]
    calificacion = data["calificacion"]  # Puede ser "👍" o "👎"

    if calificacion not in ["👍", "👎"]:
        return jsonify({"error": "La calificación debe ser '👍' o '👎'."})

    # Guardar feedback en la base de datos
    try:
        consultar_db(
            "INSERT INTO feedback (user_id, id_respuesta, calificacion) VALUES (%s, %s, %s)",
            (user_id, id_respuesta, calificacion)
        )
        return jsonify({"mensaje": "Gracias por tu feedback."})

    except Exception as e:
        print(f"Error guardando feedback: {e}")
        return jsonify({"error": "No se pudo guardar el feedback."})
