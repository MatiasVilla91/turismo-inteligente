import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    shadowSize: [41, 41]
});

// Componente para actualizar la vista del mapa
const ChangeView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([center.lat, center.lng], 14);
    }, [center, map]);
    return null;
};

// Componente para manejar clics en el mapa
const MapClickHandler = ({ setPlaces, onAddPlace }) => {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            const newPlace = { lat, lng, name: "Lugar Agregado Manualmente", categoria: "Manual" };
            setPlaces(prevPlaces => [...prevPlaces, newPlace]);
            if (onAddPlace) onAddPlace(newPlace);
        }
    });
    return null; 
};

const MapComponentFilter = ({ center, onAddPlace, selectedPlaces = [], onAddToItinerary, category }) => {
    const [places, setPlaces] = useState([]);
    const [filteredPlaces, setFilteredPlaces] = useState([]);

    // Fetch lugares desde el backend
    useEffect(() => {
        setPlaces([]);  // Limpia el estado antes de hacer la nueva solicitud
        const fetchPlaces = async () => {
            try {
                const response = await fetch(
                    `http://127.0.0.1:5000/places?lat=${center.lat}&lng=${center.lng}&radius=1000&category=${category}`
                );
                if (!response.ok) throw new Error(`Error ${response.status}`);
                const data = await response.json();

                console.log("✅ Lugares obtenidos del backend:", data);
                setPlaces(data);
            } catch (err) {
                console.error("❌ Error al obtener los lugares:", err);
                setPlaces([]);
            }
        };
        fetchPlaces();
    }, [center, category]);

    // Filtrar lugares según la categoría
    useEffect(() => {
        if (!category || places.length === 0) return;

        const normalizedCategory = category.toLowerCase().trim();
        console.log("📌 Categoría seleccionada:", category);
        console.log("📌 Categorías en los datos recibidos:", places.map(p => p.categoria));

        const filtrados = category === "all" 
            ? places 
            : places.filter(p => p.categoria?.toLowerCase().includes(normalizedCategory));

        console.log("🔄 Lugares filtrados:", filtrados);

        setFilteredPlaces([...filtrados]);  // Usamos spread operator para forzar el re-render
    }, [category, places]);

    return (
        <MapContainer key={category} center={[center.lat, center.lng]} zoom={14} style={{ height: "400px", width: "100%" }}>
            <ChangeView center={center} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
            <MapClickHandler setPlaces={setPlaces} onAddPlace={onAddPlace} />

            {filteredPlaces.map((place, index) => (
                <Marker key={`${place.lat}-${place.lng}-${index}-${category}`}  // Se agrega la categoría para forzar cambio
                position={[place.lat, place.lng]} 
                icon={defaultIcon}>
                    <Popup>
                        <strong>{place.name}</strong>
                        <br />
                        Categoría: {place.categoria || "No especificado"}
                        <br />
                        {!selectedPlaces.some(sel => sel.lat === place.lat && sel.lng === place.lng) && (
                            <button className="btn btn-sm btn-primary mt-2" onClick={() => onAddToItinerary(place)}>
                                Agregar al Itinerario
                            </button>
                        )}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponentFilter;
