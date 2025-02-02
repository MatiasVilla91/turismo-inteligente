import requests
import random

def obtener_lugares_desde_overpass(ciudad, radio=5000):
    """Consulta Overpass API para obtener lugares turísticos y actividades."""
    query = f"""
        [out:json];
        (
            node["tourism"~"museum|artwork|monument|zoo|hotel|viewpoint|theme_park"](around:{radio},{ciudad["lat"]},{ciudad["lng"]});
            node["amenity"~"restaurant|cafe|bar|cinema|theatre"](around:{radio},{ciudad["lat"]},{ciudad["lng"]});
        );
        out;
    """
    url = f"https://overpass-api.de/api/interpreter?data={query}"
    response = requests.get(url)
    print("🔍 URL de Overpass API:", url)
    print("📩 Respuesta de Overpass API:", response.json())
    
    if response.status_code == 200:
        data = response.json()
        lugares = [
            {
                "nombre": lugar.get("tags", {}).get("name", "Sin Nombre"),
                "costo": random.randint(5, 30),  # Estimamos costos
                "tipo": lugar.get("tags", {}).get("tourism", lugar.get("tags", {}).get("amenity", "N/A"))
            }
            for lugar in data.get("elements", [])
        ]
        return lugares
    return []

def generar_itinerario(datos_usuario):
    ciudad = datos_usuario.get("ciudad") 
    if not ciudad or "lat" not in ciudad or "lng" not in ciudad:
        ciudad = {"lat": "-31.4201", "lng": "-64.1888"}# Córdoba por defecto
    presupuesto = int(datos_usuario.get("presupuesto", 0))
    duracion = int(datos_usuario.get("duracion", 1))
    
    lugares = obtener_lugares_desde_overpass(ciudad)
    if not lugares:
        return {"mensaje": "No se encontraron lugares disponibles.", "itinerario": None}
    
    lugares.sort(key=lambda x: x["costo"])  # Ordenamos por precio para ajustar al presupuesto
    
    itinerario = {"dias": []}
    total_gastado = 0
    comidas = ["Desayuno", "Almuerzo", "Cena"]
    comida_index = 0
    
    for dia in range(duracion):
        dia_actual = {"mañana": [], "mediodía": [], "tarde": [], "noche": []}
        presupuesto_dia = presupuesto // duracion
        destinos_dia = []
        
        while lugares and len(destinos_dia) < 3:  # Máximo 3 actividades por día
            destino = lugares[0]
            if total_gastado + destino["costo"] <= presupuesto_dia:
                destinos_dia.append(lugares.pop(0))
                total_gastado += destino["costo"]
            else:
                break
        
        if destinos_dia:
            dia_actual["mañana"] = [destinos_dia[0]]
        if len(destinos_dia) > 1:
            dia_actual["tarde"] = [destinos_dia[1]]
        if len(destinos_dia) > 2:
            dia_actual["noche"] = [destinos_dia[2]]
        
        dia_actual["mediodía"].append({
            "nombre": f"{comidas[comida_index]} recomendado",
            "costo": random.randint(5, 15),
            "tipo": "comida"
        })
        comida_index = (comida_index + 1) % 3
        
        itinerario["dias"].append(dia_actual)
    
    return {
        "mensaje": "Itinerario generado con datos en tiempo real",
        "itinerario": itinerario,
        "presupuesto_total": total_gastado
    }