import React from "react";
import { Card, Button, Form } from "react-bootstrap";
import { FaFilter } from "react-icons/fa";
import Chatbot from "./Chatbot";


const getCategoryColor = (category) => {
    const categoryColors = {
        cines: "#FF4D4D", museos: "#4D79FF", arte: "#A64DFF", parques: "#4DFF88",
        cafes: "#A66A4D", restaurantes: "#FFA64D", bares: "#FFD700", hoteles: "#FFD700",
        centros_comerciales: "#808080", teatros: "#4D79FF", monumentos: "#FFD700",
        zoologicos: "#4DFF88", playas: "#4DA6FF", default: "#4DA6FF"
    };
    return categoryColors[category?.toLowerCase().trim()] || "#4DA6FF";
};

const Sidebar = ({ setShowModal, setCategoria, categoria, error, itinerario, setHighlightedPlace, highlightedPlace }) => {
    return (
        <div className="sidebar bg-light p-4" style={{ width: "500px", overflowY: "auto" }}>
            <h3 className="text-center text-primary">Tu Itinerario</h3>
            <div className="alert alert-info text-center">
                <h4>¿Cómo usar la app?</h4>
                <p>1. Presiona el botón "Generar Itinerario".</p>
                <p>2. Escribe un destino, intereses, presupuesto y duración de tu viaje.</p>
                <p>3. Presioná "Generar Itinerario" y explorá los lugares en el mapa.</p>
            </div>
            <Form.Group className="mb-3">
                <Form.Label><FaFilter /> Categoría</Form.Label>
                <Form.Select value={categoria} onChange={(e) => {        
                    console.log("Nueva categoría seleccionada:", e.target.value);
                    setCategoria(e.target.value);
                }}>
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
            <Chatbot />   
            <Button onClick={() => setShowModal(true)} variant="primary" className="w-100 mb-3">
                🎯 Generar Itinerario
            </Button>
            {error && <p className="alert alert-danger">{error}</p>}
            {itinerario && itinerario.dias.map((dia, index) => (
                <div key={index} className="mt-4">
                    <h4>🗓 Día {index + 1}</h4>
                    {Object.entries(dia).map(([momento, actividades]) => (
                        actividades.map((actividad, idx) => {
                            const cardColor = getCategoryColor(actividad.categoria);

                                         
                            return (
                                <Card 
                                    key={idx} 
                                    className="mb-3 shadow-sm"
                                    style={{ backgroundColor: highlightedPlace && highlightedPlace.nombre === actividad.nombre ? cardColor : "white", color: highlightedPlace && highlightedPlace.nombre === actividad.nombre ? "white" : "black", transition: "background-color 0.3s ease" }}
                                    onMouseEnter={() => setHighlightedPlace(actividad)}
                                    onMouseLeave={() => setHighlightedPlace(null)}
                                    onClick={() => setHighlightedPlace(actividad)}
                                    id={`card-${idx}`}
                                >
                                    <Card.Body>
                                        <Card.Title>🕒 {momento.toUpperCase()}</Card.Title>
                                        <p>📍 {actividad.nombre} - 💰 ${actividad.costo}</p>
                                    </Card.Body>
                                </Card>
                            );
                        }))
                    )}
                </div>
            ))}
        </div>
    );
};

export default Sidebar;