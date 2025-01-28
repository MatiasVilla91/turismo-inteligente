def generar_itinerario(datos_usuario, destinos_disponibles):
    intereses = datos_usuario.get("intereses", [])
    presupuesto = int(datos_usuario.get("presupuesto", 0))
    duracion = int(datos_usuario.get("duracion", 1))

    # Filtrar destinos según los intereses
    destinos_filtrados = [
        destino for destino in destinos_disponibles if destino["tipo"] in intereses
    ]

    # Si no hay destinos que coincidan con los intereses
    if not destinos_filtrados:
        return {
            "mensaje": "No hay destinos disponibles para los intereses seleccionados.",
            "itinerario": None
        }

    # Seleccionar destinos dentro del presupuesto
    destinos_seleccionados = []
    total_gastado = 0

    for destino in destinos_filtrados:
        if total_gastado + destino["costo"] <= presupuesto:
            destinos_seleccionados.append(destino)
            total_gastado += destino["costo"]

    # Si no se seleccionaron destinos, devolver un mensaje claro
    if not destinos_seleccionados:
        return {
            "mensaje": "No hay destinos disponibles dentro del presupuesto.",
            "itinerario": None
        }

    return {
        "mensaje": "Itinerario generado exitosamente",
        "itinerario": {
            "destinos": destinos_seleccionados,
            "presupuesto_total": total_gastado,
            "dias": duracion
        }
    }
