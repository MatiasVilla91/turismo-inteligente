import React, { useState, useEffect } from "react";
import MapComponent from "./MapComponent";
import { Card, Button, Modal, Form } from "react-bootstrap";
import { FaMapMarkerAlt, FaDollarSign, FaClock, FaSearch, FaFilter, FaTrash } from "react-icons/fa";

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
    
    
    const getCategoryColor = (category) => categoryColors[category] || categoryColors.default;
    

    const fetchPlaces = async (lat, lng) => {
        try {
            const response = await fetch(
                `http://127.0.0.1:5000/places?lat=${lat}&lng=${lng}&radius=1000&category=${categoria}`
            );
            if (!response.ok) throw new Error(`Error ${response.status}`);

            const data = await response.json();
            setSelectedPlaces(data);
            if (data.length > 0) setHighlightedPlace(data[0]);
        } catch (error) {
            console.error("❌ Error al obtener los lugares:", error);
        }
    }

    const handleSearchDestinoAndSubmit = async (e) => {
        e.preventDefault();
        if (!destino || !intereses || presupuesto <= 0 || duracion <= 0) {
            setError("Todos los campos son obligatorios.");
            return;
        }
        setError("");

        try {
            const responseDestino = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destino)}`
            );
            if (!responseDestino.ok) throw new Error("Error en la solicitud a la API de Nominatim.");
            
            const dataDestino = await responseDestino.json();
            if (dataDestino.length > 0) {
                const { lat, lon } = dataDestino[0];
                const newCoords = { lat: parseFloat(lat), lng: parseFloat(lon) };
                setCoordenadas(newCoords);
                
                fetchPlaces(newCoords.lat, newCoords.lng); // Buscar lugares después de actualizar coordenadas
                
                // Generar itinerario con las coordenadas correctas
                const responseItinerario = await fetch("http://127.0.0.1:5000/itinerarios", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ciudad: { lat: newCoords.lat, lng: newCoords.lng },  // 🔥 SE ARREGLA AQUÍ
                        intereses,
                        presupuesto,
                        duracion,
                        destino,
                        categoria
                    })
                });
                if (!responseItinerario.ok) throw new Error("Error al generar el itinerario.");

                const dataItinerario = await responseItinerario.json();
                if (dataItinerario.itinerario ) {
                   
                    setItinerario(dataItinerario.itinerario && dataItinerario.itinerario.destinos ? dataItinerario.itinerario : { destinos: [], presupuesto_total: 0 });
                    setItinerario(dataItinerario.itinerario);
                    setShowModal(false);
                    setSelectedPlaces([...selectedPlaces, ...dataItinerario.itinerario.destinos]);
                    setShowModal(false);
                } else {
                    setError("No se pudo generar el itinerario. Intenta con otros parámetros.");
                }
            } else {
                setError("No se encontraron coordenadas para el destino ingresado.");
            }
        } catch (error) {
            setError("Ocurrió un error: " + error.message);
        }
    };

    //Agregar al itinerario y obtener imagen 
    const handleAddToItinerary = (place) => {
        const newPlace = {
            ...place,
            imagen: getImageForPlace(place.name || "Lugar"),
        };
        console.log("Destino agregado:", newPlace);
        if (!itinerario.destinos.some((item) => item.lat === place.lat && item.lng === place.lng)) {
            setItinerario((prev) => ({
                ...prev,
                destinos: [...prev.destinos, newPlace],
            }));
        }
    };

    const getImageForPlace = (placeName) => {
        return `https://placehold.co/100x100?text=${encodeURIComponent(placeName)}`;
    };


    return (
        
        
        <div className="d-flex" style={{ height: "100vh" }}>
            {/* Barra lateral */}
            <div className="sidebar bg-light p-4" style={{ width: "300px", overflowY: "auto" }}>

                <h3 className="text-center text-primary">Tu Itinerario</h3>
                <div className="alert alert-info text-center">
                        <h4>¿Cómo usar la app?</h4>
                        <p>1. Presiona el boton "Generar Itinerario".</p>
                        <p>2. Escribe un destino, intereses, presupuesto y duración de tu viaje.</p>
                        <p>3. Presioná "Generar Itinerario" y explorá los lugares en el mapa.</p>
                    </div>
                <Form.Group className="mb-3">
                    <Form.Label><FaFilter /> Categoría</Form.Label>
                    <Form.Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                        <option value="all">Todos</option>
                        <option value="cines">Cines</option>
                        <option value="museos">Museos</option>
                        <option value="arte">Arte</option>
                        <option value="parques">Parques</option>
                        <option value="cafes">Cafés</option>
                        <option value="restaurantes">Restaurantes</option>
                        <option value="bares">Bares</option>
                        <option value="hoteles">Hoteles</option>
                        <option value="centros_comerciales">Shopping</option>
                        <option value="teatros">Teatros</option>
                        <option value="monumentos">Monumentos</option>
                        <option value="zoologicos">Zoológicos</option>
                        <option value="playas">Playas</option>
                    </Form.Select>
                </Form.Group>
                <Button onClick={() => setShowModal(true)} variant="primary" className="w-100 mb-3">
                    🎯 Generar Itinerario
                </Button>
                {error && <p className="alert alert-danger">{error}</p>}
                {itinerario && itinerario.dias.map((dia, index) => (
                    <div key={index} className="mt-4">
                        <h4>🗓 Día {index + 1}</h4>
                        {Object.entries(dia).map(([momento, actividades]) => (
                            <Card key={momento} className="mb-3 shadow-sm">
                                <Card.Body>
                                    <Card.Title>🕒 {momento.toUpperCase()}</Card.Title>
                                    {actividades.length > 0 ? (
                                        actividades.map((actividad, idx) => (
                                            <p key={idx}>📍 {actividad.nombre} - 💰 ${actividad.costo}</p>
                                        ))
                                    ) : (
                                        <p>⏳ Sin actividades programadas</p>
                                    )}
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                ))}
            </div>

            {/* Mapa */}
            <div className="flex-grow-1">
            <MapComponent center={coordenadas || { lat: -31.4201, lng: -64.1888 }}
            selectedPlaces={selectedPlaces}
            category={categoria}
            highlightedPlace={highlightedPlace}
            onAddToItinerary={handleAddToItinerary}
            itinerario={itinerario}
            />
            </div>

            {/* Modal para generar itinerario */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Generar Itinerario</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSearchDestinoAndSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label><FaMapMarkerAlt /> Destino</Form.Label>
                            <Form.Control type="text" value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Ej: Córdoba" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label><FaSearch /> Intereses</Form.Label>
                            <Form.Control type="text" value={intereses} onChange={(e) => setIntereses(e.target.value)} placeholder="Ej: cultura, aventura" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label><FaDollarSign /> Presupuesto</Form.Label>
                            <Form.Control type="number" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)} placeholder="Ej: 100" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label><FaClock /> Duración (días)</Form.Label>
                            <Form.Control type="number" value={duracion} onChange={(e) => setDuracion(e.target.value)} placeholder="Ej: 3" />
                        </Form.Group>
                        <Button variant="primary" className="w-100" type="submit">Buscar y Generar</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default Home;
