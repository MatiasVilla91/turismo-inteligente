import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 🔥 Colores por categoría
const getCategoryColor = (category) => {
    const categoryColors = {
        cines: "red", museos: "blue", arte: "violet", parques: "green",
        cafes: "brown", restaurantes: "orange", bares: "yellow", hoteles: "gold",
        centros_comerciales: "grey", teatros: "blue", monumentos: "gold",
        zoologicos: "green", playas: "blue", default: "blue"
    };
    return categoryColors[category?.toLowerCase().trim()] || "blue";
};

// 🔥 Crear iconos personalizados
const createCustomIcon = (category, isHighlighted) => {
    const validCategory = category && typeof category === "string" ? category.toLowerCase().trim() : "default";
    const color = getCategoryColor(validCategory);
    let iconUrl = `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`;

    // Validar la URL del icono
    if (!color || !["blue", "gold", "red", "green", "orange", "yellow", "violet", "grey", "black"].includes(color)) {
        iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png";
    }
    if (isHighlighted) {
        iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png";
    }
    
    return L.icon({
        iconUrl,
        iconSize: [30, 48],
        iconAnchor: [15, 48],
        popupAnchor: [1, -34],
    });
};

// 🔥 Componente para actualizar la vista del mapa
const ChangeView = ({ center, places }) => {
    console.log("🔄 Nuevo centro del mapa:", center); 
    const map = useMap();

    useEffect(() => {
        console.log("📍 Recibido para mover mapa:", center); // Debug para ver qué coordenadas llegan
    
        if (center && typeof center.lat === "number" && typeof center.lng === "number") {
            if (places.length > 0) {
                const bounds = L.latLngBounds(places.map(p => [p.lat, p.lng]));
                map.fitBounds(bounds, { padding: [50, 50] }); // Ajusta el mapa para ver todos los marcadores
            } else {
                console.log("📍 Moviendo mapa a:", center.lat, center.lng);
                map.setView([center.lat, center.lng], 14, { animate: true }); // Cambiar flyTo por setView
            }
        } else {
            console.error("⚠ Error: Coordenadas inválidas en center:", center);
        }
    }, [center, places, map]);
    

    return null;
};

// 🔥 Componente principal del mapa
const MapComponent = ({ center, category }) => {
    const [places, setPlaces] = useState([]);

    useEffect(() => {
        const fetchPlaces = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5000/places?lat=${center.lat}&lng=${center.lng}&radius=1000`);
                if (!response.ok) throw new Error(`Error ${response.status}`);
                let data = await response.json();

                if (!Array.isArray(data)) {
                    console.error("❌ Error: la API no devolvió un array", data);
                    setPlaces([]);
                    return;
                }

                data = data.map(place => ({ ...place, categoria: place.categoria || "default" }));
                if (category !== "all") {
                    data = data.filter(place => place.categoria === category);
                }

                console.log("📍 Lugares procesados:", data);
                setPlaces(data);
            } catch (err) {
                console.error("❌ Error al obtener los lugares:", err);
                setPlaces([]);
            }
        };

        fetchPlaces();
    }, [center, category]);

    return (
        <MapContainer center={center?.lat && center?.lng ? [center.lat, center.lng] : [0, 0]} zoom={14} style={{ height: "400px", width: "100%" }}>
            <ChangeView center={center} places={places} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {places.map((place, index) => (
                <Marker
                    key={`${place.lat}-${place.lng}-${index}`}
                    position={[place.lat, place.lng]}
                    icon={createCustomIcon(place.categoria, false)}
                >
                    <Popup>
                        <strong>{place.name}</strong>
                        <br />
                        Categoría: {place.categoria || "No especificado"}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;
