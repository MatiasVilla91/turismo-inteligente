import React, { useState, useEffect } from "react";
import MapComponent from "./MapComponent";
import "./index.css";
import { FaMapMarkerAlt, FaDollarSign, FaClock, FaSearch } from "react-icons/fa";
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

    // Cargar datos reales
    useEffect(() => {
        const fetchRealData = async () => {
            try {
                const response = await fetch("/real-data.json"); // Archivo JSON con datos reales
                if (!response.ok) {
                    throw new Error("Error al cargar los datos reales.");
                }
                const data = await response.json();
                setItinerario({ destinos: data, presupuesto_total: 0 });
            } catch (error) {
                console.error("Error al cargar los datos reales:", error);
            }
        };

        fetchRealData();
    }, []);

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

    return (
        <div className="d-flex flex-column" style={{ height: "100vh", overflow: "hidden" }}>
            <div className="d-flex flex-grow-1" style={{ overflow: "hidden" }}>
                {/* Panel Lateral */}
                <div className="sidebar bg-light p-4" style={{ width: "300px", overflowY: "auto" }}>
                    <h3 className="text-center">Tu Itinerario</h3>
                    {itinerario.destinos.length > 0 ? (
                        <div className="row">
                            {itinerario.destinos.map((destino, index) => (
                                <div key={index} className="col-12 mb-3">
                                    <div className="card shadow-sm h-100">
                                        <img 
                                            src={destino.imagen || "https://via.placeholder.com/300x200"} 
                                            alt={destino.nombre} 
                                            className="card-img-top"
                                            style={{ height: "150px", objectFit: "cover" }}
                                        />
                                        <div className="card-body">
                                            <h5 className="card-title">{destino.nombre}</h5>
                                            <p className="card-text text-muted">{destino.descripcion}</p>
                                            <p className="card-text">Costo: ${destino.costo}</p>
                                            <Button variant="primary" className="w-100">Ver más</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted">No hay destinos seleccionados aún.</p>
                    )}
                    <Button variant="primary" className="mt-3 w-100" onClick={() => setShowModal(true)}>
                        Generar Itinerario
                    </Button>
                </div>

                {/* Mapa Principal */}
                <div className="map-container flex-grow-1" style={{ height: "100%" }}>
                    <MapComponent
                        center={coordenadas}
                        selectedPlaces={selectedPlaces}
                    />
                </div>
            </div>


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