import React from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { FaMapMarkerAlt, FaSearch, FaDollarSign, FaClock } from "react-icons/fa";

const ItineraryModal = ({ showModal, setShowModal, handleSearchDestinoAndSubmit, destino, setDestino, intereses, setIntereses, presupuesto, setPresupuesto, duracion, setDuracion }) => {
    return (
        <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
                <Modal.Title>Generar Itinerario</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            <Form onSubmit={(e) => { e.preventDefault(); handleSearchDestinoAndSubmit(e); }}>
                    <Form.Group className="mb-3">
                        <Form.Label><FaMapMarkerAlt /> Destino</Form.Label>
                        <Form.Control type="text" value={destino} onChange={(e) => {
        console.log("✍️ Destino cambiado:", e.target.value); // Verifica que el estado cambia
        setDestino(e.target.value);
    }}  placeholder="Ej: Córdoba" />
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
    );
};

export default ItineraryModal;