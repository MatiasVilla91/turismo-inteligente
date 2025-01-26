import React, { useState } from "react";
import MapComponent from "./MapComponent"; // Importa el mapa


function Home() {
    const [intereses, setIntereses] = useState("");
    const [presupuesto, setPresupuesto] = useState("");
    const [duracion, setDuracion] = useState("");
    const [itinerario, setItinerario] = useState(null);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!intereses || !presupuesto || !duracion) {
            setError("Todos los campos son obligatorios.");
            return;
        }
        setError(""); // Limpiar error si todo está correcto

        const response = await fetch("http://127.0.0.1:5000/itinerarios", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ intereses, presupuesto, duracion }),
        });
        const data = await response.json();
        setItinerario(data.itinerario);
    };

    return (
        <div className="container mt-5">
            <h1 className="text-center text-primary mb-4">Generador de Itinerarios</h1>
            <form onSubmit={handleSubmit} className="mb-4">
                {error && <p className="alert alert-danger">{error}</p>}
                <div className="mb-3">
                    <label htmlFor="intereses" className="form-label">
                        Intereses
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
                <div className="mb-3">
                    <label htmlFor="presupuesto" className="form-label">
                        Presupuesto
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
                <div className="mb-3">
                    <label htmlFor="duracion" className="form-label">
                        Duración (días)
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
                <button type="submit" className="btn btn-primary w-100">
                    Generar Itinerario
                </button>
            </form>

            {itinerario && (
                <div className="row">
                    {itinerario.destinos.map((destino, index) => (
                        <div key={index} className="col-md-4 mb-4">
                            <div className="card shadow-sm">
                                <img
                                    src={`https://via.placeholder.com/300x200?text=${destino.nombre}`}
                                    className="card-img-top"
                                    alt={destino.nombre}
                                />
                                <div className="card-body">
                                    <h5 className="card-title">{destino.nombre}</h5>
                                    <p className="card-text">${destino.costo}</p>
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
             <div>
            <h1 className="text-center">Generador de Itinerarios</h1>
            <form onSubmit={handleSubmit}>
                {/* Formulario aquí */}
            </form>

            <div className="mt-5">
                <h2 className="text-center mb-4">Explora el Mapa</h2>
                <MapComponent  destinations={itinerario?.destinos || []}/>
            </div>
        </div>
        </div>
        
        
    );
}

export default Home;
