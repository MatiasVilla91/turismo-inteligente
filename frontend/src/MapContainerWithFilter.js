import React, { useState } from "react";
import MapComponentFilter from "./MapComponent"; // Asegúrate de que la ruta sea correcta

const MapContainerWithFilter = ({ initialCenter }) => {
    const [category, setCategory] = useState("all"); // Estado para la categoría seleccionada

    const handleCategoryChange = (event) => {
        const nuevaCategoria = event.target.value;
        console.log("🔄 Nueva categoría seleccionada:", nuevaCategoria);
        setCategory(nuevaCategoria);
    };

    return (
        
            <MapComponentFilter  key={category} center={initialCenter} category={category}  />
       
    );
};

export default MapContainerWithFilter;
