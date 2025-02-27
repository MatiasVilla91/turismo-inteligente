import React, { useEffect, useState } from "react";
import MapComponent from "./MapComponent";

const MapContainerWithFilter = ({ coordenadas, categoria, setCategoria, selectedPlaces }) => {
    // 🛠️ Asegurar que siempre haya coordenadas por defecto
    const defaultCoords = { lat: -31.4201, lng: -64.1888 };
    const [mapCenter, setMapCenter] = useState(coordenadas || defaultCoords);

    useEffect(() => {
        if (coordenadas && coordenadas.lat !== undefined && coordenadas.lng !== undefined) {
            console.log("📍 Actualizando centro del mapa a:", coordenadas);
            setMapCenter(coordenadas);
        } else {
            console.warn("⚠ `coordenadas` es undefined, usando valor por defecto:", defaultCoords);
            setMapCenter(defaultCoords);
        }
    }, [coordenadas]);

    const handleCategoryChange = (event) => {
        const nuevaCategoria = event.target.value;
        console.log("🔄 Nueva categoría seleccionada:", nuevaCategoria);
        setCategoria(nuevaCategoria);
    };

    return (
        <>
            <MapComponent 
                key={`${mapCenter.lat}-${mapCenter.lng}`} 
                center={mapCenter} 
                category={categoria} 
                selectedPlaces={selectedPlaces} 
            />
        </>
    );
};

export default MapContainerWithFilter;
