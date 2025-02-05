import React from "react";
import MapComponentFilter from "./MapComponent";

const MapContainerWithFilter = ({ initialCenter, categoria, setCategoria, selectedPlaces }) => {
    if (!initialCenter) {
        console.error("❌ Error: initialCenter es undefined en MapContainerWithFilter");
        return <p>Error: No se pueden cargar los mapas.</p>;
    }

    const handleCategoryChange = (event) => {
        const nuevaCategoria = event.target.value;
        console.log("🔄 Nueva categoría seleccionada:", nuevaCategoria);
        setCategoria(nuevaCategoria);
    };

    return (
        <>
                <MapComponentFilter 
                key={categoria} 
                center={initialCenter} 
                category={categoria} 
                selectedPlaces={selectedPlaces} 
            />
        </>
    );
};

export default MapContainerWithFilter;
