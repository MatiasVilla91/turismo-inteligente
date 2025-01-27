import React, { useState } from "react";
import MapComponent from "./MapComponent";

function Home() {
    const [destino, setDestino] = useState(""); // Nuevo estado para el destino
    const [intereses, setIntereses] = useState("");
    const [presupuesto, setPresupuesto] = useState("");
    const [duracion, setDuracion] = useState("");
    const [itinerario, setItinerario] = useState({ destinos: [], presupuesto_total: 0 });
    const [selectedPlaces, setSelectedPlaces] = useState([]);
    const [coordenadas, setCoordenadas] = useState({ lat: -34.6037, lng: -58.3816 }); // Coordenadas iniciales
    const [error, setError] = useState("");

    const handleSearchDestino = async () => {
        if (!destino) {
            setError("Por favor, ingresa un destino.");
            return;
        }
        setError("");

        try {
            console.log(`Buscando coordenadas para: ${destino}`);
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destino)}`
        );

        if (!response.ok) {
            throw new Error("Error en la solicitud a la API de Nominatim.");
        }

        const data = await response.json();
        console.log("Respuesta de la API:", data);

        if (data.length > 0) {
            const { lat, lon } = data[0];
            console.log(`Coordenadas encontradas: ${lat}, ${lon}`);
            setCoordenadas({ lat: parseFloat(lat), lng: parseFloat(lon) });
        } else {
            setError("No se encontraron coordenadas para el destino ingresado.");
        }
    } catch (err) {
        console.error("Error al buscar el destino:", err);
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
        if (!selectedPlaces.some((p) => p.lat === place.lat && p.lng === place.lng)) {
            setSelectedPlaces([...selectedPlaces, place]);
            setItinerario((prev) => ({
                ...prev,
                destinos: [...(prev?.destinos || []), place],
            }));
        }
    };

    return (
        <div className="container mt-5">
            <h1 className="text-center text-primary mb-4">Generador de Itinerarios</h1>
            <form onSubmit={handleSubmit} className="mb-4">
                {error && <p className="alert alert-danger">{error}</p>}
                <div className="mb-3">
                    <label htmlFor="destino" className="form-label">Destino</label>
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
                        Buscar destino
                    </button>
                </div>
                <div className="mb-3">
                    <label htmlFor="intereses" className="form-label">Intereses</label>
                    <input
                        type="text"
                        className="form-control"
                        id="intereses"
                        value={intereses}
                        onChange={(e) => setIntereses(e.target.value)}
                        placeholder="Ej: cultura, aventura"
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="presupuesto" className="form-label">Presupuesto</label>
                    <input
                        type="number"
                        className="form-control"
                        id="presupuesto"
                        value={presupuesto}
                        onChange={(e) => setPresupuesto(e.target.value)}
                        placeholder="Ej: 1000"
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="duracion" className="form-label">Duración (días)</label>
                    <input
                        type="number"
                        className="form-control"
                        id="duracion"
                        value={duracion}
                        onChange={(e) => setDuracion(e.target.value)}
                        placeholder="Ej: 5"
                    />
                </div>
                <button type="submit" className="btn btn-primary w-100">Generar Itinerario</button>
            </form>

            {itinerario && itinerario.destinos.length > 0 && (
                <div className="row">
                    {itinerario.destinos.map((destino, index) => (
                        <div key={index} className="col-md-4 mb-4">
                            <div className="card shadow-sm">
                                <img
                                    src={`https://via.placeholder.com/300x200?text=${encodeURIComponent(destino.nombre)}`}
                                    className="card-img-top"
                                    alt={destino.nombre}
                                />
                                <div className="card-body">
                                    <h5 className="card-title">{destino.nombre}</h5>
                                    <p className="card-text">Costo: ${destino.costo}</p>
                                    <p className="card-text">Tipo: {destino.tipo}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="col-12">
                        <h3 className="text-center mt-4">
                            Presupuesto Total: ${itinerario.presupuesto_total}
                        </h3>
                    </div>
                </div>
            )}

            <div className="mt-5">
                <h2 className="text-center mb-4">Explora el Mapa</h2>
                <MapComponent center={coordenadas} onAddPlace={handleAddToItinerary} selectedPlaces={selectedPlaces} />
            </div>
        </div>
    );
}

export default Home;
