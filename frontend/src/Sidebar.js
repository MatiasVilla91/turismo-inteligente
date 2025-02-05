import React from "react";
import { Card, Button, Form } from "react-bootstrap";
import { FaFilter } from "react-icons/fa";

const Sidebar = ({ setShowModal, setCategoria, categoria, error, itinerario }) => {
    return (
        <div className="sidebar bg-light p-4" style={{ width: "300px", overflowY: "auto" }}>
            <h3 className="text-center text-primary">Tu Itinerario</h3>
            <div className="alert alert-info text-center">
                <h4>¿Cómo usar la app?</h4>
                <p>1. Presiona el botón "Generar Itinerario".</p>
                <p>2. Escribe un destino, intereses, presupuesto y duración de tu viaje.</p>
                <p>3. Presioná "Generar Itinerario" y explorá los lugares en el mapa.</p>
            </div>
            <Form.Group className="mb-3">
                <Form.Label><FaFilter /> Categoría</Form.Label>
                <Form.Select value={categoria} onChange={(e) => {        console.log("Nueva categoría seleccionada:", e.target.value);
                    setCategoria(e.target.value)}}>
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
    );
};

export default Sidebar;
