import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap  } from "react-leaflet";
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

const categoryIcons = {
    cines: L.icon({
        iconUrl: "ruta_a_icono_cines.png", // Cambia a una ruta de icono adecuada
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    }),
    museos: L.icon({
        iconUrl: "ruta_a_icono_museos.png", // Cambia a una ruta de icono adecuada
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    }),
    arte: L.icon({
        iconUrl: "ruta_a_icono_arte.png", // Cambia a una ruta de icono adecuada
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    }),
    atracciones_turísticas: L.icon({
        iconUrl: "ruta_a_icono_atracciones.png", // Cambia a una ruta de icono adecuada
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    }),
    parques: L.icon({
        iconUrl: "ruta_a_icono_parques.png", // Cambia a una ruta de icono adecuada
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    }),
    default: defaultIcon, // Icono por defecto
};




// Componente para actualizar la vista del mapa
const ChangeView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([center.lat, center.lng], 14); // Ajusta el zoom según necesites
    }, [center, map]);
    return null;
};

const MapComponent = ({ center, onAddPlace, selectedPlaces = [],onAddToItinerary, category }) => {
    const [places, setPlaces] = useState([]);
    const [filteredPlaces, setFilteredPlaces] = useState([]); // Lugares filtrados
    const [selectedCategory, setSelectedCategory] = useState("all"); // Categoría seleccionada
    const handlePinClick = (e) => {
        // Remover la clase `selected` de todos los marcadores
        document.querySelectorAll(".leaflet-marker-icon").forEach((marker) => {
          marker.classList.remove("selected");
        });
    
        // Agregar la clase `selected` al marcador clickeado
        const markerElement = e.target.getElement(); // Obtener el elemento DOM del marcador
        markerElement.classList.add("selected");
      };
    
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
                if (onAddPlace) {
                    onAddPlace(newPlace); // Comunicamos el lugar al componente padre
                }
            },
        });
        return null;
    };

    useEffect(() => {
        const fetchPlaces = async () => {
            try {
                const response = await fetch(
                    `http://127.0.0.1:5000/places?lat=${center.lat}&lng=${center.lng}&radius=5000${category ? `&category=${category}` : ""}`
                
                );
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("Datos recibidos del backend:", data); // Debug
                    setPlaces(data);
                } else {
                    console.error("Error al obtener los lugares desde el backend.");
                }
            } catch (err) {
                console.error("Error al conectar con el backend:", err);
            }
        };



        fetchPlaces();
    }, [center]);

        // Filtrar lugares según la categoría seleccionada
    useEffect(() => {
        if (selectedCategory === "all") {
            setFilteredPlaces(places); // Mostrar todos los lugares si la categoría es "all"
        } else {
            setFilteredPlaces(places.filter((place) => place.categoria === selectedCategory));
        }
    }, [selectedCategory, places]);
    

    return (
            
        <MapContainer center={[center.lat, center.lng]} zoom={14} style={{ height: "400px", width: "100%" }}>
             <ChangeView center={center} />
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler />
                
                {filteredPlaces.map((place, index) => (
                
                <Marker
                key={index}
                position={[place.lat, place.lng]}
                eventHandlers={{
                    click: handlePinClick,
                  }}
                icon={
                    categoryIcons[place.categoria] || categoryIcons.default
                }
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
                            onClick={() => onAddToItinerary(place)}
                        >
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
