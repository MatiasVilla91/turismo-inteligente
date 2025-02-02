#UNA VERSION ALTERNATIVA DE Home.JS 

import React, { useState } from "react";
import MapComponent from "./MapComponent";
import { Card, Button, Modal, Form } from "react-bootstrap";
import { FaMapMarkerAlt, FaDollarSign, FaClock, FaSearch } from "react-icons/fa";

function Home() {
    const [itinerario, setItinerario] = useState(null);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [destino, setDestino] = useState("");
    const [presupuesto, setPresupuesto] = useState("");
    const [intereses, setIntereses] = useState("");
    const [duracion, setDuracion] = useState("");

    const handleGenerateItinerary = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/itinerarios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ destino, presupuesto, intereses, duracion })
            });

            if (!response.ok) throw new Error("Error al generar el itinerario");
            const data = await response.json();
            setItinerario(data.itinerario);
            setShowModal(false);
        } catch (err) {
            setError("No se pudo generar el itinerario. Inténtalo de nuevo");
        }
    };

    return (
        <div className="d-flex" style={{ height: "100vh" }}>
            {/* Barra lateral */}
            <div className="sidebar bg-light p-4" style={{ width: "300px", overflowY: "auto" }}>
                <h3 className="text-center text-primary">Tu Itinerario</h3>
                <Button onClick={() => setShowModal(true)} variant="primary" className="w-100 mb-3">
                    🎯 Generar Itinerario
                </Button>
                {error && <p className="alert alert-danger">{error}</p>}
                {itinerario && itinerario.dias.map((dia, index) => (
                    <div key={index} className="mt-4">
                        <h4>🗓 Día {index + 1}</h4>
                        {Object.entries(dia).map(([momento, actividades]) => (
                            <Card key={momento} className="mb-3">
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
                <MapComponent center={{ lat: -31.4201, lng: -64.1888 }} />
            </div>

            {/* Modal para generar itinerario */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Generar Itinerario</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
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
                        <Button variant="primary" className="w-100" onClick={handleGenerateItinerary}>Generar</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default Home;
