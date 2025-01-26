import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Iconos personalizados
const defaultIcon = L.icon({
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const selectedIcon = L.icon({
    iconUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    iconSize: [30, 50],
    iconAnchor: [15, 50],
    popupAnchor: [1, -34],
    shadowSize: [50, 50],
});

L.Marker.prototype.options.icon = defaultIcon;

const MapComponent = ({onAddPlace, onAddToItinerary, selectedPlaces =[] }) => {
    const [places, setPlaces] = useState([]);

    // Hook para manejar clics en el mapa
    const MapClickHandler = () => {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                const newPlace = {
                    lat,
                    lng,
                    name: "Lugar Agregado Manualmente",
                    type: "Manual",
                };
                setPlaces((prevPlaces) => [...prevPlaces, newPlace]);
            },
        });
        return null;
    };

    useEffect(() => {
        const fetchPlaces = async () => {
            const response = await fetch("http://127.0.0.1:5000/places?lat=-34.6037&lng=-58.3816&radius=5000");
            const data = await response.json();
            setPlaces(data);
        };

        fetchPlaces();
    }, []);

    return (
        <MapContainer center={[-34.6037, -58.3816]} zoom={14} style={{ height: "400px", width: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler />
            {places.map((place, index) => (
                <Marker
                    key={index}
                    position={[place.lat, place.lng]}
                    icon={selectedPlaces.some(
                        (selected) => selected.lat === place.lat && selected.lng === place.lng
                    )
                        ? selectedIcon
                        : defaultIcon}
                >
                    <Popup>
                        <strong>{place.name}</strong>
                        <br />
                        Tipo: {place.type || "No especificado"}
                        <br />
                        {!selectedPlaces.some(
                            (selected) => selected.lat === place.lat && selected.lng === place.lng
                        ) && (
                            <button
                                className="btn btn-sm btn-primary mt-2"
                                onClick={() => onAddPlace(place)}
                            >x
                                Agregar al Itinerario
                            </button>
                        )}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;
