import React, { useEffect, useState } from "react";
import MapComponent from "./MapComponent";

const MapContainerWithFilter = ({ initialCenter, categoria, setCategoria, selectedPlaces }) => {
    const [mapCenter, setMapCenter] = useState(initialCenter);

    useEffect(() => {
        if (initialCenter) {
            console.log("📍 Cambiando centro del mapa a:", initialCenter);
            setMapCenter(initialCenter); // ✅ Se actualiza el centro cuando cambia initialCenter
        }
    }, [initialCenter]); // 🔹 Detecta cambios en initialCenter y actualiza el estado

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
