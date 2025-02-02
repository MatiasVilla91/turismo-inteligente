#LA VERSION ORIGINAL DE Home.JS

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
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("all");
    const [category, setCategory] = useState("");

    const getImageForPlace = (placeName) => {
        return `https://placehold.co/100x100?text=${encodeURIComponent(placeName)}`;
    };

    const handleSearchDestinoAndSubmit = async (e) => {
        e.preventDefault();
        if (!destino || !intereses || presupuesto <= 0 || duracion <= 0) {
            setError("Todos los campos son obligatorios.");
            return;
        }
        setError("");

        try {
            // Buscar el destino
            const responseDestino = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destino)}`
            );

            if (!responseDestino.ok) {
                throw new Error("Error en la solicitud a la API de Nominatim.");
            }

            const dataDestino = await responseDestino.json();
            if (dataDestino.length > 0) {
                const { lat, lon } = dataDestino[0];
                setCoordenadas({ lat: parseFloat(lat), lng: parseFloat(lon) });
            } else {
                setError("No se encontraron coordenadas para el destino ingresado.");
                return;
            }

            // Generar el itinerario
            const responseItinerario = await fetch("http://127.0.0.1:5000/itinerarios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ intereses, presupuesto, duracion, destino }),
            });

            if (!responseItinerario.ok) {
                throw new Error("Error al generar el itinerario.");
            }

            const dataItinerario = await responseItinerario.json();
            if (dataItinerario.itinerario) {
                setItinerario(dataItinerario.itinerario);
            } else {
                setError("No se pudo generar el itinerario. Intenta con otros parámetros.");
            }
        } catch (error) {
            setError("Ocurrió un error: " + error.message);
        }
    };

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

    const handleRemoveDestino = (index) => {
        const updatedDestinos = itinerario.destinos.filter((_, i) => i !== index);
        setItinerario({ ...itinerario, destinos: updatedDestinos });
    };

    return (
        <div className="d-flex flex-column" style={{ height: "100vh" }}>
            <div className="d-flex flex-grow-1" style={{ overflow: "hidden" }}>
                <div className="sidebar bg-light p-4" style={{ width: "300px", overflowY: "auto" }}>
                    <h3 className="text-center text-primary">Tu Itinerario</h3>
                    <div className="alert alert-info text-center">
                        <h4>¿Cómo usar la app?</h4>
                        <p>1. Ingresá un destino y presioná "Buscar destino".</p>
                        <p>2. Seleccioná tus intereses, presupuesto y duración.</p>
                        <p>3. Presioná "Generar Itinerario" y explorá los lugares en el mapa.</p>
                    </div>



                <div className="p-3">
    <label htmlFor="categoria" className="form-label">
        Seleccionar Categoría:
    </label>
    <select
        id="categoria"
        className="form-control"
        value={categoriaSeleccionada}
        onChange={(e) => {
            console.log("📌 Nueva categoría seleccionada:", e.target.value);
            setCategoriaSeleccionada(e.target.value);
        }}
    >
        <option value="all">Todas</option>
    <option value="cines">Cines</option>
    <option value="museos">Museos</option>
    <option value="arte">Arte</option>
    <option value="parques">Parques</option>
    <option value="restaurantes">Restaurantes</option>
    <option value="bares">bares</option>
    <option value="cafes">Cafés</option>
    <option value="teatros">Teatros</option>
    <option value="hoteles">Hoteles</option>
    <option value="monumentos">Monumentos</option>
    <option value="plazas">Plazas</option>
    <option value="centros_comerciales">Shopping</option>
    <option value="zoologicos">Zoologicos</option>
    <option value="playas">Playas</option>
    
    </select>
</div>



                    {itinerario.destinos.length > 0 ? (
                        <ul className="list-group">
                            {itinerario.destinos.map((destino, index) => (
                                <li key={index} className="list-group-item d-flex align-items-center" style={{ borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
                                    <img
                                        src={destino.imagen || `https://placehold.co/100x100?text=${encodeURIComponent(destino.name)}`}
                                        alt={destino.name || "Lugar"}
                                        className="img-thumbnail me-3"
                                        style={{
                                            width: "80px",
                                            height: "80px",
                                            objectFit: "cover",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <div className="flex-grow-1">
                                        <strong style={{ fontSize: "1.1rem", color: "#333" }}>
                                            {destino.name || "Sin nombre"}
                                        </strong>
                                        <p style={{ margin: "0", fontSize: "0.9rem", color: "#666" }}>
                                            {destino.description || "Sin descripción"}
                                        </p>
                                        <p
                                            style={{
                                                margin: "0.5rem 0 0",
                                                fontSize: "0.9rem",
                                                color: "#28a745",
                                            }}
                                        >
                                            Costo: ${destino.costo || 0}
                                        </p>
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

                <div className="map-container flex-grow-1" style={{ height: "200%" }}>
                    <MapComponent
                        center={coordenadas}
                        selectedPlaces={selectedPlaces}
                        onAddPlace={(place) => handleAddToItinerary(place)}
                        onAddToItinerary={handleAddToItinerary}
                        category={categoriaSeleccionada}
                    />
                </div>
            </div>

           
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Generar Itinerario</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleSearchDestinoAndSubmit}>
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
                            Buscar destino y generar itinerario
                        </button>
                    </form>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default Home;