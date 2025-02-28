import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const Chatbot = ({ setCoordenadas }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [userId, setUserId] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        let storedUserId = localStorage.getItem("user_id");

        if (!storedUserId) {
            storedUserId = "user_" + Math.random().toString(36).substring(7);
            localStorage.setItem("user_id", storedUserId);
        }

        setUserId(storedUserId);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: "user", text: input };
        setMessages(prevMessages => [...prevMessages.slice(-20), userMessage]); // Limitar historial

        setLoading(true);
        setInput(""); // Limpiar input antes de la respuesta

        try {
            const response = await axios.post("http://localhost:5000/chatbot", { 
                user_id: userId, 
                mensaje: input 
            });
            console.log("📡 Respuesta del backend:", response.data); // 🔍 DEBUG

            const botMessage = { sender: "bot", text: response.data.respuesta || "No entendí la consulta." };
            setMessages(prevMessages => [...prevMessages.slice(-20), botMessage]);
            if (Array.isArray(response.data.coordenadas) && response.data.coordenadas.length > 0) {
                const { lat, lon } = response.data.coordenadas[0]; 
            
                if (!isNaN(lat) && !isNaN(lon)) {  // Asegurar que las coordenadas son números válidos
                    console.log("📡 Coordenadas recibidas del backend:", lat, lon);
                    setCoordenadas({ lat: lat, lng: lon }); // Asegurar que "lng" es el valor correcto
                } else {
                    console.error("❌ Error: Coordenadas no son válidas:", response.data.coordenadas[0]);
                }
            } else {
                console.warn("⚠ No se recibieron coordenadas en la respuesta del chatbot.");
            }
            

        } catch (error) {
            console.error("❌ Error al enviar mensaje:", error);
            setMessages(prevMessages => [...prevMessages, { sender: "bot", text: "😓 Lo siento, hubo un error." }]);
        } finally {
            setLoading(false);
        }
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
                <div ref={messagesEndRef} />
            </div>

            <div className="chatbot-input">
                <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Escribe un mensaje..."
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    aria-label="Escribir mensaje"
                />
                <button onClick={sendMessage} disabled={!input.trim() || loading}>Enviar</button>
            </div>
        </div>
    );
};

export default Chatbot;
