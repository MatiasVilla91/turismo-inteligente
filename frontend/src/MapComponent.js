import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MapComponent = () => {
    const [places, setPlaces] = useState([]);

    useEffect(() => {
        // Obtener datos del backend
        const fetchPlaces = async () => {
            const response = await fetch("http://127.0.0.1:5000/places?lat=-34.6037&lng=-58.3816&radius=5000");
            const data = await response.json();
            setPlaces(data);
        };

        fetchPlaces();
    }, []);

    return (
        <MapContainer center={[-34.6037, -58.3816]} zoom={13} style={{ height: "400px", width: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {places.map((place, index) => (
                <Marker key={index} position={[place.lat, place.lng]}>
                    <Popup>
                        <strong>{place.name}</strong>
                        <br />
                        Tipo: {place.type}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;
