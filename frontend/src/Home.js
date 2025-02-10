import React, { useState } from "react";
import MapContainerWithFilter from "./MapContainerWithFilter";
import Sidebar from "./Sidebar";
import ItineraryModal from "./ItineraryModal";


function Home() {
    const [itinerario, setItinerario] = useState(null);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [destino, setDestino] = useState("");
    const [presupuesto, setPresupuesto] = useState("");
    const [intereses, setIntereses] = useState("");
    const [duracion, setDuracion] = useState("");
    const [categoria, setCategoria] = useState("all");
    const [coordenadas, setCoordenadas] = useState(null);
    const [selectedPlaces, setSelectedPlaces] = useState([]);
    const [highlightedPlace, setHighlightedPlace] = useState(null);



    const handleSearchDestinoAndSubmit = async (e) => {
        e.preventDefault();
        console.log("🚀 Botón presionado: Generando itinerario...", destino);
        if (!destino || !intereses || presupuesto <= 0 || duracion <= 0) {
            setError("Todos los campos son obligatorios.");
            return;
        }
        setError("");

        try {
            const responseDestino = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destino)}`
            );
            if (!responseDestino.ok) throw new Error("Error en la API de Nominatim.");
            


            const dataDestino = await responseDestino.json();
            console.log("📍 Respuesta de Nominatim:", dataDestino);

                

            if (dataDestino.length > 0) {
                const { lat, lon } = dataDestino[0];
                const newCoords = { lat: parseFloat(lat), lng: parseFloat(lon) };
                setCoordenadas(newCoords);
                


                 

                 


                const responseItinerario = await fetch("http://127.0.0.1:5000/itinerarios", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    
                    body: JSON.stringify({
                        ciudad: newCoords,
                        intereses,
                        presupuesto,
                        duracion,
                        //destino,
                        categoria
                    })
                });

                if (!responseItinerario.ok) throw new Error("Error al generar el itinerario.");

                const dataItinerario = await responseItinerario.json();
                console.log("📍 Respuesta del backend:", dataItinerario);

                if (dataItinerario?.itinerario?.destinos && Array.isArray(dataItinerario.itinerario.destinos)) {
                    setItinerario(dataItinerario.itinerario);
               // console.log("📌 Lugares seleccionados antes de setear:", selectedPlaces);
                                    
                
                                    const filteredPlaces = dataItinerario.itinerario.destinos.filter(place => 
                        categoria === "all" || (place.categoria && place.categoria === categoria)
                    );
                    setItinerario(dataItinerario.itinerario);
    
                    // 🔥 Forzar la actualización del estado
                    setSelectedPlaces([...filteredPlaces]);
                    
                } else {
                    console.error("❌ Error: `dataItinerario.itinerario.destinos` no está definido o no es un array.", dataItinerario);
                    setError("No se pudo generar el itinerario. Intenta con otros parámetros.");
                }
                
            } else {
                setError("No se encontraron coordenadas para el destino ingresado.");
            }
            } catch (error) {
            setError("Ocurrió un error: " + error.message);
            }
    };

    return (
        <div className="d-flex" style={{ height: "100vh" }}>
            <Sidebar setShowModal={setShowModal}
            setCategoria={setCategoria}
            categoria={categoria}
            error={error}
            itinerario={itinerario} 
            setHighlightedPlace={setHighlightedPlace }
            highlightedPlace={highlightedPlace}/>
            
        <div style={{ flex: 1, position: "relative" }}>
            <MapContainerWithFilter 
                key={coordenadas ? `${coordenadas.lat}-${coordenadas.lng}` : "default"} // Evita re-render innecesario
                initialCenter={coordenadas || { lat: -31.4201, lng: -64.1888 }} 
                categoria={categoria} 
                selectedPlaces={selectedPlaces}
                highlightedPlace={highlightedPlace}
                setHighlightedPlace={setHighlightedPlace} 
            />
        </div>
        
            <ItineraryModal 
                showModal={showModal} 
                setShowModal={setShowModal} 
                handleSearchDestinoAndSubmit={handleSearchDestinoAndSubmit} 
                destino={destino} setDestino={setDestino} 
                intereses={intereses} setIntereses={setIntereses} 
                presupuesto={presupuesto} setPresupuesto={setPresupuesto} 
                duracion={duracion} setDuracion={setDuracion} 

            />
           
        </div>
        
        
    );
}

export default Home;
