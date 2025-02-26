import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const Chatbot = ({ setCoordenadas }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [userId, setUserId] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null); // Para hacer scroll automático

    // Obtener user_id de localStorage al cargar el componente
    useEffect(() => {
        let storedUserId = localStorage.getItem("user_id");

        if (!storedUserId) {
            storedUserId = "user_" + Math.random().toString(36).substring(7); // Generar un ID aleatorio
            localStorage.setItem("user_id", storedUserId);
        }

        setUserId(storedUserId);
    }, []);

    // Función para hacer scroll automático al final del chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: "user", text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput(""); // Limpiar input inmediatamente
        setLoading(true); // Mostrar indicador de carga

        try {
            const response = await axios.post("http://localhost:5000/chatbot", { 
                user_id: userId, 
                mensaje: input 
            });

            const botMessage = { sender: "bot", text: response.data.respuesta };
            setMessages((prev) => [...prev, botMessage]);

            // 🚀 Si el chatbot devuelve coordenadas, las pasamos al mapa
            if (response.data.coordenadas.length > 0) {
                const newCenter = response.data.coordenadas[0];
                setCoordenadas(newCenter);
            }

        } catch (error) {
            console.error("❌ Error al enviar mensaje:", error);
            setMessages((prev) => [...prev, { sender: "bot", text: "⚠️ Error en el servidor. Inténtalo de nuevo." }]);
        }

        setLoading(false); // Ocultar indicador de carga
    };

    return (
        <div className="chatbot-container">
            <div className="chatbot-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                        {msg.text}
                    </div>
                ))}
                {loading && <div className="message bot">⏳ Pensando...</div>}
                <div ref={messagesEndRef} /> {/* Punto de scroll automático */}
            </div>

            <div className="chatbot-input">
                <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Escribe un mensaje..."
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button onClick={sendMessage} disabled={loading}>Enviar</button>
            </div>
        </div>
    );
};

export default Chatbot;
