import React, { useState } from "react";
import Home from "./Home";
import Navbar from "./Navbar";
import Footer from "./Footer";

function App() {
    const [itinerario, setItinerario] = useState([]);

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
