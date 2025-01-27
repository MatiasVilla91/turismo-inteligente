import React, { useState } from "react";
import MapComponent from "./MapComponent";
import "./index.css";
import { FaMapMarkerAlt, FaDollarSign, FaClock, FaSearch, FaTrash } from "react-icons/fa";
import { Modal, Button } from "react-bootstrap";

function Home() {
    const [destino, setDestino] = useState("");
    const [intereses, setIntereses] = useState("");
    const [presupuesto, setPresupuesto] = useState("");
    const [duracion, setDuracion] = useState("");
    const [itinerario, setItinerario] = useState({ destinos: [], presupuesto_total: 0 });
    const [selectedPlaces, setSelectedPlaces] = useState([]);
    const [coordenadas, setCoordenadas] = useState({ lat: -34.6037, lng: -58.3816 });
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);

    const handleSearchDestino = async () => {
        if (!destino) {
            setError("Por favor, ingresa un destino.");
            return;
        }
        setError("");

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destino)}`
            );

            if (!response.ok) {
                throw new Error("Error en la solicitud a la API de Nominatim.");
            }

            const data = await response.json();
            if (data.length > 0) {
                const { lat, lon } = data[0];
                setCoordenadas({ lat: parseFloat(lat), lng: parseFloat(lon) });
            } else {
                setError("No se encontraron coordenadas para el destino ingresado.");
            }
        } catch (err) {
            setError("Ocurrió un error al buscar el destino. Inténtalo de nuevo.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!intereses || presupuesto <= 0 || duracion <= 0 || !destino) {
            setError("Todos los campos son obligatorios.");
            return;
        }
        setError("");

        try {
            const response = await fetch("http://127.0.0.1:5000/itinerarios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ intereses, presupuesto, duracion, destino }),
            });

            if (!response.ok) {
                throw new Error("Error al generar el itinerario.");
            }

            const data = await response.json();
            if (data.itinerario) {
                setItinerario(data.itinerario);
            } else {
                setError("No se pudo generar el itinerario. Intenta con otros parámetros.");
            }
        } catch (error) {
            setError("Ocurrió un error al generar el itinerario: " + error.message);
        }
    };

    const handleAddToItinerary = (place) => {
        if (!itinerario.destinos.some((item) => item.lat === place.lat && item.lng === place.lng)) {
            setItinerario((prev) => ({
                ...prev,
                destinos: [...prev.destinos, place], // Agregar al array de destinos
            }));
        }
    };
    

    const handleRemoveDestino = (index) => {
        const updatedDestinos = itinerario.destinos.filter((_, i) => i !== index);
        setItinerario({ ...itinerario, destinos: updatedDestinos });
    };

    return (
        <div className="d-flex flex-column" style={{ height: "100vh" }}>
            <div className="d-flex flex-grow-1" style={{ overflow: "hidden" }}>
                {/* Panel Lateral */}
                <div className="sidebar bg-light p-4" style={{ width: "300px", overflowY: "auto" }}>
                    <h3 className="text-center">Tu Itinerario</h3>
                    {itinerario.destinos.length > 0 ? (
                        <ul className="list-group">
                            {itinerario.destinos.map((destino, index) => (
                                <li key={index} className="list-group-item d-flex align-items-center" style={{ borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
                                    <img 
                                        src={destino.imagen || "https://via.placeholder.com/50"} 
                                        alt={destino.nombre} 
                                        className="img-thumbnail me-3" 
                                        style={{ width: "50px", height: "50px", borderRadius: "8px" }}
                                    />
                                    <div className="flex-grow-1">
                                        <strong style={{ fontSize: "1.1rem", color: "#333" }}>{destino.nombre}</strong>
                                        <p style={{ margin: "0", fontSize: "0.9rem", color: "#666" }}>{destino.descripcion}</p>
                                        <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", color: "#28a745" }}>Costo: ${destino.costo}</p>
                                    </div>
                                    <button 
                                        className="btn btn-danger btn-sm" 
                                        style={{ marginLeft: "10px" }}
                                        onClick={() => handleRemoveDestino(index)}
                                    >
                                        <FaTrash />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted">No hay destinos seleccionados aún.</p>
                    )}
                    <Button variant="primary" className="mt-3 w-100" onClick={() => setShowModal(true)}>
                        Generar Itinerario
                    </Button>
                </div>

                {/* Mapa Principal */}
                <div className="map-container flex-grow-1" style={{ height: "200%" }}>
                    <MapComponent
                        center={coordenadas}
                        selectedPlaces={selectedPlaces}
                       // onAddPlace={(place) => handleAddToItinerary(place)}
                        onAddToItinerary={handleAddToItinerary}
                    />
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-dark text-white text-center py-2">
                <small>© 2025 Turismo Inteligente. Todos los derechos reservados.</small>
                <br />
                <small>contacto@turismointeligente.com | LinkedIn | GitHub</small>
            </footer>

            {/* Modal para el formulario */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Generar Itinerario</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleSubmit}>
                        {error && <p className="alert alert-danger">{error}</p>}

                        <div className="mb-3">
                            <label htmlFor="destino" className="form-label">
                                <FaMapMarkerAlt className="me-2 text-danger" /> Destino
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="destino"
                                value={destino}
                                onChange={(e) => setDestino(e.target.value)}
                                placeholder="Ej: Berlín, París, Tokio"
                            />
                            <button
                                type="button"
                                className="btn btn-secondary mt-2 w-100"
                                onClick={handleSearchDestino}
                            >
                                <FaSearch className="me-2" /> Buscar destino
                            </button>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="intereses" className="form-label">
                                <FaSearch className="me-2 text-success" /> Intereses
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="intereses"
                                value={intereses}
                                onChange={(e) => setIntereses(e.target.value)}
                                placeholder="Ej: cultura, aventura"
                            />
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="presupuesto" className="form-label">
                                    <FaDollarSign className="me-2 text-warning" /> Presupuesto
                                </label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="presupuesto"
                                    value={presupuesto}
                                    onChange={(e) => setPresupuesto(e.target.value)}
                                    placeholder="Ej: 1000"
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="duracion" className="form-label">
                                    <FaClock className="me-2 text-info" /> Duración (días)
                                </label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="duracion"
                                    value={duracion}
                                    onChange={(e) => setDuracion(e.target.value)}
                                    placeholder="Ej: 5"
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-100">
                            Generar Itinerario
                        </button>
                    </form>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default Home;
