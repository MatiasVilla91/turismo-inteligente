import React, { useState } from "react";
import Home from "./Home";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MapContainerWithFilter from "./MapContainerWithFilter";

function App() {
    const [itinerario, setItinerario] = useState([]);
    const initialCenter = { lat: -31.4201, lng: -64.1888 }; // Córdoba como ejemplo

    const handleAddPlace = (place) => {
        setItinerario([...itinerario, place]);
    };

    const handleRemovePlace = (index) => {
        const updatedItinerario = itinerario.filter((_, i) => i !== index);
        setItinerario(updatedItinerario);
    };

    return (
        <div>
            <Navbar />
            <MapContainerWithFilter initialCenter={initialCenter}/>
            <Home 
                itinerario={itinerario}
                onAddPlace={handleAddPlace}
                onRemovePlace={handleRemovePlace}
            />
            <Footer />
            
        </div>
    );
}

export default App;
