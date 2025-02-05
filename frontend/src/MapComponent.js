import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const getCategoryColor = (category) => {
    if (!category) return "gray";

    const categoryColors = {
        cines: "red", museos: "blue", arte: "purple", parques: "green",
        cafes: "brown", restaurantes: "orange", bares: "yellow", hoteles: "pink",
        centros_comerciales: "gray", teatros: "cyan", monumentos: "gold",
        zoologicos: "lime", playas: "aqua"
    };

    return categoryColors[category.toLowerCase().trim()] || "gray";
};

const createCustomIcon = (category, isHighlighted) => {
    const color = getCategoryColor(category);
    return L.icon({
        iconUrl: isHighlighted
            ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png"
            : `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
        iconSize: [30, 48],
        iconAnchor: [15, 48],
        popupAnchor: [1, -34],
    });
};

const ChangeView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([center.lat, center.lng], 14);
    }, [center, map]);
    return null;
};

const MapComponentFilter = ({ center, category }) => {
    const [places, setPlaces] = useState([]);

    useEffect(() => {
        const fetchPlaces = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5000/places?lat=${center.lat}&lng=${center.lng}&radius=1000`);
                if (!response.ok) throw new Error(`Error ${response.status}`);
                let data = await response.json();
    
                console.log("📍 Lugares obtenidos de la API:", data); // Verifica que datos llegan
    
                // 🔹 Verifica que 'data' sea un array antes de filtrarlo
                if (!Array.isArray(data)) {
                    console.error("❌ Error: la API no devolvió un array", data);
                    setPlaces([]);
                    return;
                }
    
                // 🔹 Filtrar solo si la categoría no es "all"
                if (category !== "all") {
                    data = data.filter(place => {
                        if (!place.categoria || typeof place.categoria !== "string") {
                            console.warn("⚠️ Lugar sin categoría:", place);
                            return false; // Excluye lugares sin categoría
                        }
                        return place.categoria === category;
                    });
                }
    
                console.log("📍 Lugares filtrados:", data);
                setPlaces(data);
            } catch (err) {
                console.error("❌ Error al obtener los lugares:", err);
                setPlaces([]);
            }
        };
        fetchPlaces();
    }, [center, category]); // 🔥 Se actualiza cuando cambia la categoría

    console.log("📍 Lugares a mostrar en el mapa:", places);

    

    return (
        <MapContainer center={[center.lat, center.lng]} zoom={14} style={{ height: "400px", width: "100%" }}>
            <ChangeView center={center} />
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

export default MapComponentFilter;
