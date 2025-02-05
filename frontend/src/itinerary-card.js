import React from "react";
import { Card } from "react-bootstrap";

const ItineraryCard = ({ dia, index }) => {
    return (
        <div className="mt-4">
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
    );
};

export default ItineraryCard;
