import requests

def obtener_precio_wikidata(wikidata_id):
    url = f"https://www.wikidata.org/wiki/Special:EntityData/{wikidata_id}.json"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        entity = data.get("entities", {}).get(wikidata_id, {})
        claims = entity.get("claims", {})
        
        if "P2283" in claims:  # P2283 es "precio de entrada"
            precio = claims["P2283"][0]["mainsnak"]["datavalue"]["value"]["amount"]
            return float(precio)
    
    return "No disponible"
